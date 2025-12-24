from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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

class GradingResult(BaseModel):
    student: str
    score: int
    feedback: str
    annotations: Optional[List[Dict[str, Any]]] = []
    insights: Optional[Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    prompt: str
    role: str = "system"
    context: str = ""
    history: Optional[List[ChatMessage]] = []
    language: Optional[str] = "en" # Added for multi-language support

class URLAnalysisRequest(BaseModel):
    url: str

class ChatResponse(BaseModel):
    response: str

class GenesisSyllabusRequest(BaseModel):
    topic: str
    grade: str
    weeks: int

class GenesisFlashcardsRequest(BaseModel):
    topic: str
    count: int = 10

class CrawlerRequest(BaseModel):
    url: str
    max_depth: Optional[int] = 2

class CrawlerResponse(BaseModel):
    school_name: str
    designation: str # Primary target
    motto: Optional[str] = None
    educational_focus: Optional[str] = None
    secondary_programs: Optional[List[str]] = []
    other_info: Optional[Dict[str, Any]] = {}
    status: str
    errors: Optional[List[str]] = []

class GenesisQuizRequest(BaseModel):
    topic: str
    count: int = 5

class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class ReportRequest(BaseModel):
    student_id: str


class AIKillSwitchRequest(BaseModel):
    school_id: Optional[str] = None
    enabled: bool
    reason: Optional[str] = None

class SchoolConfigUpdate(BaseModel):
    name: Optional[str] = None
    motto: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_url: Optional[str] = None
    website_context: Optional[str] = None
    modules_json: Optional[str] = None # Expecting a JSON string
    security_level: Optional[str] = "standard"
    ai_creativity: Optional[int] = 50

class SchoolConfigResponse(BaseModel):
    school_id: str
    name: Optional[str] = None
    motto: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_url: Optional[str] = None
    website_context: Optional[str] = None
    modules_json: Optional[str] = None
    security_level: str
    ai_creativity: int
    ai_enabled: bool
    updated_at: datetime

    class Config:
        from_attributes = True

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
