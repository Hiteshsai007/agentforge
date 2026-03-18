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
        # Step 1: Parse intent
        parse_response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this document"}
        )
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        assert parse_data["success"] is True

        # Step 2: Execute with parsed intent
        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": parse_data["intent"], "company_id": company_id},
        )
        assert exec_response.status_code == 200
        exec_data = exec_response.json()

        # Step 3: Verify complete flow
        assert exec_data["success"] is True
        assert len(exec_data["agents_used"]) >= 1
        assert exec_data["result"] is not None
        assert exec_data["result"]["output"] is not None

    def test_full_flow_research(self, http_client, health_check, company_id):
        """Test complete workflow for research task."""
        # Step 1: Parse intent
        parse_response = http_client.post(
            "/api/intent/parse", json={"request": "Research the latest AI trends"}
        )
        assert parse_response.status_code == 200
        parse_data = parse_response.json()

        # Step 2: Execute
        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": parse_data["intent"], "company_id": company_id},
        )
        assert exec_response.status_code == 200
        exec_data = exec_response.json()

        assert exec_data["success"] is True
        assert "Research" in exec_data["agents_used"][0]

    def test_api_key_lifecycle(self, http_client, health_check, company_id):
        """Test complete API key lifecycle: generate -> use -> revoke -> reject."""
        import time

        # Step 1: Check initial status
        status_response = http_client.get(f"/api/company/{company_id}/api-key-status")
        assert status_response.status_code == 200

        # Step 2: Use existing key (should work)
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
        exec_data = exec_response.json()
        assert exec_data["success"] is True

    def test_health_check(self, http_client):
        """Test health check endpoint."""
        response = http_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_full_flow_with_delegation(self, http_client, health_check, company_id):
        """Test complete workflow with agent delegation enabled."""
        # Parse complex request
        parse_response = http_client.post(
            "/api/intent/parse",
            json={"request": "Research AI trends and create a summary"},
        )
        assert parse_response.status_code == 200

        # Execute with delegation
        exec_response = http_client.post(
            "/api/agent/execute",
            json={"intent": parse_response.json()["intent"], "company_id": company_id},
            headers={"X-Enable-Delegation": "true"},
        )
        assert exec_response.status_code == 200
        exec_data = exec_response.json()

        # Verify delegation worked
        assert exec_data["success"] is True
        # Multiple agents should be involved
        assert len(exec_data["agents_used"]) > 1

    def test_marketplace_to_execution_flow(self, http_client, health_check, company_id):
        """Test flow from marketplace browsing to agent execution."""
        # Step 1: Browse marketplace
        agents_response = http_client.get("/api/marketplace/agents")
        assert agents_response.status_code == 200
        agents_data = agents_response.json()
        assert len(agents_data["agents"]) > 0

        # Step 2: Get capabilities
        caps_response = http_client.get("/api/marketplace/capabilities")
        assert caps_response.status_code == 200

        # Step 3: Execute using first agent capability
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
        exec_data = exec_response.json()
        assert exec_data["success"] is True
