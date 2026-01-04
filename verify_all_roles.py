import httpx
import asyncio
import json
import base64
import os
from typing import List, Dict, Any

BASE_URL = "http://localhost:8000"

async def login(username, password):
    print(f"Logging in as {username}...", end="", flush=True)
    payload = {"username": username, "password": password}
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

async def test_endpoint(name, path, payload=None, method="POST", token=None, files=None, expected_status=200):
    print(f"Testing {name} ({path})...", end="", flush=True)
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "POST":
                if files:
                    response = await client.post(f"{BASE_URL}{path}", data=payload, headers=headers, files=files)
                else:
                    response = await client.post(f"{BASE_URL}{path}", json=payload, headers=headers)
            else:
                response = await client.get(f"{BASE_URL}{path}", headers=headers)
            
            # Allow expected status or 200 if expected is 200
            # If we expect 403, getting 403 is SUCCESS.
            
            if response.status_code == expected_status:
                print(f" ✅ SUCCESS (Got {response.status_code})")
                return True, response.json() if expected_status == 200 else response.text
            else:
                print(f" ❌ FAILED (Got {response.status_code}, Expected {expected_status})")
                # print(f"   Response: {response.text[:200]}")
                return False, response.text
    except Exception as e:
        print(f" ❌ ERROR: {str(e)}")
        return False, str(e)

async def main():
    print("=== LUMIX MULTI-ROLE VERIFICATION ===\n")
    
    # Prepare image
    image_path = "public/dashboard-preview.png"
    if os.path.exists(image_path):
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
        file_name = "dashboard.png"
        content_type = "image/png"
    else:
        image_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/g7CkAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAbUw4AAW98Y8EAAAAASUVORK5CYII=")
        file_name = "test.png"
        content_type = "image/png"

    roles_config = [
        {
            "role": "Admin",
            "creds": ("admin", "lumix123"),
            "overrides": {} # All 200
        },
        {
            "role": "Teacher",
            "creds": ("teacher", "lumix123"),
            "overrides": {
                "/ai/report": 403,      # Parent/Admin only
                "/ai/analyze-url": 403, # Enterprise only (Teacher is Pro)
            }
        },
        {
            "role": "Student",
            "creds": ("student", "lumix123"),
            "overrides": {
                "/ai/grade": 403,       # Teacher/Admin only
                "/ai/report": 403,      # Parent/Admin only
                "/ai/analyze-url": 403, # Enterprise only (Student is Basic)
            }
        }
    ]

    # Base features list
    base_features = [
        # Public
        ("Health Check", "/health", {}, "GET", False),
        ("System Info", "/system-info", {}, "GET", False),
        ("Landing Chat", "/ai/landing-chat", {"prompt": "Hello"}, "POST", False),
        ("Voice Signal", "/ai/voice-signal", {"type": "offer"}, "POST", False),
        
        # Authenticated
        ("Genesis Syllabus", "/ai/genesis/syllabus", {"topic": "Math", "grade": "10", "weeks": 1}, "POST", True),
        ("Genesis Flashcards", "/ai/genesis/flashcards", {"topic": "Science", "count": 2}, "POST", True),
        ("Genesis Quiz", "/ai/genesis/quiz", {"topic": "History", "count": 2}, "POST", True),
        ("AI Chat", "/ai/chat", {"prompt": "Hi", "role": "user"}, "POST", True),
        ("Analyze URL", "/ai/analyze-url", {"url": "https://example.com"}, "POST", True),
        ("Crawler", "/ai/crawler", {"url": "https://example.com", "max_depth": 1}, "POST", True),
        ("Solve Problem", "/ai/solve-problem", {
            "subject": "math", "topic": "add", "difficulty": "easy", "grade": "1", "problem": "1+1"
        }, "POST", True),
        ("Predict Performance", "/ai/predict", {
            "id": "s100",
            "name": "Ali Rahman",
            "grade_level": 10,
            "gpa": 3.8,
            "attendance": 95,
            "behavior_score": 90
        }, "POST", True),
        ("AI Quiz", "/ai/quiz", {"topic": "Bio", "difficulty": "easy"}, "POST", True),
        ("AI Grade", "/ai/grade", {"context": "Test"}, "POST", True),
        ("AI Report", "/ai/report", {"student_id": "s100"}, "POST", True),
    ]

    for role_conf in roles_config:
        role_name = role_conf["role"]
        username, password = role_conf["creds"]
        overrides = role_conf["overrides"]
        
        print(f"\n--- Testing Role: {role_name} ---")
        token = await login(username, password)
        
        if not token:
            print(f"Skipping tests for {role_name} due to login failure.")
            continue

        for name, path, payload, method, auth_required in base_features:
            # Determine expected status
            expected = 200
            if path in overrides:
                expected = overrides[path]
            
            # For public endpoints, we don't strictly need token, but passing it doesn't hurt usually.
            # But test_endpoint logic: if token is None, no header.
            # If auth_required is True, pass token.
            use_token = token if auth_required else None
            
            # Special handling for file upload (AI Grade)
            current_files = None
            if path == "/ai/grade":
                current_files = {"file": (file_name, image_bytes, content_type)}
            
            await test_endpoint(name, path, payload, method, use_token, current_files, expected_status=expected)

if __name__ == "__main__":
    asyncio.run(main())
