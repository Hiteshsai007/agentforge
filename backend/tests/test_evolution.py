"""
Tests for Evolution System (Part 6)

Tests that the system automatically selects better agents
when newer versions are available.
"""

import pytest


@pytest.mark.evolution
class TestEvolution:
    """Test suite for evolution/self-improvement functionality."""

    def test_available_upgrades(self, http_client, health_check, company_id):
        """Test that system reports available upgrades."""
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()

        assert "has_upgrades" in data
        assert "upgrades" in data
        assert "count" in data

        if data["has_upgrades"]:
            assert len(data["upgrades"]) > 0
            upgrade = data["upgrades"][0]
            assert "current_agent_id" in upgrade
            assert "new_agent_id" in upgrade
            assert "new_agent_name" in upgrade
            assert "new_version" in upgrade

    def test_auto_select_better_agent(self, http_client, health_check, company_id):
        """Test that router automatically selects higher version agent."""
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
        # Should select v2.0.0 (better) over v1.5.0
        assert selected["version"] == "2.0.0"

    def test_version_comparison(self, http_client, health_check, company_id):
        """Test that newer versions have higher quality scores."""
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
        alternatives = data["routing"].get("alternatives", [])

        if alternatives:
            selected_score = selected.get("quality_score", 0)
            alt_score = alternatives[0].get("quality_score", 0)
            # Newer version should have higher or equal quality
            assert selected_score >= alt_score

    def test_evolution_alternatives(self, http_client, health_check, company_id):
        """Test that system provides alternative (older) agents."""
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

        alternatives = data["routing"].get("alternatives", [])
        # Should have alternatives showing older versions
        assert len(alternatives) >= 1

    def test_multiple_upgrade_paths(self, http_client, health_check, company_id):
        """Test that multiple agents can have upgrades."""
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()

        if data["has_upgrades"]:
            # Should have at least 2 upgrade paths (Meeting Summarizer and Research Agent)
            assert data["count"] >= 2

    def test_evolution_changelog(self, http_client, health_check, company_id):
        """Test that upgrade information includes changelog."""
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()

        if data["has_upgrades"]:
            for upgrade in data["upgrades"]:
                assert "changelog" in upgrade
                assert upgrade["changelog"] is not None

    def test_evolution_quality_improvement(self, http_client, health_check, company_id):
        """Test that execution quality reflects agent improvement."""
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "research",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Newer Research Agent (v1.6.0) should have higher quality than v1.5.0
        selected = data["routing"]["selected_agent"]
        assert selected["version"] == "1.6.0"
        assert data["quality_score"] > 0.85  # v1.6.0 has higher quality
