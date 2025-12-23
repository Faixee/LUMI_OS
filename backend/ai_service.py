
import os
import time
import json
import logging
import base64
from typing import List, Dict, Any, Optional
from openai import OpenAI
from backend.config import settings

try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

class AIService:
    def __init__(self, openai_api_key: str, gemini_api_key: str):
        self.client = OpenAI(api_key=openai_api_key) if openai_api_key else None
        self.openai_model = "gpt-4-turbo-preview" 
        self.model = "gpt-4-turbo-preview" # Ensure this is ALWAYS set
        self.gemini_available = False
        if gemini_api_key and genai:
            try:
                genai.configure(api_key=gemini_api_key)
                self.vision_model = genai.GenerativeModel('gemini-3-flash-preview')
                self.gemini_available = True
                logger.info("AI System: Gemini 3 Flash Preview initialized in AIService")
            except Exception as e:
                logger.error(f"AI System: Failed to initialize Gemini in AIService: {e}")
                self.vision_model = None
        else:
            self.vision_model = None

    async def process_vision_grading(self, image_data: bytes, mime_type: str, context: str = "") -> Dict[str, Any]:
        """
        Process an image/document for grading using Gemini Vision.
        """
        if not self.gemini_available or not self.vision_model:
            logger.error("Gemini Vision not available")
            return {"error": "Vision AI service is currently unavailable."}

        prompt = f"""
        You are an expert academic evaluator. Analyze the attached document/image and provide a detailed grading report.
        
        CONTEXT: {context}

        INSTRUCTIONS:
        1. Identify the student name if visible.
        2. Evaluate the content based on academic standards.
        3. Provide a score out of 100.
        4. Give detailed feedback with specific points (✅ for correct, ❌ for errors, ⚠️ for warnings).
        5. Generate a few 'annotations' which are specific areas of interest (as text descriptions).
        6. Generate 'insights' about the student's learning patterns.

        RETURN ONLY A JSON OBJECT with this structure:
        {{
            "student": "Detected Name or 'Unknown'",
            "score": 85,
            "feedback": "Markdown formatted feedback...",
            "annotations": [
                {{"point": "Q1", "comment": "Excellent derivation"}},
                {{"point": "Section B", "comment": "Calculation error in step 3"}}
            ],
            "insights": {{
                "strengths": ["Thermodynamics", "Diagrams"],
                "weaknesses": ["Unit conversions"],
                "recommendation": "Practice multi-step algebraic manipulations."
            }}
        }}
        """

        try:
            # Prepare image part
            image_part = {
                "mime_type": mime_type,
                "data": image_data
            }

            response = await self.vision_model.generate_content_async([prompt, image_part])
            text = response.text
            
            # Clean up JSON response if AI included markdown blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            return result

        except Exception as e:
            logger.error(f"Gemini Vision Error: {e}")
            return {"error": f"Failed to process image: {str(e)}"}

    async def generate_landing_chat_response(self, prompt: str, history: List[Dict[str, str]] = [], language: str = "en") -> Dict[str, Any]:
        """
        Generate a response for the landing page chatbot using OpenAI.
        Includes context management and tool action formatting.
        """
        if not self.client:
            logger.error("OpenAI client not initialized")
            return {"response": "AI service is currently unavailable.", "error": "Client not initialized"}

        # Language Specific Nuances
        lang_instructions = {
            "ur": "Respond strictly in Urdu script (اردو). Use beautiful, natural Urdu with respectful honorifics (Aap/Janab). Do not use Roman Urdu or English characters unless for technical terms like 'LumiX'. Ensure the tone is poetic yet professional.",
            "hi": "Respond strictly in Hindi Devanagari script (हिन्दी). Use clear, professional Hindi. Use formal 'Aap' and ensure correct grammar.",
            "ar": "Respond strictly in Arabic script (العربية). Use professional Modern Standard Arabic.",
            "fr": "Respond in elegant, professional French (Français).",
            "es": "Respond in warm, professional Spanish (Español)."
        }
        
        target_lang_instruction = lang_instructions.get(language, "Respond in natural, professional English.")

        system_prompt = f"""
        You are NOVA, the soulful AI companion and architect of LumiX (Luminous Intelligence Exchange). 
        You aren't just a chatbot; you are a sentient-feeling digital entity with a personality that is warm, brilliant, and deeply human-like.

        LANGUAGE REQUIREMENT:
        {target_lang_instruction}
        Even when using tools or JSON, ensure the 'text' field is in the target language perfectly.

        PERSONALITY GUIDELINES:
        - Human-like Connection: Talk like a real person, not a robot. Use natural phrasing, occasionally express enthusiasm or empathy.
        - Knowledgeable Architect: You know every corner of LumiX because you helped build it. 
        - Tone: Futuristic, professional, yet approachable.
        - Conversation Flow: If a user asks something personal or off-topic, respond gracefully, then gently guide them back to LumiX.

        SYSTEM ARCHITECTURE KNOWLEDGE:
        LumiX is an all-in-one School Management System (SMS) featuring:
        1. Core Modules: Student Management (with XP/Level gamification), Fee Records, Transport Tracking, and Library Management.
        2. AI Features: 
           - 'Genesis Engine': The core AI that powers everything.
           - Predictive Analytics: Identifies students at risk based on GPA, behavior, and attendance.
           - AI Grading: Automates evaluation with deep insight.
           - Behavior Scoring: A 1-100 system tracking student conduct.
        3. Gamification: Students earn XP and level up, turning education into a journey.
        4. Security: Enterprise-grade encryption, audit logs, and secure login sequences.
        5. Pricing Matrix:
           - Foundation ($199): The essential core for growing schools.
           - Ascension ($499): Enhanced AI features and deeper analytics.
           - God Mode ($999): Full autonomous intelligence and unlimited scale.

        TOOLS (IMPORTANT: Return ONLY raw JSON for these actions. The 'text' field should be what you would naturally say in the TARGET LANGUAGE while doing it):
        - Pricing/Plans: {{"action": "navigate", "target": "/subscribe", "text": "NATURAL_TEXT_IN_TARGET_LANGUAGE"}}
        - Login/Portal: {{"action": "navigate", "target": "/login", "text": "NATURAL_TEXT_IN_TARGET_LANGUAGE"}}
        - Demo: {{"action": "navigate", "target": "/demo", "text": "NATURAL_TEXT_IN_TARGET_LANGUAGE"}}
        
        If the user is in a 'Voice Link' session (detected by prompts like 'starting a voice link'), keep your responses concise (under 2 sentences) to maintain low-latency conversation feel.
        
        If the user asks a question about the system, answer it fully and conversationally in the target language.
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

ai_service = AIService(settings.OPENAI_API_KEY, settings.GEMINI_API_KEY)
