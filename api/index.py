from backend.main import app

# Configure FastAPI to handle the /api prefix when running on Vercel
# This ensures that requests to /api/students/ are routed to /students/ in FastAPI
app.root_path = "/api"
