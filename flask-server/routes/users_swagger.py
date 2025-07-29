from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, User
from datetime import datetime
import re
from auth import require_auth, require_teacher, require_student, require_teacher_or_admin

# Create namespace for users
users_ns = Namespace('users', description='User management operations')

# Define models for Swagger documentation
user_model = users_ns.model('User', {
    'id': fields.Integer(description='User ID'),
    'name': fields.String(required=True, description='User full name'),
    'email': fields.String(required=True, description='User email address'),
    'role': fields.String(required=True, description='User role', enum=['student', 'teacher']),
    'created_at': fields.DateTime(description='Account creation date'),
    'last_login': fields.DateTime(description='Last login date')
})

user_update = users_ns.model('UserUpdate', {
    'name': fields.String(description='User full name'),
    'email': fields.String(description='User email address'),
    'password': fields.String(description='New password (min 6 characters)')
})

user_stats = users_ns.model('UserStats', {
    'user_id': fields.Integer(description='User ID'),
    'role': fields.String(description='User role'),
    'total_courses': fields.Integer(description='Total courses'),
    'active_courses': fields.Integer(description='Active courses'),
    'total_quizzes_taken': fields.Integer(description='Total quizzes taken'),
    'average_score_percentage': fields.Float(description='Average score percentage')
})

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@users_ns.route('/')
class UserListAPI(Resource):
    @users_ns.doc('get_all_users')
    @users_ns.marshal_list_with(user_model)
    @require_teacher_or_admin  # Add authentication and admin/teacher access only
    def get(self, current_user=None):
        """Get all users (admin/teacher functionality only)"""
        try:
            users = User.query.all()
            return [{
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            } for user in users]
        except Exception as e:
            users_ns.abort(500, str(e))

@users_ns.route('/<int:user_id>')
class UserAPI(Resource):
    @users_ns.doc('get_user')
    @users_ns.marshal_with(user_model)
    @users_ns.response(404, 'User not found')
    @require_auth
    def get(self, user_id, current_user=None):
        """Get a specific user by ID (requires authentication)"""
        try:
            # Users can only view their own profile unless they're admin
            if current_user.id != user_id and current_user.role != 'admin':
                users_ns.abort(403, 'Access denied. You can only view your own profile.')
            
            user = User.query.get_or_404(user_id)
            return {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        except Exception as e:
            users_ns.abort(404, 'User not found')

    @users_ns.doc('update_user')
    @users_ns.expect(user_update)
    @users_ns.marshal_with(user_model)
    @users_ns.response(404, 'User not found')
    @users_ns.response(400, 'Validation error')
    @require_auth
    def put(self, user_id, current_user=None):
        """Update user profile (requires authentication)"""
        try:
            # Users can only update their own profile unless they're admin
            if current_user.id != user_id and current_user.role != 'admin':
                users_ns.abort(403, 'Access denied. You can only update your own profile.')
            
            user = User.query.get_or_404(user_id)
            data = request.get_json()
            
            # Update allowed fields
            if 'name' in data and data['name']:
                user.name = data['name']
            
            if 'email' in data and data['email']:
                # Validate email format
                if not validate_email(data['email']):
                    users_ns.abort(400, 'Invalid email format')
                
                # Check if email is already taken by another user
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.id != user_id:
                    users_ns.abort(400, 'Email already taken')
                
                user.email = data['email']
            
            # Handle password change
            if 'password' in data and data['password']:
                if len(data['password']) < 6:
                    users_ns.abort(400, 'Password must be at least 6 characters long')
                user.set_password(data['password'])
            
            db.session.commit()
            
            return {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            
        except Exception as e:
            db.session.rollback()
            users_ns.abort(500, str(e))

    @users_ns.doc('delete_user')
    @users_ns.response(200, 'User deleted successfully')
    @users_ns.response(404, 'User not found')
    @users_ns.response(403, 'Access denied')
    @require_auth  # Changed from require_teacher_or_admin to require_auth
    def delete(self, user_id, current_user=None):
        """Delete user profile (users can only delete their own profile)"""
        # Users can only delete their own profile
        if current_user.id != user_id:
            users_ns.abort(403, 'Access denied. You can only delete your own profile.')
        
        try:
            user = User.query.get_or_404(user_id)
            
            # Handle user deletion based on role
            if user.role == 'teacher':
                # For teachers, we need to handle courses they teach
                # Option 1: Prevent deletion if they have courses
                if user.courses_taught:
                    users_ns.abort(400, 'Cannot delete teacher with active courses. Please transfer or delete courses first.')
                
            elif user.role == 'student':
                # For students, delete related records in proper order
                from models import Enrollment, QuizSubmission, Answer, Notification, CourseInvitation
                
                # Delete answers first
                Answer.query.filter_by(student_id=user_id).delete()
                
                # Delete quiz submissions
                QuizSubmission.query.filter_by(student_id=user_id).delete()
                
                # Delete enrollments
                Enrollment.query.filter_by(student_id=user_id).delete()
                
                # Delete course invitations
                CourseInvitation.query.filter_by(student_id=user_id).delete()
                
                # Delete notifications
                Notification.query.filter_by(user_id=user_id).delete()
            
            # Now delete the user
            db.session.delete(user)
            db.session.commit()
            
            return {'message': 'User deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            users_ns.abort(500, str(e))

@users_ns.route('/<int:user_id>/stats')
class UserStatsAPI(Resource):
    @users_ns.doc('get_user_stats')
    @users_ns.marshal_with(user_stats)
    @users_ns.response(404, 'User not found')
    @users_ns.response(403, 'Access denied')
    @require_auth  # Require authentication
    def get(self, user_id, current_user=None):
        """Get user statistics (requires authentication)"""
        try:
            # Users can only view their own stats unless they're admin/teacher
            if current_user.id != user_id and current_user.role not in ['teacher', 'admin']:
                users_ns.abort(403, 'Access denied. You can only view your own statistics.')
            
            user = User.query.get_or_404(user_id)
            
            if user.role == 'student':
                # Student statistics
                from models import QuizSubmission, Enrollment
                
                total_enrollments = len(user.enrollments)
                active_enrollments = len([e for e in user.enrollments if e.status == 'accepted'])
                total_submissions = QuizSubmission.query.filter_by(student_id=user_id).count()
                graded_submissions = QuizSubmission.query.filter_by(student_id=user_id, is_graded=True).count()
                
                # Calculate average score
                submissions = QuizSubmission.query.filter_by(student_id=user_id, is_graded=True).all()
                if submissions:
                    avg_percentage = sum(s.get_percentage() for s in submissions) / len(submissions)
                else:
                    avg_percentage = 0
                
                return {
                    'user_id': user_id,
                    'role': user.role,
                    'total_courses': total_enrollments,
                    'active_courses': active_enrollments,
                    'total_quizzes_taken': total_submissions,
                    'average_score_percentage': round(avg_percentage, 2)
                }
                
            elif user.role == 'teacher':
                # Teacher statistics
                from models import Course, Quiz
                
                total_courses = Course.query.filter_by(teacher_id=user_id).count()
                published_courses = Course.query.filter_by(teacher_id=user_id, is_published=True).count()
                total_quizzes = Quiz.query.join(Course).filter(Course.teacher_id == user_id).count()
                published_quizzes = Quiz.query.join(Course).filter(Course.teacher_id == user_id, Quiz.is_published == True).count()
                
                return {
                    'user_id': user_id,
                    'role': user.role,
                    'total_courses': total_courses,
                    'active_courses': published_courses,
                    'total_quizzes_taken': total_quizzes,
                    'average_score_percentage': published_quizzes
                }
            
        except Exception as e:
            users_ns.abort(500, str(e))
