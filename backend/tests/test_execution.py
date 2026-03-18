import pytest


class TestAgentExecution:
    def test_execute_summarizer(self, http_client, health_check, company_id):
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
        assert "agents_used" in r.json()

    def test_execute_calculator(self, http_client, health_check, company_id):
        r = http_client.post(
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
        assert r.status_code == 200
        assert "routing" in r.json()

    def test_execute_translator(self, http_client, health_check, company_id):
        r = http_client.post(
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
            headers={"X-Agent-ID": "b3d3cfae-4c90-47e8-af61-d970c639c6ac"},
        )
        assert r.status_code == 200
        assert "routing" in r.json()

    def test_execute_researcher(self, http_client, health_check, company_id):
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
        assert "routing" in r.json()

    def test_execute_sentiment(self, http_client, health_check, company_id):
        r = http_client.post(
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
            headers={"X-Agent-ID": "25885e8f-1063-40f2-9920-4351fecce7c0"},
        )
        assert r.status_code == 200
        assert "routing" in r.json()

    def test_execute_with_company_api_key(self, http_client, health_check, company_id):
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
        assert "routing" in r.json()

    def test_execute_with_specific_agent_id(
        self, http_client, health_check, company_id
    ):
        r = http_client.post(
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
        assert r.status_code == 200
        assert (
            r.json()["routing"]["selected_agent"]["agent_id"]
            == "d1b711c9-8ba6-461e-823f-2c3cf77babf8"
        )

    def test_execute_invalid_agent_id(self, http_client, health_check, company_id):
        r = http_client.post(
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
        assert r.status_code == 404

    def test_execute_invalid_api_key(self, http_client, health_check, company_id):
        r = http_client.post(
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
            headers={"X-Company-API-Key": "invalid_key"},
        )
        assert r.status_code == 401

    def test_execution_response_structure(self, http_client, health_check, company_id):
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
        for field in [
            "execution_id",
            "result",
            "agents_used",
            "execution_time",
            "tokens_used",
            "quality_score",
            "routing",
        ]:
            assert field in r.json()
