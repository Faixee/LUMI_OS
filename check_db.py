
import sqlite3
import os

db_path = "./data/apex.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    tables = ["students", "fees", "transport", "library", "school_config"]
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Table {table}: {count} rows")
        except Exception as e:
            print(f"Error checking table {table}: {e}")
    
    conn.close()
