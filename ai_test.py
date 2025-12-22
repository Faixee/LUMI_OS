import requests

BASE = "http://127.0.0.1:8000"

def main():
    try:
        r = requests.get(BASE + "/")
        print("HEALTH", r.status_code, r.text)
    except Exception as e:
        print("HEALTH ERROR", e)
        return

    u = "ai_tester_user"
    p = "Aitest123!"
    reg = requests.post(BASE + "/register", json={
        "username": u,
        "password": p,
        "name": "AI Tester",
        "role": "teacher",
        "subject": "Physics"
    })
    print("REGISTER", reg.status_code, reg.text[:120])

    login = requests.post(BASE + "/login", json={"username": u, "password": p})
    print("LOGIN", login.status_code, login.text[:120])
    if login.status_code != 200:
        return

    token = login.json().get("access_token", "")
    headers = {"Authorization": f"Bearer {token}"}

    quiz = requests.post(BASE + "/ai/quiz", headers=headers, json={"topic": "Photosynthesis", "difficulty": "easy"})
    print("AI QUIZ", quiz.status_code)
    print(quiz.text[:400])

if __name__ == "__main__":
    main()
