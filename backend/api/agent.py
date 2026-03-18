"""
API: POST /api/agent/execute
Orchestrates intent → routing → execution → feedback.
"""

import uuid
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from ..models import ExecuteRequest, ExecutionResult, RoutingDecision
from ..engine.intent_parser import parse_intent
from ..engine.router import route_intent
from ..engine.executor import execute_agent, execute_with_delegation
from ..engine.feedback import record_execution
from ..services.credentials import CredentialManager
from ..db.supabase_client import get_supabase

router = APIRouter()


@router.post("/execute", response_model=ExecutionResult, tags=["Agent"])
async def execute(
    body: ExecuteRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_secret_key: Optional[str] = Header(None, alias="X-Secret-Key"),
    x_company_api_key: Optional[str] = Header(None, alias="X-Company-API-Key"),
    x_agent_id: Optional[str] = Header(None, alias="X-Agent-ID"),
    x_enable_delegation: Optional[str] = Header(None, alias="X-Enable-Delegation"),
):
    # ── Verify credentials ───────────────────────────────────────────────
    company_id = body.company_id

    # Option 1: Company API Key (new)
    if x_company_api_key:
        db = get_supabase()
        api_key_hash = CredentialManager.hash_key_for_lookup(x_company_api_key)

        # Find company with this API key
        company_result = (
            db.table("companies")
            .select("company_id, company_name, api_key_status, api_key_expiry_date")
            .eq("api_key_hash", api_key_hash)
            .execute()
        )

        if not company_result.data:
            raise HTTPException(status_code=401, detail="Invalid company API key")

        company_data = company_result.data[0]

        # Check if key is active
        if company_data.get("api_key_status") != "active":
            raise HTTPException(status_code=401, detail="Company API key is not active")

        # Check if key is expired
        expiry = company_data.get("api_key_expiry_date")
        if expiry:
            from datetime import datetime

            expiry_date = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
            if expiry_date.replace(tzinfo=None) < datetime.utcnow():
                raise HTTPException(
                    status_code=401, detail="Company API key has expired"
                )

        # Use the company from the API key
        company_id = company_data["company_id"]

        # If X-Agent-ID is provided, use that specific agent
        if x_agent_id:
            # Verify the agent belongs to this company
            try:
                agent_result = (
                    db.table("company_agents")
                    .select(
                        "*, agents_marketplace(agent_id, agent_name, version, capabilities, description)"
                    )
                    .eq("company_id", company_id)
                    .eq("agent_id", x_agent_id)
                    .execute()
                )
            except Exception:
                raise HTTPException(
                    status_code=404, detail="Agent not found in company portfolio"
                )

            if not agent_result.data:
                raise HTTPException(
                    status_code=404, detail="Agent not found in company portfolio"
                )

    # Option 2: Per-agent API Key (existing)
    elif x_api_key or x_secret_key:
        if not x_api_key or not x_secret_key:
            raise HTTPException(
                status_code=401,
                detail="Both X-API-Key and X-Secret-Key headers are required for authentication",
            )

        result = CredentialManager.verify_credentials(x_api_key, x_secret_key)

        if not result["valid"]:
            raise HTTPException(
                status_code=401, detail=result.get("error", "Invalid credentials")
            )

        # Optionally verify the credentials belong to the requested company
        if body.company_id and result["company_id"] != body.company_id:
            raise HTTPException(
                status_code=401,
                detail="Credentials do not belong to the specified company",
            )

    # ── Route the intent ────────────────────────────────────────────

    # If specific agent ID provided (company API key mode), use that agent directly
    if x_agent_id and company_id:
        db = get_supabase()
        try:
            agent_result = (
                db.table("company_agents")
                .select(
                    "*, agents_marketplace(agent_id, agent_name, version, capabilities, description, provider, pricing_model)"
                )
                .eq("company_id", company_id)
                .eq("agent_id", x_agent_id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(
                status_code=404, detail="Agent not found in company portfolio"
            )

        if not agent_result.data or not agent_result.data[0].get("agents_marketplace"):
            raise HTTPException(
                status_code=404, detail="Agent not found in company portfolio"
            )

        agent_data = agent_result.data[0]
        mp_data = agent_data["agents_marketplace"]

        # Create a RoutingDecision with the specific agent
        from ..models import AgentInfo

        selected_agent = AgentInfo(
            agent_id=mp_data["agent_id"],
            agent_name=mp_data["agent_name"],
            version=mp_data.get("version", "1.0.0"),
            capabilities=mp_data.get("capabilities", []),
            description=mp_data.get("description", ""),
            provider=mp_data.get("provider", ""),
            quality_score=float(agent_data.get("quality_score", 0.5)),
            execution_count=int(agent_data.get("execution_count", 0)),
            pricing_model=mp_data.get("pricing_model", "free"),
        )

        routing = RoutingDecision(
            selected_agent=selected_agent,
            is_multi_agent=False,
            routing_reason=f"Direct agent selection via X-Agent-ID header",
        )
    else:
        # Normal routing
        routing: RoutingDecision = route_intent(body.intent, company_id)

    # ── If no agent available, return routing info without executing ──
    if not routing.selected_agent and not routing.is_multi_agent:
        return ExecutionResult(
            execution_id=str(uuid.uuid4()),
            success=False,
            error="No matching agent found in company portfolio.",
            routing=routing,
            agents_used=[],
        )

    # ── Multi-agent path ────────────────────────────────────────────
    if routing.is_multi_agent:
        # Check if all steps have agents
        missing = [s for s in routing.workflow_steps if s.status == "missing"]
        if missing:
            return ExecutionResult(
                execution_id=str(uuid.uuid4()),
                success=False,
                error=f"Missing agents for: {', '.join(s.capability for s in missing)}",
                routing=routing,
                agents_used=[
                    s.agent.agent_name
                    for s in routing.workflow_steps
                    if s.agent is not None
                ],
            )

        steps_input = []
        for step in routing.workflow_steps:
            steps_input.append(
                {
                    "step": step.step,
                    "capability": step.capability,
                    "description": body.intent.original_request,
                    "task": f"Step {step.step}: {step.capability} — {body.intent.original_request}",
                }
            )

        all_caps = [s.capability for s in routing.workflow_steps]
        result = execute_agent(
            task_description=body.intent.original_request,
            capabilities=all_caps,
            is_multi_agent=True,
            workflow_steps=steps_input,
        )

        agent_ids = [s.agent.agent_id for s in routing.workflow_steps if s.agent]
        agent_names = [s.agent.agent_name for s in routing.workflow_steps if s.agent]
        agent_id = agent_ids[0] if agent_ids else None

    else:
        # ── Single-agent path ───────────────────────────────────────
        agent = routing.selected_agent
        agent_id = agent.agent_id
        agent_names = [agent.agent_name]

        # Build task description from intent + parameters
        task_desc = body.intent.original_request
        if body.intent.parameters:
            param_str = ", ".join(
                f"{k}: {v}" for k, v in body.intent.parameters.items()
            )
            task_desc = f"{task_desc}\n\nParameters: {param_str}"

        # Check if delegation is enabled
        enable_delegation = x_enable_delegation and x_enable_delegation.lower() in (
            "true",
            "1",
            "yes",
        )

        if enable_delegation:
            # Use delegation execution
            result = execute_with_delegation(
                task=task_desc,
                primary_agent_id=agent_id,
                company_id=company_id,
            )
            # Update agents_used to include delegation chain
            if result.get("delegation_chain"):
                for del_agent_id in result["delegation_chain"]:
                    agent_names.append(del_agent_id)
        else:
            result = execute_agent(
                task_description=task_desc,
                capabilities=agent.capabilities,
                is_multi_agent=False,
            )

    # ── Record feedback ─────────────────────────────────────────────
    new_quality = 0.5
    if agent_id:
        try:
            new_quality = record_execution(
                execution_id=result.get("execution_id", str(uuid.uuid4())),
                company_id=company_id,
                agent_id=agent_id,
                request_text=body.intent.original_request,
                parsed_intent=body.intent.model_dump(),
                result_data={"output": result.get("output")},
                execution_time=result.get("execution_time", 0),
                tokens_used=result.get("tokens_used", 0),
                success=result.get("success", False),
                error_type=result.get("error"),
                user_id=body.user_id,
            )
        except Exception as e:
            print(f"⚠️  Feedback recording failed: {e}")

    return ExecutionResult(
        execution_id=result.get("execution_id", str(uuid.uuid4())),
        success=result.get("success", False),
        result={"output": result.get("output"), "format": "text"},
        agents_used=agent_names,
        execution_time=round(result.get("execution_time", 0), 2),
        tokens_used=result.get("tokens_used", 0),
        quality_score=new_quality,
        error=result.get("error"),
        routing=routing,
    )
