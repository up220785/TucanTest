from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Course, User, Enrollment, CourseInvitation
from datetime import datetime
from auth import require_auth, require_teacher, require_student

# Create namespace for courses
courses_ns = Namespace('courses', description='Course management operations')

# Define models for Swagger documentation
quiz_model = courses_ns.model('Quiz', {
    'id': fields.Integer(description='Quiz ID'),
    'title': fields.String(description='Quiz title'),
    'description': fields.String(description='Quiz description'),
    'due_date': fields.DateTime(description='Quiz due date'),
    'is_published': fields.Boolean(description='Whether quiz is published'),
    'total_points': fields.Integer(description='Total points for quiz')
})

course_model = courses_ns.model('Course', {
    'id': fields.Integer(description='Course ID'),
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'teacher_id': fields.Integer(description='Teacher ID'),
    'teacher_name': fields.String(description='Teacher name'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'max_capacity': fields.Integer(description='Maximum number of students'),
    'created_at': fields.DateTime(description='Course creation date'),
    'updated_at': fields.DateTime(description='Last update date'),
    'enrolled_count': fields.Integer(description='Number of enrolled students'),
    'is_full': fields.Boolean(description='Whether course is at capacity'),
    'email': fields.String(description='Course contact email'),
    'quizzes': fields.List(fields.Nested(quiz_model), description='List of course quizzes')
})

# Model for available courses (includes enrollment info for students)
available_course_model = courses_ns.model('AvailableCourse', {
    'id': fields.Integer(description='Course ID'),
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'teacher_id': fields.Integer(description='Teacher ID'),
    'teacher_name': fields.String(description='Teacher name'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'max_capacity': fields.Integer(description='Maximum number of students'),
    'created_at': fields.DateTime(description='Course creation date'),
    'updated_at': fields.DateTime(description='Last update date'),
    'enrolled_count': fields.Integer(description='Number of enrolled students'),
    'quiz_count': fields.Integer(description='Number of published quizzes'),
    'is_enrolled': fields.Boolean(description='Whether current student is enrolled'),
    'enrollment_status': fields.String(description='Current enrollment status'),
    'can_enroll': fields.Boolean(description='Whether student can enroll now')
})

course_create = courses_ns.model('CourseCreate', {
    'name': fields.String(required=True, description='Course name', example='Introduction to Programming'),
    'description': fields.String(required=True, description='Course description', example='Learn the basics of programming'),
    'is_public': fields.Boolean(description='Whether course is public', default=True),
    'max_capacity': fields.Integer(description='Maximum number of students', example=50)
})

course_update = courses_ns.model('CourseUpdate', {
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'max_capacity': fields.Integer(description='Maximum number of students')
})

enrollment_model = courses_ns.model('Enrollment', {
    'id': fields.Integer(description='Enrollment ID'),
    'course_id': fields.Integer(description='Course ID'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'status': fields.String(description='Enrollment status', enum=['accepted', 'rejected']),
    'enrolled_at': fields.DateTime(description='Enrollment date'),
    'grade': fields.Float(description='Final grade')
})

invitation_model = courses_ns.model('CourseInvitation', {
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

invite_student_model = courses_ns.model('InviteStudent', {
    'student_email': fields.String(required=True, description='Student email address', example='student@example.com'),
    'expires_in_days': fields.Integer(description='Days until invitation expires', default=7, example=7)
})

@courses_ns.route('/')
class CourseListAPI(Resource):
    @courses_ns.doc('get_all_courses', security='Bearer')
    @courses_ns.marshal_list_with(course_model)
    @courses_ns.param('public_only', 'Filter to show only public courses', type='boolean', default=False)
    @courses_ns.param('published_only', 'Filter to show only published courses', type='boolean', default=False)
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Teacher access required')
    @require_teacher
    def get(self, current_user=None):
        """Get all courses (teachers only - for course management)"""
        try:
            query = Course.query
            
            # Apply filters
            public_only = request.args.get('public_only', 'false').lower() == 'true'
            published_only = request.args.get('published_only', 'false').lower() == 'true'
            
            if public_only:
                query = query.filter_by(is_public=True)
            
            if published_only:
                query = query.filter_by(is_published=True)
            
            courses = query.all()
            
            course_list = []
            for course in courses:
                course_data = {
                    'id': course.id,
                    'name': course.name,
                    'description': course.description,
                    'teacher_id': course.teacher_id,
                    'teacher_name': course.teacher.name,
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'max_capacity': course.max_capacity,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len(course.enrollments)
                }
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))

    @courses_ns.doc('create_course', security='Bearer')
    @courses_ns.expect(course_create)
    @courses_ns.marshal_with(course_model, code=201)
    @courses_ns.response(400, 'Validation error')
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Teacher role required')
    @require_teacher
    def post(self, current_user=None):
        """Create a new course (teachers only)"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'description']
            for field in required_fields:
                if field not in data or not data[field]:
                    courses_ns.abort(400, f'{field} is required')
            
            # Use authenticated user as teacher
            teacher_id = current_user.id
            
            # Create course
            current_time = datetime.utcnow()
            course = Course(
                name=data['name'],
                description=data['description'],
                teacher_id=teacher_id,
                is_public=data.get('is_public', True),
                max_capacity=data.get('max_capacity'),
                created_at=current_time,
                updated_at=current_time
            )
            
            db.session.add(course)
            db.session.commit()
            
            return {
                'id': course.id,
                'name': course.name,
                'description': course.description,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'is_public': course.is_public,
                'is_published': course.is_published,
                'max_capacity': course.max_capacity,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': 0
            }, 201
            
        except Exception as e:
            db.session.rollback()
            courses_ns.abort(500, str(e))

@courses_ns.route('/available')
class AvailableCoursesAPI(Resource):
    @courses_ns.doc('get_available_courses', security='Bearer')
    @courses_ns.marshal_list_with(available_course_model)
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Student access required')
    @require_student
    def get(self, current_user=None):
        """Get available courses for enrollment (students only - public AND published courses)"""
        try:
            # Students can only see courses that are both public AND published
            courses = Course.query.filter_by(is_public=True, is_published=True).all()
            
            course_list = []
            for course in courses:
                # Check if student is already enrolled
                existing_enrollment = Enrollment.query.filter_by(
                    course_id=course.id,
                    student_id=current_user.id
                ).first()
                
                is_enrolled = existing_enrollment is not None
                enrollment_status = existing_enrollment.status if existing_enrollment else None
                
                course_data = {
                    'id': course.id,
                    'name': course.name,
                    'description': course.description,
                    'teacher_id': course.teacher_id,
                    'teacher_name': course.teacher.name,
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'max_capacity': course.max_capacity,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len([e for e in course.enrollments if e.status == 'accepted']),
                    'quiz_count': len([q for q in course.quizzes if q.is_published]),
                    'is_enrolled': is_enrolled,
                    'enrollment_status': enrollment_status,
                    'can_enroll': not is_enrolled and (not course.max_capacity or len([e for e in course.enrollments if e.status == 'accepted']) < course.max_capacity)
                }
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))

@courses_ns.route('/<int:course_id>')
class CourseAPI(Resource):
    @courses_ns.doc('get_course')
    @courses_ns.marshal_with(course_model)
    @courses_ns.response(404, 'Course not found')
    def get(self, course_id):
        """Get a specific course"""
        try:
            course = Course.query.get_or_404(course_id)
            
            print(f"DEBUG: Found course {course.id} - {course.name}")
            print(f"DEBUG: Course has {len(course.quizzes)} quizzes")
            for quiz in course.quizzes:
                print(f"DEBUG: Quiz {quiz.id} - {quiz.title} - Published: {quiz.is_published}")
            
            quizzes_data = []
            for quiz in course.quizzes:
                try:
                    quiz_data = {
                        'id': quiz.id,
                        'title': quiz.title,
                        'description': quiz.description,
                        'due_date': quiz.due_date.isoformat() if quiz.due_date else None,
                        'is_published': quiz.is_published,
                        'total_points': quiz.get_total_points() if hasattr(quiz, 'get_total_points') else 0
                    }
                    quizzes_data.append(quiz_data)
                    print(f"DEBUG: Successfully processed quiz {quiz.id}")
                except Exception as quiz_error:
                    print(f"DEBUG: Error processing quiz {quiz.id}: {quiz_error}")
            
            print(f"DEBUG: Final quizzes_data length: {len(quizzes_data)}")
            
            return {
                'id': course.id,
                'name': course.name,
                'description': course.description,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'is_public': course.is_public,
                'is_published': course.is_published,
                'max_capacity': course.max_capacity,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': len(course.enrollments),
                'is_full': course.is_full() if hasattr(course, 'is_full') else False,
                'email': course.email,
                'quizzes': quizzes_data
            }
            
        except Exception as e:
            courses_ns.abort(404, 'Course not found')

    @courses_ns.doc('update_course')
    @courses_ns.expect(course_update)
    @courses_ns.marshal_with(course_model)
    @courses_ns.response(404, 'Course not found')
    @courses_ns.response(400, 'Validation error')
    def put(self, course_id):
        """Update course details"""
        try:
            course = Course.query.get_or_404(course_id)
            data = request.get_json()
            
            # Update allowed fields
            if 'name' in data and data['name']:
                course.name = data['name']
            
            if 'description' in data and data['description']:
                course.description = data['description']
            
            if 'is_public' in data:
                course.is_public = data['is_public']
            
            if 'is_published' in data:
                course.is_published = data['is_published']
            
            if 'max_capacity' in data:
                course.max_capacity = data['max_capacity']
            
            course.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {
                'id': course.id,
                'name': course.name,
                'description': course.description,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'is_public': course.is_public,
                'is_published': course.is_published,
                'max_capacity': course.max_capacity,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': len(course.enrollments)
            }
            
        except Exception as e:
            db.session.rollback()
            courses_ns.abort(500, str(e))

    @courses_ns.doc('delete_course')
    @courses_ns.response(200, 'Course deleted successfully')
    @courses_ns.response(404, 'Course not found')
    def delete(self, course_id):
        """Delete a course"""
        try:
            course = Course.query.get_or_404(course_id)
            
            db.session.delete(course)
            db.session.commit()
            
            return {'message': 'Course deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            courses_ns.abort(500, str(e))

@courses_ns.route('/<int:course_id>/students')
class CourseStudentsAPI(Resource):
    @courses_ns.doc('get_course_students', security='Bearer')
    @courses_ns.marshal_list_with(enrollment_model)
    @courses_ns.response(404, 'Course not found')
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Teacher access required')
    @courses_ns.param('status', 'Filter by enrollment status', enum=['accepted', 'rejected'])
    @require_teacher
    def get(self, course_id, current_user=None):
        """Get all students enrolled in a course"""
        try:
            course = Course.query.get_or_404(course_id)
            
            query = Enrollment.query.filter_by(course_id=course_id)
            
            # Filter by status if provided
            status = request.args.get('status')
            if status:
                query = query.filter_by(status=status)
            
            enrollments = query.all()
            
            enrollment_list = []
            for enrollment in enrollments:
                # Calculate current grade based on quiz performance
                current_grade = enrollment.calculate_grade()
                
                enrollment_data = {
                    'id': enrollment.id,
                    'course_id': enrollment.course_id,
                    'student_id': enrollment.student_id,
                    'student_name': enrollment.student.name,
                    'student_email': enrollment.student.email,
                    'status': enrollment.status,
                    'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                    'grade': current_grade
                }
                enrollment_list.append(enrollment_data)
            
            return enrollment_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))

@courses_ns.route('/<int:course_id>/enroll')
class CourseEnrollAPI(Resource):
    @courses_ns.doc('enroll_student', security='Bearer')
    @courses_ns.marshal_with(enrollment_model, code=201)
    @courses_ns.response(400, 'Validation error')
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Student role required')
    @courses_ns.response(404, 'Course not found')
    @require_student
    def post(self, course_id, current_user=None):
        """Enroll in a course (students only)"""
        try:
            course = Course.query.get_or_404(course_id)
            
            # Check if course is public
            if not course.is_public:
                courses_ns.abort(403, 'This is a private course. You need an invitation to enroll.')
            
            # Use authenticated user as student
            student_id = current_user.id
            
            # Check if already enrolled
            existing_enrollment = Enrollment.query.filter_by(
                course_id=course_id,
                student_id=student_id
            ).first()
            
            if existing_enrollment:
                courses_ns.abort(400, 'You are already enrolled in this course')
            
            # Check enrollment limit
            if course.max_capacity:
                current_count = Enrollment.query.filter_by(
                    course_id=course_id,
                    status='accepted'
                ).count()
                
                if current_count >= course.max_capacity:
                    courses_ns.abort(400, 'Course enrollment limit reached')
            
            # Create enrollment
            enrollment = Enrollment(
                course_id=course_id,
                student_id=student_id,
                status='accepted',  # Public courses auto-accept
                grade=0.0  # Start with grade 0, will be updated based on quiz performance
            )
            
            db.session.add(enrollment)
            db.session.commit()
            
            return {
                'id': enrollment.id,
                'course_id': enrollment.course_id,
                'student_id': enrollment.student_id,
                'student_name': enrollment.student.name,
                'student_email': enrollment.student.email,
                'status': enrollment.status,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                'grade': enrollment.grade
            }, 201
            
        except Exception as e:
            db.session.rollback()
            courses_ns.abort(500, str(e))

@courses_ns.route('/<int:course_id>/invite')
class CourseInviteAPI(Resource):
    @courses_ns.doc('invite_student_to_course', security='Bearer')
    @courses_ns.expect(invite_student_model)
    @courses_ns.marshal_with(invitation_model, code=201)
    @courses_ns.response(400, 'Validation error')
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.response(403, 'Teacher access required')
    @courses_ns.response(404, 'Course or student not found')
    @require_teacher
    def post(self, course_id, current_user=None):
        """Invite a student to a course by email (for private courses)"""
        course = Course.query.get_or_404(course_id)
        data = request.get_json()
        
        if 'student_email' not in data:
            courses_ns.abort(400, 'student_email is required')
        
        # Find student by email
        student = User.query.filter_by(email=data['student_email']).first()
        if not student:
            courses_ns.abort(404, f'No student found with email: {data["student_email"]}')
        
        if student.role != 'student':
            courses_ns.abort(400, 'Only students can be invited to courses')
        
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            course_id=course_id,
            student_id=student.id
        ).first()
        
        if existing_enrollment:
            courses_ns.abort(400, 'Student is already enrolled in this course')
        
        # Check if already invited
        existing_invitation = CourseInvitation.query.filter_by(
            course_id=course_id,
            student_id=student.id,
            status='pending'
        ).first()
        
        if existing_invitation:
            courses_ns.abort(400, 'Student has already been invited to this course')
        
        try:
            # Calculate expiration date
            from datetime import timedelta
            expires_in_days = data.get('expires_in_days', 7)
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days) if expires_in_days else None
            
            # Create invitation
            invitation = CourseInvitation(
                course_id=course_id,
                student_id=student.id,
                expires_at=expires_at
            )
            
            db.session.add(invitation)
            db.session.commit()
            
            # Automatically create notification for the student
            from routes.notifications import create_course_invitation_notification
            create_course_invitation_notification(invitation.id)
            
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
            }, 201
            
        except Exception as e:
            db.session.rollback()
            courses_ns.abort(500, f'Failed to create invitation: {str(e)}')

@courses_ns.route('/users/<int:user_id>/courses')
class UserCoursesAPI(Resource):
    @courses_ns.doc('get_user_courses', security='Bearer')
    @courses_ns.marshal_list_with(course_model)
    @courses_ns.response(404, 'User not found')
    @courses_ns.response(401, 'Authentication required')
    @courses_ns.param('role', 'Filter by user role context', enum=['teacher', 'student'])
    @require_auth
    def get(self, user_id, current_user=None):
        """Get courses for a user (as teacher or student)"""
        try:
            user = User.query.get_or_404(user_id)
            role_filter = request.args.get('role')
            
            courses = []
            
            # If no role specified, return all courses for the user
            if not role_filter:
                # Get courses taught by this user (if they're a teacher)
                if user.role == 'teacher':
                    taught_courses = Course.query.filter_by(teacher_id=user_id).all()
                    courses.extend(taught_courses)
                
                # Get courses where this user is enrolled as student
                enrollments = Enrollment.query.filter_by(
                    student_id=user_id,
                    status='accepted'
                ).all()
                enrolled_courses = [enrollment.course for enrollment in enrollments]
                courses.extend(enrolled_courses)
                
                # Remove duplicates (in case someone is both teacher and enrolled)
                courses = list({course.id: course for course in courses}.values())
                
            elif role_filter == 'teacher':
                # Get courses taught by this user
                courses = Course.query.filter_by(teacher_id=user_id).all()
                
            elif role_filter == 'student':
                # Get courses where this user is enrolled as student
                enrollments = Enrollment.query.filter_by(
                    student_id=user_id,
                    status='accepted'
                ).all()
                courses = [enrollment.course for enrollment in enrollments]
            
            course_list = []
            for course in courses:
                course_data = {
                    'id': course.id,
                    'name': course.name,
                    'description': course.description,
                    'teacher_id': course.teacher_id,
                    'teacher_name': course.teacher.name if course.teacher else 'Unknown',
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'max_capacity': course.max_capacity,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len([e for e in course.enrollments if e.status == 'accepted'])
                }
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))
