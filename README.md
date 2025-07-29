# 🧪 TucanTest - Quiz Management Platform

A comprehensive web application for creating, managing, and taking quizzes - similar to Google Classroom but specialized for educational assessments.

## 🚀 Features

### 👨‍🏫 For Teachers
- **Course Management**: Create public/private courses with enrollment controls
- **Quiz Creation**: Multiple choice and short answer questions with flexible scoring
- **Student Invitations**: Email-based invitations for private courses
- **Grading System**: Comprehensive grading with feedback and notifications
- **Analytics**: Detailed statistics showing student performance rankings
- **Real-time Notifications**: Automatic alerts for submissions and course activities

### 👨‍🎓 For Students
- **Course Enrollment**: Join public courses or accept private invitations
- **Quiz Taking**: Timed quizzes with multiple attempt support
- **Progress Tracking**: View grades, course statistics, and performance analytics
- **Notifications**: Receive alerts when quizzes are published or graded
- **Results Dashboard**: Detailed breakdown of quiz performance and course progress

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access**: Teacher and student roles with appropriate permissions
- **Password Security**: Secure password hashing with werkzeug
- **Session Management**: 24-hour token expiration with proper validation

## 🏗️ Architecture

### Backend (`/flask-server/`)
- **Flask + Flask-RESTX**: RESTful API with automatic Swagger documentation
- **SQLAlchemy**: Database ORM with comprehensive data models
- **JWT Authentication**: Token-based security system
- **Notification System**: Automated alerts and messaging
- **Statistics Engine**: Performance analytics and reporting

### Frontend Options
- **Next.js App** (`/tucan-test/`): Modern React-based frontend
- **Basic Frontend** (`/frontend/`): Simple HTML/CSS/JS implementation

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd flask-server
pip install -r requirements.txt
python server.py
```

### 2. Access the Application
- **API Server**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/api/docs/
- **API Testing Guide**: `/flask-server/API_TESTING_GUIDE.md`

### 3. Test the System
1. Register teacher and student accounts
2. Create a course and quiz
3. Enroll students and take quizzes
4. Grade submissions and view statistics

## 📚 API Documentation

Comprehensive API documentation with examples is available in:
- **Swagger UI**: http://localhost:5000/api/docs/ (when server is running)
- **Testing Guide**: `/flask-server/API_TESTING_GUIDE.md`

## 🎯 Key Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/me` - Get current user profile

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course (teachers only)
- `POST /api/courses/{id}/enroll` - Enroll in course (students)

### Quizzes
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz (teachers only)
- `POST /api/quizzes/{id}/start` - Start quiz attempt (students)

### Statistics
- `GET /api/statistics/quizzes/{id}/detailed` - Teacher quiz analytics
- `GET /api/statistics/courses/{id}` - Teacher course statistics
- `GET /api/answers/my-course-statistics` - Student progress dashboard

## 🗃️ Database Models

- **Users**: Teachers and students with role-based permissions
- **Courses**: Public/private courses with enrollment management
- **Quizzes**: Assessments with timing and attempt controls
- **Questions**: Multiple choice and short answer question types
- **Submissions**: Quiz attempts with grading workflow
- **Notifications**: System-wide messaging and alerts

## 🧪 Testing

The system includes comprehensive testing examples:
- User registration and authentication flows
- Course creation and enrollment processes
- Quiz taking and grading workflows
- Statistics and analytics testing
- Notification system verification

## 📁 Project Structure

```
TucanTest/
├── flask-server/          # Backend API server
│   ├── routes/           # API route modules
│   ├── models.py         # Database models
│   ├── auth.py           # Authentication system
│   ├── server.py         # Main Flask application
│   └── API_TESTING_GUIDE.md  # Comprehensive API documentation
├── tucan-test/           # Next.js frontend application
├── frontend/             # Basic frontend implementation
└── README.md            # This file
```

## 🤝 Contributing

1. Follow the established API patterns in the testing guide
2. Maintain proper authentication and authorization
3. Include comprehensive error handling
4. Update documentation for new features
5. Test all role-based access controls

## 📄 License

This project is developed for educational purposes as a quiz management platform.

---

**Happy Learning! 🎓**
