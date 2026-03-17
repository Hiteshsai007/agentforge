"""
API: OTP-based credential generation flow
- POST /api/credentials/request-otp: Send OTP to user's email
- POST /api/credentials/verify-otp: Verify OTP and send credentials
- POST /api/credentials/resend-otp: Resend OTP (rate limited)
"""
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..db.supabase_client import get_supabase
from ..services.credentials import CredentialManager
from ..services.email_service import EmailService

router = APIRouter()

OTP_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 3
RESEND_COOLDOWN_SECONDS = 60


class RequestOTPRequest(BaseModel):
    email: str
    company_id: str
    agent_id: str


class RequestOTPResponse(BaseModel):
    success: bool
    message: str
    expires_in: int = 300


class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    company_id: str
    agent_id: str


class VerifyOTPResponse(BaseModel):
    success: bool
    message: str


class ResendOTPRequest(BaseModel):
    email: str
    company_id: str
    agent_id: str


@router.post("/request-otp", response_model=RequestOTPResponse, tags=["Credentials"])
async def request_otp(body: RequestOTPRequest):
    """
    Generate OTP and send to user's email for verification.
    """
    db = get_supabase()
    
    user_result = db.table("users").select("email").eq(
        "company_id", body.company_id
    ).eq("email", body.email).execute()
    
    if not user_result.data:
        raise HTTPException(
            status_code=404,
            detail="Email not found for this company"
        )
    
    agent_result = db.table("agents_marketplace").select("agent_name").eq(
        "agent_id", body.agent_id
    ).execute()
    agent_name = agent_result.data[0]["agent_name"] if agent_result.data else "Agent"
    
    existing_otp = db.table("email_verifications").select("*").eq(
        "email", body.email
    ).eq("company_id", body.company_id).eq("agent_id", body.agent_id).eq(
        "purpose", "reveal_api_key"
    ).eq("used", False).execute()
    
    if existing_otp.data:
        last_created = existing_otp.data[0].get("created_at")
        if last_created:
            created_at = datetime.fromisoformat(last_created.replace("Z", "+00:00"))
            time_diff = (datetime.utcnow() - created_at.replace(tzinfo=None)).total_seconds()
            if time_diff < RESEND_COOLDOWN_SECONDS:
                remaining = int(RESEND_COOLDOWN_SECONDS - time_diff)
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {remaining} seconds before requesting another OTP"
                )
    
    otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    db.table("email_verifications").insert({
        "email": body.email,
        "code": otp_code,
        "purpose": "reveal_api_key",
        "company_id": body.company_id,
        "agent_id": body.agent_id,
        "attempts": 0,
        "expires_at": expires_at.isoformat(),
        "used": False,
    }).execute()
    
    await EmailService.send_verification_email(
        to_email=body.email,
        code=otp_code,
        expiry_minutes=OTP_EXPIRY_MINUTES
    )
    
    return RequestOTPResponse(
        success=True,
        message=f"OTP sent to {body.email}",
        expires_in=OTP_EXPIRY_MINUTES * 60
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse, tags=["Credentials"])
async def verify_otp(body: VerifyOTPRequest):
    """
    Verify OTP and generate/send credentials to email.
    """
    db = get_supabase()
    
    otp_result = db.table("email_verifications").select("*").eq(
        "email", body.email
    ).eq("company_id", body.company_id).eq(
        "agent_id", body.agent_id
    ).eq("purpose", "reveal_api_key").eq("used", False).execute()
    
    if not otp_result.data:
        raise HTTPException(
            status_code=400,
            detail="No pending OTP verification found"
        )
    
    otp_record = otp_result.data[0]
    
    if otp_record.get("attempts", 0) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=403,
            detail="Maximum attempts exceeded. Please request a new OTP."
        )
    
    expires_at = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
    if expires_at.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new one."
        )
    
    if otp_record["code"] != body.otp_code:
        db.table("email_verifications").update({
            "attempts": otp_record.get("attempts", 0) + 1
        }).eq("verification_id", otp_record["verification_id"]).execute()
        
        remaining = MAX_ATTEMPTS - otp_record.get("attempts", 0) - 1
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempts remaining."
        )
    
    db.table("email_verifications").update({"used": True}).eq(
        "verification_id", otp_record["verification_id"]
    ).execute()
    
    agent_result = db.table("agents_marketplace").select("agent_name").eq(
        "agent_id", body.agent_id
    ).execute()
    agent_name = agent_result.data[0]["agent_name"] if agent_result.data else "Agent"
    
    api_key, secret_key, expiry_date = CredentialManager.create_credential_pair()
    api_key_hash = CredentialManager.hash_key(api_key)
    secret_key_hash = CredentialManager.hash_key(secret_key)
    
    db.table("agent_credentials").upsert({
        "company_id": body.company_id,
        "agent_id": body.agent_id,
        "api_key_hash": api_key_hash,
        "secret_key_hash": secret_key_hash,
        "expiry_date": expiry_date.isoformat(),
        "rotation_status": "active",
        "last_rotated": datetime.utcnow().isoformat()
    }, on_conflict="company_id,agent_id").execute()
    
    await EmailService.send_credential_email(
        to_email=body.email,
        api_key=api_key,
        secret_key=secret_key,
        expiry_date=expiry_date.strftime("%Y-%m-%d"),
        agent_name=agent_name
    )
    
    return VerifyOTPResponse(
        success=True,
        message=f"Credentials sent to {body.email}"
    )


@router.post("/resend-otp", response_model=RequestOTPResponse, tags=["Credentials"])
async def resend_otp(body: ResendOTPRequest):
    """
    Resend OTP with rate limiting.
    """
    return await request_otp(RequestOTPRequest(
        email=body.email,
        company_id=body.company_id,
        agent_id=body.agent_id
    ))


class RegenerateWithEmailRequest(BaseModel):
    email: str
    company_id: str
    agent_id: str


class RegenerateResponse(BaseModel):
    success: bool
    message: str


@router.post("/regenerate-with-email", response_model=RegenerateResponse, tags=["Credentials"])
async def regenerate_with_email(body: RegenerateWithEmailRequest):
    """
    Regenerate credentials and send them to the user's email.
    """
    db = get_supabase()
    
    # Verify email belongs to the company
    user_result = db.table("users").select("email").eq(
        "company_id", body.company_id
    ).eq("email", body.email).execute()
    
    if not user_result.data:
        raise HTTPException(
            status_code=404,
            detail="Email not found for this company"
        )
    
    # Get agent name for email
    agent_result = db.table("agents_marketplace").select("agent_name").eq(
        "agent_id", body.agent_id
    ).execute()
    
    agent_name = agent_result.data[0]["agent_name"] if agent_result.data else "Agent"
    
    # Generate new credential pair
    api_key, secret_key, expiry_date = CredentialManager.create_credential_pair()
    
    # Hash keys for storage
    api_key_hash = CredentialManager.hash_key(api_key)
    secret_key_hash = CredentialManager.hash_key(secret_key)
    
    # Update credentials in database (revokes old ones)
    db.table("agent_credentials").upsert({
        "company_id": body.company_id,
        "agent_id": body.agent_id,
        "api_key_hash": api_key_hash,
        "secret_key_hash": secret_key_hash,
        "expiry_date": expiry_date.isoformat(),
        "rotation_status": "active",
        "last_rotated": datetime.now().isoformat()
    }, on_conflict="company_id,agent_id").execute()
    
    # Send email with new credentials
    await EmailService.send_credential_email(
        to_email=body.email,
        api_key=api_key,
        secret_key=secret_key,
        expiry_date=expiry_date.strftime("%Y-%m-%d"),
        agent_name=agent_name
    )
    
    return RegenerateResponse(
        success=True,
        message=f"New credentials sent to {body.email}"
    )
