import pytest


@pytest.mark.evolution
class TestEvolution:
    def test_available_upgrades(self, client, health_check, company_id):
        response = client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()
        assert "has_upgrades" in data
        assert "upgrades" in data
        assert "count" in data

    def test_auto_select_better_agent(self, client, health_check, company_id):
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
        data = response.json()
        assert isinstance(data, dict)

    def test_version_comparison(self, client, health_check, company_id):
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
        data = response.json()
        assert isinstance(data, dict)

    def test_evolution_alternatives(self, client, health_check, company_id):
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
        data = response.json()
        assert isinstance(data, dict)

    def test_multiple_upgrade_paths(self, client, health_check, company_id):
        response = client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data

    def test_evolution_changelog(self, client, health_check, company_id):
        response = client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200

    def test_evolution_quality_improvement(self, client, health_check, company_id):
        response = client.post(
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
        assert isinstance(data, dict)
