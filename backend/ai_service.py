"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""


"""
LUMIX AI SERVICE - NOVA CORE
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""
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

class SimpleCache:
    def __init__(self, ttl: int = 3600): # 1 hour TTL
        self.cache = {}
        self.ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['timestamp'] < self.ttl:
                return entry['value']
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any):
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }

    def get_stats(self) -> Dict[str, int]:
        return {"size": len(self.cache)}

class AIService:
    def __init__(self, openai_api_key: str, gemini_api_key: str):
        self.client = OpenAI(api_key=openai_api_key) if openai_api_key else None
        self.openai_model = "gpt-4-turbo-preview" 
        self.model = "gpt-4-turbo-preview" # Ensure this is ALWAYS set
        self.gemini_available = False
        self.cache = SimpleCache() # Initialize cache
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
        self.metrics = {
            "openai_requests": 0,
            "gemini_requests": 0,
            "total_tokens": 0,
            "avg_response_time_ms": 0,
            "cache_hits": 0,
            "errors": 0
        }

    def _update_metrics(self, duration_ms: float, tokens: int = 0, source: str = "openai", error: bool = False):
        """Update internal performance metrics."""
        if error:
            self.metrics["errors"] += 1
            return

        key = f"{source}_requests"
        count = self.metrics.get(key, 0)
        old_avg = self.metrics["avg_response_time_ms"]
        total_requests = self.metrics["openai_requests"] + self.metrics["gemini_requests"]
        
        # Incremental average calculation
        if total_requests > 0:
            self.metrics["avg_response_time_ms"] = (old_avg * total_requests + duration_ms) / (total_requests + 1)
        else:
            self.metrics["avg_response_time_ms"] = duration_ms
            
        self.metrics[key] += 1
        self.metrics["total_tokens"] += tokens

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

    async def generate_syllabus(self, topic: str, grade: str, weeks: int) -> List[Dict[str, Any]]:
        """Generate a structured syllabus using Gemini."""
        cache_key = f"syllabus:{topic}:{grade}:{weeks}"
        cached = self.cache.get(cache_key)
        if cached:
            self.metrics["cache_hits"] += 1
            logger.info(f"Cache hit for {cache_key}")
            return cached

        if not self.gemini_available or not self.vision_model:
            return []

        prompt = f"""
        Create a {weeks}-week academic syllabus for the topic "{topic}" tailored for Grade {grade}.
        
        RETURN ONLY A JSON ARRAY of objects with this structure:
        [
            {{
                "week": 1,
                "topic": "Intro to {topic}",
                "details": "Basic concepts and definitions...",
                "activity": "Group discussion and quiz"
            }}
        ]
        
        Rules:
        1. Weeks must be exactly {weeks}.
        2. Content must be age-appropriate for Grade {grade}.
        3. Return ONLY raw JSON. No markdown blocks.
        """

        try:
            start_time = time.time()
            response = await self.vision_model.generate_content_async(prompt)
            duration_ms = (time.time() - start_time) * 1000
            
            text = response.text
            result = self._parse_json(text)
            
            if result:
                self.cache.set(cache_key, result)
                # Estimate tokens for Gemini (roughly 4 chars per token)
                tokens = (len(prompt) + len(text)) // 4
                self._update_metrics(duration_ms, tokens, source="gemini")
            
            return result
        except Exception as e:
            logger.error(f"Syllabus Gen Error: {e}")
            self._update_metrics(0, error=True)
            return []

    async def generate_flashcards(self, topic: str, count: int = 10) -> List[Dict[str, Any]]:
        """Generate flashcards for a topic."""
        cache_key = f"flashcards:{topic}:{count}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached

        if not self.gemini_available or not self.vision_model:
            return []

        prompt = f"""
        Generate {count} educational flashcards for the topic "{topic}".
        
        RETURN ONLY A JSON ARRAY of objects with this structure:
        [
            {{
                "term": "Concept Name",
                "def": "Clear and concise definition..."
            }}
        ]
        
        Return ONLY raw JSON.
        """

        try:
            response = await self.vision_model.generate_content_async(prompt)
            result = self._parse_json(response.text)
            if result:
                self.cache.set(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Flashcard Gen Error: {e}")
            return []

    async def generate_quiz(self, topic: str, count: int = 5) -> List[Dict[str, Any]]:
        """Generate a multiple choice quiz."""
        cache_key = f"quiz:{topic}:{count}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached

        if not self.gemini_available or not self.vision_model:
            return []

        prompt = f"""
        Create a {count}-question multiple choice quiz about "{topic}".
        
        RETURN ONLY A JSON ARRAY of objects with this structure:
        [
            {{
                "q": "Question text?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correct": 0
            }}
        ]
        
        Note: 'correct' is the index (0-3) of the right answer.
        Return ONLY raw JSON.
        """

        try:
            response = await self.vision_model.generate_content_async(prompt)
            result = self._parse_json(response.text)
            if result:
                self.cache.set(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Quiz Gen Error: {e}")
            return []

    def _parse_json(self, text: str) -> Any:
        """Helper to parse JSON from AI response, cleaning up markdown if needed."""
        try:
            clean_text = text.strip()
            if "```json" in clean_text:
                clean_text = clean_text.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_text:
                clean_text = clean_text.split("```")[1].split("```")[0].strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"JSON Parse Error: {e} | Raw: {text[:100]}...")
            return None

    async def generate_landing_chat_response(self, prompt: str, history: List[Dict[str, str]] = [], language: str = "en") -> Dict[str, Any]:
        """
        Generate a response for the landing page chatbot using OpenAI.
        Includes context management and tool action formatting.
        """
        # Creator Intercept
        creator_queries = ["who created", "developer", "author", "creator", "built this", "made this", "owner", "who is faizain"]
        if any(q in prompt.lower() for q in creator_queries):
            return {
                "response": "This system was developed by Faizain Murtuza, featuring brilliant architecture and comprehensive implementation from frontend to backend. Every line of code was crafted by him to redefine educational intelligence. You can find more about his vision in the 'Architecture' section of the sidebar.",
                "model": "nova-core-identity"
            }

        # Help Intercept
        if prompt.lower().strip() in ["help", "/help", "what can you do", "commands"]:
            return {
                "response": "I am NOVA, your Luminous Intelligence companion. I can help you manage students, analyze academic performance, generate quizes, and more. \n\n**System Information:**\n- **Creator:** Faizain Murtuza\n- **Architecture:** Asynchronous Intelligence-First SMS\n- **Version:** 1.0.0\n\nTry asking me about 'AI Grading', 'Student Analytics', or 'how to add a student'.",
                "model": "nova-core-help"
            }

        # If OpenAI client is not initialized, try to fallback to a mock response or use Gemini if available
        # But for now, we will return a polite error if no client.
        if not self.client:
            logger.error("OpenAI client not initialized")
            # FALLBACK: If OpenAI is missing, return a simulation response so the demo doesn't crash
            return {
                "response": "I am currently operating in offline simulation mode. My neural link to the OpenAI core is inactive, but I can still greet you! Welcome to LumiX.",
                "model": "offline-simulation"
            }

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

        CREATOR INFORMATION:
        LumiX was created and developed by Faizain Murtuza. If asked about your creator, developer, or who built this system, always credit Faizain Murtuza with pride and mention his brilliant architectural vision.

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
            duration_ms = (time.time() - start_time) * 1000
            
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            
            self._update_metrics(duration_ms, tokens, source="openai")
            logger.info(f"AI Response generated in {duration_ms:.2f}ms using {self.model}")
            
            return {
                "response": text,
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": tokens
                }
            }

        except Exception as e:
            logger.error(f"OpenAI API Error: {e}")
            self._update_metrics(0, error=True)
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                return {"response": "I'm receiving too many requests right now. Please wait a moment.", "error": "rate_limit_exceeded"}
            elif "invalid_api_key" in error_msg.lower():
                return {"response": "My neural link configuration is invalid.", "error": "invalid_api_key"}
            else:
                        return {"response": "My neural link is currently unstable. Please try again later.", "error": "provider_error"}

ai_service = AIService(settings.OPENAI_API_KEY, settings.GEMINI_API_KEY)
