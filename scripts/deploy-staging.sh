#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
    echo "Usage: $0 <tag>"
    echo "Example: $0 staging-abc123"
    exit 1
fi

VPS_DIR="/opt/peters-erp"
REPO_DIR="$VPS_DIR/repo"

echo "=========================================="
echo "  Deploying Staging - Peters ERP"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

mkdir -p "$VPS_DIR/data/staging"
mkdir -p "$VPS_DIR/static"
chmod 755 "$VPS_DIR/data/staging"
chmod 755 "$VPS_DIR/static"

cd "$REPO_DIR"
git pull origin main

export BACKEND_TAG="$TAG"
export FRONTEND_TAG="$TAG"

echo "Pulling images..."
docker pull "ghcr.io/weareuntitled/peters-erp/backend:$TAG" || { echo "ERROR: Could not pull backend image"; exit 1; }
docker pull "ghcr.io/weareuntitled/peters-erp/frontend:$TAG" || { echo "ERROR: Could not pull frontend image"; exit 1; }

# Safety cleanup of any orphan containers with these names
echo "Cleaning up old containers..."
docker rm -f peters-erp-staging-backend 2>/dev/null || true
docker rm -f peters-erp-staging-frontend 2>/dev/null || true

echo "Starting new containers..."
cd "$REPO_DIR"
docker compose -f docker-compose.staging.yml -p peters-erp-staging up -d

echo "Waiting for backend health..."
for i in {1..30}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend health check failed"
        docker logs --tail 100 peters-erp-staging-backend || true
        docker ps -a --filter "name=peters-erp-staging"
        exit 1
    fi
    sleep 2
done

echo "Waiting for frontend..."
for i in {1..15}; do
    if curl -sf http://localhost:5175/ > /dev/null 2>&1; then
        echo "Frontend is serving!"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "WARNING: Frontend not responding, but backend is up"
    fi
    sleep 2
done

# Cleanup old images (keep last 10)
docker images "ghcr.io/weareuntitled/peters-erp/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep -v "latest" | \
    sort -k2 -r | \
    tail -n +11 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Staging Deploy Complete!"
echo "  Frontend: http://187.77.68.83:5175"
echo "  Backend:  http://187.77.68.83:8001"
echo "  Time: $(date)"
echo "=========================================="
