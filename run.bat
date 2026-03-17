@echo off
REM Run the backend server from project root
REM Usage: run.bat [port]

set PORT=%1
if "%PORT%"=="" set PORT=8000

cd /d "%~dp0"

.venv\Scripts\python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port %PORT%
