from server import app
from models import User, Course

with app.app_context():
    users = User.query.all()
    print('Users:')
    for u in users:
        print(f'ID: {u.id}, Name: {u.name}, Role: {u.role}')
    
    print('\nCourses:')
    courses = Course.query.all()
    for c in courses:
        print(f'Course ID: {c.id}, Name: {c.title}, Teacher ID: {c.teacher_id}')
    
    print('\nChecking user 1 specifically:')
    user1 = User.query.get(1)
    if user1:
        print(f'User 1: {user1.name}, Role: {user1.role}')
        if user1.role == 'teacher':
            courses_taught = Course.query.filter_by(teacher_id=1).all()
            print(f'Courses taught by user 1: {len(courses_taught)}')
            for course in courses_taught:
                print(f'  - {course.title} (ID: {course.id})')
