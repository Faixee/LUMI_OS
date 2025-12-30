"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
import hashlib
import secrets
import logging
from types import SimpleNamespace

logger = logging.getLogger("lumios.auth")
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import schemas, database, models
from .config import settings

# Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Password Hashing - Centralized for production security
# OWASP recommends 600,000 iterations for PBKDF2-HMAC-SHA256
HASH_ITERATIONS = 600000

def get_password_hash(password: str) -> str:
    """Generate a secure password hash using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(16).hex()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), HASH_ITERATIONS)
    return f"{salt}:{dk.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed version."""
    try:
        salt_hex, hash_hex = hashed_password.split(":")
        dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), bytes.fromhex(salt_hex), HASH_ITERATIONS)
        return dk.hex() == hash_hex
    except (ValueError, TypeError, Exception):
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

OWNER_ROLES: List[str] = ["developer", "owner"]


PLAN_RANK: Dict[str, int] = {
    "free": 0,
    "basic": 1,
    "pro": 2,
    "enterprise": 3,
}


FEATURE_MIN_PLAN: Dict[str, str] = {
    "transport_read": "basic",
    "library_read": "basic",
    "fees_read": "basic",
    "ai_chat": "basic",
    "ai_quiz": "basic",
    "ai_explain": "basic",
    "ai_grade": "basic",
    "ai_neural_explain": "basic",
    "ai_finance": "pro",
    "ai_predict": "pro",
    "ai_report": "pro",
    "students_read": "pro",
    "assignments_upload": "pro",
    "nexus_upload": "enterprise",
    "system_config": "enterprise",
}


FEATURE_DAILY_LIMITS: Dict[str, Dict[str, int]] = {
    "ai_chat": {"basic": 50, "pro": 500, "enterprise": 5000},
    "ai_quiz": {"basic": 50, "pro": 500, "enterprise": 5000},
    "ai_explain": {"basic": 50, "pro": 500, "enterprise": 5000},
    "ai_neural_explain": {"basic": 50, "pro": 500, "enterprise": 5000},
    "ai_finance": {"pro": 200, "enterprise": 2000},
    "ai_predict": {"pro": 200, "enterprise": 2000},
    "ai_report": {"pro": 200, "enterprise": 2000},
}

def _error_detail(code: str, message: str):
    return {"code": code, "message": message}


def _developer_email_allowlist() -> set[str]:
    raw = (settings.DEVELOPER_EMAIL_ALLOWLIST or "").strip()
    if not raw:
        return set()
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_demo_user(user: models.User) -> bool:
    role = (getattr(user, "role", "") or "").lower()
    status_value = (getattr(user, "subscription_status", "") or "").lower()
    return role == "demo" or status_value == "demo"

def is_demo_session(user: models.User) -> bool:
    role = (getattr(user, "role", "") or "").lower()
    status_value = (getattr(user, "subscription_status", "") or "").lower()
    return role == "demo" or status_value == "demo"


def is_developer_user(user: models.User) -> bool:
    role = (getattr(user, "role", "") or "").lower()
    return role in ("developer", "owner")


def normalize_plan(raw_plan: Optional[str]) -> str:
    value = (raw_plan or "").strip().lower()
    aliases = {
        "": "free",
        "none": "free",
        "demo": "free",
        "free": "free",
        "trial": "free",
        "foundation": "basic",
        "monthly": "basic",
        "basic": "basic",
        "ascension": "pro",
        "yearly": "pro",
        "pro": "pro",
        "enterprise": "enterprise",
        "god_mode": "enterprise",
        "god mode": "enterprise",
        "godmode": "enterprise",
    }
    return aliases.get(value, "basic")


def is_subscription_active(user: models.User) -> bool:
    if is_developer_user(user):
        return True
    status_value = (user.subscription_status or "").lower()
    if status_value != "active":
        return False
    if user.subscription_expiry and user.subscription_expiry < datetime.utcnow():
        return False
    return True


def effective_plan(user: models.User) -> str:
    if is_developer_user(user):
        return "enterprise"
    if not is_subscription_active(user):
        return "free"
    return normalize_plan(user.plan)


def is_owner(user: models.User) -> bool:
    return (user.role or "").lower() in OWNER_ROLES


def _hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256((settings.SECRET_KEY + refresh_token).encode("utf-8")).hexdigest()


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def create_refresh_token_jwt(user: models.User, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode = {
        "sub": user.username,
        "typ": "refresh",
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "lumios-api",
        "aud": "lumios-frontend",
        "jti": secrets.token_urlsafe(18),
        "tv": int(getattr(user, "token_version", 0) or 0),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token with enhanced security features:
    - Proper expiration handling
    - Issuer and audience validation
    - Token versioning for invalidation
    """
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_version = int(to_encode.get("tv") or to_encode.get("token_version") or 0)

    # Add standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "lumios-api",
        "aud": "lumios-frontend",
        "version": "1.0",
        "jti": secrets.token_urlsafe(16),
        "tv": token_version,
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_demo_access_token(
    expires_delta: Optional[timedelta] = None,
    *,
    sub: str = "demo-user",
    role: str = "demo",
    name: str = "Demo Session",
    school_id: str = "demo",
) -> str:
    return create_access_token(
        data={
            "sub": sub,
            "role": role,
            "name": name,
            "subscription_status": "demo",
            "plan": "free",
            "school_id": school_id,
            "sandbox": True,
            "tv": 0,
        },
        expires_delta=(expires_delta or timedelta(minutes=settings.DEMO_TOKEN_EXPIRE_MINUTES)),
    )


def create_dev_access_token(
    email: str,
    expires_delta: Optional[timedelta] = None,
    *,
    school_id: str = "default",
) -> str:
    clean_email = (email or "").strip().lower()
    return create_access_token(
        data={
            "sub": f"dev:{clean_email}",
            "role": "developer",
            "name": "Developer Session",
            "email": clean_email,
            "subscription_status": "active",
            "plan": "enterprise",
            "school_id": school_id,
            "unlocked": True,
            "tv": 0,
        },
        expires_delta=(expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
    )

def is_production() -> bool:
    return settings.ENVIRONMENT == "production"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            audience="lumios-frontend",
            issuer="lumios-api",
        )
        username: str = payload.get("sub")
        if username is None:
            logger.warning(f"No username in payload: {payload}")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise credentials_exception

    role = (payload.get("role") or "").strip().lower()
    sub_status = (payload.get("subscription_status") or "").strip().lower()
    
    # DEV MODE SEGREGATION
    is_unlocked_dev = bool(payload.get("unlocked"))
    if is_unlocked_dev:
        if role != "developer":
             logger.warning(f"Dev token used with non-developer role: {role}")
             raise credentials_exception
        
        allow = _developer_email_allowlist()
        email = (payload.get("email") or "").strip().lower()
        if not email or email not in allow:
            logger.warning(f"Developer email not in allowlist: {email}")
            raise credentials_exception
            
        return SimpleNamespace(
            id=None,
            username=username,
            full_name=(payload.get("name") or "Developer Session"),
            role="developer",
            school_id=(payload.get("school_id") or "default"),
            subscription_status="active",
            subscription_expiry=None,
            plan="enterprise",
            is_suspended=False,
            token_version=0,
            profile=SimpleNamespace(email=email),
            is_developer=True
        )

    if role == "demo" and sub_status == "demo":
        return SimpleNamespace(
            id=None,
            username=username,
            full_name=(payload.get("name") or "Demo Session"),
            role="demo",
            school_id=(payload.get("school_id") or "demo"),
            subscription_status="demo",
            subscription_expiry=None,
            plan=None,
            is_suspended=False,
            token_version=0,
            profile=None,
            is_developer=False
        )

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        logger.warning(f"User not found in DB: '{username}'")
        raise credentials_exception

    token_tv = payload.get("tv")
    if token_tv is not None and int(token_tv) != int(getattr(user, "token_version", 0) or 0):
        logger.warning(f"Token version mismatch. Token: {token_tv}, DB: {getattr(user, 'token_version', 0)}")
        raise credentials_exception
    
    user.is_developer = False
    return user

from fastapi import Request

async def get_token_optional(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

def get_current_user_optional(token: Optional[str] = Depends(get_token_optional), db: Session = Depends(database.get_db)):
    """Optional version of get_current_user for guest access."""
    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return db.query(models.User).filter(models.User.username == username).first()
    except:
        return None

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if getattr(current_user, "is_suspended", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return current_user

def get_current_paid_user(current_user: models.User = Depends(get_current_active_user)):
    if not is_subscription_active(current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Active subscription required to access this feature"
        )
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Operation not permitted"
            )
        return user

class SubscriptionChecker:
    def __init__(self, required_status: List[str] = ["active"]):
        self.required_status = required_status

    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if is_subscription_active(user):
            return user

        required = [s.lower() for s in self.required_status]
        if (user.subscription_status or "").lower() not in required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_error_detail("PAID_SUBSCRIPTION_REQUIRED", "Active subscription required"),
            )
        return user


class PaidSubscriptionGuard:
    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if is_developer_user(user):
            return user
        if is_demo_user(user) or not is_subscription_active(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_error_detail("PAID_SUBSCRIPTION_REQUIRED", "Active subscription required"),
            )
        return user


class DemoWriteGuard:
    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if is_demo_session(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_error_detail("DEMO_WRITE_FORBIDDEN", "Demo sessions cannot perform write operations"),
            )
        return user


class FeatureAccess:
    def __init__(self, feature: str, allowed_roles: Optional[List[str]] = None):
        self.feature = feature
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):
        if is_developer_user(user):
            return user

        # FREE USER RESTRICTION: Only allow 'ai_chat' (Nova chatbot)
        if is_demo_user(user) or not is_subscription_active(user):
            if self.feature != "ai_chat":
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=_error_detail("PAID_SUBSCRIPTION_REQUIRED", f"Feature '{self.feature}' requires an active subscription")
                )
            return user

        if self.allowed_roles and (user.role or "") not in self.allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted")

        required_plan = FEATURE_MIN_PLAN.get(self.feature, "enterprise")
        user_plan = effective_plan(user)
        if PLAN_RANK.get(user_plan, 0) < PLAN_RANK.get(required_plan, 99):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_error_detail("PLAN_UPGRADE_REQUIRED", "Plan upgrade required"),
            )

        limits_by_plan = FEATURE_DAILY_LIMITS.get(self.feature)
        if limits_by_plan:
            daily_limit = limits_by_plan.get(user_plan)
            if daily_limit is not None:
                if getattr(user, "id", None) is None:
                    # If user has no ID (e.g. demo user), we might need a session-based limit
                    # For now, demo users aren't counted in UsageCounter if they don't have ID
                    return user
                    
                period = datetime.utcnow().strftime("%Y-%m-%d")
                row = (
                    db.query(models.UsageCounter)
                    .filter(
                        models.UsageCounter.user_id == user.id,
                        models.UsageCounter.period == period,
                        models.UsageCounter.feature == self.feature,
                    )
                    .first()
                )
                if not row:
                    row = models.UsageCounter(user_id=user.id, period=period, feature=self.feature, count=0)
                    db.add(row)
                    db.flush()
                if int(row.count or 0) >= int(daily_limit):
                    raise HTTPException(status_code=429, detail=_error_detail("QUOTA_EXCEEDED", "Quota exceeded"))
                row.count = int(row.count or 0) + 1
                row.updated_at = datetime.utcnow()
                db.commit()

        return user


class DeveloperGuard:
    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if not is_developer_user(user) or not getattr(user, "is_developer", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_error_detail("DEVELOPER_ACCESS_REQUIRED", "Exclusive developer access required")
            )
        return user


class DemoOnlyGuard:
    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if is_demo_user(user):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail("DEMO_ONLY_FEATURE", "This feature is only for demo users")
        )
