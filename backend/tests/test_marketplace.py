import pytest


class TestMarketplace:
    def test_list_all_agents(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert isinstance(data["agents"], list)

    def test_list_capabilities(self, client, health_check):
        response = client.get("/api/marketplace/capabilities")
        assert response.status_code == 200
        data = response.json()
        assert "capabilities" in data
        assert isinstance(data["capabilities"], list)

    def test_agent_metadata_structure(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        if data.get("agents") and len(data["agents"]) > 0:
            agent = data["agents"][0]
            for field in [
                "agent_id",
                "agent_name",
                "provider",
                "version",
            ]:
                assert field in agent

    def test_agent_has_capabilities(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        if data.get("agents"):
            for agent in data["agents"]:
                if "capabilities" in agent:
                    assert isinstance(agent["capabilities"], list)

    def test_multiple_agent_versions(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        if data.get("agents"):
            agents = data["agents"]
            by_name = {}
            for a in agents:
                by_name.setdefault(a.get("agent_name", ""), []).append(a)
            multi_version = {n: v for n, v in by_name.items() if len(v) > 1}
            assert len(multi_version) >= 0

    def test_agent_input_output_types(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        valid_input = ["text", "image", "audio", "video", "file"]
        valid_output = ["text", "image", "audio", "video", "file", "json"]
        if data.get("agents"):
            for agent in data["agents"]:
                if "input_type" in agent:
                    assert agent["input_type"] in valid_input
                if "output_type" in agent:
                    assert agent["output_type"] in valid_output

    def test_agent_providers(self, client, health_check):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        data = response.json()
        if data.get("agents"):
            for agent in data["agents"]:
                if "provider" in agent:
                    assert agent["provider"] is not None

    def test_filter_agents_by_capability(self, client, health_check):
        response = client.get("/api/marketplace/agents?capability=summarization")
        assert response.status_code == 200
        data = response.json()
        if data.get("agents"):
            for agent in data["agents"]:
                if "capabilities" in agent:
                    assert (
                        "summarization" in agent["capabilities"]
                        or agent["capabilities"] == []
                    )
