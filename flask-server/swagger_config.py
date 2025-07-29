"""
Custom Swagger configuration for role-based endpoint visibility
"""

from flask import g, request
from functools import wraps

def conditional_namespace_decorator(required_role=None, require_auth=False, public_only=False):
    """
    Decorator to conditionally show/hide namespaces based on authentication state
    
    Args:
        required_role: Specific role required ('teacher' or 'student')
        require_auth: True if any authenticated user can access
        public_only: True if only unauthenticated users should see this
    """
    def decorator(cls):
        original_methods = {}
        
        # Store original methods
        for method_name in ['get', 'post', 'put', 'delete', 'patch']:
            if hasattr(cls, method_name):
                original_methods[method_name] = getattr(cls, method_name)
        
        # Create wrapper for each HTTP method
        for method_name, original_method in original_methods.items():
            @wraps(original_method)
            def method_wrapper(*args, **kwargs):
                # Check authentication status
                is_authenticated = getattr(g, 'is_authenticated', False)
                user_role = getattr(g, 'user_role', None)
                
                # Apply visibility rules
                if public_only and is_authenticated:
                    return {'message': 'This endpoint is only available to unauthenticated users'}, 403
                
                if require_auth and not is_authenticated:
                    return {'message': 'Authentication required'}, 401
                
                if required_role and (not is_authenticated or user_role != required_role):
                    return {'message': f'This endpoint requires {required_role} role'}, 403
                
                # Call original method
                return original_method(*args, **kwargs)
            
            setattr(cls, method_name, method_wrapper)
        
        return cls
    
    return decorator

def get_swagger_config_for_user():
    """
    Get Swagger UI configuration based on current user's authentication state
    """
    is_authenticated = getattr(g, 'is_authenticated', False)
    user_role = getattr(g, 'user_role', None)
    
    base_config = {
        'persistAuthorization': True,
        'displayRequestDuration': True,
        'filter': True,
        'tryItOutEnabled': True,
        'docExpansion': 'none',  # Collapse all by default
    }
    
    if not is_authenticated:
        # Show only public endpoints for unauthenticated users
        base_config['defaultModelsExpandDepth'] = -1  # Hide models
        base_config['docExpansion'] = 'list'  # Show list view
    else:
        # Show all relevant endpoints for authenticated users
        base_config['defaultModelsExpandDepth'] = 1
        base_config['docExpansion'] = 'list'
    
    return base_config

def get_visible_namespaces():
    """
    Return list of namespaces that should be visible to current user
    """
    is_authenticated = getattr(g, 'is_authenticated', False)
    user_role = getattr(g, 'user_role', None)
    
    # Always visible namespaces
    namespaces = []
    
    if not is_authenticated:
        # Public endpoints only
        namespaces.extend([
            'auth',  # Login and Register only
        ])
    else:
        # Authenticated user endpoints
        namespaces.extend([
            'auth',     # User profile and token validation
            'users',    # User management
            'notifications',  # Notifications
        ])
        
        if user_role == 'teacher':
            namespaces.extend([
                'courses',      # Full course management
                'quizzes',      # Full quiz management
                'questions',    # Question management
                'invitations',  # Course invitations
                'course_users', # Course user management
            ])
        elif user_role == 'student':
            namespaces.extend([
                'courses',      # View and enroll in courses
                'quizzes',      # Take quizzes
                'answers',      # Submit answers
            ])
    
    return namespaces

def filter_swagger_spec_by_role(spec):
    """
    Filter Swagger specification based on user role
    """
    is_authenticated = getattr(g, 'is_authenticated', False)
    user_role = getattr(g, 'user_role', None)
    
    if not spec.get('paths'):
        return spec
    
    filtered_paths = {}
    
    for path, path_obj in spec['paths'].items():
        should_include = False
        
        # Check if this path should be visible to current user
        if not is_authenticated:
            # Only show public auth endpoints
            if path.startswith('/api/auth/login') or path.startswith('/api/auth/register'):
                should_include = True
        else:
            # Show different endpoints based on role
            if path.startswith('/api/auth/'):
                # Always show auth endpoints for authenticated users (profile, logout, etc.)
                if not path.endswith('/login') and not path.endswith('/register'):
                    should_include = True
            elif user_role == 'teacher':
                # Teachers can see all endpoints
                should_include = True
            elif user_role == 'student':
                # Students can see limited endpoints
                student_allowed_paths = [
                    '/api/courses/',
                    '/api/courses/{id}',
                    '/api/courses/{id}/enroll',
                    '/api/quizzes/',
                    '/api/quizzes/{id}',
                    '/api/quizzes/{id}/submit',
                    '/api/answers/',
                    '/api/users/me',
                    '/api/notifications/',
                ]
                
                for allowed_path in student_allowed_paths:
                    if path.startswith(allowed_path.replace('{id}', '')) or path == allowed_path:
                        should_include = True
                        break
        
        if should_include:
            filtered_paths[path] = path_obj
    
    spec['paths'] = filtered_paths
    return spec
