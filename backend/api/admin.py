"""
API: GET /api/admin/metrics — programmer-only metrics endpoint
"""
from fastapi import APIRouter, Query
from db.supabase_client import get_supabase

router = APIRouter()


@router.get("/metrics", tags=["Admin"])
async def get_metrics(
    company_id: str = Query(..., description="Company ID"),
    agent_id: str = Query(default="", description="Optional agent filter"),
):
    db = get_supabase()
    query = db.table("execution_history").select("*").eq("company_id", company_id)
    if agent_id:
        query = query.eq("agent_id", agent_id)

    result = query.order("executed_at", desc=True).limit(500).execute()
    rows = result.data or []

    total = len(rows)
    successes = sum(1 for r in rows if r.get("success"))
    avg_quality = round(sum(r.get("quality_score") or 0 for r in rows) / max(total, 1), 3)
    avg_time    = round(sum(r.get("execution_time_seconds") or 0 for r in rows) / max(total, 1), 2)
    total_tokens = sum(r.get("tokens_used") or 0 for r in rows)
    estimated_cost = round(total_tokens * 0.000002, 4)

    failures = [r for r in rows if not r.get("success")][:10]

    # Quality trend — group by day
    from collections import defaultdict
    daily: dict = defaultdict(list)
    for r in rows:
        day = (r.get("executed_at") or "")[:10]
        if day and r.get("quality_score") is not None:
            daily[day].append(float(r["quality_score"]))

    quality_trend = [
        {"date": d, "score": round(sum(scores) / len(scores), 3)}
        for d, scores in sorted(daily.items())
    ]

    agent_name = "All Agents"
    if agent_id:
        ag = db.table("agents_marketplace").select("agent_name,version").eq("agent_id", agent_id).execute()
        if ag.data:
            agent_name = f"{ag.data[0]['agent_name']} v{ag.data[0]['version']}"

    return {
        "agent_name": agent_name,
        "agent_id": agent_id or None,
        "time_period": "all_time",
        "metrics": {
            "total_executions": total,
            "success_rate": round(successes / max(total, 1), 3),
            "average_quality_score": avg_quality,
            "average_execution_time": avg_time,
            "total_tokens_used": total_tokens,
            "estimated_cost": estimated_cost,
        },
        "quality_trend": quality_trend,
        "recent_failures": [
            {
                "execution_id": f.get("execution_id"),
                "error": f.get("error_type"),
                "timestamp": f.get("executed_at"),
            }
            for f in failures
        ],
    }
