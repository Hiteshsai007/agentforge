import sys
import os
from pathlib import Path

backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest

os.environ.setdefault("SUPABASE_URL", "https://iudjozrtichetbdwzgzv.supabase.co")
os.environ.setdefault(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZGpvenJ0aWNoZXRiZHd6Z3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE1MjMsImV4cCI6MjA4OTIzNzUyM30.-jpVp7evqpODeK8UqV7Os6ElKgJCdvdo8ow48J3B68c",
)
os.environ.setdefault("GEMINI_API_KEY", "AIzaSyCr5zbuR5KCCq_-vMPjNJL_RV9_vtkZNSM")

TEST_COMPANY_ID = os.environ.get(
    "TEST_COMPANY_ID", "12a5ff1b-d07e-4aec-a132-36f731c82de0"
)
TEST_API_KEY = os.environ.get(
    "TEST_API_KEY", "sk_company_G240ZmVfbOiMpWq6NwTIUYgzwdHjmGio"
)


@pytest.fixture(scope="session")
def company_id():
    return TEST_COMPANY_ID


@pytest.fixture(scope="session")
def api_key():
    return TEST_API_KEY


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)


@pytest.fixture(scope="session")
def auth_headers(api_key):
    return {
        "X-Company-API-Key": api_key,
        "Content-Type": "application/json",
    }


@pytest.fixture(scope="session")
def health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    return True


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


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "delegation: marks tests for agent delegation")
    config.addinivalue_line("markers", "evolution: marks tests for evolution system")
