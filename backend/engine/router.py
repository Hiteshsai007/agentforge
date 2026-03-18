"""
Routing Engine — matches parsed intents to the best available agent.
Strategy: version-first selection (newest wins), quality score as tiebreaker.
"""

from __future__ import annotations
import re
from typing import Optional
from db.supabase_client import get_supabase
from models import AgentInfo, RoutingDecision, WorkflowStep, Intent


def _parse_semver(version: str) -> tuple[int, int, int]:
    """Parse semantic version string into comparable tuple."""
    try:
        parts = re.sub(r"[^0-9.]", "", version).split(".")
        return tuple(int(p) for p in (parts + [0, 0, 0])[:3])
    except Exception:
        return (0, 0, 0)


def _agent_row_to_info(
    row: dict,
    quality_score: float = 0.5,
    execution_count: int = 0,
    global_quality_score: Optional[float] = None,
) -> AgentInfo:
    return AgentInfo(
        agent_id=row["agent_id"],
        agent_name=row["agent_name"],
        version=row["version"],
        capabilities=row.get("capabilities", []),
        description=row.get("description", ""),
        provider=row.get("provider", ""),
        quality_score=global_quality_score
        if global_quality_score is not None
        else quality_score,
        execution_count=execution_count,
        pricing_model=row.get("pricing_model", "free"),
        changelog=row.get("changelog"),
    )


def get_company_agents(company_id: str) -> list[dict]:
    """Fetch all active agents in company portfolio, with quality scores."""
    db = get_supabase()
    result = (
        db.table("company_agents")
        .select(
            "agent_id, status, auto_update_enabled, quality_score, execution_count, "
            "agents_marketplace(agent_id, agent_name, version, capabilities, description, provider, pricing_model, changelog)"
        )
        .eq("company_id", company_id)
        .eq("status", "active")
        .execute()
    )

    # Custom client returns list of dicts. If nested select is used,
    # the nested data might be in a list or a dict depending on PostgREST version.
    return result.data or []


def find_marketplace_agents_by_capability(capability: str) -> list[AgentInfo]:
    """Find all marketplace agents matching a capability."""
    db = get_supabase()
    result = (
        db.table("agents_marketplace")
        .select("*")
        .contains("capabilities", [capability])
        .eq("is_available", True)
        .execute()
    )
    agents = [_agent_row_to_info(r) for r in (result.data or [])]
    # Sort newest first
    agents.sort(key=lambda a: _parse_semver(a.version), reverse=True)
    return agents


def route_intent(intent: Intent, company_id: str) -> RoutingDecision:
    """
    Route an intent to the best available agent(s) for the company.
    Returns a RoutingDecision with selected agent or workflow steps.
    """
    company_rows = get_company_agents(company_id)

    # Build a map: agent_id → {quality_score, execution_count, marketplace_data}
    company_map: dict[str, dict] = {}
    for row in company_rows:
        mp_data = row.get("agents_marketplace")
        # Handle case where mp_data might be a single-item list from specific PostgREST versions
        mp = (
            mp_data[0]
            if isinstance(mp_data, list) and len(mp_data) > 0
            else (mp_data or {})
        )

        if isinstance(mp, dict):
            aid = mp.get("agent_id") or row.get("agent_id")
            # Get quality_privacy setting (default to private)
            settings = row.get("settings") or {}
            quality_privacy = settings.get("quality_privacy", "private")

            # If public, use global_quality_score from marketplace
            quality_to_use = float(row.get("quality_score") or 0.5)
            if quality_privacy == "public" and mp.get("global_quality_score"):
                quality_to_use = float(mp.get("global_quality_score"))

            company_map[aid] = {
                "quality_score": quality_to_use,
                "quality_privacy": quality_privacy,
                "execution_count": int(row.get("execution_count") or 0),
                **mp,
            }

    # ── Multi-agent path ────────────────────────────────────────────
    if intent.is_multi_agent and intent.sub_tasks:
        steps: list[WorkflowStep] = []
        missing: list[str] = []

        for st in intent.sub_tasks:
            cap = st.required_capability.strip()
            matched: Optional[AgentInfo] = None
            options: list[AgentInfo] = []

            # Search company portfolio
            candidates: list[AgentInfo] = []
            for aid, data in company_map.items():
                caps = data.get("capabilities", [])
                if cap in caps:
                    candidates.append(
                        _agent_row_to_info(
                            data,
                            quality_score=data["quality_score"],
                            execution_count=data["execution_count"],
                        )
                    )

            if candidates:
                candidates.sort(
                    key=lambda a: (_parse_semver(a.version), a.quality_score),
                    reverse=True,
                )
                matched = candidates[0]
                status = "available"
            else:
                missing.append(cap)
                status = "missing"
                options = find_marketplace_agents_by_capability(cap)[:3]

            steps.append(
                WorkflowStep(
                    step=st.step,
                    capability=cap,
                    status=status,
                    agent=matched,
                    marketplace_options=options,
                )
            )

        return RoutingDecision(
            is_multi_agent=True,
            workflow_steps=steps,
            missing_capabilities=missing,
            routing_reason="Multi-agent workflow — sequential execution",
        )

    # ── Single-agent path ───────────────────────────────────────────
    required_caps = [
        c.strip() for c in intent.required_capability.split(",") if c.strip()
    ]
    primary_cap = required_caps[0] if required_caps else ""

    # Collect company agents matching primary capability
    candidates: list[AgentInfo] = []
    for aid, data in company_map.items():
        caps = data.get("capabilities", [])
        if any(c in caps for c in required_caps):
            candidates.append(
                _agent_row_to_info(
                    data,
                    quality_score=data["quality_score"],
                    execution_count=data["execution_count"],
                )
            )

    if candidates:
        # Rank: version first, then quality score
        candidates.sort(
            key=lambda a: (_parse_semver(a.version), a.quality_score),
            reverse=True,
        )
        selected = candidates[0]
        alternatives = candidates[1:]
        return RoutingDecision(
            selected_agent=selected,
            alternatives=alternatives,
            is_multi_agent=False,
            routing_reason=f"Version-first: selected {selected.agent_name} v{selected.version}",
        )

    # No company agent found — check marketplace for alternatives
    marketplace_options = find_marketplace_agents_by_capability(primary_cap)
    return RoutingDecision(
        selected_agent=None,
        alternatives=marketplace_options[:3],
        is_multi_agent=False,
        missing_capabilities=[primary_cap],
        routing_reason=f"No company agent found for '{primary_cap}'. Marketplace alternatives shown.",
    )
