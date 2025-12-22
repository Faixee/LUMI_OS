import os
import sys
import random
import time
import hashlib
import secrets
from datetime import datetime, timedelta

# Add the current directory to sys.path so we can import backend modules
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

# --- UTILS ---
def get_password_hash(password: str) -> str:
    salt = secrets.token_bytes(16).hex()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 100_000)
    return f"{salt}:{dk.hex()}"

def create_demo_data():
    print("🚀 Initializing Genesis Protocol... (Creating Demo Data)")
    
    # 1. Reset Database
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    try:
        # --- USERS ---
        print("👤 Creating Users...")
        users = [
            # Admin
            {"username": "admin", "password": "password123", "name": "System Admin", "role": "admin"},
            # Teachers
            {"username": "sarah.j", "password": "password123", "name": "Sarah Jenkins", "role": "teacher", "subject": "Quantum Physics"},
            {"username": "david.m", "password": "password123", "name": "David Miller", "role": "teacher", "subject": "Xeno-Biology"},
            # Students
            {"username": "ali.r", "password": "password123", "name": "Ali Raza", "role": "student", "grade": 10},
            {"username": "zara.k", "password": "password123", "name": "Zara Khan", "role": "student", "grade": 11},
            {"username": "mike.t", "password": "password123", "name": "Mike Tyson", "role": "student", "grade": 12},
            {"username": "emma.w", "password": "password123", "name": "Emma Watson", "role": "student", "grade": 9},
            # Parent
            {"username": "dr.ahmed", "password": "password123", "name": "Dr. Ahmed", "role": "parent", "child": "Ali Raza"},
        ]

        for u in users:
            db_user = models.User(
                username=u["username"],
                password_hash=get_password_hash(u["password"]),
                full_name=u["name"],
                role=u["role"]
            )
            db.add(db_user)
            db.flush() # Get ID

            # Create Profile
            profile = models.UserProfile(
                user_id=db_user.id,
                email=f"{u['username']}@lumix.edu",
                phone=f"+92-300-{random.randint(1000000, 9999999)}",
                grade_level=u.get("grade"),
                subject=u.get("subject"),
                child_name=u.get("child")
            )
            db.add(profile)

        # --- STUDENTS (Academic Records) ---
        print("🎓 Creating Student Records...")
        student_list = [
            {"name": "Ali Raza", "grade": 10, "gpa": 3.8, "att": 95, "beh": 98, "risk": "Low", "notes": "Exceptional performance in Physics."},
            {"name": "Zara Khan", "grade": 11, "gpa": 3.9, "att": 98, "beh": 100, "risk": "Low", "notes": "Top of the class. Leader of the Robotics Club."},
            {"name": "Mike Tyson", "grade": 12, "gpa": 2.1, "att": 70, "beh": 60, "risk": "High", "notes": "Frequent absences. Needs counseling."},
            {"name": "Emma Watson", "grade": 9, "gpa": 4.0, "att": 100, "beh": 100, "risk": "Low", "notes": "Perfect academic record."},
            {"name": "John Doe", "grade": 10, "gpa": 2.8, "att": 85, "beh": 88, "risk": "Medium", "notes": "Struggling with Math."},
            {"name": "Jane Smith", "grade": 11, "gpa": 3.2, "att": 90, "beh": 92, "risk": "Low", "notes": "Solid performance."},
            {"name": "Kai Cenat", "grade": 12, "gpa": 1.9, "att": 60, "beh": 50, "risk": "High", "notes": "At risk of failing."},
            {"name": "Ishod Wair", "grade": 9, "gpa": 3.5, "att": 92, "beh": 95, "risk": "Low", "notes": "Great potential."},
        ]

        for i, s in enumerate(student_list):
            sid = f"s2024_{i+1:03d}"
            db_student = models.Student(
                id=sid,
                name=s["name"],
                grade_level=s["grade"],
                gpa=s["gpa"],
                attendance=s["att"],
                behavior_score=s["beh"],
                notes=s["notes"],
                risk_level=s["risk"],
                xp=random.randint(100, 5000),
                level=random.randint(1, 10)
            )
            db.add(db_student)

            # --- FEES ---
            status = random.choice(["Paid", "Pending", "Overdue"])
            fee = models.FeeRecord(
                id=f"fee_{sid}",
                student_id=sid,
                student_name=s["name"],
                amount=random.choice([15000, 20000, 25000]),
                due_date=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                status=status,
                type="Tuition"
            )
            db.add(fee)

        # --- TRANSPORT ---
        print("🚌 Creating Transport Fleet...")
        routes = [
            {"name": "Route Alpha (North)", "driver": "Mr. John", "plate": "LX-901", "fuel": 85, "status": "Active"},
            {"name": "Route Beta (South)", "driver": "Mr. Smith", "plate": "LX-902", "fuel": 40, "status": "Active"},
            {"name": "Route Gamma (East)", "driver": "Ms. Davis", "plate": "LX-903", "fuel": 10, "status": "Maintenance"},
            {"name": "Route Delta (West)", "driver": "Mr. Wilson", "plate": "LX-904", "fuel": 92, "status": "Active"},
        ]
        for i, r in enumerate(routes):
            tr = models.TransportRoute(
                id=f"tr_{i+1}",
                route_name=r["name"],
                driver_name=r["driver"],
                license_plate=r["plate"],
                fuel_level=r["fuel"],
                status=r["status"]
            )
            db.add(tr)

        # --- LIBRARY ---
        print("📚 Stocking Library...")
        books = [
            {"title": "The Quantum Universe", "author": "Brian Cox", "cat": "Science"},
            {"title": "Neuromancer", "author": "William Gibson", "cat": "Fiction"},
            {"title": "Dune", "author": "Frank Herbert", "cat": "Fiction"},
            {"title": "Advanced Calculus", "author": "James Stewart", "cat": "Math"},
            {"title": "A Brief History of Time", "author": "Stephen Hawking", "cat": "Science"},
        ]
        for i, b in enumerate(books):
            lb = models.LibraryBook(
                id=f"lib_{i+1}",
                title=b["title"],
                author=b["author"],
                category=b["cat"],
                status=random.choice(["Available", "Checked Out"])
            )
            db.add(lb)

        db.commit()
        print("✅ Demo Data Injection Complete!")
        print("------------------------------------------------")
        print("Login Credentials:")
        print("Admin:   admin / password123")
        print("Teacher: sarah.j / password123")
        print("Student: ali.r / password123")
        print("Parent:  dr.ahmed / password123")
        print("------------------------------------------------")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()