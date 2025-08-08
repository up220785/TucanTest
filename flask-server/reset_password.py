#!/usr/bin/env python3
"""
Reset password for specific user
"""
from models import db, User
from server import create_app

def reset_user_password():
    app = create_app()
    with app.app_context():
        print("=== DELETING ALL USERS ===")
        
        # List all existing users first
        all_users = User.query.all()
        print(f"Found {len(all_users)} existing users:")
        for u in all_users:
            print(f"  - ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
        
        # Delete all users
        if all_users:
            User.query.delete()
            db.session.commit()
            print(f"✓ Deleted {len(all_users)} users")
        else:
            print("No users to delete")
        
        print("\n=== CREATING FRESH USERS ===")
        
        # Create the UP student user
        up_user = User(
            name="Student UP220785",
            email="up220785@alumnos.upa.edu.mx",
            role="student"
        )
        up_user.set_password("password123")
        db.session.add(up_user)
        
        # Create a test user
        test_user = User(
            name="Test User",
            email="testuser@test.com",
            role="student"
        )
        test_user.set_password("test123")
        db.session.add(test_user)
        
        # Create a teacher user
        teacher_user = User(
            name="Professor Smith",
            email="teacher@example.com",
            role="teacher"
        )
        teacher_user.set_password("teacher123")
        db.session.add(teacher_user)
        
        db.session.commit()
        
        print("✓ Created fresh users:")
        print("  - up220785@alumnos.upa.edu.mx (password: password123)")
        print("  - testuser@test.com (password: test123)")
        print("  - teacher@example.com (password: teacher123)")
        
        # Test all passwords
        print("\n=== TESTING PASSWORDS ===")
        users = User.query.all()
        test_data = [
            ("up220785@alumnos.upa.edu.mx", "password123"),
            ("testuser@test.com", "test123"),
            ("teacher@example.com", "teacher123")
        ]
        
        for email, password in test_data:
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                print(f"✓ {email} - password verified")
            else:
                print(f"✗ {email} - password failed")

if __name__ == '__main__':
    reset_user_password()
