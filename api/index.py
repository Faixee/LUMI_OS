import os
import sys

# Add the project root to sys.path so we can import from backend
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from backend.main import app

# Configure FastAPI to handle the /api prefix when running on Vercel
app.root_path = "/api"

# Export the app for Vercel
handler = app
