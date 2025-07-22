from flask import Blueprint, request, jsonify
from models import db, Notification, User, Course, Quiz, CourseInvitation, Enrollment
from datetime import datetime, timedelta

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/api/users/<int:user_id>/notifications', methods=['GET'])
def get_user_notifications(user_id):
    """Get all notifications for a user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int)
        
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        # Filter out expired notifications
        query = query.filter(
            db.or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        query = query.order_by(Notification.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        notifications = query.all()
        
        notification_list = []
        for notification in notifications:
            notification_data = {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'is_read': notification.is_read,
                'related_id': notification.related_id,
                'related_type': notification.related_type,
                'action_url': notification.action_url,
                'expires_at': notification.expires_at.isoformat() if notification.expires_at else None,
                'created_at': notification.created_at.isoformat() if notification.created_at else None,
                'is_expired': notification.is_expired()
            }
            notification_list.append(notification_data)
        
        return jsonify({
            'user_id': user_id,
            'total_count': len(notification_list),
            'unread_count': len([n for n in notification_list if not n['is_read']]),
            'notifications': notification_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/api/notifications/<int:notification_id>', methods=['GET'])
def get_notification(notification_id):
    """Get a specific notification"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        return jsonify({
            'id': notification.id,
            'user_id': notification.user_id,
            'title': notification.title,
            'message': notification.message,
            'type': notification.notification_type,
            'is_read': notification.is_read,
            'related_id': notification.related_id,
            'related_type': notification.related_type,
            'action_url': notification.action_url,
            'expires_at': notification.expires_at.isoformat() if notification.expires_at else None,
            'created_at': notification.created_at.isoformat() if notification.created_at else None,
            'is_expired': notification.is_expired()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification_id': notification_id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/api/users/<int:user_id>/notifications/mark-all-read', methods=['PUT'])
def mark_all_notifications_read(user_id):
    """Mark all notifications as read for a user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Update all unread notifications
        updated = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {updated} notifications as read',
            'updated_count': updated
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/api/notifications', methods=['POST'])
def create_notification():
    """Create a new notification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'title', 'message', 'type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate user exists
        user = User.query.get_or_404(data['user_id'])
        
        # Parse expiration date if provided
        expires_at = None
        if data.get('expires_at'):
            try:
                expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid expires_at format'}), 400
        
        # Create notification
        notification = Notification(
            user_id=data['user_id'],
            title=data['title'],
            message=data['message'],
            notification_type=data['type'],
            related_id=data.get('related_id'),
            related_type=data.get('related_type'),
            action_url=data.get('action_url'),
            expires_at=expires_at
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Notification created successfully',
            'notification': {
                'id': notification.id,
                'title': notification.title,
                'type': notification.notification_type,
                'user_id': notification.user_id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notification deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Helper functions for creating specific types of notifications

def create_course_invitation_notification(invitation_id):
    """Create notification for course invitation"""
    try:
        invitation = CourseInvitation.query.get(invitation_id)
        if not invitation:
            return False
        
        notification = Notification(
            user_id=invitation.student_id,
            title="Course Invitation Received",
            message=f"You have been invited to join the course '{invitation.course.name}' by {invitation.course.teacher.name}",
            notification_type="course_invitation",
            related_id=invitation.id,
            related_type="invitation",
            action_url=f"/invitations/{invitation.id}",
            expires_at=invitation.expires_at
        )
        
        db.session.add(notification)
        db.session.commit()
        return True
        
    except Exception as e:
        db.session.rollback()
        return False

def create_invitation_response_notification(invitation_id, accepted):
    """Create notification when student responds to invitation"""
    try:
        invitation = CourseInvitation.query.get(invitation_id)
        if not invitation:
            return False
        
        status = "accepted" if accepted else "rejected"
        action = "joined" if accepted else "declined"
        
        notification = Notification(
            user_id=invitation.course.teacher_id,
            title=f"Course Invitation {status.title()}",
            message=f"{invitation.invited_student.name} has {action} your invitation to join '{invitation.course.name}'",
            notification_type="invitation_accepted" if accepted else "invitation_rejected",
            related_id=invitation.course_id,
            related_type="course",
            action_url=f"/courses/{invitation.course_id}/students"
        )
        
        db.session.add(notification)
        db.session.commit()
        return True
        
    except Exception as e:
        db.session.rollback()
        return False

def create_quiz_published_notification(quiz_id):
    """Create notifications when a quiz is published"""
    try:
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return False
        
        # Get all enrolled students in the course
        enrollments = Enrollment.query.filter_by(
            course_id=quiz.course_id,
            status='accepted'
        ).all()
        
        for enrollment in enrollments:
            notification = Notification(
                user_id=enrollment.student_id,
                title="New Quiz Available",
                message=f"A new quiz '{quiz.title}' has been published in '{quiz.course.name}'",
                notification_type="quiz_published",
                related_id=quiz.id,
                related_type="quiz",
                action_url=f"/quizzes/{quiz.id}",
                expires_at=quiz.due_date if quiz.due_date else None
            )
            db.session.add(notification)
        
        db.session.commit()
        return True
        
    except Exception as e:
        db.session.rollback()
        return False

def create_quiz_graded_notification(submission_id):
    """Create notification when a quiz is graded"""
    try:
        from models import QuizSubmission
        submission = QuizSubmission.query.get(submission_id)
        if not submission:
            return False
        
        percentage = submission.get_percentage()
        
        notification = Notification(
            user_id=submission.student_id,
            title="Quiz Graded",
            message=f"Your quiz '{submission.quiz.title}' has been graded. Score: {submission.total_score}/{submission.max_possible_score} ({percentage}%)",
            notification_type="quiz_graded",
            related_id=submission.id,
            related_type="submission",
            action_url=f"/submissions/{submission.id}/results"
        )
        
        db.session.add(notification)
        db.session.commit()
        return True
        
    except Exception as e:
        db.session.rollback()
        return False

def create_course_joined_notification(enrollment_id):
    """Create notification when student joins a course"""
    try:
        enrollment = Enrollment.query.get(enrollment_id)
        if not enrollment:
            return False
        
        # Notification to teacher
        teacher_notification = Notification(
            user_id=enrollment.course.teacher_id,
            title="New Student Enrolled",
            message=f"{enrollment.student.name} has enrolled in your course '{enrollment.course.name}'",
            notification_type="course_joined",
            related_id=enrollment.course_id,
            related_type="course",
            action_url=f"/courses/{enrollment.course_id}/students"
        )
        
        # Notification to student
        student_notification = Notification(
            user_id=enrollment.student_id,
            title="Successfully Enrolled",
            message=f"You have successfully enrolled in '{enrollment.course.name}'",
            notification_type="course_joined",
            related_id=enrollment.course_id,
            related_type="course",
            action_url=f"/courses/{enrollment.course_id}"
        )
        
        db.session.add(teacher_notification)
        db.session.add(student_notification)
        db.session.commit()
        return True
        
    except Exception as e:
        db.session.rollback()
        return False

# API endpoints for notification helpers
@notifications_bp.route('/api/invitations/<int:invitation_id>/notify', methods=['POST'])
def notify_course_invitation(invitation_id):
    """Send notification for course invitation"""
    success = create_course_invitation_notification(invitation_id)
    if success:
        return jsonify({'message': 'Invitation notification sent'})
    else:
        return jsonify({'error': 'Failed to send notification'}), 500

@notifications_bp.route('/api/quizzes/<int:quiz_id>/notify-published', methods=['POST'])
def notify_quiz_published(quiz_id):
    """Send notifications when quiz is published"""
    success = create_quiz_published_notification(quiz_id)
    if success:
        return jsonify({'message': 'Quiz published notifications sent'})
    else:
        return jsonify({'error': 'Failed to send notifications'}), 500
