#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_ROOT}"

echo "==> Stopping Roomie containers..."

if [ "${1:-}" = "-v" ] || [ "${1:-}" = "--volumes" ]; then
    docker compose down -v --remove-orphans
else
    docker compose down --remove-orphans
fi

echo "==> Cleaning local temporary files..."
find "${PROJECT_ROOT}" -name "*.log" -type f -delete 2>/dev/null || true

echo "==> Clean complete!"
