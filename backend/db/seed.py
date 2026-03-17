"""
Seed script: populates agents_marketplace and creates a demo company.
Run once after applying schema.sql.

Usage:
    python -m db.seed
"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from .supabase_client import get_supabase
from ..services.email_service import EmailService

DEMO_COMPANY = {
    "company_name": "Acme Corp",
}

MARKETPLACE_AGENTS = [
    # ── Summarizer family ──────────────────────────────────────────────
    {
        "agent_name": "Meeting Summarizer",
        "version": "1.5.0",
        "capabilities": ["summarization", "text_processing"],
        "description": "Summarizes documents, meeting notes, and emails with high accuracy.",
        "provider": "SummarizeAI",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://summarizer",
        "health_check_endpoint": "internal://summarizer/health",
        "pricing_model": "free",
        "changelog": "## v1.5.0\n- Improved accuracy\n- Better handling of bullet points",
    },
    {
        "agent_name": "Meeting Summarizer",
        "version": "2.0.0",
        "capabilities": ["summarization", "text_processing", "entity_extraction"],
        "description": "Advanced summarizer with entity extraction and sentiment. 30% faster.",
        "provider": "SummarizeAI",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://summarizer_v2",
        "health_check_endpoint": "internal://summarizer_v2/health",
        "pricing_model": "free",
        "changelog": "## v2.0.0\n- 30% faster processing\n- Added entity extraction\n- Improved accuracy for technical documents\n- Added sentiment detection",
    },
    # ── Research Agent ─────────────────────────────────────────────────
    {
        "agent_name": "Research Agent",
        "version": "1.5.0",
        "capabilities": ["research", "information_retrieval", "web_search"],
        "description": "Investigates topics, finds key information, and provides structured research.",
        "provider": "ResearchBot",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://researcher",
        "health_check_endpoint": "internal://researcher/health",
        "pricing_model": "free",
        "changelog": "## v1.5.0\n- Improved search quality",
    },
    {
        "agent_name": "Research Agent",
        "version": "1.6.0",
        "capabilities": ["research", "information_retrieval", "web_search", "fact_checking"],
        "description": "Research with fact-checking and source verification. More reliable outputs.",
        "provider": "ResearchBot",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://researcher_v2",
        "health_check_endpoint": "internal://researcher_v2/health",
        "pricing_model": "free",
        "changelog": "## v1.6.0\n- Added fact checking\n- Source citation\n- 20% more accurate results",
    },
    # ── Calculator ─────────────────────────────────────────────────────
    {
        "agent_name": "Calculator",
        "version": "1.0.0",
        "capabilities": ["mathematics", "calculation", "data_analysis"],
        "description": "Performs mathematical operations, formula evaluation, and data calculations.",
        "provider": "MathWorks",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://calculator",
        "health_check_endpoint": "internal://calculator/health",
        "pricing_model": "free",
        "changelog": "## v1.0.0\n- Initial release",
    },
    # ── Content Writer ─────────────────────────────────────────────────
    {
        "agent_name": "Content Writer Pro",
        "version": "2.0.0",
        "capabilities": ["content_creation", "writing", "blog_generation"],
        "description": "Creates blog posts, articles, and marketing copy with high engagement.",
        "provider": "WriteBotCo",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://content_writer",
        "health_check_endpoint": "internal://content_writer/health",
        "pricing_model": "free",
        "changelog": "## v2.0.0\n- Improved writing quality\n- Support for multiple formats",
    },
    # ── Stock Analysis ─────────────────────────────────────────────────
    {
        "agent_name": "Stock Analysis Agent",
        "version": "1.0.0",
        "capabilities": ["financial_analysis", "stock_analysis", "market_research"],
        "description": "Analyzes stock data, market trends, and provides investment insights.",
        "provider": "FinanceCorp",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://stock_analyzer",
        "health_check_endpoint": "internal://stock_analyzer/health",
        "pricing_model": "free",
        "changelog": "## v1.0.0\n- Initial release with market analysis",
    },
    # ── Translator ─────────────────────────────────────────────────────
    {
        "agent_name": "Language Translator",
        "version": "2.1.0",
        "capabilities": ["translation", "language_detection", "localization"],
        "description": "Translates text across 40+ languages with cultural context awareness.",
        "provider": "LingoCorp",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://translator",
        "health_check_endpoint": "internal://translator/health",
        "pricing_model": "free",
        "changelog": "## v2.1.0\n- 40+ languages\n- Cultural context\n- Improved accuracy",
    },
    # ── Sentiment Analyzer ─────────────────────────────────────────────
    {
        "agent_name": "Sentiment Pulse",
        "version": "1.2.0",
        "capabilities": ["sentiment_analysis", "text_classification", "emotion_detection"],
        "description": "Analyzes sentiment, emotions, and tone in text with high precision.",
        "provider": "PulseAI",
        "input_type": "text",
        "output_type": "text",
        "api_endpoint": "internal://sentiment",
        "health_check_endpoint": "internal://sentiment/health",
        "pricing_model": "free",
        "changelog": "## v1.2.0\n- Added emotion detection\n- Multi-language support",
    },
]

DEMO_USER_ADMIN = {
    "email": "admin@acme.com",
    "full_name": "Alex Admin",
    "role": "admin",
}

DEMO_USER_ENDUSER = {
    "email": "user@acme.com",
    "full_name": "Sam User",
    "role": "end_user",
}

DEMO_USER_DEV = {
    "email": "dev@agentco.com",
    "full_name": "Devon Developer",
    "role": "developer",
}


def seed():
    db = get_supabase()

    print("🌱 Seeding marketplace agents...")
    for agent in MARKETPLACE_AGENTS:
        try:
            db.table("agents_marketplace").upsert(
                agent, on_conflict="agent_name,version"
            ).execute()
            print(f"  ✅ {agent['agent_name']} v{agent['version']}")
        except Exception as e:
            print(f"  ⚠️  {agent['agent_name']} v{agent['version']}: {e}")

    print("\n🏢 Creating demo company...")
    result = db.table("companies").select("*").eq(
        "company_name", DEMO_COMPANY["company_name"]
    ).execute()

    if result.data:
        company_id = result.data[0]["company_id"]
        print(f"  ℹ️  Company already exists: {company_id}")
    else:
        result = db.table("companies").insert(DEMO_COMPANY).execute()
        company_id = result.data[0]["company_id"]
        print(f"  ✅ Created company: {company_id}")

    print("\n👤 Creating demo users...")
    for user in [DEMO_USER_ADMIN, DEMO_USER_ENDUSER, DEMO_USER_DEV]:
        try:
            db.table("users").upsert(
                {**user, "company_id": company_id if user["role"] != "developer" else None},
                on_conflict="email",
            ).execute()
            print(f"  ✅ {user['email']} ({user['role']})")
        except Exception as e:
            print(f"  ⚠️  {user['email']}: {e}")

    print("\n📊 Adding starter agents to Acme Corp portfolio (Summarizer v1.5 + Calculator)...")
    # Find Meeting Summarizer v1.5 and Calculator v1.0
    starter_agents_result = db.table("agents_marketplace").select("agent_id,agent_name,version").in_(
        "agent_name", ["Meeting Summarizer", "Calculator"]
    ).execute()

    for ag in starter_agents_result.data:
        # Only add v1.5 summarizer and v1.0 calculator (not v2)
        if ag["agent_name"] == "Meeting Summarizer" and ag["version"] != "1.5.0":
            continue
        try:
            db.table("company_agents").upsert(
                {
                    "company_id": company_id,
                    "agent_id": ag["agent_id"],
                    "auto_update_enabled": True,
                    "quality_score": 0.72 if ag["agent_name"] == "Meeting Summarizer" else 0.95,
                    "execution_count": 15 if ag["agent_name"] == "Meeting Summarizer" else 8,
                },
                on_conflict="company_id,agent_id",
            ).execute()
            print(f"  ✅ Added {ag['agent_name']} v{ag['version']}")
        except Exception as e:
            print(f"  ⚠️  {ag['agent_name']}: {e}")

    print(f"\n✨ Done! Company ID: {company_id}")
    return company_id


async def seed_all():
    """Run all seeding steps."""
    seed()
    
    # Now seed credentials
    from db.seed_credentials import seed_credentials
    await seed_credentials()


if __name__ == "__main__":
    EmailService.configure()
    asyncio.run(seed_all())
