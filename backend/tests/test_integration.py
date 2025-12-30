"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import Base, get_db as db_get_db
from backend.main import get_db as main_get_db
from backend.auth import get_password_hash
from backend import models, database
import os

# Setup file-based SQLite for integration tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[main_get_db] = override_get_db
app.dependency_overrides[database.get_db] = override_get_db
app.dependency_overrides[db_get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_integration.db"):
        try:
            os.remove("./test_integration.db")
        except:
            pass

def test_password_verification_logic():
    from backend.auth import verify_password
    password = "testpassword"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_auth_and_protected_route():
    # Setup: Create a user in the DB
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="active_user",
        password_hash=hashed_password,
        full_name="Active User",
        role="teacher", # teacher has access to students_read
        subscription_status="active",
        plan="pro" # pro plan required for students_read
    )
    db.add(user)
    db.commit()
    db.close()

    # 1. Login
    login_response = client.post("/login", json={"username": "active_user", "password": "secret123"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Access protected route
    response = client.get("/students/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unpaid_account_restriction():
    # Setup: Create an unpaid user
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="unpaid_user",
        password_hash=hashed_password,
        full_name="Unpaid User",
        role="teacher", # teacher role to pass role check
        subscription_status="expired" # expired status to trigger PAID_SUBSCRIPTION_REQUIRED
    )
    db.add(user)
    db.commit()
    db.close()

    # 1. Login
    login_response = client.post("/login", json={"username": "unpaid_user", "password": "secret123"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Attempt to access protected route - should be restricted now
    response = client.get("/students/", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"]["message"] == "Active subscription required"

def test_developer_bypass():
    # Setup: Create a developer user
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="dev_user",
        password_hash=hashed_password,
        full_name="Dev User",
        role="developer", # developer role bypasses plan checks
        subscription_status="active" # set to active so it's not forced to demo session
    )
    db.add(user)
    db.commit()
    db.close()

    # 1. Login
    login_response = client.post("/login", json={"username": "dev_user", "password": "secret123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Access protected route - should be allowed due to bypass
    response = client.get("/students/", headers=headers)
    assert response.status_code == 200

def test_ai_service_interaction():
    # Setup: Create a paid user
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="pro_user",
        password_hash=hashed_password,
        full_name="Pro User",
        role="teacher",
        subscription_status="active",
        plan="pro"
    )
    db.add(user)
    db.commit()
    db.close()

    # 1. Login
    login_response = client.post("/login", json={"username": "pro_user", "password": "secret123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Call AI service endpoint (e.g., voice-signal)
    response = client.post("/ai/voice-signal", headers=headers, json={"signal": "test"})
    # It might return 500 if keys are missing, but 401/403 would be failure.
    assert response.status_code != 401
    assert response.status_code != 403

def test_health_and_db_connection():
    # Public route
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "online"

    # Setup user for DB test
    db = TestingSessionLocal()
    hashed_password = get_password_hash("secret123")
    user = models.User(
        username="admin_user",
        password_hash=hashed_password,
        full_name="Admin User",
        role="admin",
        subscription_status="active",
        plan="enterprise"
    )
    db.add(user)
    db.commit()
    db.close()

    login_response = client.post("/login", json={"username": "admin_user", "password": "secret123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # DB connection test - now authenticated
    response = client.post("/db/test-connection", headers=headers, json={"connection_string": "sqlite:///:memory:"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
