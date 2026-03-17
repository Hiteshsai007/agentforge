"""
Pydantic models and dataclasses for the AI Agent Marketplace backend.
"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


# ─── Intent Parsing ────────────────────────────────────────────────────────────

class SubTask(BaseModel):
    step: int
    intent: str
    required_capability: str
    parameters: dict[str, Any] = {}


class Intent(BaseModel):
    intent: str
    task_type: str
    required_capability: str          # comma-separated for multi-agent
    parameters: dict[str, Any] = {}
    original_request: str
    confidence: float = Field(ge=0.0, le=1.0)
    sub_tasks: list[SubTask] = []
    is_multi_agent: bool = False


class ParseRequest(BaseModel):
    request: str


class ParseResponse(BaseModel):
    success: bool
    intent: Optional[Intent] = None
    error: Optional[str] = None
    suggestions: list[str] = []


# ─── Routing ───────────────────────────────────────────────────────────────────

class AgentInfo(BaseModel):
    agent_id: str
    agent_name: str
    version: str
    capabilities: list[str]
    description: str
    provider: str
    quality_score: float = 0.5
    execution_count: int = 0
    pricing_model: str = "free"
    changelog: Optional[str] = None


class WorkflowStep(BaseModel):
    step: int
    capability: str
    status: str   # "available" | "missing"
    agent: Optional[AgentInfo] = None
    marketplace_options: list[AgentInfo] = []


class RoutingDecision(BaseModel):
    selected_agent: Optional[AgentInfo] = None
    alternatives: list[AgentInfo] = []
    is_multi_agent: bool = False
    workflow_steps: list[WorkflowStep] = []
    missing_capabilities: list[str] = []
    routing_reason: str = ""


# ─── Execution ─────────────────────────────────────────────────────────────────

class ExecuteRequest(BaseModel):
    intent: Intent
    company_id: str
    user_id: Optional[str] = None


class ExecutionResult(BaseModel):
    execution_id: str
    success: bool
    result: Any = None
    agents_used: list[str] = []
    execution_time: float = 0.0
    tokens_used: int = 0
    quality_score: float = 0.5
    error: Optional[str] = None
    routing: Optional[RoutingDecision] = None


# ─── Marketplace ───────────────────────────────────────────────────────────────

class RegisterAgentRequest(BaseModel):
    agent_name: str
    version: str
    capabilities: list[str]
    description: str
    provider: str
    input_type: str = "text"
    output_type: str = "text"
    api_endpoint: str
    health_check_endpoint: Optional[str] = None
    pricing_model: str = "free"
    changelog: Optional[str] = None


# ─── Company ───────────────────────────────────────────────────────────────────

class AddAgentRequest(BaseModel):
    agent_id: str
    auto_update_enabled: bool = True


class UpdateAgentSettingsRequest(BaseModel):
    auto_update_enabled: Optional[bool] = None
    status: Optional[str] = None
    quality_privacy: Optional[str] = None  # "private" | "public"


# ─── Quality / EMA ─────────────────────────────────────────────────────────────

class ExecutionMetrics(BaseModel):
    success: bool
    execution_time_seconds: float
    tokens_used: int
    max_execution_time: float = 60.0
    max_tokens: int = 2000

    def execution_score(self) -> float:
        success_w = 1.0 if self.success else 0.0
        speed_w = max(0.0, 1.0 - (self.execution_time_seconds / self.max_execution_time))
        cost_w  = max(0.0, 1.0 - (self.tokens_used / self.max_tokens))
        return 0.5 * success_w + 0.3 * speed_w + 0.2 * cost_w


# ─── Credentials ───────────────────────────────────────────────────────────────

class CredentialGenerateRequest(BaseModel):
    send_email: bool = True


class CredentialResponse(BaseModel):
    credential_id: str
    api_key: str  # Plaintext, only returned once
    secret_key: str  # Plaintext, only returned once
    expiry_date: str
    created_at: str
    message: str = "Store these credentials securely. They will not be shown again."


class CredentialStatusResponse(BaseModel):
    credential_id: str
    api_key_masked: str  # e.g., "sk_live_****...****"
    expiry_date: str
    days_until_expiry: int
    rotation_status: str
    last_used: Optional[str]


class CredentialRotateRequest(BaseModel):
    send_email: bool = True


class CredentialVerifyRequest(BaseModel):
    api_key: str
    secret_key: str


class CredentialVerifyResponse(BaseModel):
    valid: bool
    company_id: Optional[str] = None
    agent_id: Optional[str] = None
    error: Optional[str] = None
