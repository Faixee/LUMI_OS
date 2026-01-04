import httpx
import asyncio
import json
import base64
import os

BASE_URL = "http://localhost:8000"

async def login():
    print("Logging in as admin...", end="", flush=True)
    payload = {"username": "admin", "password": "lumix123"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/login", json=payload)
            if response.status_code == 200:
                print(" ✅ SUCCESS")
                return response.json()["access_token"]
            else:
                print(f" ❌ FAILED ({response.status_code})")
                return None
    except Exception as e:
        print(f" ❌ ERROR: {str(e)}")
        return None

async def test_endpoint(name, path, payload=None, method="POST", token=None, files=None):
    print(f"Testing {name} ({path})...", end="", flush=True)
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            if method == "POST":
                if files:
                    # For multipart/form-data, payload goes into 'data'
                    response = await client.post(f"{BASE_URL}{path}", data=payload, headers=headers, files=files)
                else:
                    response = await client.post(f"{BASE_URL}{path}", json=payload, headers=headers)
            else:
                response = await client.get(f"{BASE_URL}{path}", headers=headers)
            
            if response.status_code == 200:
                print(" ✅ SUCCESS")
                return True, response.json()
            else:
                print(f" ❌ FAILED ({response.status_code})")
                print(f"   Error: {response.text}")
                return False, response.text
    except Exception as e:
        print(f" ❌ ERROR: {str(e)}")
        return False, str(e)

async def main():
    print("=== LUMIX AI FEATURE VERIFICATION ===\n")
    
    token = await login()
    if not token:
        print("Could not get auth token, skipping authenticated tests.")
    
    # Try to use a real image if available
    image_path = "public/dashboard-preview.png"
    if os.path.exists(image_path):
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
        file_name = "dashboard.png"
        content_type = "image/png"
    else:
        # 100x100 solid blue PNG as fallback
        image_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/g7CkAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAbUw4AAW98Y8EAAAAASUVORK5CYII=")
        file_name = "test.png"
        content_type = "image/png"
    
    features = [
        ("Health Check", "/health", {}, "GET", None, None),
        ("System Info", "/system-info", {}, "GET", None, None),
        ("Landing Chat", "/ai/landing-chat", {"prompt": "Hello, who are you?"}, "POST", None, None),
        ("Voice Signal", "/ai/voice-signal", {"type": "offer"}, "POST", None, None),
        
        # Authenticated endpoints
        ("Genesis Syllabus", "/ai/genesis/syllabus", {"topic": "Quantum Physics", "grade": "12", "weeks": 2}, "POST", token, None),
        ("Genesis Flashcards", "/ai/genesis/flashcards", {"topic": "Photosynthesis", "count": 5}, "POST", token, None),
        ("Genesis Quiz", "/ai/genesis/quiz", {"topic": "French Revolution", "count": 3}, "POST", token, None),
        ("AI Chat", "/ai/chat", {"prompt": "What is LUMIX OS?", "role": "user", "context": "LUMIX OS documentation"}, "POST", token, None),
        ("Analyze URL", "/ai/analyze-url", {"url": "https://www.ox.ac.uk/"}, "POST", token, None),
        ("Crawler", "/ai/crawler", {"url": "https://www.cam.ac.uk/", "max_depth": 1}, "POST", token, None),
        ("Solve Problem (Math)", "/ai/solve-problem", {
            "subject": "mathematics",
            "topic": "addition",
            "difficulty": "easy",
            "grade": "1",
            "problem": "What is 10 + 10?"
        }, "POST", token, None),
        ("Predict Performance", "/ai/predict", {
            "id": "s100",
            "name": "Ali Rahman",
            "grade_level": 10,
            "gpa": 3.8,
            "attendance": 95,
            "behavior_score": 90
        }, "POST", token, None),
        ("AI Quiz", "/ai/quiz", {"topic": "Photosynthesis", "difficulty": "medium"}, "POST", token, None),
        ("AI Grade", "/ai/grade", {"context": "Grade 10 Biology"}, "POST", token, {"file": (file_name, image_bytes, content_type)}),
        ("AI Report", "/ai/report", {"student_id": "s100"}, "POST", token, None),
    ]
    
    results = []
    for name, path, payload, method, t, f in features:
        success, data = await test_endpoint(name, path, payload, method, t, f)
        results.append((name, success))
    
    print("\n=== SUMMARY ===")
    all_success = True
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
        if not success:
            all_success = False
            
    if all_success:
        print("\nAll AI features verified successfully!")
    else:
        print("\nSome features failed verification. Check logs above.")

if __name__ == "__main__":
    asyncio.run(main())
