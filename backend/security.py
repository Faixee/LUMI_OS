"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
import re
import html
from .config import settings

# Input validation and sanitization
def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = html.escape(input_string)
    
    # Remove SQL injection patterns
    sql_patterns = [
        r'(?i)select.*from',
        r'(?i)insert.*into',
        r'(?i)update.*set',
        r'(?i)delete.*from',
        r'(?i)drop.*table',
        r'(?i)union.*select',
        r'(?i)--',
        r'(?i);',
        r'(?i)/\*',
        r'(?i)\*/'
    ]
    
    for pattern in sql_patterns:
        sanitized = re.sub(pattern, '', sanitized)
    
    return sanitized.strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_password_strength(password: str) -> bool:
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True

def validate_username(username: str) -> bool:
    """Validate username format"""
    if len(username) < 3 or len(username) > 20:
        return False
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False
    return True

# Security headers middleware
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Add security headers
    for header, value in settings.SECURITY_HEADERS.items():
        response.headers[header] = value
    
    # Additional security headers
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response

# Rate limiting error handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom rate limit exceeded handler"""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
        headers={"Retry-After": str(exc.retry_after)}
    )

# Request validation
def validate_request_size(request: Request):
    """Validate request size to prevent DoS attacks"""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 1000000:  # 1MB limit
        raise HTTPException(status_code=413, detail="Request too large")

# CSRF protection (simplified version)
def validate_csrf_token(request: Request):
    """Basic CSRF token validation"""
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            # In a real implementation, you'd validate CSRF tokens here
            # For now, we'll just check for presence of Origin/Referer headers
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            
            if not origin and not referer:
                # This could be a CSRF attack
                raise HTTPException(status_code=403, detail="CSRF validation failed")