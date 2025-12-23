
import sqlite3

def check_users():
    conn = sqlite3.connect('data/apex.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT username, role, school_id FROM users")
    rows = cursor.fetchall()
    print("Users in DB:")
    for row in rows:
        print(f"Username: {row[0]}, Role: {row[1]}, School ID: {row[2]}")
    
    conn.close()

if __name__ == "__main__":
    check_users()
