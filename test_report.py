
import requests
import json

url = "http://localhost:8000/ai/report"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQiLCJyb2xlIjoicGFyZW50IiwibmFtZSI6IlRlc3QgUGFyZW50Iiwic3Vic2NyaXB0aW9uX3N0YXR1cyI6ImFjdGl2ZSIsInBsYW4iOiJwcm8iLCJzY2hvb2xfaWQiOiJkZW1vX3NjaG9vbCIsInR2IjowLCJleHAiOjE3NjYzMTg2MzAsImlhdCI6MTc2NjMxNTAzMCwiaXNzIjoibHVtaW9zLWFwaSIsImF1ZCI6Imx1bWlvcy1mcm9udGVuZCIsInZlcnNpb24iOiIxLjAiLCJqdGkiOiJYanlodS12RzNjc1hrTHQ5dF8xUE53In0.SoOtQxEKsrhYSsAEdjp2y6xVg4M2uZEABrB5ztfFi3k"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
data = {"student_id": "s100"}

response = requests.post(url, headers=headers, json=data)
print(f"Status: {response.status_code}")
print(f"Body: {response.text}")
