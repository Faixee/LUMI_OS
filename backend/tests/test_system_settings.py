"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from jose import jwt
from datetime import datetime, timedelta

from backend.main import app
from backend.config import settings
from backend import auth, models, database

client = TestClient(app)

# Mock DB dependency
@pytest.fixture
def mock_db():
    db = MagicMock()
    # Default behavior for queries
    db.query.return_value.all.return_value = []
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.count.return_value = 0
    return db

@pytest.fixture(autouse=True)
def override_db(mock_db):
    app.dependency_overrides[database.get_db] = lambda: mock_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def dev_token():
    email = "admin@lumios.dev"
    # We need to ensure auth._developer_email_allowlist() returns this email
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", email):
        token_data = {
            "sub": f"dev:{email}",
            "role": "developer",
            "name": "Admin Dev",
            "email": email,
            "unlocked": True,
            "tv": 0,
            "aud": "lumios-frontend",
            "iss": "lumios-api",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        return jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@pytest.fixture
def student_token():
    token_data = {
        "sub": "student1",
        "role": "student",
        "tv": 0,
        "aud": "lumios-frontend",
        "iss": "lumios-api",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def test_get_system_settings_unauthorized(student_token, mock_db):
    # Mock user in DB for get_current_user
    mock_user = models.User(username="student1", role="student")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    response = client.get(
        "/internal/system/settings",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    # Should be 403 because it's not a developer
    assert response.status_code == 403
    assert "DEVELOPER_ACCESS_REQUIRED" in response.json()["detail"]["code"]

def test_get_system_settings_authorized(dev_token, mock_db):
    email = "admin@lumios.dev"
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", email):
        mock_db.query.return_value.all.return_value = [
            models.SystemSettings(key="maintenance_mode", value="false"),
            models.SystemSettings(key="global_alert", value="Welcome to LUMIX OS")
        ]
        
        response = client.get(
            "/internal/system/settings",
            headers={"Authorization": f"Bearer {dev_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["maintenance_mode"] == "false"
        assert data["global_alert"] == "Welcome to LUMIX OS"

def test_update_system_setting(dev_token, mock_db):
    email = "admin@lumios.dev"
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", email):
        mock_db.query.return_value.filter.return_value.first.return_value = None # Create new
        
        payload = {
            "key": "maintenance_mode",
            "value": "true",
            "description": "Emergency maintenance"
        }
        response = client.post(
            "/internal/system/settings",
            json=payload,
            headers={"Authorization": f"Bearer {dev_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["value"] == "true"
        
        # Verify DB calls
        mock_db.add.assert_called()
        mock_db.commit.assert_called()

def test_system_stats_authorized(dev_token, mock_db):
    email = "admin@lumios.dev"
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", email):
        # mock count for different models
        mock_db.query.return_value.count.side_effect = [100, 5, 500]
        
        response = client.get(
            "/internal/system/stats",
            headers={"Authorization": f"Bearer {dev_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_users"] == 100
        assert data["total_schools"] == 5
        assert data["total_ai_requests"] == 500
