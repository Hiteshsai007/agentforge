import pytest


class TestRouting:
    def test_route_summarize(self, http_client, health_check, company_id):
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
        assert "routing" in data
        assert "agents_used" in data

    def test_route_calculate(self, http_client, health_check, company_id):
        response = http_client.post(
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
        )
        assert response.status_code == 200
        data = response.json()
        assert "routing" in data

    def test_route_translate(self, http_client, health_check, company_id):
        response = http_client.post(
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
        data = response.json()
        assert "routing" in data

    def test_route_research(self, http_client, health_check, company_id):
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
        assert "routing" in data

    def test_route_sentiment(self, http_client, health_check, company_id):
        response = http_client.post(
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
        data = response.json()
        assert "routing" in data

    def test_route_version_priority(self, http_client, health_check, company_id):
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

    def test_route_alternatives(self, http_client, health_check, company_id):
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
        assert "routing" in data

    def test_route_routing_reason(self, http_client, health_check, company_id):
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
        assert "routing" in data
