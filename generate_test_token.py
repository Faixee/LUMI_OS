
import os
from datetime import datetime, timedelta
from jose import jwt
import secrets

SECRET_KEY = "7f3a9b2c8d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "lumios-api",
        "aud": "lumios-frontend",
        "version": "1.0",
        "jti": secrets.token_urlsafe(16),
        "tv": 0,
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_demo_token():
    return create_access_token(
        data={
            "sub": "demo-test",
            "role": "demo",
            "name": "Demo Verification",
            "subscription_status": "demo",
            "plan": "free",
            "school_id": "demo",
            "sandbox": True,
            "tv": 0,
        }
    )

def create_student_token():
    return create_access_token(
        data={
            "sub": "student",
            "role": "student",
            "name": "Ali Rahman",
            "subscription_status": "active",
            "plan": "pro",
            "school_id": "default",
            "tv": 0,
        }
    )

def create_teacher_token():
    return create_access_token(
        data={
            "sub": "teacher",
            "role": "teacher",
            "name": "Test Teacher",
            "subscription_status": "active",
            "plan": "pro",
            "school_id": "default",
            "tv": 0,
        }
    )

def create_parent_token():
    return create_access_token(
        data={
            "sub": "parent",
            "role": "parent",
            "name": "Test Parent",
            "subscription_status": "active",
            "plan": "pro",
            "school_id": "default",
            "tv": 0,
        }
    )

def create_admin_token():
    return create_access_token(
        data={
            "sub": "admin",
            "role": "admin",
            "name": "System Admin",
            "subscription_status": "active",
            "plan": "enterprise",
            "school_id": "default",
            "tv": 0,
        }
    )

if __name__ == "__main__":
    print("DEMO_TOKEN:" + create_demo_token())
    print("STUDENT_TOKEN:" + create_student_token())
    print("TEACHER_TOKEN:" + create_teacher_token())
    print("PARENT_TOKEN:" + create_parent_token())
    print("ADMIN_TOKEN:" + create_admin_token())
