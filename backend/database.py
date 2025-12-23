from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL configuration
# Using PostgreSQL by default in production, SQLite for local dev
if os.getenv("ENVIRONMENT") == "production":
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/lumios_db")
else:
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/apex.db")

# Create data directory only if using SQLite
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    try:
        # Check if the path is relative or absolute
        if "sqlite:///" in SQLALCHEMY_DATABASE_URL:
             db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
             # Handle relative paths like ./data/apex.db
             if db_path.startswith("./"):
                  db_path = db_path[2:]
             
             db_dir = os.path.dirname(db_path)
             if db_dir and not os.path.exists(db_dir):
                 os.makedirs(db_dir)
    except OSError:
        pass

engine_args = {
    "connect_args": {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
}

# Production settings for PostgreSQL
if "postgresql" in SQLALCHEMY_DATABASE_URL:
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    })

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
