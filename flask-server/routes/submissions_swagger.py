from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, QuizSubmission, Quiz, User, Answer, Question, Option, Notification
from datetime import datetime
from auth import require_teacher, require_auth

# Create namespace for submissions
submissions_ns = Namespace('submissions', description='Quiz submission management operations')

# Define models for Swagger documentation
submission_summary_model = submissions_ns.model('SubmissionSummary', {
    'id': fields.Integer(description='Submission ID'),
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'started_at': fields.DateTime(description='When submission was started'),
    'submitted_at': fields.DateTime(description='When submission was submitted'),
    'completed_at': fields.DateTime(description='When submission was completed'),
    'is_completed': fields.Boolean(description='Whether submission is completed'),
    'is_graded': fields.Boolean(description='Whether submission is graded'),
    'attempt_number': fields.Integer(description='Attempt number'),
    'total_score': fields.Integer(description='Total score'),
    'max_possible_score': fields.Integer(description='Maximum possible score'),
    'auto_graded_score': fields.Integer(description='Auto-graded score'),
    'manual_graded_score': fields.Integer(description='Manual graded score'),
    'graded_at': fields.DateTime(description='When submission was graded'),
    'graded_by': fields.Integer(description='ID of teacher who graded')
})

answer_detail_model = submissions_ns.model('AnswerDetail', {
    'id': fields.Integer(description='Answer ID'),
    'question_id': fields.Integer(description='Question ID'),
    'question_text': fields.String(description='Question text'),
    'question_type': fields.String(description='Question type'),
    'question_points': fields.Float(description='Question points'),
    'selected_option_id': fields.Integer(description='Selected option ID'),
    'selected_option_text': fields.String(description='Selected option text'),
    'text_answer': fields.String(description='Text answer for short answer questions'),
    'is_correct': fields.Boolean(description='Whether answer is correct'),
    'points_awarded': fields.Float(description='Points awarded for this answer'),
    'correct_option_id': fields.Integer(description='ID of correct option'),
    'correct_option_text': fields.String(description='Text of correct option')
})

submission_detail_model = submissions_ns.model('SubmissionDetail', {
    'id': fields.Integer(description='Submission ID'),
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'started_at': fields.DateTime(description='When submission was started'),
    'submitted_at': fields.DateTime(description='When submission was submitted'),
    'completed_at': fields.DateTime(description='When submission was completed'),
    'is_completed': fields.Boolean(description='Whether submission is completed'),
    'is_graded': fields.Boolean(description='Whether submission is graded'),
    'attempt_number': fields.Integer(description='Attempt number'),
    'total_score': fields.Integer(description='Total score'),
    'max_possible_score': fields.Integer(description='Maximum possible score'),
    'auto_graded_score': fields.Integer(description='Auto-graded score'),
    'manual_graded_score': fields.Integer(description='Manual graded score'),
    'graded_at': fields.DateTime(description='When submission was graded'),
    'graded_by': fields.Integer(description='ID of teacher who graded'),
    'answers': fields.List(fields.Nested(answer_detail_model), description='Student answers')
})

grade_submission_model = submissions_ns.model('GradeSubmission', {
    'answers': fields.List(fields.Nested(submissions_ns.model('AnswerGrade', {
        'answer_id': fields.Integer(required=True, description='Answer ID'),
        'points_awarded': fields.Float(required=True, description='Points to award for this answer')
    })), required=True, description='Answer grades'),
    'feedback': fields.String(description='Overall feedback for the submission')
})

grade_response_model = submissions_ns.model('GradeResponse', {
    'message': fields.String(description='Success message'),
    'submission_id': fields.Integer(description='Submission ID'),
    'total_score': fields.Float(description='Total score awarded'),
    'auto_graded_score': fields.Float(description='Auto-graded score'),
    'manual_graded_score': fields.Float(description='Manual graded score'),
    'graded_at': fields.String(description='Grading timestamp'),
    'graded_by': fields.Integer(description='ID of teacher who graded')
})

@submissions_ns.route('/quizzes/<int:quiz_id>')
class QuizSubmissionsAPI(Resource):
    @submissions_ns.doc('get_quiz_submissions', security='Bearer')
    @submissions_ns.marshal_list_with(submission_summary_model)
    @submissions_ns.response(404, 'Quiz not found')
    @submissions_ns.response(401, 'Authentication required')
    @submissions_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, quiz_id, current_user=None):
        """Get all submissions for a quiz"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
            
            submission_list = []
            for submission in submissions:
                student = User.query.get(submission.student_id)
                
                submission_data = {
                    'id': submission.id,
                    'quiz_id': submission.quiz_id,
                    'quiz_title': quiz.title,
                    'student_id': submission.student_id,
                    'student_name': student.name if student else 'Unknown',
                    'student_email': student.email if student else 'Unknown',
                    'started_at': submission.started_at,
                    'submitted_at': submission.submitted_at,
                    'completed_at': submission.completed_at,
                    'is_completed': submission.is_completed,
                    'is_graded': submission.is_graded,
                    'attempt_number': submission.attempt_number,
                    'total_score': submission.total_score,
                    'max_possible_score': submission.max_possible_score,
                    'auto_graded_score': submission.auto_graded_score,
                    'manual_graded_score': submission.manual_graded_score,
                    'graded_at': submission.graded_at,
                    'graded_by': submission.graded_by
                }
                submission_list.append(submission_data)
            
            return submission_list
            
        except Exception as e:
            submissions_ns.abort(500, str(e))

@submissions_ns.route('/<int:submission_id>')
class SubmissionDetailAPI(Resource):
    @submissions_ns.doc('get_submission_detail', security='Bearer')
    @submissions_ns.marshal_with(submission_detail_model)
    @submissions_ns.response(404, 'Submission not found')
    @submissions_ns.response(401, 'Authentication required')
    @submissions_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, submission_id, current_user=None):
        """Get detailed submission with all answers"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            quiz = Quiz.query.get(submission.quiz_id)
            student = User.query.get(submission.student_id)
            
            # Get all answers for this submission
            answers = Answer.query.filter_by(submission_id=submission_id).all()
            
            answer_list = []
            for answer in answers:
                question = Question.query.get(answer.question_id)
                
                answer_data = {
                    'id': answer.id,
                    'question_id': answer.question_id,
                    'question_text': question.text if question else 'Unknown',
                    'question_type': question.question_type if question else 'Unknown',
                    'question_points': question.points if question else 0,
                    'selected_option_id': answer.option_id,
                    'text_answer': answer.text_answer,
                    'is_correct': None,  # Will be calculated below
                    'points_awarded': answer.score  # Use score field from database
                }
                
                # Get selected option text
                if answer.option_id:
                    selected_option = Option.query.get(answer.option_id)
                    answer_data['selected_option_text'] = selected_option.text if selected_option else 'Unknown'
                    # Check if this option is correct
                    if selected_option:
                        answer_data['is_correct'] = selected_option.is_correct
                
                # Get correct option for multiple choice questions
                if question and question.question_type in ['multiple_choice', 'true_false']:
                    correct_option = Option.query.filter_by(question_id=question.id, is_correct=True).first()
                    if correct_option:
                        answer_data['correct_option_id'] = correct_option.id
                        answer_data['correct_option_text'] = correct_option.text
                
                answer_list.append(answer_data)
            
            return {
                'id': submission.id,
                'quiz_id': submission.quiz_id,
                'quiz_title': quiz.title if quiz else 'Unknown',
                'student_id': submission.student_id,
                'student_name': student.name if student else 'Unknown',
                'student_email': student.email if student else 'Unknown',
                'started_at': submission.started_at,
                'submitted_at': submission.submitted_at,
                'completed_at': submission.completed_at,
                'is_completed': submission.is_completed,
                'is_graded': submission.is_graded,
                'attempt_number': submission.attempt_number,
                'total_score': submission.total_score,
                'max_possible_score': submission.max_possible_score,
                'auto_graded_score': submission.auto_graded_score,
                'manual_graded_score': submission.manual_graded_score,
                'graded_at': submission.graded_at,
                'graded_by': submission.graded_by,
                'answers': answer_list
            }
            
        except Exception as e:
            submissions_ns.abort(500, str(e))

@submissions_ns.route('/<int:submission_id>/grade')
class GradeSubmissionAPI(Resource):
    @submissions_ns.doc('grade_submission', security='Bearer')
    @submissions_ns.expect(grade_submission_model)
    @submissions_ns.marshal_with(grade_response_model)
    @submissions_ns.response(404, 'Submission not found')
    @submissions_ns.response(401, 'Authentication required')
    @submissions_ns.response(403, 'Teacher access required')
    @submissions_ns.response(400, 'Validation error')
    @require_teacher
    def put(self, submission_id, current_user=None):
        """Grade a submission"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            data = request.get_json()
            
            if 'answers' not in data:
                submissions_ns.abort(400, 'answers field is required')
            
            total_score = 0
            manual_score = 0
            auto_score = 0
            
            # Update answer scores
            for answer_grade in data['answers']:
                answer_id = answer_grade.get('answer_id')
                points_awarded = answer_grade.get('points_awarded', 0)
                
                answer = Answer.query.get(answer_id)
                if not answer or answer.submission_id != submission_id:
                    continue
                
                answer.score = points_awarded  # Use 'score' field, not 'points_awarded'
                total_score += points_awarded
                
                # Determine if this was auto-graded or manual
                question = Question.query.get(answer.question_id)
                if question and question.question_type in ['multiple_choice', 'true_false']:
                    auto_score += points_awarded
                else:
                    manual_score += points_awarded
            
            # Update submission
            submission.total_score = total_score
            submission.auto_graded_score = auto_score
            submission.manual_graded_score = manual_score
            submission.is_graded = True
            submission.graded_at = datetime.utcnow()
            submission.graded_by = current_user.id
            
            # Create notification for student
            quiz = Quiz.query.get(submission.quiz_id)
            student = User.query.get(submission.student_id)
            
            if quiz and student:
                notification = Notification(
                    user_id=submission.student_id,
                    title=f"Quiz Graded: {quiz.title}",
                    message=f"Your quiz '{quiz.title}' has been graded. You scored {total_score} points.",
                    notification_type='quiz_graded',
                    related_id=submission.quiz_id,
                    related_type='quiz',
                    action_url=f"/student/quiz-results/{submission.id}"
                )
                db.session.add(notification)
            
            db.session.commit()
            
            # Return success message instead of trying to call non-existent get method
            return {
                'message': 'Submission graded successfully',
                'submission_id': submission.id,
                'total_score': total_score,
                'auto_graded_score': auto_score,
                'manual_graded_score': manual_score,
                'graded_at': submission.graded_at.isoformat(),
                'graded_by': current_user.id
            }
            
        except Exception as e:
            db.session.rollback()
            submissions_ns.abort(500, str(e))

@submissions_ns.route('/courses/<int:course_id>')
class CourseSubmissionsAPI(Resource):
    @submissions_ns.doc('get_course_submissions', security='Bearer')
    @submissions_ns.marshal_list_with(submission_summary_model)
    @submissions_ns.response(404, 'Course not found')
    @submissions_ns.response(401, 'Authentication required')
    @submissions_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, course_id, current_user=None):
        """Get all submissions for all quizzes in a course"""
        try:
            # Get all quizzes for this course
            quizzes = Quiz.query.filter_by(course_id=course_id).all()
            quiz_ids = [quiz.id for quiz in quizzes]
            
            if not quiz_ids:
                return []
            
            submissions = QuizSubmission.query.filter(QuizSubmission.quiz_id.in_(quiz_ids)).all()
            
            submission_list = []
            for submission in submissions:
                quiz = next((q for q in quizzes if q.id == submission.quiz_id), None)
                student = User.query.get(submission.student_id)
                
                submission_data = {
                    'id': submission.id,
                    'quiz_id': submission.quiz_id,
                    'quiz_title': quiz.title if quiz else 'Unknown',
                    'student_id': submission.student_id,
                    'student_name': student.name if student else 'Unknown',
                    'student_email': student.email if student else 'Unknown',
                    'started_at': submission.started_at,
                    'submitted_at': submission.submitted_at,
                    'completed_at': submission.completed_at,
                    'is_completed': submission.is_completed,
                    'is_graded': submission.is_graded,
                    'attempt_number': submission.attempt_number,
                    'total_score': submission.total_score,
                    'max_possible_score': submission.max_possible_score,
                    'auto_graded_score': submission.auto_graded_score,
                    'manual_graded_score': submission.manual_graded_score,
                    'graded_at': submission.graded_at,
                    'graded_by': submission.graded_by
                }
                submission_list.append(submission_data)
            
            return submission_list
            
        except Exception as e:
            submissions_ns.abort(500, str(e))
