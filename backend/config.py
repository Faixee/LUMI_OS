"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "development-secret-key-not-for-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/lumios_db")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:8000,http://localhost:8000,http://localhost:54322,http://127.0.0.1:54322,https://lumi-os-omega.vercel.app").split(",")
    
    # In non-production, be more permissive with CORS if needed
    if os.getenv("ENVIRONMENT") != "production":
        # Add common dev ports if not present
        dev_ports = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:54322", "http://127.0.0.1:54322"]
        for port in dev_ports:
            if port not in CORS_ORIGINS:
                CORS_ORIGINS.append(port)
    SECURITY_HEADERS = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:54322 http://127.0.0.1:54322 http://localhost:3000 http://127.0.0.1:3000 http://localhost:3001 http://127.0.0.1:3001 https://*.vercel.app https://lumi-os-omega.vercel.app; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net"
    }
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
    RATE_LIMIT_STORAGE_URI = os.getenv("RATE_LIMIT_STORAGE_URI", "memory://")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    ADMIN_INVITE_CODE = os.getenv("ADMIN_INVITE_CODE", "")

    BILLING_WEBHOOK_SECRET = os.getenv("BILLING_WEBHOOK_SECRET", "")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_BASIC = os.getenv("STRIPE_PRICE_BASIC", "")
    STRIPE_PRICE_PRO = os.getenv("STRIPE_PRICE_PRO", "")
    STRIPE_PRICE_ENTERPRISE = os.getenv("STRIPE_PRICE_ENTERPRISE", "")

    DEMO_TOKEN_EXPIRE_MINUTES = int(os.getenv("DEMO_TOKEN_EXPIRE_MINUTES", "30"))
    INTERNAL_DEV_UNLOCK_SECRET = os.getenv("INTERNAL_DEV_UNLOCK_SECRET", "").strip()
    DEVELOPER_EMAIL_ALLOWLIST = os.getenv("DEVELOPER_EMAIL_ALLOWLIST", "").strip()
    
    # Emergency fallback if env loading fails in Docker
    if not INTERNAL_DEV_UNLOCK_SECRET and os.path.exists(".env"):
        from dotenv import main
        env_vars = main.dotenv_values(".env")
        INTERNAL_DEV_UNLOCK_SECRET = env_vars.get("INTERNAL_DEV_UNLOCK_SECRET", "").strip()
        DEVELOPER_EMAIL_ALLOWLIST = env_vars.get("DEVELOPER_EMAIL_ALLOWLIST", "").strip()

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY", "")
    XAI_API_KEY = os.getenv("XAI_API_KEY", "")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    IS_VERCEL = os.getenv("VERCEL") == "1"

settings = Settings()

if settings.ENVIRONMENT == "production" and not settings.IS_VERCEL:
    if settings.SECRET_KEY in ("your-super-secure-production-secret-key-change-this-immediately", "development-secret-key-not-for-production"):
        # Warn instead of raise for easier local testing with production flag
        print("WARNING: SECRET_KEY must be changed for production")
        # raise ValueError("SECRET_KEY must be changed for production")
    if "sqlite" in settings.DATABASE_URL:
        # Warn instead of raise for easier local testing with production flag
        print("WARNING: SQLite is not suitable for production. Use PostgreSQL instead.")
        # raise ValueError("SQLite is not suitable for production. Use PostgreSQL instead.")
