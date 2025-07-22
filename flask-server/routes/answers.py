from flask import Blueprint, request, jsonify
from models import db, Answer, Question, QuizSubmission, User, Option
from datetime import datetime

answers_bp = Blueprint('answers', __name__)

@answers_bp.route('/api/submissions/<int:submission_id>/answers', methods=['GET'])
def get_submission_answers(submission_id):
    """Get all answers for a quiz submission"""
    try:
        submission = QuizSubmission.query.get_or_404(submission_id)
        
        answers = Answer.query.filter_by(submission_id=submission_id).all()
        
        answer_list = []
        for answer in answers:
            answer_data = {
                'id': answer.id,
                'question_id': answer.question_id,
                'question_text': answer.question.text,
                'question_type': answer.question.question_type,
                'question_points': answer.question.points,
                'score': answer.score,
                'graded_by': answer.graded_by,
                'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
                'grading_comment': answer.grading_comment,
                'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
            }
            
            if answer.question.question_type == 'multiple_choice':
                if answer.option:
                    answer_data['selected_option'] = {
                        'id': answer.option.id,
                        'text': answer.option.text,
                        'is_correct': answer.option.is_correct
                    }
                else:
                    answer_data['selected_option'] = None
            
            elif answer.question.question_type == 'text':
                answer_data['text_answer'] = answer.text_answer
            
            answer_list.append(answer_data)
        
        return jsonify({
            'submission_id': submission_id,
            'quiz_title': submission.quiz.title,
            'student_name': submission.student.name,
            'answers': answer_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@answers_bp.route('/api/answers/<int:answer_id>', methods=['GET'])
def get_answer(answer_id):
    """Get a specific answer"""
    try:
        answer = Answer.query.get_or_404(answer_id)
        
        answer_data = {
            'id': answer.id,
            'question_id': answer.question_id,
            'question_text': answer.question.text,
            'question_type': answer.question.question_type,
            'question_points': answer.question.points,
            'student_id': answer.student_id,
            'student_name': answer.student.name,
            'submission_id': answer.submission_id,
            'score': answer.score,
            'graded_by': answer.graded_by,
            'graded_at': answer.graded_at.isoformat() if answer.graded_at else None,
            'grading_comment': answer.grading_comment,
            'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
        }
        
        if answer.question.question_type == 'multiple_choice':
            if answer.option:
                answer_data['selected_option'] = {
                    'id': answer.option.id,
                    'text': answer.option.text,
                    'is_correct': answer.option.is_correct
                }
            # Include all options for context
            answer_data['all_options'] = [{
                'id': opt.id,
                'text': opt.text,
                'is_correct': opt.is_correct
            } for opt in answer.question.options]
        
        elif answer.question.question_type == 'text':
            answer_data['text_answer'] = answer.text_answer
        
        return jsonify(answer_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@answers_bp.route('/api/answers/<int:answer_id>/grade', methods=['PUT'])
def grade_answer(answer_id):
    """Grade a text answer (teacher functionality)"""
    try:
        answer = Answer.query.get_or_404(answer_id)
        data = request.get_json()
        
        # Validate required fields
        if 'score' not in data:
            return jsonify({'error': 'Score is required'}), 400
        
        if 'graded_by' not in data:
            return jsonify({'error': 'Grader ID is required'}), 400
        
        # Validate grader is a teacher
        grader = User.query.get_or_404(data['graded_by'])
        if grader.role != 'teacher':
            return jsonify({'error': 'Only teachers can grade answers'}), 403
        
        # Validate score
        score = data['score']
        if score < 0 or score > answer.question.points:
            return jsonify({'error': f'Score must be between 0 and {answer.question.points}'}), 400
        
        # Update answer grading
        answer.score = score
        answer.graded_by = data['graded_by']
        answer.graded_at = datetime.utcnow()
        answer.grading_comment = data.get('comment', '')
        
        # Update submission grading status
        submission = answer.submission
        
        # Check if all text answers in this submission are now graded
        ungraded_text_answers = Answer.query.join(Question).filter(
            Answer.submission_id == submission.id,
            Question.question_type == 'text',
            Answer.score.is_(None)
        ).count()
        
        if ungraded_text_answers == 0:
            # All answers are graded, calculate final scores
            submission.manual_graded_score = sum([
                ans.score for ans in submission.answers 
                if ans.question.question_type == 'text' and ans.score is not None
            ])
            
            submission.calculate_total_score()
            submission.is_graded = True
            submission.graded_at = datetime.utcnow()
            submission.graded_by = data['graded_by']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Answer graded successfully',
            'answer': {
                'id': answer.id,
                'score': answer.score,
                'max_points': answer.question.points,
                'grading_comment': answer.grading_comment,
                'graded_at': answer.graded_at.isoformat()
            },
            'submission_fully_graded': submission.is_graded
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@answers_bp.route('/api/answers/<int:answer_id>/regrade', methods=['PUT'])
def regrade_answer(answer_id):
    """Regrade an answer (teacher can modify score)"""
    try:
        answer = Answer.query.get_or_404(answer_id)
        data = request.get_json()
        
        # Validate required fields
        if 'score' not in data:
            return jsonify({'error': 'Score is required'}), 400
        
        if 'graded_by' not in data:
            return jsonify({'error': 'Grader ID is required'}), 400
        
        # Validate grader is a teacher
        grader = User.query.get_or_404(data['graded_by'])
        if grader.role != 'teacher':
            return jsonify({'error': 'Only teachers can regrade answers'}), 403
        
        # Validate score
        score = data['score']
        if score < 0 or score > answer.question.points:
            return jsonify({'error': f'Score must be between 0 and {answer.question.points}'}), 400
        
        # Update answer
        old_score = answer.score
        answer.score = score
        answer.graded_by = data['graded_by']
        answer.graded_at = datetime.utcnow()
        answer.grading_comment = data.get('comment', answer.grading_comment)
        
        # Recalculate submission scores
        submission = answer.submission
        
        # Recalculate manual graded score
        submission.manual_graded_score = sum([
            ans.score for ans in submission.answers 
            if ans.question.question_type == 'text' and ans.score is not None
        ])
        
        # Recalculate total score
        submission.calculate_total_score()
        submission.graded_by = data['graded_by']
        submission.graded_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Answer regraded successfully',
            'answer': {
                'id': answer.id,
                'old_score': old_score,
                'new_score': answer.score,
                'max_points': answer.question.points,
                'grading_comment': answer.grading_comment,
                'graded_at': answer.graded_at.isoformat()
            },
            'submission': {
                'id': submission.id,
                'total_score': submission.total_score,
                'percentage': submission.get_percentage()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@answers_bp.route('/api/questions/<int:question_id>/answers/ungraded', methods=['GET'])
def get_ungraded_answers(question_id):
    """Get all ungraded text answers for a question (teacher view)"""
    try:
        question = Question.query.get_or_404(question_id)
        
        if question.question_type != 'text':
            return jsonify({'error': 'Only text questions have answers that need grading'}), 400
        
        # Get ungraded answers for this question
        ungraded_answers = Answer.query.filter_by(
            question_id=question_id,
            score=None
        ).all()
        
        answer_list = []
        for answer in ungraded_answers:
            answer_data = {
                'id': answer.id,
                'text_answer': answer.text_answer,
                'student_id': answer.student_id,
                'student_name': answer.student.name,
                'student_email': answer.student.email,
                'submission_id': answer.submission_id,
                'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None,
                'question_points': question.points
            }
            answer_list.append(answer_data)
        
        return jsonify({
            'question_id': question_id,
            'question_text': question.text,
            'question_points': question.points,
            'quiz_title': question.quiz.title,
            'ungraded_count': len(answer_list),
            'answers': answer_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@answers_bp.route('/api/quizzes/<int:quiz_id>/answers/ungraded', methods=['GET'])
def get_quiz_ungraded_answers(quiz_id):
    """Get all ungraded answers for a quiz"""
    try:
        from models import Quiz
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Get all ungraded text answers for this quiz
        ungraded_answers = db.session.query(Answer).join(Question).filter(
            Question.quiz_id == quiz_id,
            Question.question_type == 'text',
            Answer.score.is_(None)
        ).all()
        
        # Group by question
        answers_by_question = {}
        for answer in ungraded_answers:
            question_id = answer.question_id
            if question_id not in answers_by_question:
                answers_by_question[question_id] = {
                    'question_text': answer.question.text,
                    'question_points': answer.question.points,
                    'answers': []
                }
            
            answers_by_question[question_id]['answers'].append({
                'id': answer.id,
                'text_answer': answer.text_answer,
                'student_name': answer.student.name,
                'student_email': answer.student.email,
                'submitted_at': answer.submitted_at.isoformat() if answer.submitted_at else None
            })
        
        return jsonify({
            'quiz_id': quiz_id,
            'quiz_title': quiz.title,
            'total_ungraded': len(ungraded_answers),
            'questions': answers_by_question
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@answers_bp.route('/api/answers/bulk-grade', methods=['PUT'])
def bulk_grade_answers():
    """Grade multiple answers at once"""
    try:
        data = request.get_json()
        
        if 'graded_by' not in data:
            return jsonify({'error': 'Grader ID is required'}), 400
        
        if 'answers' not in data or not data['answers']:
            return jsonify({'error': 'Answers list is required'}), 400
        
        # Validate grader is a teacher
        grader = User.query.get_or_404(data['graded_by'])
        if grader.role != 'teacher':
            return jsonify({'error': 'Only teachers can grade answers'}), 403
        
        graded_answers = []
        submission_ids = set()
        
        for answer_grade in data['answers']:
            answer_id = answer_grade.get('answer_id')
            score = answer_grade.get('score')
            comment = answer_grade.get('comment', '')
            
            if not answer_id or score is None:
                continue
            
            answer = Answer.query.get(answer_id)
            if not answer:
                continue
            
            # Validate score
            if score < 0 or score > answer.question.points:
                continue
            
            # Update answer
            answer.score = score
            answer.graded_by = data['graded_by']
            answer.graded_at = datetime.utcnow()
            answer.grading_comment = comment
            
            graded_answers.append({
                'answer_id': answer.id,
                'score': score,
                'max_points': answer.question.points
            })
            
            submission_ids.add(answer.submission_id)
        
        # Update submission grading status for affected submissions
        for submission_id in submission_ids:
            submission = QuizSubmission.query.get(submission_id)
            if submission:
                # Check if all text answers are graded
                ungraded_count = Answer.query.join(Question).filter(
                    Answer.submission_id == submission_id,
                    Question.question_type == 'text',
                    Answer.score.is_(None)
                ).count()
                
                if ungraded_count == 0:
                    # Calculate manual graded score
                    submission.manual_graded_score = sum([
                        ans.score for ans in submission.answers 
                        if ans.question.question_type == 'text' and ans.score is not None
                    ])
                    
                    submission.calculate_total_score()
                    submission.is_graded = True
                    submission.graded_at = datetime.utcnow()
                    submission.graded_by = data['graded_by']
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully graded {len(graded_answers)} answers',
            'graded_answers': graded_answers,
            'updated_submissions': len(submission_ids)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
