
import requests
import json

def test_api():
    # 1. Login
    print("Testing Login...")
    login_payload = {
        "username": "admin",
        "password": "lumix123"
    }
    try:
        # FastAPI endpoint expects JSON
        res = requests.post("http://localhost:8000/login", json=login_payload)
        print(f"Login Response: {res.status_code}")
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
        
        data = res.json()
        token = data["access_token"]
        print(f"Login successful! User: {data.get('user', {}).get('username')}")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Fetch Students
        print("\nFetching Students...")
        res_students = requests.get("http://localhost:8000/students/", headers=headers)
        print(f"Students Response: {res_students.status_code}")
        if res_students.status_code == 200:
            students = res_students.json()
            print(f"Found {len(students)} students")
        
        # Fetch School Config
        print("\nFetching School Config...")
        res_config = requests.get("http://localhost:8000/school/config", headers=headers)
        print(f"Config Response: {res_config.status_code}")
        if res_config.status_code == 200:
            print(f"Config: {res_config.json().get('name')}")
            
        # Fetch Fees
        print("\nFetching Fees...")
        res_fees = requests.get("http://localhost:8000/fees/", headers=headers)
        print(f"Fees Response: {res_fees.status_code}")
        
        # Fetch Transport
        print("\nFetching Transport...")
        res_transport = requests.get("http://localhost:8000/transport/", headers=headers)
        print(f"Transport Response: {res_transport.status_code}")
        
        # Fetch Library
        print("\nFetching Library...")
        res_library = requests.get("http://localhost:8000/library/", headers=headers)
        print(f"Library Response: {res_library.status_code}")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
