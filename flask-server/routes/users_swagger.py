from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, User
from datetime import datetime
import re

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

user_register = users_ns.model('UserRegister', {
    'name': fields.String(required=True, description='User full name', example='John Doe'),
    'email': fields.String(required=True, description='User email address', example='john@example.com'),
    'password': fields.String(required=True, description='User password (min 6 characters)', example='password123'),
    'role': fields.String(required=True, description='User role', enum=['student', 'teacher'], example='student')
})

user_login = users_ns.model('UserLogin', {
    'email': fields.String(required=True, description='User email address', example='john@example.com'),
    'password': fields.String(required=True, description='User password', example='password123')
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

@users_ns.route('/api/users')
class UserListAPI(Resource):
    @users_ns.doc('get_all_users')
    @users_ns.marshal_list_with(user_model)
    def get(self):
        """Get all users (admin functionality)"""
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

@users_ns.route('/api/users/<int:user_id>')
class UserAPI(Resource):
    @users_ns.doc('get_user')
    @users_ns.marshal_with(user_model)
    @users_ns.response(404, 'User not found')
    def get(self, user_id):
        """Get a specific user by ID"""
        try:
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
    def put(self, user_id):
        """Update user profile"""
        try:
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
    def delete(self, user_id):
        """Delete a user (admin functionality)"""
        try:
            user = User.query.get_or_404(user_id)
            
            # SQLAlchemy will handle cascade deletes for related records
            db.session.delete(user)
            db.session.commit()
            
            return {'message': 'User deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            users_ns.abort(500, str(e))

@users_ns.route('/api/users/register')
class UserRegisterAPI(Resource):
    @users_ns.doc('register_user')
    @users_ns.expect(user_register)
    @users_ns.marshal_with(user_model, code=201)
    @users_ns.response(400, 'Validation error')
    def post(self):
        """Register a new user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'email', 'password', 'role']
            for field in required_fields:
                if field not in data or not data[field]:
                    users_ns.abort(400, f'{field} is required')
            
            # Validate email format
            if not validate_email(data['email']):
                users_ns.abort(400, 'Invalid email format')
            
            # Validate role
            if data['role'] not in ['student', 'teacher']:
                users_ns.abort(400, 'Role must be either student or teacher')
            
            # Check if email already exists
            if User.query.filter_by(email=data['email']).first():
                users_ns.abort(400, 'Email already registered')
            
            # Validate password length
            if len(data['password']) < 6:
                users_ns.abort(400, 'Password must be at least 6 characters long')
            
            # Create new user
            user = User(
                name=data['name'],
                email=data['email'],
                role=data['role']
            )
            user.set_password(data['password'])
            
            db.session.add(user)
            db.session.commit()
            
            return {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }, 201
            
        except Exception as e:
            db.session.rollback()
            users_ns.abort(500, str(e))

@users_ns.route('/api/users/login')
class UserLoginAPI(Resource):
    @users_ns.doc('login_user')
    @users_ns.expect(user_login)
    @users_ns.marshal_with(user_model)
    @users_ns.response(401, 'Invalid credentials')
    def post(self):
        """User login"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data.get('email') or not data.get('password'):
                users_ns.abort(400, 'Email and password are required')
            
            # Find user by email
            user = User.query.filter_by(email=data['email']).first()
            
            if not user or not user.check_password(data['password']):
                users_ns.abort(401, 'Invalid email or password')
            
            # Update last login
            user.last_login = datetime.utcnow()
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
            users_ns.abort(500, str(e))

@users_ns.route('/api/users/<int:user_id>/stats')
class UserStatsAPI(Resource):
    @users_ns.doc('get_user_stats')
    @users_ns.marshal_with(user_stats)
    @users_ns.response(404, 'User not found')
    def get(self, user_id):
        """Get user statistics"""
        try:
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
