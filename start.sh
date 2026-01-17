#!/bin/bash
set -e

# Use Railway's PORT or default to 8000
PORT=${PORT:-8000}

echo "Starting HVACplus on port $PORT..."

# Add backend directory to Python path so imports work
export PYTHONPATH=/app/backend:$PYTHONPATH

# Start uvicorn
exec uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
