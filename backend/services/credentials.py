"""
Credentials management service - generates, hashes, rotates API credentials.
"""

import os
import secrets
import string
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Use bcrypt for production, or simple hash fallback
try:
    import bcrypt

    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False


class CredentialManager:
    """Manages API credential generation, hashing, and rotation."""

    EXPIRY_DAYS = int(os.getenv("CREDENTIALS_EXPIRY_DAYS", "365"))
    WARNING_DAYS = int(os.getenv("CREDENTIALS_WARNING_DAYS", "90"))

    @staticmethod
    def generate_api_key(prefix: str = "sk_live") -> str:
        """Generate a cryptographically secure API key."""
        random_part = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
        )
        return f"{prefix}_{random_part}"

    @staticmethod
    def generate_secret_key(prefix: str = "secret") -> str:
        """Generate a cryptographically secure secret key."""
        random_part = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(40)
        )
        return f"{prefix}_{random_part}"

    @staticmethod
    def hash_key(key: str) -> str:
        """Hash an API key or secret key for storage (uses bcrypt for per-key salts)."""
        if HAS_BCRYPT:
            salt = bcrypt.gensalt(rounds=12)
            return bcrypt.hashpw(key.encode("utf-8"), salt).decode("utf-8")
        else:
            # Fallback: use SHA256 (less secure, but works)
            return hashlib.sha256(key.encode("utf-8")).hexdigest()

    @staticmethod
    def hash_key_for_lookup(key: str) -> str:
        """Deterministic hash for API key lookup (uses SHA256, no salt).
        This is used for company API keys where we need to look up by hash."""
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    @staticmethod
    def verify_key(plaintext_key: str, hashed_key: str) -> bool:
        """Verify a plaintext key against its hash."""
        if not hashed_key:
            return False
        if HAS_BCRYPT:
            try:
                return bcrypt.checkpw(
                    plaintext_key.encode("utf-8"), hashed_key.encode("utf-8")
                )
            except Exception:
                return False
        else:
            # Fallback: compare SHA256 hashes
            return (
                hashlib.sha256(plaintext_key.encode("utf-8")).hexdigest() == hashed_key
            )

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        """Mask API key for display (e.g., sk_live_****...****)."""
        if len(api_key) <= 8:
            return api_key
        start = api_key[:8]
        end = api_key[-4:]
        return f"{start}****{end}"

    @staticmethod
    def get_expiry_date() -> datetime:
        """Get expiry datetime (default: 1 year from now)."""
        return datetime.utcnow() + timedelta(days=CredentialManager.EXPIRY_DAYS)

    @staticmethod
    def should_warn_about_expiry(expiry_date: datetime) -> bool:
        """Check if credential is approaching expiry (within warning period)."""
        days_until_expiry = (expiry_date - datetime.utcnow()).days
        return 0 < days_until_expiry <= CredentialManager.WARNING_DAYS

    @staticmethod
    def days_until_expiry(expiry_date: datetime) -> int:
        """Calculate days until expiry."""
        delta = expiry_date - datetime.utcnow()
        return max(0, delta.days)

    @staticmethod
    def create_credential_pair() -> Tuple[str, str, datetime]:
        """Create a new API key + secret key pair with expiry date."""
        api_key = CredentialManager.generate_api_key()
        secret_key = CredentialManager.generate_secret_key()
        expiry_date = CredentialManager.get_expiry_date()
        return api_key, secret_key, expiry_date

    @staticmethod
    def verify_credentials(api_key: str, secret_key: str) -> Dict[str, Any]:
        """
        Verify API key and secret key against stored credentials.
        Returns dict with valid, company_id, agent_id, error.
        """
        from ..db.supabase_client import get_supabase

        db = get_supabase()

        if not api_key or not secret_key:
            return {
                "valid": False,
                "company_id": None,
                "agent_id": None,
                "error": "Both api_key and secret_key are required",
            }

        result = (
            db.table("agent_credentials")
            .select(
                "credential_id, company_id, agent_id, expiry_date, rotation_status, api_key_hash, secret_key_hash"
            )
            .execute()
        )

        if not result.data:
            return {
                "valid": False,
                "company_id": None,
                "agent_id": None,
                "error": "Invalid API key",
            }

        for cred in result.data:
            if cred.get("rotation_status") == "rotating":
                continue

            try:
                if not CredentialManager.verify_key(
                    api_key, cred.get("api_key_hash", "")
                ):
                    continue
            except Exception:
                continue

            try:
                if not CredentialManager.verify_key(
                    secret_key, cred.get("secret_key_hash", "")
                ):
                    continue
            except Exception:
                continue

            try:
                expiry_date = datetime.fromisoformat(
                    cred["expiry_date"].replace("Z", "+00:00")
                )
                if expiry_date.replace(tzinfo=None) < datetime.now():
                    return {
                        "valid": False,
                        "company_id": None,
                        "agent_id": None,
                        "error": "Credentials have expired",
                    }
            except Exception:
                pass

            return {
                "valid": True,
                "company_id": cred["company_id"],
                "agent_id": cred["agent_id"],
                "error": None,
            }

        return {
            "valid": False,
            "company_id": None,
            "agent_id": None,
            "error": "Invalid API key or secret key",
        }
