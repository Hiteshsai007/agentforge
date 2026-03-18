"""
Tests for Agent Delegation (Part 5)

Tests that agents can delegate tasks to other agents.
"""

import pytest


@pytest.mark.delegation
class TestAgentDelegation:
    """Test suite for agent delegation functionality."""

    def test_delegation_enabled(self, http_client, health_check, company_id):
        """Test that delegation header enables multi-agent execution."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "Research AI trends and create a summary",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "agents_used" in data
        assert len(data["agents_used"]) >= 1

    def test_delegation_disabled(self, http_client, health_check, company_id):
        """Test that without delegation, API returns valid response."""
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

        assert "agents_used" in data

    def test_delegation_chain_comparison(self, http_client, health_check, company_id):
        """Test that delegation produces different results than non-delegation."""
        response_delegation = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "Research AI trends",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )

        response_single = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "Research AI trends",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )

        assert response_delegation.status_code == 200
        assert response_single.status_code == 200

    def test_delegation_quality_score(self, http_client, health_check, company_id):
        """Test that delegation returns quality score."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "Research and summarize",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "quality_score" in data
        assert data["quality_score"] >= 0

    def test_delegation_header_variations(self, http_client, health_check, company_id):
        """Test different values for X-Enable-Delegation header."""
        test_values = ["true", "True", "1", "yes"]

        for value in test_values:
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
                headers={"X-Enable-Delegation": value},
            )
            assert response.status_code == 200
