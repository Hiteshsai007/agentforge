"""
Tests for Full Demonstration Workflow (Part 7)

Tests the complete user flow from request to result.
"""

import pytest


@pytest.mark.integration
class TestFullWorkflow:
    """Test suite for end-to-end workflow functionality."""

    def test_full_flow_summarize(self, http_client, health_check, company_id):
        """Test complete workflow for summarization task."""
        intent = {
            "intent": "summarize",
            "task_type": "summarization",
            "required_capability": "summarization",
            "original_request": "test",
            "confidence": 0.9,
        }

        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": intent, "company_id": company_id},
        )
        assert exec_response.status_code == 200
        exec_data = exec_response.json()
        assert "agents_used" in exec_data

    def test_full_flow_research(self, http_client, health_check, company_id):
        """Test complete workflow for research task."""
        intent = {
            "intent": "research",
            "task_type": "research",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }

        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": intent, "company_id": company_id},
        )
        assert exec_response.status_code == 200

    def test_api_key_lifecycle(self, http_client, health_check, company_id):
        """Test API key works for authentication."""
        status_response = http_client.get(f"/api/company/{company_id}/api-key-status")
        assert status_response.status_code == 200

        exec_response = http_client.post(
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
        assert exec_response.status_code == 200

    def test_health_check(self, http_client):
        """Test health check endpoint."""
        response = http_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_full_flow_with_delegation(self, http_client, health_check, company_id):
        """Test complete workflow with agent delegation enabled."""
        intent = {
            "intent": "research and summarize",
            "task_type": "complex",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }

        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": intent, "company_id": company_id},
            headers={"X-Enable-Delegation": "true"},
        )
        assert exec_response.status_code == 200

    def test_marketplace_to_execution_flow(self, http_client, health_check, company_id):
        """Test flow from marketplace browsing to agent execution."""
        agents_response = http_client.get("/api/marketplace/agents")
        assert agents_response.status_code == 200
        agents_data = agents_response.json()
        assert len(agents_data["agents"]) > 0

        caps_response = http_client.get("/api/marketplace/capabilities")
        assert caps_response.status_code == 200

        first_cap = agents_data["agents"][0]["capabilities"][0]
        exec_response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "test",
                    "task_type": "test",
                    "required_capability": first_cap,
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert exec_response.status_code == 200
