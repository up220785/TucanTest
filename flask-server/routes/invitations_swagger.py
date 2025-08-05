from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, CourseInvitation, Course, User, Enrollment
from datetime import datetime
from auth import require_teacher, require_student, require_auth

# Create namespace for invitation responses
invitations_ns = Namespace('invitations', description='Course invitation response operations')

# Define models for Swagger documentation
invitation_model = invitations_ns.model('CourseInvitation', {
    'id': fields.Integer(description='Invitation ID'),
    'course_id': fields.Integer(description='Course ID'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'status': fields.String(description='Invitation status', enum=['pending', 'accepted', 'rejected', 'expired']),
    'invited_at': fields.DateTime(description='Invitation date'),
    'responded_at': fields.DateTime(description='Response date'),
    'expires_at': fields.DateTime(description='Expiration date')
})

invitation_response_model = invitations_ns.model('InvitationResponse', {
    'message': fields.String(description='Response message'),
    'course_name': fields.String(description='Course name'),
    'enrollment_id': fields.Integer(description='Enrollment ID if accepted')
})

@invitations_ns.route('/<int:invitation_id>')
class InvitationDetailAPI(Resource):
    @invitations_ns.doc('get_invitation_details', security='Bearer')
    @invitations_ns.marshal_with(invitation_model)
    @invitations_ns.response(404, 'Invitation not found')
    @invitations_ns.response(401, 'Authentication required')
    @require_auth
    def get(self, invitation_id, current_user=None):
        """Get details of a specific course invitation"""
        try:
            invitation = CourseInvitation.query.get_or_404(invitation_id)
            
            return {
                'id': invitation.id,
                'course_id': invitation.course_id,
                'student_id': invitation.student_id,
                'student_name': invitation.invited_student.name,
                'student_email': invitation.invited_student.email,
                'status': invitation.status,
                'invited_at': invitation.invited_at.isoformat() if invitation.invited_at else None,
                'responded_at': invitation.responded_at.isoformat() if invitation.responded_at else None,
                'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None
            }
            
        except Exception as e:
            invitations_ns.abort(500, str(e))

@invitations_ns.route('/<int:invitation_id>/accept')
class AcceptInvitationAPI(Resource):
    @invitations_ns.doc('accept_course_invitation', security='Bearer')
    @invitations_ns.marshal_with(invitation_response_model)
    @invitations_ns.response(400, 'Invalid invitation state')
    @invitations_ns.response(404, 'Invitation not found')
    @invitations_ns.response(401, 'Authentication required')
    @invitations_ns.response(403, 'Student access required')
    @invitations_ns.response(409, 'Student already enrolled or course full')
    @require_student
    def put(self, invitation_id, current_user=None):
        """Accept a course invitation"""
        try:
            invitation = CourseInvitation.query.get_or_404(invitation_id)
            
            # Check if invitation is still valid
            if invitation.status != 'pending':
                invitations_ns.abort(400, 'Invitation has already been responded to')
            
            if invitation.expires_at and invitation.expires_at < datetime.utcnow():
                invitation.status = 'expired'
                db.session.commit()
                invitations_ns.abort(400, 'Invitation has expired')
            
            # Check if student is already enrolled
            existing_enrollment = Enrollment.query.filter_by(
                course_id=invitation.course_id,
                student_id=invitation.student_id,
                status='accepted'
            ).first()
            
            if existing_enrollment:
                invitations_ns.abort(409, 'Student is already enrolled in this course')
            
            # Check if course is full (if it has capacity limit)
            course = invitation.course
            if course.max_capacity and course.get_enrolled_count() >= course.max_capacity:
                invitations_ns.abort(409, 'Course is full')
            
            # Accept invitation
            invitation.status = 'accepted'
            invitation.responded_at = datetime.utcnow()
            
            # Create or update enrollment
            enrollment = Enrollment.query.filter_by(
                course_id=invitation.course_id,
                student_id=invitation.student_id
            ).first()
            
            if enrollment:
                enrollment.status = 'accepted'
                enrollment.enrollment_type = 'invitation'
                enrollment.enrolled_at = datetime.utcnow()
                enrollment.dropped_at = None
            else:
                enrollment = Enrollment(
                    course_id=invitation.course_id,
                    student_id=invitation.student_id,
                    status='accepted',
                    enrollment_type='invitation'
                )
                db.session.add(enrollment)
            
            db.session.commit()
            
            # Create notification for teacher
            from routes.notifications import create_invitation_response_notification
            create_invitation_response_notification(invitation_id, accepted=True)
            
            # Create notification for student (successful enrollment)
            from models import Notification
            student_notification = Notification(
                user_id=invitation.student_id,
                title=f"Course Enrollment Confirmed",
                message=f"You have successfully joined '{course.name}'. You can now access course materials and take quizzes.",
                notification_type="invitation_accepted",
                related_id=course.id,
                related_type="course",
                action_url=f"/courses/{course.id}/view"
            )
            db.session.add(student_notification)
            db.session.commit()
            
            return {
                'message': 'Invitation accepted successfully',
                'course_name': course.name,
                'enrollment_id': enrollment.id
            }
            
        except Exception as e:
            db.session.rollback()
            invitations_ns.abort(500, str(e))

@invitations_ns.route('/<int:invitation_id>/reject')
class RejectInvitationAPI(Resource):
    @invitations_ns.doc('reject_course_invitation', security='Bearer')
    @invitations_ns.marshal_with(invitation_response_model)
    @invitations_ns.response(400, 'Invalid invitation state')
    @invitations_ns.response(404, 'Invitation not found')
    @invitations_ns.response(401, 'Authentication required')
    @invitations_ns.response(403, 'Student access required')
    @require_student
    def put(self, invitation_id, current_user=None):
        """Reject a course invitation"""
        try:
            invitation = CourseInvitation.query.get_or_404(invitation_id)
            
            # Check if invitation is still valid
            if invitation.status != 'pending':
                invitations_ns.abort(400, 'Invitation has already been responded to')
            
            if invitation.expires_at and invitation.expires_at < datetime.utcnow():
                invitation.status = 'expired'
                db.session.commit()
                invitations_ns.abort(400, 'Invitation has expired')
            
            # Reject invitation
            invitation.status = 'rejected'
            invitation.responded_at = datetime.utcnow()
            
            db.session.commit()
            
            # Create notification for teacher
            from routes.notifications import create_invitation_response_notification
            create_invitation_response_notification(invitation_id, accepted=False)
            
            return {
                'message': 'Invitation rejected',
                'course_name': invitation.course.name,
                'enrollment_id': None
            }
            
        except Exception as e:
            db.session.rollback()
            invitations_ns.abort(500, str(e))

@invitations_ns.route('/users/<int:student_id>')
class StudentInvitationsAPI(Resource):
    @invitations_ns.doc('get_student_invitations', security='Bearer')
    @invitations_ns.marshal_list_with(invitation_model)
    @invitations_ns.response(403, 'User is not a student')
    @invitations_ns.response(404, 'User not found')
    @invitations_ns.response(401, 'Authentication required')
    @invitations_ns.param('status', 'Filter by invitation status', enum=['pending', 'accepted', 'rejected', 'expired'])
    @invitations_ns.param('include_expired', 'Include expired invitations', type='boolean', default=False)
    @require_auth
    def get(self, student_id, current_user=None):
        """Get all invitations for a student"""
        try:
            student = User.query.get_or_404(student_id)
            
            if student.role != 'student':
                invitations_ns.abort(403, 'Only students can have course invitations')
            
            # Get query parameters
            status = request.args.get('status')
            include_expired = request.args.get('include_expired', 'false').lower() == 'true'
            
            query = CourseInvitation.query.filter_by(student_id=student_id)
            
            if status:
                query = query.filter_by(status=status)
            
            if not include_expired:
                query = query.filter(
                    db.or_(
                        CourseInvitation.expires_at.is_(None),
                        CourseInvitation.expires_at > datetime.utcnow()
                    )
                )
            
            invitations = query.order_by(CourseInvitation.invited_at.desc()).all()
            
            invitation_list = []
            for invitation in invitations:
                invitation_data = {
                    'id': invitation.id,
                    'course_id': invitation.course_id,
                    'student_id': invitation.student_id,
                    'student_name': invitation.invited_student.name,
                    'student_email': invitation.invited_student.email,
                    'status': invitation.status,
                    'invited_at': invitation.invited_at.isoformat() if invitation.invited_at else None,
                    'responded_at': invitation.responded_at.isoformat() if invitation.responded_at else None,
                    'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None
                }
                invitation_list.append(invitation_data)
            
            return invitation_list
            
        except Exception as e:
            invitations_ns.abort(500, str(e))
