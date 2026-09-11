#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DOCKER_MODE=false
SERVICE="all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker|-d)
      DOCKER_MODE=true
      shift
      ;;
    -s|--service)
      SERVICE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./scripts/unix/test.sh [--docker] [-s <all|server|turn|web|embed>]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "  Roomie Test Pipeline (Unix)           "
echo "========================================"
echo "Project Root: ${PROJECT_ROOT}"

if [ "$DOCKER_MODE" = true ]; then
  echo -e "\n[MODE] Running tests inside isolated Docker containers..."
  
  SERVICES=()
  if [ "$SERVICE" = "all" ]; then
    SERVICES=("test-server" "test-turn" "test-web" "test-embed")
  else
    SERVICES=("test-${SERVICE}")
  fi

  for svc in "${SERVICES[@]}"; do
    echo -e "\n>>> Running Docker test for: ${svc}"
    docker compose -f "${PROJECT_ROOT}/compose.test.yaml" --profile test run --rm "${svc}"
  done

  echo -e "\nAll Docker test suites passed successfully!"
  exit 0
fi

# Native execution
echo -e "\n[MODE] Running tests with local toolchains..."

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "server" ]; then
  echo -e "\n>>> Testing Server (Go)..."
  (cd "${PROJECT_ROOT}/server" && go vet ./... && go test -race -v ./...)
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "turn" ]; then
  echo -e "\n>>> Testing TURN (Go)..."
  (cd "${PROJECT_ROOT}/turn" && go vet ./... && go test -race -v ./...)
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "web" ]; then
  echo -e "\n>>> Testing Web (TypeScript / Next.js)..."
  if [ -d "${PROJECT_ROOT}/web/node_modules" ]; then
    (cd "${PROJECT_ROOT}/web" && npm run typecheck)
  else
    echo "Local web/node_modules not found. Run with --docker to test in container, or install dependencies with npm ci."
  fi
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "embed" ]; then
  echo -e "\n>>> Testing Embed Service (Python)..."
  if command -v python3 &>/dev/null && python3 -c "import numpy, fastapi" 2>/dev/null; then
    (cd "${PROJECT_ROOT}/embed" && python3 -m unittest test_app.py)
  elif command -v python &>/dev/null && python -c "import numpy, fastapi" 2>/dev/null; then
    (cd "${PROJECT_ROOT}/embed" && python -m unittest test_app.py)
  else
    echo "Python test dependencies not found on host. Run with --docker to test in container."
  fi
fi

echo -e "\nAll test suites completed successfully!"
