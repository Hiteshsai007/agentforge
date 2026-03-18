"""
API: GET /api/company/{company_id}/agents       — list company's agents
     POST /api/company/{company_id}/agents      — add agent from marketplace
     PATCH /api/company/{company_id}/agents/{agent_id} — update settings
     DELETE /api/company/{company_id}/agents/{agent_id} — remove agent
     POST /api/company/{company_id}/agents/{agent_id}/generate-credentials — generate API key
     GET /api/company/{company_id}/agents/{agent_id}/credentials-status — check expiry
     POST /api/company/{company_id}/agents/{agent_id}/rotate-credentials — rotate API key
     GET /api/company/{company_id}/updates      — check marketplace updates
     POST /api/company/{company_id}/updates/apply — apply auto-updates
     GET /api/company/all                       — list all companies (for demo role-switch)
     POST /api/company                          — create new company
"""

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.supabase_client import get_supabase
from models import (
    AddAgentRequest,
    UpdateAgentSettingsRequest,
    CredentialGenerateRequest,
    CredentialResponse,
    CredentialStatusResponse,
    CredentialRotateRequest,
)
from engine.feedback import check_marketplace_updates, apply_auto_updates
from services.credentials import CredentialManager
from services.email_service import EmailService

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
    result = (
        db.table("company_agents")
        .select(
            "*, agents_marketplace(agent_id, agent_name, version, capabilities, description, provider, pricing_model, changelog, input_type, output_type)"
        )
        .eq("company_id", company_id)
        .order("added_at")
        .execute()
    )
    return {"agents": result.data or [], "company_id": company_id}


@router.post("/{company_id}/agents", tags=["Company"])
async def add_agent(company_id: str, body: AddAgentRequest):
    db = get_supabase()
    try:
        result = (
            db.table("company_agents")
            .upsert(
                {
                    "company_id": company_id,
                    "agent_id": body.agent_id,
                    "auto_update_enabled": body.auto_update_enabled,
                    "status": "active",
                    "quality_score": 0.5,
                    "execution_count": 0,
                    "settings": {"quality_privacy": "private"},
                },
                on_conflict="company_id,agent_id",
            )
            .execute()
        )

        # Fetch full agent details
        agent_result = (
            db.table("agents_marketplace")
            .select("*")
            .eq("agent_id", body.agent_id)
            .execute()
        )

        return {
            "success": True,
            "agent_added": agent_result.data[0] if agent_result.data else None,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.patch("/{company_id}/agents/{agent_id}", tags=["Company"])
async def update_agent_settings(
    company_id: str, agent_id: str, body: UpdateAgentSettingsRequest
):
    db = get_supabase()

    # Get current settings
    try:
        current_result = (
            db.table("company_agents")
            .select("settings")
            .eq("company_id", company_id)
            .eq("agent_id", agent_id)
            .execute()
        )

        current_settings = {}
        if current_result.data and current_result.data[0].get("settings"):
            current_settings = current_result.data[0]["settings"]
    except:
        current_settings = {"quality_privacy": "private"}

    # Update specific settings
    update_data = {}
    if body.auto_update_enabled is not None:
        update_data["auto_update_enabled"] = body.auto_update_enabled
    if body.status is not None:
        update_data["status"] = body.status
    if body.quality_privacy is not None:
        current_settings["quality_privacy"] = body.quality_privacy
        update_data["settings"] = current_settings

    if not update_data:
        return {"success": False, "error": "No fields to update"}

    try:
        result = (
            db.table("company_agents")
            .update(update_data)
            .eq("company_id", company_id)
            .eq("agent_id", agent_id)
            .execute()
        )
        return {"success": True, "updated": result.data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.delete("/{company_id}/agents/{agent_id}", tags=["Company"])
async def remove_agent(company_id: str, agent_id: str):
    db = get_supabase()
    db.table("company_agents").update({"status": "deprecated"}).eq(
        "company_id", company_id
    ).eq("agent_id", agent_id).execute()
    return {"success": True}


@router.post(
    "/{company_id}/agents/{agent_id}/generate-credentials", tags=["Credentials"]
)
async def generate_credentials(
    company_id: str,
    agent_id: str,
    body: Optional[CredentialGenerateRequest] = Body(default=None),
):
    """Generate new API credentials for an agent."""
    db = get_supabase()

    try:
        # Get agent details for email
        agent_result = (
            db.table("agents_marketplace")
            .select("agent_name")
            .eq("agent_id", agent_id)
            .execute()
        )

        if not agent_result.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        agent_name = agent_result.data[0]["agent_name"]

        # Generate credential pair
        api_key, secret_key, expiry_date = CredentialManager.create_credential_pair()

        # Hash keys for storage
        api_key_hash = CredentialManager.hash_key(api_key)
        secret_key_hash = CredentialManager.hash_key(secret_key)

        # Store in database (unique constraint on company_id, agent_id)
        cred_result = (
            db.table("agent_credentials")
            .upsert(
                {
                    "company_id": company_id,
                    "agent_id": agent_id,
                    "api_key_hash": api_key_hash,
                    "secret_key_hash": secret_key_hash,
                    "expiry_date": expiry_date.isoformat(),
                    "rotation_status": "active",
                },
                on_conflict="company_id,agent_id",
            )
            .execute()
        )

        credential_id = (
            cred_result.data[0]["credential_id"] if cred_result.data else None
        )

        # Get company admin email
        users_result = (
            db.table("users")
            .select("email")
            .eq("company_id", company_id)
            .eq("role", "admin")
            .limit(1)
            .execute()
        )

        admin_email = users_result.data[0]["email"] if users_result.data else None

        # Send email
        send_email = body.send_email if body else True
        if send_email and admin_email:
            await EmailService.send_credential_email(
                to_email=admin_email,
                api_key=api_key,
                secret_key=secret_key,
                expiry_date=expiry_date.strftime("%Y-%m-%d"),
                agent_name=agent_name,
            )

        return {
            "success": True,
            "credential": {
                "credential_id": credential_id or "",
                "api_key": api_key,
                "secret_key": secret_key,
                "api_key_masked": CredentialManager.mask_api_key(api_key),
                "expiry_date": expiry_date.strftime("%Y-%m-%d"),
                "created_at": datetime.utcnow().isoformat(),
                "days_until_expiry": 365,
                "rotation_status": "active",
            },
            "message": "Credentials generated successfully. Check your email for details.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}/agents/{agent_id}/credentials-status", tags=["Credentials"])
async def get_credentials_status(company_id: str, agent_id: str):
    """Get credential status (expiry, rotation info)."""
    db = get_supabase()

    try:
        result = (
            db.table("agent_credentials")
            .select("*")
            .eq("company_id", company_id)
            .eq("agent_id", agent_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="No credentials found")

        cred = result.data[0]
        expiry_date = datetime.fromisoformat(cred["expiry_date"].replace("Z", "+00:00"))
        days_until = CredentialManager.days_until_expiry(expiry_date)

        masked_key = CredentialManager.mask_api_key(
            "sk_live_" + (cred.get("credential_id", "")[-4:] or "******")
        )

        return {
            "success": True,
            "credential": {
                "credential_id": cred["credential_id"],
                "api_key_masked": masked_key,
                "expiry_date": cred["expiry_date"],
                "days_until_expiry": days_until,
                "rotation_status": cred["rotation_status"],
                "created_at": cred.get("created_at", datetime.utcnow().isoformat()),
                "last_used": cred.get("last_used"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{company_id}/agents/{agent_id}/rotate-credentials", tags=["Credentials"])
async def rotate_credentials(
    company_id: str,
    agent_id: str,
    body: Optional[CredentialRotateRequest] = Body(default=None),
):
    """Rotate credentials (generates new pair, marks old as rotating)."""
    db = get_supabase()

    try:
        # Get agent name
        agent_result = (
            db.table("agents_marketplace")
            .select("agent_name")
            .eq("agent_id", agent_id)
            .execute()
        )

        if not agent_result.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        agent_name = agent_result.data[0]["agent_name"]

        # Generate new credential pair
        api_key, secret_key, expiry_date = CredentialManager.create_credential_pair()
        api_key_hash = CredentialManager.hash_key(api_key)
        secret_key_hash = CredentialManager.hash_key(secret_key)

        # Mark old as rotating, upsert new
        db.table("agent_credentials").update({"rotation_status": "rotating"}).eq(
            "company_id", company_id
        ).eq("agent_id", agent_id).execute()

        cred_result = (
            db.table("agent_credentials")
            .upsert(
                {
                    "company_id": company_id,
                    "agent_id": agent_id,
                    "api_key_hash": api_key_hash,
                    "secret_key_hash": secret_key_hash,
                    "expiry_date": expiry_date.isoformat(),
                    "rotation_status": "active",
                    "last_rotated": datetime.utcnow().isoformat(),
                },
                on_conflict="company_id,agent_id",
            )
            .execute()
        )

        # Send email
        users_result = (
            db.table("users")
            .select("email")
            .eq("company_id", company_id)
            .eq("role", "admin")
            .limit(1)
            .execute()
        )

        admin_email = users_result.data[0]["email"] if users_result.data else None

        if body and body.send_email and admin_email:
            await EmailService.send_rotated_credentials_email(
                to_email=admin_email,
                agent_name=agent_name,
                new_api_key=api_key,
                new_secret_key=secret_key,
                new_expiry_date=expiry_date.strftime("%Y-%m-%d"),
            )

        return {
            "success": True,
            "credential": {
                "credential_id": cred_result.data[0]["credential_id"]
                if cred_result.data
                else "",
                "api_key": api_key,
                "secret_key": secret_key,
                "api_key_masked": CredentialManager.mask_api_key(api_key),
                "expiry_date": expiry_date.strftime("%Y-%m-%d"),
                "created_at": datetime.utcnow().isoformat(),
                "days_until_expiry": 365,
                "rotation_status": "active",
            },
            "message": "Credentials rotated successfully. New credentials sent to admin email.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}/updates", tags=["Company"])
async def get_updates(company_id: str):
    updates = check_marketplace_updates(company_id)
    return updates


@router.post("/{company_id}/updates/apply", tags=["Company"])
async def apply_updates(company_id: str):
    updated = apply_auto_updates(company_id)
    return {"success": True, "updated_agents": updated, "count": len(updated)}


@router.get("/{company_id}/available-upgrades", tags=["Company"])
async def get_available_upgrades(company_id: str):
    """
    Get list of available upgrades from marketplace for company's agents.
    This endpoint shows what newer/better agents are available in the marketplace.
    """
    updates = check_marketplace_updates(company_id)

    upgrades = updates.get("upgrades", [])

    # Format for frontend
    available = []
    for upgrade in upgrades:
        available.append(
            {
                "current_agent_id": upgrade.get("current_agent_id"),
                "current_version": upgrade.get("current_version"),
                "new_agent_id": upgrade.get("new_agent", {}).get("agent_id"),
                "new_agent_name": upgrade.get("new_agent", {}).get("agent_name"),
                "new_version": upgrade.get("new_agent", {}).get("version"),
                "changelog": upgrade.get("new_agent", {}).get("changelog"),
                "auto_update_enabled": upgrade.get("auto_update", False),
            }
        )

    return {
        "has_upgrades": len(available) > 0,
        "upgrades": available,
        "count": len(available),
    }


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
    hist = (
        db.table("execution_history")
        .select(
            "success, execution_time_seconds, tokens_used, quality_score, executed_at, agent_id"
        )
        .eq("company_id", company_id)
        .order("executed_at", desc=True)
        .limit(200)
        .execute()
    )

    rows = hist.data or []
    total = len(rows)
    successes = sum(1 for r in rows if r.get("success"))
    avg_quality = round(
        sum(r.get("quality_score") or 0 for r in rows) / max(total, 1), 3
    )
    avg_time = round(
        sum(r.get("execution_time_seconds") or 0 for r in rows) / max(total, 1), 2
    )
    total_tokens = sum(r.get("tokens_used") or 0 for r in rows)

    return {
        "total_executions": total,
        "success_rate": round(successes / max(total, 1), 3),
        "average_quality_score": avg_quality,
        "average_execution_time": avg_time,
        "total_tokens_used": total_tokens,
        "recent_executions": rows[:10],
    }


class GenerateCompanyAPIKeyRequest(BaseModel):
    send_email: bool = True


class CompanyAPIKeyResponse(BaseModel):
    success: bool
    message: str
    api_key: Optional[str] = None
    api_key_masked: Optional[str] = None


@router.post(
    "/{company_id}/generate-api-key",
    response_model=CompanyAPIKeyResponse,
    tags=["Company"],
)
async def generate_company_api_key(
    company_id: str, body: Optional[GenerateCompanyAPIKeyRequest] = Body(default=None)
):
    """
    Generate a company-level API key that can be used to access all company agents.
    """
    db = get_supabase()
    send_email = body.send_email if body else True

    # Get company info
    company = db.table("companies").select("*").eq("company_id", company_id).execute()
    if not company.data:
        raise HTTPException(status_code=404, detail="Company not found")

    # Generate new API key pair
    api_key = CredentialManager.generate_api_key(prefix="sk_company")
    secret_key = CredentialManager.generate_secret_key()
    api_key_hash = CredentialManager.hash_key_for_lookup(api_key)
    secret_key_hash = CredentialManager.hash_key_for_lookup(secret_key)

    # Calculate expiry (365 days from now)
    from datetime import timedelta

    expiry_date = datetime.utcnow() + timedelta(days=365)

    # Update company with new API key
    db.table("companies").update(
        {
            "api_key_hash": api_key_hash,
            "secret_key_hash": secret_key_hash,
            "api_key_expiry_date": expiry_date.isoformat(),
            "api_key_status": "active",
        }
    ).eq("company_id", company_id).execute()

    # Get admin email to send the key
    admin_user = (
        db.table("users")
        .select("email")
        .eq("company_id", company_id)
        .eq("role", "admin")
        .execute()
    )
    admin_email = admin_user.data[0]["email"] if admin_user.data else None

    # Send email with API key
    if send_email and admin_email:
        await EmailService.send_company_api_key_email(
            to_email=admin_email,
            api_key=api_key,
            secret_key=secret_key,
            company_name=company.data[0].get("company_name", "Your Company"),
            expiry_date=expiry_date.strftime("%Y-%m-%d"),
        )

    return CompanyAPIKeyResponse(
        success=True,
        message="Company API key generated successfully",
        api_key=api_key,  # Show for testing
        api_key_masked=CredentialManager.mask_api_key(api_key),
    )


@router.post("/{company_id}/revoke-api-key", tags=["Company"])
async def revoke_company_api_key(company_id: str):
    """
    Revoke the current company API key.
    """
    db = get_supabase()

    # Check if company exists
    company = db.table("companies").select("*").eq("company_id", company_id).execute()
    if not company.data:
        raise HTTPException(status_code=404, detail="Company not found")

    # Check if there's an active key
    current_key = company.data[0].get("api_key_status")
    if current_key != "active":
        return {"success": False, "message": "No active API key to revoke"}

    # Revoke the key
    db.table("companies").update(
        {
            "api_key_hash": None,
            "secret_key_hash": None,
            "api_key_expiry_date": None,
            "api_key_status": "revoked",
        }
    ).eq("company_id", company_id).execute()

    return {"success": True, "message": "Company API key revoked successfully"}


@router.get("/{company_id}/api-key-status", tags=["Company"])
async def get_api_key_status(company_id: str):
    """
    Get the status of the company API key (not the key itself).
    """
    db = get_supabase()

    company = (
        db.table("companies")
        .select("api_key_status, api_key_expiry_date")
        .eq("company_id", company_id)
        .execute()
    )
    if not company.data:
        raise HTTPException(status_code=404, detail="Company not found")

    data = company.data[0]
    return {
        "api_key_status": data.get("api_key_status", "inactive"),
        "api_key_expiry_date": data.get("api_key_expiry_date"),
        "has_active_key": data.get("api_key_status") == "active",
    }
