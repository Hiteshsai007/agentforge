"""
API: GET /api/company/{company_id}/agents       — list company's agents
     POST /api/company/{company_id}/agents      — add agent from marketplace
     PATCH /api/company/{company_id}/agents/{agent_id} — update settings
     DELETE /api/company/{company_id}/agents/{agent_id} — remove agent
     GET /api/company/{company_id}/updates      — check marketplace updates
     POST /api/company/{company_id}/updates/apply — apply auto-updates
     GET /api/company/all                       — list all companies (for demo role-switch)
     POST /api/company                          — create new company
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from db.supabase_client import get_supabase
from models import AddAgentRequest, UpdateAgentSettingsRequest
from engine.feedback import check_marketplace_updates, apply_auto_updates

router = APIRouter()


class CreateCompanyRequest(BaseModel):
    company_name: str


@router.get("/all", tags=["Company"])
async def list_companies():
    db = get_supabase()
    result = db.table("companies").select("*").order("created_at").execute()
    return {"companies": result.data or []}


@router.post("", tags=["Company"])
async def create_company(body: CreateCompanyRequest):
    db = get_supabase()
    result = db.table("companies").insert({"company_name": body.company_name}).execute()
    return {"success": True, "company": result.data[0] if result.data else None}


@router.get("/{company_id}/agents", tags=["Company"])
async def get_company_agents(company_id: str):
    db = get_supabase()
    result = db.table("company_agents").select(
        "*, agents_marketplace(agent_id, agent_name, version, capabilities, description, provider, pricing_model, changelog, input_type, output_type)"
    ).eq("company_id", company_id).order("added_at").execute()
    return {"agents": result.data or [], "company_id": company_id}


@router.post("/{company_id}/agents", tags=["Company"])
async def add_agent(company_id: str, body: AddAgentRequest):
    db = get_supabase()
    try:
        result = db.table("company_agents").upsert({
            "company_id": company_id,
            "agent_id": body.agent_id,
            "auto_update_enabled": body.auto_update_enabled,
            "status": "active",
            "quality_score": 0.5,
            "execution_count": 0,
        }, on_conflict="company_id,agent_id").execute()

        # Fetch full agent details
        agent_result = db.table("agents_marketplace").select("*").eq(
            "agent_id", body.agent_id
        ).execute()

        return {
            "success": True,
            "agent_added": agent_result.data[0] if agent_result.data else None,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.patch("/{company_id}/agents/{agent_id}", tags=["Company"])
async def update_agent_settings(company_id: str, agent_id: str, body: UpdateAgentSettingsRequest):
    db = get_supabase()
    update_data = {}
    if body.auto_update_enabled is not None:
        update_data["auto_update_enabled"] = body.auto_update_enabled
    if body.status is not None:
        update_data["status"] = body.status

    if not update_data:
        return {"success": False, "error": "No fields to update"}

    result = db.table("company_agents").update(update_data).eq(
        "company_id", company_id
    ).eq("agent_id", agent_id).execute()
    return {"success": True, "updated": result.data}


@router.delete("/{company_id}/agents/{agent_id}", tags=["Company"])
async def remove_agent(company_id: str, agent_id: str):
    db = get_supabase()
    db.table("company_agents").update({"status": "deprecated"}).eq(
        "company_id", company_id
    ).eq("agent_id", agent_id).execute()
    return {"success": True}


@router.get("/{company_id}/updates", tags=["Company"])
async def get_updates(company_id: str):
    updates = check_marketplace_updates(company_id)
    return updates


@router.post("/{company_id}/updates/apply", tags=["Company"])
async def apply_updates(company_id: str):
    updated = apply_auto_updates(company_id)
    return {"success": True, "updated_agents": updated, "count": len(updated)}


@router.post("/{company_id}/agents/{agent_id}/upgrade", tags=["Company"])
async def upgrade_agent(company_id: str, agent_id: str, new_agent_id: str):
    from engine.feedback import apply_specific_update
    success = apply_specific_update(company_id, agent_id, new_agent_id)
    return {"success": success}


@router.get("/{company_id}/users", tags=["Company"])
async def get_users(company_id: str):
    db = get_supabase()
    result = db.table("users").select("*").eq("company_id", company_id).execute()
    return {"users": result.data or []}


@router.get("/{company_id}/stats", tags=["Company"])
async def get_stats(company_id: str):
    db = get_supabase()
    hist = db.table("execution_history").select(
        "success, execution_time_seconds, tokens_used, quality_score, executed_at, agent_id"
    ).eq("company_id", company_id).order("executed_at", desc=True).limit(200).execute()

    rows = hist.data or []
    total = len(rows)
    successes = sum(1 for r in rows if r.get("success"))
    avg_quality = round(sum(r.get("quality_score") or 0 for r in rows) / max(total, 1), 3)
    avg_time    = round(sum(r.get("execution_time_seconds") or 0 for r in rows) / max(total, 1), 2)
    total_tokens = sum(r.get("tokens_used") or 0 for r in rows)

    return {
        "total_executions": total,
        "success_rate": round(successes / max(total, 1), 3),
        "average_quality_score": avg_quality,
        "average_execution_time": avg_time,
        "total_tokens_used": total_tokens,
        "recent_executions": rows[:10],
    }
