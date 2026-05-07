#!/bin/bash
set -euo pipefail

source /opt/peters-erp/scripts/health-monitor.sh

# Gather data
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost:8001/api/health 2>/dev/null || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" = "200" ]; then BACKEND_EMOJI="✅ ONLINE"; else BACKEND_EMOJI="❌ OFFLINE"; fi
if [ "$FRONTEND_STATUS" = "200" ]; then FRONTEND_EMOJI="✅ ONLINE"; else FRONTEND_EMOJI="❌ OFFLINE"; fi

CONTAINER_INFO=$(docker ps --filter "name=peters-erp-staging" --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Unable to get container status")

# Build email body
BODY="=========================================
Peters ERP - Server Status Report
=========================================

Server: 187.77.68.83
Time: $TIMESTAMP

SERVICE STATUS
--------------
Backend (8001):   HTTP $BACKEND_STATUS - $BACKEND_EMOJI
Frontend (5175):  HTTP $FRONTEND_STATUS - $FRONTEND_EMOJI

CONTAINER STATUS
-----------------
$CONTAINER_INFO

RECENT LOGS (last 15 lines)
-----------------------------
$(tail -15 /var/log/peters-erp/health-monitor.log 2>/dev/null || echo "  No logs available")

=========================================
Peters ERP Health Monitor
========================================="

send_email "Peters ERP - Server Status Report & Logs" "$BODY"

echo "Formatted email with logs sent to $EMAIL_TO"
