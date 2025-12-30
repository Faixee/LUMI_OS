"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest
from backend import models, auth

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_debug.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_debug_login():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    hashed_password = auth.get_password_hash("testpass")
    user = models.User(
        username="debuguser",
        password_hash=hashed_password,
        full_name="Debug User",
        role="admin",
        subscription_status="active"
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post("/login", json={"username": "debuguser", "password": "testpass"})
    print(f"DEBUG RESPONSE: {response.status_code} - {response.json()}")
    assert response.status_code == 200
    
    Base.metadata.drop_all(bind=engine)
