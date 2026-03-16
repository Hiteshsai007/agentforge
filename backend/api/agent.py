"""
API: POST /api/agent/execute
Orchestrates intent → routing → execution → feedback.
"""
import uuid
from fastapi import APIRouter
from models import ExecuteRequest, ExecutionResult, RoutingDecision
from engine.intent_parser import parse_intent
from engine.router import route_intent
from engine.executor import execute_agent
from engine.feedback import record_execution

router = APIRouter()


@router.post("/execute", response_model=ExecutionResult, tags=["Agent"])
async def execute(body: ExecuteRequest):
    company_id = body.company_id

    # ── Route the intent ────────────────────────────────────────────
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
                agents_used=[s.agent.agent_name for s in routing.workflow_steps if s.agent is not None],
            )


        steps_input = []
        for step in routing.workflow_steps:
            steps_input.append({
                "step": step.step,
                "capability": step.capability,
                "description": body.intent.original_request,
                "task": f"Step {step.step}: {step.capability} — {body.intent.original_request}",
            })

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
            param_str = ", ".join(f"{k}: {v}" for k, v in body.intent.parameters.items())
            task_desc = f"{task_desc}\n\nParameters: {param_str}"

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
