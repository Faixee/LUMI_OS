import os
import sys
import traceback
import json

# Add the project root and api folder to sys.path
# This ensures 'backend' can be imported correctly by Vercel's serverless builder
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

if project_root not in sys.path:
    sys.path.insert(0, project_root)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if os.getcwd() not in sys.path:
    sys.path.insert(0, os.getcwd())

# Import the FastAPI app
try:
    from backend.main import app
    
    # Set root_path for Vercel
    # This allows FastAPI to handle routes starting with /api correctly
    app.root_path = "/api"
    
    @app.get("/health-check")
    async def vercel_health():
        return {"status": "ok", "source": "vercel-handler"}
        
    handler = app
except Exception as e:
    def handler(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps({
            "detail": "FastAPI failed to start on Vercel",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "python_version": sys.version
        }).encode('utf-8')]
