# 🧪 TucanTest API

## 🚀 Quick Setup Guide

### 📋 Prerequisites
- **Python 3.8+** installed on your system
- **Git** for cloning the repository
- **Command line/Terminal** access

### 🔧 Initial Setup (First Time Only)

#### 1. Clone the Repository
```bash
git clone https://github.com/up220785/TucanTest.git
cd TucanTest/flask-server
```

#### 2. Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Initialize Database (Automatic)
The database will be automatically created when you first run the server. The system includes:
- ✅ Auto-creation of all tables
- ✅ Sample data for testing
- ✅ Proper schema validation

#### 5. Start the Server
```bash
python server.py
```

### ✅ Verify Installation
After starting the server, you should see:
```
Database tables created successfully!
Sample data already exists!
 * Serving Flask app 'server'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

### 🌐 Access Points
- **API Server**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/api/docs/
- **Interactive API Documentation**: Full testing interface available

### 🧪 Quick Test
1. Open http://localhost:5000/api/docs/ in your browser
2. Try the `GET /api/auth/config-check` endpoint (no authentication required)
3. You should get a successful response confirming the system is working

### 🔄 Daily Development Workflow
```bash
# 1. Navigate to project directory
cd TucanTest/flask-server

# 2. Activate virtual environment (if not already active)
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Start the server
python server.py
```

### 🔍 Troubleshooting

#### ❌ "Module not found" errors:
```bash
# Make sure virtual environment is activated and dependencies installed
pip install -r requirements.txt
```

#### ❌ Port 5000 already in use:
```bash
# Kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Kill process using port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9
```

#### ❌ Database issues:
The database file `tucantestschema.db` is included in the project. If you encounter issues:
1. Stop the server
2. Delete `tucantestschema.db` (if present)
3. Restart the server - it will recreate the database automatically

### 📚 What's Included
- **Complete REST API** with JWT authentication
- **Swagger Documentation** at `/api/docs/`
- **Sample Data** for immediate testing
- **Role-based Access Control** (teachers and students)
- **Comprehensive Test Examples** (see sections below)

---

## 🚀 Getting Started

1. Start your Flask server: `python server.py`
2. Server will be running on: `http://localhost:5000`
3. Swagger UI available at: `http://localhost:5000/api/docs/`

### 🔐 Using Swagger UI with Authentication

1. **Open Swagger UI**: Navigate to `http://localhost:5000/api/docs/`
2. **Register or Login**: Use the `auth` endpoints to register a new user or login
3. **Get JWT Token**: Copy the JWT token from the login response
4. **Authorize in Swagger**: 
   - Click the **🔒 Authorize** button at the top right of Swagger UI
   - Enter: `Bearer <your-jwt-token>` (include "Bearer " prefix)
   - Click **Authorize** and then **Close**
5. **Access Protected Routes**: Now you can use protected endpoints based on your role

### 🔑 Authentication Steps in Swagger UI:
```
Step 1: POST /api/auth/register - Register a new user
Step 2: POST /api/auth/login - Login to get JWT token  
Step 3: Click 🔒 Authorize button in Swagger UI
Step 4: Enter: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Step 5: Use protected endpoints based on your role
```

### 🧪 Testing Authentication Status:
```bash
# Check your current authentication status
curl -X GET http://localhost:5000/api/auth-status \
  -H "Authorization: Bearer <your-jwt-token>"

# Test authentication endpoint
curl -X GET http://localhost:5000/api/test-auth \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 🔍 Quick Authentication Test:
1. **Register**: `POST /api/auth/register` with your details
2. **Login**: `POST /api/auth/login` to get JWT token
3. **Copy Token**: Copy the `token` field from login response
4. **Authorize**: Click 🔒 in Swagger UI, enter `Bearer <token>`
5. **Test**: Try `GET /api/auth/me` or `GET /api/test-auth`

### 🐛 Troubleshooting Authentication:
If you get JWT secret errors:
- The server has been configured with proper JWT secret handling
- Use the `/api/auth/config-check` endpoint to verify JWT configuration
- The enhanced auth endpoints (`/api/auth/*`) are recommended over legacy endpoints

### ✅ Authentication Features:
- **Enhanced Password Security**: Uses werkzeug's secure password hashing
- **JWT Token Management**: 24-hour expiration with proper validation
- **Role-Based Access**: Automatic role detection from JWT tokens
- **Swagger Integration**: Full Bearer token support in Swagger UI
- **Debug Logging**: Server logs authentication attempts for troubleshootinging Guide

This document provides example API requests for testing all endpoints in the TucanTest quiz application. Use these examples with tools like curl, Postman, or the Swagger UI at `http://localhost:5000/api/docs/`.

## � Authentication System

The API now uses JWT (JSON Web Token) authentication. Most endpoints require authentication and specific user roles.

### Authentication Flow
1. Register a user account
2. Login to get a JWT token
3. Include the token in the Authorization header for protected endpoints

### Authorization Header Format
```
Authorization: Bearer <your-jwt-token>
```

## �🚀 Getting Started

1. Start your Flask server: `python server.py`
2. Server will be running on: `http://localhost:5000`
3. Swagger UI available at: `http://localhost:5000/api/docs/`

---

## 🔒 Endpoint Access Control

### 🟢 Open to All Users (No Authentication Required)
- User registration
- User login

### 🔵 Authenticated Users Only
- View/edit own profile
- View own notifications
- Mark notifications as read
- Delete notifications

### 🟡 Students Only
- Enroll in public courses
- Accept/deny course invitations for private courses
- Start quiz attempts
- Submit answers to questions

### 🔴 Teachers Only
- CRUD operations for courses
- Invite students to courses by email
- CRUD operations for quizzes
- CRUD operations for questions
- View quiz answers submitted by students
- Grade student answers

---

## 👥 User Management APIs

### 🔒 Authentication Endpoints (New Enhanced Auth)

#### Register a New Teacher (Enhanced)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@university.edu",
    "password": "teacherpass123",
    "role": "teacher"
  }'
```

#### Register a New Student (Enhanced)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Martinez",
    "email": "alex.martinez@student.edu",
    "password": "studentpass123",
    "role": "student"
  }'
```

#### User Login with Enhanced Auth (Returns JWT Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@university.edu",
    "password": "teacherpass123"
  }'
```

**Enhanced Response includes JWT token:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 86400,
  "user": {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@university.edu",
    "role": "teacher",
    "created_at": "2025-07-24T10:00:00",
    "last_login": "2025-07-24T15:30:00"
  }
}
```

#### Validate JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

#### Get Current User Profile (Enhanced Auth)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Check JWT Configuration Status
```bash
curl -X GET http://localhost:5000/api/auth/config-check
```

### 📋 Legacy User Management Endpoints

### Register a New Teacher
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@university.edu",
    "password": "teacherpass123",
    "role": "teacher"
  }'
```

### Register a New Student
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Martinez",
    "email": "alex.martinez@student.edu",
    "password": "studentpass123",
    "role": "student"
  }'
```

### User Login (Returns JWT Token)
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@university.edu",
    "password": "teacherpass123"
  }'
```

**Response includes JWT token:**
```json
{
  "user": {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@university.edu",
    "role": "teacher",
    "created_at": "2025-07-24T10:00:00",
    "last_login": "2025-07-24T15:30:00"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 86400
}
```

### Get User Profile (Requires Authentication)
```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Update User Profile (Requires Authentication)
```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Dr. Sarah Elizabeth Johnson",
    "email": "s.johnson@university.edu"
  }'
```

### Delete User (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/users/2
```

**Note**: 
- Teachers with active courses cannot be deleted (returns 400 error)
- Students will have all related records (enrollments, submissions, etc.) deleted automatically

---

## 📚 Course Management APIs

### Create a New Course (Teachers Only)
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -d '{
    "name": "Introduction to Python Programming",
    "description": "Learn the fundamentals of Python programming language including syntax, data structures, and object-oriented programming.",
    "is_public": true,
    "max_capacity": 30
  }'
```

**Note:** The `teacher_id` is automatically set from the authenticated user's token.

### Get All Courses
```bash
curl -X GET "http://localhost:5000/api/courses?published_only=true&public_only=true"
```

### Get Specific Course
```bash
curl -X GET http://localhost:5000/api/courses/1
```

### Update Course
```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Python Programming",
    "description": "Advanced Python concepts including decorators, generators, and async programming.",
    "is_published": true
  }'
```

### Enroll Student in Course (Students Only)
```bash
curl -X POST http://localhost:5000/api/courses/1/enroll \
  -H "Authorization: Bearer <student-jwt-token>"
```

**Note:** The `student_id` is automatically set from the authenticated user's token.

### Get Course Students
```bash
curl -X GET "http://localhost:5000/api/courses/1/students?status=accepted"
```

### Get User's Courses
```bash
# Get all courses for a user (both taught and enrolled)
curl -X GET http://localhost:5000/api/courses/users/1/courses

# Get only courses where user is enrolled as student
curl -X GET "http://localhost:5000/api/courses/users/2/courses?role=student"

# Get only courses where user is the teacher
curl -X GET "http://localhost:5000/api/courses/users/1/courses?role=teacher"
```

### Get Teacher's Courses (Dedicated Endpoint)
```bash
# Get all courses taught by a teacher
curl -X GET http://localhost:5000/api/course-users/teachers/1/courses

# Get only published courses taught by a teacher
curl -X GET "http://localhost:5000/api/course-users/teachers/1/courses?published_only=true"

# Get teacher's courses with detailed statistics
curl -X GET "http://localhost:5000/api/course-users/teachers/1/courses?include_stats=true"
```

### Get Student's Enrolled Courses (Dedicated Endpoint)
```bash
# Get all courses where student is enrolled
curl -X GET http://localhost:5000/api/course-users/students/2/courses

# Get dropped courses for student
curl -X GET "http://localhost:5000/api/course-users/students/2/courses?status=dropped"

# Get student's courses with grade information
curl -X GET "http://localhost:5000/api/course-users/students/2/courses?include_grades=true"
```

---

## 🎫 Course Invitation Management APIs

### Invite Student to Private Course (Teacher)
```bash
curl -X POST http://localhost:5000/api/courses/1/invite \
  -H "Content-Type: application/json" \
  -d '{
    "student_email": "student@example.com",
    "expires_in_days": 7
  }'
```

### Get Student Invitations
```bash
curl -X GET "http://localhost:5000/api/invitations/users/2?status=pending"
```

### Get Specific Invitation Details
```bash
curl -X GET http://localhost:5000/api/invitations/1
```

### Accept Course Invitation (Student)
```bash
curl -X PUT http://localhost:5000/api/invitations/1/accept
```

### Reject Course Invitation (Student)
```bash
curl -X PUT http://localhost:5000/api/invitations/1/reject
```

---

## 📝 Quiz Management APIs

### Create a New Quiz
```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics Quiz",
    "description": "Test your understanding of Python fundamentals including variables, data types, and control structures.",
    "course_id": 1,
    "due_date": "2025-12-31T23:59:59",
    "is_published": false
  }'
```

### Create Quiz for Specific Course
```bash
curl -X POST http://localhost:5000/api/courses/1/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics Quiz",
    "description": "Test your understanding of Python fundamentals.",
    "due_date": "2025-12-31T23:59:59",
    "is_published": false
  }'
```

### Get All Quizzes
```bash
curl -X GET "http://localhost:5000/api/quizzes?course_id=1&published_only=true"
```

### Get Specific Quiz
```bash
curl -X GET http://localhost:5000/api/quizzes/1
```

### Update Quiz
```bash
curl -X PUT http://localhost:5000/api/quizzes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Fundamentals Assessment",
    "is_published": true,
    "time_limit": 90
  }'
```

### Get Course Quizzes
```bash
curl -X GET http://localhost:5000/api/courses/1/quizzes
```

### Start Quiz Attempt
```bash
curl -X POST http://localhost:5000/api/quizzes/1/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 2
  }'
```

### Get Quiz Submissions
```bash
curl -X GET "http://localhost:5000/api/quizzes/1/submissions?student_id=2"
```

---

## ❓ Question Management APIs

### Create Multiple Choice Question
```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 1,
    "text": "What is the correct way to declare a variable in Python?",
    "question_type": "multiple_choice",
    "points": 2.0,
    "options": [
      {
        "text": "var x = 5",
        "is_correct": false
      },
      {
        "text": "x = 5",
        "is_correct": true
      },
      {
        "text": "int x = 5",
        "is_correct": false
      },
      {
        "text": "declare x = 5",
        "is_correct": false
      }
    ]
  }'
```

### Create Short Answer Question
```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 1,
    "text": "Explain the difference between a list and a tuple in Python.",
    "question_type": "short_answer",
    "points": 5.0
  }'
```

### Get Specific Question
```bash
curl -X GET http://localhost:5000/api/questions/1
```

### Get Quiz Questions
```bash
curl -X GET http://localhost:5000/api/quizzes/1/questions
```

---

## ✅ Answer Submission APIs

### Submit Multiple Choice Answer (Students Only)
```bash
curl -X POST http://localhost:5000/api/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-jwt-token>" \
  -d '{
    "submission_id": 1,
    "question_id": 1,
    "option_id": 2
  }'
```

### Submit Short Answer (Students Only)
```bash
curl -X POST http://localhost:5000/api/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-jwt-token>" \
  -d '{
    "submission_id": 1,
    "question_id": 2,
    "text_answer": "Lists are mutable and can be changed after creation, while tuples are immutable and cannot be modified once created. Lists use square brackets [], tuples use parentheses ()."
  }'
```

**Note:** The `student_id` is automatically set from the authenticated user's token.

### Get Specific Answer
```bash
curl -X GET http://localhost:5000/api/answers/1
```

### Get All Answers for Submission
```bash
curl -X GET http://localhost:5000/api/submissions/1/answers
```

### Complete Quiz Submission
```bash
curl -X POST http://localhost:5000/api/submissions/1/complete
```

---

## 🔔 Notification Management APIs

### Create Manual Notification
```bash
curl -X POST http://localhost:5000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "title": "Assignment Reminder",
    "message": "Don'\''t forget to complete your Python quiz by the due date!",
    "type": "quiz_published",
    "related_id": 1,
    "related_type": "quiz",
    "action_url": "/quizzes/1",
    "expires_at": "2025-12-31T23:59:59"
  }'
```

### Get User Notifications
```bash
curl -X GET "http://localhost:5000/api/users/2/notifications?unread_only=true&limit=10"
```

### Get Specific Notification
```bash
curl -X GET http://localhost:5000/api/notifications/1
```

### Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/1/read
```

### Mark All Notifications as Read
```bash
curl -X PUT http://localhost:5000/api/users/2/notifications/mark-all-read
```

### Send Course Invitation Notification
```bash
curl -X POST http://localhost:5000/api/invitations/1/notify
```

### Send Quiz Published Notification
```bash
curl -X POST http://localhost:5000/api/quizzes/1/notify-published
```

---

## 📊 Statistics APIs

### Teacher Statistics - Quiz Performance with Student Details
```bash
curl -X GET http://localhost:5000/api/statistics/quizzes/1/detailed \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

**Response includes student rankings from best to worst:**
```json
{
  "quiz_id": 1,
  "quiz_title": "Python Basics Quiz",
  "course_name": "Introduction to Python",
  "max_possible_score": 100,
  "average_score": 75.5,
  "student_scores": [
    {
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "score": 95,
      "percentage": 95.0,
      "submission_date": "2025-01-15T10:30:00",
      "graded_date": "2025-01-16T09:00:00"
    }
  ]
}
```

### Teacher Statistics - Course Performance with Student Rankings
```bash
curl -X GET http://localhost:5000/api/statistics/courses/1 \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

**Response includes all students ranked by course performance:**
```json
{
  "course_name": "Introduction to Python",
  "total_enrolled_students": 25,
  "student_statistics": [
    {
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "total_score_earned": 285,
      "total_possible_score": 300,
      "overall_percentage": 95.0,
      "completed_quizzes": 3,
      "graded_quizzes": 3
    }
  ]
}
```

### Student Statistics - Individual Quiz Results
```bash
curl -X GET http://localhost:5000/api/answers/quiz-result/1 \
  -H "Authorization: Bearer <student-jwt-token>"
```

### Student Statistics - Course Performance
```bash
curl -X GET http://localhost:5000/api/answers/course-statistics/1 \
  -H "Authorization: Bearer <student-jwt-token>"
```

### Student Statistics - All Courses Summary
```bash
curl -X GET http://localhost:5000/api/answers/my-course-statistics \
  -H "Authorization: Bearer <student-jwt-token>"
```

---

## 📝 Grading and Submissions APIs

### Teacher - View Quiz Submissions
```bash
curl -X GET http://localhost:5000/api/submissions/quiz/1 \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

### Teacher - View Specific Submission Details
```bash
curl -X GET http://localhost:5000/api/submissions/1 \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

### Teacher - Grade Submission
```bash
curl -X POST http://localhost:5000/api/submissions/1/grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -d '{
    "scores": [
      {
        "question_id": 1,
        "score": 8.5,
        "feedback": "Good answer, but could include more details about error handling."
      },
      {
        "question_id": 2,
        "score": 10.0,
        "feedback": "Excellent explanation!"
      }
    ],
    "overall_feedback": "Great work overall! Keep focusing on including more detailed explanations."
  }'
```

---

## 🧪 Complete Testing Workflow

Here's a complete workflow to test the entire system:

### 1. Setup Users and Course (Enhanced Auth)
```bash
# Register teacher using enhanced auth
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Prof. Smith", "email": "prof@test.com", "password": "password123", "role": "teacher"}'

# Register student using enhanced auth
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "student@test.com", "password": "password123", "role": "student"}'

# Login as teacher to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "prof@test.com", "password": "password123"}'

# Use the returned JWT token in subsequent requests
# Create course (requires teacher JWT token)
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -d '{"name": "Test Course", "description": "A test course", "is_public": true}'
```

### 2. Create Quiz and Questions
```bash
# Create quiz
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Quiz", "description": "A test quiz", "course_id": 1, "max_attempts": 3}'

# Add question
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"quiz_id": 1, "text": "What is 2+2?", "question_type": "multiple_choice", "points": 1.0, "options": [{"text": "3", "is_correct": false}, {"text": "4", "is_correct": true}]}'

# Publish quiz
curl -X PUT http://localhost:5000/api/quizzes/1 \
  -H "Content-Type: application/json" \
  -d '{"is_published": true}'
```

### 3. Student Takes Quiz
```bash
# Enroll student
curl -X POST http://localhost:5000/api/courses/1/enroll \
  -H "Content-Type: application/json" \
  -d '{"student_id": 2}'

# Start quiz
curl -X POST http://localhost:5000/api/quizzes/1/start \
  -H "Content-Type: application/json" \
  -d '{"student_id": 2}'

# Submit answer (assuming submission_id is 1)
curl -X POST http://localhost:5000/api/answers \
  -H "Content-Type: application/json" \
  -d '{"submission_id": 1, "question_id": 1, "selected_option_id": 2}'

# Complete quiz
curl -X POST http://localhost:5000/api/submissions/1/complete
```

### 4. Check Results
```bash
# Get quiz submissions
curl -X GET http://localhost:5000/api/quizzes/1/submissions

# Get user stats
curl -X GET http://localhost:5000/api/users/2/stats

# Get notifications
curl -X GET http://localhost:5000/api/users/2/notifications
```

### 5. Private Course Invitation Workflow
```bash
# Create private course
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Private Course", "description": "Invitation-only course", "teacher_id": 1, "is_public": false}'

# Teacher invites student by email
curl -X POST http://localhost:5000/api/courses/2/invite \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@test.com", "expires_in_days": 7}'

# Student checks notifications
curl -X GET "http://localhost:5000/api/users/2/notifications?unread_only=true"

# Student gets invitation details
curl -X GET http://localhost:5000/api/invitations/1

# Student accepts invitation
curl -X PUT http://localhost:5000/api/invitations/1/accept

# Teacher gets notification about acceptance
curl -X GET "http://localhost:5000/api/users/1/notifications?unread_only=true"

# Check enrollment
curl -X GET http://localhost:5000/api/courses/2/students
```

---

## 📊 Response Examples

### Successful User Registration Response
```json
{
  "id": 1,
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@university.edu",
  "role": "teacher",
  "created_at": "2025-07-22T14:30:00",
  "last_login": null
}
```

### Quiz Submission Response
```json
{
  "id": 1,
  "quiz_id": 1,
  "student_id": 2,
  "student_name": "Alex Martinez",
  "started_at": "2025-07-22T15:00:00",
  "completed_at": null,
  "is_completed": false,
  "is_graded": false,
  "total_score": null,
  "max_possible_score": null,
  "percentage": null,
  "attempt_number": 1,
  "graded_by": null,
  "graded_at": null
}
```

### Error Response Example
```json
{
  "message": "Email already registered",
  "status_code": 400
}
```

---

## 🔧 Testing Tips

1. **Use Swagger UI**: Visit `http://localhost:5000/api/docs/` for interactive testing
2. **Test in Order**: Follow the workflow above for realistic testing scenarios
3. **Check Validation**: Try invalid data to test error handling
4. **Monitor Database**: Check `tucantestschema.db` to verify data persistence
5. **Test Edge Cases**: Try maximum attempts, expired quizzes, etc.

## 📝 Notes

- Replace `localhost:5000` with your actual server URL if different
- User IDs, course IDs, etc. will increment based on your data
- Some endpoints require existing relationships (e.g., student must be enrolled to take quiz)
- Time-sensitive features like quiz due dates can be tested by modifying the dates

Happy testing! 🚀
