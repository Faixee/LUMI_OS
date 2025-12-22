
import requests
import json
import time
from generate_test_token import (
    create_demo_token,
    create_student_token,
    create_teacher_token,
    create_parent_token,
    create_admin_token
)

BASE_URL = "http://localhost:8001"

def test_endpoint(name, method, path, token, data=None, expected_status=200):
    url = f"{BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    if data:
        headers["Content-Type"] = "application/json"
        response = requests.request(method, url, headers=headers, json=data)
    else:
        response = requests.request(method, url, headers=headers)
    
    status = response.status_code
    
    # Special handling for AI endpoints which might return 429 due to quota
    is_ai_path = path.startswith("/ai/")
    actual_expected = expected_status
    if is_ai_path and expected_status == 200 and status == 429:
        actual_expected = 429
        print(f"[TEST {name}] {method} {path} -> Expected: 200/429, Got: 429 (Quota Exceeded - Acceptable for RBAC test)")
        return True

    print(f"[TEST {name}] {method} {path} -> Expected: {expected_status}, Got: {status}")
    if status != expected_status:
        print(f"  FAILED: {response.text}")
        return False
    return True

def run_tests():
    print("--- Starting RBAC Tests ---")
    
    tokens = {
        "demo": create_demo_token(),
        "student": create_student_token(),
        "teacher": create_teacher_token(),
        "parent": create_parent_token(),
        "admin": create_admin_token()
    }

    results = []

    # 1. Admin Tests
    print("\n[Admin Role]")
    results.append(test_endpoint("Admin: AI Kill Switch GET", "GET", "/system/ai-kill-switch", tokens["admin"], expected_status=200))
    results.append(test_endpoint("Admin: AI Kill Switch POST", "POST", "/system/ai-kill-switch", tokens["admin"], data={"enabled": True}, expected_status=200))
    results.append(test_endpoint("Admin: Read Students", "GET", "/students/", tokens["admin"], expected_status=200))
    results.append(test_endpoint("Admin: Read Audit Logs", "GET", "/system/audit-logs", tokens["admin"], expected_status=200))
    
    # Create a student to test GET/DELETE
    student_id = f"s_adm_{int(time.time())}"
    results.append(test_endpoint("Admin: Create Student", "POST", "/students/", tokens["admin"], data={"id": student_id, "name": "Admin New Student", "grade_level": 10}, expected_status=200))
    results.append(test_endpoint("Admin: Read Single Student", "GET", f"/students/{student_id}", tokens["admin"], expected_status=200))
    results.append(test_endpoint("Admin: Delete Student", "DELETE", f"/students/{student_id}", tokens["admin"], expected_status=200))

    # 2. Teacher Tests
    print("\n[Teacher Role]")
    results.append(test_endpoint("Teacher: Read Students", "GET", "/students/", tokens["teacher"], expected_status=200))
    results.append(test_endpoint("Teacher: Read Single Student (s100)", "GET", "/students/s100", tokens["teacher"], expected_status=200))
    results.append(test_endpoint("Teacher: AI Predict", "POST", "/ai/predict", tokens["teacher"], data={"id": "s100", "name": "Ali Rahman", "grade_level": 10}, expected_status=200))
    results.append(test_endpoint("Teacher: AI Quiz", "POST", "/ai/quiz", tokens["teacher"], data={"topic": "Math", "difficulty": "easy"}, expected_status=200))
    results.append(test_endpoint("Teacher: AI Kill Switch GET (Unauthorized)", "GET", "/system/ai-kill-switch", tokens["teacher"], expected_status=403))
    results.append(test_endpoint("Teacher: Create Student (Unauthorized)", "POST", "/students/", tokens["teacher"], data={"id": "s_fail", "name": "Fail Student", "grade_level": 5}, expected_status=403))
    results.append(test_endpoint("Teacher: Delete Student (Unauthorized)", "DELETE", "/students/s100", tokens["teacher"], expected_status=403))
    results.append(test_endpoint("Teacher: Read Audit Logs (Unauthorized)", "GET", "/system/audit-logs", tokens["teacher"], expected_status=403))
    results.append(test_endpoint("Teacher: Read Fees (Unauthorized)", "GET", "/fees/", tokens["teacher"], expected_status=403))

    # 3. Student Tests
    print("\n[Student Role]")
    results.append(test_endpoint("Student: Read Self", "GET", "/students/self", tokens["student"], expected_status=200))
    results.append(test_endpoint("Student: AI Chat", "POST", "/ai/chat", tokens["student"], data={"prompt": "How do I study?"}, expected_status=200))
    results.append(test_endpoint("Student: Read All Students (Unauthorized)", "GET", "/students/", tokens["student"], expected_status=403))
    results.append(test_endpoint("Student: Read Single Student (Unauthorized)", "GET", "/students/s100", tokens["student"], expected_status=403))
    results.append(test_endpoint("Student: Read Fees (Unauthorized)", "GET", "/fees/", tokens["student"], expected_status=403))

    # 4. Parent Tests
    print("\n[Parent Role]")
    results.append(test_endpoint("Parent: Read Fees", "GET", "/fees/", tokens["parent"], expected_status=200))
    results.append(test_endpoint("Parent: AI Report", "POST", "/ai/report", tokens["parent"], data={"student_id": "s100"}, expected_status=200))
    results.append(test_endpoint("Parent: Read Students (Unauthorized)", "GET", "/students/", tokens["parent"], expected_status=403))
    results.append(test_endpoint("Parent: Read Single Student (Unauthorized)", "GET", "/students/s100", tokens["parent"], expected_status=403))
    results.append(test_endpoint("Parent: Read Audit Logs (Unauthorized)", "GET", "/system/audit-logs", tokens["parent"], expected_status=403))

    # 5. Demo Tests
    print("\n[Demo Role]")
    results.append(test_endpoint("Demo: AI Chat", "POST", "/ai/chat", tokens["demo"], data={"prompt": "Hello"}, expected_status=200))
    results.append(test_endpoint("Demo: Create Student (Blocked by Write Guard)", "POST", "/students/", tokens["demo"], data={"id": "demo_s1", "name": "Demo Student", "grade_level": 5}, expected_status=403))
    results.append(test_endpoint("Demo: Delete Student (Blocked by Write Guard)", "DELETE", "/students/s100", tokens["demo"], expected_status=403))
    results.append(test_endpoint("Demo: Toggle Kill Switch (Blocked by Write Guard)", "POST", "/system/ai-kill-switch", tokens["demo"], data={"enabled": False}, expected_status=403))
    # Note: Assignment upload is multipart, test_endpoint needs update for that or we just use simple POST for now
    results.append(test_endpoint("Demo: Upload Assignment (Blocked by Write Guard)", "POST", "/assignments/upload", tokens["demo"], data={"file": "test.pdf"}, expected_status=403))

    # 6. Global/Public Tests
    print("\n[Public/Global]")
    results.append(test_endpoint("Public: Landing Chat", "POST", "/ai/landing-chat", "", data={"prompt": "Tell me about pricing"}, expected_status=200))
    results.append(test_endpoint("Public: Root", "GET", "/", "", expected_status=200))

    success_count = results.count(True)
    total_count = len(results)
    print(f"\n--- RBAC Test Summary: {success_count}/{total_count} Passed ---")

import time

if __name__ == "__main__":
    run_tests()
