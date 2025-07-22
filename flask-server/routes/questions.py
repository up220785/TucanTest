from flask import Blueprint, request, jsonify
from models import db, Question, Quiz, Option
from datetime import datetime

questions_bp = Blueprint('questions', __name__)

@questions_bp.route('/api/quizzes/<int:quiz_id>/questions', methods=['GET'])
def get_quiz_questions(quiz_id):
    """Get all questions for a quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.order).all()
        
        question_list = []
        for question in questions:
            question_data = {
                'id': question.id,
                'text': question.text,
                'type': question.question_type,
                'points': question.points,
                'order': question.order
            }
            
            # Include options for multiple choice questions
            if question.question_type == 'multiple_choice':
                options = []
                for option in sorted(question.options, key=lambda o: o.order):
                    option_data = {
                        'id': option.id,
                        'text': option.text,
                        'order': option.order
                    }
                    # Include correct answer for teacher view
                    # Note: You may want to add authentication to determine if user is teacher
                    option_data['is_correct'] = option.is_correct
                    options.append(option_data)
                question_data['options'] = options
            
            question_list.append(question_data)
        
        return jsonify({
            'quiz_title': quiz.title,
            'questions': question_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    """Get a specific question"""
    try:
        question = Question.query.get_or_404(question_id)
        
        question_data = {
            'id': question.id,
            'quiz_id': question.quiz_id,
            'text': question.text,
            'type': question.question_type,
            'points': question.points,
            'order': question.order
        }
        
        if question.question_type == 'multiple_choice':
            options = []
            for option in sorted(question.options, key=lambda o: o.order):
                options.append({
                    'id': option.id,
                    'text': option.text,
                    'is_correct': option.is_correct,
                    'order': option.order
                })
            question_data['options'] = options
        
        return jsonify(question_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@questions_bp.route('/api/quizzes/<int:quiz_id>/questions', methods=['POST'])
def create_question(quiz_id):
    """Create a new question for a quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['text', 'type', 'points']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate question type
        if data['type'] not in ['multiple_choice', 'text']:
            return jsonify({'error': 'Question type must be multiple_choice or text'}), 400
        
        # Validate points
        if data['points'] <= 0:
            return jsonify({'error': 'Points must be positive'}), 400
        
        # Get next order number
        max_order = db.session.query(db.func.max(Question.order)).filter_by(quiz_id=quiz_id).scalar() or 0
        
        # Create question
        question = Question(
            quiz_id=quiz_id,
            text=data['text'],
            question_type=data['type'],
            points=data['points'],
            order=data.get('order', max_order + 1)
        )
        
        db.session.add(question)
        db.session.flush()  # Get question ID
        
        # Handle multiple choice options
        if data['type'] == 'multiple_choice':
            options_data = data.get('options', [])
            if len(options_data) < 2:
                return jsonify({'error': 'Multiple choice questions need at least 2 options'}), 400
            
            # Check that at least one option is correct
            correct_options = [opt for opt in options_data if opt.get('is_correct')]
            if not correct_options:
                return jsonify({'error': 'At least one option must be marked as correct'}), 400
            
            for i, option_data in enumerate(options_data):
                if not option_data.get('text'):
                    return jsonify({'error': f'Option {i+1} text is required'}), 400
                
                option = Option(
                    question_id=question.id,
                    text=option_data['text'],
                    is_correct=option_data.get('is_correct', False),
                    order=option_data.get('order', i + 1)
                )
                db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Question created successfully',
            'question': {
                'id': question.id,
                'text': question.text,
                'type': question.question_type,
                'points': question.points,
                'quiz_title': quiz.title
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """Update an existing question"""
    try:
        question = Question.query.get_or_404(question_id)
        data = request.get_json()
        
        # Update basic fields
        if 'text' in data and data['text']:
            question.text = data['text']
        
        if 'points' in data:
            if data['points'] <= 0:
                return jsonify({'error': 'Points must be positive'}), 400
            question.points = data['points']
        
        if 'order' in data:
            question.order = data['order']
        
        # Handle options update for multiple choice questions
        if question.question_type == 'multiple_choice' and 'options' in data:
            # Remove existing options
            Option.query.filter_by(question_id=question_id).delete()
            
            options_data = data['options']
            if len(options_data) < 2:
                return jsonify({'error': 'Multiple choice questions need at least 2 options'}), 400
            
            # Check that at least one option is correct
            correct_options = [opt for opt in options_data if opt.get('is_correct')]
            if not correct_options:
                return jsonify({'error': 'At least one option must be marked as correct'}), 400
            
            # Add new options
            for i, option_data in enumerate(options_data):
                if not option_data.get('text'):
                    return jsonify({'error': f'Option {i+1} text is required'}), 400
                
                option = Option(
                    question_id=question_id,
                    text=option_data['text'],
                    is_correct=option_data.get('is_correct', False),
                    order=option_data.get('order', i + 1)
                )
                db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Question updated successfully',
            'question': {
                'id': question.id,
                'text': question.text,
                'type': question.question_type,
                'points': question.points
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """Delete a question"""
    try:
        question = Question.query.get_or_404(question_id)
        
        # SQLAlchemy will handle cascade deletes for options and answers
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({'message': 'Question deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/questions/<int:question_id>/options', methods=['POST'])
def add_option(question_id):
    """Add an option to a multiple choice question"""
    try:
        question = Question.query.get_or_404(question_id)
        
        if question.question_type != 'multiple_choice':
            return jsonify({'error': 'Can only add options to multiple choice questions'}), 400
        
        data = request.get_json()
        
        if not data.get('text'):
            return jsonify({'error': 'Option text is required'}), 400
        
        # Get next order number
        max_order = db.session.query(db.func.max(Option.order)).filter_by(question_id=question_id).scalar() or 0
        
        option = Option(
            question_id=question_id,
            text=data['text'],
            is_correct=data.get('is_correct', False),
            order=data.get('order', max_order + 1)
        )
        
        db.session.add(option)
        db.session.commit()
        
        return jsonify({
            'message': 'Option added successfully',
            'option': {
                'id': option.id,
                'text': option.text,
                'is_correct': option.is_correct,
                'order': option.order
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/options/<int:option_id>', methods=['PUT'])
def update_option(option_id):
    """Update an option"""
    try:
        option = Option.query.get_or_404(option_id)
        data = request.get_json()
        
        if 'text' in data and data['text']:
            option.text = data['text']
        
        if 'is_correct' in data:
            option.is_correct = data['is_correct']
        
        if 'order' in data:
            option.order = data['order']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Option updated successfully',
            'option': {
                'id': option.id,
                'text': option.text,
                'is_correct': option.is_correct,
                'order': option.order
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@questions_bp.route('/api/options/<int:option_id>', methods=['DELETE'])
def delete_option(option_id):
    """Delete an option"""
    try:
        option = Option.query.get_or_404(option_id)
        question = option.question
        
        # Check that we're not deleting the last option
        remaining_options = Option.query.filter_by(question_id=question.id).count()
        if remaining_options <= 2:
            return jsonify({'error': 'Cannot delete option. Multiple choice questions need at least 2 options.'}), 400
        
        db.session.delete(option)
        db.session.commit()
        
        return jsonify({'message': 'Option deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
