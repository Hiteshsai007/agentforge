import pytest


@pytest.mark.integration
class TestFullWorkflow:
    def test_full_flow_summarize(self, client, health_check, company_id):
        intent = {
            "intent": "summarize",
            "task_type": "summarization",
            "required_capability": "summarization",
            "original_request": "test",
            "confidence": 0.9,
        }
        response = client.post(
            "/api/agent/execute", json={"intent": intent, "company_id": company_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_full_flow_research(self, client, health_check, company_id):
        intent = {
            "intent": "research",
            "task_type": "research",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }
        response = client.post(
            "/api/agent/execute", json={"intent": intent, "company_id": company_id}
        )
        assert response.status_code == 200

    def test_api_key_lifecycle(self, client, health_check, company_id):
        response = client.get(f"/api/company/{company_id}/api-key-status")
        assert response.status_code == 200
        response = client.post(
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

    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_full_flow_with_delegation(self, client, health_check, company_id):
        intent = {
            "intent": "research",
            "task_type": "complex",
            "required_capability": "research",
            "original_request": "test",
            "confidence": 0.9,
        }
        response = client.post(
            "/api/agent/execute",
            json={"intent": intent, "company_id": company_id},
            headers={"X-Enable-Delegation": "true"},
        )
        assert response.status_code == 200

    def test_marketplace_to_execution_flow(self, client, health_check, company_id):
        response = client.get("/api/marketplace/agents")
        assert response.status_code == 200
        agents = response.json().get("agents", [])
        response = client.get("/api/marketplace/capabilities")
        assert response.status_code == 200
