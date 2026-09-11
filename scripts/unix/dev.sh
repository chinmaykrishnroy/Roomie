#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_ROOT}"

echo "==> Starting Roomie local development stack..."

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "==> No .env file found. Initializing from .env.example..."
    cp .env.example .env
fi

DETACHED="${1:-}"
if [ "${DETACHED}" = "-d" ] || [ "${DETACHED}" = "--detached" ]; then
    docker compose up -d --build
    docker compose ps
else
    docker compose up --build
fi
