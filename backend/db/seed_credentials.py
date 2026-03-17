"""
Seed script: generates demo API credentials for agents added to companies.
Run after db.seed() completes.

Usage:
    python -m db.seed_credentials
"""
import asyncio
import os
import sys
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from .supabase_client import get_supabase
from ..services.credentials import CredentialManager
from ..services.email_service import EmailService


async def seed_credentials():
    db = get_supabase()

    print("📝 Seeding API credentials for demo agents...")

    # Get Acme Corp company
    company_result = db.table("companies").select("company_id").eq(
        "company_name", "Acme Corp"
    ).execute()

    if not company_result.data:
        print("  ⚠️  Acme Corp not found. Run seed.py first.")
        return

    company_id = company_result.data[0]["company_id"]
    print(f"  ✅ Found Acme Corp: {company_id}")

    # Get company agents
    ca_result = db.table("company_agents").select(
        "agent_id, agents_marketplace(agent_name, version)"
    ).eq("company_id", company_id).execute()

    agents = ca_result.data or []
    print(f"  📋 Found {len(agents)} agents in Acme Corp portfolio")

    # Get admin user email
    user_result = db.table("users").select("email").eq(
        "company_id", company_id
    ).eq("role", "admin").execute()

    admin_email = user_result.data[0]["email"] if user_result.data else "admin@acme.com"
    print(f"  📧 Admin email: {admin_email}")

    # Generate credentials for each agent
    for ca in agents:
        agent_id = ca.get("agent_id")
        mp = ca.get("agents_marketplace")
        if not mp:
            continue
        agent_name = mp.get("agent_name", "Unknown")
        version = mp.get("version", "?.?.?")

        try:
            # Generate credential pair
            api_key, secret_key, expiry_date = CredentialManager.create_credential_pair()
            api_key_hash = CredentialManager.hash_key(api_key)
            secret_key_hash = CredentialManager.hash_key(secret_key)

            # Store in database
            db.table("agent_credentials").upsert({
                "company_id": company_id,
                "agent_id": agent_id,
                "api_key_hash": api_key_hash,
                "secret_key_hash": secret_key_hash,
                "expiry_date": expiry_date.isoformat(),
                "rotation_status": "active",
            }, on_conflict="company_id,agent_id").execute()

            print(f"  ✅ Generated credentials for {agent_name} v{version}")
            print(f"     API Key (demo only): {api_key}")
            print(f"     Secret Key (demo only): {secret_key}")
            print(f"     Expires: {expiry_date.strftime('%Y-%m-%d')}")

            # Send demo email (will be logged in dev mode)
            await EmailService.send_credential_email(
                to_email=admin_email,
                api_key=api_key,
                secret_key=secret_key,
                expiry_date=expiry_date.strftime("%Y-%m-%d"),
                agent_name=f"{agent_name} v{version}",
            )

        except Exception as e:
            print(f"  ⚠️  {agent_name}: {e}")

    print(f"\n✨ Credentials seeded! Check your inbox at {admin_email}")


if __name__ == "__main__":
    EmailService.configure()
    asyncio.run(seed_credentials())
