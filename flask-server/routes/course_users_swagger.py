from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Course, User, Enrollment
from datetime import datetime

# Create namespace for specialized course endpoints
course_users_ns = Namespace('course-users', description='Specialized course-user relationship operations')

# Define models for Swagger documentation
course_model = course_users_ns.model('Course', {
    'id': fields.Integer(description='Course ID'),
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'teacher_id': fields.Integer(description='Teacher ID'),
    'teacher_name': fields.String(description='Teacher name'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'max_capacity': fields.Integer(description='Maximum number of students'),
    'created_at': fields.DateTime(description='Course creation date'),
    'updated_at': fields.DateTime(description='Last update date'),
    'enrolled_count': fields.Integer(description='Number of enrolled students'),
    'quiz_count': fields.Integer(description='Number of quizzes in course')
})

@course_users_ns.route('/teachers/<int:teacher_id>/courses')
class TeacherCoursesAPI(Resource):
    @course_users_ns.doc('get_teacher_courses')
    @course_users_ns.marshal_list_with(course_model)
    @course_users_ns.response(403, 'User is not a teacher')
    @course_users_ns.response(404, 'Teacher not found')
    @course_users_ns.param('published_only', 'Filter to show only published courses', type='boolean', default=False)
    @course_users_ns.param('include_stats', 'Include detailed statistics', type='boolean', default=False)
    def get(self, teacher_id):
        """Get all courses taught by a specific teacher"""
        try:
            teacher = User.query.get_or_404(teacher_id)
            
            if teacher.role != 'teacher':
                course_users_ns.abort(403, 'User is not a teacher')
            
            # Get query parameters
            published_only = request.args.get('published_only', 'false').lower() == 'true'
            include_stats = request.args.get('include_stats', 'false').lower() == 'true'
            
            # Build query
            query = Course.query.filter_by(teacher_id=teacher_id)
            
            if published_only:
                query = query.filter_by(is_published=True)
            
            courses = query.order_by(Course.created_at.desc()).all()
            
            course_list = []
            for course in courses:
                course_data = {
                    'id': course.id,
                    'name': course.name,
                    'description': course.description,
                    'teacher_id': course.teacher_id,
                    'teacher_name': course.teacher.name if course.teacher else 'Unknown',
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'max_capacity': course.max_capacity,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len([e for e in course.enrollments if e.status == 'accepted']),
                    'quiz_count': len(course.quizzes)
                }
                
                # Add detailed statistics if requested
                if include_stats:
                    pending_invitations = len([inv for inv in course.invitations if inv.status == 'pending'])
                    published_quizzes = len([q for q in course.quizzes if q.is_published])
                    
                    course_data.update({
                        'pending_invitations': pending_invitations,
                        'published_quiz_count': published_quizzes,
                        'draft_quiz_count': course_data['quiz_count'] - published_quizzes,
                        'total_invitations_sent': len(course.invitations),
                        'is_full': course.is_full() if course.max_capacity else False
                    })
                
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            course_users_ns.abort(500, str(e))

@course_users_ns.route('/students/<int:student_id>/courses')
class StudentCoursesAPI(Resource):
    @course_users_ns.doc('get_student_courses')
    @course_users_ns.marshal_list_with(course_model)
    @course_users_ns.response(403, 'User is not a student')
    @course_users_ns.response(404, 'Student not found')
    @course_users_ns.param('status', 'Filter by enrollment status', enum=['accepted', 'dropped'], default='accepted')
    @course_users_ns.param('include_grades', 'Include grade information', type='boolean', default=False)
    def get(self, student_id):
        """Get all courses where a student is enrolled"""
        try:
            student = User.query.get_or_404(student_id)
            
            if student.role != 'student':
                course_users_ns.abort(403, 'User is not a student')
            
            # Get query parameters
            status_filter = request.args.get('status', 'accepted')
            include_grades = request.args.get('include_grades', 'false').lower() == 'true'
            
            # Get enrollments
            enrollments = Enrollment.query.filter_by(
                student_id=student_id,
                status=status_filter
            ).all()
            
            course_list = []
            for enrollment in enrollments:
                course = enrollment.course
                course_data = {
                    'id': course.id,
                    'name': course.name,
                    'description': course.description,
                    'teacher_id': course.teacher_id,
                    'teacher_name': course.teacher.name if course.teacher else 'Unknown',
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'max_capacity': course.max_capacity,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len([e for e in course.enrollments if e.status == 'accepted']),
                    'quiz_count': len(course.quizzes),
                    'enrollment_date': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                    'enrollment_type': enrollment.enrollment_type
                }
                
                # Add grade information if requested
                if include_grades:
                    course_data.update({
                        'current_grade': enrollment.grade,
                        'grade_updated': enrollment.calculate_grade() != enrollment.grade,
                        'total_quizzes': len([q for q in course.quizzes if q.is_published]),
                        'completed_quizzes': len([sub for sub in student.quiz_submissions 
                                                if sub.quiz.course_id == course.id and sub.is_completed])
                    })
                
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            course_users_ns.abort(500, str(e))
