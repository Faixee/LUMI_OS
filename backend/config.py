import os
from dotenv import load_dotenv

load_dotenv()

print(f"DEBUG CONFIG: SECRET_KEY first 5 chars: {os.getenv('SECRET_KEY')[:5] if os.getenv('SECRET_KEY') else 'None'}")

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "development-secret-key-not-for-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/lumios_db")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
    SECURITY_HEADERS = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net"
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
    INTERNAL_DEV_UNLOCK_SECRET = os.getenv("INTERNAL_DEV_UNLOCK_SECRET", "")
    DEVELOPER_EMAIL_ALLOWLIST = os.getenv("DEVELOPER_EMAIL_ALLOWLIST", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("API_KEY", "")

settings = Settings()

if settings.ENVIRONMENT == "production":
    if settings.SECRET_KEY in ("your-super-secure-production-secret-key-change-this-immediately", "development-secret-key-not-for-production"):
        raise ValueError("SECRET_KEY must be changed for production")
    if "sqlite" in settings.DATABASE_URL:
        raise ValueError("SQLite is not suitable for production. Use PostgreSQL instead.")
