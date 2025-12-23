
import requests

def test_health():
    print("Testing Root Health...")
    try:
        res = requests.get("http://localhost:8000/")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_health()
