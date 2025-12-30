import requests
import json

def test_nova_attribution():
    base_url = "http://localhost:54322"
    
    queries = [
        "who created you?",
        "who is the developer?",
        "what can you do?",
        "help"
    ]
    
    print("Testing Nova Assistant Attribution...")
    for query in queries:
        print(f"\nQuery: {query}")
        try:
            r = requests.post(f"{base_url}/ai/landing-chat", json={
                "prompt": query,
                "history": [],
                "language": "en"
            })
            if r.status_code == 200:
                result = r.json()
                print(f"Response: {result['response']}")
                if 'model' in result:
                    print(f"Model: {result['model']}")
            else:
                print(f"Error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_nova_attribution()
