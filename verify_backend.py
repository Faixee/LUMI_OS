import requests
import json

def test_backend():
    base_url = "http://localhost:54322"
    
    print(f"Testing {base_url}...")
    try:
        r = requests.get(f"{base_url}/")
        print(f"Root Status: {r.status_code}")
        print(f"Root Headers: {json.dumps(dict(r.headers), indent=2)}")
        print(f"Root Content: {json.dumps(r.json(), indent=2)}")
        
        r2 = requests.get(f"{base_url}/system-info")
        print(f"\nSystem Info Status: {r2.status_code}")
        if r2.status_code == 200:
            print(f"System Info Content: {json.dumps(r2.json(), indent=2)}")
        else:
            print(f"System Info Error: {r2.text}")
            
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_backend()
