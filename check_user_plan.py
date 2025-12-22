from backend.database import SessionLocal
from backend.models import User

db = SessionLocal()
user = db.query(User).filter(User.username == "student").first()
if user:
    print(f"USER_PLAN_INFO:('{user.username}', '{user.plan}', '{user.subscription_status}')")
else:
    print("USER_PLAN_INFO:None")
db.close()
