import os
import sys
import traceback
import json

# Add the project root to sys.path so we can import from backend
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

# We wrap the import and handler in a try-except to catch startup errors
# that Vercel would otherwise hide behind a generic 500 page.
try:
    from backend.main import app
    # Configure FastAPI to handle the /api prefix when running on Vercel
    app.root_path = "/api"
    handler = app
except Exception as e:
    error_info = {
        "error": type(e).__name__,
        "message": str(e),
        "traceback": traceback.format_exc()
    }
    
    # Define a simple WSGI application to return the error as JSON
    def handler(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps({
            "detail": "FastAPI failed to start on Vercel",
            "debug": error_info
        }).encode('utf-8')]
