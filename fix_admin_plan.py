from backend.database import SessionLocal
from backend import models

db = SessionLocal()
admin = db.query(models.User).filter(models.User.username == "admin").first()
if admin:
    print(f"Updating admin plan from {admin.plan} to enterprise")
    admin.plan = "enterprise"
    db.commit()
    print("Success")
else:
    print("Admin not found")
db.close()
