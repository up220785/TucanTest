from flask import request
from flask_restx import Namespace, Resource, fields
from models import db, Course, User, Enrollment, Quiz
from datetime import datetime

# Create namespace for courses
courses_ns = Namespace('courses', description='Course management operations')

# Define models for Swagger documentation
course_model = courses_ns.model('Course', {
    'id': fields.Integer(description='Course ID'),
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'teacher_id': fields.Integer(description='Teacher ID'),
    'teacher_name': fields.String(description='Teacher name'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'enrollment_limit': fields.Integer(description='Maximum number of students'),
    'created_at': fields.DateTime(description='Course creation date'),
    'updated_at': fields.DateTime(description='Last update date'),
    'enrolled_count': fields.Integer(description='Number of enrolled students'),
    'quiz_count': fields.Integer(description='Number of quizzes in course')
})

course_create = courses_ns.model('CourseCreate', {
    'name': fields.String(required=True, description='Course name', example='Introduction to Programming'),
    'description': fields.String(required=True, description='Course description', example='Learn the basics of programming'),
    'teacher_id': fields.Integer(required=True, description='Teacher ID', example=1),
    'is_public': fields.Boolean(description='Whether course is public', default=True),
    'enrollment_limit': fields.Integer(description='Maximum number of students', example=50)
})

course_update = courses_ns.model('CourseUpdate', {
    'name': fields.String(description='Course name'),
    'description': fields.String(description='Course description'),
    'is_public': fields.Boolean(description='Whether course is public'),
    'is_published': fields.Boolean(description='Whether course is published'),
    'enrollment_limit': fields.Integer(description='Maximum number of students')
})

enrollment_model = courses_ns.model('Enrollment', {
    'id': fields.Integer(description='Enrollment ID'),
    'course_id': fields.Integer(description='Course ID'),
    'student_id': fields.Integer(description='Student ID'),
    'student_name': fields.String(description='Student name'),
    'student_email': fields.String(description='Student email'),
    'status': fields.String(description='Enrollment status', enum=['pending', 'accepted', 'rejected']),
    'enrolled_at': fields.DateTime(description='Enrollment date'),
    'grade': fields.Float(description='Final grade')
})

@courses_ns.route('/')
class CourseListAPI(Resource):
    @courses_ns.doc('get_all_courses')
    @courses_ns.marshal_list_with(course_model)
    @courses_ns.param('public_only', 'Filter to show only public courses', type='boolean', default=False)
    @courses_ns.param('published_only', 'Filter to show only published courses', type='boolean', default=False)
    def get(self):
        """Get all courses"""
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
                    'enrollment_limit': course.enrollment_limit,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len(course.enrollments),
                    'quiz_count': len(course.quizzes)
                }
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))

    @courses_ns.doc('create_course')
    @courses_ns.expect(course_create)
    @courses_ns.marshal_with(course_model, code=201)
    @courses_ns.response(400, 'Validation error')
    def post(self):
        """Create a new course"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'description', 'teacher_id']
            for field in required_fields:
                if field not in data or not data[field]:
                    courses_ns.abort(400, f'{field} is required')
            
            # Validate teacher exists and has teacher role
            teacher = User.query.get_or_404(data['teacher_id'])
            if teacher.role != 'teacher':
                courses_ns.abort(400, 'Only teachers can create courses')
            
            # Create course
            course = Course(
                name=data['name'],
                description=data['description'],
                teacher_id=data['teacher_id'],
                is_public=data.get('is_public', True),
                enrollment_limit=data.get('enrollment_limit')
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
                'enrollment_limit': course.enrollment_limit,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': 0,
                'quiz_count': 0
            }, 201
            
        except Exception as e:
            db.session.rollback()
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
            
            return {
                'id': course.id,
                'name': course.name,
                'description': course.description,
                'teacher_id': course.teacher_id,
                'teacher_name': course.teacher.name,
                'is_public': course.is_public,
                'is_published': course.is_published,
                'enrollment_limit': course.enrollment_limit,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': len(course.enrollments),
                'quiz_count': len(course.quizzes)
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
            
            if 'enrollment_limit' in data:
                course.enrollment_limit = data['enrollment_limit']
            
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
                'enrollment_limit': course.enrollment_limit,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                'enrolled_count': len(course.enrollments),
                'quiz_count': len(course.quizzes)
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
    @courses_ns.doc('get_course_students')
    @courses_ns.marshal_list_with(enrollment_model)
    @courses_ns.response(404, 'Course not found')
    @courses_ns.param('status', 'Filter by enrollment status', enum=['pending', 'accepted', 'rejected'])
    def get(self, course_id):
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
                enrollment_data = {
                    'id': enrollment.id,
                    'course_id': enrollment.course_id,
                    'student_id': enrollment.student_id,
                    'student_name': enrollment.student.name,
                    'student_email': enrollment.student.email,
                    'status': enrollment.status,
                    'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                    'grade': enrollment.grade
                }
                enrollment_list.append(enrollment_data)
            
            return enrollment_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))

@courses_ns.route('/<int:course_id>/enroll')
class CourseEnrollAPI(Resource):
    @courses_ns.doc('enroll_student')
    @courses_ns.expect(courses_ns.model('EnrollStudent', {
        'student_id': fields.Integer(required=True, description='Student ID', example=1)
    }))
    @courses_ns.marshal_with(enrollment_model, code=201)
    @courses_ns.response(400, 'Validation error')
    @courses_ns.response(404, 'Course or student not found')
    def post(self, course_id):
        """Enroll a student in a course"""
        try:
            course = Course.query.get_or_404(course_id)
            data = request.get_json()
            
            if 'student_id' not in data:
                courses_ns.abort(400, 'student_id is required')
            
            student = User.query.get_or_404(data['student_id'])
            if student.role != 'student':
                courses_ns.abort(400, 'Only students can be enrolled in courses')
            
            # Check if already enrolled
            existing_enrollment = Enrollment.query.filter_by(
                course_id=course_id,
                student_id=data['student_id']
            ).first()
            
            if existing_enrollment:
                courses_ns.abort(400, 'Student is already enrolled in this course')
            
            # Check enrollment limit
            if course.enrollment_limit:
                current_count = Enrollment.query.filter_by(
                    course_id=course_id,
                    status='accepted'
                ).count()
                
                if current_count >= course.enrollment_limit:
                    courses_ns.abort(400, 'Course enrollment limit reached')
            
            # Create enrollment
            enrollment = Enrollment(
                course_id=course_id,
                student_id=data['student_id'],
                status='accepted' if course.is_public else 'pending'
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

@courses_ns.route('/users/<int:user_id>/courses')
class UserCoursesAPI(Resource):
    @courses_ns.doc('get_user_courses')
    @courses_ns.marshal_list_with(course_model)
    @courses_ns.response(404, 'User not found')
    @courses_ns.param('role', 'Filter by user role context', enum=['teacher', 'student'])
    def get(self, user_id):
        """Get courses for a user (as teacher or student)"""
        try:
            user = User.query.get_or_404(user_id)
            
            if user.role == 'teacher':
                # Get courses taught by this user
                courses = Course.query.filter_by(teacher_id=user_id).all()
            else:
                # Get courses where this user is enrolled
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
                    'teacher_name': course.teacher.name,
                    'is_public': course.is_public,
                    'is_published': course.is_published,
                    'enrollment_limit': course.enrollment_limit,
                    'created_at': course.created_at.isoformat() if course.created_at else None,
                    'updated_at': course.updated_at.isoformat() if course.updated_at else None,
                    'enrolled_count': len(course.enrollments),
                    'quiz_count': len(course.quizzes)
                }
                course_list.append(course_data)
            
            return course_list
            
        except Exception as e:
            courses_ns.abort(500, str(e))
