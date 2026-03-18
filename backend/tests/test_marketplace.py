import pytest


class TestMarketplace:
    def test_list_all_agents(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        data = r.json()
        assert "agents" in data
        assert len(data["agents"]) >= 9

    def test_list_capabilities(self, http_client, health_check):
        r = http_client.get("/api/marketplace/capabilities")
        assert r.status_code == 200
        data = r.json()
        assert "capabilities" in data
        assert len(data["capabilities"]) >= 15

    def test_agent_metadata_structure(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        agent = r.json()["agents"][0]
        for field in [
            "agent_id",
            "agent_name",
            "provider",
            "version",
            "description",
            "capabilities",
            "input_type",
            "output_type",
        ]:
            assert field in agent

    def test_agent_has_capabilities(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        for agent in r.json()["agents"]:
            assert "capabilities" in agent
            assert len(agent["capabilities"]) > 0

    def test_multiple_agent_versions(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        agents = r.json()["agents"]
        by_name = {}
        for a in agents:
            by_name.setdefault(a["agent_name"], []).append(a)
        multi_version = {n: v for n, v in by_name.items() if len(v) > 1}
        assert len(multi_version) >= 1

    def test_agent_input_output_types(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        for agent in r.json()["agents"]:
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
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        for agent in r.json()["agents"]:
            assert "provider" in agent
            assert agent["provider"] is not None

    def test_filter_agents_by_capability(self, http_client, health_check):
        r = http_client.get("/api/marketplace/agents?capability=summarization")
        assert r.status_code == 200
        for agent in r.json()["agents"]:
            assert "summarization" in agent["capabilities"]
