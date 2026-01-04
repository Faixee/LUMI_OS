import httpx
import asyncio
import json

BASE_URL = "http://localhost:54322"

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

async def main():
    token = await login("admin", "lumix123")
    if not token:
        return

    student_data = {
        "id": "s101",
        "name": "Zayn Mixed",
        "grade_level": 10,
        "gpa": 2.0,
        "attendance": 100,
        "behavior_score": 35
    }

    print("\n--- Sending Student Data ---")
    print(json.dumps(student_data, indent=2))

    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n--- AI Response ---")
        response = await client.post(f"{BASE_URL}/ai/predict", json=student_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(result["result"])
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(main())
