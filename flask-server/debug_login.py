#!/usr/bin/env python3
"""
Debug script to test login functionality
"""
from models import db, User
from server import create_app
from auth import generate_jwt_token
import sys

def debug_login():
    app = create_app()
    with app.app_context():
        print("=== LOGIN DEBUG ===")
        
        # Check all users
        users = User.query.all()
        print(f'Total users in database: {len(users)}')
        
        for user in users:
            print(f'\nUser ID: {user.id}')
            print(f'Name: {user.name}')
            print(f'Email: {user.email}')
            print(f'Role: {user.role}')
            print(f'Password hash exists: {bool(user.password_hash)}')
            print(f'Password hash length: {len(user.password_hash) if user.password_hash else 0}')
            
            # Test password checking - more comprehensive
            test_passwords = ['test123', 'gaUP220785', 'password', '123456', 'Password123', 'password123']
            
            # Special test for the user you created
            if user.email == 'up220785@alumnos.upa.edu.mx':
                print(f'  → Testing specific user: {user.email}')
                special_passwords = ['gaUP220785', 'UP220785', 'up220785', 'test123', 'Test123']
                test_passwords = special_passwords + test_passwords
            
            for pwd in test_passwords:
                try:
                    result = user.check_password(pwd)
                    print(f'  Password "{pwd}": {result}')
                    if result:
                        print(f'  ✓ Correct password found: "{pwd}"')
                        
                        # Test JWT generation
                        try:
                            token = generate_jwt_token(user)
                            print(f'  ✓ JWT token generated successfully: {token[:50]}...')
                        except Exception as e:
                            print(f'  ✗ JWT generation failed: {e}')
                        
                        break  # Stop testing once we find the right password
                        
                except Exception as e:
                    print(f'  ✗ Error checking password "{pwd}": {e}')
            
            # Also test the hash itself
            print(f'  Password hash sample: {user.password_hash[:50]}...')
            
            # Test if we can manually verify with werkzeug
            try:
                from werkzeug.security import check_password_hash
                manual_check = check_password_hash(user.password_hash, 'gaUP220785')
                print(f'  Manual check for "gaUP220785": {manual_check}')
            except Exception as e:
                print(f'  Manual check error: {e}')

if __name__ == '__main__':
    debug_login()
