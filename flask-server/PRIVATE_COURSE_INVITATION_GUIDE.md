# 🎓 Private Course Invitation System Guide

## Overview

The TucanTest platform now includes a comprehensive private course invitation system that allows teachers to invite students by email and enables proper notification workflows for course invitations.

## 🔄 Complete Workflow

### 1. Teacher Creates Private Course
```bash
POST /api/courses
{
  "name": "Advanced Python Programming",
  "description": "Invitation-only advanced course",
  "teacher_id": 1,
  "is_public": false,
  "max_capacity": 20
}
```

### 2. Teacher Invites Student by Email
```bash
POST /api/courses/{course_id}/invite
{
  "student_email": "student@university.edu",
  "expires_in_days": 7
}
```

**What happens automatically:**
- ✅ Invitation record created in database
- ✅ Notification sent to student immediately
- ✅ Expiration date set (7 days default)

### 3. Student Receives Notification
```bash
GET /api/users/{student_id}/notifications?unread_only=true
```

**Student sees:**
- 📧 "Course Invitation Received"
- 📝 "You have been invited to join 'Advanced Python Programming' by Dr. Smith"
- 🔗 Action URL: `/invitations/{invitation_id}`

### 4. Student Views Invitation Details
```bash
GET /api/invitations/{invitation_id}
```

**Response includes:**
- Course information (name, description, teacher)
- Invitation status and expiration
- Full context for decision-making

### 5. Student Responds to Invitation

#### Option A: Accept Invitation
```bash
PUT /api/invitations/{invitation_id}/accept
```

**What happens automatically:**
- ✅ Invitation status → 'accepted'
- ✅ Student enrolled in course
- ✅ Notification sent to teacher about acceptance
- ✅ Response timestamp recorded

#### Option B: Reject Invitation
```bash
PUT /api/invitations/{invitation_id}/reject
```

**What happens automatically:**
- ✅ Invitation status → 'rejected'
- ✅ Notification sent to teacher about rejection
- ✅ Response timestamp recorded

### 6. Teacher Receives Response Notification

**If accepted:**
- 📧 "Course Invitation Accepted"
- 📝 "Jane Doe has joined your invitation to join 'Advanced Python Programming'"

**If rejected:**
- 📧 "Course Invitation Rejected"
- 📝 "Jane Doe has declined your invitation to join 'Advanced Python Programming'"

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | User Type |
|----------|--------|---------|-----------|
| `/api/courses/{id}/invite` | POST | Invite student by email | Teacher |
| `/api/invitations/users/{student_id}` | GET | Student's invitations | Student |
| `/api/invitations/{id}` | GET | Invitation details | Student |
| `/api/invitations/{id}/accept` | PUT | Accept invitation | Student |
| `/api/invitations/{id}/reject` | PUT | Reject invitation | Student |
| `/api/users/{id}/notifications` | GET | View notifications | Both |

## 🔔 Notification Types

### For Students:
- **`course_invitation`**: Initial invitation notification
- **Action Required**: Student must accept/reject

### For Teachers:
- **`invitation_accepted`**: Student accepted invitation
- **`invitation_rejected`**: Student rejected invitation
- **Informational**: No action required

## ⚡ Real-Time Features

### Automatic Notification Creation
When a teacher sends an invitation, the system automatically:
1. Creates the invitation record
2. Generates a notification for the student
3. Sets appropriate expiration dates
4. Returns success confirmation

### Bidirectional Communication
- Teacher → Student: Invitation notifications
- Student → Teacher: Response notifications
- Both parties stay informed of status changes

## 🛡️ Validation & Security

### Invitation Validation
- ✅ Student email must exist in system
- ✅ Student role must be 'student'
- ✅ No duplicate invitations allowed
- ✅ No inviting already enrolled students
- ✅ Respects course capacity limits

### Expiration Handling
- ✅ Configurable expiration period
- ✅ Automatic status updates to 'expired'
- ✅ Cannot respond to expired invitations

### Status Management
Valid invitation statuses:
- `pending`: Awaiting student response
- `accepted`: Student enrolled in course
- `rejected`: Student declined invitation
- `expired`: Invitation past expiration date

## 🧪 Testing Scenarios

### Happy Path Test
```bash
# 1. Teacher creates private course
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Course", "teacher_id": 1, "is_public": false}'

# 2. Teacher invites student
curl -X POST http://localhost:5000/api/courses/1/invite \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@test.com"}'

# 3. Student checks notifications
curl -X GET "http://localhost:5000/api/users/2/notifications?unread_only=true"

# 4. Student accepts invitation
curl -X PUT http://localhost:5000/api/invitations/1/accept

# 5. Teacher sees acceptance notification
curl -X GET "http://localhost:5000/api/users/1/notifications?unread_only=true"
```

### Error Handling Tests
```bash
# Try to invite non-existent student
curl -X POST http://localhost:5000/api/courses/1/invite \
  -H "Content-Type: application/json" \
  -d '{"student_email": "nonexistent@test.com"}'
# Expected: 404 - Student not found

# Try to accept already responded invitation
curl -X PUT http://localhost:5000/api/invitations/1/accept
# Expected: 400 - Already responded

# Try to invite already enrolled student
curl -X POST http://localhost:5000/api/courses/1/invite \
  -H "Content-Type: application/json" \
  -d '{"student_email": "enrolled@test.com"}'
# Expected: 400 - Already enrolled
```

## 🎯 Key Benefits

### For Teachers:
- 👨‍🏫 Control over course enrollment
- 📧 Email-based invitation system
- 📊 Track invitation responses
- 🔔 Real-time response notifications

### For Students:
- 📱 Immediate notification delivery
- 📋 Clear invitation details
- ⏰ Expiration awareness
- 🚀 One-click accept/reject

### For System:
- 🔄 Automated workflow
- 📝 Complete audit trail
- 🛡️ Robust validation
- 🎛️ Flexible configuration

## 🔧 Configuration Options

### Invitation Expiration
- Default: 7 days
- Configurable per invitation
- Set to `null` for no expiration

### Course Capacity
- Respected during acceptance
- Prevents over-enrollment
- Clear error messages

### Notification Preferences
- All notifications stored in database
- Future: Email/SMS integration possible
- Filterable by type and status

## 📈 Future Enhancements

### Planned Features:
- 📧 Email integration for external notifications
- 📅 Bulk invitation management
- 🔄 Invitation reminder system
- 📊 Analytics dashboard for teachers
- 🎨 Custom invitation messages

This system provides a complete, robust solution for managing private course invitations with proper notification workflows and user experience considerations.
