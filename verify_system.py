import requests

def verify():
    try:
        # 1. Login
        login_res = requests.post('http://localhost:54322/login', json={'username':'admin', 'password':'lumix123'})
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
        
        token = login_res.json()['access_token']
        print("Login successful.")

        # 2. Get Students
        students_res = requests.get('http://localhost:54322/students/', headers={'Authorization': f'Bearer {token}'})
        if students_res.status_code == 200:
            students = students_res.json()
            print(f"Successfully retrieved {len(students)} students from database.")
            for s in students:
                print(f" - {s['name']} (Grade {s['grade_level']})")
        else:
            print(f"Failed to get students: {students_res.text}")

        # 3. Get School Config
        config_res = requests.get('http://localhost:54322/school/config', headers={'Authorization': f'Bearer {token}'})
        if config_res.status_code == 200:
            config = config_res.json()
            print(f"School Config: {config['name']} - {config['motto']}")

    except Exception as e:
        print(f"Verification error: {e}")

if __name__ == "__main__":
    verify()
