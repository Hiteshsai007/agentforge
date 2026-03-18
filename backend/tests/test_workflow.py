import pytest


@pytest.mark.integration
class TestFullWorkflow:
    def test_full_flow_summarize(self, http_client, health_check, company_id):
        intent = {
            "intent": "summarize",
            "task_type": "summarization",
            "required_capability": "summarization",
            "original_request": "test",
            "confidence": 0.9,
        }
        r = http_client.post(
            "/api/agent/execute", json={"intent": intent, "company_id": company_id}
        )
        assert r.status_code == 200
        assert "agents_used" in r.json()

    def test_full_flow_research(self, http_client, health_check, company_id):
        intent = {
            "intent": "research",
            "task_type": "research",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }
        r = http_client.post(
            "/api/agent/execute", json={"intent": intent, "company_id": company_id}
        )
        assert r.status_code == 200

    def test_api_key_lifecycle(self, http_client, health_check, company_id):
        r = http_client.get(f"/api/company/{company_id}/api-key-status")
        assert r.status_code == 200
        r = http_client.post(
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
        assert r.status_code == 200

    def test_health_check(self, http_client):
        r = http_client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_full_flow_with_delegation(self, http_client, health_check, company_id):
        intent = {
            "intent": "research",
            "task_type": "complex",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }
        r = http_client.post(
            "/api/agent/execute",
            json={"intent": intent, "company_id": company_id},
            headers={"X-Enable-Delegation": "true"},
        )
        assert r.status_code == 200

    def test_marketplace_to_execution_flow(self, http_client, health_check, company_id):
        r = http_client.get("/api/marketplace/agents")
        assert r.status_code == 200
        agents = r.json()["agents"]
        assert len(agents) > 0
        r = http_client.get("/api/marketplace/capabilities")
        assert r.status_code == 200
        r = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "test",
                    "task_type": "test",
                    "required_capability": agents[0]["capabilities"][0],
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert r.status_code == 200
