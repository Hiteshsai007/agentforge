"""
Feedback Loop — records execution metrics and updates EMA quality scores.
"""
from __future__ import annotations
import os
from datetime import datetime
from dotenv import load_dotenv
from ..db.supabase_client import get_supabase
from ..models import ExecutionMetrics

load_dotenv()

ALPHA = float(os.getenv("ALPHA_EMA", "0.3"))


def record_execution(
    execution_id: str,
    company_id: str,
    agent_id: str,
    request_text: str,
    parsed_intent: dict,
    result_data: dict,
    execution_time: float,
    tokens_used: int,
    success: bool,
    error_type: str | None = None,
    user_id: str | None = None,
) -> float:
    """
    Records execution in history table and updates EMA quality score.
    Returns the new quality score.
    """
    db = get_supabase()

    # Calculate execution score
    metrics = ExecutionMetrics(
        success=success,
        execution_time_seconds=execution_time,
        tokens_used=tokens_used,
    )
    exec_score = metrics.execution_score()

    # Fetch current quality score and privacy setting
    ca_result = db.table("company_agents").select("quality_score, execution_count, settings").eq(
        "company_id", company_id
    ).eq("agent_id", agent_id).execute()

    prev_quality = 0.5
    quality_privacy = "private"
    if ca_result.data:
        prev_quality = float(ca_result.data[0].get("quality_score") or 0.5)
        settings = ca_result.data[0].get("settings") or {}
        quality_privacy = settings.get("quality_privacy", "private")

    # EMA formula
    new_quality = ALPHA * exec_score + (1 - ALPHA) * prev_quality
    new_quality = round(max(0.0, min(1.0, new_quality)), 3)

    # Write execution history
    try:
        db.table("execution_history").insert({
            "execution_id": execution_id,
            "company_id": company_id,
            "agent_id": agent_id,
            "user_id": user_id,
            "request_text": request_text[:2000],
            "parsed_intent": parsed_intent,
            "execution_time_seconds": round(execution_time, 3),
            "tokens_used": tokens_used,
            "success": success,
            "error_type": error_type,
            "result_data": result_data if isinstance(result_data, dict) else {"output": str(result_data)},
            "quality_score": new_quality,
        }).execute()
    except Exception as e:
        print(f"⚠️  Failed to write execution history: {e}")

    # Update company_agents quality score and stats
    try:
        update_data: dict = {
            "quality_score": new_quality,
            "last_used_at": datetime.utcnow().isoformat(),
        }
        if ca_result.data:
            old_count = int(ca_result.data[0].get("execution_count") or 0)
            update_data["execution_count"] = old_count + 1

        db.table("company_agents").update(update_data).eq(
            "company_id", company_id
        ).eq("agent_id", agent_id).execute()
    except Exception as e:
        print(f"⚠️  Failed to update company_agents quality score: {e}")
    
    # If quality_privacy is "public", also update global_quality_score
    if quality_privacy == "public":
        try:
            # Fetch current global score for this agent
            agent_result = db.table("agents_marketplace").select("global_quality_score").eq(
                "agent_id", agent_id
            ).execute()
            
            if agent_result.data:
                prev_global = float(agent_result.data[0].get("global_quality_score") or 0.5)
                new_global = ALPHA * exec_score + (1 - ALPHA) * prev_global
                new_global = round(max(0.0, min(1.0, new_global)), 3)
                
                db.table("agents_marketplace").update({"global_quality_score": new_global}).eq(
                    "agent_id", agent_id
                ).execute()
        except Exception as e:
            print(f"⚠️  Failed to update global quality score: {e}")

    return new_quality


def check_marketplace_updates(company_id: str) -> dict:
    """
    Checks marketplace for new agents and version updates for the company's portfolio.
    Returns a summary of available updates.
    """
    db = get_supabase()

    # Get company's current agents with names and versions
    ca_result = db.table("company_agents").select(
        "agent_id, auto_update_enabled, quality_score, "
        "agents_marketplace(agent_id, agent_name, version, capabilities)"
    ).eq("company_id", company_id).eq("status", "active").execute()

    company_agents = ca_result.data or []

    upgrades = []
    new_agents = []

    for ca in company_agents:
        mp = ca.get("agents_marketplace") or {}
        if not isinstance(mp, dict):
            continue
        current_name    = mp.get("agent_name", "")
        current_version = mp.get("version", "0.0.0")

        # Find newer versions in marketplace
        newer = db.table("agents_marketplace").select("*").eq(
            "agent_name", current_name
        ).eq("is_available", True).execute()

        from engine.router import _parse_semver
        for newer_agent in (newer.data or []):
            nv = newer_agent["version"]
            if _parse_semver(nv) > _parse_semver(current_version):
                upgrades.append({
                    "current_agent_id": mp.get("agent_id"),
                    "current_version": current_version,
                    "new_agent": newer_agent,
                    "agent_name": current_name,
                    "auto_update": ca.get("auto_update_enabled", False),
                })

    return {
        "upgrades": upgrades,
        "new_agents": new_agents,
        "company_id": company_id,
    }


def apply_auto_updates(company_id: str) -> list[dict]:
    """
    Applies automatic updates for agents with auto_update_enabled=True.
    Returns list of updated agents.
    """
    db = get_supabase()
    update_info = check_marketplace_updates(company_id)
    updated = []

    for upgrade in update_info.get("upgrades", []):
        if not upgrade.get("auto_update"):
            continue

        new_agent = upgrade["new_agent"]
        old_agent_id = upgrade["current_agent_id"]
        new_agent_id = new_agent["agent_id"]

        try:
            # Mark old as deprecated
            db.table("company_agents").update({"status": "deprecated"}).eq(
                "company_id", company_id
            ).eq("agent_id", old_agent_id).execute()

            # Add or update with new agent_id
            db.table("company_agents").upsert({
                "company_id": company_id,
                "agent_id": new_agent_id,
                "auto_update_enabled": True,
                "status": "active",
                "quality_score": 0.5,
            }, on_conflict="company_id,agent_id").execute()

            updated.append({
                "agent_name": upgrade["agent_name"],
                "from_version": upgrade["current_version"],
                "to_version": new_agent["version"],
                "changelog": new_agent.get("changelog", ""),
            })
        except Exception as e:
            print(f"⚠️  Auto-update failed for {upgrade['agent_name']}: {e}")

    return updated


def apply_specific_update(company_id: str, old_agent_id: str, new_agent_id: str) -> bool:
    """
    Applies a specific manual update.
    """
    db = get_supabase()
    try:
        # Mark old as deprecated
        db.table("company_agents").update({"status": "deprecated"}).eq(
            "company_id", company_id
        ).eq("agent_id", old_agent_id).execute()

        # Add or update with new agent_id
        db.table("company_agents").upsert({
            "company_id": company_id,
            "agent_id": new_agent_id,
            "auto_update_enabled": False, # Manual updates don't flip auto-update on
            "status": "active",
            "quality_score": 0.5,
        }, on_conflict="company_id,agent_id").execute()
        return True
    except Exception as e:
        print(f"⚠️  Manual update failed: {e}")
        return False
