from backend.database import SessionLocal
from backend import models

db = SessionLocal()
student = db.query(models.Student).first()
if student:
    print(f"Found student: {student.id}, {student.name}, school_id={student.school_id}")
else:
    print("No students found in DB.")

user = db.query(models.User).filter(models.User.username == "admin").first()
if user:
    print(f"Found admin user: {user.username}, school_id={user.school_id}, plan={user.plan}, status={user.subscription_status}")
else:
    print("Admin user not found.")

db.close()
