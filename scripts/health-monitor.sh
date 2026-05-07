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
LOG_FILE="${LOG_FILE:-/var/log/peters-erp/health-monitor.log}"

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
        sleep 10

        if check_service "$name" "$url" "$container"; then
            log "$name is UP after restart"
            send_telegram "✅ *Peters ERP Recovered*\n\n$name is back online after restart."
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
    log "=========================================="

    local consecutive_failures=0

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
            consecutive_failures=0
        fi

        sleep "$CHECK_INTERVAL"
    done
}

main "$@"