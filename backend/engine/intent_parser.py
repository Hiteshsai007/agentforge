"""
Intent Parser — converts natural language into structured Intent objects.
Uses Gemini to parse the request into a structured JSON format.
"""

import json
import os
import re
from dotenv import load_dotenv
from models import Intent, SubTask

load_dotenv()

# Lazy-load genai to avoid Python 3.14 protobuf issues at import time
_genai = None


def _get_genai():
    global _genai
    if _genai is None:
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        _genai = genai
    return _genai


_SYSTEM_PROMPT = """You are an AI intent parser for an agent marketplace. 
Parse user requests into structured JSON intents.

Return ONLY valid JSON with this exact schema:
{
  "intent": "snake_case_identifier (e.g. summarize_text, research_topic)",
  "task_type": "one of: summarization, research, calculation, content_creation, translation, sentiment_analysis, data_analysis, multi_step, other",
  "required_capability": "comma-separated capability strings from: summarization, research, mathematics, content_creation, translation, sentiment_analysis, financial_analysis, text_processing, data_analysis",
  "parameters": { "key": "extracted values from the request" },
  "original_request": "exact user input",
  "confidence": 0.0-1.0,
  "is_multi_agent": true/false,
  "sub_tasks": [
    {
      "step": 1,
      "intent": "action_name",
      "required_capability": "single_capability",
      "parameters": {}
    }
  ]
}

Rules:
- is_multi_agent=true when the request clearly needs 2+ different capabilities
- For multi-agent, list sub_tasks in execution order
- sub_tasks is empty for single-agent requests
- confidence=1.0 for clear requests, lower for ambiguous ones
- If completely unparseable, return {"error": true, "message": "...", "suggestions": [...]}
"""


def rule_based_fallback(request: str) -> dict:
    """
    Simple keyword-based intent detection when LLM is unavailable.
    """
    req = request.lower()

    intent_map = {
        "summarize": (
            "summarize_text",
            "summarization",
            "summarization,text_processing",
        ),
        "summary": ("summarize_text", "summarization", "summarization,text_processing"),
        "tl;dr": ("summarize_text", "summarization", "summarization,text_processing"),
        "research": ("research_topic", "research", "research,information_retrieval"),
        "find": ("research_topic", "research", "research,information_retrieval"),
        "search": ("research_topic", "research", "research,information_retrieval"),
        "calculate": ("calculate_math", "calculation", "mathematics,calculation"),
        "math": ("calculate_math", "calculation", "mathematics,calculation"),
        "translate": (
            "translate_text",
            "translation",
            "translation,language_detection",
        ),
        "sentiment": (
            "analyze_sentiment",
            "sentiment_analysis",
            "sentiment_analysis,text_classification",
        ),
        "mood": (
            "analyze_sentiment",
            "sentiment_analysis",
            "sentiment_analysis,text_classification",
        ),
    }

    # Default fallback
    detected = ("general_task", "other", "text_processing")

    for kw, (intent_name, task_type, caps) in intent_map.items():
        if kw in req:
            detected = (intent_name, task_type, caps)
            break

    return {
        "intent": detected[0],
        "task_type": detected[1],
        "required_capability": detected[2],
        "parameters": {"query": request},
        "original_request": request,
        "confidence": 0.4,  # Lower confidence for fallback
        "is_multi_agent": False,
        "sub_tasks": [],
        "warning": "Gemini API unavailable. Using rule-based fallback parser.",
    }


def parse_intent(request: str) -> dict:
    """
    Parse a natural language request into a structured intent dict.
    Returns either an Intent-compatible dict or an error dict.
    """
    try:
        genai = _get_genai()
        model = genai.GenerativeModel(
            model_name=os.getenv("LLM_MODEL", "gemini-2.0-flash"),
            system_instruction=_SYSTEM_PROMPT,
        )

        prompt = f"Parse this user request: {request}"
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

        if data.get("error"):
            return {
                "error": True,
                "message": data.get("message", "Could not parse request."),
                "suggestions": data.get("suggestions", []),
                "original_request": request,
            }

        # Build sub_tasks
        sub_tasks = []
        for st in data.get("sub_tasks", []):
            sub_tasks.append(
                SubTask(
                    step=st.get("step", 1),
                    intent=st.get("intent", ""),
                    required_capability=st.get("required_capability", ""),
                    parameters=st.get("parameters", {}),
                )
            )

        intent = Intent(
            intent=data.get("intent", "unknown"),
            task_type=data.get("task_type", "other"),
            required_capability=data.get("required_capability", ""),
            parameters=data.get("parameters", {}),
            original_request=request,
            confidence=float(data.get("confidence", 0.5)),
            sub_tasks=sub_tasks,
            is_multi_agent=bool(data.get("is_multi_agent", False)),
        )
        return intent.model_dump()

    except Exception as e:
        # Check for quota exceeded or other API errors
        err_str = str(e).lower()
        if "429" in err_str or "quota" in err_str or "limit" in err_str:
            print(f"⚠️ Gemini API Quota Exceeded. Falling back to rule-based parser.")
            return rule_based_fallback(request)

        return {
            "error": True,
            "message": f"Intent parser error: {str(e)}",
            "original_request": request,
            "suggestions": [],
        }
