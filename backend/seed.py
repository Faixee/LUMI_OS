from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models, auth
import random
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta

# Create tables
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # 1. Clear existing data
    db.query(models.Student).delete()
    db.query(models.FeeRecord).delete()
    db.query(models.TransportRoute).delete()
    db.query(models.LibraryBook).delete()
    db.query(models.UserProfile).delete()
    db.query(models.User).delete()
    db.commit()

    print("🌱 Seeding Database...")

    # 2. School Config
    school = models.SchoolConfig(
        school_id="default",
        name="LumiX Academy",
        motto="Inspired Learning. Bold Futures.",
        primary_color="#06b6d4",
        secondary_color="#6366f1",
        security_level="standard",
        ai_creativity=50,
        ai_enabled=True
    )
    db.merge(school)

    # 3. Seed Users (for Login) (password: lumix123)
    users = [
        models.User(
            username="admin",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Principal Johnson",
            role="admin",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=30),
            plan="enterprise",
        ),
        models.User(
            username="teacher",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Ms. Sarah Johnson",
            role="teacher",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=30),
            plan="pro",
        ),
        models.User(
            username="student",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Ali Rahman",
            role="student",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=30),
            plan="basic",
        ),
        models.User(
            username="parent",
            password_hash=auth.get_password_hash("lumix123"),
            full_name="Dr. Ahmed Rahman",
            role="parent",
            school_id="default",
            subscription_status="active",
            subscription_expiry=datetime.utcnow() + timedelta(days=30),
            plan="basic",
        ),
    ]
    db.add_all(users)
    db.flush()

    users_by_username = {u.username: u for u in users}
    profiles = [
        models.UserProfile(
            user_id=users_by_username["admin"].id,
            school_id="default",
            email="principal@example.com",
            phone="+92 300 0000000",
        ),
        models.UserProfile(
            user_id=users_by_username["teacher"].id,
            school_id="default",
            email="teacher@example.com",
            phone="+92 300 1111111",
            subject="Physics",
        ),
        models.UserProfile(
            user_id=users_by_username["student"].id,
            school_id="default",
            email="student@example.com",
            phone="+92 300 2222222",
            grade_level=10,
            class_name="10-A",
        ),
        models.UserProfile(
            user_id=users_by_username["parent"].id,
            school_id="default",
            email="parent@example.com",
            phone="+92 300 3333333",
            child_name="Ali Rahman",
        ),
    ]
    db.add_all(profiles)

    # 4. Seed Students
    student_names = [
        "Ali Rahman", "Zara Sheikh", "Bilal Ahmed", "Ayesha Khan", "Omar Farooq", 
        "Fatima Ali", "Hassan Raza", "Zainab Malik", "Usman Siddiqui", "Saad Ansari",
        "Hira Mani", "Rizwan Beyg", "Sana Javed", "Feroze Khan", "Yumna Zaidi"
    ]
    
    students = []
    for i, name in enumerate(student_names):
        risk = "Low"
        gpa = round(random.uniform(2.5, 4.0), 2)
        attendance = random.randint(80, 100)
        
        # Create some high-risk students
        if i % 5 == 0:
            gpa = round(random.uniform(1.0, 2.2), 2)
            attendance = random.randint(50, 75)
            risk = "High"
        
        student = models.Student(
            id=f"s{100+i}",
            name=name,
            grade_level=random.choice([9, 10, 11, 12]),
            gpa=gpa,
            attendance=attendance,
            behavior_score=random.randint(70, 100),
            notes=f"Student record initialized. {('Needs additional support in Mathematics.' if risk == 'High' else 'Performing well academically.')}",
            risk_level=risk,
            xp=random.randint(100, 5000),
            level=random.randint(1, 20)
        )
        students.append(student)
    db.add_all(students)

    # 5. Seed Fees
    fees = []
    for s in students:
        fees.append(models.FeeRecord(
            id=f"inv-{uuid.uuid4().hex[:6]}",
            student_id=s.id,
            student_name=s.name,
            amount=random.choice([5000, 7500, 12000]),
            due_date="2024-05-01",
            status=random.choice(['Paid', 'Paid', 'Pending', 'Overdue']),
            type="Tuition"
        ))
    db.add_all(fees)

    # 6. Seed Transport
    routes = [
        models.TransportRoute(id="t1", route_name="Route A (Downtown)", driver_name="Mike", status="Active", fuel_level=85, license_plate="LMX-101"),
        models.TransportRoute(id="t2", route_name="Route B (Suburbs)", driver_name="Joe", status="Active", fuel_level=40, license_plate="LMX-102"),
        models.TransportRoute(id="t3", route_name="Route C (North)", driver_name="Sam", status="Maintenance", fuel_level=10, license_plate="LMX-103"),
        models.TransportRoute(id="t4", route_name="Route D (East)", driver_name="Ali", status="Active", fuel_level=92, license_plate="LMX-104"),
    ]
    db.add_all(routes)

    # 7. Seed Library
    books = [
        models.LibraryBook(id="l1", title="Dune", author="Frank Herbert", category="Sci-Fi", status="Available"),
        models.LibraryBook(id="l2", title="Physics 101", author="Prof. X", category="Education", status="Checked Out"),
        models.LibraryBook(id="l3", title="The Art of War", author="Sun Tzu", category="History", status="Available"),
        models.LibraryBook(id="l4", title="1984", author="George Orwell", category="Fiction", status="Available"),
        models.LibraryBook(id="l5", title="Clean Code", author="Robert Martin", category="Technology", status="Checked Out"),
        models.LibraryBook(id="l6", title="Sapiens", author="Yuval Noah Harari", category="History", status="Available"),
    ]
    db.add_all(books)

    db.commit()
    print("✅ Database Seeded Successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
