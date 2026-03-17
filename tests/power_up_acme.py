import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from db.supabase_client import get_supabase

def power_up_portfolio():
    db = get_supabase()
    
    # 1. Find Acme Corp
    companies = db.table("companies").select("*").eq("company_name", "Acme Corp").execute()
    if not companies.data:
        print("Acme Corp not found")
        return
    
    company_id = companies.data[0]["company_id"]
    print(f"Adding all agents to {companies.data[0]['company_name']} ({company_id})...")
    
    # 2. Get all marketplace agents
    marketplace = db.table("agents_marketplace").select("*").execute()
    if not marketplace.data:
        print("No agents in marketplace")
        return
        
    # 3. Add them all to company_agents
    for ag in marketplace.data:
        try:
            db.table("company_agents").upsert({
                "company_id": company_id,
                "agent_id": ag["agent_id"],
                "status": "active",
                "auto_update_enabled": True,
                "quality_score": 0.85,
                "execution_count": 0
            }, on_conflict="company_id,agent_id").execute()
            print(f" ✅ Added {ag['agent_name']} v{ag['version']}")
        except Exception as e:
            print(f" ⚠️ Failed to add {ag['agent_name']}: {e}")

if __name__ == "__main__":
    power_up_portfolio()
