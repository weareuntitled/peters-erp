#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
    echo "Usage: $0 <tag>"
    echo "Example: $0 production-main-42"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VPS_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Deploying Production - Peters ERP"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

# Store current tag for rollback
cd "$VPS_DIR"
CURRENT_TAG=$(cat .current_tag 2>/dev/null || echo "unknown")
echo "Previous tag: $CURRENT_TAG"
echo "$TAG" > .current_tag
echo "$CURRENT_TAG" > .previous_tag

# Change to production directory
cd "$VPS_DIR/production"

# Update docker-compose to use specific tag
sed -i "s|image: ghcr.io/weareuntitled/peters-fin/backend:.*|image: ghcr.io/weareuntitled/peters-fin/backend:$TAG|g" docker-compose.yml || true
sed -i "s|image: ghcr.io/weareuntitled/peters-fin/frontend:.*|image: ghcr.io/weareuntitled/peters-fin/frontend:$TAG|g" docker-compose.yml || true

# Pull new images
echo "Pulling images..."
docker pull "ghcr.io/weareuntitled/peters-fin/backend:$TAG"
docker pull "ghcr.io/weareuntitled/peters-fin/frontend:$TAG"

# Stop old containers
echo "Stopping old containers..."
docker compose down

# Start new containers
echo "Starting new containers..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Health check
echo "Checking backend health..."
HEALTHY=false
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        HEALTHY=true
        break
    fi
    sleep 2
done

if [ "$HEALTHY" = false ]; then
    echo "ERROR: Backend health check failed after 30 attempts"
    echo "Rolling back to previous version..."
    
    # Rollback
    PREVIOUS_TAG=$(cat "$VPS_DIR/.previous_tag" 2>/dev/null || echo "")
    if [ -n "$PREVIOUS_TAG" ]; then
        "$SCRIPT_DIR/rollback-production.sh" "$PREVIOUS_TAG"
    else
        echo "No previous tag found for rollback!"
        docker compose logs --tail 100 backend
        exit 1
    fi
fi

# Cleanup old images (keep last 20 including previous)
echo "Cleaning up old images..."
docker images "ghcr.io/weareuntitled/peters-fin/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep "production-" | \
    sort -k2 -r | \
    tail -n +21 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Production Deploy Complete!"
echo "  URL: https://gswin-erp.com"
echo "  Backend: http://localhost:8000"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="
