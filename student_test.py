import requests, time

BASE = "http://127.0.0.1:8000"

def main():
    u = f"student_{int(time.time())}"
    p = "Student123!"
    name = "Abbas Ali Ahmed"
    reg = requests.post(BASE + "/register", json={
        "username": u,
        "password": p,
        "name": name,
        "role": "student",
        "email": "faixeemr@gmail.com",
        "phone": "+92 3122438813",
        "grade_level": 9,
        "class_name": "9B"
    })
    print("STUDENT REGISTER", reg.status_code, reg.text[:160])
    login = requests.post(BASE + "/login", json={"username": u, "password": p})
    print("STUDENT LOGIN", login.status_code, login.text[:160])
    if login.status_code != 200:
        return
    token = login.json().get("access_token","")
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    profile_payload = {
        "id": f"s{int(time.time())}",
        "name": name,
        "grade_level": 9,
        "gpa": 0,
        "attendance": 100,
        "behavior_score": 100,
        "notes": "Class: 9B | Email: faixeemr@gmail.com | Phone: +92 3122438813",
        "risk_level": "Low"
    }
    prof = requests.post(BASE + "/students/self", headers=headers, json=profile_payload)
    print("SELF PROFILE", prof.status_code, prof.text[:200])

if __name__ == "__main__":
    main()
