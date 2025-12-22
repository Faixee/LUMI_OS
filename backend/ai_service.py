
import os
import time
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from backend.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

class AIService:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = "gpt-4-turbo-preview" # Using a high-quality model

    async def generate_landing_chat_response(self, prompt: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """
        Generate a response for the landing page chatbot using OpenAI.
        Includes context management and tool action formatting.
        """
        if not self.client:
            logger.error("OpenAI client not initialized")
            return {"response": "AI service is currently unavailable.", "error": "Client not initialized"}

        system_prompt = """
        You are NOVA, the AI Assistant for LumiX (Luminous Intelligence Exchange).
        Your goal is to help visitors understand LumiX, a futuristic School Management System.

        CAPABILITIES:
        1. Explain features: AI Grading, Predictive Analytics, Genesis Engine.
        2. Guide users: Tell them to click 'View Demo' or 'Subscribe'.
        3. Pricing: Foundation ($199), Ascension ($499), God Mode ($999).
        4. Tone: Futuristic, professional, helpful, slightly sci-fi (like JARVIS or Cortana).

        TOOLS (Return JSON if applicable, otherwise plain text):
        If the user wants to see pricing, return: {"action": "navigate", "target": "/subscribe", "text": "Navigating to subscription matrix."}
        If the user wants to login, return: {"action": "navigate", "target": "/login", "text": "Initiating secure login sequence."}
        If the user wants a demo, return: {"action": "navigate", "target": "/demo", "text": "Launching demo environment."}
        
        Always prioritize being helpful and informative. If you don't know something, say you're still learning that part of the LumiX architecture.
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (context management)
        # Limit history to last 5 exchanges to keep it concise
        messages.extend(history[-10:])
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})

        try:
            start_time = time.time()
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            duration = (time.time() - start_time) * 1000
            
            text = response.choices[0].message.content
            
            logger.info(f"AI Response generated in {duration:.2f}ms using {self.model}")
            
            return {
                "response": text,
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }

        except Exception as e:
            logger.error(f"OpenAI API Error: {e}")
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                return {"response": "I'm receiving too many requests right now. Please wait a moment.", "error": "rate_limit_exceeded"}
            elif "invalid_api_key" in error_msg.lower():
                return {"response": "My neural link configuration is invalid.", "error": "invalid_api_key"}
            else:
                return {"response": "My neural link is currently unstable. Please try again later.", "error": "provider_error"}

ai_service = AIService(settings.OPENAI_API_KEY)
