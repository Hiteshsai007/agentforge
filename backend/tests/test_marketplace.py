"""
Tests for Agent Registry / Marketplace (Part 2)

Tests that the marketplace correctly lists agents and capabilities.
"""

import pytest


class TestMarketplace:
    """Test suite for marketplace/registry functionality."""

    def test_list_all_agents(self, http_client, health_check):
        """Test that all marketplace agents are listed."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        assert "agents" in data
        assert len(data["agents"]) >= 9, "Expected at least 9 agents in marketplace"
        assert data["total"] >= 9

    def test_list_capabilities(self, http_client, health_check):
        """Test that all available capabilities are listed."""
        response = http_client.get("/api/marketplace/capabilities")
        assert response.status_code == 200
        data = response.json()

        assert "capabilities" in data
        assert len(data["capabilities"]) >= 15, "Expected at least 15 capabilities"

        # Check for common capabilities
        expected_caps = [
            "summarization",
            "research",
            "translation",
            "mathematics",
            "sentiment_analysis",
        ]
        for cap in expected_caps:
            assert cap in data["capabilities"], f"Missing capability: {cap}"

    def test_agent_metadata_structure(self, http_client, health_check):
        """Test that agent metadata has all required fields."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        agent = data["agents"][0]
        required_fields = [
            "agent_id",
            "agent_name",
            "provider",
            "version",
            "description",
            "capabilities",
            "input_type",
            "output_type",
        ]
        for field in required_fields:
            assert field in agent, f"Missing required field: {field}"

    def test_agent_has_capabilities(self, http_client, health_check):
        """Test that agents have proper capabilities list."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        for agent in data["agents"]:
            assert "capabilities" in agent
            assert isinstance(agent["capabilities"], list)
            assert len(agent["capabilities"]) > 0

    def test_multiple_agent_versions(self, http_client, health_check):
        """Test that marketplace has agents with multiple versions."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        # Group by agent name
        agents_by_name = {}
        for agent in data["agents"]:
            name = agent["agent_name"]
            if name not in agents_by_name:
                agents_by_name[name] = []
            agents_by_name[name].append(agent)

        # Check for multiple versions
        multi_version = {
            name: agents for name, agents in agents_by_name.items() if len(agents) > 1
        }
        assert len(multi_version) >= 1, (
            "Expected at least one agent with multiple versions"
        )

        # Verify versions are different
        for name, agents in multi_version.items():
            versions = [a["version"] for a in agents]
            assert len(set(versions)) > 1, (
                f"Multiple agents with same version for {name}"
            )

    def test_agent_input_output_types(self, http_client, health_check):
        """Test that agents have proper input/output types."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        for agent in data["agents"]:
            assert agent["input_type"] in ["text", "image", "audio", "video", "file"]
            assert agent["output_type"] in [
                "text",
                "image",
                "audio",
                "video",
                "file",
                "json",
            ]

    def test_agent_providers(self, http_client, health_check):
        """Test that agents have provider information."""
        response = http_client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()

        for agent in data["agents"]:
            assert "provider" in agent
            assert agent["provider"] is not None
            assert len(agent["provider"]) > 0

    def test_filter_agents_by_capability(self, http_client, health_check):
        """Test filtering agents by capability."""
        response = http_client.get("/api/marketplace/agents?capability=summarization")
        assert response.status_code == 200
        data = response.json()

        # All returned agents should have summarization capability
        for agent in data["agents"]:
            assert "summarization" in agent["capabilities"]
