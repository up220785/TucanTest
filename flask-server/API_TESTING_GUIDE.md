# 🧪 TucanTest API Testing Guide

This document provides example API requests for testing all endpoints in the TucanTest quiz application. Use these examples with tools like curl, Postman, or the Swagger UI at `http://localhost:5000/api/docs/`.

## 🚀 Getting Started

1. Start your Flask server: `python server.py`
2. Server will be running on: `http://localhost:5000`
3. Swagger UI available at: `http://localhost:5000/api/docs/`

---

## 👥 User Management APIs

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

### User Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@university.edu",
    "password": "teacherpass123"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/1
```

### Update User Profile
```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
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

### Create a New Course
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Introduction to Python Programming",
    "description": "Learn the fundamentals of Python programming language including syntax, data structures, and object-oriented programming.",
    "teacher_id": 1,
    "is_public": true,
    "enrollment_limit": 30
  }'
```

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

### Enroll Student in Course
```bash
curl -X POST http://localhost:5000/api/courses/1/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 2
  }'
```

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

### Submit Multiple Choice Answer
```bash
curl -X POST http://localhost:5000/api/answers \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1,
    "question_id": 1,
    "selected_option_id": 2
  }'
```

### Submit Short Answer
```bash
curl -X POST http://localhost:5000/api/answers \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1,
    "question_id": 2,
    "text_answer": "Lists are mutable and can be changed after creation, while tuples are immutable and cannot be modified once created. Lists use square brackets [], tuples use parentheses ()."
  }'
```

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

## 🧪 Complete Testing Workflow

Here's a complete workflow to test the entire system:

### 1. Setup Users and Course
```bash
# Register teacher
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Prof. Smith", "email": "prof@test.com", "password": "password123", "role": "teacher"}'

# Register student  
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "student@test.com", "password": "password123", "role": "student"}'

# Create course
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Course", "description": "A test course", "teacher_id": 1, "is_public": true}'
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
