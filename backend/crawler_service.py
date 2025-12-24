
import httpx
import logging
import asyncio
import re
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Any, Optional, Set
from backend.ai_service import AIService
from backend.schemas import CrawlerResponse

logger = logging.getLogger("crawler_service")

class CrawlerService:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        self.visited_urls: Set[str] = set()

    async def close(self):
        await self.client.aclose()

    def is_valid_url(self, url: str, base_domain: str) -> bool:
        parsed = urlparse(url)
        return parsed.netloc == base_domain and parsed.scheme in ["http", "https"]

    async def check_robots_txt(self, base_url: str) -> bool:
        """Simple robots.txt check. In production, use a library like urllib.robotparser."""
        try:
            robots_url = urljoin(base_url, "/robots.txt")
            res = await self.client.get(robots_url)
            if res.status_code == 200:
                # Basic check: if 'Disallow: /' is present, we respect it
                if "Disallow: /" in res.text and "Allow: /" not in res.text:
                    return False
            return True
        except Exception:
            return True # Assume allowed if robots.txt is missing or error

    async def fetch_page(self, url: str) -> Optional[str]:
        try:
            logger.info(f"Fetching: {url}")
            res = await self.client.get(url)
            if res.status_code == 200:
                return res.text
            return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def extract_links(self, html: str, base_url: str) -> List[str]:
        soup = BeautifulSoup(html, "html.parser")
        base_domain = urlparse(base_url).netloc
        links = []
        for a in soup.find_all("a", href=True):
            full_url = urljoin(base_url, a["href"])
            # Remove fragments and queries for cleaner crawling
            clean_url = full_url.split("#")[0].split("?")[0].rstrip("/")
            if self.is_valid_url(clean_url, base_domain) and clean_url not in self.visited_urls:
                links.append(clean_url)
        return list(set(links))

    def clean_html(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        # Remove scripts and styles
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text and clean whitespace
        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = "\n".join(chunk for chunk in chunks if chunk)
        
        # Limit text size for LLM context (approx 8k chars)
        return text[:8000]

    async def neural_parse(self, content_chunks: List[str]) -> Dict[str, Any]:
        """
        Uses Gemini to understand the aggregated content from multiple pages.
        """
        combined_text = "\n--- NEW PAGE CONTENT ---\n".join(content_chunks)
        
        prompt = f"""
        You are an advanced institutional analyst. I will provide you with text extracted from a school's website.
        Your task is to extract specific information with high accuracy.

        REQUIRED FIELDS:
        1. School Name: Official name of the institution.
        2. Designation: Is it a Primary School, High School, K-12, University, Vocational Center, etc.? (CRITICAL)
        3. Motto: Core philosophy or mission statement.
        4. Educational Focus: Primary vector (e.g., STEM, Arts, Holistic, Traditional, IB).
        5. Secondary Programs: List of other offerings (e.g., Sports, Music, AP courses, Exchange programs).
        6. Other Info: Any relevant facts like location, founded date, or unique facilities.

        CONTENT FROM WEBSITE:
        {combined_text}

        RETURN ONLY A JSON OBJECT with this structure:
        {{
            "school_name": "Name",
            "designation": "Designation",
            "motto": "Motto",
            "educational_focus": "Focus",
            "secondary_programs": ["Prog1", "Prog2"],
            "other_info": {{ "key": "value" }}
        }}
        """

        try:
            # We use the existing vision_model (Gemini 3 Flash) but pass text
            # AIService needs a generic 'generate' method or we use vision_model with just text parts
            # Since Gemini 3 Flash is multimodal, it accepts text-only prompts too.
            
            response = await self.ai_service.vision_model.generate_content_async(prompt)
            # Extract JSON from response text (handle potential markdown formatting)
            text_resp = response.text
            json_match = re.search(r"\{.*\}", text_resp, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {}
        except Exception as e:
            logger.error(f"Neural parsing error: {e}")
            return {}

    async def crawl(self, start_url: str, max_depth: int = 2) -> CrawlerResponse:
        self.visited_urls.clear()
        content_chunks = []
        errors = []
        
        if not await self.check_robots_txt(start_url):
            return CrawlerResponse(
                school_name="Unknown",
                designation="N/A",
                status="Blocked by robots.txt",
                errors=["Access denied by robots.txt"]
            )

        queue = [(start_url, 0)]
        self.visited_urls.add(start_url)

        while queue:
            url, depth = queue.pop(0)
            if depth > max_depth:
                continue

            html = await self.fetch_page(url)
            if not html:
                errors.append(f"Failed to fetch {url}")
                continue

            # Extract content for neural parsing
            cleaned_text = self.clean_html(html)
            content_chunks.append(cleaned_text)

            # Find more links if not at max depth
            if depth < max_depth:
                new_links = self.extract_links(html, url)
                for link in new_links:
                    if link not in self.visited_urls:
                        self.visited_urls.add(link)
                        queue.append((link, depth + 1))
            
            # Limit total pages to avoid excessive token usage/cost
            if len(content_chunks) >= 5: 
                break

        if not content_chunks:
            return CrawlerResponse(
                school_name="Unknown",
                designation="N/A",
                status="Failed",
                errors=errors or ["No content found"]
            )

        # Final Neural Extraction
        extracted_data = await self.neural_parse(content_chunks)
        
        return CrawlerResponse(
            school_name=extracted_data.get("school_name", "Unknown"),
            designation=extracted_data.get("designation", "Unknown"),
            motto=extracted_data.get("motto"),
            educational_focus=extracted_data.get("educational_focus"),
            secondary_programs=extracted_data.get("secondary_programs", []),
            other_info=extracted_data.get("other_info", {}),
            status="Success",
            errors=errors
        )
