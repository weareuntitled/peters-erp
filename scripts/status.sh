#!/bin/bash
set -e

# Get current tag from .current_tag file
CURRENT_TAG=$(cat /opt/peters-erp/.current_tag 2>/dev/null || echo "unknown")
PREVIOUS_TAG=$(cat /opt/peters-erp/.previous_tag 2>/dev/null || echo "none")

echo "=========================================="
echo "  Peters ERP - VPS Deployment Status"
echo "=========================================="
echo ""
echo "📁 Directories:"
echo "  Repo:      /opt/peters-erp/repo"
echo "  Staging:   /opt/peters-erp/staging"
echo "  Production: /opt/peters-erp/production"
echo ""
echo "🐳 Docker Containers:"
echo ""
echo "--- Staging ---"
cd /opt/peters-erp/staging && docker compose ps 2>/dev/null | grep -v "NAME" | grep -v "^-" || echo "  No containers running"
echo ""
echo "--- Production ---"
cd /opt/peters-erp/production && docker compose ps 2>/dev/null | grep -v "NAME" | grep -v "^-" || echo "  No containers running"
echo ""
echo "📦 Latest Images:"
docker images ghcr.io/weareuntitled/peters-erp/* --format "  {{.Repository}}:{{.Tag}} | {{.Size}} | {{.CreatedAt}}" | head -20
echo ""
echo "🏷️ Deployed Tags:"
echo "  Current:  $CURRENT_TAG"
echo "  Previous: $PREVIOUS_TAG"
echo ""
echo "🌐 Access URLs:"
echo "  Staging:    https://staging.peters-erp.com"
echo "  Production: https://peters-erp.com"
echo ""
echo "=========================================="
