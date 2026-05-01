#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
    echo "Usage: $0 <tag>"
    echo "Example: $0 staging-abc123"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VPS_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Deploying Staging - Peters ERP"
echo "  Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

# Change to staging directory
cd "$VPS_DIR/staging"

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
for i in {1..30}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "WARNING: Backend health check failed after 30 attempts"
        docker compose logs --tail 50 backend
    fi
    sleep 2
done

# Cleanup old images (keep last 10)
echo "Cleaning up old images..."
docker images "ghcr.io/weareuntitled/peters-fin/*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    grep -v "latest" | \
    sort -k2 -r | \
    tail -n +11 | \
    awk '{print $1}' | \
    xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Staging Deploy Complete!"
echo "  URL: https://staging.gswin-erp.com"
echo "  Backend: http://localhost:8001"
echo "  Time: $(date)"
echo "=========================================="
