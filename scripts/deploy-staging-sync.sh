#!/bin/bash
set -euo pipefail

VPS_DIR="/opt/peters-erp"
REPO_DIR="$VPS_DIR/repo"
COMPOSE_FILE="docker-compose.staging.source.yml"

echo "=========================================="
echo "  Peters ERP Staging Sync+Deploy"
echo "  Time: $(date)"
echo "=========================================="

mkdir -p "$VPS_DIR/data/staging"
mkdir -p "$VPS_DIR/static"
chmod 755 "$VPS_DIR/data/staging"
chmod 755 "$VPS_DIR/static"

cd "$REPO_DIR"
git fetch origin main
git checkout main
git pull --ff-only origin main

echo "Building and starting containers..."
docker compose -f "$COMPOSE_FILE" -p peters-erp-staging down --remove-orphans || true
docker compose -f "$COMPOSE_FILE" -p peters-erp-staging build --pull
docker compose -f "$COMPOSE_FILE" -p peters-erp-staging up -d

echo "Waiting for backend health..."
for i in {1..45}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "Backend healthy"
        break
    fi
    if [ "$i" -eq 45 ]; then
        echo "ERROR: Backend health check failed"
        docker logs --tail 120 peters-erp-staging-backend || true
        exit 1
    fi
    sleep 2
done

echo "Waiting for frontend..."
for i in {1..30}; do
    if curl -sf http://localhost:5175/ > /dev/null 2>&1; then
        echo "Frontend healthy"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: Frontend health check failed"
        docker logs --tail 120 peters-erp-staging-frontend || true
        exit 1
    fi
    sleep 2
done

echo ""
echo "=========================================="
echo "  Staging deploy complete"
echo "  URL: https://peters-erp.com"
echo "=========================================="
