
import sqlite3
import os

def check_db(db_path):
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    print(f"\nChecking database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
        for table_name in [t[0] for t in tables]:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"Table {table_name}: {count} rows")
            
            if table_name == "users":
                cursor.execute("SELECT username, role, plan, subscription_status, school_id FROM users LIMIT 5")
                users = cursor.fetchall()
                for user in users:
                    print(f"  User: {user}")
    except Exception as e:
        print(f"Error checking {db_path}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    for db in ["data/apex.db", "lumi.db", "lumios.db", "backend/apex.db"]:
        check_db(db)
