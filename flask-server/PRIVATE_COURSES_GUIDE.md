# Private Course Management Guide

## Overview
The system now supports both **public** and **private** courses with different enrollment workflows:

### Public Courses (is_public = true)
- Students can enroll directly using `/api/courses/{course_id}/enroll`
- Students are automatically accepted (status = 'accepted')
- No teacher approval required

### Private Courses (is_public = false)
- **Two enrollment methods:**

#### Method 1: Teacher Invites Students by Email
1. **Teacher invites student**: `POST /api/courses/{course_id}/invite`
   ```json
   {
     "student_email": "student@example.com",
     "expires_in_days": 7
   }
   ```

2. **Student accepts invitation**: Use the invitation system endpoints

#### Method 2: Direct Enrollment (Public Courses Only)
- **Public courses**: `POST /api/courses/{course_id}/enroll`
  - Student gets status = 'accepted' (automatically accepted if space available)
- **Private courses**: Direct enrollment not allowed - must use invitation system

## New API Endpoints Added:

### 1. Invite Student to Course
- **Endpoint**: `POST /api/courses/{course_id}/invite`
- **Purpose**: Teachers can invite students by email to private courses
- **Body**: 
  ```json
  {
    "student_email": "student@example.com",
    "expires_in_days": 7
  }
  ```

### 2. View Course Invitations
- **Endpoint**: `GET /api/invitations/users/{student_id}` 
- **Purpose**: Students can see all their course invitations

### 3. Student Course Management
- **Endpoint**: `GET /api/course-users/students/{student_id}/courses`
- **Purpose**: View enrolled courses with optional grade information

## Grade Management:
- **Initial Grade**: All enrollments start with grade = 0.0
- **Grade Calculation**: Grades are calculated dynamically based on quiz performance
- **Grade Updates**: The system calculates grades based on all graded quiz submissions

## Database Changes:
- Added `grade` field to Enrollment model (default: 0.0)
- Added `updated_at` field to Course model
- Enhanced cascade relationships for proper data cleanup

## Testing Workflow:

### For Public Courses:
1. Create a public course (is_public = true)
2. Student enrolls directly → automatically accepted

### For Private Courses:
1. Create a private course (is_public = false)
2. **Option A**: Teacher invites student by email → student gets invitation
3. **Option B**: Student requests enrollment → gets pending status → teacher approves

## Next Steps to Complete:
1. Add student-facing endpoints for accepting/rejecting invitations
2. Add notification system for invitations and approvals
3. Add email notifications for invitations
4. Add expiration handling for invitations
