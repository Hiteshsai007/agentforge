"""
API: POST /api/intent/parse
Parses natural language into structured intent.
"""
from fastapi import APIRouter
from ..models import ParseRequest, ParseResponse, Intent
from ..engine.intent_parser import parse_intent

router = APIRouter()


@router.post("/parse", response_model=ParseResponse, tags=["Intent"])
async def parse(body: ParseRequest):
    if not body.request or not body.request.strip():
        return ParseResponse(
            success=False,
            error="Request cannot be empty.",
            suggestions=["Try: 'Summarize this document'", "Try: 'Research AI trends'"],
        )

    result = parse_intent(body.request.strip())

    if result.get("error"):
        return ParseResponse(
            success=False,
            error=result.get("message", "Could not parse request."),
            suggestions=result.get("suggestions", []),
        )

    intent = Intent(**{k: v for k, v in result.items() if k in Intent.model_fields})
    return ParseResponse(success=True, intent=intent)
