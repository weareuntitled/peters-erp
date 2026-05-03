#!/bin/bash
# Sync local DB to staging server
# Usage: ./sync-db-local-to-staging.sh <path-to-local-db>
# Example: ./sync-db-local-to-staging.sh /mnt/c/Users/hi/gswin-erp/data/gswin_modern.db

set -e

DB_PATH=$1
if [ -z "$DB_PATH" ]; then
    echo "Usage: $0 <path-to-local-db>"
    echo "Example: $0 /mnt/c/Users/hi/gswin-erp/data/gswin_modern.db"
    exit 1
fi

if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

VPS_IP="187.77.68.83"
VPS_PASSWORD="${VPS_PASSWORD:-c0JAu@DqEXrG4C}"

echo "=========================================="
echo "  Syncing Local DB → Staging Server"
echo "  Time: $(date)"
echo "=========================================="

echo "Backing up staging DB..."
sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=15 root@$VPS_IP \
    "cp /opt/peters-erp/data/staging/gswin_modern.db /opt/peters-erp/data/staging/gswin_modern.db.backup-\$(date +%Y%m%d-%H%M%S) && echo backup done"

echo "Copying database..."
sshpass -p "$VPS_PASSWORD" scp -o ConnectTimeout=15 "$DB_PATH" root@$VPS_IP:/opt/peters-erp/data/staging/gswin_modern.db

echo "Restarting backend..."
sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=15 root@$VPS_IP "docker restart peters-erp-staging-backend"

echo "Waiting for backend..."
sleep 3

echo "Testing health..."
HEALTH=$(sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=10 root@$VPS_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/api/health")

if [ "$HEALTH" = "200" ]; then
    echo "Backend is healthy!"
else
    echo "WARNING: Backend health returned $HEALTH"
fi

echo ""
echo "=========================================="
echo "  Sync Complete!"
echo "  Frontend: http://$VPS_IP:5175"
echo "  Backend:  http://$VPS_IP:8001"
echo "=========================================="
