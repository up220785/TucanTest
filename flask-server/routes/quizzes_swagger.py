from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Quiz, Course, Question, Option, QuizSubmission, Answer, Notification, Enrollment
from datetime import datetime
from auth import require_teacher, require_student, require_auth

# Create namespace for quizzes
quizzes_ns = Namespace('quizzes', description='Quiz management operations')

# Define models for Swagger documentation
quiz_model = quizzes_ns.model('Quiz', {
    'id': fields.Integer(description='Quiz ID'),
    'title': fields.String(description='Quiz title'),
    'description': fields.String(description='Quiz description'),
    'course_id': fields.Integer(description='Course ID'),
    'course_name': fields.String(description='Course name'),
    'is_published': fields.Boolean(description='Whether quiz is published'),
    'due_date': fields.DateTime(description='Quiz due date'),
    'created_at': fields.DateTime(description='Quiz creation date'),
    'question_count': fields.Integer(description='Number of questions'),
    'total_points': fields.Float(description='Total possible points')
})

quiz_create = quizzes_ns.model('QuizCreate', {
    'title': fields.String(required=True, description='Quiz title', example='Python Basics Quiz'),
    'description': fields.String(required=True, description='Quiz description', example='Test your knowledge of Python fundamentals'),
    'course_id': fields.Integer(required=True, description='Course ID', example=1),
    'due_date': fields.String(description='Due date (ISO format)', example='2025-12-31T23:59:59'),
    'is_published': fields.Boolean(description='Whether quiz is published', default=False)
})

quiz_update = quizzes_ns.model('QuizUpdate', {
    'title': fields.String(description='Quiz title'),
    'description': fields.String(description='Quiz description'),
    'is_published': fields.Boolean(description='Whether quiz is published'),
    'due_date': fields.String(description='Due date (ISO format)')
})

course_quiz_create = quizzes_ns.model('CourseQuizCreate', {
    'title': fields.String(required=True, description='Quiz title', example='Python Basics Quiz'),
    'description': fields.String(required=True, description='Quiz description', example='Test your knowledge of Python fundamentals'),
    'due_date': fields.String(description='Due date (ISO format)', example='2025-12-31T23:59:59'),
    'is_published': fields.Boolean(description='Whether quiz is published', default=False)
})

submission_model = quizzes_ns.model('QuizSubmission', {
    'id': fields.Integer(description='Submission ID'),
    'quiz_id': fields.Integer(description='Quiz ID'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'started_at': fields.DateTime(description='Submission start time'),
    'completed_at': fields.DateTime(description='Submission completion time'),
    'is_completed': fields.Boolean(description='Whether submission is completed'),
    'is_graded': fields.Boolean(description='Whether submission is graded'),
    'total_score': fields.Float(description='Total score achieved'),
    'max_possible_score': fields.Float(description='Maximum possible score'),
    'percentage': fields.Float(description='Score percentage'),
    'attempt_number': fields.Integer(description='Attempt number'),
    'graded_by': fields.Integer(description='Grader user ID'),
    'graded_at': fields.DateTime(description='Grading completion time')
})

@quizzes_ns.route('/')
class QuizListAPI(Resource):
    @quizzes_ns.doc('get_all_quizzes', security='Bearer')
    @quizzes_ns.marshal_list_with(quiz_model)
    @quizzes_ns.param('course_id', 'Filter by course ID', type='integer')
    @quizzes_ns.param('published_only', 'Filter to show only published quizzes', type='boolean', default=False)
    @quizzes_ns.response(401, 'Authentication required')
    @require_auth
    def get(self, current_user=None):
        """Get all quizzes"""
        try:
            query = Quiz.query
            
            # Apply filters
            course_id = request.args.get('course_id', type=int)
            
            if course_id:
                query = query.filter_by(course_id=course_id)
            
            # For students: ALWAYS filter to only published quizzes regardless of parameter
            # For teachers: respect the published_only parameter (default false shows all)
            if current_user and current_user.role == 'student':
                # Students can ONLY see published quizzes
                query = query.filter_by(is_published=True)
            else:
                # Teachers can see all quizzes or filter by published_only parameter
                published_only = request.args.get('published_only', 'false').lower() == 'true'
                if published_only:
                    query = query.filter_by(is_published=True)
            
            quizzes = query.all()
            
            quiz_list = []
            for quiz in quizzes:
                quiz_data = {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'course_id': quiz.course_id,
                    'course_name': quiz.course.name,
                    'is_published': quiz.is_published,
                    'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                    'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                    'question_count': len(quiz.questions),
                    'total_points': quiz.get_total_points()
                }
                quiz_list.append(quiz_data)
            
            return quiz_list
            
        except Exception as e:
            quizzes_ns.abort(500, str(e))

    @quizzes_ns.doc('create_quiz', security='Bearer')
    @quizzes_ns.expect(quiz_create)
    @quizzes_ns.marshal_with(quiz_model, code=201)
    @quizzes_ns.response(400, 'Validation error')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Teacher access required')
    @require_teacher
    def post(self, current_user=None):
        """Create a new quiz"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['title', 'description', 'course_id']
            for field in required_fields:
                if field not in data or not data[field]:
                    quizzes_ns.abort(400, f'{field} is required')
            
            # Validate course exists
            course = Course.query.get_or_404(data['course_id'])
            
            # Parse due date if provided
            due_date = None
            if data.get('due_date'):
                try:
                    due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    quizzes_ns.abort(400, 'Invalid due_date format')
            
            # Create quiz
            current_time = datetime.utcnow()
            quiz = Quiz(
                title=data['title'],
                description=data['description'],
                course_id=data['course_id'],
                due_date=due_date,
                is_published=data.get('is_published', False),
                created_at=current_time,
            )
            
            db.session.add(quiz)
            db.session.commit()
            
            return {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'course_id': quiz.course_id,
                'course_name': quiz.course.name,
                'is_published': quiz.is_published,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'question_count': 0,
                'total_points': 0
            }, 201
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))

@quizzes_ns.route('/<int:quiz_id>')
class QuizAPI(Resource):
    @quizzes_ns.doc('get_quiz')
    @quizzes_ns.marshal_with(quiz_model)
    @quizzes_ns.response(404, 'Quiz not found')
    def get(self, quiz_id):
        """Get a specific quiz"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            return {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'course_id': quiz.course_id,
                'course_name': quiz.course.name,
                'is_published': quiz.is_published,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'question_count': len(quiz.questions),
                'total_points': quiz.get_total_points()
            }
            
        except Exception as e:
            quizzes_ns.abort(404, 'Quiz not found')

    @quizzes_ns.doc('update_quiz', security='Bearer')
    @quizzes_ns.expect(quiz_update)
    @quizzes_ns.marshal_with(quiz_model)
    @quizzes_ns.response(404, 'Quiz not found')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Teacher access required')
    @require_teacher
    def put(self, quiz_id, current_user=None):
        """Update quiz details"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            data = request.get_json()
            
            # Update allowed fields
            if 'title' in data and data['title']:
                quiz.title = data['title']
            
            if 'description' in data and data['description']:
                quiz.description = data['description']
            
            if 'is_published' in data:
                quiz.is_published = data['is_published']
            
            if 'due_date' in data:
                if data['due_date']:
                    try:
                        quiz.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                    except ValueError:
                        quizzes_ns.abort(400, 'Invalid due_date format')
                else:
                    quiz.due_date = None
            
            db.session.commit()
            
            return {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'course_id': quiz.course_id,
                'course_name': quiz.course.name,
                'is_published': quiz.is_published,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'question_count': len(quiz.questions),
                'total_points': quiz.get_total_points()
            }
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))

    @quizzes_ns.doc('delete_quiz', security='Bearer')
    @quizzes_ns.response(200, 'Quiz deleted successfully')
    @quizzes_ns.response(404, 'Quiz not found')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Teacher access required')
    @require_teacher
    def delete(self, quiz_id, current_user=None):
        """Delete a quiz"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            db.session.delete(quiz)
            db.session.commit()
            
            return {'message': 'Quiz deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))

@quizzes_ns.route('/<int:quiz_id>/start')
class QuizStartAPI(Resource):
    @quizzes_ns.doc('start_quiz', security='Bearer')
    @quizzes_ns.expect(quizzes_ns.model('StartQuiz', {
        'student_id': fields.Integer(required=True, description='Student ID', example=1)
    }))
    @quizzes_ns.marshal_with(submission_model, code=201)
    @quizzes_ns.response(400, 'Quiz cannot be started')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Student access required')
    @require_student
    def post(self, quiz_id, current_user=None):
        """Start a quiz attempt"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            data = request.get_json()
            
            if 'student_id' not in data:
                quizzes_ns.abort(400, 'student_id is required')
            
            student_id = data['student_id']
            
            # Check if quiz is published
            if not quiz.is_published:
                quizzes_ns.abort(400, 'Quiz is not published yet')
            
            # Check due date
            if quiz.due_date and datetime.utcnow() > quiz.due_date:
                quizzes_ns.abort(400, 'Quiz due date has passed')
            
            # Check attempt limit - for now we'll allow unlimited attempts
            # (This can be implemented later if max_attempts field is added to Quiz model)
            existing_attempts = QuizSubmission.query.filter_by(
                quiz_id=quiz_id,
                student_id=student_id
            ).count()
            
            # Future: if quiz.max_attempts and existing_attempts >= quiz.max_attempts:
            #     quizzes_ns.abort(400, 'Maximum attempts reached')
            
            # Check if there's an ongoing submission
            ongoing_submission = QuizSubmission.query.filter_by(
                quiz_id=quiz_id,
                student_id=student_id,
                is_completed=False
            ).first()
            
            if ongoing_submission:
                quizzes_ns.abort(400, 'Quiz already in progress')
            
            # Create new submission
            submission = QuizSubmission(
                quiz_id=quiz_id,
                student_id=student_id,
                attempt_number=existing_attempts + 1
            )
            
            db.session.add(submission)
            db.session.commit()
            
            return {
                'id': submission.id,
                'quiz_id': submission.quiz_id,
                'student_id': submission.student_id,
                'student_name': submission.student.name,
                'started_at': submission.started_at.isoformat() if submission.started_at else None,
                'completed_at': submission.completed_at.isoformat() if submission.completed_at else None,
                'is_completed': submission.is_completed,
                'is_graded': submission.is_graded,
                'total_score': submission.total_score,
                'max_possible_score': submission.max_possible_score,
                'percentage': submission.get_percentage() if submission.is_graded else None,
                'attempt_number': submission.attempt_number,
                'graded_by': submission.graded_by,
                'graded_at': submission.graded_at.isoformat() if submission.graded_at else None
            }, 201
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))

@quizzes_ns.route('/<int:quiz_id>/submissions')
class QuizSubmissionsAPI(Resource):
    @quizzes_ns.doc('get_quiz_submissions', security='Bearer')
    @quizzes_ns.marshal_list_with(submission_model)
    @quizzes_ns.response(404, 'Quiz not found')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Teacher access required')
    @quizzes_ns.param('student_id', 'Filter by student ID', type='integer')
    @quizzes_ns.param('completed_only', 'Show only completed submissions', type='boolean', default=False)
    @require_teacher
    def get(self, quiz_id, current_user=None):
        """Get all submissions for a quiz"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            query = QuizSubmission.query.filter_by(quiz_id=quiz_id)
            
            # Apply filters
            student_id = request.args.get('student_id', type=int)
            completed_only = request.args.get('completed_only', 'false').lower() == 'true'
            
            if student_id:
                query = query.filter_by(student_id=student_id)
            
            if completed_only:
                query = query.filter_by(is_completed=True)
            
            submissions = query.all()
            
            submission_list = []
            for submission in submissions:
                submission_data = {
                    'id': submission.id,
                    'quiz_id': submission.quiz_id,
                    'student_id': submission.student_id,
                    'student_name': submission.student.name,
                    'started_at': submission.started_at.isoformat() if submission.started_at else None,
                    'completed_at': submission.completed_at.isoformat() if submission.completed_at else None,
                    'is_completed': submission.is_completed,
                    'is_graded': submission.is_graded,
                    'total_score': submission.total_score,
                    'max_possible_score': submission.max_possible_score,
                    'percentage': submission.get_percentage() if submission.is_graded else None,
                    'attempt_number': submission.attempt_number,
                    'graded_by': submission.graded_by,
                    'graded_at': submission.graded_at.isoformat() if submission.graded_at else None
                }
                submission_list.append(submission_data)
            
            return submission_list
            
        except Exception as e:
            quizzes_ns.abort(500, str(e))

@quizzes_ns.route('/courses/<int:course_id>/quizzes')
class CourseQuizzesAPI(Resource):
    @quizzes_ns.doc('get_course_quizzes', security='Bearer')
    @quizzes_ns.marshal_list_with(quiz_model)
    @quizzes_ns.response(404, 'Course not found')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.param('published_only', 'Show only published quizzes', type='boolean', default=False)
    @require_auth
    def get(self, course_id, current_user=None):
        """Get all quizzes for a specific course"""
        try:
            course = Course.query.get_or_404(course_id)
            
            query = Quiz.query.filter_by(course_id=course_id)
            
            # For students: ALWAYS filter to only published quizzes regardless of parameter
            # For teachers: respect the published_only parameter (default false shows all)
            if current_user and current_user.role == 'student':
                # Students can ONLY see published quizzes
                query = query.filter_by(is_published=True)
            else:
                # Teachers can see all quizzes or filter by published_only parameter
                published_only = request.args.get('published_only', 'false').lower() == 'true'
                if published_only:
                    query = query.filter_by(is_published=True)
            
            quizzes = query.all()
            
            quiz_list = []
            for quiz in quizzes:
                quiz_data = {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'course_id': quiz.course_id,
                    'course_name': quiz.course.name,
                    'is_published': quiz.is_published,
                    'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                    'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                    'question_count': len(quiz.questions),
                    'total_points': quiz.get_total_points()
                }
                quiz_list.append(quiz_data)
            
            return quiz_list
            
        except Exception as e:
            quizzes_ns.abort(500, str(e))

    @quizzes_ns.doc('create_course_quiz', security='Bearer')
    @quizzes_ns.expect(course_quiz_create)
    @quizzes_ns.marshal_with(quiz_model, code=201)
    @quizzes_ns.response(400, 'Validation error')
    @quizzes_ns.response(404, 'Course not found')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Teacher access required')
    @require_teacher
    def post(self, course_id, current_user=None):
        """Create a new quiz for a specific course"""
        try:
            course = Course.query.get_or_404(course_id)
            data = request.get_json()
            
            # Validate required fields (course_id not needed since it's from URL)
            required_fields = ['title', 'description']
            for field in required_fields:
                if field not in data or not data[field]:
                    quizzes_ns.abort(400, f'{field} is required')
            
            # Parse due date if provided
            due_date = None
            if data.get('due_date'):
                try:
                    # Handle different date formats
                    due_date_str = data['due_date']
                    if 'T' in due_date_str:
                        # HTML datetime-local format
                        due_date = datetime.fromisoformat(due_date_str)
                    else:
                        quizzes_ns.abort(400, 'Invalid due_date format')
                except ValueError:
                    quizzes_ns.abort(400, 'Invalid due_date format')
            
            # Create quiz
            current_time = datetime.utcnow()
            quiz = Quiz(
                course_id=course_id,  # Use course_id from URL
                title=data['title'],
                description=data['description'],
                due_date=due_date,
                is_published=data.get('is_published', False),
                created_at=current_time
            )
            
            db.session.add(quiz)
            db.session.flush()  # Flush to get quiz.id before creating questions
            
            # Handle questions if provided
            questions_data = data.get('questions', [])
            total_points = 0
            
            for question_data in questions_data:
                if not question_data.get('text', '').strip():
                    quizzes_ns.abort(400, 'Question text is required')
                
                question = Question(
                    quiz_id=quiz.id,
                    text=question_data['text'],
                    question_type=question_data.get('question_type', 'multiple_choice'),
                    points=question_data.get('points', 1),
                    order=question_data.get('order', 1)
                )
                
                db.session.add(question)
                db.session.flush()  # Flush to get question.id before creating options
                total_points += question.points
                
                # Handle options for multiple choice questions
                if question.question_type == 'multiple_choice':
                    options_data = question_data.get('options', [])
                    if len(options_data) < 2:
                        quizzes_ns.abort(400, 'Multiple choice questions must have at least 2 options')
                    
                    correct_count = 0
                    for option_data in options_data:
                        if not option_data.get('text', '').strip():
                            quizzes_ns.abort(400, 'Option text is required')
                        
                        option = Option(
                            question_id=question.id,
                            text=option_data['text'],
                            is_correct=option_data.get('is_correct', False),
                            order=option_data.get('order', 1)
                        )
                        
                        if option.is_correct:
                            correct_count += 1
                        
                        db.session.add(option)
                    
                    if correct_count != 1:
                        quizzes_ns.abort(400, 'Multiple choice questions must have exactly one correct option')
            
            # If quiz is published, send notifications to enrolled students
            if quiz.is_published:
                # Get all enrolled students for this course
                enrolled_students = db.session.query(Enrollment).filter_by(course_id=course_id).all()
                
                for enrollment in enrolled_students:
                    # Create notification for each enrolled student
                    notification = Notification(
                        user_id=enrollment.student_id,
                        title=f"New Quiz: {quiz.title}",
                        message=f"A new quiz '{quiz.title}' has been published in {course.name}. " + 
                               (f"Due: {quiz.due_date.strftime('%B %d, %Y at %I:%M %p')}" if quiz.due_date else "No due date set."),
                        notification_type='quiz_published',
                        related_id=quiz.id,
                        related_type='quiz',
                        action_url=f"/quiz/{quiz.id}/take",
                        expires_at=quiz.due_date if quiz.due_date else None,
                        created_at=current_time
                    )
                    db.session.add(notification)
            
            db.session.commit()
            
            return {
                'id': quiz.id,
                'course_id': quiz.course_id,
                'title': quiz.title,
                'description': quiz.description,
                'course_name': quiz.course.name,
                'is_published': quiz.is_published,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'question_count': len(questions_data),
                'total_points': total_points
            }
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))


# Define models for quiz with questions
question_option_model = quizzes_ns.model('QuestionOption', {
    'id': fields.Integer(description='Option ID'),
    'text': fields.String(description='Option text'),
    'order': fields.Integer(description='Option order')
})

question_detail_model = quizzes_ns.model('QuestionDetail', {
    'id': fields.Integer(description='Question ID'),
    'text': fields.String(description='Question text'),
    'question_type': fields.String(description='Question type (multiple_choice, text)'),
    'points': fields.Float(description='Points for question'),
    'order': fields.Integer(description='Question order'),
    'options': fields.List(fields.Nested(question_option_model), description='Question options')
})

quiz_detail_model = quizzes_ns.model('QuizDetail', {
    'id': fields.Integer(description='Quiz ID'),
    'title': fields.String(description='Quiz title'),
    'description': fields.String(description='Quiz description'),
    'course_id': fields.Integer(description='Course ID'),
    'course_name': fields.String(description='Course name'),
    'is_published': fields.Boolean(description='Whether quiz is published'),
    'due_date': fields.DateTime(description='Quiz due date'),
    'created_at': fields.DateTime(description='Quiz creation date'),
    'question_count': fields.Integer(description='Number of questions'),
    'total_points': fields.Float(description='Total possible points'),
    'is_past_due': fields.Boolean(description='Whether quiz is past due date'),
    'questions': fields.List(fields.Nested(question_detail_model), description='Quiz questions')
})

answer_model = quizzes_ns.model('Answer', {
    'question_id': fields.Integer(required=True, description='Question ID'),
    'selected_option_id': fields.Integer(description='Selected option ID (for multiple choice)'),
    'text_answer': fields.String(description='Text answer (for text questions)')
})

quiz_submission_data = quizzes_ns.model('QuizSubmissionData', {
    'quiz_id': fields.Integer(required=True, description='Quiz ID'),
    'answers': fields.List(fields.Nested(answer_model), required=True, description='Quiz answers')
})


@quizzes_ns.route('/<int:quiz_id>/details')
class QuizDetailsAPI(Resource):
    @quizzes_ns.doc('get_quiz_details', security='Bearer')
    @quizzes_ns.marshal_with(quiz_detail_model)
    @quizzes_ns.response(404, 'Quiz not found')
    @quizzes_ns.response(401, 'Authentication required')
    @require_auth
    def get(self, quiz_id, current_user=None):
        """Get a quiz with all questions and options for taking"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            # Check if student can access this quiz
            if current_user.role == 'student':
                if not quiz.is_published:
                    quizzes_ns.abort(403, 'Quiz is not published yet')
                
                # Check if student is enrolled in the course
                enrollment = Enrollment.query.filter_by(
                    course_id=quiz.course_id,
                    student_id=current_user.id
                ).first()
                
                if not enrollment:
                    quizzes_ns.abort(403, 'You are not enrolled in this course')
            
            # Prepare questions with options
            questions_data = []
            for question in sorted(quiz.questions, key=lambda q: q.order):
                question_data = {
                    'id': question.id,
                    'text': question.text,
                    'question_type': question.question_type,
                    'points': question.points,
                    'order': question.order,
                    'options': []
                }
                
                # Add options if it's a multiple choice question
                if question.question_type == 'multiple_choice':
                    for option in sorted(question.options, key=lambda o: o.order):
                        question_data['options'].append({
                            'id': option.id,
                            'text': option.text,
                            'order': option.order
                        })
                
                questions_data.append(question_data)
            
            # Check if quiz is past due
            is_past_due = quiz.due_date and datetime.utcnow() > quiz.due_date
            
            return {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'course_id': quiz.course_id,
                'course_name': quiz.course.name,
                'is_published': quiz.is_published,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'question_count': len(quiz.questions),
                'total_points': quiz.get_total_points(),
                'is_past_due': is_past_due,
                'questions': questions_data
            }
            
        except Exception as e:
            quizzes_ns.abort(500, str(e))


@quizzes_ns.route('/<int:quiz_id>/submit')
class QuizSubmitAPI(Resource):
    @quizzes_ns.doc('submit_quiz', security='Bearer')
    @quizzes_ns.expect(quiz_submission_data)
    @quizzes_ns.response(200, 'Quiz submitted successfully')
    @quizzes_ns.response(400, 'Invalid submission data')
    @quizzes_ns.response(401, 'Authentication required')
    @quizzes_ns.response(403, 'Student access required')
    @quizzes_ns.response(404, 'Quiz not found')
    @require_student
    def post(self, quiz_id, current_user=None):
        """Submit quiz answers"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            data = request.get_json()
            
            # Validate required fields
            if 'answers' not in data:
                quizzes_ns.abort(400, 'answers are required')
            
            # Check if quiz is published
            if not quiz.is_published:
                quizzes_ns.abort(400, 'Quiz is not published yet')
            
            # Check if student is enrolled in the course
            enrollment = Enrollment.query.filter_by(
                course_id=quiz.course_id,
                student_id=current_user.id
            ).first()
            
            if not enrollment:
                quizzes_ns.abort(403, 'You are not enrolled in this course')
            
            # Check due date (allow submission past due date but note it)
            is_past_due = quiz.due_date and datetime.utcnow() > quiz.due_date
            
            # Check if there's already a completed submission
            existing_submission = QuizSubmission.query.filter_by(
                quiz_id=quiz_id,
                student_id=current_user.id,
                is_completed=True
            ).first()
            
            if existing_submission:
                quizzes_ns.abort(400, 'Quiz has already been submitted')
            
            # Get or create quiz submission
            submission = QuizSubmission.query.filter_by(
                quiz_id=quiz_id,
                student_id=current_user.id,
                is_completed=False
            ).first()
            
            if not submission:
                # Create new submission
                submission = QuizSubmission(
                    quiz_id=quiz_id,
                    student_id=current_user.id,
                    attempt_number=1
                )
                db.session.add(submission)
                db.session.flush()  # Get the ID
            
            # Process answers
            total_score = 0
            max_possible_score = 0
            
            for answer_data in data['answers']:
                question_id = answer_data.get('question_id')
                selected_option_id = answer_data.get('selected_option_id')
                text_answer = answer_data.get('text_answer')
                
                # Validate question exists in this quiz
                question = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
                if not question:
                    continue  # Skip invalid questions
                
                max_possible_score += question.points
                
                # Delete existing answer if any
                existing_answer = Answer.query.filter_by(
                    submission_id=submission.id,
                    question_id=question_id
                ).first()
                
                if existing_answer:
                    db.session.delete(existing_answer)
                
                # Create new answer
                answer = Answer(
                    submission_id=submission.id,
                    question_id=question_id,
                    student_id=current_user.id,
                    option_id=selected_option_id if question.question_type == 'multiple_choice' else None,
                    text_answer=text_answer if question.question_type == 'text' else None
                )
                
                # For multiple choice, check if answer is correct
                if question.question_type == 'multiple_choice' and selected_option_id:
                    selected_option = Option.query.get(selected_option_id)
                    if selected_option and selected_option.is_correct:
                        answer.score = question.points
                        total_score += question.points
                    else:
                        answer.score = 0
                elif question.question_type == 'text':
                    # For text questions, award full points (manual grading can be implemented later)
                    answer.score = question.points
                    total_score += question.points
                
                db.session.add(answer)
            
            # Complete the submission
            submission.completed_at = datetime.utcnow()
            submission.is_completed = True
            submission.total_score = total_score
            submission.max_possible_score = max_possible_score
            
            # Mark as graded for now (auto-grading)
            submission.is_graded = True
            submission.graded_at = datetime.utcnow()
            submission.graded_by = current_user.id  # Self-graded for now
            
            db.session.commit()
            
            return {
                'message': 'Quiz submitted successfully',
                'submission_id': submission.id,
                'total_score': total_score,
                'max_possible_score': max_possible_score,
                'percentage': (total_score / max_possible_score * 100) if max_possible_score > 0 else 0,
                'is_past_due': is_past_due
            }
            
        except Exception as e:
            db.session.rollback()
            quizzes_ns.abort(500, str(e))
