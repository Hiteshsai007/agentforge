#!/usr/bin/env python
import sys
import requests

# Test the OpenAPI endpoint
try:
    response = requests.get("http://127.0.0.1:8000/openapi.json", timeout=5)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ OpenAPI endpoint works!")
        print(f"Schema size: {len(response.text)} bytes")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection error: {e}")
