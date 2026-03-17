#!/bin/bash
# Run the backend server
# Usage: ./run.sh [port]

PORT=${1:-8000}

cd "$(dirname "$0")"

export PYTHONPATH="$(pwd):$PYTHONPATH"

.venv/Scripts/python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port $PORT
