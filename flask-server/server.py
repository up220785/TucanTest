from flask import Flask
from flask_cors import CORS
from models import db, User, Course, Quiz, Question, Option, Answer, Enrollment, QuizSubmission, Notification, CourseInvitation, GradeThreshold
from config import config
import os

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    
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