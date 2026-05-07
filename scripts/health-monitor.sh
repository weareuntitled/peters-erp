#!/bin/bash
set -euo pipefail

# ============================================
# Peters ERP - Health Monitor
# Monitors frontend and backend services
# Auto-restarts on failure + Telegram alerts
# ============================================

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/health-monitor.conf"

# Default values (can be overridden by config file)
BACKEND_URL="${BACKEND_URL:-http://localhost:8001/api/health}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5175/}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"
MAX_RETRIES="${MAX_RETRIES:-3}"
RESTART_COOLDOWN="${RESTART_COOLDOWN:-300}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
EMAIL_TO="${EMAIL_TO:-djdanep@gmail.com}"
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
LOG_FILE="${LOG_FILE:-/var/log/peters-erp/health-monitor.log}"
EMAIL_REPORT_INTERVAL="${EMAIL_REPORT_INTERVAL:-86400}"

# Container names
BACKEND_CONTAINER="peters-erp-staging-backend"
FRONTEND_CONTAINER="peters-erp-staging-frontend"

# Load config if exists
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Setup
mkdir -p "$(dirname "$LOG_FILE")"
exec >> "$LOG_FILE" 2>&1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_telegram() {
    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        return
    fi

    local message="$1"
    local escaped_message=$(echo "$message" | jq -Rs .)

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${escaped_message}" \
        -d "parse_mode=Markdown" > /dev/null 2>&1 || true
}

send_email() {
    if [ -z "$EMAIL_TO" ]; then
        return
    fi

    local subject="$1"
    local body="$2"

    {
        echo "To: $EMAIL_TO"
        echo "Subject: $subject"
        echo ""
        echo "$body"
    } | msmtp --file=/opt/peters-erp/scripts/msmtprc -t "$EMAIL_TO" > /dev/null 2>&1 || true
}

send_status_report() {
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$BACKEND_URL" 2>/dev/null || echo "000")
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$FRONTEND_URL" 2>/dev/null || echo "000")

    local subject="Peters ERP Status Report - $(date '+%Y-%m-%d %H:%M')"

    local body="Peters ERP Staging Server Status Report
==========================================
Time: $(date '+%Y-%m-%d %H:%M:%S %Z')
Server: 187.77.68.83

Services:
----------
Backend (8001):   HTTP $backend_status $([ "$backend_status" = "200" ] && echo "✅ OK" || echo "❌ DOWN")
Frontend (5175):  HTTP $frontend_status $([ "$frontend_status" = "200" ] && echo "✅ OK" || echo "❌ DOWN")

Containers:
-----------
$(docker ps --filter "name=peters-erp-staging" --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Unable to get container status")

Recent Logs (last 10 lines):
----------------------------
$(tail -10 "$LOG_FILE" 2>/dev/null || echo "  No logs available")

--
Automated Health Monitor"

    send_email "$subject" "$body"
    log "Status report sent to $EMAIL_TO"
}

restart_container() {
    local container_name="$1"
    local max_attempts=3

    log "Attempting to restart container: $container_name"

    for i in $(seq 1 $max_attempts); do
        log "Restart attempt $i of $max_attempts"
        docker restart "$container_name" 2>/dev/null && return 0
        sleep 5
    done

    log "FAILED to restart container: $container_name after $max_attempts attempts"
    send_telegram "🚨 *Peters ERP Alert*\n\nFailed to restart container: $container_name after $max_attempts attempts"
    send_email "🚨 Peters ERP Restart Failed" "Failed to restart container: $container_name after $max_attempts attempts\n\nServer: 187.77.68.83\nTime: $(date)"
    return 1
}

check_service() {
    local name="$1"
    local url="$2"
    local container="$3"

    log "Checking $name at $url"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")

    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        log "$name is UP (HTTP $http_code)"
        return 0
    else
        log "$name is DOWN (HTTP $http_code)"
        return 1
    fi
}

check_and_restart() {
    local name="$1"
    local url="$2"
    local container="$3"

    if check_service "$name" "$url" "$container"; then
        return 0
    fi

    local last_restart_file="/tmp/health-monitor-last-restart-$name"
    local now
    now=$(date +%s)

    if [ -f "$last_restart_file" ]; then
        local last_restart
        last_restart=$(cat "$last_restart_file")
        local time_since_restart=$((now - last_restart))

        if [ "$time_since_restart" -lt "$RESTART_COOLDOWN" ]; then
            log "Skipping restart of $name - cooldown active ($time_since_restart s < $RESTART_COOLDOWN s)"
            return 1
        fi
    fi

    log "Attempting restart for $name"
    if restart_container "$container"; then
        echo "$now" > "$last_restart_file"
        send_telegram "🔄 *Peters ERP Recovery*\n\nContainer $name was down and has been restarted."
        send_email "🔄 Peters ERP Auto-Recovery" "Container $name was down and has been automatically restarted.\n\nServer: 187.77.68.83\nTime: $(date)"
        sleep 10

        if check_service "$name" "$url" "$container"; then
            log "$name is UP after restart"
            send_telegram "✅ *Peters ERP Recovered*\n\n$name is back online after restart."
            send_email "✅ Peters ERP Recovered" "Service $name is back online after automatic restart.\n\nServer: 187.77.68.83\nTime: $(date)"
            return 0
        fi
    fi

    log "Failed to recover $name after restart"
    return 1
}

main() {
    log "=========================================="
    log "Peters ERP Health Monitor Started"
    log "Backend: $BACKEND_URL"
    log "Frontend: $FRONTEND_URL"
    log "Check Interval: ${CHECK_INTERVAL}s"
    log "Email Reports: every ${EMAIL_REPORT_INTERVAL}s to $EMAIL_TO"
    log "=========================================="

    local consecutive_failures=0
    local last_email_time
    last_email_time=$(date +%s)

    while true; do
        local backend_status=0
        local frontend_status=0

        if ! check_and_restart "Backend" "$BACKEND_URL" "$BACKEND_CONTAINER"; then
            consecutive_failures=$((consecutive_failures + 1))
            log "Backend check failed (failure #$consecutive_failures)"
        else
            consecutive_failures=0
        fi

        if ! check_and_restart "Frontend" "$FRONTEND_URL" "$FRONTEND_CONTAINER"; then
            consecutive_failures=$((consecutive_failures + 1))
            log "Frontend check failed (failure #$consecutive_failures)"
        else
            consecutive_failures=0
        fi

        if [ "$consecutive_failures" -ge "$MAX_RETRIES" ]; then
            log "CRITICAL: $MAX_RETRIES consecutive failures detected"
            send_telegram "🚨 *Peters ERP CRITICAL*\n\nMultiple service failures detected. Manual intervention required."
            send_email "🚨 Peters ERP CRITICAL Alert" "Multiple service failures detected on staging server 187.77.68.83\n\nManual intervention required.\n\nRecent logs:\n$(tail -20 "$LOG_FILE")"
            consecutive_failures=0
        fi

        local now
        now=$(date +%s)
        local time_since_email=$((now - last_email_time))
        if [ "$time_since_email" -ge "$EMAIL_REPORT_INTERVAL" ]; then
            send_status_report
            last_email_time=$now
        fi

        sleep "$CHECK_INTERVAL"
    done
}

main "$@"