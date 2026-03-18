"""
AI Agent Marketplace + Intent Router — FastAPI Backend
Main application entry point.
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).parent.resolve()
project_root = backend_dir.parent

if backend_dir.name == "backend" and str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import config
from api.intent import router as intent_router
from api.agent import router as agent_router
from api.marketplace import router as marketplace_router
from api.company import router as company_router
from api.admin import router as admin_router
from api.credentials import router as credentials_router
from api.auth import router as auth_router

logger.info("Starting AI Agent Marketplace Backend v%s", config.APP_VERSION)

config_errors = config.validate()
if config_errors:
    logger.warning("Configuration warnings: %s", config_errors)

app = FastAPI(
    title=config.APP_NAME,
    description="Enterprise AI Agent Marketplace with intelligent intent routing.",
    version=config.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cors_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    )
    response.headers["Access-Control-Allow-Headers"] = (
        "Authorization, Content-Type, X-Company-API-Key, X-Agent-ID, X-Enable-Delegation"
    )
    return response


app.include_router(intent_router, prefix="/api/intent")
app.include_router(agent_router, prefix="/api/agent")
app.include_router(marketplace_router, prefix="/api/marketplace")
app.include_router(company_router, prefix="/api/company")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(credentials_router, prefix="/api/credentials")
app.include_router(auth_router, prefix="/api/auth")

logger.info("API routes registered")


@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete")


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8013, reload=False)
