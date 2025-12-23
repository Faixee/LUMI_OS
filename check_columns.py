
import sqlite3
import os

db_path = "./data/apex.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(school_config)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"Columns in school_config: {cols}")
    except Exception as e:
        print(f"Error checking school_config: {e}")
    
    conn.close()
