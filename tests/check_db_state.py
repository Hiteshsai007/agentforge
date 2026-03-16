import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from db.supabase_client import get_supabase

def check_db():
    db = get_supabase()
    
    # 1. Find Acme Corp
    companies = db.table("companies").select("*").eq("company_name", "Acme Corp").execute()
    if not companies.data:
        print("Acme Corp not found")
        return
    
    company = companies.data[0]
    cid = company["company_id"]
    print(f"Company: {company['company_name']} ({cid})")
    
    # 2. Find Users
    users = db.table("users").select("*").eq("company_id", cid).execute()
    print(f"\nUsers for Acme Corp:")
    for u in users.data:
        print(f" - {u['email']} ({u['role']})")
        
    # 3. Find Portfolio Agents
    portfolio = db.table("company_agents").select("*, agents_marketplace(*)").eq("company_id", cid).execute()
    print(f"\nPortfolio Agents:")
    for p in portfolio.data:
        ag = p.get("agents_marketplace")
        if isinstance(ag, list): ag = ag[0] if ag else {}
        print(f" - {ag.get('agent_name')} v{ag.get('version')} (Status: {p['status']})")
        print(f"   Capabilities: {ag.get('capabilities')}")

if __name__ == "__main__":
    check_db()
