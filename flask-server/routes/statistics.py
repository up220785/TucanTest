from flask import Blueprint, request, jsonify
from models import db, Course, Quiz, QuizSubmission, User, Enrollment, GradeThreshold
from datetime import datetime
from sqlalchemy import func

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/api/courses/<int:course_id>/statistics', methods=['GET'])
def get_course_statistics(course_id):
    """Get comprehensive statistics for a course"""
    try:
        course = Course.query.get_or_404(course_id)
        
        # Get all enrolled students
        enrollments = Enrollment.query.filter_by(
            course_id=course_id,
            status='accepted'
        ).count()
        
        # Get all quizzes in the course
        quizzes = Quiz.query.filter_by(course_id=course_id, is_published=True).all()
        
        if not quizzes:
            return jsonify({
                'course_id': course_id,
                'course_name': course.name,
                'total_students': enrollments,
                'total_quizzes': 0,
                'message': 'No published quizzes in this course'
            })
        
        # Get all graded submissions for the course
        submissions = db.session.query(QuizSubmission).join(Quiz).filter(
            Quiz.course_id == course_id,
            QuizSubmission.is_graded == True
        ).all()
        
        if not submissions:
            return jsonify({
                'course_id': course_id,
                'course_name': course.name,
                'total_students': enrollments,
                'total_quizzes': len(quizzes),
                'message': 'No graded submissions yet'
            })
        
        # Calculate overall course statistics
        percentages = [submission.get_percentage() for submission in submissions]
        
        # Get grade thresholds
        threshold = GradeThreshold.query.filter_by(course_id=course_id).first()
        if not threshold:
            threshold = GradeThreshold.query.filter_by(course_id=None, quiz_id=None).first()
        
        if not threshold:
            # Default thresholds
            excellent_threshold = 90.0
            good_threshold = 80.0
            passing_threshold = 60.0
        else:
            excellent_threshold = threshold.excellent_threshold
            good_threshold = threshold.good_threshold
            passing_threshold = threshold.passing_threshold
        
        # Categorize scores
        excellent_scores = [p for p in percentages if p >= excellent_threshold]
        good_scores = [p for p in percentages if good_threshold <= p < excellent_threshold]
        passing_scores = [p for p in percentages if passing_threshold <= p < good_threshold]
        failing_scores = [p for p in percentages if p < passing_threshold]
        
        # Calculate student averages (average across all their quiz submissions)
        student_averages = {}
        for submission in submissions:
            student_id = submission.student_id
            if student_id not in student_averages:
                student_averages[student_id] = []
            student_averages[student_id].append(submission.get_percentage())
        
        # Calculate each student's average
        student_avg_percentages = [
            sum(scores) / len(scores) for scores in student_averages.values()
        ]
        
        # Quiz-specific statistics
        quiz_stats = []
        for quiz in quizzes:
            quiz_submissions = [s for s in submissions if s.quiz_id == quiz.id]
            if quiz_submissions:
                quiz_percentages = [s.get_percentage() for s in quiz_submissions]
                quiz_stats.append({
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'total_submissions': len(quiz_submissions),
                    'average_score': round(sum(quiz_percentages) / len(quiz_percentages), 2),
                    'highest_score': max(quiz_percentages),
                    'lowest_score': min(quiz_percentages),
                    'completion_rate': round((len(quiz_submissions) / enrollments) * 100, 2) if enrollments > 0 else 0
                })
        
        # Student submission rankings (most to least submissions)
        student_submission_counts = {}
        for submission in submissions:
            student_id = submission.student_id
            if student_id not in student_submission_counts:
                student_submission_counts[student_id] = {
                    'student_id': student_id,
                    'student_name': submission.student.name,
                    'student_email': submission.student.email,
                    'submission_count': 0,
                    'total_score': 0,
                    'total_possible': 0,
                    'graded_submissions': 0
                }
            student_submission_counts[student_id]['submission_count'] += 1
            if submission.is_graded:
                student_submission_counts[student_id]['total_score'] += submission.total_score
                student_submission_counts[student_id]['total_possible'] += submission.max_possible_score
                student_submission_counts[student_id]['graded_submissions'] += 1

        # Calculate accumulated grades for each student
        student_rankings_by_submissions = []
        student_rankings_by_grades = []
        
        for student_data in student_submission_counts.values():
            # For submission ranking
            student_rankings_by_submissions.append({
                'student_id': student_data['student_id'],
                'student_name': student_data['student_name'],
                'student_email': student_data['student_email'],
                'submission_count': student_data['submission_count'],
                'graded_submissions': student_data['graded_submissions']
            })
            
            # For grade ranking (only if they have graded submissions)
            if student_data['graded_submissions'] > 0:
                accumulated_percentage = (student_data['total_score'] / student_data['total_possible']) * 100
                student_rankings_by_grades.append({
                    'student_id': student_data['student_id'],
                    'student_name': student_data['student_name'],
                    'student_email': student_data['student_email'],
                    'accumulated_score': student_data['total_score'],
                    'total_possible': student_data['total_possible'],
                    'accumulated_percentage': round(accumulated_percentage, 2),
                    'graded_submissions': student_data['graded_submissions']
                })

        # Sort rankings
        student_rankings_by_submissions.sort(key=lambda x: x['submission_count'], reverse=True)
        student_rankings_by_grades.sort(key=lambda x: x['accumulated_percentage'], reverse=True)

        # Add ranks
        for i, student in enumerate(student_rankings_by_submissions):
            student['rank'] = i + 1
        
        for i, student in enumerate(student_rankings_by_grades):
            student['rank'] = i + 1

        # Students who haven't submitted anything
        submitted_student_ids = set(student_submission_counts.keys())
        enrolled_students = db.session.query(User).join(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == 'accepted'
        ).all()
        
        students_no_submissions = []
        for student in enrolled_students:
            if student.id not in submitted_student_ids:
                students_no_submissions.append({
                    'student_id': student.id,
                    'student_name': student.name,
                    'student_email': student.email
                })

        return jsonify({
            'course_id': course_id,
            'course_name': course.name,
            'total_students': enrollments,
            'total_quizzes': len(quizzes),
            'total_submissions': len(submissions),
            'overall_statistics': {
                'class_average': round(sum(percentages) / len(percentages), 2),
                'student_class_average': round(sum(student_avg_percentages) / len(student_avg_percentages), 2) if student_avg_percentages else 0,
                'highest_score': max(percentages),
                'lowest_score': min(percentages),
                'total_excellent': len(excellent_scores),
                'total_good': len(good_scores),
                'total_passing': len(passing_scores),
                'total_failing': len(failing_scores),
                'excellent_percentage': round((len(excellent_scores) / len(percentages)) * 100, 2),
                'good_percentage': round((len(good_scores) / len(percentages)) * 100, 2),
                'passing_percentage': round((len(passing_scores) / len(percentages)) * 100, 2),
                'failing_percentage': round((len(failing_scores) / len(percentages)) * 100, 2)
            },
            'grade_thresholds': {
                'excellent': excellent_threshold,
                'good': good_threshold,
                'passing': passing_threshold
            },
            'quiz_statistics': quiz_stats,
            'student_rankings': {
                'by_submissions': student_rankings_by_submissions,
                'by_grades': student_rankings_by_grades,
                'no_submissions': students_no_submissions
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistics_bp.route('/api/quizzes/<int:quiz_id>/statistics', methods=['GET'])
def get_quiz_statistics(quiz_id):
    """Get detailed statistics for a specific quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Get all submissions for this quiz
        submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
        graded_submissions = [s for s in submissions if s.is_graded]
        
        # Get enrolled students count
        enrolled_count = Enrollment.query.filter_by(
            course_id=quiz.course_id,
            status='accepted'
        ).count()
        
        if not graded_submissions:
            return jsonify({
                'quiz_id': quiz_id,
                'quiz_title': quiz.title,
                'course_name': quiz.course.name,
                'total_enrolled': enrolled_count,
                'total_submissions': len(submissions),
                'graded_submissions': 0,
                'message': 'No graded submissions yet'
            })
        
        # Calculate statistics
        percentages = [submission.get_percentage() for submission in graded_submissions]
        scores = [submission.total_score for submission in graded_submissions]
        
        # Get grade thresholds
        threshold = GradeThreshold.query.filter_by(quiz_id=quiz_id).first()
        if not threshold:
            threshold = GradeThreshold.query.filter_by(course_id=quiz.course_id, quiz_id=None).first()
        if not threshold:
            threshold = GradeThreshold.query.filter_by(course_id=None, quiz_id=None).first()
        
        if not threshold:
            excellent_threshold = 90.0
            good_threshold = 80.0
            passing_threshold = 60.0
        else:
            excellent_threshold = threshold.excellent_threshold
            good_threshold = threshold.good_threshold
            passing_threshold = threshold.passing_threshold
        
        # Categorize scores
        excellent_scores = [p for p in percentages if p >= excellent_threshold]
        good_scores = [p for p in percentages if good_threshold <= p < excellent_threshold]
        passing_scores = [p for p in percentages if passing_threshold <= p < good_threshold]
        failing_scores = [p for p in percentages if p < passing_threshold]
        
        # Create score distribution
        score_distribution = {}
        for percentage in percentages:
            bucket = int(percentage // 10) * 10  # 0-9, 10-19, etc.
            bucket_label = f"{bucket}-{bucket + 9}%"
            if bucket == 100:
                bucket_label = "100%"
            score_distribution[bucket_label] = score_distribution.get(bucket_label, 0) + 1
        
        # Student performance ranking
        student_rankings = []
        for submission in graded_submissions:
            student_rankings.append({
                'student_id': submission.student_id,
                'student_name': submission.student.name,
                'student_email': submission.student.email,
                'score': submission.total_score,
                'max_score': submission.max_possible_score,
                'percentage': submission.get_percentage(),
                'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None
            })
        
        # Sort by percentage (highest first)
        student_rankings.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Add rank
        for i, student in enumerate(student_rankings):
            student['rank'] = i + 1
        
        # Students who haven't submitted
        submitted_student_ids = {s.student_id for s in submissions}
        enrolled_students = db.session.query(User).join(Enrollment).filter(
            Enrollment.course_id == quiz.course_id,
            Enrollment.status == 'accepted'
        ).all()
        
        missing_submissions = []
        for student in enrolled_students:
            if student.id not in submitted_student_ids:
                missing_submissions.append({
                    'student_id': student.id,
                    'student_name': student.name,
                    'student_email': student.email
                })
        
        return jsonify({
            'quiz_id': quiz_id,
            'quiz_title': quiz.title,
            'course_name': quiz.course.name,
            'quiz_description': quiz.description,
            'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
            'max_possible_score': quiz.get_total_points(),
            'total_enrolled': enrolled_count,
            'total_submissions': len(submissions),
            'graded_submissions': len(graded_submissions),
            'completion_rate': round((len(submissions) / enrolled_count) * 100, 2) if enrolled_count > 0 else 0,
            'overall_statistics': {
                'average_score': round(sum(scores) / len(scores), 2),
                'average_percentage': round(sum(percentages) / len(percentages), 2),
                'highest_score': max(scores),
                'lowest_score': min(scores),
                'highest_percentage': max(percentages),
                'lowest_percentage': min(percentages),
                'median_percentage': sorted(percentages)[len(percentages) // 2],
                'total_excellent': len(excellent_scores),
                'total_good': len(good_scores),
                'total_passing': len(passing_scores),
                'total_failing': len(failing_scores),
                'excellent_percentage': round((len(excellent_scores) / len(percentages)) * 100, 2),
                'good_percentage': round((len(good_scores) / len(percentages)) * 100, 2),
                'passing_percentage': round((len(passing_scores) / len(percentages)) * 100, 2),
                'failing_percentage': round((len(failing_scores) / len(percentages)) * 100, 2)
            },
            'grade_thresholds': {
                'excellent': excellent_threshold,
                'good': good_threshold,
                'passing': passing_threshold
            },
            'score_distribution': score_distribution,
            'student_rankings': student_rankings,
            'missing_submissions': missing_submissions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistics_bp.route('/api/students/<int:student_id>/statistics', methods=['GET'])
def get_student_statistics(student_id):
    """Get personal statistics for a student"""
    try:
        student = User.query.get_or_404(student_id)
        
        if student.role != 'student':
            return jsonify({'error': 'Only students have quiz statistics'}), 403
        
        # Get query parameters
        course_id = request.args.get('course_id', type=int)
        
        # Get student's enrollments
        enrollments_query = Enrollment.query.filter_by(
            student_id=student_id,
            status='accepted'
        )
        
        if course_id:
            enrollments_query = enrollments_query.filter_by(course_id=course_id)
        
        enrollments = enrollments_query.all()
        
        if not enrollments:
            return jsonify({
                'student_id': student_id,
                'student_name': student.name,
                'message': 'No enrollments found'
            })
        
        # Get submissions for enrolled courses
        course_ids = [e.course_id for e in enrollments]
        submissions = db.session.query(QuizSubmission).join(Quiz).filter(
            Quiz.course_id.in_(course_ids),
            QuizSubmission.student_id == student_id
        ).all()
        
        graded_submissions = [s for s in submissions if s.is_graded]
        
        if not graded_submissions:
            return jsonify({
                'student_id': student_id,
                'student_name': student.name,
                'total_courses': len(enrollments),
                'total_submissions': len(submissions),
                'graded_submissions': 0,
                'message': 'No graded submissions yet'
            })
        
        # Calculate overall statistics
        percentages = [s.get_percentage() for s in graded_submissions]
        scores = [s.total_score for s in graded_submissions]
        max_scores = [s.max_possible_score for s in graded_submissions]
        
        # Course-specific statistics
        course_stats = {}
        for enrollment in enrollments:
            course = enrollment.course
            course_submissions = [s for s in graded_submissions if s.quiz.course_id == course.id]
            
            if course_submissions:
                course_percentages = [s.get_percentage() for s in course_submissions]
                course_stats[course.id] = {
                    'course_name': course.name,
                    'total_quizzes_taken': len(course_submissions),
                    'average_score': round(sum(course_percentages) / len(course_percentages), 2),
                    'highest_score': max(course_percentages),
                    'lowest_score': min(course_percentages),
                    'latest_quiz': {
                        'title': course_submissions[-1].quiz.title,
                        'score': course_submissions[-1].get_percentage(),
                        'submitted_at': course_submissions[-1].submitted_at.isoformat()
                    } if course_submissions else None
                }
        
        # Recent quiz performance (last 5 quizzes)
        recent_submissions = sorted(graded_submissions, key=lambda x: x.submitted_at, reverse=True)[:5]
        recent_performance = []
        for submission in recent_submissions:
            recent_performance.append({
                'quiz_title': submission.quiz.title,
                'course_name': submission.quiz.course.name,
                'score': submission.total_score,
                'max_score': submission.max_possible_score,
                'percentage': submission.get_percentage(),
                'submitted_at': submission.submitted_at.isoformat()
            })
        
        # Performance trend (improvement/decline over time)
        if len(graded_submissions) >= 2:
            sorted_submissions = sorted(graded_submissions, key=lambda x: x.submitted_at)
            first_half = sorted_submissions[:len(sorted_submissions)//2]
            second_half = sorted_submissions[len(sorted_submissions)//2:]
            
            first_half_avg = sum(s.get_percentage() for s in first_half) / len(first_half)
            second_half_avg = sum(s.get_percentage() for s in second_half) / len(second_half)
            
            trend = 'improving' if second_half_avg > first_half_avg else 'declining' if second_half_avg < first_half_avg else 'stable'
            trend_change = second_half_avg - first_half_avg
        else:
            trend = 'insufficient_data'
            trend_change = 0
        
        return jsonify({
            'student_id': student_id,
            'student_name': student.name,
            'student_email': student.email,
            'total_courses': len(enrollments),
            'total_submissions': len(submissions),
            'graded_submissions': len(graded_submissions),
            'overall_statistics': {
                'overall_average': round(sum(percentages) / len(percentages), 2),
                'highest_score': max(percentages),
                'lowest_score': min(percentages),
                'total_points_earned': sum(scores),
                'total_points_possible': sum(max_scores),
                'overall_percentage': round((sum(scores) / sum(max_scores)) * 100, 2) if sum(max_scores) > 0 else 0
            },
            'performance_trend': {
                'trend': trend,
                'change_percentage': round(trend_change, 2)
            },
            'course_statistics': course_stats,
            'recent_performance': recent_performance
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistics_bp.route('/api/teachers/<int:teacher_id>/statistics', methods=['GET'])
def get_teacher_statistics(teacher_id):
    """Get comprehensive statistics for a teacher"""
    try:
        teacher = User.query.get_or_404(teacher_id)
        
        if teacher.role != 'teacher':
            return jsonify({'error': 'Only teachers have teaching statistics'}), 403
        
        # Get teacher's courses
        courses = Course.query.filter_by(teacher_id=teacher_id).all()
        
        if not courses:
            return jsonify({
                'teacher_id': teacher_id,
                'teacher_name': teacher.name,
                'message': 'No courses found'
            })
        
        # Get overall statistics
        total_courses = len(courses)
        published_courses = len([c for c in courses if c.is_published])
        
        # Get total enrollments across all courses
        total_enrollments = db.session.query(func.count(Enrollment.id)).filter(
            Enrollment.course_id.in_([c.id for c in courses]),
            Enrollment.status == 'accepted'
        ).scalar()
        
        # Get all quizzes
        all_quizzes = []
        for course in courses:
            all_quizzes.extend(course.quizzes)
        
        total_quizzes = len(all_quizzes)
        published_quizzes = len([q for q in all_quizzes if q.is_published])
        
        # Get all submissions across teacher's courses
        course_ids = [c.id for c in courses]
        total_submissions = db.session.query(func.count(QuizSubmission.id)).join(Quiz).filter(
            Quiz.course_id.in_(course_ids)
        ).scalar()
        
        graded_submissions = db.session.query(func.count(QuizSubmission.id)).join(Quiz).filter(
            Quiz.course_id.in_(course_ids),
            QuizSubmission.is_graded == True
        ).scalar()
        
        # Course statistics
        course_stats = []
        for course in courses:
            course_enrollments = course.get_enrolled_count()
            course_quizzes = len(course.quizzes)
            published_course_quizzes = len([q for q in course.quizzes if q.is_published])
            
            # Get submissions for this course
            course_submissions = db.session.query(QuizSubmission).join(Quiz).filter(
                Quiz.course_id == course.id,
                QuizSubmission.is_graded == True
            ).all()
            
            if course_submissions:
                avg_score = sum(s.get_percentage() for s in course_submissions) / len(course_submissions)
            else:
                avg_score = 0
            
            course_stats.append({
                'course_id': course.id,
                'course_name': course.name,
                'is_published': course.is_published,
                'total_students': course_enrollments,
                'total_quizzes': course_quizzes,
                'published_quizzes': published_course_quizzes,
                'total_submissions': len(course_submissions),
                'average_course_score': round(avg_score, 2),
                'created_at': course.created_at.isoformat() if course.created_at else None
            })
        
        # Recent activity
        recent_submissions = db.session.query(QuizSubmission).join(Quiz).filter(
            Quiz.course_id.in_(course_ids)
        ).order_by(QuizSubmission.submitted_at.desc()).limit(10).all()
        
        recent_activity = []
        for submission in recent_submissions:
            recent_activity.append({
                'student_name': submission.student.name,
                'quiz_title': submission.quiz.title,
                'course_name': submission.quiz.course.name,
                'submitted_at': submission.submitted_at.isoformat(),
                'is_graded': submission.is_graded,
                'score': submission.get_percentage() if submission.is_graded else None
            })
        
        return jsonify({
            'teacher_id': teacher_id,
            'teacher_name': teacher.name,
            'teacher_email': teacher.email,
            'overall_statistics': {
                'total_courses': total_courses,
                'published_courses': published_courses,
                'total_students': total_enrollments,
                'total_quizzes': total_quizzes,
                'published_quizzes': published_quizzes,
                'total_submissions': total_submissions,
                'graded_submissions': graded_submissions,
                'pending_grading': total_submissions - graded_submissions
            },
            'course_statistics': course_stats,
            'recent_activity': recent_activity
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistics_bp.route('/api/grade-thresholds', methods=['GET'])
def get_grade_thresholds():
    """Get grade thresholds for a course or quiz"""
    try:
        course_id = request.args.get('course_id', type=int)
        quiz_id = request.args.get('quiz_id', type=int)
        
        # Try to find specific thresholds first
        threshold = None
        
        if quiz_id:
            threshold = GradeThreshold.query.filter_by(quiz_id=quiz_id).first()
        
        if not threshold and course_id:
            threshold = GradeThreshold.query.filter_by(course_id=course_id, quiz_id=None).first()
        
        if not threshold:
            threshold = GradeThreshold.query.filter_by(course_id=None, quiz_id=None).first()
        
        if threshold:
            return jsonify({
                'excellent_threshold': threshold.excellent_threshold,
                'good_threshold': threshold.good_threshold,
                'passing_threshold': threshold.passing_threshold,
                'source': 'quiz' if threshold.quiz_id else 'course' if threshold.course_id else 'system'
            })
        else:
            # Return default values
            return jsonify({
                'excellent_threshold': 90.0,
                'good_threshold': 80.0,
                'passing_threshold': 60.0,
                'source': 'default'
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistics_bp.route('/api/grade-thresholds', methods=['POST'])
def set_grade_thresholds():
    """Set grade thresholds for a course or quiz"""
    try:
        data = request.get_json()
        
        # Validate thresholds
        excellent = data.get('excellent_threshold', 90.0)
        good = data.get('good_threshold', 80.0)
        passing = data.get('passing_threshold', 60.0)
        
        if not (0 <= passing <= good <= excellent <= 100):
            return jsonify({'error': 'Invalid threshold values. Must be: 0 ≤ passing ≤ good ≤ excellent ≤ 100'}), 400
        
        course_id = data.get('course_id')
        quiz_id = data.get('quiz_id')
        
        # Check if threshold already exists
        threshold = None
        if quiz_id:
            threshold = GradeThreshold.query.filter_by(quiz_id=quiz_id).first()
        elif course_id:
            threshold = GradeThreshold.query.filter_by(course_id=course_id, quiz_id=None).first()
        else:
            threshold = GradeThreshold.query.filter_by(course_id=None, quiz_id=None).first()
        
        if threshold:
            # Update existing
            threshold.excellent_threshold = excellent
            threshold.good_threshold = good
            threshold.passing_threshold = passing
            message = 'Grade thresholds updated successfully'
        else:
            # Create new
            threshold = GradeThreshold(
                course_id=course_id,
                quiz_id=quiz_id,
                excellent_threshold=excellent,
                good_threshold=good,
                passing_threshold=passing
            )
            db.session.add(threshold)
            message = 'Grade thresholds set successfully'
        
        db.session.commit()
        
        return jsonify({
            'message': message,
            'thresholds': {
                'excellent_threshold': threshold.excellent_threshold,
                'good_threshold': threshold.good_threshold,
                'passing_threshold': threshold.passing_threshold
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
