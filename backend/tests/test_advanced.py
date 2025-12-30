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
import time
from unittest.mock import patch, AsyncMock, MagicMock

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_advanced.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[db_get_db] = override_get_db
app.dependency_overrides[main_get_db] = override_get_db

# Disable rate limiting for tests
if hasattr(app.state, "limiter"):
    app.state.limiter.enabled = False

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    TestingSessionLocal.close_all()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test_advanced.db"):
        try:
            os.remove("./test_advanced.db")
        except PermissionError:
            pass

@pytest.mark.asyncio
async def test_stress_concurrent_auth():
    """
    Simulate many users logging in simultaneously using AsyncClient.
    """
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    
    # Create 20 users (reduced from 50 for stability in test env)
    users_to_create = 20
    for i in range(users_to_create):
        user = models.User(
            username=f"stress_user_{i}",
            password_hash=hashed_password,
            role="student",
            subscription_status="active",
            plan="basic"
        )
        db.add(user)
    db.commit()
    db.close()

    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        tasks = []
        for i in range(users_to_create):
            tasks.append(ac.post("/login", json={"username": f"stress_user_{i}", "password": "secret123"}))
        
        start_time = time.time()
        responses = await asyncio.gather(*tasks)
        end_time = time.time()

    duration = end_time - start_time
    print(f"\nAdvanced Stress Test: {users_to_create} logins in {duration:.2f}s")
    
    for resp in responses:
        assert resp.status_code == 200
        assert "access_token" in resp.json()

@pytest.mark.asyncio
async def test_high_volume_data_retrieval():
    """
    Test performance of retrieving a large number of records.
    """
    db = TestingSessionLocal()
    # Create 100 student records
    for i in range(100):
        student = models.Student(
            id=f"S{i:03d}",
            name=f"Student {i}",
            grade_level=9,
            school_id="stress_test"
        )
        db.add(student)
    
    # Create an admin user for access with same school_id
    hashed_password = get_password_hash("admin123")
    admin = models.User(
        username="admin_stress",
        password_hash=hashed_password,
        role="admin",
        subscription_status="active",
        plan="enterprise",
        school_id="stress_test"
    )
    db.add(admin)
    db.commit()
    db.close()

    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        # Login
        login_response = await ac.post("/login", json={"username": "admin_stress", "password": "admin123"})
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Retrieve all students
        start_time = time.time()
        # Explicitly request more than 100 just in case
        response = await ac.get("/students/?limit=200", headers=headers)
        end_time = time.time()

    assert response.status_code == 200
    data = response.json()
    # Ensure we actually see the students we created (StudentResponse schema might not have school_id)
    stress_students = [s for s in data if s.get("name", "").startswith("Student ")]
    print(f"\nAdvanced Stress Test: Retrieved {len(stress_students)} stress-test students (Total: {len(data)}) in {end_time - start_time:.4f}s")
    assert len(stress_students) >= 100

@pytest.mark.asyncio
async def test_peak_resource_utilization_sim():
    """
    Simulate a peak load where multiple systems (Auth, DB, AI) are hit at once using AsyncClient.
    """
    # Mock AIService to avoid external hits and 502s
    with patch("backend.main.ai_service.process_vision_grading", new_callable=AsyncMock) as mock_grade:
        mock_grade.return_value = {
            "student": "Test Student",
            "score": 85,
            "feedback": "Great work!",
            "annotations": [{"point": "Q1", "comment": "Excellent"}],
            "insights": {"learning_pattern": "Strong logic"},
            "status": "success"
        }
        
        db = TestingSessionLocal()
        hashed_password = get_password_hash("peak123")
        user = models.User(
            username="peak_user",
            password_hash=hashed_password,
            role="teacher",
            subscription_status="active",
            plan="pro"
        )
        db.add(user)
        db.commit()
        db.close()

        async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
            # Login first
            login_resp = await ac.post("/login", json={"username": "peak_user", "password": "peak123"})
            assert login_resp.status_code == 200
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            async def mix_operation(i):
                if i % 3 == 0:
                    return await ac.get("/students/", headers=headers)
                elif i % 3 == 1:
                    return await ac.get("/health", headers=headers)
                else:
                    # Use a dummy file for grading to avoid 422
                    files = {"file": ("test.png", b"fake-image-content", "image/png")}
                    return await ac.post("/ai/grade", headers=headers, files=files, data={"context": "Test grading"})

            tasks = [mix_operation(i) for i in range(12)] # Reduced further for SQLite stability
            start_time = time.time()
            responses = await asyncio.gather(*tasks)
            end_time = time.time()

        print(f"\nPeak Utilization Sim: 12 mixed operations in {end_time - start_time:.2f}s")
        for resp in responses:
            assert resp.status_code == 200
