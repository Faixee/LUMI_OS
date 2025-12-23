import os
import sys
import traceback
import json

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
    
    # Optional: Add a direct Vercel debug route
    @app.get("/vercel-debug")
    async def vercel_debug():
        return {
            "status": "online",
            "environment": os.environ.get("VERCEL_ENV", "unknown"),
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }
        
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
