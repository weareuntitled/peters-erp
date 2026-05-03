#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
    echo "Usage: $0 <tag>"
    echo "Example: $0 production-main-42"
    exit 1
fi

VPS_DIR="/opt/peters-erp"
REPO_DIR="$VPS_DIR/repo"

echo "=========================================="
echo "  Deploying Production - Peters ERP"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

cd "$REPO_DIR"
git pull origin main

# Store current tag for rollback
CURRENT_TAG=$(cat "$VPS_DIR/.current_tag" 2>/dev/null || echo "unknown")
echo "Previous tag: $CURRENT_TAG"
echo "$TAG" > "$VPS_DIR/.current_tag"
echo "$CURRENT_TAG" > "$VPS_DIR/.previous_tag"

export BACKEND_TAG="$TAG"
export FRONTEND_TAG="$TAG"

echo "Pulling images..."
docker pull "ghcr.io/weareuntitled/peters-erp/backend:$TAG" || { echo "ERROR: Could not pull backend image"; exit 1; }
docker pull "ghcr.io/weareuntitled/peters-erp/frontend:$TAG" || { echo "ERROR: Could not pull frontend image"; exit 1; }

# Safety cleanup
echo "Cleaning up old containers..."
docker rm -f peters-erp-prod-backend 2>/dev/null || true
docker rm -f peters-erp-prod-frontend 2>/dev/null || true

echo "Starting new containers..."
cd "$REPO_DIR"
docker compose -f docker-compose.production.yml -p peters-erp-production up -d

echo "Waiting for backend health..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        HEALTHY=true
        break
    fi
    sleep 2
done

if [ "$HEALTHY" != true ]; then
    echo "ERROR: Backend health check failed"
    docker compose -p peters-erp-production logs --tail 100 backend
    exit 1
fi

# Cleanup old images (keep last 20)
docker images "ghcr.io/weareuntitled/peters-erp/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep "production-" | \
    sort -k2 -r | \
    tail -n +21 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Production Deploy Complete!"
echo "  Frontend: https://peters-erp.com"
echo "  Backend:  http://localhost:8000"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="
