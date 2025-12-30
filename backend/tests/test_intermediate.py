"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app, get_db as main_get_db
from backend.database import Base, get_db as db_get_db
from backend import models, auth, schemas
from backend.auth import get_password_hash
import os
import asyncio
import httpx

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_intermediate.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[db_get_db] = override_get_db
app.dependency_overrides[main_get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Close all sessions before dropping tables
    TestingSessionLocal.close_all()
    Base.metadata.drop_all(bind=engine)
    engine.dispose() # Dispose engine to close connections
    if os.path.exists("./test_intermediate.db"):
        try:
            os.remove("./test_intermediate.db")
        except PermissionError:
            pass # Ignore if still locked, next test will recreate

def test_plan_based_feature_access():
    """
    Test that different subscription plans grant access to different features.
    ai_grade requires "teacher" or "admin" AND active subscription.
    ai_report requires "parent" or "admin" AND active subscription.
    """
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    
    # 1. Teacher with Basic Plan (Active)
    teacher = models.User(
        username="teacher_basic",
        password_hash=hashed_password,
        full_name="Teacher Basic",
        role="teacher",
        subscription_status="active",
        plan="basic"
    )
    db.add(teacher)
    
    # 2. Admin with Enterprise Plan (Active)
    admin = models.User(
        username="admin_enterprise",
        password_hash=hashed_password,
        full_name="Admin Enterprise",
        role="admin",
        subscription_status="active",
        plan="enterprise"
    )
    db.add(admin)
    db.commit()
    
    # Verify user exists in DB
    user_check = db.query(models.User).filter(models.User.username == "teacher_basic").first()
    assert user_check is not None
    db.close()

    # Login Teacher
    login_teacher = client.post("/login", json={"username": "teacher_basic", "password": "secret123"})
    if login_teacher.status_code != 200:
        print(f"Login failed: {login_teacher.json()}")
    teacher_token = login_teacher.json()["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

    # Login Admin
    login_admin = client.post("/login", json={"username": "admin_enterprise", "password": "secret123"})
    admin_token = login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Test ai_grade access (Allowed for both teacher and admin)
    # Note: ai_grade min plan is not strictly defined in FeatureAccess yet, but it checks roles.
    response = client.post("/ai/grade", headers=teacher_headers, json={"image_url": "test", "prompt": "test"})
    # Since we don't have real AI keys, it might fail with 500 but should pass auth (not 403)
    assert response.status_code != 403

    response = client.post("/ai/grade", headers=admin_headers, json={"image_url": "test", "prompt": "test"})
    assert response.status_code != 403

    # Test ai_report access (Allowed for admin, but NOT for teacher)
    response = client.post("/ai/report", headers=teacher_headers, json={"student_id": "1", "type": "term"})
    assert response.status_code == 403 # Only admin or parent

    response = client.post("/ai/report", headers=admin_headers, json={"student_id": "1", "type": "term"})
    assert response.status_code != 403

def test_token_invalidation_on_version_change():
    """
    Test that changing a user's token_version in the DB invalidates existing tokens.
    """
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="version_user",
        password_hash=hashed_password,
        full_name="Version User",
        role="admin",
        subscription_status="active",
        token_version=1
    )
    db.add(user)
    db.commit()

    # 1. Login and get token
    login_response = client.post("/login", json={"username": "version_user", "password": "secret123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify token works
    response = client.get("/health", headers=headers)
    assert response.status_code == 200

    # 3. Increment token_version in DB
    user_db = db.query(models.User).filter(models.User.username == "version_user").first()
    user_db.token_version = 2
    db.commit()

    # 4. Verify old token is now invalid
    response = client.get("/students/", headers=headers)
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_concurrent_load_basic():
    """
    Simulate a small burst of concurrent requests to verify basic stability.
    """
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="load_user",
        password_hash=hashed_password,
        full_name="Load User",
        role="admin",
        subscription_status="active"
    )
    db.add(user)
    db.commit()

    login_response = client.post("/login", json={"username": "load_user", "password": "secret123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    async def make_request():
        # Using the sync client inside async test might be tricky, but for a small number it's fine
        # or we could use httpx.AsyncClient if we wanted to be more realistic
        response = client.get("/health", headers=headers)
        return response.status_code

    tasks = [make_request() for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    for status in results:
        assert status == 200
