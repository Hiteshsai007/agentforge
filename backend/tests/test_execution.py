import pytest


class TestAgentExecution:
    def test_execute_summarizer(self, client, health_check, company_id):
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
        assert "agents_used" in data or "routing" in data or "result" in data

    def test_execute_calculator(self, client, health_check, company_id):
        response = client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "calculate",
                    "task_type": "calculation",
                    "required_capability": "mathematics",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "d1b711c9-8ba6-461e-823f-2c3cf77babf8"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data or "result" in data or "agents_used" in data

    def test_execute_translator(self, client, health_check, company_id):
        response = client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "translate",
                    "task_type": "translation",
                    "required_capability": "translation",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200

    def test_execute_researcher(self, client, health_check, company_id):
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

    def test_execute_sentiment(self, client, health_check, company_id):
        response = client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "analyze",
                    "task_type": "sentiment",
                    "required_capability": "sentiment_analysis",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
        )
        assert response.status_code == 200

    def test_execute_with_company_api_key(
        self, client, health_check, company_id, api_key
    ):
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
            headers={"X-Company-API-Key": api_key},
        )
        assert response.status_code == 200

    def test_execute_with_specific_agent_id(self, client, health_check, company_id):
        response = client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "calculate",
                    "task_type": "calculation",
                    "required_capability": "mathematics",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "d1b711c9-8ba6-461e-823f-2c3cf77babf8"},
        )
        assert response.status_code == 200

    def test_execute_invalid_agent_id(self, client, health_check, company_id):
        response = client.post(
            "/api/agent/execute",
            json={
                "intent": {
                    "intent": "test",
                    "task_type": "test",
                    "required_capability": "test",
                    "original_request": "test",
                    "confidence": 0.9,
                },
                "company_id": company_id,
            },
            headers={"X-Agent-ID": "invalid-agent-id"},
        )
        assert response.status_code in [404, 500]

    def test_execution_response_structure(self, client, health_check, company_id):
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
