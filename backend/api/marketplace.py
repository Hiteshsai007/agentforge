"""
API: GET /api/marketplace/agents  — Browse marketplace
     POST /api/marketplace/register — Developer registers new agent
"""
from fastapi import APIRouter, Query
from ..models import RegisterAgentRequest
from ..db.supabase_client import get_supabase
import httpx

router = APIRouter()


@router.get("/agents", tags=["Marketplace"])
async def list_agents(capability: str = Query(default="", description="Filter by capability")):
    db = get_supabase()
    query = db.table("agents_marketplace").select("*").eq("is_available", True)
    if capability:
        query = query.contains("capabilities", [capability])
    result = query.order("agent_name").order("version", desc=True).execute()
    return {"agents": result.data or [], "total": len(result.data or [])}


@router.post("/register", tags=["Marketplace"])
async def register_agent(body: RegisterAgentRequest):
    db = get_supabase()

    # Health check (optional — skip if endpoint is internal or unreachable)
    health_status = "unchecked"
    if body.health_check_endpoint and body.health_check_endpoint.startswith("http"):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(body.health_check_endpoint)
                health_status = "healthy" if resp.status_code == 200 else "unhealthy"
        except Exception:
            health_status = "unreachable"

    agent_data = {
        "agent_name": body.agent_name,
        "version": body.version,
        "capabilities": body.capabilities,
        "description": body.description,
        "provider": body.provider,
        "input_type": body.input_type,
        "output_type": body.output_type,
        "api_endpoint": body.api_endpoint,
        "health_check_endpoint": body.health_check_endpoint,
        "pricing_model": body.pricing_model,
        "changelog": body.changelog,
        "is_available": health_status != "unhealthy",
    }

    try:
        result = db.table("agents_marketplace").upsert(
            agent_data, on_conflict="agent_name,version"
        ).execute()
        agent_id = result.data[0]["agent_id"] if result.data else None
        return {
            "success": True,
            "agent_id": agent_id,
            "status": "registered",
            "health_status": health_status,
            "marketplace_url": f"/marketplace/agents/{agent_id}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/capabilities", tags=["Marketplace"])
async def list_capabilities():
    db = get_supabase()
    result = db.table("agents_marketplace").select("capabilities").eq("is_available", True).execute()
    caps = set()
    for row in (result.data or []):
        for c in (row.get("capabilities") or []):
            caps.add(c)
    return {"capabilities": sorted(caps)}
