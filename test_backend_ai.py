import requests
import json

BASE_URL = "http://127.0.0.1:8888"

def test_endpoint(path, data):
    print(f"Testing {path}...")
    try:
        response = requests.post(f"{BASE_URL}{path}", json=data)
        if response.status_code == 200:
            print(f"✅ SUCCESS: {path}")
            print(f"Response: {response.json().get('response', 'No response field')[:100]}...")
        else:
            print(f"❌ FAILED: {path} ({response.status_code})")
            print(f"Detail: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {path} - {e}")

if __name__ == "__main__":
    # Test public landing chat (no auth)
    test_endpoint("/ai/landing-chat", {"prompt": "What is LumiX?", "role": "visitor"})

    # Note: Other endpoints require auth. 
    # Since we are in dev, let's just check if they are reachable and handle errors gracefully.
    print("\nNote: Authenticated endpoints should be tested via the frontend or with a valid token.")
