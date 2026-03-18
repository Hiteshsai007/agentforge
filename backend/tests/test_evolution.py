import pytest


@pytest.mark.evolution
class TestEvolution:
    def test_available_upgrades(self, http_client, health_check, company_id):
        r = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert r.status_code == 200
        data = r.json()
        assert "has_upgrades" in data
        assert "upgrades" in data
        assert "count" in data

    def test_auto_select_better_agent(self, http_client, health_check, company_id):
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
        assert r.json()["routing"]["selected_agent"]["version"] == "2.0.0"

    def test_version_comparison(self, http_client, health_check, company_id):
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
        assert r.json()["routing"]["selected_agent"] is not None

    def test_evolution_alternatives(self, http_client, health_check, company_id):
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
        assert len(r.json()["routing"].get("alternatives", [])) >= 1

    def test_multiple_upgrade_paths(self, http_client, health_check, company_id):
        r = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert r.status_code == 200
        assert "count" in r.json()

    def test_evolution_changelog(self, http_client, health_check, company_id):
        r = http_client.get(f"/api/company/{company_id}/available-upgrades")
        assert r.status_code == 200

    def test_evolution_quality_improvement(self, http_client, health_check, company_id):
        r = http_client.post(
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
        assert r.status_code == 200
        assert "quality_score" in r.json()
