import asyncio
import os
import sys
import json
from unittest.mock import MagicMock, AsyncMock

# Mock the database setup to avoid SQL Alchemy errors
sys.modules['backend.database'] = MagicMock()
sys.modules['backend.models'] = MagicMock()
sys.modules['backend.config'] = MagicMock()

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock Google Generative AI
class MockGenerativeModel:
    async def generate_content_async(self, prompt):
        return MagicMock(text="""
        {
            "student": "Test Student",
            "score": 88,
            "feedback": "Great job!",
            "annotations": [{"point": "Q1", "comment": "Good"}],
            "insights": {
                "strengths": ["Algebra"],
                "weaknesses": ["Geometry"],
                "recommendation": "Study more"
            },
            "reference_match_score": 90.0,
            "flags": ["Possible copy in Q2"],
            "grading_confidence": 0.85
        }
        """)

class MockGenAI:
    def configure(self, api_key): pass
    def GenerativeModel(self, name): return MockGenerativeModel()

sys.modules['google.generativeai'] = MockGenAI()

# Import AIService after mocking
from backend.ai_service import AIService

async def test_backend_integration():
    print("Initializing AI Service...")
    service = AIService(openai_api_key="fake", gemini_api_key="fake")
    
    print("\n1. Testing Grading with New Fields...")
    result = await service.process_vision_grading(
        image_data=b"fake_image_data",
        mime_type="image/jpeg",
        context="Math Test",
        reference_data={"answers": []}
    )
    
    print("Result Keys:", result.keys())
    
    # Verification
    required_fields = ["flags", "grading_confidence"]
    missing = [f for f in required_fields if f not in result]
    
    if missing:
        print(f"❌ Failed: Missing fields {missing}")
        return False
        
    print(f"✅ Grading Confidence: {result.get('grading_confidence')}")
    print(f"✅ Flags: {result.get('flags')}")
    
    print("\n2. Testing Reference Analysis...")
    # Mocking reference analysis response
    service.vision_model.generate_content_async = AsyncMock(return_value=MagicMock(text="""
    {
        "answers": [{"q": "1", "answer": "A", "marks": 5}],
        "total_marks": 100,
        "criteria": "Standard",
        "summary": "Math Key",
        "confidence_score": 0.92,
        "benchmarks": {"passing": 50}
    }
    """))
    
    ref_result = await service.analyze_reference_material("fake content")
    print("Ref Result Keys:", ref_result.keys())
    
    if "confidence_score" in ref_result and "benchmarks" in ref_result:
        print(f"✅ Confidence Score: {ref_result.get('confidence_score')}")
        print(f"✅ Benchmarks: {ref_result.get('benchmarks')}")
    else:
        print("❌ Failed: Missing reference fields")
        return False
        
    return True

if __name__ == "__main__":
    asyncio.run(test_backend_integration())
