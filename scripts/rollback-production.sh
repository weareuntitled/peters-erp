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
echo "  Rolling Back Production - Peters ERP"
echo "  Target Tag: $TAG"
echo "  Time: $(date)"
echo "=========================================="

# Change to production directory
cd "$VPS_DIR/production"

# Update docker-compose to use rollback tag
sed -i "s|image: ghcr.io/weareuntitled/peters-fin/backend:.*|image: ghcr.io/weareuntitled/peters-fin/backend:$TAG|g" docker-compose.yml || true
sed -i "s|image: ghcr.io/weareuntitled/peters-fin/frontend:.*|image: ghcr.io/weareuntitled/peters-fin/frontend:$TAG|g" docker-compose.yml || true

# Pull rollback image (in case it was cleaned up)
echo "Pulling rollback images..."
docker pull "ghcr.io/weareuntitled/peters-fin/backend:$TAG" || {
    echo "ERROR: Cannot pull rollback image $TAG"
    echo "Available production images:"
    docker images "ghcr.io/weareuntitled/peters-fin/*" --format "{{.Repository}}:{{.Tag}}" | grep "production-"
    exit 1
}
docker pull "ghcr.io/weareuntitled/peters-fin/frontend:$TAG" || {
    echo "ERROR: Cannot pull rollback image $TAG"
    exit 1
}

# Stop current containers
echo "Stopping current containers..."
docker compose down

# Start rollback containers
echo "Starting rollback containers..."
docker compose up -d

# Health check
echo "Checking backend health..."
sleep 10
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is healthy after rollback!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "WARNING: Backend health check failed after rollback"
        docker compose logs --tail 50 backend
    fi
    sleep 2
done

# Update current tag
echo "$TAG" > "$VPS_DIR/.current_tag"

echo ""
echo "=========================================="
echo "  Rollback Complete!"
echo "  Current Version: $TAG"
echo "  URL: https://gswin-erp.com"
echo "  Time: $(date)"
echo "=========================================="
