import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from engine.intent_parser import parse_intent
from engine.router import route_intent
from engine.executor import execute_agent
import json

def test_full_flow():
    company_name = "Acme Corp"
    db = __import__('db.supabase_client', fromlist=['get_supabase']).get_supabase()
    companies = db.table("companies").select("*").eq("company_name", company_name).execute()
    company_id = companies.data[0]["company_id"]
    
    print(f"Testing for Company: {company_name} ({company_id})")
    
    test_queries = ["research AI agents", "summarize this meeting", "calculate 5+5"]
    
    for q in test_queries:
        print(f"\n--- Query: {q} ---")
        # 1. Parse (uses fallback if 429)
        intent_dict = parse_intent(q)
        print(f"Intent parsed: {intent_dict.get('intent')} (multi: {intent_dict.get('is_multi_agent')})")
        
        # 2. Route
        from models import Intent
        intent = Intent(**{k: v for k, v in intent_dict.items() if k in Intent.model_fields})
        routing = route_intent(intent, company_id)
        
        if routing.selected_agent:
            print(f"Routed to: {routing.selected_agent.agent_name} v{routing.selected_agent.version}")
        else:
            print(f"Routing Failed: {routing.routing_reason}")
            if routing.alternatives:
                print(f"Marketplace options: {[a.agent_name for a in routing.alternatives]}")
            continue

        # 3. Execute (uses simulation if 429)
        result = execute_agent(q, routing.selected_agent.capabilities)
        print(f"Execution Success: {result['success']}")
        if result['success']:
            print(f"Output (first 100 chars): {result['output'][:100]}...")
            if "Simulated" in result['output'] or result.get('warning'):
                print(" ✅ Simulation Fallback triggered correctly")
        else:
            print(f"Execution Error: {result.get('error')}")

if __name__ == "__main__":
    test_full_flow()
