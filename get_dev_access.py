import requests
import json
import os

# Configuration from your .env
SECRET = "FAIZAN_19991114_LX7_CORE"
EMAIL = "faixee10@gmail.com"
URL = "http://127.0.0.1:8888/internal/dev/unlock"

def get_access():
    print("--- LUMI OS DEVELOPER UNLOCK ---")
    print(f"Requesting access for: {EMAIL}")
    
    headers = {
        "X-Internal-Dev-Secret": SECRET,
        "Content-Type": "application/json"
    }
    
    data = {
        "email": EMAIL
    }
    
    try:
        response = requests.post(URL, headers=headers, json=data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            
            print("\n✅ SUCCESS: Developer Session Authorized!")
            print("-" * 40)
            print("HOW TO ACTIVATE:")
            print("1. Open your browser to: http://localhost:5173")
            print("2. Press F12 to open Developer Tools (Console tab)")
            print("3. Paste the following command and press Enter:")
            print("\n--- COPY START ---")
            print(f"sessionStorage.setItem('lumix_token', '{token}');")
            print("sessionStorage.setItem('lumix_role', 'developer');")
            print("sessionStorage.setItem('lumix_user', 'Developer Session');")
            print("window.location.href = '/app';")
            print("--- COPY END ---")
            print("-" * 40)
            print("You will be redirected to the app with GOD MODE enabled.")
        else:
            print(f"\n❌ FAILED: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"\n❌ ERROR: Could not connect to backend. Is uvicorn running?")
        print(f"Detail: {e}")

if __name__ == "__main__":
    get_access()
