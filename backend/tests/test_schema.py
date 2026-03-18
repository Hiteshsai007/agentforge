#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from backend.main import app

try:
    schema = app.openapi()
    print("✅ Schema generated successfully")
except Exception as e:
    print(f"❌ Schema generation error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
