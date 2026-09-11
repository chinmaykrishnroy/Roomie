#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

TAG="latest"
REGISTRY="ghcr.io/chinmaykrishnroy"
PUSH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--tag)
      TAG="$2"
      shift 2
      ;;
    -r|--registry)
      REGISTRY="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -h|--help)
      echo "Usage: ./scripts/unix/build.sh [-t <tag>] [-r <registry>] [-p]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "  Roomie Docker Build & Release (Unix)  "
echo "========================================"
echo "Registry: ${REGISTRY}"
echo "Tag:      ${TAG}"
echo "Push:     ${PUSH}"

cd "${PROJECT_ROOT}"

build_image() {
  local name="$1"
  local context="$2"
  local dockerfile="$3"
  shift 3
  local full_tag="${REGISTRY}/${name}:${TAG}"

  echo -e "\n>>> Building [${name}] -> ${full_tag}"
  docker build -f "${dockerfile}" -t "${full_tag}" "$@" "${context}"

  if [ "$PUSH" = true ]; then
    echo -e ">>> Pushing ${full_tag} ..."
    docker push "${full_tag}"
  fi
}

build_image "roomie-server" "server" "infra/docker/go.Dockerfile" --build-arg TARGET=./cmd/server
build_image "roomie-turn" "turn" "infra/docker/go.Dockerfile" --build-arg TARGET=./cmd/main.go
build_image "roomie-migrate" "server" "infra/docker/go.Dockerfile" --build-arg TARGET=./cmd/migrate
build_image "roomie-web" "web" "infra/docker/web.Dockerfile"
build_image "roomie-embed" "embed" "embed/Dockerfile"

echo -e "\nAll Docker images built successfully!"
if [ "$PUSH" = true ]; then
  echo -e "All Docker images pushed to ${REGISTRY} successfully!"
fi
