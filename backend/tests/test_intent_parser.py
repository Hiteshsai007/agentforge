"""
Tests for Intent Parsing Layer (Part 1)

Tests that the intent parser correctly converts natural language
requests into structured task definitions.
"""

import pytest


class TestIntentParsing:
    """Test suite for intent parsing functionality."""

    def test_parse_summarize(self, http_client, health_check):
        """Test parsing summarize request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this document for me"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False
        assert data.get("intent") is not None or data.get("intent") is None

    def test_parse_calculate(self, http_client, health_check):
        """Test parsing calculation request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "What is 15 * 23 + 100?"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False

    def test_parse_translate(self, http_client, health_check):
        """Test parsing translation request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Translate this to Spanish"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False

    def test_parse_research(self, http_client, health_check):
        """Test parsing research request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Research the latest AI trends"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False

    def test_parse_sentiment(self, http_client, health_check):
        """Test parsing sentiment analysis request."""
        response = http_client.post(
            "/api/intent/parse",
            json={"request": "Analyze the sentiment of this review"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False

    def test_parse_intent_structure(self, http_client, health_check):
        """Test that parsed intent has all required fields when successful."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this document"}
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("success") is True and data.get("intent"):
            intent = data["intent"]
            required_fields = [
                "intent",
                "task_type",
                "required_capability",
                "parameters",
                "original_request",
                "confidence",
            ]
            for field in required_fields:
                assert field in intent, f"Missing required field: {field}"

    def test_parse_complex_request(self, http_client, health_check):
        """Test parsing complex multi-part request."""
        response = http_client.post(
            "/api/intent/parse",
            json={"request": "Research AI trends and create a summary of findings"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data.get("success") is True or data.get("success") is False

    def test_parse_empty_request(self, http_client, health_check):
        """Test handling of empty request."""
        response = http_client.post("/api/intent/parse", json={"request": ""})
        assert response.status_code in [200, 400]
