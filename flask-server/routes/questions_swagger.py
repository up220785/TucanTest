from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Question, Quiz, Option
from datetime import datetime
from auth import require_teacher, require_student, require_auth

# Create namespace for questions
questions_ns = Namespace('questions', description='Question management operations')

# Define models for Swagger documentation
option_model = questions_ns.model('Option', {
    'id': fields.Integer(description='Option ID'),
    'text': fields.String(description='Option text'),
    'is_correct': fields.Boolean(description='Whether this option is correct')
})

question_model = questions_ns.model('Question', {
    'id': fields.Integer(description='Question ID'),
    'quiz_id': fields.Integer(description='Quiz ID'),
    'text': fields.String(description='Question text'),
    'question_type': fields.String(description='Question type', enum=['multiple_choice', 'true_false', 'short_answer']),
    'points': fields.Float(description='Points for this question'),
    'order': fields.Integer(description='Question order in quiz'),
    'options': fields.List(fields.Nested(option_model), description='Answer options')
})

question_create = questions_ns.model('QuestionCreate', {
    'quiz_id': fields.Integer(required=True, description='Quiz ID', example=1),
    'text': fields.String(required=True, description='Question text', example='What is Python?'),
    'question_type': fields.String(required=True, description='Question type', enum=['multiple_choice', 'true_false', 'short_answer'], example='multiple_choice'),
    'points': fields.Float(description='Points for this question', example=1.0),
    'options': fields.List(fields.Nested(questions_ns.model('OptionCreate', {
        'text': fields.String(required=True, description='Option text'),
        'is_correct': fields.Boolean(required=True, description='Whether this option is correct')
    })), description='Answer options')
})

@questions_ns.route('/')
class QuestionListAPI(Resource):
    @questions_ns.doc('create_question', security='Bearer')
    @questions_ns.expect(question_create)
    @questions_ns.marshal_with(question_model, code=201)
    @questions_ns.response(400, 'Validation error')
    @questions_ns.response(401, 'Authentication required')
    @questions_ns.response(403, 'Teacher access required')
    @require_teacher
    def post(self, current_user=None):
        """Create a new question"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['quiz_id', 'text', 'question_type']
            for field in required_fields:
                if field not in data or not data[field]:
                    questions_ns.abort(400, f'{field} is required')
            
            # Validate quiz exists
            quiz = Quiz.query.get_or_404(data['quiz_id'])
            
            # Determine next order number
            max_order = db.session.query(db.func.max(Question.order)).filter_by(quiz_id=data['quiz_id']).scalar() or 0
            
            # Create question
            question = Question(
                quiz_id=data['quiz_id'],
                text=data['text'],
                question_type=data['question_type'],
                points=data.get('points', 1.0),
                order=max_order + 1
            )
            
            db.session.add(question)
            db.session.flush()  # To get the question ID
            
            # Create options if provided
            options_data = []
            if 'options' in data and data['options']:
                for option_data in data['options']:
                    option = Option(
                        question_id=question.id,
                        text=option_data['text'],
                        is_correct=option_data.get('is_correct', False)
                    )
                    db.session.add(option)
                    options_data.append({
                        'text': option.text,
                        'is_correct': option.is_correct
                    })
            
            db.session.commit()
            
            return {
                'id': question.id,
                'quiz_id': question.quiz_id,
                'text': question.text,
                'question_type': question.question_type,
                'points': question.points,
                'order': question.order,
                'options': options_data
            }, 201
            
        except Exception as e:
            db.session.rollback()
            questions_ns.abort(500, str(e))

@questions_ns.route('/<int:question_id>')
class QuestionAPI(Resource):
    @questions_ns.doc('get_question')
    @questions_ns.marshal_with(question_model)
    @questions_ns.response(404, 'Question not found')
    def get(self, question_id):
        """Get a specific question"""
        try:
            question = Question.query.get_or_404(question_id)
            
            options_data = []
            for option in question.options:
                options_data.append({
                    'id': option.id,
                    'text': option.text,
                    'is_correct': option.is_correct
                })
            
            return {
                'id': question.id,
                'quiz_id': question.quiz_id,
                'text': question.text,
                'question_type': question.question_type,
                'points': question.points,
                'order': question.order,
                'options': options_data
            }
            
        except Exception as e:
            questions_ns.abort(404, 'Question not found')

    @questions_ns.doc('delete_question', security='Bearer')
    @questions_ns.response(200, 'Question deleted successfully')
    @questions_ns.response(404, 'Question not found')
    @questions_ns.response(401, 'Authentication required')
    @questions_ns.response(403, 'Teacher access required')
    @require_teacher
    def delete(self, question_id, current_user=None):
        """Delete a question"""
        try:
            question = Question.query.get_or_404(question_id)
            
            db.session.delete(question)
            db.session.commit()
            
            return {'message': 'Question deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            questions_ns.abort(500, str(e))

@questions_ns.route('/quizzes/<int:quiz_id>/questions')
class QuizQuestionsAPI(Resource):
    @questions_ns.doc('get_quiz_questions', security='Bearer')
    @questions_ns.marshal_list_with(question_model)
    @questions_ns.response(404, 'Quiz not found')
    @questions_ns.response(401, 'Authentication required')
    @require_auth
    def get(self, quiz_id, current_user=None):
        """Get all questions for a quiz"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.order).all()
            
            question_list = []
            for question in questions:
                options_data = []
                for option in question.options:
                    option_data = {
                        'id': option.id,
                        'text': option.text
                    }
                    # Only show correct answers to teachers
                    if current_user and current_user.role == 'teacher':
                        option_data['is_correct'] = option.is_correct
                    
                    options_data.append(option_data)
                
                question_data = {
                    'id': question.id,
                    'quiz_id': question.quiz_id,
                    'text': question.text,
                    'question_type': question.question_type,
                    'points': question.points,
                    'order': question.order,
                    'options': options_data
                }
                question_list.append(question_data)
            
            return question_list
            
        except Exception as e:
            questions_ns.abort(500, str(e))
