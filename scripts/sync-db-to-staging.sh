#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VPS_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Syncing DB: Production → Staging"
echo "  Time: $(date)"
echo "=========================================="

# Verify production database exists
if [ ! -f "$VPS_DIR/production/data/gswin_modern.db" ]; then
    echo "ERROR: Production database not found at $VPS_DIR/production/data/gswin_modern.db"
    exit 1
fi

# Backup staging database
echo "Creating staging backup..."
BACKUP_FILE="gswin_modern.db.backup-$(date +%Y%m%d-%H%M%S).sqlite"
cp "$VPS_DIR/staging/data/gswin_modern.db" "$VPS_DIR/staging/data/$BACKUP_FILE" 2>/dev/null || true

# Keep only last 5 staging backups
ls -t "$VPS_DIR/staging/data"/gswin_modern.db.backup-*.sqlite 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

# Stop staging containers (to avoid DB lock)
echo "Stopping staging containers..."
cd "$VPS_DIR/staging"
docker compose stop backend

# Copy production DB to staging
echo "Copying production database to staging..."
cp "$VPS_DIR/production/data/gswin_modern.db" "$VPS_DIR/staging/data/gswin_modern.db"

# Set permissions
chmod 644 "$VPS_DIR/staging/data/gswin_modern.db"
chown root:root "$VPS_DIR/staging/data/gswin_modern.db" 2>/dev/null || true

# Start staging containers
echo "Restarting staging containers..."
cd "$VPS_DIR/staging"
docker compose start backend
docker compose restart frontend

echo ""
echo "=========================================="
echo "  Database Sync Complete!"
echo "  Staging now has production data."
echo "  URL: https://staging.gswin-erp.com"
echo "  Time: $(date)"
echo "=========================================="
