import requests
r = requests.get("http://localhost:54322/")
print("Status:", r.status_code)
print("Headers:", r.headers)
try:
    print("Content:", r.json())
except:
    print("Content: (not json)")

r2 = requests.get("http://localhost:54322/system-info")
print("\nSystem Info Status:", r2.status_code)
if r2.status_code == 200:
    print("System Info Content:", r2.json())
else:
    print("System Info Error:", r2.text)
