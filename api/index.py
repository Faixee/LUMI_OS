import os
import sys

# Add the project root to sys.path
# This ensures 'backend' can be imported correctly by Vercel's serverless builder
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the FastAPI app
try:
    from backend.main import app
    # Set root_path for Vercel
    app.root_path = "/api"
    handler = app
except Exception as e:
    import traceback
    import json
    
    def handler(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps({
            "detail": "FastAPI failed to start on Vercel",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }).encode('utf-8')]
