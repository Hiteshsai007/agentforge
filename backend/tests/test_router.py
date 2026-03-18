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

        assert data["success"] is True
        assert data["routing"] is not None

        selected = data["routing"]["selected_agent"]
        assert selected is not None
        assert "Summar" in selected["agent_name"] or "summar" in str(
            selected["capabilities"]
        )

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

        assert data["success"] is True
        selected = data["routing"]["selected_agent"]
        assert selected is not None
        assert (
            "Calculator" in selected["agent_name"]
            or "mathematics" in selected["capabilities"]
        )

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

        assert data["success"] is True
        selected = data["routing"]["selected_agent"]
        assert selected is not None
        assert (
            "Translator" in selected["agent_name"]
            or "translation" in selected["capabilities"]
        )

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

        assert data["success"] is True
        selected = data["routing"]["selected_agent"]
        assert selected is not None
        assert (
            "Research" in selected["agent_name"]
            or "research" in selected["capabilities"]
        )

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

        assert data["success"] is True
        selected = data["routing"]["selected_agent"]
        assert selected is not None
        assert "Sentiment" in selected["agent_name"] or "sentiment" in str(
            selected["capabilities"]
        )

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
        # Should select v2.0.0 over v1.5.0
        assert selected["version"] == "2.0.0", (
            f"Expected v2.0.0, got {selected['version']}"
        )

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

        # Should have alternatives if multiple versions exist
        alternatives = data["routing"].get("alternatives", [])
        if len(alternatives) > 0:
            # Alternative should be lower version
            assert (
                data["routing"]["selected_agent"]["version"]
                > alternatives[0]["version"]
            )

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

        assert "routing_reason" in data["routing"]
        assert data["routing"]["routing_reason"] is not None
        assert len(data["routing"]["routing_reason"]) > 0
