
import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres:Faixee@991114@localhost/lumios_db"
try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        tables = ["students", "fees", "transport", "library", "users"]
        for table in tables:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"PostgreSQL Table {table}: {count} rows")
            except Exception as e:
                print(f"Error checking PostgreSQL table {table}: {e}")
except Exception as e:
    print(f"Could not connect to PostgreSQL: {e}")
