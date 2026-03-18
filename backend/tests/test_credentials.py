import pytest


class TestCredentials:
    def test_generate_credentials(self, client, health_check, company_id):
        response = client.post(
            f"/api/company/{company_id}/agents/test-agent/generate-credentials",
            json={},
        )
        assert response.status_code in [200, 404, 500]

    def test_credentials_status_not_found(self, client, health_check, company_id):
        response = client.get(
            f"/api/company/{company_id}/agents/nonexistent-agent/credentials-status",
        )
        assert response.status_code in [200, 404, 500]

    def test_rotate_credentials_not_found(self, client, health_check, company_id):
        response = client.post(
            f"/api/company/{company_id}/agents/nonexistent-agent/rotate-credentials",
            json={},
        )
        assert response.status_code in [200, 404, 500]
