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

## 🛠 Getting Started

### 1. Database Setup (Supabase)
1.  Initialize a new project on [Supabase](https://supabase.com/).
2.  In the **SQL Editor**, execute the contents of `backend/db/schema.sql`. This sets up the relational schema, enums, and default RLS policies.

### 2. Configuration
Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation & Seeding
```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Seed the environment
python db/seed.py
```

### 4. Running the Application

**Start Backend:**
```bash
cd backend
python main.py
```

**Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Credentials
Use the following demo accounts populated during seeding:
- **Admin**: `admin@acme.com`
- **End User**: `user@acme.com`
- **Developer**: `dev@agentco.com`
