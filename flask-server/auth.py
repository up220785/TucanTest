"""
Authentication module for TucanTest API
Provides JWT-based authentication and role-based authorization
Enhanced with debugging and robust error handling similar to Node.js middleware
"""

import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, current_app, g
from flask_restx import abort
from models import User

def get_jwt_secret():
    """Get JWT secret from app config or environment variables"""
    # First try Flask app config with the key we actually set in server.py
    if current_app:
        secret = current_app.config.get('JWT_SECRET_KEY')
        if secret and secret != 'your-secret-key-change-in-production':
            return secret
    
    # Then try environment variables  
    secret = os.getenv('JWT_SECRET')
    if secret:
        return secret
    
    # Use default for development (what we actually set in server.py)
    if current_app:
        default_secret = current_app.config.get('JWT_SECRET_KEY')
        if default_secret:
            return default_secret
    
    # Final fallback
    return 'your-secret-key-change-in-production'

def public_only(f):
    """
    Decorator for endpoints that should only be visible to unauthenticated users
    (like login and register)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is already authenticated
        if getattr(g, 'is_authenticated', False):
            abort(403, 'This endpoint is only available to unauthenticated users. You are already logged in.')
        return f(*args, **kwargs)
    return decorated_function

def authenticated_only(f):
    """
    Decorator for endpoints that should only be visible to authenticated users
    (like profile, logout)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is authenticated
        if not getattr(g, 'is_authenticated', False):
            abort(401, 'Authentication required. Please login first.')
        return f(*args, **kwargs)
    return decorated_function

def generate_jwt_token(user):
    """Generate a JWT token for the user"""
    try:
        payload = {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=current_app.config.get('JWT_EXPIRATION_DELTA', 86400))
        }
        
        token = jwt.encode(
            payload, 
            get_jwt_secret(), 
            algorithm=current_app.config.get('JWT_ALGORITHM', 'HS256')
        )
        
        # Debug log (similar to your Node.js middleware)
        print(f'Generated JWT token for user {user.id} ({user.email}) with role {user.role}')
        return token
    except Exception as e:
        print(f'Error generating JWT token: {str(e)}')
        raise RuntimeError(f'Failed to generate JWT token: {str(e)}')

def decode_jwt_token(token):
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            get_jwt_secret(), 
            algorithms=[current_app.config.get('JWT_ALGORITHM', 'HS256')]
        )
        return payload
    except jwt.ExpiredSignatureError:
        print('JWT token has expired')
        return None
    except jwt.InvalidTokenError as e:
        print(f'Invalid JWT token: {str(e)}')
        return None
    except Exception as e:
        print(f'Error decoding JWT token: {str(e)}')
        return None

def extract_token_from_header(auth_header):
    """Extract token from Authorization header with validation"""
    # Debug log (similar to your Node.js middleware)
    print(f'Authorization header received: {auth_header}')
    
    if not auth_header:
        raise ValueError('Authorization header is missing')
    
    # Check if header starts with 'Bearer '
    if not auth_header.lower().startswith('bearer '):
        raise ValueError('Authorization header must start with "Bearer "')
    
    # Extract token part
    parts = auth_header.split()
    if len(parts) != 2:
        raise ValueError('Invalid Authorization header format')
    
    token = parts[1]
    if not token:
        raise ValueError('Token is missing from Authorization header')
    
    return token

def get_current_user():
    """Get current user from JWT token in request headers with enhanced error handling"""
    try:
        auth_header = request.headers.get('Authorization')
        token = extract_token_from_header(auth_header)
        payload = decode_jwt_token(token)
        
        if not payload:
            return None
        
        # Debug log (similar to your Node.js middleware)
        print(f'Decoded token in middleware: {payload}')
        
        # Get user from database
        user_id = payload.get('user_id')
        if not user_id:
            print('User ID not found in token payload')
            return None
            
        user = User.query.get(user_id)
        if not user:
            print(f'User with ID {user_id} not found in database')
            return None
        
        # Store user info in Flask's g object for easy access
        g.current_user = user
        g.current_user_id = user_id
        g.current_user_role = user.role
        
        print(f'Authentication successful for user: {user.email} (role: {user.role})')
        return user
        
    except ValueError as e:
        print(f'Authentication error: {str(e)}')
        return None
    except Exception as e:
        print(f'Unexpected authentication error: {str(e)}')
        return None

def auth_middleware(f):
    """Enhanced authentication middleware (similar to Node.js authMiddleware)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            print(f'Authorization header received: {auth_header}')  # Debug log
            
            if not auth_header:
                return abort(401, {'message': 'Authorization header is missing'})
            
            token = extract_token_from_header(auth_header)
            if not token:
                return abort(401, {'message': 'Token is missing'})
            
            payload = decode_jwt_token(token)
            if not payload:
                return abort(401, {'message': 'Invalid token'})
            
            print(f'Decoded token in middleware: {payload}')  # Debug log
            
            # Store user info in request context
            user = User.query.get(payload['user_id'])
            if not user:
                return abort(401, {'message': 'User not found'})
            
            g.current_user = user
            return f(*args, **kwargs)
            
        except ValueError as e:
            return abort(401, {'message': str(e)})
        except Exception as e:
            print(f'Auth middleware error: {str(e)}')
            return abort(401, {'message': 'Invalid token'})
    
    return decorated_function

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            abort(401, 'Authentication required. Please provide a valid JWT token in Authorization header.')
        
        # Add user to kwargs so endpoints can access it
        kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated_function

def require_role(required_role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                abort(401, 'Authentication required. Please provide a valid JWT token in Authorization header.')
            
            if user.role != required_role:
                abort(403, f'Access denied. This endpoint requires {required_role} role.')
            
            # Add user to kwargs so endpoints can access it
            kwargs['current_user'] = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_teacher(f):
    """Decorator to require teacher role"""
    return require_role('teacher')(f)

def require_student(f):
    """Decorator to require student role"""
    return require_role('student')(f)

def require_teacher_or_admin(f):
    """Decorator to require teacher or admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            abort(401, 'Authentication required. Please provide a valid JWT token in Authorization header.')
        
        if user.role not in ['teacher', 'admin']:
            abort(403, 'Access denied. This endpoint requires teacher or admin role.')
        
        # Add user to kwargs so endpoints can access it
        kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated_function

# Utility functions for checking authentication state
def is_authenticated():
    """Check if current request is authenticated"""
    user = get_current_user()
    return user is not None

def get_current_user_id():
    """Get current user ID if authenticated"""
    user = get_current_user()
    return user.id if user else None

def get_current_user_role():
    """Get current user role if authenticated"""
    user = get_current_user()
    return user.role if user else None

def get_current_user_email():
    """Get current user email if authenticated"""
    user = get_current_user()
    return user.email if user else None

# Token validation utilities
def validate_token(token):
    """Validate a JWT token without requiring Flask request context"""
    try:
        payload = jwt.decode(
            token, 
            get_jwt_secret(), 
            algorithms=['HS256']
        )
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, 'Token has expired'
    except jwt.InvalidTokenError:
        return False, 'Invalid token'
    except Exception as e:
        return False, f'Token validation error: {str(e)}'

# Environment-based configuration check
def check_jwt_configuration():
    """Check if JWT is properly configured"""
    try:
        secret = get_jwt_secret()
        if secret == 'your-secret-key-change-in-production':
            print('WARNING: Using default JWT secret key. Change this in production!')
        print(f'JWT configuration check passed. Secret key length: {len(secret)} characters')
        return True
    except Exception as e:
        print(f'JWT configuration error: {str(e)}')
        return False
