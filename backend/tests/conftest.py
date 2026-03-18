"""
Test configuration and fixtures for AI Agent Marketplace tests.
"""

import pytest
import httpx
import os


# Test configuration - using real backend server
BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8013")
TEST_COMPANY_ID = os.environ.get(
    "TEST_COMPANY_ID", "12a5ff1b-d07e-4aec-a132-36f731c82de0"
)
TEST_API_KEY = os.environ.get(
    "TEST_API_KEY", "sk_company_yo36u12W1rojetWyHJyn9yvyCwBK88Pe"
)


@pytest.fixture(scope="session")
def base_url():
    """Base URL for the API."""
    return BASE_URL


@pytest.fixture(scope="session")
def company_id():
    """Test company ID."""
    return TEST_COMPANY_ID


@pytest.fixture(scope="session")
def api_key():
    """Test company API key."""
    return TEST_API_KEY


@pytest.fixture(scope="session")
def http_client(base_url, api_key):
    """HTTP client with auth headers configured."""
    headers = {
        "Content-Type": "application/json",
        "X-Company-API-Key": api_key,
    }
    with httpx.Client(base_url=base_url, headers=headers, timeout=30.0) as client:
        yield client


@pytest.fixture
def api_headers(api_key):
    """Return headers dict for API requests."""
    return {
        "Content-Type": "application/json",
        "X-Company-API-Key": api_key,
    }


@pytest.fixture
def sample_intent_summarize():
    """Sample intent for summarization tasks."""
    return {
        "intent": "summarize",
        "task_type": "summarization",
        "required_capability": "summarization",
        "parameters": {},
        "original_request": "Summarize this document",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_calculate():
    """Sample intent for calculation tasks."""
    return {
        "intent": "calculate",
        "task_type": "calculation",
        "required_capability": "mathematics",
        "parameters": {},
        "original_request": "What is 100 + 200?",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_research():
    """Sample intent for research tasks."""
    return {
        "intent": "research",
        "task_type": "research",
        "required_capability": "research",
        "parameters": {},
        "original_request": "Research AI trends",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_translate():
    """Sample intent for translation tasks."""
    return {
        "intent": "translate",
        "task_type": "translation",
        "required_capability": "translation",
        "parameters": {},
        "original_request": "Translate hello to Spanish",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_sentiment():
    """Sample intent for sentiment analysis tasks."""
    return {
        "intent": "analyze",
        "task_type": "sentiment",
        "required_capability": "sentiment_analysis",
        "parameters": {},
        "original_request": "Analyze sentiment of: I love this product!",
        "confidence": 0.9,
    }


@pytest.fixture
def health_check(http_client):
    """Verify backend is running before tests."""
    response = http_client.get("/health")
    assert response.status_code == 200, "Backend health check failed"
    return True


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "delegation: marks tests for agent delegation")
    config.addinivalue_line("markers", "evolution: marks tests for evolution system")
