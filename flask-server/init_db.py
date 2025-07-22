#!/usr/bin/env python3
"""
Database initialization script for Tucan Test
Run this script to create the database and tables
"""

from server import app, db, create_tables, seed_sample_data
import os

def init_database():
    """Initialize the database with all tables"""
    print("🚀 Initializing Tucan Test Database...")
    
    # Remove existing database if it exists (for fresh start)
    db_path = os.path.join(os.path.dirname(__file__), 'tucantestschema.db')
    if os.path.exists(db_path):
        response = input("Database already exists. Do you want to recreate it? (y/N): ")
        if response.lower() == 'y':
            os.remove(db_path)
            print("✅ Existing database removed")
        else:
            print("❌ Database initialization cancelled")
            return
    
    # Create all tables
    create_tables()
    
    # Ask if user wants sample data
    response = input("Do you want to create sample data for testing? (y/N): ")
    if response.lower() == 'y':
        seed_sample_data()
    
    print("🎉 Database initialization complete!")
    print("\nSample credentials (if created):")
    print("Teacher: teacher@example.com / password123")
    print("Student: student@example.com / password123")

if __name__ == "__main__":
    init_database()
