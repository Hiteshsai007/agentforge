import pytest


class TestIntentParsing:
    def test_parse_summarize(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this document"}
        )
        assert response.status_code == 200

    def test_parse_calculate(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse", json={"request": "What is 15 * 23 + 100?"}
        )
        assert response.status_code == 200

    def test_parse_translate(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse", json={"request": "Translate this to Spanish"}
        )
        assert response.status_code == 200

    def test_parse_research(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse", json={"request": "Research the latest AI trends"}
        )
        assert response.status_code == 200

    def test_parse_sentiment(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse",
            json={"request": "Analyze the sentiment of this review"},
        )
        assert response.status_code == 200

    def test_parse_intent_structure(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse", json={"request": "Summarize this"}
        )
        assert response.status_code == 200

    def test_parse_complex_request(self, http_client, health_check):
        response = http_client.post(
            "/api/intent/parse",
            json={"request": "Research AI trends and create a summary"},
        )
        assert response.status_code == 200

    def test_parse_empty_request(self, http_client, health_check):
        response = http_client.post("/api/intent/parse", json={"request": ""})
        assert response.status_code in [200, 400]
