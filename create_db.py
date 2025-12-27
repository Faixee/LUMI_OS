import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv
import urllib.parse

def create_database():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url or not db_url.startswith("postgresql"):
        print("No PostgreSQL DATABASE_URL found in .env")
        return

    # Parse the URL
    # format: postgresql://user:password@host:port/dbname
    result = urllib.parse.urlparse(db_url)
    username = result.username
    password = urllib.parse.unquote(result.password) if result.password else None
    host = result.hostname or 'localhost'
    port = result.port or 5432
    dbname = result.path.lstrip('/')

    print(f"Connecting to PostgreSQL at {host}:{port} as {username}...")
    
    try:
        # Connect to the default 'postgres' database
        con = psycopg2.connect(
            dbname='postgres', 
            user=username, 
            password=password, 
            host=host, 
            port=port
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Database '{dbname}' does not exist. Creating...")
            cur.execute(f"CREATE DATABASE {dbname}")
            print(f"Database '{dbname}' created successfully.")
        else:
            print(f"Database '{dbname}' already exists.")
            
        cur.close()
        con.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database()
