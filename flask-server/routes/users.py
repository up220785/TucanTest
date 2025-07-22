from flask import Blueprint, request, jsonify, current_app
from models import db, User
from werkzeug.security import check_password_hash
from datetime import datetime
import re

users_bp = Blueprint('users', __name__)

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@users_bp.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users (admin functionality)"""
    try:
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        } for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user by ID"""
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@users_bp.route('/api/users/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate role
        if data['role'] not in ['student', 'teacher']:
            return jsonify({'error': 'Role must be either student or teacher'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Validate password length
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email'],
            role=data['role']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/api/users/login', methods=['POST'])
def login_user():
    """User login"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'last_login': user.last_login.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
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
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already taken'}), 400
            
            user.email = data['email']
        
        # Handle password change
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user (admin functionality)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Note: SQLAlchemy will handle cascade deletes for related records
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
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
            
            return jsonify({
                'user_id': user_id,
                'role': user.role,
                'total_courses': total_enrollments,
                'active_courses': active_enrollments,
                'total_quizzes_taken': total_submissions,
                'graded_quizzes': graded_submissions,
                'average_score_percentage': round(avg_percentage, 2)
            })
            
        elif user.role == 'teacher':
            # Teacher statistics
            from models import Course, Quiz
            
            total_courses = Course.query.filter_by(teacher_id=user_id).count()
            published_courses = Course.query.filter_by(teacher_id=user_id, is_published=True).count()
            total_quizzes = Quiz.query.join(Course).filter(Course.teacher_id == user_id).count()
            published_quizzes = Quiz.query.join(Course).filter(Course.teacher_id == user_id, Quiz.is_published == True).count()
            
            return jsonify({
                'user_id': user_id,
                'role': user.role,
                'total_courses': total_courses,
                'published_courses': published_courses,
                'total_quizzes': total_quizzes,
                'published_quizzes': published_quizzes
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
