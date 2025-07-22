# Tucan Test API Documentation

This document provides comprehensive documentation for all API endpoints in the Tucan Test application.

## Base URL
```
http://localhost:5000
```

## Authentication
Currently, the API does not implement JWT or session-based authentication. Authentication should be added based on your frontend requirements.

---

## 📋 User Management

### Register User
**POST** `/api/users/register`

Register a new user (student or teacher).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"  // or "teacher"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Login User
**POST** `/api/users/login`

Authenticate a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get User Profile
**GET** `/api/users/{user_id}`

Get user details by ID.

### Update User Profile
**PUT** `/api/users/{user_id}`

Update user profile information.

### Get User Statistics
**GET** `/api/users/{user_id}/stats`

Get user-specific statistics (different for students vs teachers).

---

## 🎓 Course Management

### Get All Courses
**GET** `/api/courses`

Get all public courses or filter by teacher.

**Query Parameters:**
- `teacher_id` (optional): Filter courses by teacher
- `public_only` (optional): Only return public courses

### Get Course Details
**GET** `/api/courses/{course_id}`

Get detailed information about a specific course.

### Create Course
**POST** `/api/courses`

Create a new course (teacher only).

**Request Body:**
```json
{
  "name": "Introduction to Python",
  "email": "course@example.com",
  "description": "Learn Python programming basics",
  "is_public": true,
  "max_capacity": 30,
  "teacher_id": 1,
  "is_published": false
}
```

### Update Course
**PUT** `/api/courses/{course_id}`

Update course information.

### Delete Course
**DELETE** `/api/courses/{course_id}`

Delete a course and all related data.

### Enroll in Course
**POST** `/api/courses/{course_id}/enroll`

Enroll a student in a public course.

**Request Body:**
```json
{
  "student_id": 2
}
```

### Drop from Course
**POST** `/api/courses/{course_id}/drop`

Drop a student from a course.

### Get Course Students
**GET** `/api/courses/{course_id}/students`

Get all students enrolled in a course.

---

## 📝 Quiz Management

### Get Course Quizzes
**GET** `/api/courses/{course_id}/quizzes`

Get all quizzes for a course.

**Query Parameters:**
- `published_only` (default: true): Only return published quizzes

### Get Quiz Details
**GET** `/api/quizzes/{quiz_id}`

Get detailed quiz information with questions and options.

### Create Quiz
**POST** `/api/courses/{course_id}/quizzes`

Create a new quiz in a course.

**Request Body:**
```json
{
  "title": "Python Basics Quiz",
  "description": "Test your Python knowledge",
  "due_date": "2024-12-31T23:59:59Z",
  "is_published": false
}
```

### Update Quiz
**PUT** `/api/quizzes/{quiz_id}`

Update quiz information.

### Delete Quiz
**DELETE** `/api/quizzes/{quiz_id}`

Delete a quiz and all related data.

### Submit Quiz
**POST** `/api/quizzes/{quiz_id}/submit`

Submit answers for a quiz.

**Request Body:**
```json
{
  "student_id": 2,
  "answers": [
    {
      "question_id": 1,
      "option_id": 3  // for multiple choice
    },
    {
      "question_id": 2,
      "text_answer": "This is my answer"  // for text questions
    }
  ]
}
```

### Get Quiz Submissions
**GET** `/api/quizzes/{quiz_id}/submissions`

Get all submissions for a quiz (teacher view).

---

## ❓ Question Management

### Get Quiz Questions
**GET** `/api/quizzes/{quiz_id}/questions`

Get all questions for a quiz.

### Get Question Details
**GET** `/api/questions/{question_id}`

Get detailed information about a question.

### Create Question
**POST** `/api/quizzes/{quiz_id}/questions`

Create a new question for a quiz.

**Multiple Choice Example:**
```json
{
  "text": "What is 2 + 2?",
  "type": "multiple_choice",
  "points": 5,
  "options": [
    {"text": "3", "is_correct": false, "order": 1},
    {"text": "4", "is_correct": true, "order": 2},
    {"text": "5", "is_correct": false, "order": 3}
  ]
}
```

**Text Question Example:**
```json
{
  "text": "Explain the concept of inheritance in OOP.",
  "type": "text",
  "points": 10
}
```

### Update Question
**PUT** `/api/questions/{question_id}`

Update question and its options.

### Delete Question
**DELETE** `/api/questions/{question_id}`

Delete a question and all related answers.

---

## 📊 Answer & Grading Management

### Get Submission Answers
**GET** `/api/submissions/{submission_id}/answers`

Get all answers for a quiz submission.

### Get Answer Details
**GET** `/api/answers/{answer_id}`

Get detailed information about a specific answer.

### Grade Answer
**PUT** `/api/answers/{answer_id}/grade`

Grade a text answer (teacher functionality).

**Request Body:**
```json
{
  "score": 8,
  "graded_by": 1,
  "comment": "Good answer, but could be more detailed."
}
```

### Regrade Answer
**PUT** `/api/answers/{answer_id}/regrade`

Modify the score of an already graded answer.

### Get Ungraded Answers
**GET** `/api/questions/{question_id}/answers/ungraded`

Get all ungraded text answers for a question.

### Bulk Grade Answers
**PUT** `/api/answers/bulk-grade`

Grade multiple answers at once.

**Request Body:**
```json
{
  "graded_by": 1,
  "answers": [
    {"answer_id": 1, "score": 8, "comment": "Good work"},
    {"answer_id": 2, "score": 6, "comment": "Needs improvement"}
  ]
}
```

---

## 🔔 Notification Management

### Get User Notifications
**GET** `/api/users/{user_id}/notifications`

Get all notifications for a user.

**Query Parameters:**
- `unread_only` (default: false): Only return unread notifications
- `limit` (optional): Limit number of results

### Mark Notification as Read
**PUT** `/api/notifications/{notification_id}/read`

Mark a specific notification as read.

### Mark All Notifications as Read
**PUT** `/api/users/{user_id}/notifications/mark-all-read`

Mark all notifications as read for a user.

### Create Notification
**POST** `/api/notifications`

Create a new notification.

**Request Body:**
```json
{
  "user_id": 2,
  "title": "New Quiz Available",
  "message": "A new quiz has been published in Python Course",
  "type": "quiz_published",
  "related_id": 5,
  "related_type": "quiz",
  "action_url": "/quizzes/5",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

---

## 💌 Course Invitation Management

### Get Invitation Details
**GET** `/api/invitations/{invitation_id}`

Get details about a course invitation.

### Get Student Invitations
**GET** `/api/users/{student_id}/invitations`

Get all invitations for a student.

**Query Parameters:**
- `status` (optional): Filter by status (pending, accepted, rejected, expired)
- `include_expired` (default: false): Include expired invitations

### Get Course Invitations
**GET** `/api/courses/{course_id}/invitations`

Get all invitations sent for a course (teacher view).

### Send Course Invitation
**POST** `/api/teachers/{teacher_id}/invite-student`

Send a course invitation to a student.

**Request Body:**
```json
{
  "course_id": 1,
  "student_email": "student@example.com",
  "expiry_days": 7
}
```

### Accept Invitation
**PUT** `/api/invitations/{invitation_id}/accept`

Accept a course invitation.

### Reject Invitation
**PUT** `/api/invitations/{invitation_id}/reject`

Reject a course invitation.

### Resend Invitation
**PUT** `/api/invitations/{invitation_id}/resend`

Resend an expired or rejected invitation.

### Cancel Invitation
**DELETE** `/api/invitations/{invitation_id}`

Cancel a pending invitation.

---

## 📈 Statistics & Analytics

### Get Course Statistics
**GET** `/api/courses/{course_id}/statistics`

Get comprehensive statistics for a course.

**Response includes:**
- Overall class performance
- Grade distribution
- Quiz-specific statistics
- Student completion rates

### Get Quiz Statistics
**GET** `/api/quizzes/{quiz_id}/statistics`

Get detailed statistics for a specific quiz.

**Response includes:**
- Score distribution
- Student rankings
- Missing submissions
- Performance breakdown

### Get Student Statistics
**GET** `/api/students/{student_id}/statistics`

Get personal statistics for a student.

**Query Parameters:**
- `course_id` (optional): Filter by specific course

### Get Teacher Statistics
**GET** `/api/teachers/{teacher_id}/statistics`

Get comprehensive statistics for a teacher.

**Response includes:**
- Course overview
- Student engagement
- Recent activity
- Overall teaching metrics

### Get Grade Thresholds
**GET** `/api/grade-thresholds`

Get grade thresholds for scoring.

**Query Parameters:**
- `course_id` (optional): Course-specific thresholds
- `quiz_id` (optional): Quiz-specific thresholds

### Set Grade Thresholds
**POST** `/api/grade-thresholds`

Set custom grade thresholds.

**Request Body:**
```json
{
  "course_id": 1,  // optional
  "quiz_id": 5,    // optional
  "excellent_threshold": 90.0,
  "good_threshold": 80.0,
  "passing_threshold": 60.0
}
```

---

## 🔧 Utility Endpoints

### Health Check
**GET** `/api/health`

Check API and database health.

### Cleanup Expired Invitations
**POST** `/api/invitations/cleanup-expired`

Mark expired invitations as expired (maintenance).

---

## 📝 Notification Types

The system supports various notification types:

- `course_invitation` - Student receives course invitation
- `invitation_accepted` - Teacher notified when invitation accepted
- `invitation_rejected` - Teacher notified when invitation rejected
- `quiz_published` - Students notified of new quiz
- `course_published` - Students notified of published course
- `quiz_graded` - Student notified when quiz is graded
- `course_joined` - Teacher/student notified of new enrollment
- `quiz_answered` - Teacher notified of quiz submission
- `quiz_due_soon` - Student notified of approaching due date

---

## 🎯 Grade Thresholds

The system uses configurable grade thresholds:

- **Excellent**: Default 90%+ (can be customized)
- **Good**: Default 80-89% (can be customized)
- **Passing**: Default 60-79% (can be customized)
- **Failing**: Below passing threshold

Thresholds can be set at three levels:
1. System-wide (default)
2. Course-specific
3. Quiz-specific (highest priority)

---

## 🔍 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 📚 Data Models

### Key Relationships

- **User** → **Course** (teacher relationship)
- **User** → **Enrollment** (student enrollment)
- **Course** → **Quiz** (course contains quizzes)
- **Quiz** → **Question** (quiz contains questions)
- **Question** → **Option** (multiple choice options)
- **Quiz** → **QuizSubmission** (student submissions)
- **QuizSubmission** → **Answer** (individual question answers)
- **User** → **Notification** (user notifications)
- **Course** → **CourseInvitation** (private course invitations)

This API provides complete functionality for the quiz application including user management, course administration, quiz creation and taking, grading, notifications, and comprehensive analytics.
