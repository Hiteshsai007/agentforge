import pytest
import httpx
import os

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8013")
TEST_COMPANY_ID = os.environ.get(
    "TEST_COMPANY_ID", "12a5ff1b-d07e-4aec-a132-36f731c82de0"
)
TEST_API_KEY = os.environ.get(
    "TEST_API_KEY", "sk_company_G240ZmVfbOiMpWq6NwTIUYgzwdHjmGio"
)


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def company_id():
    return TEST_COMPANY_ID


@pytest.fixture(scope="session")
def api_key():
    return TEST_API_KEY


@pytest.fixture(scope="session")
def http_client(base_url, api_key):
    headers = {"Content-Type": "application/json", "X-Company-API-Key": api_key}
    with httpx.Client(base_url=base_url, headers=headers, timeout=30.0) as client:
        yield client


@pytest.fixture
def sample_intent_summarize():
    return {
        "intent": "summarize",
        "task_type": "summarization",
        "required_capability": "summarization",
        "parameters": {},
        "original_request": "test",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_calculate():
    return {
        "intent": "calculate",
        "task_type": "calculation",
        "required_capability": "mathematics",
        "parameters": {},
        "original_request": "test",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_research():
    return {
        "intent": "research",
        "task_type": "research",
        "required_capability": "research",
        "parameters": {},
        "original_request": "test",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_translate():
    return {
        "intent": "translate",
        "task_type": "translation",
        "required_capability": "translation",
        "parameters": {},
        "original_request": "test",
        "confidence": 0.9,
    }


@pytest.fixture
def sample_intent_sentiment():
    return {
        "intent": "analyze",
        "task_type": "sentiment",
        "required_capability": "sentiment_analysis",
        "parameters": {},
        "original_request": "test",
        "confidence": 0.9,
    }


@pytest.fixture
def health_check(http_client):
    r = http_client.get("/health")
    assert r.status_code == 200
    return True


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "delegation: marks tests for agent delegation")
    config.addinivalue_line("markers", "evolution: marks tests for evolution system")
