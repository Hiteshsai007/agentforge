# AI Agent Marketplace & Intelligent Intent Router

A production-ready prototype for an enterprise-grade AI Agent Marketplace. This system features a sophisticated intent routing layer that orchestrates multi-agent workflows using Large Language Models (LLMs).

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI (Python 3.8+), Uvicorn, Pydantic
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **AI Engine**: Google Gemini API (gemini-2.0-flash)
- **Concurrency**: Python `ThreadPoolExecutor` for isolated agent execution

---

## 🛠 Architecture Overview

### Backend: The Intelligent Engine

The backend is structured into three primary layers that handle the lifecycle of a user request:

1.  **Intent Engine (`backend/engine/intent_parser.py`)**: 
    - Translates natural language requests into structured `Intent` objects using Gemini.
    - Supports multi-agent detection, identifying when a complex task requires multiple specialized capabilities.
    - Features a rule-based fallback system to ensure basic functionality during API quota limits.

2.  **Semantic Router (`backend/engine/router.py`)**:
    - Matches structured intents to the most suitable agents within a company's portfolio.
    - Implements a **Version-First logic**: Newer versions of agents are prioritized.
    - Uses **Quality Scores** as a tie-breaker, ensuring high-performing agents handle critical tasks.
    - Automatically suggests marketplace alternatives if no internal agent matches the required capability.

3.  **Execution Layer (`backend/engine/executor.py`)**:
    - Orchestrates the actual execution of agent logic via the Gemini API.
    - Manages **Multi-Agent Workflows**: Executes tasks sequentially, passing context from one agent to the next to maintain cohesive reasoning.
    - Utilizes `ThreadPoolExecutor` for worker isolation and performance.

### Frontend: Multi-Persona Portal

The frontend provides tailored experiences for three distinct user roles:

-   **Admin Portal**: Manage company agents, monitor performance scores, and oversee marketplace integrations.
-   **User Interface**: A streamlined request interface with real-time feedback, intent visualization, and progressive task execution status.
-   **Developer Sandbox**: Tools for testing agent capabilities and reviewing execution logs.

---

