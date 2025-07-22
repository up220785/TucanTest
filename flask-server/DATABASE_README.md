# Tucan Test - Database Setup

This document explains how to set up and manage the database for the Tucan Test application.

## 🗄️ Database Schema Overview

The database includes the following main entities:

### Core Models
- **User**: Students and teachers with role-based access
- **Course**: Public/private courses with capacity management
- **Quiz**: Quizzes with due dates and auto/manual grading
- **Question**: Multiple choice and text questions with point values
- **Option**: Answer choices for multiple choice questions

### Advanced Features
- **QuizSubmission**: Tracks complete quiz submissions with scores
- **Answer**: Individual question responses with grading support
- **Enrollment**: Course enrollment management
- **CourseInvitation**: Private course invitation system
- **Notification**: Rich notification system with actions
- **GradeThreshold**: Configurable grading scales

## 🚀 Quick Setup

### Option 1: Automatic Setup (Recommended)
```bash
# Run the setup script (Windows)
setup.bat

# Or manually:
pip install -r requirements.txt
python init_db.py
```

### Option 2: Manual Setup
```bash
# Install dependencies
pip install Flask Flask-SQLAlchemy Flask-CORS Werkzeug

# Start the server (creates database automatically)
python server.py
```

## 📋 Requirements

- Python 3.8+
- Flask 3.0+
- SQLAlchemy 2.0+

## 🔧 Configuration

The application supports multiple environments:

- **Development**: SQLite database, debug mode enabled
- **Production**: Configurable database, optimized settings
- **Testing**: In-memory database for unit tests

## 📊 Sample Data

The initialization script can create sample data:
- Teacher account: `teacher@example.com` / `password123`
- Student account: `student@example.com` / `password123`
- Sample course with enrollment

## 🔍 Database Features

### Enhanced Functionality
- **Cascade Deletes**: Removing a course deletes all related quizzes, enrollments, etc.
- **Unique Constraints**: Prevents duplicate enrollments and submissions
- **Automatic Grading**: Multiple choice questions are auto-graded
- **Manual Grading**: Text questions support teacher grading with comments
- **Statistics Support**: Built-in methods for calculating scores and percentages
- **Invitation System**: Separate model for private course invitations
- **Rich Notifications**: Support for actionable notifications with expiration

### Grading System
- **Auto-grading**: Multiple choice questions automatically scored
- **Manual grading**: Text questions require teacher review
- **Score tracking**: Separate tracking for auto vs manual scores
- **Grade thresholds**: Configurable passing/excellent grade boundaries
- **Teacher overrides**: Teachers can modify any score after grading

### Statistics & Analytics
- Class averages
- Passing/failing rates
- Score distributions
- Individual progress tracking
- Course-level statistics

## 🗃️ Database Management

### Reset Database
```python
# Remove existing database and recreate
python init_db.py
```

### Backup Database
```bash
# Copy the SQLite file
copy tucantestschema.db tucantestschema_backup.db
```

### View Database
You can use any SQLite browser to view the database:
- DB Browser for SQLite
- SQLite Studio
- VS Code SQLite Viewer extension

## 🔒 Security Features

- Password hashing with Werkzeug
- Unique email constraints
- Foreign key constraints enabled
- Role-based access control ready

## 📚 API Health Check

Once running, test the database connection:
```
GET http://localhost:5000/api/health
```

## 🛠️ Development Tips

1. **Models**: All database models are in `models.py`
2. **Migrations**: Consider using Flask-Migrate for production
3. **Relationships**: SQLAlchemy relationships are configured for easy querying
4. **Validation**: Add custom validation methods to models as needed
5. **Indexing**: Add database indexes for frequently queried fields

## 📝 Next Steps

1. Install the dependencies: `pip install -r requirements.txt`
2. Initialize the database: `python init_db.py`
3. Start the server: `python server.py`
4. Test the API: Visit `http://localhost:5000/api/health`
5. Begin implementing your routes and business logic!

The database is now ready to support all the features you outlined for your quiz application.
