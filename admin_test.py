import requests, time

BASE = "http://127.0.0.1:8000"

def main():
    u = f"admin_{int(time.time())}"
    p = "Secure123!"
    reg = requests.post(BASE + "/register", json={
        "username": u,
        "password": p,
        "name": "Admin User",
        "role": "admin",
        "invite_code": "LET-ADMIN-IN-2025"
    })
    print("ADMIN REGISTER", reg.status_code, reg.text[:160])
    login = requests.post(BASE + "/login", json={"username": u, "password": p})
    print("ADMIN LOGIN", login.status_code, login.text[:160])

if __name__ == "__main__":
    main()
