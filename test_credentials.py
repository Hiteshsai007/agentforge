#!/usr/bin/env python
import sys
import requests
import json

# Test credential generation
company_id = "12a5ff1b-d07e-4aec-a132-36f731c82de0"
agent_id = "agent_001"  # Calculator agent

try:
    response = requests.post(
        f"http://127.0.0.1:8000/api/company/{company_id}/agents/{agent_id}/generate-credentials",
        json={},
        timeout=5
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")
