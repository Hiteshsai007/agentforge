import pytest


@pytest.mark.evolution
class TestEvolution:
    def test_available_upgrades(self, http_client, health_check, company_id):
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()
        assert "has_upgrades" in data
        assert "upgrades" in data
        assert "count" in data

    def test_auto_select_better_agent(self, http_client, health_check, company_id):
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
        assert selected["version"] == "2.0.0"

    def test_version_comparison(self, http_client, health_check, company_id):
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
        assert selected is not None

    def test_evolution_alternatives(self, http_client, health_check, company_id):
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
        assert len(alternatives) >= 1

    def test_multiple_upgrade_paths(self, http_client, health_check, company_id):
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data

    def test_evolution_changelog(self, http_client, health_check, company_id):
        response = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert response.status_code == 200

    def test_evolution_quality_improvement(self, http_client, health_check, company_id):
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
        assert "quality_score" in data
