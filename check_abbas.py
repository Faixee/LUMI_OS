
import sqlite3

def check_abbas():
    conn = sqlite3.connect('data/apex.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE name LIKE '%Abbas%'")
    rows = cursor.fetchall()
    print(f"Abbas students: {rows}")
    conn.close()

if __name__ == "__main__":
    check_abbas()
