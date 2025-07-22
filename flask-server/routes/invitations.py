from flask import Blueprint, request, jsonify
from models import db, CourseInvitation, Course, User, Enrollment, Notification
from datetime import datetime, timedelta

invitations_bp = Blueprint('invitations', __name__)

@invitations_bp.route('/api/invitations/<int:invitation_id>', methods=['GET'])
def get_invitation(invitation_id):
    """Get a specific course invitation"""
    try:
        invitation = CourseInvitation.query.get_or_404(invitation_id)
        
        return jsonify({
            'id': invitation.id,
            'course_id': invitation.course_id,
            'course_name': invitation.course.name,
            'course_description': invitation.course.description,
            'teacher_name': invitation.course.teacher.name,
            'teacher_email': invitation.course.teacher.email,
            'student_id': invitation.student_id,
            'student_name': invitation.invited_student.name,
            'status': invitation.status,
            'invited_at': invitation.invited_at.isoformat() if invitation.invited_at else None,
            'responded_at': invitation.responded_at.isoformat() if invitation.responded_at else None,
            'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None,
            'is_expired': invitation.expires_at and invitation.expires_at < datetime.utcnow()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@invitations_bp.route('/api/users/<int:student_id>/invitations', methods=['GET'])
def get_student_invitations(student_id):
    """Get all invitations for a student"""
    try:
        student = User.query.get_or_404(student_id)
        
        if student.role != 'student':
            return jsonify({'error': 'Only students can have course invitations'}), 403
        
        # Get query parameters
        status = request.args.get('status')  # pending, accepted, rejected, expired
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
            is_expired = invitation.expires_at and invitation.expires_at < datetime.utcnow()
            
            invitation_data = {
                'id': invitation.id,
                'course_id': invitation.course_id,
                'course_name': invitation.course.name,
                'course_description': invitation.course.description,
                'teacher_name': invitation.course.teacher.name,
                'status': invitation.status,
                'invited_at': invitation.invited_at.isoformat() if invitation.invited_at else None,
                'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None,
                'is_expired': is_expired
            }
            invitation_list.append(invitation_data)
        
        return jsonify({
            'student_id': student_id,
            'student_name': student.name,
            'total_invitations': len(invitation_list),
            'pending_count': len([inv for inv in invitation_list if inv['status'] == 'pending' and not inv['is_expired']]),
            'invitations': invitation_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/courses/<int:course_id>/invitations', methods=['GET'])
def get_course_invitations(course_id):
    """Get all invitations sent for a course (teacher view)"""
    try:
        course = Course.query.get_or_404(course_id)
        
        invitations = CourseInvitation.query.filter_by(course_id=course_id).order_by(
            CourseInvitation.invited_at.desc()
        ).all()
        
        invitation_list = []
        for invitation in invitations:
            is_expired = invitation.expires_at and invitation.expires_at < datetime.utcnow()
            
            invitation_data = {
                'id': invitation.id,
                'student_id': invitation.student_id,
                'student_name': invitation.invited_student.name,
                'student_email': invitation.invited_student.email,
                'status': invitation.status,
                'invited_at': invitation.invited_at.isoformat() if invitation.invited_at else None,
                'responded_at': invitation.responded_at.isoformat() if invitation.responded_at else None,
                'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None,
                'is_expired': is_expired
            }
            invitation_list.append(invitation_data)
        
        return jsonify({
            'course_id': course_id,
            'course_name': course.name,
            'total_invitations': len(invitation_list),
            'pending_count': len([inv for inv in invitation_list if inv['status'] == 'pending' and not inv['is_expired']]),
            'accepted_count': len([inv for inv in invitation_list if inv['status'] == 'accepted']),
            'rejected_count': len([inv for inv in invitation_list if inv['status'] == 'rejected']),
            'invitations': invitation_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/invitations/<int:invitation_id>/accept', methods=['PUT'])
def accept_invitation(invitation_id):
    """Accept a course invitation"""
    try:
        invitation = CourseInvitation.query.get_or_404(invitation_id)
        
        # Check if invitation is still valid
        if invitation.status != 'pending':
            return jsonify({'error': 'Invitation has already been responded to'}), 400
        
        if invitation.expires_at and invitation.expires_at < datetime.utcnow():
            invitation.status = 'expired'
            db.session.commit()
            return jsonify({'error': 'Invitation has expired'}), 400
        
        # Check if student is already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            course_id=invitation.course_id,
            student_id=invitation.student_id,
            status='accepted'
        ).first()
        
        if existing_enrollment:
            return jsonify({'error': 'Student is already enrolled in this course'}), 409
        
        # Check if course is full (if it has capacity limit)
        course = invitation.course
        if course.max_capacity and course.get_enrolled_count() >= course.max_capacity:
            return jsonify({'error': 'Course is full'}), 409
        
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
        
        return jsonify({
            'message': 'Invitation accepted successfully',
            'course_name': course.name,
            'enrollment_id': enrollment.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/invitations/<int:invitation_id>/reject', methods=['PUT'])
def reject_invitation(invitation_id):
    """Reject a course invitation"""
    try:
        invitation = CourseInvitation.query.get_or_404(invitation_id)
        
        # Check if invitation is still valid
        if invitation.status != 'pending':
            return jsonify({'error': 'Invitation has already been responded to'}), 400
        
        if invitation.expires_at and invitation.expires_at < datetime.utcnow():
            invitation.status = 'expired'
            db.session.commit()
            return jsonify({'error': 'Invitation has expired'}), 400
        
        # Reject invitation
        invitation.status = 'rejected'
        invitation.responded_at = datetime.utcnow()
        
        db.session.commit()
        
        # Create notification for teacher
        from routes.notifications import create_invitation_response_notification
        create_invitation_response_notification(invitation_id, accepted=False)
        
        return jsonify({
            'message': 'Invitation rejected',
            'course_name': invitation.course.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/invitations/<int:invitation_id>/resend', methods=['PUT'])
def resend_invitation(invitation_id):
    """Resend a course invitation (extends expiry)"""
    try:
        invitation = CourseInvitation.query.get_or_404(invitation_id)
        
        # Only resend rejected or expired invitations
        if invitation.status not in ['rejected', 'expired']:
            return jsonify({'error': 'Can only resend rejected or expired invitations'}), 400
        
        # Reset invitation
        invitation.status = 'pending'
        invitation.invited_at = datetime.utcnow()
        invitation.responded_at = None
        invitation.expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days from now
        
        db.session.commit()
        
        # Create new notification
        from routes.notifications import create_course_invitation_notification
        create_course_invitation_notification(invitation_id)
        
        return jsonify({
            'message': 'Invitation resent successfully',
            'expires_at': invitation.expires_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/invitations/<int:invitation_id>', methods=['DELETE'])
def cancel_invitation(invitation_id):
    """Cancel a course invitation"""
    try:
        invitation = CourseInvitation.query.get_or_404(invitation_id)
        
        # Can only cancel pending invitations
        if invitation.status != 'pending':
            return jsonify({'error': 'Can only cancel pending invitations'}), 400
        
        # Delete the invitation
        db.session.delete(invitation)
        db.session.commit()
        
        return jsonify({'message': 'Invitation cancelled successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/invitations/cleanup-expired', methods=['POST'])
def cleanup_expired_invitations():
    """Mark expired invitations as expired (maintenance endpoint)"""
    try:
        # Find all pending invitations that have expired
        expired_invitations = CourseInvitation.query.filter(
            CourseInvitation.status == 'pending',
            CourseInvitation.expires_at < datetime.utcnow()
        ).all()
        
        # Mark them as expired
        for invitation in expired_invitations:
            invitation.status = 'expired'
        
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {len(expired_invitations)} invitations as expired',
            'expired_count': len(expired_invitations)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invitations_bp.route('/api/teachers/<int:teacher_id>/invite-student', methods=['POST'])
def send_course_invitation(teacher_id):
    """Send a course invitation to a student"""
    try:
        teacher = User.query.get_or_404(teacher_id)
        
        if teacher.role != 'teacher':
            return jsonify({'error': 'Only teachers can send course invitations'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['course_id', 'student_email']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        course = Course.query.get_or_404(data['course_id'])
        
        # Verify teacher owns the course
        if course.teacher_id != teacher_id:
            return jsonify({'error': 'You can only send invitations for your own courses'}), 403
        
        # Find student by email
        student = User.query.filter_by(email=data['student_email']).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        if student.role != 'student':
            return jsonify({'error': 'Can only invite students'}), 403
        
        # Check if student is already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            course_id=course.id,
            student_id=student.id,
            status='accepted'
        ).first()
        
        if existing_enrollment:
            return jsonify({'error': 'Student is already enrolled in this course'}), 409
        
        # Check for existing pending invitation
        existing_invitation = CourseInvitation.query.filter_by(
            course_id=course.id,
            student_id=student.id,
            status='pending'
        ).first()
        
        if existing_invitation:
            return jsonify({'error': 'Invitation already sent to this student'}), 409
        
        # Create invitation
        expiry_days = data.get('expiry_days', 7)
        invitation = CourseInvitation(
            course_id=course.id,
            student_id=student.id,
            expires_at=datetime.utcnow() + timedelta(days=expiry_days)
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # Create notification
        from routes.notifications import create_course_invitation_notification
        create_course_invitation_notification(invitation.id)
        
        return jsonify({
            'message': 'Invitation sent successfully',
            'invitation_id': invitation.id,
            'student_name': student.name,
            'course_name': course.name,
            'expires_at': invitation.expires_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
