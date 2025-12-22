from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- AUTH ---
class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str
    school_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    grade_level: Optional[int] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    child_name: Optional[str] = None
    invite_code: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class DemoRequest(BaseModel):
    role: Optional[str] = "demo"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    subscription_status: str = "demo"
    plan: Optional[str] = None
    school_id: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    plan: str # monthly | yearly | enterprise (also accepts legacy plan names)


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str

# --- INTERNAL ---
class DevUnlockRequest(BaseModel):
    email: str

# --- STUDENT ---
class StudentCreate(BaseModel):
    id: str
    name: str
    grade_level: int
    gpa: float = 0.0
    attendance: float = 100.0
    behavior_score: int = 100
    notes: str = ""
    risk_level: str = "Low"

class StudentResponse(StudentCreate):
    xp: int = 0
    level: int = 1
    class Config:
        from_attributes = True

# --- AI PROXY ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    role: str = "system"
    context: str = ""
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str

class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class ReportRequest(BaseModel):
    student_id: str


class AIKillSwitchRequest(BaseModel):
    school_id: Optional[str] = None
    enabled: bool
    reason: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    user_id: Optional[int]
    school_id: Optional[str]
    ip: Optional[str]
    method: Optional[str]
    path: Optional[str]
    status_code: Optional[int]
    user_agent: Optional[str]

    class Config:
        from_attributes = True
