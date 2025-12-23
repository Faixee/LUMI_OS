
import sqlite3
import os

def check_plans():
    db_path = "lumios.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT username, role, plan, subscription_status, school_id FROM users")
        users = cursor.fetchall()
        print(f"{'Username':<15} | {'Role':<10} | {'Plan':<12} | {'Status':<10} | {'School ID':<10}")
        print("-" * 70)
        for user in users:
            print(f"{user[0]:<15} | {user[1]:<10} | {str(user[2]):<12} | {str(user[3]):<10} | {str(user[4]):<10}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_plans()
