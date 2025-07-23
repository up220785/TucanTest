from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Answer, QuizSubmission, Question
from datetime import datetime

# Create namespace for answers
answers_ns = Namespace('answers', description='Answer management operations')

# Define models for Swagger documentation
answer_model = answers_ns.model('Answer', {
    'id': fields.Integer(description='Answer ID'),
    'submission_id': fields.Integer(description='Quiz submission ID'),
    'question_id': fields.Integer(description='Question ID'),
    'selected_option_id': fields.Integer(description='Selected option ID (for multiple choice)'),
    'text_answer': fields.String(description='Text answer (for short answer questions)'),
    'is_correct': fields.Boolean(description='Whether answer is correct'),
    'points_earned': fields.Float(description='Points earned for this answer'),
    'created_at': fields.DateTime(description='Answer submission time')
})

answer_create = answers_ns.model('AnswerCreate', {
    'submission_id': fields.Integer(required=True, description='Quiz submission ID', example=1),
    'question_id': fields.Integer(required=True, description='Question ID', example=1),
    'selected_option_id': fields.Integer(description='Selected option ID (for multiple choice)', example=1),
    'text_answer': fields.String(description='Text answer (for short answer questions)', example='Python is a programming language')
})

@answers_ns.route('/')
class AnswerListAPI(Resource):
    @answers_ns.doc('submit_answer')
    @answers_ns.expect(answer_create)
    @answers_ns.marshal_with(answer_model, code=201)
    @answers_ns.response(400, 'Validation error')
    def post(self):
        """Submit an answer to a question"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['submission_id', 'question_id']
            for field in required_fields:
                if field not in data or data[field] is None:
                    answers_ns.abort(400, f'{field} is required')
            
            # Validate submission and question exist
            submission = QuizSubmission.query.get_or_404(data['submission_id'])
            question = Question.query.get_or_404(data['question_id'])
            
            # Check if submission is still active
            if submission.is_completed:
                answers_ns.abort(400, 'Quiz submission is already completed')
            
            # Check if answer already exists for this question
            existing_answer = Answer.query.filter_by(
                submission_id=data['submission_id'],
                question_id=data['question_id']
            ).first()
            
            if existing_answer:
                answers_ns.abort(400, 'Answer already submitted for this question')
            
            # Create answer
            answer = Answer(
                submission_id=data['submission_id'],
                question_id=data['question_id'],
                selected_option_id=data.get('selected_option_id'),
                text_answer=data.get('text_answer')
            )
            
            # Auto-grade if possible
            answer.auto_grade()
            
            db.session.add(answer)
            db.session.commit()
            
            return {
                'id': answer.id,
                'submission_id': answer.submission_id,
                'question_id': answer.question_id,
                'selected_option_id': answer.selected_option_id,
                'text_answer': answer.text_answer,
                'is_correct': answer.is_correct,
                'points_earned': answer.points_earned,
                'created_at': answer.created_at.isoformat() if answer.created_at else None
            }, 201
            
        except Exception as e:
            db.session.rollback()
            answers_ns.abort(500, str(e))

@answers_ns.route('/<int:answer_id>')
class AnswerAPI(Resource):
    @answers_ns.doc('get_answer')
    @answers_ns.marshal_with(answer_model)
    @answers_ns.response(404, 'Answer not found')
    def get(self, answer_id):
        """Get a specific answer"""
        try:
            answer = Answer.query.get_or_404(answer_id)
            
            return {
                'id': answer.id,
                'submission_id': answer.submission_id,
                'question_id': answer.question_id,
                'selected_option_id': answer.selected_option_id,
                'text_answer': answer.text_answer,
                'is_correct': answer.is_correct,
                'points_earned': answer.points_earned,
                'created_at': answer.created_at.isoformat() if answer.created_at else None
            }
            
        except Exception as e:
            answers_ns.abort(404, 'Answer not found')

@answers_ns.route('/submissions/<int:submission_id>/answers')
class SubmissionAnswersAPI(Resource):
    @answers_ns.doc('get_submission_answers')
    @answers_ns.marshal_list_with(answer_model)
    @answers_ns.response(404, 'Submission not found')
    def get(self, submission_id):
        """Get all answers for a quiz submission"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            
            answers = Answer.query.filter_by(submission_id=submission_id).all()
            
            answer_list = []
            for answer in answers:
                answer_data = {
                    'id': answer.id,
                    'submission_id': answer.submission_id,
                    'question_id': answer.question_id,
                    'selected_option_id': answer.selected_option_id,
                    'text_answer': answer.text_answer,
                    'is_correct': answer.is_correct,
                    'points_earned': answer.points_earned,
                    'created_at': answer.created_at.isoformat() if answer.created_at else None
                }
                answer_list.append(answer_data)
            
            return answer_list
            
        except Exception as e:
            answers_ns.abort(500, str(e))

@answers_ns.route('/submissions/<int:submission_id>/complete')
class CompleteSubmissionAPI(Resource):
    @answers_ns.doc('complete_submission')
    @answers_ns.response(200, 'Submission completed and graded')
    @answers_ns.response(404, 'Submission not found')
    def post(self, submission_id):
        """Complete and grade a quiz submission"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            
            if submission.is_completed:
                answers_ns.abort(400, 'Submission is already completed')
            
            # Mark as completed
            submission.is_completed = True
            submission.completed_at = datetime.utcnow()
            
            # Calculate scores
            submission.calculate_score()
            
            db.session.commit()
            
            return {
                'message': 'Quiz submission completed and graded',
                'submission_id': submission_id,
                'total_score': submission.total_score,
                'max_possible_score': submission.max_possible_score,
                'percentage': submission.get_percentage()
            }
            
        except Exception as e:
            db.session.rollback()
            answers_ns.abort(500, str(e))
