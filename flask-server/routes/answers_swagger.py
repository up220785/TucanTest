from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Answer, QuizSubmission, Quiz, Question, User, Course, Enrollment, Option
from datetime import datetime
from auth import require_auth, require_student, require_teacher

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
    @require_student
    def post(self, current_user=None):
        """Submit an answer to a question (students only)"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['question_id', 'submission_id']
            for field in required_fields:
                if field not in data or data[field] is None:
                    answers_ns.abort(400, f'{field} is required')
            
            # Validate that the entities exist
            submission = QuizSubmission.query.get_or_404(data['submission_id'])
            question = Question.query.get_or_404(data['question_id'])
            
            # Ensure the student can only submit answers for their own submissions
            if submission.student_id != current_user.id:
                answers_ns.abort(403, 'Access denied. You can only submit answers for your own quiz attempts.')
            
            # Check if answer already exists for this question/student/submission
            existing_answer = Answer.query.filter_by(
                question_id=data['question_id'],
                student_id=current_user.id,
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
                student_id=current_user.id,  # Use authenticated user's ID
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

@answers_ns.route('/submissions/<int:submission_id>/complete')
class CompleteSubmissionAPI(Resource):
    @answers_ns.doc('complete_submission', security='Bearer')
    @answers_ns.response(200, 'Submission completed successfully')
    @answers_ns.response(400, 'Submission already completed or invalid')
    @answers_ns.response(404, 'Submission not found')
    @answers_ns.response(401, 'Authentication required')
    @answers_ns.response(403, 'Student access required')
    @require_student
    def post(self, submission_id, current_user=None):
        """Complete a quiz submission (students only)"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            
            # Verify the submission belongs to the current student
            if submission.student_id != current_user.id:
                answers_ns.abort(403, 'You can only complete your own submissions')
            
            # Check if already completed
            if submission.is_completed:
                answers_ns.abort(400, 'Submission is already completed')
            
            # Mark as completed
            submission.is_completed = True
            submission.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'message': 'Quiz submission completed successfully',
                'submission_id': submission.id,
                'completed_at': submission.completed_at.isoformat()
            }
            
        except Exception as e:
            db.session.rollback()
            answers_ns.abort(500, str(e))

# Student quiz results models
student_answer_result_model = answers_ns.model('StudentAnswerResult', {
    'question_id': fields.Integer(description='Question ID'),
    'question_text': fields.String(description='Question text'),
    'question_type': fields.String(description='Question type'),
    'question_points': fields.Float(description='Maximum points for this question'),
    'student_answer': fields.String(description='Student\'s answer text or selected option'),
    'correct_answer': fields.String(description='Correct answer'),
    'is_correct': fields.Boolean(description='Whether student answer is correct'),
    'points_earned': fields.Float(description='Points earned for this question'),
    'feedback': fields.String(description='Teacher feedback if any')
})

student_quiz_result_model = answers_ns.model('StudentQuizResult', {
    'submission_id': fields.Integer(description='Submission ID'),
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'total_score': fields.Float(description='Total score earned'),
    'max_possible_score': fields.Float(description='Maximum possible score'),
    'percentage': fields.Float(description='Percentage score'),
    'is_graded': fields.Boolean(description='Whether quiz is graded'),
    'graded_at': fields.DateTime(description='When quiz was graded'),
    'attempt_number': fields.Integer(description='Attempt number'),
    'completed_at': fields.DateTime(description='When quiz was completed'),
    'answers': fields.List(fields.Nested(student_answer_result_model), description='Answer details')
})

@answers_ns.route('/quiz-results/<int:submission_id>')
class StudentQuizResultAPI(Resource):
    @answers_ns.doc('get_student_quiz_result', security='Bearer')
    @answers_ns.marshal_with(student_quiz_result_model)
    @answers_ns.response(404, 'Submission not found')
    @answers_ns.response(401, 'Authentication required')
    @answers_ns.response(403, 'Access denied')
    @require_student
    def get(self, submission_id, current_user=None):
        """Get student's quiz results with scores and correct answers (students only)"""
        try:
            submission = QuizSubmission.query.get_or_404(submission_id)
            
            # Verify the submission belongs to the current student
            if submission.student_id != current_user.id:
                answers_ns.abort(403, 'You can only view your own quiz results')
            
            # Check if quiz is graded
            if not submission.is_graded:
                answers_ns.abort(400, 'Quiz has not been graded yet')
            
            quiz = Quiz.query.get(submission.quiz_id)
            answers = Answer.query.filter_by(submission_id=submission_id).all()
            
            # Calculate total possible score
            questions = Question.query.filter_by(quiz_id=submission.quiz_id).all()
            max_possible_score = sum(q.points for q in questions)
            
            # Prepare answer results
            answer_results = []
            for answer in answers:
                question = Question.query.get(answer.question_id)
                
                # Get student's answer text
                student_answer = ""
                if answer.option_id:
                    selected_option = Option.query.get(answer.option_id)
                    student_answer = selected_option.text if selected_option else "Unknown option"
                elif answer.text_answer:
                    student_answer = answer.text_answer
                
                # Get correct answer
                correct_answer = ""
                is_correct = False
                if question.question_type in ['multiple_choice', 'true_false']:
                    correct_option = Option.query.filter_by(question_id=question.id, is_correct=True).first()
                    if correct_option:
                        correct_answer = correct_option.text
                        is_correct = (answer.option_id == correct_option.id)
                else:
                    # For text questions, we can't automatically determine correctness
                    correct_answer = "Teacher will review"
                    # Check if points were awarded to determine correctness
                    is_correct = (answer.score and answer.score > 0) if answer.score is not None else False
                
                answer_data = {
                    'question_id': question.id,
                    'question_text': question.text,
                    'question_type': question.question_type,
                    'question_points': question.points,
                    'student_answer': student_answer,
                    'correct_answer': correct_answer,
                    'is_correct': is_correct,
                    'points_earned': answer.score if answer.score is not None else 0,
                    'feedback': answer.grading_comment
                }
                answer_results.append(answer_data)
            
            # Calculate percentage
            percentage = (submission.total_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            return {
                'submission_id': submission.id,
                'quiz_id': submission.quiz_id,
                'quiz_title': quiz.title if quiz else 'Unknown Quiz',
                'total_score': submission.total_score,
                'max_possible_score': max_possible_score,
                'percentage': round(percentage, 2),
                'is_graded': submission.is_graded,
                'graded_at': submission.graded_at,
                'attempt_number': submission.attempt_number,
                'completed_at': submission.completed_at,
                'answers': answer_results
            }
            
        except Exception as e:
            answers_ns.abort(500, str(e))

@answers_ns.route('/my-quiz-results')
class MyQuizResultsAPI(Resource):
    @answers_ns.doc('get_my_quiz_results', security='Bearer')
    @answers_ns.marshal_list_with(answers_ns.model('QuizResultSummary', {
        'submission_id': fields.Integer(description='Submission ID'),
        'quiz_id': fields.Integer(description='Quiz ID'),
        'quiz_title': fields.String(description='Quiz title'),
        'total_score': fields.Float(description='Total score earned'),
        'max_possible_score': fields.Float(description='Maximum possible score'),
        'percentage': fields.Float(description='Percentage score'),
        'is_graded': fields.Boolean(description='Whether quiz is graded'),
        'graded_at': fields.DateTime(description='When quiz was graded'),
        'completed_at': fields.DateTime(description='When quiz was completed')
    }))
    @answers_ns.response(401, 'Authentication required')
    @answers_ns.response(403, 'Student access required')
    @require_student
    def get(self, current_user=None):
        """Get all quiz results for the current student"""
        try:
            submissions = QuizSubmission.query.filter_by(
                student_id=current_user.id,
                is_graded=True
            ).all()
            
            results = []
            for submission in submissions:
                quiz = Quiz.query.get(submission.quiz_id)
                
                # Calculate max possible score
                questions = Question.query.filter_by(quiz_id=submission.quiz_id).all()
                max_possible_score = sum(q.points for q in questions)
                
                # Calculate percentage
                percentage = (submission.total_score / max_possible_score * 100) if max_possible_score > 0 else 0
                
                result_data = {
                    'submission_id': submission.id,
                    'quiz_id': submission.quiz_id,
                    'quiz_title': quiz.title if quiz else 'Unknown Quiz',
                    'total_score': submission.total_score,
                    'max_possible_score': max_possible_score,
                    'percentage': round(percentage, 2),
                    'is_graded': submission.is_graded,
                    'graded_at': submission.graded_at,
                    'completed_at': submission.completed_at
                }
                results.append(result_data)
            
            return results
            
        except Exception as e:
            answers_ns.abort(500, str(e))

# Course statistics models
course_quiz_summary_model = answers_ns.model('CourseQuizSummary', {
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'student_score': fields.Float(description='Student\'s score on this quiz'),
    'max_possible_score': fields.Float(description='Maximum possible score for this quiz'),
    'percentage': fields.Float(description='Percentage score for this quiz'),
    'is_graded': fields.Boolean(description='Whether quiz is graded'),
    'graded_at': fields.DateTime(description='When quiz was graded'),
    'attempt_number': fields.Integer(description='Attempt number')
})

course_statistics_model = answers_ns.model('CourseStatistics', {
    'course_id': fields.Integer(description='Course ID'),
    'course_title': fields.String(description='Course title'),
    'total_quizzes': fields.Integer(description='Total number of quizzes in course'),
    'completed_quizzes': fields.Integer(description='Number of quizzes student has completed'),
    'graded_quizzes': fields.Integer(description='Number of quizzes that have been graded'),
    'total_score_earned': fields.Float(description='Total points earned across all quizzes'),
    'total_possible_score': fields.Float(description='Total possible points across all quizzes'),
    'overall_percentage': fields.Float(description='Overall percentage in the course'),
    'average_quiz_percentage': fields.Float(description='Average percentage across completed quizzes'),
    'quiz_details': fields.List(fields.Nested(course_quiz_summary_model), description='Individual quiz results')
})

@answers_ns.route('/course-statistics/<int:course_id>')
class CourseStatisticsAPI(Resource):
    @answers_ns.doc('get_course_statistics', security='Bearer')
    @answers_ns.marshal_with(course_statistics_model)
    @answers_ns.response(404, 'Course not found')
    @answers_ns.response(401, 'Authentication required')
    @answers_ns.response(403, 'Student access required or not enrolled')
    @require_student
    def get(self, course_id, current_user=None):
        """Get student's overall statistics for a specific course"""
        try:
            course = Course.query.get_or_404(course_id)
            
            # Check if student is enrolled in the course
            enrollment = Enrollment.query.filter_by(
                student_id=current_user.id, 
                course_id=course_id
            ).first()
            
            if not enrollment:
                answers_ns.abort(403, 'You are not enrolled in this course')
            
            # Get all quizzes for this course
            quizzes = Quiz.query.filter_by(course_id=course_id).all()
            
            if not quizzes:
                return {
                    'course_id': course_id,
                    'course_title': course.name,
                    'total_quizzes': 0,
                    'completed_quizzes': 0,
                    'graded_quizzes': 0,
                    'total_score_earned': 0,
                    'total_possible_score': 0,
                    'overall_percentage': 0,
                    'average_quiz_percentage': 0,
                    'quiz_details': []
                }
            
            quiz_details = []
            total_score_earned = 0
            total_possible_score = 0
            completed_quizzes = 0
            graded_quizzes = 0
            quiz_percentages = []
            
            for quiz in quizzes:
                # Get student's submission for this quiz
                submission = QuizSubmission.query.filter_by(
                    quiz_id=quiz.id,
                    student_id=current_user.id,
                    is_completed=True
                ).first()
                
                # Calculate max possible score for this quiz
                questions = Question.query.filter_by(quiz_id=quiz.id).all()
                max_quiz_score = sum(q.points for q in questions)
                total_possible_score += max_quiz_score
                
                quiz_data = {
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'student_score': 0,
                    'max_possible_score': max_quiz_score,
                    'percentage': 0,
                    'is_graded': False,
                    'graded_at': None,
                    'attempt_number': 0
                }
                
                if submission:
                    completed_quizzes += 1
                    quiz_data['attempt_number'] = submission.attempt_number
                    
                    if submission.is_graded:
                        graded_quizzes += 1
                        student_score = submission.total_score or 0
                        quiz_data['student_score'] = student_score
                        quiz_data['is_graded'] = True
                        quiz_data['graded_at'] = submission.graded_at
                        
                        # Calculate percentage for this quiz
                        if max_quiz_score > 0:
                            quiz_percentage = (student_score / max_quiz_score) * 100
                            quiz_data['percentage'] = round(quiz_percentage, 2)
                            quiz_percentages.append(quiz_percentage)
                        
                        total_score_earned += student_score
                
                quiz_details.append(quiz_data)
            
            # Calculate overall statistics
            overall_percentage = (total_score_earned / total_possible_score * 100) if total_possible_score > 0 else 0
            average_quiz_percentage = (sum(quiz_percentages) / len(quiz_percentages)) if quiz_percentages else 0
            
            return {
                'course_id': course_id,
                'course_title': course.name,
                'total_quizzes': len(quizzes),
                'completed_quizzes': completed_quizzes,
                'graded_quizzes': graded_quizzes,
                'total_score_earned': total_score_earned,
                'total_possible_score': total_possible_score,
                'overall_percentage': round(overall_percentage, 2),
                'average_quiz_percentage': round(average_quiz_percentage, 2),
                'quiz_details': quiz_details
            }
            
        except Exception as e:
            answers_ns.abort(500, str(e))

@answers_ns.route('/my-course-statistics')
class MyCoursesStatisticsAPI(Resource):
    @answers_ns.doc('get_my_courses_statistics', security='Bearer')
    @answers_ns.marshal_list_with(answers_ns.model('CourseStatisticsSummary', {
        'course_id': fields.Integer(description='Course ID'),
        'course_title': fields.String(description='Course title'),
        'total_quizzes': fields.Integer(description='Total number of quizzes in course'),
        'completed_quizzes': fields.Integer(description='Number of quizzes completed'),
        'graded_quizzes': fields.Integer(description='Number of graded quizzes'),
        'overall_percentage': fields.Float(description='Overall percentage in the course'),
        'total_score_earned': fields.Float(description='Total points earned'),
        'total_possible_score': fields.Float(description='Total possible points')
    }))
    @answers_ns.response(401, 'Authentication required')
    @answers_ns.response(403, 'Student access required')
    @require_student
    def get(self, current_user=None):
        """Get student's statistics for all enrolled courses"""
        try:
            # Get all courses the student is enrolled in
            enrollments = Enrollment.query.filter_by(student_id=current_user.id).all()
            
            if not enrollments:
                return []
            
            course_statistics = []
            
            for enrollment in enrollments:
                course = Course.query.get(enrollment.course_id)
                if not course:
                    continue
                
                # Get all quizzes for this course
                quizzes = Quiz.query.filter_by(course_id=course.id).all()
                
                total_score_earned = 0
                total_possible_score = 0
                completed_quizzes = 0
                graded_quizzes = 0
                
                for quiz in quizzes:
                    # Calculate max possible score for this quiz
                    questions = Question.query.filter_by(quiz_id=quiz.id).all()
                    max_quiz_score = sum(q.points for q in questions)
                    total_possible_score += max_quiz_score
                    
                    # Get student's submission for this quiz
                    submission = QuizSubmission.query.filter_by(
                        quiz_id=quiz.id,
                        student_id=current_user.id,
                        is_completed=True
                    ).first()
                    
                    if submission:
                        completed_quizzes += 1
                        if submission.is_graded:
                            graded_quizzes += 1
                            total_score_earned += submission.total_score or 0
                
                # Calculate overall percentage
                overall_percentage = (total_score_earned / total_possible_score * 100) if total_possible_score > 0 else 0
                
                course_stat = {
                    'course_id': course.id,
                    'course_title': course.name,
                    'total_quizzes': len(quizzes),
                    'completed_quizzes': completed_quizzes,
                    'graded_quizzes': graded_quizzes,
                    'overall_percentage': round(overall_percentage, 2),
                    'total_score_earned': total_score_earned,
                    'total_possible_score': total_possible_score
                }
                course_statistics.append(course_stat)
            
            return course_statistics
            
        except Exception as e:
            answers_ns.abort(500, str(e))


