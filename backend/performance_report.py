"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import subprocess
import time
import json
import os

def run_test_suite(test_file):
    print(f"Running {test_file}...")
    start_time = time.time()
    result = subprocess.run(["pytest", test_file, "-v"], capture_output=True, text=True)
    duration = time.time() - start_time
    return {
        "file": test_file,
        "success": result.returncode == 0,
        "duration": duration,
        "output": result.stdout
    }

def main():
    test_files = [
        "backend/tests/test_integration.py",
        "backend/tests/test_intermediate.py",
        "backend/tests/test_advanced.py",
        "backend/tests/test_intelligence.py"
    ]
    
    reports = []
    print("=== LUMI_OS PERFORMANCE & VALIDATION REPORT ===")
    print(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    for test_file in test_files:
        report = run_test_suite(test_file)
        reports.append(report)
        status = "PASSED" if report["success"] else "FAILED"
        print(f"{test_file:40} | {status} | {report['duration']:.2f}s")
        
    print("-" * 50)
    total_duration = sum(r["duration"] for r in reports)
    passed_count = sum(1 for r in reports if r["success"])
    
    print(f"TOTAL TESTS: {len(test_files)}")
    print(f"PASSED:      {passed_count}")
    print(f"FAILED:      {len(test_files) - passed_count}")
    print(f"TOTAL TIME:  {total_duration:.2f}s")
    
    if passed_count == len(test_files):
        print("\nCONCLUSION: SYSTEM MEETS ALL PERFORMANCE AND INTELLIGENCE BENCHMARKS.")
    else:
        print("\nCONCLUSION: SYSTEM REQUIRES FURTHER OPTIMIZATION.")

if __name__ == "__main__":
    main()
