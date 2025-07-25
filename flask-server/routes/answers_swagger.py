from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Answer, QuizSubmission, Question, User
from datetime import datetime

# Create namespace for answers
answers_ns = Namespace('answers', description='Answer management operations')

# Define models for Swagger documentation
answer_model = answers_ns.model('Answer', {
    'id': fields.Integer(description='Answer ID'),
    'question_id': fields.Integer(description='Question ID'),
    'student_id': fields.Integer(description='Student ID'),
    'submission_id': fields.Integer(description='Quiz submission ID'),
    'option_id': fields.Integer(description='Selected option ID (for multiple choice)'),
    'text_answer': fields.String(description='Text answer (for short answer questions)'),
    'score': fields.Integer(description='Score for this answer'),
    'graded_by': fields.Integer(description='ID of user who graded this answer'),
    'graded_at': fields.DateTime(description='When the answer was graded'),
    'grading_comment': fields.String(description='Teacher feedback'),
    'submitted_at': fields.DateTime(description='Answer submission time')
})

answer_create = answers_ns.model('AnswerCreate', {
    'question_id': fields.Integer(required=True, description='Question ID', example=1),
    'student_id': fields.Integer(required=True, description='Student ID', example=1),
    'submission_id': fields.Integer(required=True, description='Quiz submission ID', example=1),
    'option_id': fields.Integer(description='Selected option ID (for multiple choice)', example=1),
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
            required_fields = ['question_id', 'student_id', 'submission_id']
            for field in required_fields:
                if field not in data or data[field] is None:
                    answers_ns.abort(400, f'{field} is required')
            
            # Validate that the entities exist
            submission = QuizSubmission.query.get_or_404(data['submission_id'])
            question = Question.query.get_or_404(data['question_id'])
            student = User.query.get_or_404(data['student_id'])
            
            # Check if answer already exists for this question/student/submission
            existing_answer = Answer.query.filter_by(
                question_id=data['question_id'],
                student_id=data['student_id'],
                submission_id=data['submission_id']
            ).first()
            
            if existing_answer:
                answers_ns.abort(400, 'Answer already submitted for this question')
            
            # Validate answer content based on question type
            if question.question_type == 'multiple_choice':
                if 'option_id' not in data or data['option_id'] is None:
                    answers_ns.abort(400, 'option_id is required for multiple choice questions')
            else:  # text-based questions
                if 'text_answer' not in data or not data['text_answer']:
                    answers_ns.abort(400, 'text_answer is required for text questions')
            
            # Create answer
            answer = Answer(
                question_id=data['question_id'],
                student_id=data['student_id'],
                submission_id=data['submission_id'],
                option_id=data.get('option_id'),
                text_answer=data.get('text_answer')
            )
            
            db.session.add(answer)
            db.session.commit()
            
            return {
                'id': answer.id,
                'question_id': answer.question_id,
                'student_id': answer.student_id,
                'submission_id': answer.submission_id,
                'option_id': answer.option_id,
                'text_answer': answer.text_answer,
                'score': answer.score,
                'graded_by': answer.graded_by,
                'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
                'grading_comment': answer.grading_comment,
                'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
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
                'question_id': answer.question_id,
                'student_id': answer.student_id,
                'submission_id': answer.submission_id,
                'option_id': answer.option_id,
                'text_answer': answer.text_answer,
                'score': answer.score,
                'graded_by': answer.graded_by,
                'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
                'grading_comment': answer.grading_comment,
                'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
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
                    'question_id': answer.question_id,
                    'student_id': answer.student_id,
                    'submission_id': answer.submission_id,
                    'option_id': answer.option_id,
                    'text_answer': answer.text_answer,
                    'score': answer.score,
                    'graded_by': answer.graded_by,
                    'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
                    'grading_comment': answer.grading_comment,
                    'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
                }
                answer_list.append(answer_data)
            
            return answer_list
            
        except Exception as e:
            answers_ns.abort(500, str(e))


