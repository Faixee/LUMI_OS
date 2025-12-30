"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from backend.ai_service import AIService

@pytest.fixture
def ai_service():
    with patch('google.generativeai.configure'), \
         patch('openai.OpenAI') as mock_openai:
        # Configure the OpenAI mock to have the structure we expect
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        service = AIService(openai_api_key="test_openai_key", gemini_api_key="test_gemini_key")
        return service

@pytest.mark.asyncio
async def test_generate_landing_chat_response_openai(ai_service):
    # Mock OpenAI response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Hello from NOVA"))]
    
    # Correct way to mock the nested call
    ai_service.client.chat.completions.create = MagicMock(return_value=mock_response)

    response_data = await ai_service.generate_landing_chat_response("Hi")
    assert "response" in response_data
    assert response_data["response"] == "Hello from NOVA"
    ai_service.client.chat.completions.create.assert_called_once()

@pytest.mark.asyncio
async def test_generate_syllabus_gemini(ai_service):
    # Mock Gemini response
    ai_service.gemini_available = True
    mock_model = MagicMock()
    
    # Mock generate_content_async as an AsyncMock
    mock_response = MagicMock()
    mock_response.text = '[{"week": 1, "topic": "Test Syllabus"}]'
    mock_model.generate_content_async = AsyncMock(return_value=mock_response)
    ai_service.vision_model = mock_model

    syllabus = await ai_service.generate_syllabus("Math", "10", 1)
    assert len(syllabus) == 1
    assert syllabus[0]["topic"] == "Test Syllabus"
    mock_model.generate_content_async.assert_called_once()

@pytest.mark.asyncio
async def test_process_vision_grading_no_service(ai_service):
    ai_service.gemini_available = False
    ai_service.vision_model = None
    
    result = await ai_service.process_vision_grading(b"image_data", "image/png")
    assert "error" in result
    assert "unavailable" in result["error"]

def test_parse_json(ai_service):
    text = "Here is the json: ```json\n{\"key\": \"value\"}\n```"
    result = ai_service._parse_json(text)
    assert result == {"key": "value"}

    text_no_markdown = "{\"key\": \"value\"}"
    result = ai_service._parse_json(text_no_markdown)
    assert result == {"key": "value"}
