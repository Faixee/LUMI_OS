
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(override=True)

def test_conn():
    environment = os.getenv("ENVIRONMENT", "development")
    database_url = os.getenv("DATABASE_URL")
    
    print(f"ENVIRONMENT: {environment}")
    print(f"DATABASE_URL from env: {database_url}")
    
    if environment == "production":
        url = database_url or "postgresql://user:password@localhost/lumios_db"
    else:
        url = database_url or "sqlite:///./data/apex.db"
    
    print(f"Final URL to use: {url}")
    
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print("Connection successful!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_conn()
