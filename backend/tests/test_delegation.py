import pytest


@pytest.mark.delegation
class TestAgentDelegation:
    def test_delegation_enabled(self, client, health_check, company_id):
        response = client.post(
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
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_delegation_disabled(self, client, health_check, company_id):
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

    def test_delegation_chain_comparison(self, client, health_check, company_id):
        response1 = client.post(
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
        response2 = client.post(
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
        assert response1.status_code == 200
        assert response2.status_code == 200

    def test_delegation_quality_score(self, client, health_check, company_id):
        response = client.post(
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
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_delegation_header_variations(self, client, health_check, company_id):
        for v in ["true", "True", "1", "yes"]:
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
                headers={"X-Enable-Delegation": v},
            )
            assert response.status_code == 200
