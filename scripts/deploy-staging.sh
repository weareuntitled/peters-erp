#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
    echo "Usage: $0 <tag>"
    echo "Example: $0 staging-abc123"
    exit 1
fi

# Base directory on VPS
VPS_DIR="/opt/peters-erp"
REPO_DIR="$VPS_DIR/repo"

echo "=========================================="
echo "  Deploying Staging - Peters ERP"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

# Pull latest repo changes
cd "$REPO_DIR"
git pull origin main

# Export tag for docker compose (it reads from env)
export BACKEND_IMAGE="ghcr.io/weareuntitled/peters-erp/backend:$TAG"
export FRONTEND_IMAGE="ghcr.io/weareuntitled/peters-erp/frontend:$TAG"

# Pull new images (docker login is done by caller)
echo "Pulling images..."
docker pull "$BACKEND_IMAGE" || { echo "ERROR: Could not pull backend image"; exit 1; }
docker pull "$FRONTEND_IMAGE" || { echo "ERROR: Could not pull frontend image"; exit 1; }

# Stop old containers (if running)
echo "Stopping old containers..."
docker compose -f "$REPO_DIR/docker-compose.staging.yml" -p peters-erp-staging down 2>/dev/null || true

# Write a tagged docker-compose override for staging
cat > "$REPO_DIR/docker-compose.staging.override.yml" << EOF
services:
  backend:
    image: $BACKEND_IMAGE
  frontend:
    image: $FRONTEND_IMAGE
EOF

# Start new containers
echo "Starting new containers..."
cd "$REPO_DIR"
docker compose -f docker-compose.staging.yml -f docker-compose.staging.override.yml -p peters-erp-staging up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Health check
echo "Checking backend health..."
for i in {1..30}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "WARNING: Backend health check failed after 30 attempts"
        docker compose -p peters-erp-staging logs --tail 50 backend
    fi
    sleep 2
done

# Cleanup old images (keep last 10)
echo "Cleaning up old images..."
docker images "ghcr.io/weareuntitled/peters-erp/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep -v "latest" | \
    sort -k2 -r | \
    tail -n +11 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Staging Deploy Complete!"
echo "  URL: https://staging.peters-erp.com"
echo "  Backend: http://localhost:8001"
echo "  Time: $(date)"
echo "=========================================="
