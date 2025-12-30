"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from backend import auth, models
from backend.config import settings

def test_password_hashing():
    password = "secure_password123"
    hashed = auth.get_password_hash(password)
    assert hashed != password
    assert auth.verify_password(password, hashed) is True
    assert auth.verify_password("wrong_password", hashed) is False

def test_normalize_plan():
    assert auth.normalize_plan("foundation") == "basic"
    assert auth.normalize_plan("monthly") == "basic"
    assert auth.normalize_plan("ascension") == "pro"
    assert auth.normalize_plan("yearly") == "pro"
    assert auth.normalize_plan("god_mode") == "enterprise"
    assert auth.normalize_plan("unknown") == "basic"
    assert auth.normalize_plan("") == "free"

def test_is_subscription_active():
    # Developer user should always be active
    dev_user = models.User(username="dev", role="developer", subscription_status="expired")
    assert auth.is_subscription_active(dev_user) is True

    # Active subscription
    active_user = models.User(username="user", role="student", subscription_status="active", subscription_expiry=datetime.utcnow() + timedelta(days=1))
    assert auth.is_subscription_active(active_user) is True

    # Expired subscription
    expired_user = models.User(username="user", role="student", subscription_status="active", subscription_expiry=datetime.utcnow() - timedelta(days=1))
    assert auth.is_subscription_active(expired_user) is False

    # Inactive status
    inactive_user = models.User(username="user", role="student", subscription_status="demo")
    assert auth.is_subscription_active(inactive_user) is False

def test_create_access_token():
    data = {"sub": "testuser", "role": "student"}
    token = auth.create_access_token(data)
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], audience="lumios-frontend")
    assert decoded["sub"] == "testuser"
    assert decoded["role"] == "student"
    assert "exp" in decoded
    assert "iat" in decoded

def test_is_demo_user():
    assert auth.is_demo_user(models.User(role="demo")) is True
    assert auth.is_demo_user(models.User(subscription_status="demo")) is True
    assert auth.is_demo_user(models.User(role="student", subscription_status="active")) is False
