"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from types import SimpleNamespace
from jose import jwt

from backend import auth, models, database
from backend.config import settings

# Mocking the DB session
@pytest.fixture
def mock_db():
    return MagicMock()

# Mocking a user
@pytest.fixture
def mock_user():
    user = models.User(
        id=1,
        username="testuser",
        role="student",
        plan="basic",
        subscription_status="active",
        subscription_expiry=datetime.utcnow() + timedelta(days=30),
        is_suspended=False,
        token_version=0
    )
    user.is_developer = False
    return user

def test_is_production_logic():
    with patch("backend.auth.settings.ENVIRONMENT", "production"):
        assert auth.is_production() is True
    with patch("backend.auth.settings.ENVIRONMENT", "development"):
        assert auth.is_production() is False

def test_get_current_user_developer_success(mock_db):
    email = "dev@example.com"
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", email):
        token_data = {
            "sub": f"dev:{email}",
            "role": "developer",
            "name": "Dev User",
            "email": email,
            "unlocked": True,
            "tv": 0,
            "aud": "lumios-frontend",
            "iss": "lumios-api",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        user = auth.get_current_user(token=token, db=mock_db)
        
        assert user.role == "developer"
        assert user.is_developer is True
        assert user.profile.email == email

def test_get_current_user_developer_unauthorized_email(mock_db):
    email = "hacker@example.com"
    with patch("backend.auth.settings.DEVELOPER_EMAIL_ALLOWLIST", "dev@example.com"):
        token_data = {
            "sub": f"dev:{email}",
            "role": "developer",
            "email": email,
            "unlocked": True,
            "aud": "lumios-frontend",
            "iss": "lumios-api"
        }
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        with pytest.raises(HTTPException) as exc:
            auth.get_current_user(token=token, db=mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

def test_feature_access_free_user_restriction(mock_db):
    # Mock a free user (active sub but plan is 'free')
    free_user = SimpleNamespace(
        id=2,
        role="student",
        plan="free",
        subscription_status="demo",
        is_developer=False,
        is_suspended=False
    )
    
    # ai_chat should be allowed for free users
    guard_chat = auth.FeatureAccess(feature="ai_chat")
    allowed_user = guard_chat(user=free_user, db=mock_db)
    assert allowed_user == free_user
    
    # ai_finance should NOT be allowed for free users
    guard_finance = auth.FeatureAccess(feature="ai_finance")
    with pytest.raises(HTTPException) as exc:
        guard_finance(user=free_user, db=mock_db)
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN
    assert "PAID_SUBSCRIPTION_REQUIRED" in exc.value.detail["code"]

def test_feature_access_plan_requirements(mock_db):
    # Mock a basic user
    basic_user = models.User(
        id=3,
        role="student",
        plan="basic",
        subscription_status="active",
        subscription_expiry=datetime.utcnow() + timedelta(days=1)
    )
    basic_user.is_developer = False
    
    # ai_finance requires 'pro'
    guard_finance = auth.FeatureAccess(feature="ai_finance")
    with pytest.raises(HTTPException) as exc:
        guard_finance(user=basic_user, db=mock_db)
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN
    assert "PLAN_UPGRADE_REQUIRED" in exc.value.detail["code"]
    
    # Mock a pro user
    pro_user = models.User(
        id=4,
        role="student",
        plan="pro",
        subscription_status="active",
        subscription_expiry=datetime.utcnow() + timedelta(days=1)
    )
    pro_user.is_developer = False
    allowed_user = guard_finance(user=pro_user, db=mock_db)
    assert allowed_user == pro_user

def test_developer_guard(mock_db):
    dev_user = SimpleNamespace(role="developer", is_developer=True)
    regular_user = SimpleNamespace(role="student", is_developer=False)
    
    guard = auth.DeveloperGuard()
    
    # Developer should pass
    assert guard(user=dev_user) == dev_user
    
    # Regular user should fail
    with pytest.raises(HTTPException) as exc:
        guard(user=regular_user)
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN
    assert "DEVELOPER_ACCESS_REQUIRED" in exc.value.detail["code"]

def test_dev_token_creation_and_segregation():
    email = "faizain@example.com"
    token = auth.create_dev_access_token(email=email)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], audience="lumios-frontend")
    assert payload["sub"] == f"dev:{email}"
    assert payload["unlocked"] is True
    assert payload["role"] == "developer"
    assert payload["plan"] == "enterprise"

def test_demo_token_creation():
    token = auth.create_demo_access_token()
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], audience="lumios-frontend")
    assert payload["role"] == "demo"
    assert payload["subscription_status"] == "demo"
    assert payload["sandbox"] is True
