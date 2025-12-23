
import sqlite3

def check_students_school():
    conn = sqlite3.connect('data/apex.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, school_id FROM students LIMIT 5")
    rows = cursor.fetchall()
    print("Students Sample:")
    for row in rows:
        print(f"Name: {row[0]}, School ID: {row[1]}")
    
    cursor.execute("SELECT username, school_id FROM users WHERE username='admin'")
    row = cursor.fetchone()
    if row:
        print(f"\nAdmin User: {row[0]}, School ID: {row[1]}")
    
    conn.close()

if __name__ == "__main__":
    check_students_school()
