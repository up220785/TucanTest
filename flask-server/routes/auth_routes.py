"""
Authentication routes for TucanTest API
Similar to Node.js auth controller with enhanced validation and error handling
"""

from flask import request, current_app, g
from flask_restx import Namespace, Resource, fields
from models import db, User
from auth import generate_jwt_token, get_current_user, require_auth, check_jwt_configuration, public_only, authenticated_only
from datetime import datetime
import re

# Create separate namespaces for public and authenticated auth endpoints
auth_ns = Namespace('auth', description='Authentication operations')
auth_public_ns = Namespace('auth-public', description='Public authentication (Login/Register)')
auth_private_ns = Namespace('auth-private', description='Authenticated user operations')

# Models for Swagger documentation
login_model = auth_ns.model('Login', {
    'email': fields.String(required=True, description='User email', example='teacher@example.com'),
    'password': fields.String(required=True, description='User password', example='password123')
})

register_model = auth_ns.model('Register', {
    'name': fields.String(required=True, description='Full name', example='Dr. Sarah Johnson'),
    'email': fields.String(required=True, description='Email address', example='sarah.johnson@university.edu'),
    'password': fields.String(required=True, description='Password (min 8 characters)', example='password123'),
    'role': fields.String(required=True, description='User role', enum=['teacher', 'student'], example='teacher')
})

user_response_model = auth_ns.model('UserResponse', {
    'id': fields.Integer(description='User ID'),
    'name': fields.String(description='User name'),
    'email': fields.String(description='User email'),
    'role': fields.String(description='User role'),
    'created_at': fields.DateTime(description='Registration date'),
    'last_login': fields.DateTime(description='Last login time')
})

login_response_model = auth_ns.model('LoginResponse', {
    'token': fields.String(description='JWT access token'),
    'expires_in': fields.Integer(description='Token expiration time in seconds'),
    'user': fields.Nested(user_response_model, description='User information')
})

token_validation_model = auth_ns.model('TokenValidation', {
    'token': fields.String(required=True, description='JWT token to validate')
})

# Helper function to check if user should see public endpoints
def is_public_endpoint_visible():
    """Check if public endpoints (login/register) should be visible"""
    return not getattr(g, 'is_authenticated', False)

# Helper function to check if user should see authenticated endpoints  
def is_authenticated_endpoint_visible():
    """Check if authenticated endpoints should be visible"""
    return getattr(g, 'is_authenticated', False)

# Validation utilities
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def check_user_exists(email):
    """Check if user exists by email"""
    return User.query.filter_by(email=email.lower()).first()

@auth_ns.route('/login')
class LoginAPI(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(login_model)
    @auth_ns.marshal_with(login_response_model, code=200)
    @auth_ns.response(400, 'Invalid credentials')
    @auth_ns.response(401, 'Authentication failed')
    @auth_ns.response(403, 'Already authenticated')
    @auth_ns.response(500, 'Server error')
    @public_only
    def post(self):
        """User login endpoint (only visible when not logged in)"""
        try:
            data = request.get_json()
            print(f'Login request received: {data.get("email", "no email")}')  # Debug log
            
            # Validate required fields
            if not data or 'email' not in data or 'password' not in data:
                auth_ns.abort(400, 'Email and password are required')
            
            email = data['email'].lower().strip()
            password = data['password']
            
            # Validate email format
            if not validate_email(email):
                auth_ns.abort(400, 'Invalid email format')
            
            # Check if user exists
            user = check_user_exists(email)
            if not user:
                print(f'Login failed: User not found for email {email}')
                auth_ns.abort(400, 'User does not exist')
            
            # Verify password
            if not user.check_password(password):
                print(f'Login failed: Invalid password for email {email}')
                auth_ns.abort(400, 'Invalid credentials')
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Generate JWT token
            token = generate_jwt_token(user)
            expires_in = current_app.config.get('JWT_EXPIRATION_DELTA', 86400)
            
            print(f'Login successful for user: {user.email} (role: {user.role})')
            
            return {
                'token': token,
                'expires_in': expires_in,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                }
            }, 200
            
        except Exception as e:
            print(f'Login error: {str(e)}')
            auth_ns.abort(500, f'Login failed: {str(e)}')

@auth_ns.route('/register')
class RegisterAPI(Resource):
    @auth_ns.doc('user_register')
    @auth_ns.expect(register_model)
    @auth_ns.marshal_with(login_response_model, code=201)
    @auth_ns.response(400, 'Validation error or user already exists')
    @auth_ns.response(403, 'Already authenticated')
    @auth_ns.response(500, 'Server error')
    @public_only
    def post(self):
        """User registration endpoint (only visible when not logged in)"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'email', 'password', 'role']
            for field in required_fields:
                if field not in data or not data[field]:
                    auth_ns.abort(400, f'{field} is required')
            
            name = data['name'].strip()
            email = data['email'].lower().strip()
            password = data['password']
            role = data['role'].lower()
            
            # Validate email format
            if not validate_email(email):
                auth_ns.abort(400, 'Invalid email format')
            
            # Validate password
            is_valid, message = validate_password(password)
            if not is_valid:
                auth_ns.abort(400, message)
            
            # Validate role
            if role not in ['teacher', 'student']:
                auth_ns.abort(400, 'Role must be either "teacher" or "student"')
            
            # Check if user already exists
            existing_user = check_user_exists(email)
            if existing_user:
                auth_ns.abort(400, 'User already exists with this email')
            
            # Create new user
            current_time = datetime.utcnow()
            new_user = User(
                name=name,
                email=email,
                role=role,
                created_at=current_time
            )
            
            # Set password using the model's method
            new_user.set_password(password)
            
            db.session.add(new_user)
            db.session.commit()
            
            # Generate JWT token for immediate login
            token = generate_jwt_token(new_user)
            expires_in = current_app.config.get('JWT_EXPIRATION_DELTA', 86400)
            
            print(f'User registered successfully: {new_user.email} (role: {new_user.role})')
            
            return {
                'token': token,
                'expires_in': expires_in,
                'user': {
                    'id': new_user.id,
                    'name': new_user.name,
                    'email': new_user.email,
                    'role': new_user.role,
                    'created_at': new_user.created_at.isoformat() if new_user.created_at else None,
                    'last_login': None
                }
            }, 201
            
        except Exception as e:
            db.session.rollback()
            print(f'Registration error: {str(e)}')
            auth_ns.abort(500, f'Registration failed: {str(e)}')

@auth_ns.route('/validate')
class TokenValidationAPI(Resource):
    @auth_ns.doc('validate_token')
    @auth_ns.expect(token_validation_model)
    @auth_ns.marshal_with(user_response_model, code=200)
    @auth_ns.response(401, 'Invalid or expired token')
    @auth_ns.response(404, 'User not found')
    def post(self):
        """Validate JWT token endpoint"""
        try:
            data = request.get_json()
            if not data or 'token' not in data:
                auth_ns.abort(400, 'Token is required')
            
            token = data['token']
            
            # Import validate_token function
            from auth import validate_token
            is_valid, result = validate_token(token)
            
            if not is_valid:
                auth_ns.abort(401, f'Token validation failed: {result}')
            
            # Get user information
            user = User.query.get(result['user_id'])
            if not user:
                auth_ns.abort(404, 'User not found')
            
            return {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }, 200
            
        except Exception as e:
            print(f'Token validation error: {str(e)}')
            auth_ns.abort(500, f'Token validation failed: {str(e)}')

@auth_ns.route('/me')
class CurrentUserAPI(Resource):
    @auth_ns.doc('get_current_user', security='Bearer')
    @auth_ns.marshal_with(user_response_model, code=200)
    @auth_ns.response(401, 'Authentication required')
    @require_auth
    @authenticated_only
    def get(self, current_user=None):
        """Get current authenticated user information (only visible when logged in)"""
        return {
            'id': current_user.id,
            'name': current_user.name,
            'email': current_user.email,
            'role': current_user.role,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None
        }, 200

@auth_ns.route('/logout')
class LogoutAPI(Resource):
    @auth_ns.doc('user_logout', security='Bearer')
    @auth_ns.response(200, 'Successfully logged out')
    @auth_ns.response(401, 'Authentication required')
    @require_auth
    @authenticated_only
    def post(self, current_user=None):
        """Logout endpoint (only visible when logged in)"""
        return {
            'message': f'Goodbye {current_user.name}! You have been successfully logged out.',
            'status': 'success'
        }, 200

@auth_ns.route('/config-check')
class ConfigCheckAPI(Resource):
    @auth_ns.doc('check_jwt_config')
    def get(self):
        """Check JWT configuration status"""
        is_configured = check_jwt_configuration()
        return {
            'jwt_configured': is_configured,
            'message': 'JWT is properly configured' if is_configured else 'JWT configuration error'
        }, 200 if is_configured else 500
