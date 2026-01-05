
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.ai_service import AIService
from backend.config import Settings

def test_ai_init():
    print("Testing AI Service Initialization...")
    
    # Mock settings if needed or use real ones
    openai_key = os.getenv("OPENAI_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY", "")
    
    print(f"OpenAI Key Present: {bool(openai_key)}")
    print(f"Gemini Key Present: {bool(gemini_key)}")
    
    service = AIService(openai_key, gemini_key)
    
    print(f"OpenAI Client Initialized: {bool(service.client)}")
    print(f"Gemini Available: {service.gemini_available}")
    if service.vision_model:
        print(f"Vision Model: {service.vision_model.model_name}")
    else:
        print("Vision Model: None")
        
    if not service.gemini_available:
        print("❌ AI Service initialization failed or API key missing.")
        return False
    
    print("✅ AI Service initialized successfully.")
    return True

if __name__ == "__main__":
    test_ai_init()
