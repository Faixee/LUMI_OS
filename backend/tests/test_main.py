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
from backend.database import Base, get_db

# Setup the in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the database tables
Base.metadata.create_all(bind=engine)

# Dependency override
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "status": "LumiX Core Online", 
        "version": "1.0.0", 
        "system": "LumiX Core",
        "creator": "Faizain Murtuza"
    }

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LumiX Core Online"
    assert data["database"] == "online"

def test_voice_signal_offer():
    response = client.post("/ai/voice-signal", json={"type": "offer"})
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "answer"
    assert "sdp" in data
    assert "Neural link established" in data["text"]

def test_voice_signal_candidate():
    response = client.post("/ai/voice-signal", json={"type": "candidate"})
    assert response.status_code == 200
    assert response.json() == {"status": "candidate_received"}

def test_db_test_connection_unauthorized():
    # Should fail without authentication
    response = client.post("/db/test-connection", json={"connection_string": "sqlite:///:memory:"})
    assert response.status_code == 401
