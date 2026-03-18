"""
Tests for Agent Execution (Part 4)

Tests that agents correctly execute tasks and return results.
"""

import pytest


class TestAgentExecution:
    """Test suite for agent execution functionality."""

    def test_execute_summarizer(self, http_client, health_check, company_id):
        """Test execution of summarizer agent."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "summarize",
                    "task_type": "summarization",
                    "required_capability": "summarization",
                    "original_request": "Summarize this meeting notes about Q3 results",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "agents_used" in data
        assert "routing" in data

    def test_execute_calculator(self, http_client, health_check, company_id):
        """Test execution of calculator agent."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "calculate",
                    "task_type": "calculation",
                    "required_capability": "mathematics",
                    "original_request": "Calculate 250 + 100",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "d1b711c9-8ba6-461e-823f-2c3cf77babf8"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_execute_translator(self, http_client, health_check, company_id):
        """Test execution of translator agent."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "translate",
                    "task_type": "translation",
                    "required_capability": "translation",
                    "original_request": "Translate hello to French",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "b3d3cfae-4c90-47e8-af61-d970c639c6ac"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_execute_researcher(self, http_client, health_check, company_id):
        """Test execution of research agent."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "research",
                    "required_capability": "research",
                    "original_request": "Research AI trends",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_execute_sentiment(self, http_client, health_check, company_id):
        """Test execution of sentiment analysis agent."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "analyze",
                    "task_type": "sentiment",
                    "required_capability": "sentiment_analysis",
                    "original_request": "Analyze sentiment of: I love this product!",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "25885e8f-1063-40f2-9920-4351fecce7c0"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data
        assert "agents_used" in data

    def test_execute_with_company_api_key(
        self, http_client, health_check, company_id, api_key
    ):
        """Test that company API key authentication works."""
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

    def test_execute_with_specific_agent_id(
        self, http_client, health_check, company_id
    ):
        """Test that specific agent selection via X-Agent-ID works."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "calculate",
                    "task_type": "calculation",
                    "required_capability": "mathematics",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "d1b711c9-8ba6-461e-823f-2c3cf77babf8"},
        )
        assert response.status_code == 200
        data = response.json()
        assert (
            data["routing"]["selected_agent"]["agent_id"]
            == "d1b711c9-8ba6-461e-823f-2c3cf77babf8"
        )

    def test_execute_invalid_agent_id(self, http_client, health_check, company_id):
        """Test that invalid agent ID returns proper error."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "test",
                    "task_type": "test",
                    "required_capability": "test",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "invalid-agent-id"},
        )
        assert response.status_code == 404

    def test_execute_invalid_api_key(self, http_client, health_check, company_id):
        """Test that invalid API key returns proper error."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "test",
                    "task_type": "test",
                    "required_capability": "test",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Company-API-Key": "invalid_key"},
        )
        assert response.status_code == 401

    def test_execution_response_structure(self, http_client, health_check, company_id):
        """Test that execution returns proper response structure."""
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

        required_fields = [
            "execution_id",
            "result",
            "agents_used",
            "execution_time",
            "tokens_used",
            "quality_score",
            "routing",
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
