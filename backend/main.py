"""
AI Agent Marketplace + Intent Router — FastAPI Backend
Main application entry point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .api.intent      import router as intent_router
from .api.agent       import router as agent_router
from .api.marketplace import router as marketplace_router
from .api.company     import router as company_router
from .api.admin       import router as admin_router
from .api.credentials import router as credentials_router

load_dotenv()

app = FastAPI(
    title="AI Agent Marketplace + Intent Router",
    description="Production-ready prototype of an AI Agent Marketplace with intelligent intent routing.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────────
all_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
extra = os.getenv("CORS_ORIGINS", "").split(",")
origins = list(set(all_origins + [o.strip() for o in extra if o.strip()]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(intent_router,      prefix="/api/intent")
app.include_router(agent_router,       prefix="/api/agent")
app.include_router(marketplace_router, prefix="/api/marketplace")
app.include_router(company_router,     prefix="/api/company")
app.include_router(admin_router,       prefix="/api/admin")
app.include_router(credentials_router, prefix="/api/credentials")


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "AI Agent Marketplace + Intent Router",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
