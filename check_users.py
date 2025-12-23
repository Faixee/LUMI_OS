
import sqlite3
import os

db_path = "./data/apex.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT username, role, school_id FROM users")
        users = cursor.fetchall()
        for u in users:
            print(f"User: {u[0]}, Role: {u[1]}, School ID: {u[2]}")
    except Exception as e:
        print(f"Error checking users: {e}")
    
    conn.close()
