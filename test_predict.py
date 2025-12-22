
import requests
import json

url = "http://localhost:8000/ai/predict"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZWFjaGVyIiwicm9sZSI6InRlYWNoZXIiLCJuYW1lIjoiVGVzdCBUZWFjaGVyIiwic3Vic2NyaXB0aW9uX3N0YXR1cyI6ImFjdGl2ZSIsInBsYW4iOiJwcm8iLCJzY2hvb2xfaWQiOiJkZW1vX3NjaG9vbCIsInR2IjowLCJleHAiOjE3NjYzMTg2MzAsImlhdCI6MTc2NjMxNTAzMCwiaXNzIjoibHVtaW9zLWFwaSIsImF1ZCI6Imx1bWlvcy1mcm9udGVuZCIsInZlcnNpb24iOiIxLjAiLCJqdGkiOiIyVmVjNmN0RzBuMGZiR0ctdWZ3MzhBIn0.EKmyD1hoRJHbqADjWHNHYfBeaYa1qvrsE8rM_AAQLxo"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
# Data matches schemas.StudentCreate
data = {
    "id": "s100",
    "name": "Ali Rahman",
    "grade_level": 10,
    "gpa": 2.07,
    "attendance": 63.0,
    "behavior_score": 100,
    "notes": "Student record initialized. Needs additional support in Mathematics."
}

response = requests.post(url, headers=headers, json=data)
print(f"Status: {response.status_code}")
print(f"Body: {response.text}")
