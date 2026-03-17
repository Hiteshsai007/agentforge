"""
Custom REST client for Supabase.
(Bypasses the official `supabase` pip package which fails to build on Python 3.14.x)
"""
import os
import httpx
from typing import Optional
from dotenv import load_dotenv

# Load .env from the backend directory
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)


class SupabaseTableQuery:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.method = "GET"
        self.params = {}
        self.json_data = None
        self._select = "*"
        self._order = []
        self._limit: Optional[int] = None
        self._on_conflict = None


    def select(self, columns="*"):
        self._select = columns
        self.params["select"] = columns
        return self

    def insert(self, data):
        self.method = "POST"
        self.json_data = data
        return self

    def upsert(self, data, on_conflict=None):
        self.method = "POST"
        self.json_data = data
        self.client.headers["Prefer"] = "resolution=merge-duplicates"
        if on_conflict:
            self.params["on_conflict"] = on_conflict
        return self

    def update(self, data):
        self.method = "PATCH"
        self.json_data = data
        return self

    def delete(self):
        self.method = "DELETE"
        return self

    def eq(self, column, value):
        self.params[column] = f"eq.{value}"
        return self

    def in_(self, column, values):
        # formatting for PostgreSQL IN: value1,value2,value3
        val_str = ",".join(str(v) for v in values)
        self.params[column] = f"in.({val_str})"
        return self

    def contains(self, column, array_values):
        # formatting for PostgreSQL array contains: {value1,value2}
        val_str = ",".join(f'"{v}"' for v in array_values)
        self.params[column] = f"cs.{{{val_str}}}"
        return self

    def order(self, column, desc=False):
        order_str = f"{column}.{'desc' if desc else 'asc'}"
        self._order.append(order_str)
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def execute(self):
        if self._order:
            self.params["order"] = ",".join(self._order)
        if self._limit is not None:
            self.params["limit"] = str(self._limit)
            
        url = f"{self.client.url}/rest/v1/{self.table_name}"
        
        # When doing POST/PATCH/DELETE missing 'Prefer: return=representation' means no data returned.
        if self.method in ["POST", "PATCH", "DELETE"]:
            existing_prefer = self.client.headers.get("Prefer", "")
            if existing_prefer:
                self.client.headers["Prefer"] = f"{existing_prefer},return=representation"
            else:
                self.client.headers["Prefer"] = "return=representation"

        response = httpx.request(
            method=self.method,
            url=url,
            headers=self.client.headers,
            params=self.params,
            json=self.json_data,
            timeout=15.0
        )
        
        # Reset Prefer header
        self.client.headers.pop("Prefer", None)
        
        response.raise_for_status()




        
        # Parse response
        data = None
        try:
            if response.text.strip():
                data = response.json()
            else:
                data = []
        except Exception:
            data = []
            
        return SupabaseResponse(data=data if isinstance(data, list) else [data])

class SupabaseResponse:
    def __init__(self, data):
        self.data = data


class CustomSupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def table(self, table_name: str) -> SupabaseTableQuery:
        return SupabaseTableQuery(self, table_name)


_client_instance = None

def get_supabase() -> CustomSupabaseClient:
    global _client_instance
    if _client_instance is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        _client_instance = CustomSupabaseClient(url, key)
    return _client_instance


