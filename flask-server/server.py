from flask import Flask, request, g, jsonify
from flask_cors import CORS
from flask_restx import Api
from models import db, User, Course, Quiz, Question, Option, Answer, Enrollment, QuizSubmission, Notification, CourseInvitation, GradeThreshold
from config import config
import os

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'  # Should be environment variable
    app.config['JWT_ALGORITHM'] = 'HS256'
    app.config['JWT_EXPIRATION_DELTA'] = 86400  # 24 hours in seconds
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    
    # Add request context processor for authentication state
    @app.before_request
    def load_user():
        """Load user information if authenticated for each request"""
        g.current_user = None
        g.is_authenticated = False
        g.user_role = None
        
        # Check if request has valid JWT token
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                from auth import get_current_user
                user = get_current_user()
                if user:
                    g.current_user = user
                    g.is_authenticated = True
                    g.user_role = user.role
            except:
                pass  # Invalid token, continue as unauthenticated
    
    # Function to get dynamic Swagger description based on auth state
    def get_dynamic_description():
        """Get Swagger description based on current user's authentication state"""
        try:
            is_authenticated = getattr(g, 'is_authenticated', False)
            user_role = getattr(g, 'user_role', None)
        except RuntimeError:
            # Outside application context, return default description
            is_authenticated = False
            user_role = None
        
        base_description = '''
        A comprehensive quiz management system for students and teachers.
        '''
        
        if not is_authenticated:
            return base_description + '''
        ## 🚪 Welcome! Please Get Started
        
        **You are not currently logged in.** To access the full API functionality:
        
        1. **📝 Register**: Use `/api/auth/register` to create a new account
        2. **🔑 Login**: Use `/api/auth/login` to get your JWT access token
        3. **🔒 Authorize**: Click the **Authorize** button above and enter: `Bearer <your-token>`
        
        ### 👀 Currently Visible
        - Registration and Login endpoints only
        - After login, you'll see all endpoints based on your role
        '''
        else:
            role_emoji = '🎓' if user_role == 'teacher' else '📚'
            user_name = getattr(g.current_user, 'name', 'User') if hasattr(g, 'current_user') and g.current_user else 'User'
            role_desc = f'''
        ## {role_emoji} Welcome, {user_name}!
        
        **You are logged in as a {user_role.title()}**
        
        ### 🎯 Your Available Actions:
        '''
            
            if user_role == 'teacher':
                role_desc += '''
        - 🏫 **Course Management**: Create, edit, and manage courses
        - 📝 **Quiz Creation**: Design quizzes with multiple question types  
        - � **Student Management**: Invite and manage course enrollments
        - 📊 **Analytics**: View student progress and quiz statistics
        - ✅ **Grading**: Review and grade student submissions
        '''
            else:  # student
                role_desc += '''
        - � **Course Discovery**: Browse and enroll in available courses
        - 📝 **Take Quizzes**: Participate in course quizzes and assessments
        - 📈 **Track Progress**: Monitor your performance and grades
        - � **Notifications**: Stay updated on course activities
        '''
            
            return base_description + role_desc + '''
        
        ### 🔧 Quick Actions
        - 👤 **Profile**: Use `/api/auth/me` to view your account details
        - 🔄 **Refresh**: Re-authorize if your token expires
        '''
    
    # Initialize Flask-RESTX for Swagger documentation with security definitions
    authorizations = {
        'Bearer': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
    }
    
    # Create API instance with static description for initialization
    api = Api(
        app,
        title='🧪 TucanTest Quiz API',
        version='1.0',
        description='''
        A comprehensive quiz management system for students and teachers.
        
        ## 🚪 Welcome! Please Get Started
        
        **Authentication Required**: Most endpoints require authentication.
        
        1. **📝 Register**: Use `/api/auth/register` to create a new account
        2. **🔑 Login**: Use `/api/auth/login` to get your JWT access token  
        3. **🔒 Authorize**: Click the **Authorize** button above and enter: `Bearer <your-token>`
        4. **🎯 Access**: Endpoints will be visible based on your role
        
        ## 🎯 Role-Based Access
        - 🟢 **Public**: Registration, Login
        - 🔵 **Authenticated**: Profile, Notifications  
        - 🟡 **Students**: Enroll, Take Quizzes, Submit Answers
        - 🔴 **Teachers**: Create Courses/Quizzes, Grade, Invite Students
        ''',
        doc='/api/docs/',  # Swagger UI will be available at /api/docs/
        prefix='/api',
        authorizations=authorizations,
        security='Bearer',
        # Custom Swagger UI configuration
        swagger_ui_config={
            'persistAuthorization': True,  # Remember auth across page refreshes
            'displayRequestDuration': True,
            'filter': True,  # Enable endpoint filtering
            'tryItOutEnabled': True,
            'docExpansion': 'list',  # Show endpoints in list format
            'defaultModelsExpandDepth': 1,
        }
    )
    
    # Import and add Swagger namespaces
    from routes.auth_routes import auth_ns
    from routes.users_swagger import users_ns
    from routes.notifications_swagger import notifications_ns
    from routes.courses_swagger import courses_ns
    from routes.quizzes_swagger import quizzes_ns
    from routes.questions_swagger import questions_ns
    from routes.answers_swagger import answers_ns
    from routes.submissions_swagger import submissions_ns
    from routes.statistics_swagger import statistics_ns
    from routes.invitations_swagger import invitations_ns
    from routes.course_users_swagger import course_users_ns
    
    # Add all namespaces (visibility will be controlled by endpoint decorators)
    api.add_namespace(auth_ns)
    api.add_namespace(users_ns)
    api.add_namespace(notifications_ns)
    api.add_namespace(courses_ns)
    api.add_namespace(quizzes_ns)
    api.add_namespace(questions_ns)
    api.add_namespace(answers_ns)
    api.add_namespace(submissions_ns)
    api.add_namespace(statistics_ns)
    api.add_namespace(invitations_ns)
    api.add_namespace(course_users_ns)
    
    # Custom route to serve the Swagger UI with dynamic content
    @app.route('/api/docs/')
    def swagger_ui():
        """Serve enhanced Swagger UI with authentication-aware visibility"""
        from swagger_ui_custom import serve_custom_swagger_ui
        return serve_custom_swagger_ui()
        
    # Override the default swagger.json endpoint to provide filtered spec
    @app.route('/api/swagger.json')
    def swagger_spec():
        """Serve dynamically filtered Swagger specification"""
        spec = api.__schema__
        
        # Update description based on current auth state
        try:
            spec['info']['description'] = get_dynamic_description()
        except:
            # Fallback to static description if context issues
            pass
            
        return jsonify(spec)
    api.add_namespace(users_ns)
    api.add_namespace(notifications_ns)
    api.add_namespace(courses_ns)
    api.add_namespace(quizzes_ns)
    api.add_namespace(questions_ns)
    api.add_namespace(answers_ns)
    api.add_namespace(invitations_ns)
    api.add_namespace(course_users_ns)
    
    # Add custom route for authentication status
    @app.route('/api/auth-status')
    def auth_status():
        """Get current authentication status for Swagger UI"""
        return jsonify({
            'authenticated': g.is_authenticated,
            'user_role': g.user_role,
            'user_id': g.current_user.id if g.current_user else None,
            'user_name': g.current_user.name if g.current_user else None,
            'user_email': g.current_user.email if g.current_user else None
        })
    
    # Add custom route for testing authentication in Swagger
    @app.route('/api/test-auth')
    def test_auth():
        """Test endpoint to verify authentication is working"""
        if g.is_authenticated:
            return jsonify({
                'message': f'Hello {g.current_user.name}! You are authenticated as a {g.user_role}.',
                'user': {
                    'id': g.current_user.id,
                    'name': g.current_user.name,
                    'email': g.current_user.email,
                    'role': g.user_role
                }
            })
        else:
            return jsonify({
                'message': 'You are not authenticated. Please login and provide a valid JWT token.',
                'authenticated': False
            }), 401
    
    # Legacy blueprints temporarily disabled to avoid conflicts with Flask-RESTX
    # Only using Flask-RESTX namespaces for now
    # from routes.users import users_bp
    # from routes.courses import courses_bp
    # from routes.quizzes import quizzes_bp
    # from routes.questions import questions_bp
    # from routes.answers import answers_bp
    # from routes.notifications import notifications_bp
    # from routes.invitations import invitations_bp
    # from routes.statistics import statistics_bp
    
    # app.register_blueprint(users_bp)
    # app.register_blueprint(courses_bp)
    # app.register_blueprint(quizzes_bp)
    # app.register_blueprint(questions_bp)
    # app.register_blueprint(answers_bp)
    # app.register_blueprint(notifications_bp)
    # app.register_blueprint(invitations_bp)
    # app.register_blueprint(statistics_bp)
    
    return app

# Create app instance
app = create_app(os.environ.get('FLASK_ENV') or 'development')

def create_tables():
    """Create all database tables"""
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

def seed_sample_data():
    """Add some sample data for testing (optional)"""
    with app.app_context():
        # Check if we already have users
        if User.query.first():
            print("Sample data already exists!")
            return
        
        # Create sample teacher
        teacher = User(
            name="John Doe",
            email="teacher@example.com",
            role="teacher"
        )
        teacher.set_password("password123")
        
        # Create sample student
        student = User(
            name="Jane Smith",
            email="student@example.com",
            role="student"
        )
        student.set_password("password123")
        
        db.session.add(teacher)
        db.session.add(student)
        db.session.commit()
        
        # Create sample course
        course = Course(
            name="Introduction to Programming",
            description="Learn the basics of programming with Python",
            is_public=True,
            teacher_id=teacher.id,
            is_published=True
        )
        
        db.session.add(course)
        db.session.commit()
        
        # Create sample enrollment
        enrollment = Enrollment(
            course_id=course.id,
            student_id=student.id,
            status="accepted"
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        print("Sample data created successfully!")

@app.route('/')
def home():
    return {"message": "Tucan Test API is running!", "status": "success"}

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        user_count = User.query.count()
        return {
            "status": "healthy",
            "database": "connected",
            "total_users": user_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 500

if __name__ == "__main__":
    # Create tables on startup
    create_tables()
    
    # Optionally seed sample data (comment out if not needed)
    seed_sample_data()
    
    app.run(debug=True)