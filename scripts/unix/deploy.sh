#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${1:-delta}"
REMOTE_DIR="${2:-/home/roy/roomie}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Project Root: ${PROJECT_ROOT}"
echo "==> Deploying Roomie to ${TARGET_HOST}:${REMOTE_DIR}..."

ssh "${TARGET_HOST}" "mkdir -p ${REMOTE_DIR}"

tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude="*.log" --exclude=".env*" \
    -czf - -C "${PROJECT_ROOT}" . | \
    ssh "${TARGET_HOST}" "tar -xzf - -C ${REMOTE_DIR}"

echo "==> Building and starting containers on ${TARGET_HOST}..."
ssh "${TARGET_HOST}" "cd ${REMOTE_DIR} && sudo -n docker compose up -d --build"

echo "==> Checking container status..."
ssh "${TARGET_HOST}" "cd ${REMOTE_DIR} && sudo -n docker compose ps"

echo "==> Roomie successfully deployed on ${TARGET_HOST}!"
