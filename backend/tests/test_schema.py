import pytest


class TestSchema:
    def test_openapi_schema_generation(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert schema["openapi"].startswith("3.")

    def test_schema_contains_paths(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "paths" in schema
        assert len(schema["paths"]) > 0

    def test_schema_contains_components(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "components" in schema

    def test_schema_info(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "info" in schema
        assert "title" in schema["info"]
        assert "version" in schema["info"]
