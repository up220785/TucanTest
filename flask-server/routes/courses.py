from flask import Blueprint, request, jsonify
from models import db, Course, User, Enrollment, CourseInvitation, Quiz
from datetime import datetime, timedelta

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all public courses or courses by teacher"""
    try:
        # Get query parameters
        teacher_id = request.args.get('teacher_id', type=int)
        public_only = request.args.get('public_only', 'false').lower() == 'true'
        
        if teacher_id:
            # Get courses by teacher (including private ones)
            courses = Course.query.filter_by(teacher_id=teacher_id).all()
        elif public_only:
            # Get only public courses
            courses = Course.query.filter_by(is_public=True, is_published=True).all()
        else:
            # Get all published public courses
            courses = Course.query.filter_by(is_public=True, is_published=True).all()
        
        course_list = []
        for course in courses:
            course_data = {
                'id': course.id,
                'name': course.name,
                'email': course.email,
                'description': course.description,
                'is_public': course.is_public,
                'max_capacity': course.max_capacity,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'is_published': course.is_published,
                'enrolled_count': course.get_enrolled_count(),
                'is_full': course.is_full()
            }
            course_list.append(course_data)
        
        return jsonify(course_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get a specific course by ID"""
    try:
        course = Course.query.get_or_404(course_id)
        
        return jsonify({
            'id': course.id,
            'name': course.name,
            'email': course.email,
            'description': course.description,
            'is_public': course.is_public,
            'max_capacity': course.max_capacity,
            'teacher_id': course.teacher_id,
            'teacher_name': course.teacher.name,
            'created_at': course.created_at.isoformat() if course.created_at else None,
            'is_published': course.is_published,
            'enrolled_count': course.get_enrolled_count(),
            'is_full': course.is_full(),
            'quizzes': [{
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                'is_published': quiz.is_published,
                'total_points': quiz.get_total_points()
            } for quiz in course.quizzes if quiz.is_published]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@courses_bp.route('/api/courses/public', methods=['GET'])
def get_public_courses():
    """Get all public published courses for student exploration"""
    try:
        # Get all public and published courses
        courses = Course.query.filter_by(is_public=True, is_published=True).all()
        
        course_list = []
        for course in courses:
            # Get quiz count for this course
            quiz_count = Quiz.query.filter_by(course_id=course.id, is_published=True).count()
            
            course_data = {
                'id': course.id,
                'name': course.name,
                'description': course.description,
                'is_public': course.is_public,
                'is_published': course.is_published,
                'max_capacity': course.max_capacity,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'enrolled_count': course.get_enrolled_count(),
                'quiz_count': quiz_count,
                'is_full': course.is_full()
            }
            course_list.append(course_data)
        
        return jsonify(course_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses', methods=['POST'])
def create_course():
    """Create a new course"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'teacher_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify teacher exists and has teacher role
        teacher = User.query.get(data['teacher_id'])
        if not teacher:
            return jsonify({'error': 'Teacher not found'}), 404
        if teacher.role != 'teacher':
            return jsonify({'error': 'User must be a teacher to create courses'}), 403
        
        # Validate max_capacity for public courses
        if data.get('is_public', True) and data.get('max_capacity'):
            if data['max_capacity'] <= 0:
                return jsonify({'error': 'Max capacity must be positive'}), 400
        
        # Create course
        course = Course(
            name=data['name'],
            email=data.get('email'),
            description=data.get('description', ''),
            is_public=data.get('is_public', True),
            max_capacity=data.get('max_capacity'),
            teacher_id=data['teacher_id'],
            is_published=data.get('is_published', False)
        )
        
        db.session.add(course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course created successfully',
            'course': {
                'id': course.id,
                'name': course.name,
                'is_public': course.is_public,
                'is_published': course.is_published
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    """Update an existing course"""
    try:
        course = Course.query.get_or_404(course_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data and data['name']:
            course.name = data['name']
        
        if 'email' in data:
            course.email = data['email']
        
        if 'description' in data:
            course.description = data['description']
        
        if 'is_public' in data:
            course.is_public = data['is_public']
        
        if 'max_capacity' in data:
            if data['max_capacity'] and data['max_capacity'] <= 0:
                return jsonify({'error': 'Max capacity must be positive'}), 400
            course.max_capacity = data['max_capacity']
        
        if 'is_published' in data:
            course.is_published = data['is_published']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Course updated successfully',
            'course': {
                'id': course.id,
                'name': course.name,
                'is_public': course.is_public,
                'is_published': course.is_published
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete a course"""
    try:
        course = Course.query.get_or_404(course_id)
        
        # SQLAlchemy will handle cascade deletes
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'message': 'Course deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>/enroll', methods=['POST'])
def enroll_in_course(course_id):
    """Enroll a student in a public course"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        course = Course.query.get_or_404(course_id)
        student = User.query.get_or_404(student_id)
        
        # Verify student role
        if student.role != 'student':
            return jsonify({'error': 'Only students can enroll in courses'}), 403
        
        # Check if course is public and published
        if not course.is_public or not course.is_published:
            return jsonify({'error': 'Course is not available for enrollment'}), 403
        
        # Check if course is full
        if course.is_full():
            return jsonify({'error': 'Course is full'}), 409
        
        # Check if student is already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            course_id=course_id, 
            student_id=student_id
        ).first()
        
        if existing_enrollment:
            if existing_enrollment.status == 'accepted':
                return jsonify({'error': 'Student is already enrolled'}), 409
            else:
                # Reactivate enrollment
                existing_enrollment.status = 'accepted'
                existing_enrollment.enrolled_at = datetime.utcnow()
                existing_enrollment.dropped_at = None
        else:
            # Create new enrollment
            enrollment = Enrollment(
                course_id=course_id,
                student_id=student_id,
                status='accepted',
                enrollment_type='direct'
            )
            db.session.add(enrollment)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully enrolled in course',
            'course_name': course.name,
            'student_name': student.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>/drop', methods=['POST'])
def drop_course(course_id):
    """Drop a student from a course"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        enrollment = Enrollment.query.filter_by(
            course_id=course_id, 
            student_id=student_id,
            status='accepted'
        ).first()
        
        if not enrollment:
            return jsonify({'error': 'Student is not enrolled in this course'}), 404
        
        # Update enrollment status
        enrollment.status = 'dropped'
        enrollment.dropped_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Successfully dropped from course'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>/invite', methods=['POST'])
def invite_to_course(course_id):
    """Invite a student to a private course"""
    try:
        data = request.get_json()
        student_email = data.get('student_email')
        
        if not student_email:
            return jsonify({'error': 'Student email is required'}), 400
        
        course = Course.query.get_or_404(course_id)
        student = User.query.filter_by(email=student_email).first()
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        if student.role != 'student':
            return jsonify({'error': 'Can only invite students'}), 403
        
        # Check if invitation already exists
        existing_invitation = CourseInvitation.query.filter_by(
            course_id=course_id, 
            student_id=student.id,
            status='pending'
        ).first()
        
        if existing_invitation:
            return jsonify({'error': 'Invitation already sent'}), 409
        
        # Check if student is already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            course_id=course_id, 
            student_id=student.id,
            status='accepted'
        ).first()
        
        if existing_enrollment:
            return jsonify({'error': 'Student is already enrolled'}), 409
        
        # Create invitation
        invitation = CourseInvitation(
            course_id=course_id,
            student_id=student.id,
            expires_at=datetime.utcnow() + timedelta(days=7)  # 7 days to respond
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        return jsonify({
            'message': 'Invitation sent successfully',
            'invitation_id': invitation.id,
            'student_name': student.name,
            'course_name': course.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/api/courses/<int:course_id>/students', methods=['GET'])
def get_course_students(course_id):
    """Get all students enrolled in a course"""
    try:
        course = Course.query.get_or_404(course_id)
        
        enrollments = Enrollment.query.filter_by(
            course_id=course_id, 
            status='accepted'
        ).all()
        
        students = []
        for enrollment in enrollments:
            student = enrollment.student
            students.append({
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                'enrollment_type': enrollment.enrollment_type
            })
        
        return jsonify({
            'course_name': course.name,
            'total_students': len(students),
            'students': students
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
