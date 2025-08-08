#!/usr/bin/env python3
"""
Create a test user with a known password
"""
from models import db, User
from server import create_app
from auth import generate_jwt_token

def create_test_user():
    app = create_app()
    with app.app_context():
        print("=== CREATING TEST USER ===")
        
        # Check if test user already exists
        test_email = "testuser@test.com"
        existing_user = User.query.filter_by(email=test_email).first()
        
        if existing_user:
            print(f"Test user already exists: {existing_user.email}")
            db.session.delete(existing_user)
            db.session.commit()
            print("Deleted existing test user")
        
        # Create new test user
        test_user = User(
            name="Test User",
            email=test_email,
            role="student"
        )
        
        test_password = "test123"
        test_user.set_password(test_password)
        
        print(f"Created user: {test_user.name}")
        print(f"Email: {test_user.email}")
        print(f"Password: {test_password}")
        
        db.session.add(test_user)
        db.session.commit()
        
        print(f"User saved with ID: {test_user.id}")
        
        # Test password immediately
        password_check = test_user.check_password(test_password)
        print(f"Password check result: {password_check}")
        
        if password_check:
            # Test JWT generation
            try:
                token = generate_jwt_token(test_user)
                print(f"JWT token generated: {token[:50]}...")
                print("✓ LOGIN TEST SUCCESSFUL")
            except Exception as e:
                print(f"✗ JWT generation failed: {e}")
        else:
            print("✗ PASSWORD CHECK FAILED")
            print(f"Hash: {test_user.password_hash}")

if __name__ == '__main__':
    create_test_user()
