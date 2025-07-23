from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Notification, User, Course, Quiz, CourseInvitation, Enrollment
from datetime import datetime, timedelta
import re

# Create namespace for notifications
notifications_ns = Namespace('notifications', description='Notification management operations')

# Define models for Swagger documentation
notification_model = notifications_ns.model('Notification', {
    'id': fields.Integer(description='Notification ID'),
    'user_id': fields.Integer(description='User ID who receives the notification'),
    'title': fields.String(description='Notification title'),
    'message': fields.String(description='Notification message'),
    'type': fields.String(description='Notification type', enum=['course_invitation', 'quiz_published', 'quiz_graded', 'course_joined', 'invitation_accepted', 'invitation_rejected']),
    'is_read': fields.Boolean(description='Whether notification has been read'),
    'related_id': fields.Integer(description='Related entity ID'),
    'related_type': fields.String(description='Related entity type'),
    'action_url': fields.String(description='Action URL for the notification'),
    'expires_at': fields.DateTime(description='Notification expiration date'),
    'created_at': fields.DateTime(description='Notification creation date'),
    'is_expired': fields.Boolean(description='Whether notification is expired')
})

notification_create = notifications_ns.model('NotificationCreate', {
    'user_id': fields.Integer(required=True, description='User ID who receives the notification', example=1),
    'title': fields.String(required=True, description='Notification title', example='Quiz Available'),
    'message': fields.String(required=True, description='Notification message', example='A new quiz has been published'),
    'type': fields.String(required=True, description='Notification type', enum=['course_invitation', 'quiz_published', 'quiz_graded', 'course_joined'], example='quiz_published'),
    'related_id': fields.Integer(description='Related entity ID', example=5),
    'related_type': fields.String(description='Related entity type', example='quiz'),
    'action_url': fields.String(description='Action URL for the notification', example='/quizzes/5'),
    'expires_at': fields.String(description='Expiration date (ISO format)', example='2025-12-31T23:59:59')
})

notification_list = notifications_ns.model('NotificationList', {
    'user_id': fields.Integer(description='User ID'),
    'total_count': fields.Integer(description='Total number of notifications'),
    'unread_count': fields.Integer(description='Number of unread notifications'),
    'notifications': fields.List(fields.Nested(notification_model))
})

@notifications_ns.route('/users/<int:user_id>/notifications')
class UserNotificationsAPI(Resource):
    @notifications_ns.doc('get_user_notifications')
    @notifications_ns.marshal_with(notification_list)
    @notifications_ns.response(404, 'User not found')
    @notifications_ns.param('unread_only', 'Filter to show only unread notifications', type='boolean', default=False)
    @notifications_ns.param('limit', 'Limit number of notifications returned', type='integer')
    def get(self, user_id):
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
                }
                notification_list.append(notification_data)
            
            return {
                'user_id': user_id,
                'total_count': len(notification_list),
                'unread_count': len([n for n in notification_list if not n['is_read']]),
                'notifications': notification_list
            }
            
        except Exception as e:
            notifications_ns.abort(500, str(e))

@notifications_ns.route('/<int:notification_id>')
class NotificationAPI(Resource):
    @notifications_ns.doc('get_notification')
    @notifications_ns.marshal_with(notification_model)
    @notifications_ns.response(404, 'Notification not found')
    def get(self, notification_id):
        """Get a specific notification"""
        try:
            notification = Notification.query.get_or_404(notification_id)
            
            return {
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
            }
            
        except Exception as e:
            notifications_ns.abort(404, 'Notification not found')

    @notifications_ns.doc('delete_notification')
    @notifications_ns.response(200, 'Notification deleted successfully')
    @notifications_ns.response(404, 'Notification not found')
    def delete(self, notification_id):
        """Delete a notification"""
        try:
            notification = Notification.query.get_or_404(notification_id)
            
            db.session.delete(notification)
            db.session.commit()
            
            return {'message': 'Notification deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, str(e))

@notifications_ns.route('/<int:notification_id>/read')
class NotificationReadAPI(Resource):
    @notifications_ns.doc('mark_notification_read')
    @notifications_ns.response(200, 'Notification marked as read')
    @notifications_ns.response(404, 'Notification not found')
    def put(self, notification_id):
        """Mark a notification as read"""
        try:
            notification = Notification.query.get_or_404(notification_id)
            
            notification.is_read = True
            db.session.commit()
            
            return {
                'message': 'Notification marked as read',
                'notification_id': notification_id
            }
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, str(e))

@notifications_ns.route('/users/<int:user_id>/notifications/mark-all-read')
class MarkAllNotificationsReadAPI(Resource):
    @notifications_ns.doc('mark_all_notifications_read')
    @notifications_ns.response(200, 'All notifications marked as read')
    @notifications_ns.response(404, 'User not found')
    def put(self, user_id):
        """Mark all notifications as read for a user"""
        try:
            user = User.query.get_or_404(user_id)
            
            # Update all unread notifications
            updated = Notification.query.filter_by(
                user_id=user_id, 
                is_read=False
            ).update({'is_read': True})
            
            db.session.commit()
            
            return {
                'message': f'Marked {updated} notifications as read',
                'updated_count': updated
            }
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, str(e))

@notifications_ns.route('/')
class NotificationCreateAPI(Resource):
    @notifications_ns.doc('create_notification')
    @notifications_ns.expect(notification_create)
    @notifications_ns.marshal_with(notification_model, code=201)
    @notifications_ns.response(400, 'Validation error')
    def post(self):
        """Create a new notification"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['user_id', 'title', 'message', 'type']
            for field in required_fields:
                if field not in data or not data[field]:
                    notifications_ns.abort(400, f'{field} is required')
            
            # Validate user exists
            user = User.query.get_or_404(data['user_id'])
            
            # Parse expiration date if provided
            expires_at = None
            if data.get('expires_at'):
                try:
                    expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00'))
                except ValueError:
                    notifications_ns.abort(400, 'Invalid expires_at format')
            
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
            
            return {
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
            }, 201
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, str(e))

# Helper endpoints for notification automation
@notifications_ns.route('/invitations/<int:invitation_id>/notify')
class InvitationNotifyAPI(Resource):
    @notifications_ns.doc('notify_course_invitation')
    @notifications_ns.response(200, 'Invitation notification sent')
    @notifications_ns.response(500, 'Failed to send notification')
    def post(self, invitation_id):
        """Send notification for course invitation"""
        try:
            invitation = CourseInvitation.query.get(invitation_id)
            if not invitation:
                notifications_ns.abort(404, 'Invitation not found')
            
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
            
            return {'message': 'Invitation notification sent'}
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, 'Failed to send notification')

@notifications_ns.route('/quizzes/<int:quiz_id>/notify-published')
class QuizPublishedNotifyAPI(Resource):
    @notifications_ns.doc('notify_quiz_published')
    @notifications_ns.response(200, 'Quiz published notifications sent')
    @notifications_ns.response(500, 'Failed to send notifications')
    def post(self, quiz_id):
        """Send notifications when quiz is published"""
        try:
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                notifications_ns.abort(404, 'Quiz not found')
            
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
            return {'message': 'Quiz published notifications sent'}
            
        except Exception as e:
            db.session.rollback()
            notifications_ns.abort(500, 'Failed to send notifications')
