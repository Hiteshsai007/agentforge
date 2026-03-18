# AI Agent Marketplace & Intelligent Intent Router

[![CI/CD](https://github.com/Hiteshsai007/agentforge/actions/workflows/tests.yml/badge.svg)](https://github.com/Hiteshsai007/agentforge/actions)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

An enterprise-grade AI Agent Marketplace prototype featuring intelligent intent routing that orchestrates multi-agent workflows using Large Language Models.

## Overview

This system solves key problems with AI agents:
- **Agent Drift**: Agents evolve via marketplace integration
- **Outdated Dependencies**: Auto-upgrade to better agents
- **Static Systems**: Dynamic routing to latest/best agents
- **Integration Complexity**: Intent → Agent routing layer

```
Human Request → Intent Parser → Router → Selected Agent → Executed Task
```

## Features

- **Intent Parsing**: Natural language → structured task definitions
- **Agent Marketplace**: Registry of AI agents with capabilities
- **Intelligent Routing**: Routes requests to the best available agent
- **Agent Delegation**: Agents can call other agents for complex tasks
- **Evolution System**: Automatically upgrades to better agents
- **Company API Keys**: Secure per-company authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | FastAPI, Python 3.8+, Uvicorn, Pydantic |
| Database | Supabase (PostgreSQL) with RLS |
| AI Engine | Google Gemini API |
| Email | SendGrid |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │   Admin   │  │   User   │  │  Dev     │                 │
│  │  Portal   │  │Interface  │  │Sandbox   │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
└───────┼──────────────┼──────────────┼───────────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ HTTP/REST
        ┌──────────────┴──────────────┐
        │       API Gateway            │
        └──────────────┬──────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                      Backend                                  │
│  ┌───────────────────┼───────────────────────────────────┐  │
│  │                   │                                    │  │
│  │  ┌────────────────▼─────────────────┐                   │  │
│  │  │       Intent Parser              │                   │  │
│  │  │  NL → Structured Intent         │                   │  │
│  │  └────────────────┬─────────────────┘                   │  │
│  │                   │                                    │  │
│  │  ┌────────────────▼─────────────────┐                   │  │
│  │  │         Semantic Router          │                   │  │
│  │  │  Intent → Best Available Agent   │                   │  │
│  │  └────────────────┬─────────────────┘                   │  │
│  │                   │                                    │  │
│  │  ┌────────────────▼─────────────────┐                   │  │
│  │  │        Execution Engine          │                   │  │
│  │  │  Agent Execution + Delegation    │                   │  │
│  │  └────────────────┬─────────────────┘                   │  │
│  │                   │                                    │  │
│  └───────────────────┼────────────────────────────────────┘  │
│                      │                                        │
│              ┌───────▼───────┐                                │
│              │   Supabase    │                                │
│              │  PostgreSQL   │                                │
│              └───────────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- Supabase account

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Run the server
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
```

### Running Tests

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI/LLM
GEMINI_API_KEY=your-gemini-api-key
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash

# Server
MAX_EXECUTION_TIME=60
MAX_TOKENS=2000
```

## API Endpoints

### Intent Parsing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/intent/parse` | Parse natural language to intent |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/agents` | List all agents |
| GET | `/api/marketplace/capabilities` | List all capabilities |

### Agent Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/execute` | Execute agent task |

### Company Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/{id}/agents` | List company agents |
| POST | `/api/company/{id}/agents` | Add agent to company |
| GET | `/api/company/{id}/available-upgrades` | Check for upgrades |

### API Key Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/company/{id}/generate-api-key` | Generate company API key |
| GET | `/api/company/{id}/api-key-status` | Check API key status |
| POST | `/api/company/{id}/revoke-api-key` | Revoke API key |

Full API documentation available at `/docs` when server is running.

## Available Agents

| Agent | Capability | Description |
|-------|------------|-------------|
| Meeting Summarizer | summarization | Summarizes meeting notes |
| Research Agent | research | Performs web research |
| Calculator | mathematics | Math operations |
| Language Translator | translation | Multi-language translation |
| Sentiment Pulse | sentiment_analysis | Sentiment analysis |

## Development

### Project Structure

```
.
├── backend/
│   ├── api/           # API routes
│   ├── db/            # Database client
│   ├── engine/        # Core logic (intent, router, executor)
│   ├── services/     # Business logic
│   ├── tests/        # Test suite
│   └── main.py        # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/# React components
│   │   └── pages/     # Page components
│   └── package.json
└── README.md
```

### Running in Production

```bash
# Backend
cd backend
pip install -r requirements.txt
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# Frontend
cd frontend
npm run build
npm run preview
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`pytest`)
5. Submit a pull request
