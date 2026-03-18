import pytest


@pytest.mark.delegation
class TestAgentDelegation:
    def test_delegation_enabled(self, http_client, health_check, company_id):
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
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
        assert "agents_used" in data

    def test_delegation_disabled(self, http_client, health_check, company_id):
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
        assert "agents_used" in data

    def test_delegation_chain_comparison(self, http_client, health_check, company_id):
        response_delegation = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Enable-Delegation": "true"},
        )
        response_single = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
                    "task_type": "complex",
                    "required_capability": "research",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response_delegation.status_code == 200
        assert response_single.status_code == 200

    def test_delegation_quality_score(self, http_client, health_check, company_id):
        response = http_client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "research and summarize",
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
        assert "quality_score" in data

    def test_delegation_header_variations(self, http_client, health_check, company_id):
        for value in ["true", "True", "1", "yes"]:
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
                headers={"X-Enable-Delegation": value},
            )
            assert response.status_code == 200
