from flask import Blueprint, request, jsonify
from models import db, Quiz, Course, Question, Option, User, QuizSubmission, Answer
from datetime import datetime

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/api/courses/<int:course_id>/quizzes', methods=['GET'])
def get_course_quizzes(course_id):
    """Get all quizzes for a course"""
    try:
        course = Course.query.get_or_404(course_id)
        
        # Get query parameters
        published_only = request.args.get('published_only', 'true').lower() == 'true'
        
        if published_only:
            quizzes = Quiz.query.filter_by(course_id=course_id, is_published=True).all()
        else:
            quizzes = Quiz.query.filter_by(course_id=course_id).all()
        
        quiz_list = []
        for quiz in quizzes:
            quiz_data = {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'is_published': quiz.is_published,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'total_points': quiz.get_total_points(),
                'question_count': len(quiz.questions),
                'is_past_due': quiz.is_past_due()
            }
            quiz_list.append(quiz_data)
        
        return jsonify({
            'course_name': course.name,
            'quizzes': quiz_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    """Get a specific quiz with questions and options"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Get questions with options
        questions = []
        for question in sorted(quiz.questions, key=lambda q: q.order):
            question_data = {
                'id': question.id,
                'text': question.text,
                'type': question.question_type,
                'points': question.points,
                'order': question.order
            }
            
            # Add options for multiple choice questions
            if question.question_type == 'multiple_choice':
                options = []
                for option in sorted(question.options, key=lambda o: o.order):
                    options.append({
                        'id': option.id,
                        'text': option.text,
                        'order': option.order
                        # Note: Don't include is_correct in student view
                    })
                question_data['options'] = options
            
            questions.append(question_data)
        
        return jsonify({
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
            'is_published': quiz.is_published,
            'course_id': quiz.course_id,
            'course_name': quiz.course.name,
            'total_points': quiz.get_total_points(),
            'is_past_due': quiz.is_past_due(),
            'questions': questions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@quizzes_bp.route('/api/courses/<int:course_id>/quizzes', methods=['POST'])
def create_quiz(course_id):
    """Create a new quiz"""
    try:
        course = Course.query.get_or_404(course_id)
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse due date if provided
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid due date format. Use ISO format.'}), 400
        
        # Create quiz
        quiz = Quiz(
            course_id=course_id,
            title=data['title'],
            description=data.get('description', ''),
            due_date=due_date,
            is_published=data.get('is_published', False)
        )
        
        db.session.add(quiz)
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'course_name': course.name,
                'is_published': quiz.is_published
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/quizzes/<int:quiz_id>', methods=['PUT'])
def update_quiz(quiz_id):
    """Update an existing quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data and data['title']:
            quiz.title = data['title']
        
        if 'description' in data:
            quiz.description = data['description']
        
        if 'due_date' in data:
            if data['due_date']:
                try:
                    quiz.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'error': 'Invalid due date format'}), 400
            else:
                quiz.due_date = None
        
        if 'is_published' in data:
            quiz.is_published = data['is_published']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz updated successfully',
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'is_published': quiz.is_published
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/quizzes/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    """Delete a quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        db.session.delete(quiz)
        db.session.commit()
        
        return jsonify({'message': 'Quiz deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    """Submit quiz answers"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.get_json()
        
        student_id = data.get('student_id')
        answers = data.get('answers', [])
        
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        student = User.query.get_or_404(student_id)
        if student.role != 'student':
            return jsonify({'error': 'Only students can submit quizzes'}), 403
        
        # Check if quiz is published and not past due
        if not quiz.is_published:
            return jsonify({'error': 'Quiz is not available'}), 403
        
        if quiz.is_past_due():
            return jsonify({'error': 'Quiz is past due'}), 403
        
        # Check if student is enrolled in the course
        from models import Enrollment
        enrollment = Enrollment.query.filter_by(
            course_id=quiz.course_id,
            student_id=student_id,
            status='accepted'
        ).first()
        
        if not enrollment:
            return jsonify({'error': 'Student is not enrolled in this course'}), 403
        
        # Check if submission already exists
        existing_submission = QuizSubmission.query.filter_by(
            quiz_id=quiz_id,
            student_id=student_id
        ).first()
        
        if existing_submission:
            return jsonify({'error': 'Quiz already submitted'}), 409
        
        # Create quiz submission
        submission = QuizSubmission(
            quiz_id=quiz_id,
            student_id=student_id,
            max_possible_score=quiz.get_total_points()
        )
        
        db.session.add(submission)
        db.session.flush()  # Get the submission ID
        
        # Process answers
        auto_score = 0
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            question = Question.query.get(question_id)
            
            if not question or question.quiz_id != quiz_id:
                continue
            
            answer = Answer(
                question_id=question_id,
                student_id=student_id,
                submission_id=submission.id
            )
            
            if question.question_type == 'multiple_choice':
                option_id = answer_data.get('option_id')
                if option_id:
                    option = Option.query.get(option_id)
                    if option and option.question_id == question_id:
                        answer.option_id = option_id
                        # Auto-grade multiple choice
                        if option.is_correct:
                            answer.score = question.points
                            auto_score += question.points
                        else:
                            answer.score = 0
                        answer.graded_at = datetime.utcnow()
            
            elif question.question_type == 'text':
                text_answer = answer_data.get('text_answer', '').strip()
                answer.text_answer = text_answer
                # Text answers require manual grading (score remains None)
            
            db.session.add(answer)
        
        # Update submission scores
        submission.auto_graded_score = auto_score
        submission.calculate_total_score()
        
        # Check if all questions are auto-graded
        text_questions = [q for q in quiz.questions if q.question_type == 'text']
        if not text_questions:
            submission.is_graded = True
            submission.graded_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'submission_id': submission.id,
            'auto_graded_score': auto_score,
            'total_possible_score': submission.max_possible_score,
            'requires_manual_grading': len(text_questions) > 0
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/quizzes/<int:quiz_id>/submissions', methods=['GET'])
def get_quiz_submissions(quiz_id):
    """Get all submissions for a quiz (teacher view)"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
        
        submission_list = []
        for submission in submissions:
            submission_data = {
                'id': submission.id,
                'student_id': submission.student_id,
                'student_name': submission.student.name,
                'student_email': submission.student.email,
                'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
                'is_graded': submission.is_graded,
                'total_score': submission.total_score,
                'max_possible_score': submission.max_possible_score,
                'percentage': submission.get_percentage(),
                'auto_graded_score': submission.auto_graded_score,
                'manual_graded_score': submission.manual_graded_score
            }
            submission_list.append(submission_data)
        
        return jsonify({
            'quiz_title': quiz.title,
            'total_submissions': len(submission_list),
            'submissions': submission_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/api/submissions/<int:submission_id>', methods=['GET'])
def get_submission_details(submission_id):
    """Get detailed submission with answers"""
    try:
        submission = QuizSubmission.query.get_or_404(submission_id)
        
        # Get answers with question details
        answers = []
        for answer in submission.answers:
            answer_data = {
                'id': answer.id,
                'question_id': answer.question_id,
                'question_text': answer.question.text,
                'question_type': answer.question.question_type,
                'question_points': answer.question.points,
                'score': answer.score,
                'graded_by': answer.graded_by,
                'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
                'grading_comment': answer.grading_comment
            }
            
            if answer.question.question_type == 'multiple_choice':
                if answer.option:
                    answer_data['selected_option'] = {
                        'id': answer.option.id,
                        'text': answer.option.text,
                        'is_correct': answer.option.is_correct
                    }
                # Include all options for reference
                answer_data['all_options'] = [{
                    'id': opt.id,
                    'text': opt.text,
                    'is_correct': opt.is_correct
                } for opt in answer.question.options]
            
            elif answer.question.question_type == 'text':
                answer_data['text_answer'] = answer.text_answer
            
            answers.append(answer_data)
        
        return jsonify({
            'id': submission.id,
            'quiz_id': submission.quiz_id,
            'quiz_title': submission.quiz.title,
            'student_id': submission.student_id,
            'student_name': submission.student.name,
            'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
            'is_graded': submission.is_graded,
            'total_score': submission.total_score,
            'max_possible_score': submission.max_possible_score,
            'percentage': submission.get_percentage(),
            'answers': answers
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404
