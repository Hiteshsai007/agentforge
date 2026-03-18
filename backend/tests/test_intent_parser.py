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

        assert data["success"] is True
        assert data["intent"] is not None
        assert data["intent"]["task_type"] == "summarization"
        assert "summarization" in data["intent"]["required_capability"]

    def test_parse_calculate(self, http_client, health_check):
        """Test parsing calculation request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "What is 15 * 23 + 100?"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["intent"] is not None
        assert data["intent"]["task_type"] in ["calculation", "other"]

    def test_parse_translate(self, http_client, health_check):
        """Test parsing translation request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Translate this to Spanish"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["intent"] is not None
        assert data["intent"]["task_type"] == "translation"
        assert "translation" in data["intent"]["required_capability"]

    def test_parse_research(self, http_client, health_check):
        """Test parsing research request."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Research the latest AI trends"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["intent"] is not None
        assert data["intent"]["task_type"] == "research"
        assert "research" in data["intent"]["required_capability"]

    def test_parse_sentiment(self, http_client, health_check):
        """Test parsing sentiment analysis request."""
        response = http_client.post(
            "/api/intent/parse",
            json={"request": "Analyze the sentiment of this review"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["intent"] is not None
        assert data["intent"]["task_type"] in ["sentiment", "sentiment_analysis"]

    def test_parse_intent_structure(self, http_client, health_check):
        """Test that parsed intent has all required fields."""
        response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this document"}
        )
        assert response.status_code == 200
        data = response.json()

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

        assert data["success"] is True
        assert data["intent"] is not None
        # Complex request might have multiple capabilities
        assert len(data["intent"]["required_capability"]) >= 1

    def test_parse_empty_request(self, http_client, health_check):
        """Test handling of empty request."""
        response = http_client.post("/api/intent/parse", json={"request": ""})
        # Should return error or empty intent
        assert response.status_code in [200, 400]
