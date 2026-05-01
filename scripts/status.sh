#!/bin/bash
set -e

# Get current tag from .current_tag file
CURRENT_TAG=$(cat /opt/gswin-erp/.current_tag 2>/dev/null || echo "unknown")
PREVIOUS_TAG=$(cat /opt/gswin-erp/.previous_tag 2>/dev/null || echo "none")

echo "=========================================="
echo "  Peters ERP - VPS Deployment Status"
echo "=========================================="
echo ""
echo "📁 Directories:"
echo "  Repo:      /opt/gswin-erp/repo"
echo "  Staging:   /opt/gswin-erp/staging"
echo "  Production: /opt/gswin-erp/production"
echo ""
echo "🐳 Docker Containers:"
echo ""
echo "--- Staging ---"
cd /opt/gswin-erp/staging && docker compose ps 2>/dev/null | grep -v "NAME" | grep -v "^-" || echo "  No containers running"
echo ""
echo "--- Production ---"
cd /opt/gswin-erp/production && docker compose ps 2>/dev/null | grep -v "NAME" | grep -v "^-" || echo "  No containers running"
echo ""
echo "📦 Latest Images:"
docker images ghcr.io/weareuntitled/peters-fin/* --format "  {{.Repository}}:{{.Tag}} | {{.Size}} | {{.CreatedAt}}" | head -20
echo ""
echo "🏷️ Deployed Tags:"
echo "  Current:  $CURRENT_TAG"
echo "  Previous: $PREVIOUS_TAG"
echo ""
echo "🌐 Access URLs:"
echo "  Staging:    https://staging.gswin-erp.com"
echo "  Production: https://gswin-erp.com"
echo ""
echo "=========================================="
