import pytest


@pytest.mark.delegation
class TestAgentDelegation:
    def test_delegation_enabled(self, http_client, health_check, company_id):
        r = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        assert r.status_code == 200
        assert "agents_used" in r.json()

    def test_delegation_disabled(self, http_client, health_check, company_id):
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
        assert "agents_used" in r.json()

    def test_delegation_chain_comparison(self, http_client, health_check, company_id):
        r1 = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        r2 = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert r1.status_code == 200
        assert r2.status_code == 200

    def test_delegation_quality_score(self, http_client, health_check, company_id):
        r = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        assert r.status_code == 200
        assert "quality_score" in r.json()

    def test_delegation_header_variations(self, http_client, health_check, company_id):
        for v in ["true", "True", "1", "yes"]:
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
                headers={"X-Enable-Delegation": v},
            )
            assert r.status_code == 200
