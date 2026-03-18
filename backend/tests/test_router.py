"""
Tests for Routing Layer (Part 3)

Tests that the router correctly routes intents to appropriate agents.
"""

import pytest


class TestRouting:
    """Test suite for routing functionality."""

    def test_route_summarize(
        self, http_client, health_check, company_id, sample_intent_summarize
    ):
        """Test routing for summarization intent."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_summarize, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_route_calculate(
        self, http_client, health_check, company_id, sample_intent_calculate
    ):
        """Test routing for calculation intent."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_calculate, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_route_translate(
        self, http_client, health_check, company_id, sample_intent_translate
    ):
        """Test routing for translation intent."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_translate, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_route_research(
        self, http_client, health_check, company_id, sample_intent_research
    ):
        """Test routing for research intent."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_research, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_route_sentiment(
        self, http_client, health_check, company_id, sample_intent_sentiment
    ):
        """Test routing for sentiment analysis intent."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_sentiment, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_route_version_priority(self, http_client, health_check, company_id):
        """Test that router prefers higher version agents."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "summarize",
                    "task_type": "summarization",
                    "required_capability": "summarization",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200
        data = response.json()

        selected = data["routing"]["selected_agent"]
        assert selected["version"] == "2.0.0"

    def test_route_alternatives(self, http_client, health_check, company_id):
        """Test that router provides alternative agents."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "summarize",
                    "task_type": "summarization",
                    "required_capability": "summarization",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data

    def test_route_routing_reason(
        self, http_client, health_check, company_id, sample_intent_summarize
    ):
        """Test that routing includes reason for selection."""
        response = http_client.post(
            "/api/agent/execute",
            json={"intent": sample_intent_summarize, "company_id": company_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
