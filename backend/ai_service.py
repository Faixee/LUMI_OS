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
import re
from typing import List, Dict, Any, Optional
from openai import OpenAI
from backend.config import settings

try:
    import google.generativeai as genai
except Exception as e:
    print(f"AI System: Could not import google-generativeai: {e}")
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
        # Nova Core uses OpenAI GPT-4o
        self.nova_model = "gpt-4o"
        self.model = "gpt-4o" # Default model for Nova operations
        
        self.gemini_available = False
        self.cache = SimpleCache() # Initialize cache
        
        if gemini_api_key and genai:
            try:
                genai.configure(api_key=gemini_api_key)
                # LumiX Core uses Gemini 2.0 Flash (Latest)
                self.lumix_model = genai.GenerativeModel('gemini-2.0-flash')
                self.vision_model = self.lumix_model # Alias for backward compatibility
                self.gemini_available = True
                logger.info("AI System: LumiX (Gemini 2.0 Flash) initialized")
            except Exception as e:
                logger.error(f"AI System: Failed to initialize LumiX (Gemini): {e}")
                self.lumix_model = None
                self.vision_model = None
        else:
            self.lumix_model = None
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
        
        try:
            # Optional: Log strictly internal metrics or persist if needed
            pass
        except Exception as e:
            logger.error(f"Metric update error: {e}")

    async def analyze_reference_material(self, content: str, mime_type: str = "text/plain") -> Dict[str, Any]:
        """
        Analyze reference material (text or image) to extract answer key and criteria.
        """
        prompt = """
        Analyze this reference material (Answer Key / Marking Scheme).
        Extract:
        1. All questions and their correct answers.
        2. Marking criteria or rubric (points per question, partial credit rules).
        3. Total marks available.
        
        Return JSON:
        {
            "answers": [{"q": "1", "answer": "The powerhouse of the cell", "marks": 2}, ...],
            "total_marks": 100,
            "criteria": "Summary of grading rules...",
            "summary": "Brief overview of the paper topic"
        }
        """
        
        if self.gemini_available and self.vision_model:
            try:
                # If it's an image
                if mime_type.startswith("image/"):
                    response = await self.vision_model.generate_content_async([prompt, {"mime_type": mime_type, "data": content}])
                else:
                    # Text content
                    response = await self.vision_model.generate_content_async([prompt, f"CONTENT:\n{content}"])
                
                return self._parse_json(response.text)
            except Exception as e:
                logger.error(f"Reference Analysis Error: {e}")
                raise
        
        # Fallback for text only via OpenAI
        if not mime_type.startswith("image/") and self.client:
             response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a teacher's assistant."},
                    {"role": "user", "content": f"{prompt}\n\nCONTENT:\n{content}"}
                ],
                response_format={"type": "json_object"}
            )
             return json.loads(response.choices[0].message.content)
             
        return {"error": "AI service unavailable for this operation"}

    async def process_vision_grading(self, image_data: bytes, mime_type: str, context: str = "", reference_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Process an image/document for grading using Gemini Vision or OpenAI Vision.
        """
        ref_context = ""
        if reference_data:
            ref_context = f"""
            REFERENCE ANSWER KEY:
            {json.dumps(reference_data.get('answers', []), indent=2)}
            
            GRADING CRITERIA:
            {reference_data.get('criteria', 'Standard academic grading')}
            
            IMPORTANT: Compare the student's work strictly against this reference. 
            Highlight deviations. Calculate score based on the provided marks distribution.
            """

        prompt = f"""
        You are an expert academic evaluator. Analyze the attached document/image and provide a detailed grading report.
        
        CONTEXT: {context}
        {ref_context}

        INSTRUCTIONS:
        1. Identify the student name if visible.
        2. Evaluate the content based on academic standards {'and the provided REFERENCE KEY' if reference_data else ''}.
        3. Provide a score out of {reference_data.get('total_marks', 100) if reference_data else '100'}.
        4. Give detailed feedback with specific points (✅ for correct, ❌ for errors, ⚠️ for warnings).
        5. Generate a few 'annotations' which are specific areas of interest (as text descriptions).
        6. Generate 'insights' about the student's learning patterns.
        {'7. Calculate a reference_match_score (0-100) indicating how closely they followed the key.' if reference_data else ''}

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
            }},
            "reference_match_score": 95.0
        }}
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                logger.info("Attempting Gemini Vision...")
                start_time = time.time()
                # Prepare image part
                image_part = {
                    "mime_type": mime_type,
                    "data": image_data
                }

                response = await self.vision_model.generate_content_async([prompt, image_part])
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                # Check for parsing error and return fallback
                if "error" in result:
                    logger.warning(f"Gemini Vision JSON Parse Failed. Raw: {text[:200]}")
                    return {
                        "student": "Unknown Student",
                        "score": 0,
                        "feedback": "Automated Grading Failed: The AI could not process this image via Gemini.",
                        "annotations": [],
                        "insights": {
                            "strengths": ["N/A"],
                            "weaknesses": ["Image processing failed"],
                            "recommendation": "Please try again or use a different image."
                        },
                        "flags": ["System Error"],
                        "grading_confidence": 0.0
                    }

                self._update_metrics(duration_ms, source="gemini")
                return result
            except Exception as e:
                logger.error(f"Gemini Vision Error: {e}")

        # Fallback to OpenAI Vision
        if self.client:
            try:
                logger.info("Attempting OpenAI Vision Fallback...")
                start_time = time.time()
                
                # Convert image data to base64 for OpenAI
                import base64 as b64
                base64_image = b64.b64encode(image_data).decode('utf-8')
                
                # Log a small part of the base64 and mime type for debugging
                logger.info(f"OpenAI Vision Attempt - Mime: {mime_type}, Base64 length: {len(base64_image)}")

                # Verify base64 image is not empty
                if not base64_image:
                    logger.error("Empty base64 image data")
                    return {"error": "Failed to process image data"}

                response = self.client.chat.completions.create(
                    model=self.nova_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a vision-capable AI that provides academic grading. You MUST return valid JSON matching the requested structure. Even if you cannot see the image clearly, provide a best guess or empty structure in JSON. JSON structure: {\"student\": \"string\", \"score\": number, \"feedback\": \"string\", \"annotations\": [{\"point\": \"string\", \"comment\": \"string\"}], \"insights\": {\"strengths\": [\"string\"], \"weaknesses\": [\"string\"], \"recommendation\": \"string\"}, \"flags\": [\"string\"], \"grading_confidence\": number}"
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1000,
                    response_format={"type": "json_object"}
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                # Check for parsing error and return fallback
                if "error" in result:
                    logger.warning(f"OpenAI Vision JSON Parse Failed. Raw: {text[:200]}")
                    return {
                        "student": "Unknown Student",
                        "score": 0,
                        "feedback": "Automated Grading Failed: The AI could not process this image. It may not be recognized as an academic document. Please try uploading a clearer image of an assignment.",
                        "annotations": [],
                        "insights": {
                            "strengths": ["N/A"],
                            "weaknesses": ["Image not recognized as academic content"],
                            "recommendation": "Upload a clear image of a student assignment or quiz."
                        },
                        "flags": ["Parsing Error"],
                        "grading_confidence": 0.0
                    }

                self._update_metrics(duration_ms, source="openai")
                return result
            except Exception as e:
                logger.error(f"OpenAI Vision Error: {e}")

        return {"error": "All vision links are currently offline. Please check your API configuration."}

    async def predict_performance(self, student_data: Dict[str, Any]) -> str:
        """Predict student performance based on historical data."""
        prompt = f"""
        Predict future performance for the following student:
        Name: {student_data.get('name')}
        GPA: {student_data.get('gpa')}
        Attendance: {student_data.get('attendance') or 0}%
        Behavior Score: {student_data.get('behavior_score') or 0}
        
        Analyze patterns and provide a 2-3 sentence prediction about their academic trajectory.
        Be professional and supportive.
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                if text:
                    self._update_metrics(duration_ms, source="gemini")
                    return text
            except Exception as e:
                logger.error(f"Gemini Prediction Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a predictive analytics engine for educational success."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                if text:
                    self._update_metrics(duration_ms, source="openai")
                    return text
            except Exception as e:
                logger.error(f"OpenAI Prediction Error: {e}")

        return "Performance prediction unavailable at this moment."

    async def solve_educational_problem(self, subject: str, topic: str, difficulty: str, grade: str, problem: str) -> Dict[str, Any]:
        """
        Solve an educational problem with step-by-step explanation and verification.
        """
        # Subject-specific guidance
        subject_guidance = {
            "mathematics": """Ensure all mathematical notations use LaTeX format (e.g., $x^2$). 
            CRITICAL: Perform actual numerical arithmetic. Never concatenate numbers as strings (e.g., 10 + 10 is 20, NOT 1010).
            Follow BODMAS rules strictly. For basic addition, show column-wise or place-value breakdown (tens, ones).
            Ensure the output shows the correct calculation: "10 + 10 = 20".""",
            "physics": "Include relevant laws of physics (Newton's laws, Thermodynamics, etc.). Show unit conversions clearly. Use standard scientific notation.",
            "chemistry": "Use proper chemical notation for formulas (e.g., H₂O). Include balanced equations where applicable. Explain bonding and stoichiometry steps clearly."
        }.get(subject.lower(), "Provide a clear academic explanation.")

        prompt = f"""
        You are an advanced Neural Tutor (NOVA Core) specialized in {subject}.
        
        TASK: Solve the following problem for a Grade {grade} student at an {difficulty} difficulty level.
        
        SUBJECT: {subject}
        TOPIC: {topic}
        DIFFICULTY: {difficulty}
        GRADE LEVEL: Grade {grade}
        PROBLEM: {problem}
        
        GUIDANCE: {subject_guidance}
        
        INSTRUCTIONS:
        1. ANALYZE: Break down the problem and identify key concepts.
        2. TYPE CHECKING: Distinguish clearly between numerical values and string representations. Perform arithmetic operations on numbers.
        3. STEP-BY-STEP SOLUTION: Provide a detailed, logical sequence of steps.
           - For addition: Explain place value (e.g., 1+1 in tens place = 2, 0+0 in ones place = 0).
           - Do NOT repeat operands in the result (e.g., no "1010+1010=2020").
        4. VERIFICATION: Perform a self-check to ensure mathematical accuracy. Ensure the step-by-step explanation matches the final computation.
        5. EXPLANATION: Use clear, pedagogical language appropriate for Grade {grade}.
        6. FORMATTING: Use Markdown. Use LaTeX for ALL mathematical formulas.
        
        RETURN ONLY A JSON OBJECT with this structure:
        {{
            "subject": "{subject}",
            "difficulty": "{difficulty}",
            "steps": [
                {{"title": "Step 1: Identify the Operation", "content": "..."}},
                {{"title": "Step 2: Perform the Arithmetic Calculation", "content": "..."}}
            ],
            "final_answer": "The final result clearly stated (e.g., 10 + 10 = 20).",
            "verification_status": "Verified",
            "pedagogical_note": "..."
        }}
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                self._update_metrics(duration_ms, source="gemini")
                return result
            except Exception as e:
                logger.error(f"Gemini Solver Error: {e}")
                # Fall through to OpenAI

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional educational tutor specializing in solving problems accurately."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2048
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                self._update_metrics(duration_ms, source="openai")
                return result
            except Exception as e:
                logger.error(f"OpenAI Solver Error: {e}")

        return {"error": "All neural links are currently offline. Please check your API configuration."}

    async def analyze_url(self, url: str, site_snippet: str) -> Dict[str, Any]:
        """Analyze a school website to extract brand identity."""
        prompt = f"""
        Act as a professional Brand Architect and Web Analyst.
        Target URL: {url}
        
        {site_snippet}
        
        Analyze the school identity and extract/synthesize the following:
        1. Official School Name (Clean, formal version)
        2. School Motto or Tagline (If found in HTML, use it. Otherwise, synthesize a professional one)
        3. PRIMARY BRAND COLOR (The dominant color. MUST be a valid HEX code)
        4. SECONDARY BRAND COLOR (The accent color. MUST be a valid HEX code)
        5. LOGO URL (Look for the main logo in the header, favicon, or og:image. If it's a relative path, resolve it to a full URL. If not found, use a professional placeholder)
        6. Brief Brand Context (3-4 sentences about their mission and values based on the content)
        
        Return ONLY a JSON object in this exact format:
        {{
            "name": "string",
            "motto": "string",
            "primaryColor": "string",
            "secondaryColor": "string",
            "logoUrl": "string",
            "websiteContext": "string"
        }}
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                self._update_metrics(duration_ms, source="gemini")
                return result
            except Exception as e:
                logger.error(f"Gemini URL Analysis Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional brand analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                self._update_metrics(duration_ms, source="openai")
                return result
            except Exception as e:
                logger.error(f"OpenAI URL Analysis Error: {e}")

        return {"error": "Brand analysis service is currently offline."}

    async def chat(self, prompt: str, context: str = "") -> str:
        """Generic AI chat functionality."""
        full_prompt = f"{context}\n\n{prompt}" if context else prompt

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(full_prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                if text:
                    self._update_metrics(duration_ms, source="gemini")
                    return text
            except Exception as e:
                logger.error(f"Gemini Chat Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are NOVA, a helpful AI assistant for the LUMI OS educational platform."},
                        {"role": "user", "content": full_prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                if text:
                    self._update_metrics(duration_ms, source="openai")
                    return text
            except Exception as e:
                logger.error(f"OpenAI Chat Error: {e}")

        return "I'm sorry, I'm having trouble connecting to my neural network right now."

    async def generate_syllabus(self, topic: str, grade: str, weeks: int = 4) -> Dict[str, Any]:
        """Generate a structured syllabus using Gemini."""
        cache_key = f"syllabus:{topic}:{grade}:{weeks}"
        cached = self.cache.get(cache_key)
        if cached:
            self.metrics["cache_hits"] += 1
            logger.info(f"Cache hit for {cache_key}")
            return cached

        prompt = f"""
        Generate a comprehensive {weeks}-week educational syllabus for the topic "{topic}" appropriate for Grade {grade}.
        
        The syllabus should be structured by week and include:
        1. Week Title
        2. Learning Objectives
        3. Key Concepts
        4. Brief Activity Idea
        
        RETURN ONLY A JSON OBJECT with this structure:
        {{
            "topic": "{topic}",
            "grade": "{grade}",
            "weeks": [
                {{
                    "week": 1,
                    "title": "Introduction to...",
                    "objectives": ["...", "..."],
                    "concepts": ["...", "..."],
                    "activity": "..."
                }}
            ]
        }}
        
        Return ONLY raw JSON.
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="gemini")
                    return result
            except Exception as e:
                logger.error(f"Gemini Syllabus Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional academic curriculum designer."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="openai")
                    return result
            except Exception as e:
                logger.error(f"OpenAI Syllabus Error: {e}")

        # Return a meaningful structure if both AI fail
        return {
            "topic": topic,
            "grade": grade,
            "weeks": [
                {
                    "week": i + 1,
                    "title": f"Intro to {topic} - Part {i + 1}",
                    "objectives": ["Understand core concepts", "Identify key terminology"],
                    "concepts": [topic, "Fundamental principles"],
                    "activity": "Guided research and discussion"
                } for i in range(weeks)
            ]
        }

    async def generate_flashcards(self, topic: str, count: int = 10) -> List[Dict[str, Any]]:
        """Generate flashcards for a topic."""
        cache_key = f"flashcards:{topic}:{count}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached

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

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="gemini")
                    return result
            except Exception as e:
                logger.error(f"Gemini Flashcard Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional educational content creator."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="openai")
                    return result
            except Exception as e:
                logger.error(f"OpenAI Flashcard Error: {e}")

        return []

    async def generate_quiz(self, topic: str, count: int = 5) -> List[Dict[str, Any]]:
        """Generate a multiple choice quiz."""
        cache_key = f"quiz:{topic}:{count}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached

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

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="gemini")
                    return result
            except Exception as e:
                logger.error(f"Gemini Quiz Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional educational assessment designer."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                result = self._parse_json(text)
                
                if result:
                    self.cache.set(cache_key, result)
                    tokens = (len(prompt) + len(text)) // 4
                    self._update_metrics(duration_ms, tokens, source="openai")
                    return result
            except Exception as e:
                logger.error(f"OpenAI Quiz Error: {e}")

        return []

    async def generate_report(self, student_data: Dict[str, Any]) -> str:
        """Generate a weekly academic report for a student."""
        prompt = f"""
        Generate a comprehensive weekly academic report for the following student:
        Name: {student_data.get('name')}
        GPA: {student_data.get('gpa')}
        Attendance: {student_data.get('attendance')}%
        Behavior: {student_data.get('behavior_score')}
        Notes: {student_data.get('notes')}
        
        The report should be professional, encouraging, and provide actionable insights for parents.
        Use Markdown formatting.
        """

        # Try Gemini first
        if self.gemini_available and self.vision_model:
            try:
                start_time = time.time()
                response = await self.vision_model.generate_content_async(prompt)
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.text
                if text:
                    self._update_metrics(duration_ms, source="gemini")
                    return text
            except Exception as e:
                logger.error(f"Gemini Report Error: {e}")

        # Fallback to OpenAI
        if self.client:
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional academic advisor and counselor."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                duration_ms = (time.time() - start_time) * 1000
                
                text = response.choices[0].message.content
                if text:
                    self._update_metrics(duration_ms, source="openai")
                    return text
            except Exception as e:
                logger.error(f"OpenAI Report Error: {e}")

        return "Report generation failed. Please try again later."

    def _parse_json(self, text: str) -> Any:
        """Helper to parse JSON from AI response, cleaning up markdown if needed."""
        try:
            clean_text = text.strip()
            # If it's a markdown response but NOT JSON, try to extract anything that looks like JSON
            if "{" not in clean_text and "[" not in clean_text:
                 # This might be a conversational response from a model that failed vision
                 logger.warning(f"AI returned non-JSON text: {text[:100]}...")
                 return {"error": "AI failed to return structured data", "raw": text}

            if "```json" in clean_text:
                clean_text = clean_text.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_text:
                clean_text = clean_text.split("```")[1].split("```")[0].strip()
            
            # Remove any trailing commas before closing braces/brackets
            clean_text = re.sub(r',\s*([\]}])', r'\1', clean_text)
            
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"JSON Parse Error: {e} | Raw: {text[:200]}...")
            # Try one more aggressive cleanup: find first { and last }
            try:
                start = clean_text.find("{")
                end = clean_text.rfind("}") + 1
                if start != -1 and end != 0:
                    return json.loads(clean_text[start:end])
            except:
                pass

            # Fallback: if it fails, try a very simple cleanup
            try:
                # Replace single backslashes with double backslashes, but avoid tripling existing double backslashes
                fixed_text = re.sub(r'(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', clean_text)
                return json.loads(fixed_text)
            except:
                return {"error": "Structured data parsing failed", "raw": text}

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

        # If OpenAI client is not initialized, try to fallback to Gemini if available
        if not self.client:
            if self.gemini_available and self.lumix_model:
                logger.info("OpenAI client not initialized, falling back to Gemini for landing chat")
                return await self._generate_gemini_landing_chat_response(prompt, history, language)
            
            logger.error("OpenAI client not initialized and Gemini unavailable")
            # FALLBACK: If both are missing, return a simulation response so the demo doesn't crash
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
            
            # Fallback to Gemini if OpenAI fails
            if self.gemini_available and self.lumix_model:
                logger.info("OpenAI failed, falling back to Gemini for landing chat")
                return await self._generate_gemini_landing_chat_response(prompt, history, language)
                
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                return {"response": "I'm receiving too many requests right now. Please wait a moment.", "error": "rate_limit_exceeded"}
            elif "invalid_api_key" in error_msg.lower():
                return {"response": "My neural link configuration is invalid.", "error": "invalid_api_key"}
            else:
                return {"response": "My neural link is currently unstable. Please try again later.", "error": "provider_error"}

    async def _generate_gemini_landing_chat_response(self, prompt: str, history: List[Dict[str, str]] = [], language: str = "en") -> Dict[str, Any]:
        """Gemini fallback for landing page chat."""
        # Reuse the system prompt logic but adapt for Gemini
        lang_instructions = {
            "ur": "Respond strictly in Urdu script (اردو).",
            "hi": "Respond strictly in Hindi Devanagari script (हिन्दी).",
            "ar": "Respond strictly in Arabic script (العربية).",
            "fr": "Respond in elegant French (Français).",
            "es": "Respond in professional Spanish (Español)."
        }
        target_lang_instruction = lang_instructions.get(language, "Respond in natural, professional English.")
        
        system_prompt = f"You are NOVA, the soulful AI companion for LumiX. Created by Faizain Murtuza. {target_lang_instruction}"
        
        # Format history for Gemini
        # Gemini uses 'user' and 'model' (instead of 'assistant')
        chat = self.lumix_model.start_chat(history=[])
        
        # In simple implementation, we'll just send the full context as one prompt
        # to avoid complex history conversion for now
        context_str = "\n".join([f"{h['role']}: {h['content']}" for h in history[-5:]])
        full_prompt = f"{system_prompt}\n\nContext:\n{context_str}\n\nUser: {prompt}"
        
        try:
            start_time = time.time()
            response = await self.lumix_model.generate_content_async(full_prompt)
            duration_ms = (time.time() - start_time) * 1000
            
            self._update_metrics(duration_ms, source="gemini")
            
            return {
                "response": response.text,
                "model": "gemini-2.0-flash-fallback"
            }
        except Exception as e:
            logger.error(f"Gemini Fallback Error: {e}")
            return {"response": "My neural links are completely offline. Please check back later."}

ai_service = AIService(settings.OPENAI_API_KEY, settings.GEMINI_API_KEY)
