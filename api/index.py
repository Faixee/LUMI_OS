import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(
    title="Backend API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url=None
)

# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------
cors_origins = os.getenv("CORS_ORIGINS", "")

allowed_origins = (
    [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
    if cors_origins
    else []
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Health Check (Required for Vercel testing)
# --------------------------------------------------
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# --------------------------------------------------
# Example API Route
# --------------------------------------------------
@app.get("/ping", tags=["System"])
def ping():
    return {"message": "Backend is running on Vercel"}

# --------------------------------------------------
# IMPORTANT
# - No uvicorn.run()
# - No sys.path hacks
# - No root_path override
# Vercel automatically mounts this at /api/*
# --------------------------------------------------
