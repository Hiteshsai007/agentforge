"""
Centralized configuration management for the AI Agent Marketplace backend.
Loads environment variables and provides type-safe config access.
"""

import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

    # AI/LLM
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.0-flash")

    # Execution
    MAX_EXECUTION_TIME: int = int(os.getenv("MAX_EXECUTION_TIME", "60"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2000"))
    ALPHA_EMA: float = float(os.getenv("ALPHA_EMA", "0.3"))

    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Email
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "sendgrid")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # Credentials
    CREDENTIALS_EXPIRY_DAYS: int = int(os.getenv("CREDENTIALS_EXPIRY_DAYS", "365"))
    CREDENTIALS_WARNING_DAYS: int = int(os.getenv("CREDENTIALS_WARNING_DAYS", "90"))

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # App
    APP_NAME: str = "AI Agent Marketplace"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    @classmethod
    def validate(cls) -> list[str]:
        """Validate required configuration. Returns list of missing/invalid settings."""
        errors = []

        if not cls.SUPABASE_URL:
            errors.append("SUPABASE_URL is required")
        if not cls.SUPABASE_ANON_KEY:
            errors.append("SUPABASE_ANON_KEY is required")
        if not cls.GEMINI_API_KEY:
            errors.append("GEMINI_API_KEY is required")

        return errors

    @classmethod
    def get_all(cls) -> dict:
        """Get all config as dict (safe for logging - no secrets)."""
        return {
            "supabase_url": bool(cls.SUPABASE_URL),
            "gemini_configured": bool(cls.GEMINI_API_KEY),
            "llm_provider": cls.LLM_PROVIDER,
            "llm_model": cls.LLM_MODEL,
            "max_execution_time": cls.MAX_EXECUTION_TIME,
            "max_tokens": cls.MAX_TOKENS,
            "app_version": cls.APP_VERSION,
        }


config = Config()
