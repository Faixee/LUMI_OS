
import sqlite3
import os

db_path = "./data/apex.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT username, subscription_status FROM users")
    users = cursor.fetchall()
    for u in users:
        print(f"User: {u[0]}, Status: {u[1]}")
    conn.close()
