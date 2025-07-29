from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, QuizSubmission, Quiz, User, Answer, Question, Option, Course, Enrollment
from datetime import datetime
from auth import require_teacher

# Create namespace for statistics
statistics_ns = Namespace('statistics', description='Quiz statistics operations')

# Student score model for detailed statistics
student_score_model = statistics_ns.model('StudentScore', {
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'score': fields.Float(description='Student score'),
    'max_score': fields.Float(description='Maximum possible score'),
    'percentage': fields.Float(description='Percentage score'),
    'submission_date': fields.DateTime(description='Submission date'),
    'graded_date': fields.DateTime(description='Graded date'),
    'attempt_number': fields.Integer(description='Attempt number')
})

# Enhanced quiz statistics model with student details
quiz_stats_detailed_model = statistics_ns.model('QuizStatisticsDetailed', {
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'course_id': fields.Integer(description='Course ID'),
    'course_name': fields.String(description='Course name'),
    'total_submissions': fields.Integer(description='Total number of submissions'),
    'completed_submissions': fields.Integer(description='Number of completed submissions'),
    'graded_submissions': fields.Integer(description='Number of graded submissions'),
    'average_score': fields.Float(description='Average score'),
    'highest_score': fields.Float(description='Highest score'),
    'lowest_score': fields.Float(description='Lowest score'),
    'completion_rate': fields.Float(description='Completion rate percentage'),
    'max_possible_score': fields.Float(description='Maximum possible score for quiz'),
    'student_scores': fields.List(fields.Nested(student_score_model), description='Student scores sorted by score (best to worst)')
})

# Course statistics model for teachers
teacher_course_stats_model = statistics_ns.model('TeacherCourseStatistics', {
    'course_id': fields.Integer(description='Course ID'),
    'course_name': fields.String(description='Course name'),
    'total_enrolled_students': fields.Integer(description='Total enrolled students'),
    'total_quizzes': fields.Integer(description='Total number of quizzes'),
    'student_statistics': fields.List(fields.Nested(statistics_ns.model('StudentCourseStats', {
        'student_id': fields.Integer(description='Student ID'),
        'student_name': fields.String(description='Student name'),
        'student_email': fields.String(description='Student email'),
        'total_score_earned': fields.Float(description='Total points earned'),
        'total_possible_score': fields.Float(description='Total possible points'),
        'overall_percentage': fields.Float(description='Overall percentage'),
        'completed_quizzes': fields.Integer(description='Number of completed quizzes'),
        'graded_quizzes': fields.Integer(description='Number of graded quizzes')
    })), description='Student statistics sorted by overall percentage (best to worst)')
})

# Basic statistics model (for backward compatibility)
quiz_stats_model = statistics_ns.model('QuizStatistics', {
    'quiz_id': fields.Integer(description='Quiz ID'),
    'quiz_title': fields.String(description='Quiz title'),
    'total_submissions': fields.Integer(description='Total number of submissions'),
    'completed_submissions': fields.Integer(description='Number of completed submissions'),
    'graded_submissions': fields.Integer(description='Number of graded submissions'),
    'average_score': fields.Float(description='Average score'),
    'highest_score': fields.Float(description='Highest score'),
    'lowest_score': fields.Float(description='Lowest score'),
    'completion_rate': fields.Float(description='Completion rate percentage')
})

@statistics_ns.route('/quizzes/<int:quiz_id>')
class QuizStatisticsAPI(Resource):
    @statistics_ns.doc('get_quiz_statistics', security='Bearer')
    @statistics_ns.marshal_with(quiz_stats_model)
    @statistics_ns.response(404, 'Quiz not found')
    @statistics_ns.response(401, 'Authentication required')
    @statistics_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, quiz_id, current_user=None):
        """Get basic statistics for a quiz (backward compatibility)"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            
            submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
            
            if not submissions:
                return {
                    'quiz_id': quiz_id,
                    'quiz_title': quiz.title,
                    'total_submissions': 0,
                    'completed_submissions': 0,
                    'graded_submissions': 0,
                    'average_score': 0,
                    'highest_score': 0,
                    'lowest_score': 0,
                    'completion_rate': 0
                }
            
            total_submissions = len(submissions)
            completed_submissions = len([s for s in submissions if s.is_completed])
            graded_submissions = len([s for s in submissions if s.is_graded])
            
            # Calculate score statistics for graded submissions
            graded_scores = [s.total_score for s in submissions if s.is_graded and s.total_score is not None]
            
            if graded_scores:
                average_score = sum(graded_scores) / len(graded_scores)
                highest_score = max(graded_scores)
                lowest_score = min(graded_scores)
            else:
                average_score = 0
                highest_score = 0
                lowest_score = 0
            
            completion_rate = (completed_submissions / total_submissions * 100) if total_submissions > 0 else 0
            
            return {
                'quiz_id': quiz_id,
                'quiz_title': quiz.title,
                'total_submissions': total_submissions,
                'completed_submissions': completed_submissions,
                'graded_submissions': graded_submissions,
                'average_score': round(average_score, 2),
                'highest_score': highest_score,
                'lowest_score': lowest_score,
                'completion_rate': round(completion_rate, 2)
            }
            
        except Exception as e:
            statistics_ns.abort(500, str(e))

@statistics_ns.route('/quizzes/<int:quiz_id>/detailed')
class QuizStatisticsDetailedAPI(Resource):
    @statistics_ns.doc('get_quiz_statistics_detailed', security='Bearer')
    @statistics_ns.marshal_with(quiz_stats_detailed_model)
    @statistics_ns.response(404, 'Quiz not found')
    @statistics_ns.response(401, 'Authentication required')
    @statistics_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, quiz_id, current_user=None):
        """Get detailed statistics for a quiz including student scores"""
        try:
            quiz = Quiz.query.get_or_404(quiz_id)
            course = Course.query.get(quiz.course_id)
            
            # Get all submissions for this quiz
            submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
            
            # Calculate max possible score for this quiz
            questions = Question.query.filter_by(quiz_id=quiz_id).all()
            max_possible_score = sum(q.points for q in questions)
            
            if not submissions:
                return {
                    'quiz_id': quiz_id,
                    'quiz_title': quiz.title,
                    'course_id': quiz.course_id,
                    'course_name': course.name if course else 'Unknown',
                    'total_submissions': 0,
                    'completed_submissions': 0,
                    'graded_submissions': 0,
                    'average_score': 0,
                    'highest_score': 0,
                    'lowest_score': 0,
                    'completion_rate': 0,
                    'max_possible_score': max_possible_score,
                    'student_scores': []
                }
            
            total_submissions = len(submissions)
            completed_submissions = len([s for s in submissions if s.is_completed])
            graded_submissions = len([s for s in submissions if s.is_graded])
            
            # Get student scores for graded submissions
            student_scores = []
            graded_scores = []
            
            for submission in submissions:
                if submission.is_graded and submission.total_score is not None:
                    student = User.query.get(submission.student_id)
                    if student:
                        score = submission.total_score
                        percentage = (score / max_possible_score * 100) if max_possible_score > 0 else 0
                        
                        student_scores.append({
                            'student_id': student.id,
                            'student_name': student.name,
                            'student_email': student.email,
                            'score': score,
                            'max_score': max_possible_score,
                            'percentage': round(percentage, 2),
                            'submission_date': submission.completed_at,
                            'graded_date': submission.graded_at,
                            'attempt_number': submission.attempt_number
                        })
                        graded_scores.append(score)
            
            # Sort student scores by score (best to worst)
            student_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # Calculate statistics
            if graded_scores:
                average_score = sum(graded_scores) / len(graded_scores)
                highest_score = max(graded_scores)
                lowest_score = min(graded_scores)
            else:
                average_score = 0
                highest_score = 0
                lowest_score = 0
            
            completion_rate = (completed_submissions / total_submissions * 100) if total_submissions > 0 else 0
            
            return {
                'quiz_id': quiz_id,
                'quiz_title': quiz.title,
                'course_id': quiz.course_id,
                'course_name': course.name if course else 'Unknown',
                'total_submissions': total_submissions,
                'completed_submissions': completed_submissions,
                'graded_submissions': graded_submissions,
                'average_score': round(average_score, 2),
                'highest_score': highest_score,
                'lowest_score': lowest_score,
                'completion_rate': round(completion_rate, 2),
                'max_possible_score': max_possible_score,
                'student_scores': student_scores
            }
            
        except Exception as e:
            statistics_ns.abort(500, str(e))

@statistics_ns.route('/courses/<int:course_id>')
class TeacherCourseStatisticsAPI(Resource):
    @statistics_ns.doc('get_teacher_course_statistics', security='Bearer')
    @statistics_ns.marshal_with(teacher_course_stats_model)
    @statistics_ns.response(404, 'Course not found')
    @statistics_ns.response(401, 'Authentication required')
    @statistics_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, course_id, current_user=None):
        """Get course statistics with student details for teachers"""
        try:
            course = Course.query.get_or_404(course_id)
            
            # Get all students enrolled in this course
            enrollments = Enrollment.query.filter_by(course_id=course_id).all()
            enrolled_students = [User.query.get(e.student_id) for e in enrollments]
            enrolled_students = [s for s in enrolled_students if s]  # Filter out None values
            
            # Get all quizzes for this course
            quizzes = Quiz.query.filter_by(course_id=course_id).all()
            
            student_statistics = []
            
            for student in enrolled_students:
                total_score_earned = 0
                total_possible_score = 0
                completed_quizzes = 0
                graded_quizzes = 0
                
                for quiz in quizzes:
                    # Get student's submission for this quiz
                    submission = QuizSubmission.query.filter_by(
                        quiz_id=quiz.id,
                        student_id=student.id,
                        is_completed=True
                    ).first()
                    
                    # Calculate max possible score for this quiz
                    questions = Question.query.filter_by(quiz_id=quiz.id).all()
                    max_quiz_score = sum(q.points for q in questions)
                    total_possible_score += max_quiz_score
                    
                    if submission:
                        completed_quizzes += 1
                        
                        if submission.is_graded:
                            graded_quizzes += 1
                            student_score = submission.total_score or 0
                            total_score_earned += student_score
                
                # Calculate overall percentage
                overall_percentage = (total_score_earned / total_possible_score * 100) if total_possible_score > 0 else 0
                
                student_statistics.append({
                    'student_id': student.id,
                    'student_name': student.name,
                    'student_email': student.email,
                    'total_score_earned': total_score_earned,
                    'total_possible_score': total_possible_score,
                    'overall_percentage': round(overall_percentage, 2),
                    'completed_quizzes': completed_quizzes,
                    'graded_quizzes': graded_quizzes
                })
            
            # Sort students by overall percentage (best to worst)
            student_statistics.sort(key=lambda x: x['overall_percentage'], reverse=True)
            
            return {
                'course_id': course_id,
                'course_name': course.name,
                'total_enrolled_students': len(enrolled_students),
                'total_quizzes': len(quizzes),
                'student_statistics': student_statistics
            }
            
        except Exception as e:
            statistics_ns.abort(500, str(e))
