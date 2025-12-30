"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from backend.ai_service import AIService
from backend.config import settings

@pytest.fixture
def ai_service():
    return AIService(openai_api_key="fake-openai-key", gemini_api_key="fake-gemini-key")

@pytest.mark.asyncio
async def test_cognitive_syllabus_generation(ai_service):
    """
    Intelligence Validation: Test cognitive ability by generating a complex,
    age-appropriate syllabus for a difficult topic.
    """
    with patch.object(ai_service.vision_model, 'generate_content_async', new_callable=AsyncMock) as mock_gen:
        # Simulate a high-quality, complex AI response
        mock_gen.return_value.text = """
        [
            {"week": 1, "topic": "Quantum Superposition", "details": "Understanding qubits and state vectors.", "activity": "Vector visualization exercise"},
            {"week": 2, "topic": "Quantum Entanglement", "details": "Spooky action at a distance and Bell's inequality.", "activity": "Entanglement simulation lab"}
        ]
        """
        
        topic = "Quantum Computing"
        grade = "12"
        weeks = 2
        
        syllabus = await ai_service.generate_syllabus(topic, grade, weeks)
        
        assert len(syllabus) == 2
        assert syllabus[0]["week"] == 1
        assert "Quantum" in syllabus[0]["topic"]
        assert "qubits" in syllabus[0]["details"]
        mock_gen.assert_called_once()

@pytest.mark.asyncio
async def test_contextual_reasoning_chat(ai_service):
    """
    Intelligence Validation: Test contextual understanding and reasoning skills
    by simulating a multi-turn conversation with history.
    """
    if not ai_service.client:
        pytest.skip("OpenAI client not initialized")

    with patch.object(ai_service.client.chat.completions, 'create') as mock_create:
        # Mock the OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Since you mentioned the Foundation plan earlier, the Ascension plan adds advanced AI grading."
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 20
        mock_response.usage.total_tokens = 120
        mock_create.return_value = mock_response

        history = [
            {"role": "user", "content": "What is the Foundation plan?"},
            {"role": "assistant", "content": "The Foundation plan costs $199 and includes core SMS features."}
        ]
        prompt = "How does it compare to the Ascension plan?"
        
        result = await ai_service.generate_landing_chat_response(prompt, history=history)
        
        assert "Ascension" in result["response"]
        assert "Foundation" in result["response"]
        # Verify that history was passed to the AI
        args, kwargs = mock_create.call_args
        messages = kwargs['messages']
        assert any(msg['content'] == "What is the Foundation plan?" for msg in messages)

@pytest.mark.asyncio
async def test_robust_json_parsing_adaptation(ai_service):
    """
    Intelligence Validation: Test the system's adaptation to slightly malformed
    or markdown-wrapped AI responses.
    """
    with patch.object(ai_service.vision_model, 'generate_content_async', new_callable=AsyncMock) as mock_gen:
        # Case 1: JSON wrapped in markdown blocks
        mock_gen.return_value.text = "```json\n[{\"term\": \"AI\", \"def\": \"Artificial Intelligence\"}]\n```"
        flashcards = await ai_service.generate_flashcards("AI", count=1)
        assert len(flashcards) == 1
        assert flashcards[0]["term"] == "AI"

        # Case 2: JSON with extra text around it
        mock_gen.return_value.text = "Here is the quiz you asked for: \n```\n[{\"q\": \"1+1?\", \"options\": [\"1\",\"2\"], \"correct\": 1}]\n```\nHope this helps!"
        quiz = await ai_service.generate_quiz("Math", count=1)
        assert len(quiz) == 1
        assert quiz[0]["q"] == "1+1?"

@pytest.mark.asyncio
async def test_ai_grading_complex_reasoning(ai_service):
    """
    Intelligence Validation: Test the AI's ability to provide complex insights
    and reasoning in grading.
    """
    with patch.object(ai_service.vision_model, 'generate_content_async', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value.text = """
        {
            "student": "Alice Smith",
            "score": 92,
            "feedback": "Excellent understanding of calculus.",
            "annotations": [
                {"point": "Derivative chain rule", "comment": "Perfect execution"}
            ],
            "insights": {
                "strengths": ["Calculus", "Algebra"],
                "weaknesses": ["Trigonometric identities"],
                "recommendation": "Review double angle formulas."
            }
        }
        """
        
        result = await ai_service.process_vision_grading(b"fake-image", "image/png", context="Midterm Exam")
        
        assert result["student"] == "Alice Smith"
        assert result["score"] == 92
        assert "recommendation" in result["insights"]
        assert "Trigonometric" in result["insights"]["weaknesses"][0]

@pytest.mark.asyncio
async def test_ai_service_caching_efficiency(ai_service):
    """
    Optimization Requirement: Verify that the AI service uses caching to
    improve efficiency and reduce API costs.
    """
    with patch.object(ai_service.vision_model, 'generate_content_async', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value.text = "[{\"term\": \"Cache\", \"def\": \"Fast storage\"}]"
        
        # First call should hit the AI
        await ai_service.generate_flashcards("Caching", count=1)
        assert mock_gen.call_count == 1
        
        # Second call with same parameters should hit the cache
        await ai_service.generate_flashcards("Caching", count=1)
        assert mock_gen.call_count == 1 # Still 1

