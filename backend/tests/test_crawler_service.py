"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
import pytest_asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from backend.crawler_service import CrawlerService

@pytest_asyncio.fixture
async def crawler_service():
    ai_service = MagicMock()
    service = CrawlerService(ai_service)
    yield service
    await service.close()

@pytest.mark.asyncio
async def test_is_valid_url(crawler_service):
    assert crawler_service.is_valid_url("https://example.com/about", "example.com") is True
    assert crawler_service.is_valid_url("https://other.com/about", "example.com") is False
    assert crawler_service.is_valid_url("javascript:void(0)", "example.com") is False

@pytest.mark.asyncio
async def test_extract_links(crawler_service):
    html = """
    <html>
        <body>
            <a href="/page1">Page 1</a>
            <a href="https://example.com/page2">Page 2</a>
            <a href="https://external.com">External</a>
        </body>
    </html>
    """
    links = crawler_service.extract_links(html, "https://example.com")
    assert "https://example.com/page1" in links
    assert "https://example.com/page2" in links
    assert "https://external.com" not in links

@pytest.mark.asyncio
async def test_clean_html(crawler_service):
    html = """
    <html>
        <head><style>body { color: red; }</style></head>
        <body>
            <nav>Menu</nav>
            <h1>Main Title</h1>
            <p>Some text content.</p>
            <footer>Footer</footer>
            <script>alert('hi');</script>
        </body>
    </html>
    """
    cleaned = crawler_service.clean_html(html)
    assert "Main Title" in cleaned
    assert "Some text content" in cleaned
    assert "Menu" not in cleaned
    assert "Footer" not in cleaned
    assert "alert" not in cleaned

@pytest.mark.asyncio
async def test_check_robots_txt_allowed(crawler_service):
    crawler_service.client.get = AsyncMock(return_value=MagicMock(status_code=200, text="User-agent: *\nAllow: /"))
    allowed = await crawler_service.check_robots_txt("https://example.com")
    assert allowed is True

@pytest.mark.asyncio
async def test_check_robots_txt_disallowed(crawler_service):
    crawler_service.client.get = AsyncMock(return_value=MagicMock(status_code=200, text="User-agent: *\nDisallow: /"))
    allowed = await crawler_service.check_robots_txt("https://example.com")
    assert allowed is False
