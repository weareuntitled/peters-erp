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

# Pull latest repo changes
cd "$REPO_DIR"
git pull origin main

# Store current tag for rollback
CURRENT_TAG=$(cat "$VPS_DIR/.current_tag" 2>/dev/null || echo "unknown")
echo "Previous tag: $CURRENT_TAG"
echo "$TAG" > "$VPS_DIR/.current_tag"
echo "$CURRENT_TAG" > "$VPS_DIR/.previous_tag"

# Export images
export BACKEND_IMAGE="ghcr.io/weareuntitled/peters-erp/backend:$TAG"
export FRONTEND_IMAGE="ghcr.io/weareuntitled/peters-erp/frontend:$TAG"

# Pull new images
echo "Pulling images..."
docker pull "$BACKEND_IMAGE" || { echo "ERROR: Could not pull backend image"; exit 1; }
docker pull "$FRONTEND_IMAGE" || { echo "ERROR: Could not pull frontend image"; exit 1; }

# Stop old containers
echo "Stopping old containers..."
docker compose -f "$REPO_DIR/docker-compose.production.yml" -p peters-erp-production down 2>/dev/null || true

# Write tagged docker-compose override
cat > "$REPO_DIR/docker-compose.production.override.yml" << EOF
services:
  backend:
    image: $BACKEND_IMAGE
  frontend:
    image: $FRONTEND_IMAGE
EOF

# Start new containers
echo "Starting new containers..."
cd "$REPO_DIR"
docker compose -f docker-compose.production.yml -f docker-compose.production.override.yml -p peters-erp-production up -d

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
    docker compose -p peters-erp-production logs --tail 100 backend
    exit 1
fi

# Cleanup old images (keep last 20)
echo "Cleaning up old images..."
docker images "ghcr.io/weareuntitled/peters-erp/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep "production-" | \
    sort -k2 -r | \
    tail -n +21 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Production Deploy Complete!"
echo "  URL: https://peters-erp.com"
echo "  Backend: http://localhost:8000"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="
