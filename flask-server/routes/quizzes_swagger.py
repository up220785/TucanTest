from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Quiz, Course, Question, Option, QuizSubmission, Answer
from datetime import datetime

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
    @quizzes_ns.doc('get_all_quizzes')
    @quizzes_ns.marshal_list_with(quiz_model)
    @quizzes_ns.param('course_id', 'Filter by course ID', type='integer')
    @quizzes_ns.param('published_only', 'Filter to show only published quizzes', type='boolean', default=False)
    def get(self):
        """Get all quizzes"""
        try:
            query = Quiz.query
            
            # Apply filters
            course_id = request.args.get('course_id', type=int)
            published_only = request.args.get('published_only', 'false').lower() == 'true'
            
            if course_id:
                query = query.filter_by(course_id=course_id)
            
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

    @quizzes_ns.doc('create_quiz')
    @quizzes_ns.expect(quiz_create)
    @quizzes_ns.marshal_with(quiz_model, code=201)
    @quizzes_ns.response(400, 'Validation error')
    def post(self):
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

    @quizzes_ns.doc('update_quiz')
    @quizzes_ns.expect(quiz_update)
    @quizzes_ns.marshal_with(quiz_model)
    @quizzes_ns.response(404, 'Quiz not found')
    def put(self, quiz_id):
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

    @quizzes_ns.doc('delete_quiz')
    @quizzes_ns.response(200, 'Quiz deleted successfully')
    @quizzes_ns.response(404, 'Quiz not found')
    def delete(self, quiz_id):
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
    @quizzes_ns.doc('start_quiz')
    @quizzes_ns.expect(quizzes_ns.model('StartQuiz', {
        'student_id': fields.Integer(required=True, description='Student ID', example=1)
    }))
    @quizzes_ns.marshal_with(submission_model, code=201)
    @quizzes_ns.response(400, 'Quiz cannot be started')
    def post(self, quiz_id):
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
    @quizzes_ns.doc('get_quiz_submissions')
    @quizzes_ns.marshal_list_with(submission_model)
    @quizzes_ns.response(404, 'Quiz not found')
    @quizzes_ns.param('student_id', 'Filter by student ID', type='integer')
    @quizzes_ns.param('completed_only', 'Show only completed submissions', type='boolean', default=False)
    def get(self, quiz_id):
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
