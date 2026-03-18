"""
API: Authentication endpoints
- POST /api/auth/signup: Register new user
- POST /api/auth/login: Login user
- GET /api/auth/me: Get current user info
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from db.supabase_client import get_supabase
from services.auth import AuthService

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""
    signup_type: str  # "personal", "join_company", "create_company"
    company_name: str = ""  # For create_company
    invite_code: str = ""  # For join_company


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: dict = {}
    company: dict = {}
    token: str = ""


class UserInfoResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    company_id: str = None
    company_name: str = None


@router.post("/signup", response_model=AuthResponse, tags=["Auth"])
async def signup(body: SignupRequest):
    """Register a new user."""
    db = get_supabase()

    # Check if user already exists
    existing = db.table("users").select("user_id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Build user data
    user_data = {
        "email": body.email,
        "password_hash": AuthService.hash_password(body.password),
        "full_name": body.full_name,
        "role": "end_user",
    }

    company_data = {}

    if body.signup_type == "create_company":
        if not body.company_name:
            raise HTTPException(status_code=400, detail="Company name required")

        invite_code = AuthService.generate_invite_code()
        company_result = (
            db.table("companies")
            .insert(
                {
                    "company_name": body.company_name,
                    "invite_code": invite_code,
                }
            )
            .execute()
        )

        if not company_result.data:
            raise HTTPException(status_code=500, detail="Failed to create company")

        company = company_result.data[0]
        user_data["company_id"] = company["company_id"]
        user_data["role"] = "admin"

        company_data = {
            "company_id": company["company_id"],
            "company_name": company["company_name"],
            "invite_code": invite_code,
        }

    elif body.signup_type == "join_company":
        if not body.invite_code:
            raise HTTPException(status_code=400, detail="Invite code required")

        company_result = (
            db.table("companies")
            .select("*")
            .eq("invite_code", body.invite_code.upper())
            .execute()
        )

        if not company_result.data:
            raise HTTPException(status_code=400, detail="Invalid invite code")

        company = company_result.data[0]
        user_data["company_id"] = company["company_id"]

        company_data = {
            "company_id": company["company_id"],
            "company_name": company["company_name"],
            "invite_code": company["invite_code"],
        }

    # Create user
    try:
        result = db.table("users").insert(user_data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]

    # Generate JWT token
    token = AuthService.create_access_token(
        {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
        }
    )

    return AuthResponse(
        success=True,
        message="Registration successful",
        user={
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "company_id": user.get("company_id"),
        },
        company=company_data,
        token=token,
    )


@router.post("/login", response_model=AuthResponse, tags=["Auth"])
async def login(body: LoginRequest):
    """Login with email and password."""
    db = get_supabase()

    # Find user
    result = db.table("users").select("*").eq("email", body.email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]

    # Check if password_hash exists
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401, detail="Account not set up properly. Please sign up again."
        )

    # Verify password
    if not AuthService.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update last login
    db.table("users").update({"last_login": datetime.utcnow().isoformat()}).eq(
        "user_id", user["user_id"]
    ).execute()

    # Get company info if user has company
    company_data = {}
    if user.get("company_id"):
        company_result = (
            db.table("companies")
            .select("company_name, invite_code")
            .eq("company_id", user["company_id"])
            .execute()
        )
        if company_result.data:
            company_data = {
                "company_id": user["company_id"],
                "company_name": company_result.data[0]["company_name"],
                "invite_code": company_result.data[0].get("invite_code"),
            }

    # Generate JWT token
    token = AuthService.create_access_token(
        {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
        }
    )

    return AuthResponse(
        success=True,
        message="Login successful",
        user={
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "company_id": user.get("company_id"),
        },
        company=company_data,
        token=token,
    )


@router.get("/company/invite-code", tags=["Auth"])
async def get_invite_code(authorization: str = Header(None)):
    """Get the invite code for the current user's company."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "")
    payload = AuthService.decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = get_supabase()

    user_result = (
        db.table("users")
        .select("company_id")
        .eq("user_id", payload["user_id"])
        .execute()
    )

    if not user_result.data or not user_result.data[0].get("company_id"):
        raise HTTPException(status_code=400, detail="You don't have a company")

    company_id = user_result.data[0]["company_id"]

    company_result = (
        db.table("companies")
        .select("company_name, invite_code")
        .eq("company_id", company_id)
        .execute()
    )

    if not company_result.data:
        raise HTTPException(status_code=404, detail="Company not found")

    company = company_result.data[0]

    if not company.get("invite_code"):
        new_code = AuthService.generate_invite_code()
        db.table("companies").update({"invite_code": new_code}).eq(
            "company_id", company_id
        ).execute()
        company["invite_code"] = new_code

    return {
        "company_id": company_id,
        "company_name": company["company_name"],
        "invite_code": company["invite_code"],
    }


@router.get("/me", response_model=UserInfoResponse, tags=["Auth"])
async def get_me(authorization: str = None):
    """Get current user info from token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid authorization header"
        )

    token = authorization.replace("Bearer ", "")
    payload = AuthService.decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = get_supabase()

    # Get user
    user_result = (
        db.table("users").select("*").eq("user_id", payload["user_id"]).execute()
    )

    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user_result.data[0]

    # Get company info
    company_name = None
    if user.get("company_id"):
        company_result = (
            db.table("companies")
            .select("company_name")
            .eq("company_id", user["company_id"])
            .execute()
        )
        if company_result.data:
            company_name = company_result.data[0]["company_name"]

    return UserInfoResponse(
        user_id=user["user_id"],
        email=user["email"],
        full_name=user.get("full_name", ""),
        role=user["role"],
        company_id=user.get("company_id"),
        company_name=company_name,
    )
