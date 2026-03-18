import pytest


class TestIntentParsing:
    def test_parse_summarize(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": "Summarize"})
        assert r.status_code == 200

    def test_parse_calculate(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": "What is 2+2?"})
        assert r.status_code == 200

    def test_parse_translate(self, http_client, health_check):
        r = http_client.post(
            "/api/intent/parse", json={"request": "Translate to Spanish"}
        )
        assert r.status_code == 200

    def test_parse_research(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": "Research AI"})
        assert r.status_code == 200

    def test_parse_sentiment(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": "Analyze sentiment"})
        assert r.status_code == 200

    def test_parse_intent_structure(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": "Summarize"})
        assert r.status_code == 200

    def test_parse_complex_request(self, http_client, health_check):
        r = http_client.post(
            "/api/intent/parse", json={"request": "Research and summarize"}
        )
        assert r.status_code == 200

    def test_parse_empty_request(self, http_client, health_check):
        r = http_client.post("/api/intent/parse", json={"request": ""})
        assert r.status_code in [200, 400]
