from server import app
from models import db, Course, Enrollment
from datetime import datetime

with app.app_context():
    print("Updating database schema...")
    
    # Drop and recreate all tables to add the grade column to Enrollment
    db.drop_all()
    db.create_all()
    
    print("Database schema updated successfully!")
    print("Note: All existing data has been cleared. You'll need to recreate sample data.")
