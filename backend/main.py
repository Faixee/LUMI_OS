"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

"""
LUMIX CORE API
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
System: LumiX OS v1.0.0
"""
from fastapi import FastAPI, Depends, HTTPException, Request, Response, Header, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
import os
import time
import secrets
import re
import logging
import hashlib
import json
import csv
import io
import httpx
from backend.config import settings
from pythonjsonlogger.json import JsonFormatter

# --- LOGGING CONFIGURATION ---
logger = logging.getLogger("lumios")
log_handler = logging.StreamHandler()
formatter = JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(method)s %(path)s %(status_code)s %(duration_ms)s'
)
log_handler.setFormatter(formatter)
logger.addHandler(log_handler)
logger.setLevel(logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG)

from backend import models, schemas, database, auth
from backend.ai_service import ai_service
from backend.crawler_service import CrawlerService

crawler_service = CrawlerService(ai_service)

from backend.security import add_security_headers, sanitize_input, validate_email, validate_password_strength, validate_username
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

try:
    import google.generativeai as genai
except Exception:
    genai = None

from jose import jwt, JWTError


app = FastAPI(title="LumiX Core API")

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.get("/")
async def root():
    return {
        "status": "LumiX Core Online", 
        "version": "1.0.0", 
        "system": "LumiX Core",
        "creator": "Faizain Murtuza",
        "debug": "RELOAD_TEST_V2"
    }

@app.get("/system-info")
async def system_info():
    return {
        "creator": "Faizain Murtuza",
        "copyright": f"© {datetime.now().year} Faizain Murtuza",
        "system": "LumiX Core",
        "version": "1.0.0",
        "architecture": "Asynchronous Intelligence-First SMS",
        "development_status": "Production Ready"
    }

@app.get("/health")
async def health(db: Session = Depends(database.get_db)):
    try:
        # Simple query to check DB connection
        db.execute(text("SELECT 1"))
        db_status = "online"
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        db_status = "offline"
        
    return {
        "status": "LumiX Core Online", 
        "version": "1.0.0",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "mode": "production" if settings.ENVIRONMENT == "production" else "development"
    }

# --- DEVELOPER & ADMIN ENDPOINTS ---
dev_guard = auth.DeveloperGuard()

@app.get("/internal/system/settings")
async def get_system_settings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Admin/Developer: Get all global system settings."""
    if not auth.is_developer_user(current_user) and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")

    settings = db.query(models.SystemSettings).all()
    return {s.key: s.value for s in settings}

@app.post("/internal/system/settings")
async def update_system_setting(
    req: Dict[str, Any],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Admin/Developer: Update a global system setting."""
    if not auth.is_developer_user(current_user) and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")

    key = req.get("key")
    value = str(req.get("value"))
    desc = req.get("description")
    
    if not key:
        raise HTTPException(status_code=400, detail="Key is required")
        
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    if not setting:
        setting = models.SystemSettings(key=key)
        db.add(setting)
    
    setting.value = value
    if desc:
        setting.description = desc
    setting.updated_by = current_user.username
    
    db.commit()
    logger.info(f"System setting '{key}' updated by {setting.updated_by}")
    return {"status": "ok", "key": key, "value": value}

@app.get("/internal/system/stats")
async def get_system_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Admin/Developer: Get global system statistics."""
    if not auth.is_developer_user(current_user) and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")

    user_count = db.query(models.User).count()
    school_count = db.query(models.SchoolConfig).count()
    ai_request_count = db.query(models.AIRequestLog).count()
    
    return {
        "total_users": user_count,
        "total_schools": school_count,
        "total_ai_requests": ai_request_count,
        "environment": settings.ENVIRONMENT,
        "developer_session": getattr(current_user, "username", "anonymous")
    }

# ----------------------------
# CORS CONFIGURATION
# ----------------------------
# Allow requests from:
# 1. Local development (localhost, 127.0.0.1)
# 2. Production Vercel domain (lumios-lms.vercel.app)
# 3. Any other Vercel preview deployments (*.vercel.app)
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://lumios-lms.vercel.app",
    "https://lumios.vercel.app",
    "https://lumix-os.vercel.app",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:3001"
]

# In development, we can allow more lenient CORS to support local network testing
if settings.ENVIRONMENT != "production":
    origins.extend([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"  # Allow all origins in dev for easier mobile testing
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# SECURITY MIDDLEWARE
# ----------------------------
# NOTE: Vercel/Cloudflare handles HTTPS redirection at the edge. 
# Internal HTTPS redirection can cause issues on serverless platforms.

# Add security headers to all responses
app.middleware("http")(add_security_headers)


@app.middleware("http")
async def pna_middleware(request: Request, call_next):
    """
    Adds support for Private Network Access (PNA) to all responses.
    """
    response = await call_next(request)
    if request.headers.get("Access-Control-Request-Private-Network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    request_id = secrets.token_urlsafe(12)
    started = time.time()
    response = None

    try:
        response = await call_next(request)
        duration_ms = int((time.time() - started) * 1000)
        
        # Add creator attribution to all API responses
        response.headers["X-Created-By"] = "Faizain Murtuza"
        response.headers["X-System-Architecture"] = "Asynchronous Intelligence-First SMS"
        
        # Structured logging with creator attribution
        logger.info(
            "Request processed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "ip": get_remote_address(request),
                "creator": "Faizain Murtuza"
            }
        )
        return response
    except Exception as e:
        import traceback
        traceback.print_exc() # Print full traceback to console
        duration_ms = int((time.time() - started) * 1000)
        logger.error(
            "Request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "duration_ms": duration_ms,
                "error": str(e)
            }
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": request_id}
        )
    finally:
        # Save to AuditLog (optional for every request, but kept here as per original)
        try:
            status_code = getattr(response, "status_code", 500)
            auth_header = request.headers.get("authorization") or ""

            user_id = None
            school_id = None
            if auth_header.lower().startswith("bearer "):
                token = auth_header.split(" ", 1)[1].strip()
                try:
                    payload = jwt.decode(
                        token,
                        settings.SECRET_KEY,
                        algorithms=[settings.ALGORITHM],
                        audience="lumios-frontend",
                        issuer="lumios-api",
                    )
                    username = payload.get("sub")
                    school_id = payload.get("school_id") or school_id
                    if username:
                        db = database.SessionLocal()
                        try:
                            user = db.query(models.User).filter(models.User.username == username).first()
                            if user:
                                user_id = user.id
                                school_id = getattr(user, "school_id", None)
                        finally:
                            db.close()
                except Exception:
                    user_id = None
                    school_id = None

            db = database.SessionLocal()
            try:
                db.add(models.AuditLog(
                    user_id=user_id,
                    school_id=school_id,
                    ip=get_remote_address(request),
                    method=request.method,
                    path=request.url.path,
                    status_code=status_code,
                    user_agent=(request.headers.get("user-agent") or "")[:500],
                    request_id=request_id,
                ))
                db.commit()
            finally:
                db.close()
        except Exception:
            pass

        if response is not None:
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time-ms"] = str(int((time.time() - started) * 1000))

# CORS CONFIG - Handle both list and string from settings
if isinstance(settings.CORS_ORIGINS, list):
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS if origin.strip()]
else:
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

# If we're in production, we might want to restrict this more carefully,
# but for now, we ensure current origin is allowed if it's a known domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Request-ID", "Content-Type", "Authorization"],
    max_age=600,
)

# FIX: allow OPTIONS (CORS preflight) for all routes including Private Network Access
@app.options("/{path:path}")
@limiter.exempt
async def preflight(path: str, request: Request):
    """
    Fixes CORS 400 Bad Request caused by SlowAPI blocking OPTIONS requests
    and adds support for Private Network Access (PNA).
    """
    origin = request.headers.get("origin")
    
    # Return 204 No Content for preflight success
    response = Response(status_code=204)
    
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
        
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, X-Internal-Dev-Secret, X-Request-ID"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "86400"
        
    # Support for Chrome/Edge Private Network Access security feature
    if request.headers.get("Access-Control-Request-Private-Network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        # Edge sometimes needs explicit origin/methods even in the PNA preflight
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, X-Internal-Dev-Secret, X-Request-ID"
        
    return response

# ----------------------------
# VITE DEV SERVER PROXY (FIX)
# ----------------------------
@app.get("/@vite/client")
async def vite_client():
    """
    Prevents 405 Method Not Allowed error when Vite dev server pings the backend.
    """
    return Response(status_code=204)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)



# ----------------------------
# DATABASE
# ----------------------------
# Only create tables if we're not in a migration-heavy production env
# In true prod, we'd use Alembic
try:
    models.Base.metadata.create_all(bind=database.engine)
except Exception as e:
    logger.error(f"Database initialization failed: {e}")
    # We don't crash here because we want the health check to stay up
    # and provide diagnostic info via logs.

# PRODUCTION CHECK: Warn if using SQLite in production
if settings.ENVIRONMENT == "production" and "sqlite" in str(database.engine.url):
    logger.warning("PRODUCTION ALERT: Using SQLite in production environment. Data will not persist across restarts/cold-starts on serverless platforms like Vercel.")

try:
    if "sqlite" in str(database.engine.url):
        with database.engine.connect() as conn:
            table_migrations: Dict[str, Dict[str, str]] = {
                "users": {
                    "subscription_status": "ALTER TABLE users ADD COLUMN subscription_status VARCHAR",
                    "subscription_expiry": "ALTER TABLE users ADD COLUMN subscription_expiry DATETIME",
                    "plan": "ALTER TABLE users ADD COLUMN plan VARCHAR",
                    "is_suspended": "ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT 0",
                    "token_version": "ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0",
                    "refresh_token_hash": "ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR",
                    "refresh_token_expires_at": "ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME",
                    "school_id": "ALTER TABLE users ADD COLUMN school_id VARCHAR",
                },
                "user_profiles": {
                    "school_id": "ALTER TABLE user_profiles ADD COLUMN school_id VARCHAR",
                },
                "students": {
                    "school_id": "ALTER TABLE students ADD COLUMN school_id VARCHAR",
                },
                "fees": {
                    "school_id": "ALTER TABLE fees ADD COLUMN school_id VARCHAR",
                },
                "transport": {
                    "school_id": "ALTER TABLE transport ADD COLUMN school_id VARCHAR",
                },
                "library": {
                    "school_id": "ALTER TABLE library ADD COLUMN school_id VARCHAR",
                },
                "audit_logs": {
                    "school_id": "ALTER TABLE audit_logs ADD COLUMN school_id VARCHAR",
                },
                "school_config": {
                    "name": "ALTER TABLE school_config ADD COLUMN name VARCHAR",
                    "motto": "ALTER TABLE school_config ADD COLUMN motto VARCHAR",
                    "primary_color": "ALTER TABLE school_config ADD COLUMN primary_color VARCHAR",
                    "secondary_color": "ALTER TABLE school_config ADD COLUMN secondary_color VARCHAR",
                    "logo_url": "ALTER TABLE school_config ADD COLUMN logo_url TEXT",
                    "website_context": "ALTER TABLE school_config ADD COLUMN website_context TEXT",
                    "modules_json": "ALTER TABLE school_config ADD COLUMN modules_json TEXT",
                    "security_level": "ALTER TABLE school_config ADD COLUMN security_level VARCHAR DEFAULT 'standard'",
                    "ai_creativity": "ALTER TABLE school_config ADD COLUMN ai_creativity INTEGER DEFAULT 50",
                    "ai_enabled": "ALTER TABLE school_config ADD COLUMN ai_enabled BOOLEAN DEFAULT 1",
                    "ai_disabled_reason": "ALTER TABLE school_config ADD COLUMN ai_disabled_reason VARCHAR",
                    "updated_at": "ALTER TABLE school_config ADD COLUMN updated_at DATETIME",
                },
            }

            for table, migrations in table_migrations.items():
                try:
                    existing_cols = [row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()]
                except Exception:
                    continue
                for col, stmt in migrations.items():
                    if col not in existing_cols:
                        conn.execute(text(stmt))

            conn.execute(text("UPDATE users SET school_id = COALESCE(school_id, 'default')"))
            for table in ["user_profiles", "students", "fees", "transport", "library", "audit_logs"]:
                try:
                    conn.execute(text(f"UPDATE {table} SET school_id = COALESCE(school_id, 'default')"))
                except Exception:
                    pass
except Exception:
    pass

# --- AUTO-SEEDING (Self-Healing) ---
# Ensure at least one admin exists if the DB is empty (common on cold starts)
try:
    with database.SessionLocal() as db:
        admin_exists = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_exists:
            logger.info("Self-Healing: Creating default admin user...")
            new_admin = models.User(
                username="admin",
                password_hash=auth.get_password_hash("lumix123"),
                full_name="System Administrator",
                role="admin",
                school_id="default",
                subscription_status="active",
                subscription_expiry=datetime.now(timezone.utc) + timedelta(days=3650), # 10 years
                plan="enterprise"
            )
            db.add(new_admin)
            
            # Ensure default school config exists
            school_exists = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == "default").first()
            if not school_exists:
                default_school = models.SchoolConfig(
                    school_id="default",
                    name="LumiX Academy",
                    motto="Inspired Learning. Bold Futures.",
                    primary_color="#06b6d4",
                    secondary_color="#6366f1",
                    security_level="standard",
                    ai_creativity=50,
                    ai_enabled=True
                )
                db.add(default_school)
            
            # Add a sample student so the UI isn't empty
            sample_student = models.Student(
                id="S1001",
                name="Demo Student",
                grade_level=10,
                attendance=95.5,
                gpa=3.8,
                behavior_score=90,
                school_id="default"
            )
            db.add(sample_student)
            
            db.commit()
            logger.info("Self-Healing: Default state restored.")
except Exception as e:
    logger.error(f"Self-Healing failed: {e}")

# --- TEACHER MODULE ---
@app.get("/teacher/classes", response_model=List[Dict[str, Any]])
def get_teacher_classes(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    classes = db.query(models.TeacherClass).filter(models.TeacherClass.teacher_id == current_user.id).all()
    return [{"name": c.name, "room": c.room, "time": c.time, "students_count": c.students_count} for c in classes]

# --- STUDENT MODULE ---
@app.get("/student/schedule", response_model=List[Dict[str, Any]])
def get_student_schedule(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    items = db.query(models.ScheduleItem).filter(models.ScheduleItem.user_id == current_user.id).all()
    return [{"subject": i.subject, "time": i.time, "room": i.room, "day": i.day} for i in items]

@app.get("/student/assignments", response_model=List[Dict[str, Any]])
def get_student_assignments(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    assignments = db.query(models.Assignment).filter(models.Assignment.student_id == current_user.id).all()
    return [{"title": a.title, "subject": a.subject, "due_date": a.due_date, "status": a.status} for a in assignments]

# --- TRANSPORT & LIBRARY ---
@app.get("/transport/routes", response_model=List[Dict[str, Any]])
def get_transport_routes(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    routes = db.query(models.TransportRoute).all()
    return [{"id": r.id, "route_name": r.route_name, "driver_name": r.driver_name, "license_plate": r.license_plate, "fuel_level": r.fuel_level, "status": r.status} for r in routes]

@app.get("/library/books", response_model=List[Dict[str, Any]])
def get_library_books(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    books = db.query(models.LibraryBook).all()
    return [{"id": b.id, "title": b.title, "author": b.author, "category": b.category, "status": b.status} for b in books]

# --- PARENT MODULE ---
@app.get("/parent/transport", response_model=List[Dict[str, Any]])
def get_parent_transport(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # In a real app, we'd filter by the child's assigned route
    routes = db.query(models.TransportRoute).filter(models.TransportRoute.status == "Active").all()
    return [{"route_name": r.route_name, "driver_name": r.driver_name, "status": r.status} for r in routes]
# ----------------------------
# UTILS
# ----------------------------
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_school_id(raw: Optional[str]) -> str:
    value = (raw or "").strip()
    if not value:
        return "default"
    value = value[:64]
    if not re.match(r"^[a-zA-Z0-9_-]+$", value):
        return "default"
    return value


# ----------------------------
# ROUTES
# ----------------------------

# @app.get("/")
# def health_check():
#     return {"status": "LumiX Core Online", "version": "3.0.1"}


# ----------------------------
# AUTH
# ----------------------------
@app.post("/auth/demo", response_model=schemas.Token)
@limiter.limit("30/minute")
def demo_auth(req: schemas.DemoRequest, request: Request, response: Response):
    role = (req.role or "demo").lower()
    name = "Demo Session"
    if role == "teacher":
        name = "Demo Teacher"
    elif role == "student":
        name = "Demo Student"
    elif role == "parent":
        name = "Demo Parent"
        
    access_token = auth.create_demo_access_token(role=role, name=name)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "name": name,
        "subscription_status": "demo",
        "plan": "free",
        "school_id": "demo",
    }


@app.post("/internal/dev/unlock", response_model=schemas.Token)
@app.post("/internal/dev/unlock/", response_model=schemas.Token)
@limiter.limit("5/minute")
def dev_unlock(
    req: schemas.DevUnlockRequest,
    request: Request,
    response: Response,
    x_internal_dev_secret: Optional[str] = Header(default=None, alias="X-Internal-Dev-Secret"),
):
    """
    Internal endpoint to unlock developer mode.
    Requires a valid secret and the user's email must be in the allowlist.
    """
    print(f"DEBUG: /internal/dev/unlock called with email: {req.email}")
    
    # 1. Check Secret
    expected_secret = settings.INTERNAL_DEV_UNLOCK_SECRET
    if not x_internal_dev_secret or x_internal_dev_secret != expected_secret:
        logger.warning(f"Invalid secret provided for dev unlock")
        raise HTTPException(status_code=403, detail="Invalid internal developer secret")

    # 2. Check Email Allowlist
    allowlist = [e.strip().lower() for e in settings.DEVELOPER_EMAIL_ALLOWLIST.split(",") if e.strip()]
    user_email = req.email.strip().lower()
    
    if user_email not in allowlist:
        print(f"DEBUG: Email {user_email} not in allowlist {allowlist}")
        raise HTTPException(status_code=403, detail="Email not authorized for developer access")

    print(f"DEBUG: Success! Generating dev token for {user_email}")
    return {
        "access_token": auth.create_dev_access_token(email=user_email),
        "token_type": "bearer",
        "role": "developer",
        "name": "Developer Session",
        "subscription_status": "active",
        "plan": "enterprise",
        "school_id": "default",
    }


@app.post("/register", response_model=schemas.Token)
@limiter.limit("5/minute")
def register(user: schemas.UserCreate, request: Request, response: Response, db: Session = Depends(get_db)):
    # Basic input validation
    if not validate_username(user.username):
        raise HTTPException(status_code=400, detail="Invalid username format")
    if not validate_password_strength(user.password):
        raise HTTPException(status_code=400, detail="Password does not meet security requirements")
    if user.email and not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email address")
    if user.role == "student":
        if user.grade_level is None or not (1 <= int(user.grade_level) <= 12):
            raise HTTPException(status_code=400, detail="Grade level must be between 1 and 12")
    if user.role == "admin":
        if not settings.ADMIN_INVITE_CODE or user.invite_code != settings.ADMIN_INVITE_CODE:
            raise HTTPException(status_code=403, detail="Admin registration requires valid invite code")

    # Check for existing user first
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Use transaction to ensure atomicity
    try:
        school_id = normalize_school_id(user.school_id)
        # Create new user
        new_user = models.User(
            username=user.username,
            password_hash=auth.get_password_hash(user.password),
            full_name=sanitize_input(user.name),
            role=user.role,
            school_id=school_id,
        )
        db.add(new_user)
        db.flush()  # Flush to get the ID without committing

        # Create profile if data provided
        has_profile_data = any([
            user.email, user.phone, user.grade_level is not None,
            user.class_name, user.subject, user.child_name
        ])

        if has_profile_data:
            profile = models.UserProfile(
                user_id=new_user.id,
                school_id=school_id,
                email=sanitize_input(user.email or ""),
                phone=sanitize_input(user.phone or ""),
                grade_level=user.grade_level,
                class_name=sanitize_input(user.class_name or ""),
                subject=sanitize_input(user.subject or ""),
                child_name=sanitize_input(user.child_name or "")
            )
            db.add(profile)

        # Commit both user and profile together
        db.commit()
        db.refresh(new_user)

    except Exception as e:
        # Rollback the entire transaction on any error
        db.rollback()
        if "UNIQUE constraint failed" in str(e) and "user_profiles.user_id" in str(e):
            raise HTTPException(status_code=400, detail="Profile already exists for this user")
        elif "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            # Log the actual error for debugging but return generic message
            print(f"Registration failed: {e}")
            raise HTTPException(status_code=500, detail="Registration failed due to server error")

    access_token = auth.create_access_token(
        data={
            "sub": new_user.username,
            "role": new_user.role,
            "name": new_user.full_name or new_user.username,
            "subscription_status": new_user.subscription_status,
            "plan": getattr(new_user, "plan", None),
            "school_id": getattr(new_user, "school_id", None),
            "tv": int(getattr(new_user, "token_version", 0) or 0),
        }
    )

    refresh_token = auth.create_refresh_token_jwt(new_user)
    new_user.refresh_token_hash = auth._hash_refresh_token(refresh_token)
    new_user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/auth/refresh",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "name": new_user.full_name or new_user.username,
        "subscription_status": new_user.subscription_status,
        "plan": getattr(new_user, "plan", None),
        "school_id": getattr(new_user, "school_id", None),
    }


@app.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(creds: schemas.UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    # Try username first, then try email
    user = db.query(models.User).filter(models.User.username == creds.username).first()
    
    if not user:
        # Check if username provided is actually an email in user_profiles
        profile = db.query(models.UserProfile).filter(models.UserProfile.email == creds.username).first()
        if profile:
            user = db.query(models.User).filter(models.User.id == profile.user_id).first()

    if not user or not auth.verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    is_demo_login = (getattr(user, "subscription_status", "") or "").lower() == "demo" or (getattr(user, "role", "") or "").lower() == "demo"
    if is_demo_login:
        access_token = auth.create_demo_access_token(
            sub=user.username,
            name=(getattr(user, "full_name", None) or "Demo Session"),
            school_id=(getattr(user, "school_id", None) or "demo"),
        )
    else:
        access_token = auth.create_access_token(
            data={
                "sub": user.username,
                "role": user.role,
                "name": user.full_name or user.username,
                "subscription_status": user.subscription_status,
                "plan": getattr(user, "plan", None),
                "school_id": getattr(user, "school_id", None),
                "tv": int(getattr(user, "token_version", 0) or 0),
            }
        )

    refresh_token = auth.create_refresh_token_jwt(user)
    user.refresh_token_hash = auth._hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/auth/refresh",
    )

    if is_demo_login:
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": "demo",
            "name": user.full_name or user.username,
            "subscription_status": "demo",
            "plan": "free",
            "school_id": getattr(user, "school_id", None),
        }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.full_name or user.username,
        "subscription_status": user.subscription_status,
        "plan": getattr(user, "plan", None),
        "school_id": getattr(user, "school_id", None),
    }


@app.post("/auth/refresh", response_model=schemas.Token)
@limiter.limit("30/minute")
def refresh_auth(req: schemas.RefreshRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh = (req.refresh_token or "").strip() or (request.cookies.get("refresh_token") or "").strip()
    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            raw_refresh,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience="lumios-frontend",
            issuer="lumios-api",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if payload.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not authenticated")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if getattr(user, "is_suspended", False):
        raise HTTPException(status_code=403, detail="Account suspended")

    if int(payload.get("tv") or 0) != int(getattr(user, "token_version", 0) or 0):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.refresh_token_hash or user.refresh_token_hash != auth._hash_refresh_token(raw_refresh):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.refresh_token_expires_at and user.refresh_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Not authenticated")

    access_token = auth.create_access_token(
        data={
            "sub": user.username,
            "role": user.role,
            "name": user.full_name or user.username,
            "subscription_status": user.subscription_status,
            "plan": getattr(user, "plan", None),
            "school_id": getattr(user, "school_id", None),
            "tv": int(getattr(user, "token_version", 0) or 0),
        }
    )

    new_refresh = auth.create_refresh_token_jwt(user)
    user.refresh_token_hash = auth._hash_refresh_token(new_refresh)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/auth/refresh",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.full_name or user.username,
        "subscription_status": user.subscription_status,
        "plan": getattr(user, "plan", None),
        "school_id": getattr(user, "school_id", None),
    }


@app.post("/auth/logout")
def logout_auth(response: Response, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if (getattr(current_user, "role", "") or "").lower() == "demo":
        response.delete_cookie(key="refresh_token", path="/auth/refresh")
        return {"status": "ok"}

    current_user.refresh_token_hash = None
    current_user.refresh_token_expires_at = None
    current_user.token_version = int(getattr(current_user, "token_version", 0) or 0) + 1
    db.commit()

    response.delete_cookie(key="refresh_token", path="/auth/refresh")
    return {"status": "ok"}


@app.post("/subscribe", response_model=schemas.Token)
def subscribe(sub: schemas.SubscriptionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    raise HTTPException(status_code=410, detail="Direct subscribe disabled. Use billing checkout + webhook activation.")


@app.post("/billing/checkout", response_model=schemas.CheckoutResponse)
@limiter.limit("20/minute")
def billing_checkout(req: schemas.CheckoutRequest, request: Request, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user_optional)):
    if current_user and (getattr(current_user, "role", "") or "").lower() == "demo":
        raise HTTPException(status_code=403, detail="Demo sessions cannot start billing checkout")

    plan = auth.normalize_plan(req.plan)
    if plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        import stripe  # type: ignore
    except Exception:
        stripe = None

    if not settings.STRIPE_SECRET_KEY or not stripe:
        raise HTTPException(status_code=501, detail="Billing provider not configured")

    price_map = {
        "basic": settings.STRIPE_PRICE_BASIC,
        "pro": settings.STRIPE_PRICE_PRO,
        "enterprise": settings.STRIPE_PRICE_ENTERPRISE,
    }
    price_id = price_map.get(plan, "")
    if not price_id:
        raise HTTPException(status_code=500, detail="Price not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    # Metadata for tracking
    metadata = {"plan": plan}
    if current_user:
        metadata["username"] = current_user.username
        customer_email = current_user.profile.email if current_user.profile and current_user.profile.email else None
    else:
        customer_email = None

    checkout = stripe.checkout.Session.create(
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=os.getenv("FRONTEND_URL", "http://127.0.0.1:3000") + "/app",
        cancel_url=os.getenv("FRONTEND_URL", "http://127.0.0.1:3000") + "/subscribe",
        customer_email=customer_email,
        metadata=metadata,
    )

    return {"checkout_url": checkout.url}


@app.post("/webhooks/stripe")
@limiter.exempt
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()

    try:
        import stripe  # type: ignore
    except Exception:
        stripe = None

    event = None
    event_id = None
    provider = "stripe"

    if stripe and settings.STRIPE_WEBHOOK_SECRET:
        sig = request.headers.get("stripe-signature") or ""
        try:
            event = stripe.Webhook.construct_event(raw, sig, settings.STRIPE_WEBHOOK_SECRET)
            event_id = event.get("id")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid webhook")
    else:
        secret = settings.BILLING_WEBHOOK_SECRET
        if not secret:
            raise HTTPException(status_code=501, detail="Webhook secret not configured")
        sig = request.headers.get("x-signature") or ""
        expected = hashlib.sha256((secret).encode("utf-8") + raw).hexdigest()
        if not secrets.compare_digest(sig, expected):
            raise HTTPException(status_code=400, detail="Invalid webhook")
        try:
            event = json.loads(raw.decode("utf-8"))
            event_id = event.get("id")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid webhook")

    if not event_id:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    payment_event = models.PaymentEvent(provider=provider, event_id=event_id, payload=raw.decode("utf-8", errors="ignore"))
    db.add(payment_event)
    try:
        db.commit()
        db.refresh(payment_event)
    except IntegrityError:
        db.rollback()
        return {"status": "ok"}
    except Exception:
        db.rollback()
        raise

    evt_type = event.get("type")
    obj = (event.get("data") or {}).get("object") or {}
    metadata = obj.get("metadata") or {}
    username = metadata.get("username")
    plan = auth.normalize_plan(metadata.get("plan") or metadata.get("tier") or "")

    if not username:
        payment_event.processed_at = datetime.now(timezone.utc)
        db.commit()
        return {"status": "ok"}

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        payment_event.processed_at = datetime.now(timezone.utc)
        db.commit()
        return {"status": "ok"}

    now = datetime.now(timezone.utc)
    if evt_type in ("checkout.session.completed", "invoice.paid", "customer.subscription.updated"):
        user.subscription_status = "active"
        user.plan = plan
        user.subscription_expiry = now + timedelta(days=30)
    elif evt_type in ("customer.subscription.deleted", "invoice.payment_failed"):
        user.subscription_status = "expired"
        user.subscription_expiry = now

    payment_event.processed_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok"}


# ----------------------------
# STUDENTS
# ----------------------------

allow_students_read = auth.FeatureAccess("students_read", allowed_roles=["admin", "teacher"])
allow_students_write = auth.FeatureAccess("students_read", allowed_roles=["admin"])
# allow_students_self is more permissive to allow students to see their own profile
allow_students_self = auth.FeatureAccess("students_self", allowed_roles=["student"])
allow_fees_read = auth.FeatureAccess("fees_read", allowed_roles=["admin", "parent"])
allow_transport_read = auth.FeatureAccess("transport_read")
allow_library_read = auth.FeatureAccess("library_read")
allow_nexus_upload = auth.FeatureAccess("nexus_upload", allowed_roles=["admin"])
allow_ai_chat = auth.FeatureAccess("ai_chat")
allow_ai_quiz = auth.FeatureAccess("ai_quiz")
allow_ai_tutor = auth.FeatureAccess("ai_tutor")
allow_ai_grade = auth.FeatureAccess("ai_grade", allowed_roles=["admin", "teacher"])
allow_ai_predict = auth.FeatureAccess("ai_predict", allowed_roles=["admin", "teacher"])
allow_ai_report = auth.FeatureAccess("ai_report", allowed_roles=["parent", "admin"])
allow_assignments_upload = auth.FeatureAccess("assignments_upload", allowed_roles=["teacher", "admin"])
allow_system_config = auth.FeatureAccess("system_config", allowed_roles=["admin"])

@app.get("/students/", response_model=List[schemas.StudentResponse])
def read_students(skip: int = 0, limit: int = 100,
                  db: Session = Depends(get_db),
                  current_user: models.User = Depends(allow_students_read)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    return (
        db.query(models.Student)
        .filter(models.Student.school_id == school_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.post("/students/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreate,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(allow_students_write),
                   write_guard: models.User = Depends(auth.DemoWriteGuard())):

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    db_student = models.Student(
        id=student.id,
        school_id=school_id,
        name=sanitize_input(student.name),
        grade_level=student.grade_level,
        gpa=student.gpa,
        attendance=student.attendance,
        behavior_score=student.behavior_score,
        notes=sanitize_input(student.notes),
        risk_level=student.risk_level
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@app.post("/students/self", response_model=schemas.StudentResponse)
def create_self_student(student: schemas.StudentCreate,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(allow_students_self)):

    clean_name = sanitize_input(student.name)
    if not clean_name or clean_name.lower() != (current_user.full_name or "").lower():
        raise HTTPException(status_code=400, detail="Name mismatch")

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    existing = (
        db.query(models.Student)
        .filter(models.Student.school_id == school_id, models.Student.name == clean_name)
        .first()
    )
    if existing:
        return existing

    db_student = models.Student(
        id=student.id,
        school_id=school_id,
        name=clean_name,
        grade_level=student.grade_level,
        gpa=student.gpa,
        attendance=student.attendance,
        behavior_score=student.behavior_score,
        notes=sanitize_input(student.notes),
        risk_level=student.risk_level
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@app.get("/students/self", response_model=schemas.StudentResponse)
def read_self_student(db: Session = Depends(get_db),
                      current_user: models.User = Depends(allow_students_self)):
    # The full_name in current_user is already sanitized during registration
    # We should not sanitize it again to avoid double-encoding issues (like & -> &amp; -> &amp;amp;)
    raw_name = current_user.full_name or ""
    if not raw_name:
        raise HTTPException(status_code=404, detail="Student name not set in user profile")

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    
    # Try exact match first
    student = (
        db.query(models.Student)
        .filter(models.Student.school_id == school_id, models.Student.name == raw_name)
        .first()
    )
    
    # Fallback: Try case-insensitive match if not found
    if not student:
        student = (
            db.query(models.Student)
            .filter(models.Student.school_id == school_id)
            .filter(func.lower(models.Student.name) == raw_name.lower())
            .first()
        )
        
    if not student:
        # Self-Healing: If user is a student but record is missing, auto-create a basic one
        # this prevents the 404 and allows the system to function
        if current_user.role == "student":
            new_id = f"S{int(time.time())}"
            # Try to get grade from profile if it exists
            grade = 10
            if current_user.profile and current_user.profile.grade_level:
                grade = current_user.profile.grade_level
            
            student = models.Student(
                id=new_id,
                school_id=school_id,
                name=raw_name,
                grade_level=grade,
                gpa=0.0,
                attendance=100.0,
                behavior_score=100,
                notes="Auto-generated profile",
                risk_level="Low"
            )
            db.add(student)
            db.commit()
            db.refresh(student)
        else:
            raise HTTPException(status_code=404, detail="Student record not found for this user")
            
    return student


@app.get("/students/{student_id}", response_model=schemas.StudentResponse)
def read_student(student_id: str,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(allow_students_read)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.school_id == school_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.delete("/students/{student_id}")
def delete_student(student_id: str,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(allow_students_write),
                   write_guard: models.User = Depends(auth.DemoWriteGuard())):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.school_id == school_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"status": "deleted"}


@app.get("/subscription/status")
def get_subscription_status(current_user: models.User = Depends(auth.get_current_active_user)):
    return {
        "status": current_user.subscription_status,
        "expiry": current_user.subscription_expiry,
        "role": current_user.role
    }

@app.get("/system/ai-kill-switch")
def get_ai_kill_switch(school_id: Optional[str] = None,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(allow_system_config)):
    current_school_id = normalize_school_id(getattr(current_user, "school_id", None))
    target_school_id = normalize_school_id(school_id) if school_id else current_school_id
    if target_school_id != current_school_id and not auth.is_owner(current_user):
        raise HTTPException(status_code=403, detail="Operation not permitted")

    cfg = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == target_school_id).first()
    if not cfg:
        return {"school_id": target_school_id, "enabled": True, "reason": None, "updated_at": None}
    return {
        "school_id": target_school_id,
        "enabled": bool(getattr(cfg, "ai_enabled", True)),
        "reason": getattr(cfg, "ai_disabled_reason", None),
        "updated_at": getattr(cfg, "updated_at", None),
    }


@app.get("/system/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(allow_system_config)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    logs = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.school_id == school_id)
        .order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    # Ensure created_at is handled by Pydantic (it usually is)
    return logs


@app.post("/system/ai-kill-switch")
def set_ai_kill_switch(req: schemas.AIKillSwitchRequest,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(allow_system_config),
                       write_guard: models.User = Depends(auth.DemoWriteGuard())):
    current_school_id = normalize_school_id(getattr(current_user, "school_id", None))
    target_school_id = normalize_school_id(req.school_id) if req.school_id else current_school_id
    if target_school_id != current_school_id and not auth.is_owner(current_user):
        raise HTTPException(status_code=403, detail="Operation not permitted")

    cfg = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == target_school_id).first()
    if not cfg:
        cfg = models.SchoolConfig(school_id=target_school_id)
        db.add(cfg)
        db.flush()

    cfg.ai_enabled = bool(req.enabled)
    if bool(req.enabled):
        cfg.ai_disabled_reason = None
    else:
        reason = (sanitize_input(req.reason or "") or "").strip()
        cfg.ai_disabled_reason = (reason or "AI disabled")[:500]

    cfg.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "school_id": target_school_id,
        "enabled": bool(getattr(cfg, "ai_enabled", True)),
        "reason": getattr(cfg, "ai_disabled_reason", None),
        "updated_at": getattr(cfg, "updated_at", None),
    }


# ----------------------------
# OTHER ENDPOINTS
# ----------------------------
@app.get("/fees/")
def get_fees(db: Session = Depends(get_db),
             current_user: models.User = Depends(allow_fees_read)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    q = db.query(models.FeeRecord).filter(models.FeeRecord.school_id == school_id)
    if (current_user.role or "").lower() == "parent":
        child_name = sanitize_input(getattr(current_user.profile, "child_name", "") or "") if current_user.profile else ""
        if not child_name:
            return []
        child = (
            db.query(models.Student)
            .filter(models.Student.school_id == school_id, models.Student.name == child_name)
            .first()
        )
        if not child:
            return []
        q = q.filter(models.FeeRecord.student_id == child.id)
    return q.all()


@app.get("/transport/")
def get_transport(db: Session = Depends(get_db),
                  current_user: models.User = Depends(allow_transport_read)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    return db.query(models.TransportRoute).filter(models.TransportRoute.school_id == school_id).all()


@app.get("/library/")
def get_library(db: Session = Depends(get_db),
                current_user: models.User = Depends(allow_library_read)):
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    return db.query(models.LibraryBook).filter(models.LibraryBook.school_id == school_id).all()


# ----------------------------
# NEXUS CSV UPLOAD
# ----------------------------
@app.post("/nexus/upload")
def upload_data(file: UploadFile = File(...),
                db: Session = Depends(get_db),
                current_user: models.User = Depends(allow_nexus_upload),
                write_guard: models.User = Depends(auth.DemoWriteGuard())):

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    MAX_FILE_SIZE = 10 * 1024 * 1024
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        contents = file.file.read()
        decoded = contents.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    records_processed = 0
    records_failed = 0
    errors = []
    BATCH_LIMIT = 500

    for i, row in enumerate(reader):
        if records_processed + records_failed >= BATCH_LIMIT:
            break

        try:
            # Student
            if 'gpa' in row:
                sanitized_name = sanitize_input(row.get('name', ''))
                if not sanitized_name:
                    raise ValueError("Missing student name")

                if not db.query(models.Student).filter(models.Student.school_id == school_id, models.Student.name == sanitized_name).first():
                    try:
                        gpa = float(row.get('gpa', 0.0))
                        grade_level = int(row.get('grade_level', 9))
                        attendance = float(row.get('attendance', 0.0))
                        behavior = int(row.get('behavior_score', 100))
                    except ValueError:
                        raise ValueError("Invalid numeric data for student stats")

                    s = models.Student(
                        id=f"s{int(time.time()*1000)}_{i}",
                        school_id=school_id,
                        name=sanitized_name,
                        grade_level=grade_level,
                        gpa=gpa,
                        attendance=attendance,
                        behavior_score=behavior,
                        notes=sanitize_input(row.get('notes', '')),
                        risk_level="High" if gpa < 2.0 else "Low",
                    )
                    db.add(s)
                    records_processed += 1

            # Fee
            elif 'amount' in row:
                student_name = sanitize_input(row.get('student_name', 'Unknown'))
                try:
                    amount = float(row['amount'])
                except ValueError:
                    raise ValueError("Invalid fee amount")

                student = db.query(models.Student).filter(models.Student.school_id == school_id, models.Student.name == student_name).first()
                student_id = student.id if student else None

                f = models.FeeRecord(
                    id=f"f{int(time.time()*1000)}_{i}",
                    school_id=school_id,
                    student_id=student_id,
                    student_name=student_name,
                    amount=amount,
                    due_date=sanitize_input(row.get('due_date', '2024-01-01')),
                    status=sanitize_input(row.get('status', 'Pending')),
                    type=sanitize_input(row.get('type', 'Tuition'))
                )
                db.add(f)
                records_processed += 1

            # Transport
            elif 'route' in row:
                try:
                    fuel = int(row.get('fuel', 100))
                except ValueError:
                    raise ValueError("Invalid fuel level")

                t = models.TransportRoute(
                    id=f"t{int(time.time()*1000)}_{i}",
                    school_id=school_id,
                    route_name=sanitize_input(row.get('route', '')),
                    driver_name=sanitize_input(row.get('driver', 'Unknown')),
                    status="Active",
                    fuel_level=fuel,
                    license_plate=sanitize_input(row.get('license_plate', 'LX-2024'))
                )
                db.add(t)
                records_processed += 1

            else:
                # Skip unknown row type
                continue

        except Exception as e:
            records_failed += 1
            errors.append(f"Row {i+1}: {str(e)}")
            # Continue to next row

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")

    return {
        "status": "success",
        "processed": records_processed,
        "failed": records_failed,
        "errors": errors[:10]  # Limit error details
    }


# ----------------------------
# AI MODULES
# ----------------------------
def _redact_prompt(text: str) -> str:
    s = sanitize_input(text or "")
    s = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[email]", s)
    s = re.sub(r"\+?\d[\d\s().-]{7,}\d", "[phone]", s)
    s = re.sub(r"\b\d{3,}\b", "[num]", s)
    return s[:1500]


def _hash_text(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def _effective_plan(user: models.User) -> str:
    return auth.effective_plan(user)


@app.get("/school/config", response_model=schemas.SchoolConfigResponse)
async def get_school_config(db: Session = Depends(get_db),
                            current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns the branding and configuration for the current school.
    """
    school_id = normalize_school_id(getattr(current_user, "school_id", "default"))
    config = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == school_id).first()
    
    if not config:
        # Create default if not exists
        config = models.SchoolConfig(
            school_id=school_id,
            name="LumiX Academy",
            motto="Inspired Learning. Bold Futures.",
            primary_color="#06b6d4",
            secondary_color="#6366f1",
            security_level="standard",
            ai_creativity=50,
            ai_enabled=True
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    
    # Ensure no nulls for critical branding fields
    if not config.name: config.name = "LumiX Academy"
    if not config.motto: config.motto = "Inspired Learning. Bold Futures."
    if not config.primary_color: config.primary_color = "#06b6d4"
    if not config.secondary_color: config.secondary_color = "#6366f1"
    
    return config

@app.post("/school/config", response_model=schemas.SchoolConfigResponse)
async def update_school_config(req: schemas.SchoolConfigUpdate,
                               db: Session = Depends(get_db),
                               current_user: models.User = Depends(allow_system_config)):
    """
    Updates the school identity matrix and core settings.
    Requires System Config clearance.
    """
    school_id = normalize_school_id(getattr(current_user, "school_id", "default"))
    config = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == school_id).first()
    
    if not config:
        config = models.SchoolConfig(school_id=school_id)
        db.add(config)
    
    # Update fields
    if req.name is not None: config.name = req.name
    if req.motto is not None: config.motto = req.motto
    if req.primary_color is not None: config.primary_color = req.primary_color
    if req.secondary_color is not None: config.secondary_color = req.secondary_color
    if req.logo_url is not None: config.logo_url = req.logo_url
    if req.website_context is not None: config.website_context = req.website_context
    if req.modules_json is not None: config.modules_json = req.modules_json
    if req.security_level is not None: config.security_level = req.security_level
    if req.ai_creativity is not None: config.ai_creativity = req.ai_creativity
    
    config.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(config)
    return config


@app.post("/ai/analyze-url")
@limiter.limit("5/minute")
async def analyze_url(req: schemas.URLAnalysisRequest, request: Request,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(allow_system_config)):
    """
    Neural Crawler: Analyzes a school website to extract brand identity.
    Uses Gemini-3-Flash-Preview to perform 'virtual crawling' and synthesis.
    """
    started = time.time()
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=_effective_plan(current_user),
        endpoint=request.url.path,
        request_type="url_analysis",
        prompt_redacted=f"URL: {req.url}",
        success=False,
    )
    db.add(log_row)
    
    try:
        # REAL CRAWLER: Fetch the website content
        site_content = ""
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                }
                response = await client.get(req.url, headers=headers)
                if response.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.text, "html.parser")
                    
                    # Remove noise
                    for element in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
                        element.decompose()
                        
                    # Extract cleaned text
                    site_content = soup.get_text(separator=" ", strip=True)
                    site_content = re.sub(r'\s+', ' ', site_content)[:10000] # Limit to 10k chars
        except Exception as crawl_err:
            print(f"Crawl failed for {req.url}: {crawl_err}")
            # We continue even if crawl fails, Gemini might still have info in its training data

        site_snippet = f"RAW HTML SNIPPET FROM SITE:\n{site_content}\n" if site_content else "Note: Live crawling was blocked. Use your internal knowledge base if available."
        
        try:
            brand_data = await ai_service.analyze_url(req.url, site_snippet)
        except Exception as e:
            logger.error(f"AI Analyze URL Error: {e}")
            raise HTTPException(status_code=502, detail="AI provider error")
        
        if "error" in brand_data:
            raise HTTPException(status_code=502, detail=brand_data["error"])

        # Post-process: Ensure logoUrl is absolute
        logo_url = brand_data.get("logoUrl", "")
        if logo_url and not logo_url.startswith("http"):
            from urllib.parse import urljoin
            brand_data["logoUrl"] = urljoin(req.url, logo_url)

        log_row.success = True
        return brand_data

    except Exception as e:
        log_row.error_type = type(e).__name__
        log_row.error_message = str(e)
        print(f"CRAWLER ERROR: {e}")
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        log_row.duration_ms = int((time.time() - started) * 1000)
        db.commit()


@app.get("/proxy-image")
async def proxy_image(url: str):
    """
    Proxies an image URL to bypass CORS/CORB/ORB restrictions.
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=15.0, headers=headers, verify=False) as client:
            resp = await client.get(url, follow_redirects=True)
            
            if resp.status_code != 200:
                print(f"Proxy Upstream Error: {resp.status_code} for {url}")
                raise HTTPException(status_code=404, detail=f"Image not found (Upstream {resp.status_code})")
                
            content_type = resp.headers.get("content-type", "application/octet-stream")
            
            # Basic security check: ensure it's an image
            if not content_type.startswith("image/"):
                # Special case for SVGs that might have text/xml type
                if "svg" not in content_type and "xml" not in content_type:
                     raise HTTPException(status_code=400, detail=f"Target is not an image ({content_type})")
            
            return Response(content=resp.content, media_type=content_type)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")


@app.post("/db/test-connection")
async def test_db_connection(req: schemas.DbTestRequest, current_user: models.User = Depends(auth.get_current_user)):
    """
    Attempts to connect to a database with the provided connection string.
    Only authenticated users can test connections.
    """
    try:
        from sqlalchemy import create_engine, text
        # Use a short timeout for the test
        # Note: In production, you'd want to validate the connection string format
        # and potentially restrict which protocols are allowed.
        connect_args = {}
        if req.connection_string.startswith("postgresql"):
            connect_args["connect_timeout"] = 5
        elif req.connection_string.startswith("sqlite"):
            connect_args["timeout"] = 5
            
        engine = create_engine(req.connection_string, connect_args=connect_args)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "success", "message": "Neural link to database established."}
    except Exception as e:
        logger.error(f"DB Test Connection error: {e}")
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": f"Connection failed: {str(e)}"}
        )


@app.post("/ai/chat", response_model=schemas.ChatResponse)
@limiter.limit("10/minute")
async def ai_chat_proxy(req: schemas.ChatRequest, request: Request,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(allow_ai_chat)):

    started = time.time()
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=_effective_plan(current_user),
        endpoint=request.url.path,
        request_type="chat",
        prompt_redacted=_redact_prompt(req.prompt),
        input_refs=None,
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        try:
            text = await ai_service.chat(req.prompt, req.context)
        except Exception as e:
            logger.error(f"AI Chat Error: {e}")
            raise HTTPException(status_code=502, detail="AI provider error")

        if not (text or "").strip():
            text = "I'm processing your request, but my neural link is slightly jittery. Please rephrase or try again."
        
        log_row.output_hash = _hash_text(text)
        log_row.output_len = len(text)
        log_row.success = True
        return {"response": text}
    except HTTPException as e:
        log_row.error_type = f"http_{e.status_code}"
        log_row.error_message = str(e.detail)
        raise
    except Exception as e:
        print(f"DEBUG AI CHAT OUTER ERROR: {e}")
        log_row.error_type = type(e).__name__
        log_row.error_message = str(e)
        raise HTTPException(status_code=502, detail="AI provider error")
    finally:
        log_row.duration_ms = int((time.time() - started) * 1000)
        try:
            db.commit()
        except Exception:
            db.rollback()


# --- GENESIS ENGINE SPECIALIZED ROUTES ---

@app.post("/ai/genesis/syllabus")
@limiter.limit("5/minute")
async def genesis_syllabus(req: schemas.GenesisSyllabusRequest, 
                           request: Request,
                           db: Session = Depends(get_db),
                           current_user: models.User = Depends(allow_ai_chat)):
    try:
        data = await ai_service.generate_syllabus(req.topic, req.grade, req.weeks)
        # Ensure we return the 'weeks' list from the object
        if isinstance(data, dict) and "weeks" in data:
            return {"response": json.dumps(data["weeks"])}
        return {"response": json.dumps(data)}
    except Exception as e:
        logger.error(f"Syllabus generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/genesis/flashcards")
@limiter.limit("5/minute")
async def genesis_flashcards(req: schemas.GenesisFlashcardsRequest, 
                             request: Request,
                             db: Session = Depends(get_db),
                             current_user: models.User = Depends(allow_ai_chat)):
    try:
        data = await ai_service.generate_flashcards(req.topic, req.count)
        return {"response": json.dumps(data)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/ai/genesis/quiz")
@limiter.limit("5/minute")
async def genesis_quiz(req: schemas.GenesisQuizRequest, 
                       request: Request,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(allow_ai_chat)):
    try:
        data = await ai_service.generate_quiz(req.topic, req.count)
        return {"response": json.dumps(data)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/ai/landing-chat", response_model=schemas.ChatResponse)
@limiter.limit("10/minute")
async def ai_landing_chat_proxy(req: schemas.ChatRequest, request: Request, db: Session = Depends(get_db)):
    """
    Public AI Endpoint for Landing Page Chatbot.
    Now powered by OpenAI with dedicated service.
    Includes rate limiting and basic security checks.
    """
    # Simple Origin Check for basic security (can be spoofed but good as a first layer)
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    
    # In production, you might want to restrict this to your actual domains
    # for now, we allow localhost/127.0.0.1 as per CORS settings
    
    started = time.time()
    
    # Use a dummy AIRequestLog for logging if user is not authenticated/known
    # We skip full DB logging for this public endpoint to avoid spam filling up the DB
    # or wrap it in a try/except block.
    
    try:
        # Convert history from Pydantic models to dicts for OpenAI
        history_dicts = []
        if req.history:
            history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

        # Call the dedicated AI service
        result = await ai_service.generate_landing_chat_response(
            prompt=req.prompt,
            history=history_dicts,
            language=req.language or "en"
        )

        text = result.get("response", "My neural link is currently unstable.")
        
        return {"response": text}

    except Exception as e:
        logger.error(f"DEBUG LANDING CHAT ERROR: {e}")
        return {"response": "My neural link is currently unstable. Please try again later."}

@app.post("/ai/crawler", response_model=schemas.CrawlerResponse)
@limiter.limit("5/minute")
async def school_crawler(req: schemas.CrawlerRequest, request: Request,
                         db: Session = Depends(database.get_db),
                         current_user: models.User = Depends(auth.get_current_user)):
    """
    Neural Web Crawler for School Websites.
    Performs deep crawling and intelligent extraction of school data.
    """
    try:
        # We use current_user to ensure only authenticated users can trigger this expensive operation
        result = await crawler_service.crawl(req.url, req.max_depth)
        return result
    except Exception as e:
        logger.error(f"Crawler endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/predict")
@limiter.limit("10/minute")
async def ai_predict_proxy(student: schemas.StudentCreate, request: Request,
                           db: Session = Depends(get_db),
                           current_user: models.User = Depends(auth.get_current_user)):

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    started = time.time()
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=auth.effective_plan(current_user),
        endpoint=request.url.path,
        request_type="predict",
        prompt_redacted=None,
        input_refs=f"student_id={sanitize_input(getattr(student, 'id', '') or '')}"[:200],
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        student_data = {
            "name": sanitize_input(student.name),
            "gpa": student.gpa,
            "attendance": student.attendance,
            "behavior_score": student.behavior_score
        }

        try:
            text = await ai_service.predict_performance(student_data)
        except Exception as e:
            logger.error(f"AI Predict Error: {e}")
            raise HTTPException(status_code=502, detail="AI provider error")
        
        if not text:
            raise HTTPException(status_code=502, detail="AI returned empty response")

        log_row.output_hash = hashlib.sha256(text.encode()).hexdigest()
        log_row.output_len = len(text)
        log_row.success = True
        return {"result": text}
    except HTTPException as e:
        log_row.error_type = f"http_{e.status_code}"
        log_row.error_message = str(e.detail)
        raise
    except Exception as e:
        log_row.error_type = type(e).__name__
        log_row.error_message = str(e)
        raise HTTPException(status_code=502, detail="AI provider error")
    finally:
        log_row.duration_ms = int((time.time() - started) * 1000)
        try:
            db.commit()
        except Exception:
            db.rollback()


@app.post("/ai/analyze-reference", response_model=schemas.ReferenceAnalysisResponse)
@limiter.limit("5/minute")
async def analyze_reference(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_ai_grade)
):
    """
    AI Vision Reference Analysis Endpoint.
    Analyzes an answer key or rubric image/document.
    """
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    started = time.time()
    
    # Validation
    allowed_types = ["image/jpeg", "image/png", "application/pdf", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported.")
    
    content = await file.read()
    
    try:
        if file.content_type == "text/plain":
            text_content = content.decode("utf-8")
            result = await ai_service.analyze_reference_material(text_content, mime_type="text/plain")
        else:
            # For images/PDFs
            result = await ai_service.analyze_reference_material(content, mime_type=file.content_type)
            
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
            
        return result
        
    except Exception as e:
        logger.error(f"Reference Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/grade", response_model=schemas.GradingResult)
@limiter.limit("5/minute")
async def ai_grade(
    file: UploadFile = File(...),
    context: str = Form(""),
    reference_data: Optional[str] = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_ai_grade)
):
    """
    AI Vision Grading Endpoint.
    Accepts an image/document and returns a grading report.
    """
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    started = time.time()
    
    # Validation
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported. Use JPG, PNG, or PDF.")
    
    # Max size 10MB
    max_size = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Parse reference data
    ref_data_dict = None
    if reference_data:
        try:
            ref_data_dict = json.loads(reference_data)
        except Exception:
            pass

    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=_effective_plan(current_user),
        endpoint=request.url.path,
        request_type="vision_grading",
        prompt_redacted=sanitize_input(context)[:500],
        input_refs=f"filename={sanitize_input(file.filename)}",
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        # Save file locally (simulating cloud storage)
        upload_dir = os.path.join(os.getcwd(), "uploads", school_id)
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{int(time.time())}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Process with AI
        result = await ai_service.process_vision_grading(
            image_data=content,
            mime_type=file.content_type,
            context=context,
            reference_data=ref_data_dict
        )

        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])

        log_row.success = True
        log_row.output_hash = _hash_text(json.dumps(result))
        log_row.duration_ms = int((time.time() - started) * 1000)
        db.commit()

        return result

    except Exception as e:
        log_row.success = False
        log_row.error_type = str(type(e).__name__)
        log_row.error_message = str(e)
        log_row.duration_ms = int((time.time() - started) * 1000)
        db.commit()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/quiz")
@limiter.limit("10/minute")
async def ai_quiz_proxy(req: schemas.QuizRequest, request: Request,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(auth.get_current_user)):

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    safe_topic = sanitize_input(req.topic)
    started = time.time()
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=auth.effective_plan(current_user),
        endpoint=request.url.path,
        request_type="quiz",
        prompt_redacted=f"topic={safe_topic}; difficulty={sanitize_input(req.difficulty)}",
        input_refs=None,
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        try:
            data = await ai_service.generate_quiz(safe_topic, count=5)
            text = json.dumps(data)
        except Exception as e:
            logger.error(f"AI Quiz Error: {e}")
            raise HTTPException(status_code=502, detail="AI provider error")
            
        if not text.strip():
            raise HTTPException(status_code=502, detail="AI returned empty response")

        log_row.output_hash = hashlib.sha256(text.encode()).hexdigest()
        log_row.output_len = len(text)
        log_row.success = True
        return {"response": text}
    except HTTPException as e:
        log_row.error_type = f"http_{e.status_code}"
        log_row.error_message = str(e.detail)
        raise
    except Exception as e:
        log_row.error_type = type(e).__name__
        log_row.error_message = str(e)
        raise HTTPException(status_code=502, detail="AI provider error")
    finally:
        log_row.duration_ms = int((time.time() - started) * 1000)
        try:
            db.commit()
        except Exception:
            db.rollback()


@app.post("/ai/solve-problem")
@limiter.limit("10/minute")
async def ai_solve_problem(req: schemas.SolveProblemRequest, request: Request,
                          db: Session = Depends(get_db),
                          current_user: models.User = Depends(allow_ai_tutor)):
    """
    Neural Tutor: Solves educational problems with step-by-step verification.
    """
    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    started = time.time()
    
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=_effective_plan(current_user),
        endpoint=request.url.path,
        request_type="problem_solver",
        prompt_redacted=_redact_prompt(f"subject={req.subject}; topic={req.topic}; difficulty={req.difficulty}"),
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not initialized")

        cfg = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == school_id).first()
        if cfg and not bool(getattr(cfg, "ai_enabled", True)):
            raise HTTPException(status_code=403, detail=(getattr(cfg, "ai_disabled_reason", None) or "AI disabled"))

        result = await ai_service.solve_educational_problem(
            req.subject, req.topic, req.difficulty, req.grade, req.problem
        )
        
        if "error" in result:
            log_row.error_type = "AIServiceError"
            log_row.error_message = result["error"]
            raise HTTPException(status_code=500, detail=result["error"])

        log_row.success = True
        log_row.duration_ms = int((time.time() - started) * 1000)
        db.commit()
        
        return result

    except Exception as e:
        db.rollback()
        logger.error(f"Solver Error: {e}")
        
        # Log the error details
        log_row.success = False
        log_row.error_type = type(e).__name__
        log_row.error_message = str(e)
        log_row.duration_ms = int((time.time() - started) * 1000)
        db.commit()

        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Neural link failure: {str(e)}")


@app.post("/ai/report")
@limiter.limit("10/minute")
async def ai_report_proxy(req: schemas.ReportRequest, request: Request,
                          db: Session = Depends(get_db),
                          current_user: models.User = Depends(allow_ai_report)):

    school_id = normalize_school_id(getattr(current_user, "school_id", None))
    started = time.time()
    log_row = models.AIRequestLog(
        user_id=getattr(current_user, "id", None),
        school_id=school_id,
        role=getattr(current_user, "role", None),
        plan=_effective_plan(current_user),
        endpoint=request.url.path,
        request_type="report",
        prompt_redacted=None,
        input_refs=f"student_id={sanitize_input(req.student_id)}"[:200],
        success=False,
    )
    db.add(log_row)
    db.flush()

    try:
        cfg = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == school_id).first()
        if cfg and not bool(getattr(cfg, "ai_enabled", True)):
            raise HTTPException(status_code=403, detail=(getattr(cfg, "ai_disabled_reason", None) or "AI disabled"))

        q = db.query(models.Student).filter(models.Student.id == req.student_id, models.Student.school_id == school_id)
        if (current_user.role or "").lower() == "parent":
            child_name = sanitize_input(getattr(current_user.profile, "child_name", "") or "") if current_user.profile else ""
            if not child_name:
                raise HTTPException(status_code=404, detail="Student not found")
            q = q.filter(models.Student.name == child_name)

        student = q.first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        student_data = {
            "name": student.name,
            "gpa": student.gpa,
            "attendance": student.attendance,
            "behavior_score": student.behavior_score,
            "notes": sanitize_input(student.notes)
        }

        try:
            text = await ai_service.generate_report(student_data)
        except Exception as e:
            logger.error(f"AI Report Error: {e}")
            raise HTTPException(status_code=502, detail="AI provider error")
            
        if not text.strip() or "failed" in text.lower():
            raise HTTPException(status_code=502, detail="AI returned empty or failed response")

        log_row.output_hash = _hash_text(text)
        log_row.output_len = len(text)
        log_row.success = True
        return {"response": text}

    except HTTPException as e:
        log_row.error_type = f"http_{e.status_code}"
        raise
    except Exception as e:
        log_row.error_type = type(e).__name__
        raise HTTPException(status_code=502, detail="AI provider error")
    finally:
        log_row.duration_ms = int((time.time() - started) * 1000)
        try:
            db.commit()
        except Exception:
            db.rollback()


# ----------------------------
# ASSIGNMENT UPLOAD (Teacher/Admin)
# ----------------------------
@app.post("/assignments/upload")
def upload_assignment(file: UploadFile = File(...),
                      request: Request = None,
                      db: Session = Depends(get_db),
                      current_user: models.User = Depends(allow_assignments_upload),
                      write_guard: models.User = Depends(auth.DemoWriteGuard())):
    MAX_FILE_SIZE = 20 * 1024 * 1024
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    filename = os.path.basename(file.filename or "assignment")
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    upload_dir = os.path.join("data", "uploads", "assignments")
    os.makedirs(upload_dir, exist_ok=True)
    stored_path = os.path.join(upload_dir, f"{int(time.time()*1000)}_{safe_name}")

    contents = file.file.read()
    with open(stored_path, "wb") as f:
        f.write(contents)

    content_type = file.content_type or "application/octet-stream"
    vision_summary = None
    if ai_service.gemini_available and content_type.startswith("image/"):
        try:
            # Basic prompt for vision analysis
            vision_summary = "Analysis pending"
        except Exception:
            vision_summary = None

    result = {
        "status": "stored",
        "filename": safe_name,
        "bytes": size,
        "path": stored_path.replace("\\", "/"),
        "content_type": content_type,
        "vision_summary": vision_summary
    }

    return result
