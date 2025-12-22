from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String, default="student")  # admin, teacher, student, parent
    school_id = Column(String, default="default", index=True)
    subscription_status = Column(String, default="demo") # demo, active, expired
    subscription_expiry = Column(DateTime, nullable=True)
    plan = Column(String, nullable=True)
    is_suspended = Column(Boolean, default=False)

    token_version = Column(Integer, default=0)
    refresh_token_hash = Column(String, nullable=True)
    refresh_token_expires_at = Column(DateTime, nullable=True)

    profile = relationship("UserProfile", uselist=False, back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    school_id = Column(String, nullable=True, index=True)
    ip = Column(String, nullable=True)
    method = Column(String, nullable=True)
    path = Column(String, nullable=True)
    status_code = Column(Integer, nullable=True)
    user_agent = Column(String, nullable=True)
    request_id = Column(String, nullable=True, index=True)


class UsageCounter(Base):
    __tablename__ = "usage_counters"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    period = Column(String, index=True)  # YYYY-MM-DD
    feature = Column(String, index=True)
    count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "period", "feature", name="uq_usage_user_period_feature"),)


class PaymentEvent(Base):
    __tablename__ = "payment_events"
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, index=True)
    event_id = Column(String, index=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    payload = Column(Text, nullable=True)

    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_payment_provider_event"),)


class SchoolConfig(Base):
    __tablename__ = "school_config"
    school_id = Column(String, primary_key=True, index=True)
    ai_enabled = Column(Boolean, default=True)
    ai_disabled_reason = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class AIRequestLog(Base):
    __tablename__ = "ai_request_logs"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    school_id = Column(String, nullable=True, index=True)
    role = Column(String, nullable=True, index=True)
    plan = Column(String, nullable=True, index=True)
    endpoint = Column(String, nullable=True, index=True)
    request_type = Column(String, nullable=True, index=True)
    prompt_redacted = Column(Text, nullable=True)
    input_refs = Column(String, nullable=True)
    output_hash = Column(String, nullable=True, index=True)
    output_len = Column(Integer, nullable=True)
    success = Column(Boolean, default=False, index=True)
    error_type = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    school_id = Column(String, default="default", index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    grade_level = Column(Integer, nullable=True)
    class_name = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    child_name = Column(String, nullable=True)
    user = relationship("User", back_populates="profile")

class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, default="default", index=True)
    name = Column(String, index=True)
    grade_level = Column(Integer)
    gpa = Column(Float, default=0.0)
    attendance = Column(Float, default=100.0)
    behavior_score = Column(Integer, default=100)
    notes = Column(Text, default="")
    risk_level = Column(String, default="Low") # Low, Medium, High
    
    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    
    fees = relationship("FeeRecord", back_populates="student")

class FeeRecord(Base):
    __tablename__ = "fees"
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, default="default", index=True)
    student_id = Column(String, ForeignKey("students.id"))
    student_name = Column(String)
    amount = Column(Float)
    due_date = Column(String)
    status = Column(String, default="Pending") # Paid, Pending, Overdue
    type = Column(String, default="Tuition")

    student = relationship("Student", back_populates="fees")

class TransportRoute(Base):
    __tablename__ = "transport"
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, default="default", index=True)
    route_name = Column(String)
    driver_name = Column(String)
    status = Column(String) # Active, Maintenance
    fuel_level = Column(Integer)
    license_plate = Column(String)

class LibraryBook(Base):
    __tablename__ = "library"
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, default="default", index=True)
    title = Column(String)
    author = Column(String)
    category = Column(String)
    status = Column(String, default="Available") # Available, Checked Out
