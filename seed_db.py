import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import models, auth
from datetime import datetime, timedelta
from dotenv import load_dotenv
import urllib.parse

def seed_data():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    print(f"Connecting to: {db_url}")
    
    engine = create_engine(db_url)
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 1. Clear existing data
        db.execute(text("TRUNCATE TABLE ai_request_logs, audit_logs, fees, students, user_profiles, usage_counters, users, school_config, transport, library, teacher_classes, schedules, assignments CASCADE"))
        db.commit()
        print("Existing data cleared.")

        # 2. Create Admin User
        admin_user = models.User(
            username="admin",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="System Administrator",
            role="admin",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=365),
            plan="enterprise"
        )
        db.add(admin_user)

        # Create Teacher User
        teacher_user = models.User(
            username="teacher",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Sarah Williams",
            role="teacher",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=365),
            plan="pro"
        )
        db.add(teacher_user)

        # Create Student User
        student_user = models.User(
            username="student",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Alex Johnson",
            role="student",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=365),
            plan="basic"
        )
        db.add(student_user)

        # Create Parent User
        parent_user = models.User(
            username="parent",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Mark Johnson",
            role="parent",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=365),
            plan="basic"
        )
        db.add(parent_user)

        db.flush() # Get IDs

        # 3. Create School Config
        school_config = models.SchoolConfig(
            school_id="default",
            name="LumiX Academy",
            motto="Empowering the Future with AI",
            primary_color="#06b6d4",
            secondary_color="#6366f1",
            ai_enabled=True,
            security_level="high"
        )
        db.add(school_config)

        # 4. Create Students (Table for Student Management)
        students_data = [
            {"id": "S1001", "name": "Alice Johnson", "grade_level": 10, "gpa": 3.9, "attendance": 98.5, "behavior_score": 95},
            {"id": "S1002", "name": "Bob Smith", "grade_level": 11, "gpa": 3.5, "attendance": 92.0, "behavior_score": 88},
            {"id": "S1003", "name": "Charlie Brown", "grade_level": 9, "gpa": 3.2, "attendance": 85.5, "behavior_score": 75},
            {"id": "S1004", "name": "Diana Prince", "grade_level": 12, "gpa": 4.0, "attendance": 100.0, "behavior_score": 100},
            {"id": "S1005", "name": "Ethan Hunt", "grade_level": 10, "gpa": 3.7, "attendance": 94.2, "behavior_score": 90},
        ]

        for s in students_data:
            student = models.Student(
                id=s["id"],
                name=s["name"],
                grade_level=s["grade_level"],
                gpa=s["gpa"],
                attendance=s["attendance"],
                behavior_score=s["behavior_score"],
                school_id="default"
            )
            db.add(student)

        # 5. Create Fee Records
        fees_data = [
            {"id": "F1001", "student_id": "S1001", "amount": 1200.0, "status": "Paid", "type": "Tuition"},
            {"id": "F1002", "student_id": "S1002", "amount": 1200.0, "status": "Pending", "type": "Tuition"},
            {"id": "F1003", "student_id": "S1003", "amount": 150.0, "status": "Overdue", "type": "Library"},
        ]

        for f in fees_data:
            fee = models.FeeRecord(
                id=f["id"],
                student_id=f["student_id"],
                student_name=next(s["name"] for s in students_data if s["id"] == f["student_id"]),
                amount=f["amount"],
                status=f["status"],
                type=f["type"],
                due_date=(datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
                school_id="default"
            )
            db.add(fee)

        # 6. Create Transport Routes
        routes = [
            {"id": "R001", "name": "North Route", "driver": "John Doe", "plate": "ABC-1234", "fuel": 85, "status": "Active"},
            {"id": "R002", "name": "South Route", "driver": "Jane Smith", "plate": "XYZ-5678", "fuel": 40, "status": "Active"},
            {"id": "R003", "name": "East Route", "driver": "Mike Ross", "plate": "LMN-9012", "fuel": 10, "status": "Maintenance"},
        ]
        for r in routes:
            route = models.TransportRoute(
                id=r["id"],
                route_name=r["name"],
                driver_name=r["driver"],
                license_plate=r["plate"],
                fuel_level=r["fuel"],
                status=r["status"],
                school_id="default"
            )
            db.add(route)

        # 7. Create Library Books
        books = [
            {"id": "B001", "title": "Advanced Physics", "author": "Newton", "cat": "Science", "status": "Available"},
            {"id": "B002", "title": "History of Rome", "author": "Gibbon", "cat": "History", "status": "Checked Out"},
            {"id": "B003", "title": "Python Programming", "author": "Guido", "cat": "Technology", "status": "Available"},
        ]
        for b in books:
            book = models.LibraryBook(
                id=b["id"],
                title=b["title"],
                author=b["author"],
                category=b["cat"],
                status=b["status"],
                school_id="default"
            )
            db.add(book)

        # 8. Create Teacher Classes
        classes = [
            {"name": "Physics 101", "room": "Lab 1", "time": "08:00 AM", "count": 25},
            {"name": "Mathematics", "room": "Room 10", "time": "10:30 AM", "count": 30},
            {"name": "General Science", "room": "Lab 2", "time": "01:00 PM", "count": 28},
        ]
        for c in classes:
            t_class = models.TeacherClass(
                teacher_id=teacher_user.id,
                name=c["name"],
                room=c["room"],
                time=c["time"],
                students_count=c["count"],
                school_id="default"
            )
            db.add(t_class)

        # 9. Create Schedules
        schedule_items = [
            {"sub": "Math", "time": "08:00 AM", "room": "101", "day": "Monday"},
            {"sub": "Physics", "time": "10:00 AM", "room": "Lab 1", "day": "Monday"},
            {"sub": "English", "time": "01:00 PM", "room": "202", "day": "Monday"},
        ]
        for item in schedule_items:
            s_item = models.ScheduleItem(
                user_id=student_user.id,
                subject=item["sub"],
                time=item["time"],
                room=item["room"],
                day=item["day"],
                school_id="default"
            )
            db.add(s_item)

        # 10. Create Assignments
        assignments = [
            {"title": "Lab Report", "sub": "Physics", "due": "2025-12-30", "status": "Pending"},
            {"title": "Algebra Quiz", "sub": "Math", "due": "2025-12-28", "status": "Submitted"},
        ]
        for a in assignments:
            assignment = models.Assignment(
                student_id=student_user.id,
                title=a["title"],
                subject=a["sub"],
                due_date=a["due"],
                status=a["status"],
                school_id="default"
            )
            db.add(assignment)

        db.commit()
        print("Database seeded successfully with all modules.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
