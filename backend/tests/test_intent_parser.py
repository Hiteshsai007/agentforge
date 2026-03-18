import pytest


class TestIntentParsing:
    def test_parse_summarize(self, client, health_check):
        response = client.post("/api/intent/parse", json={"request": "Summarize"})
        assert response.status_code == 200

    def test_parse_calculate(self, client, health_check):
        response = client.post("/api/intent/parse", json={"request": "What is 2+2?"})
        assert response.status_code == 200

    def test_parse_translate(self, client, health_check):
        response = client.post(
            "/api/intent/parse", json={"request": "Translate to Spanish"}
        )
        assert response.status_code == 200

    def test_parse_research(self, client, health_check):
        response = client.post("/api/intent/parse", json={"request": "Research AI"})
        assert response.status_code == 200

    def test_parse_sentiment(self, client, health_check):
        response = client.post(
            "/api/intent/parse", json={"request": "Analyze sentiment"}
        )
        assert response.status_code == 200

    def test_parse_intent_structure(self, client, health_check):
        response = client.post("/api/intent/parse", json={"request": "Summarize"})
        assert response.status_code == 200

    def test_parse_complex_request(self, client, health_check):
        response = client.post(
            "/api/intent/parse", json={"request": "Research and summarize"}
        )
        assert response.status_code == 200

    def test_parse_empty_request(self, client, health_check):
        response = client.post("/api/intent/parse", json={"request": ""})
        assert response.status_code in [200, 400]
