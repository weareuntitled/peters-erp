# Peters ERP Health Monitor - Testing Guide

## Overview

This document describes how to test the health monitoring system for the Peters ERP staging server. The health monitor:
- Checks both frontend (port 5175) and backend (port 8001) services every 30 seconds
- Automatically restarts containers on failure
- Sends Telegram notifications on status changes
- Prevents restart loops with a 5-minute cooldown

## Test Results (Live Test - May 7, 2026)

| Test | Result | Notes |
|------|--------|-------|
| Health Monitor Start | ✅ PASS | Started via systemd |
| Backend Detection | ✅ PASS | HTTP 200 detected |
| Frontend Detection | ✅ PASS | HTTP 200 detected |
| Container Crash Simulation | ✅ PASS | docker kill tested |
| Auto-Restart | ✅ PASS | Recovered in ~10s |
| Systemd Service | ✅ PASS | Enabled, running |

### Live Test Log Excerpt
```
[2026-05-07 16:01:23] Frontend is DOWN (HTTP 000000)
[2026-05-07 16:01:23] Attempting restart for Frontend
[2026-05-07 16:01:23] Restart attempt 1 of 3
[2026-05-07 16:01:34] Frontend is UP after restart
```

### Verified On Server
- SSH: root@187.77.68.83
- Service: peters-erp-health-monitor.service (active)
- Log: /var/log/peters-erp/health-monitor.log
- Both services: http://187.77.68.83:5175/ (frontend), http://187.77.68.83:8001/api/health (backend)

---

## Test Environment Setup

### Prerequisites
```bash
# SSH into staging server
ssh root@187.77.68.83

# Navigate to scripts directory
cd /opt/peters-erp/scripts

# Make health monitor executable
chmod +x health-monitor.sh
```

### Create test config
```bash
# Copy example config
cp health-monitor.conf.example health-monitor.conf

# Edit with your Telegram credentials (optional for testing)
nano health-monitor.conf
```

---

## Test Suite

### 🟢 Test 1: Basic Service Connectivity

**Purpose:** Verify all services are reachable before testing the monitor.

**Steps:**
```bash
# Test backend health
curl -s http://localhost:8001/api/health
# Expected: {"status":"healthy","service":"peters-erp-backend","version":"1.0.0"}

# Test frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/
# Expected: 200 or 301

# Test from external IP
curl -s http://187.77.68.83:8001/api/health
curl -s -o /dev/null -w "%{http_code}" http://187.77.68:83:5175/
```

**Success Criteria:** Both services return HTTP 2xx

---

### 🟢 Test 2: Health Monitor Script Syntax

**Purpose:** Verify the script has no syntax errors.

**Steps:**
```bash
# Run shellcheck (if installed)
bash -n health-monitor.sh
# Expected: No output = success

# Check for common issues
grep -n 'set -e' health-monitor.sh
grep -n 'set -u' health-monitor.sh
```

**Success Criteria:** No syntax errors, all safety flags present

---

### 🟢 Test 3: Manual Service Check Function

**Purpose:** Test the check_service function directly.

**Steps:**
```bash
# Test with working service
export BACKEND_URL="http://localhost:8001/api/health"
bash -c '
source health-monitor.sh
check_service "Backend" "$BACKEND_URL" "peters-erp-staging-backend"
echo "Exit code: $?"
'
# Expected: Exit code 0 (success)

# Test with non-existent service (mock)
bash -c '
check_service "Fake" "http://localhost:9999/nothing" "fake-container"
echo "Exit code: $?"
'
# Expected: Exit code 1 (failure)
```

**Success Criteria:** Function returns 0 for UP, 1 for DOWN

---

### 🟢 Test 4: Container Restart Function

**Purpose:** Test the restart_container function.

**Steps:**
```bash
# Check current container status
docker ps --filter "name=peters-erp-staging" --format "table {{.Names}}\t{{.Status}}"

# Test restart (safe - just restarts, does not remove)
docker restart peters-erp-staging-backend

# Wait and check health
sleep 5
curl -s http://localhost:8001/api/health
```

**Success Criteria:** Container restarts successfully, health returns

---

### 🟢 Test 5: Simulate Frontend Failure & Auto-Recovery

**Purpose:** Test the full detection + restart cycle.

**Steps:**
```bash
# Start health monitor in background
cd /opt/peters-erp/scripts
./health-monitor.sh &
MONITOR_PID=$!
echo "Monitor PID: $MONITOR_PID"

# Kill the frontend container (simulate crash)
docker kill peters-erp-staging-frontend
echo "Frontend killed - waiting for monitor to detect..."

# Wait for detection + restart (max 60 seconds)
sleep 60

# Check if frontend is back
curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/
# Expected: 200

# Check logs
tail -20 /var/log/peters-erp/health-monitor.log

# Stop monitor
kill $MONITOR_PID
```

**Success Criteria:**
- Monitor detects failure within 30 seconds
- Container restarts automatically
- Frontend returns to healthy state
- Log shows detection and recovery

---

### 🟢 Test 6: Restart Cooldown Prevention

**Purpose:** Verify the monitor doesn't restart too frequently.

**Steps:**
```bash
# Set short cooldown for testing (modify in script temporarily)
# Or check the cooldown logic:

# Create cooldown file manually
echo $(date +%s) > /tmp/health-monitor-last-restart-Frontend

# Check monitor behavior - should skip restart due to cooldown
# (Check logs for "cooldown active" message)
```

**Success Criteria:** Monitor respects cooldown and logs appropriately

---

### 🟢 Test 7: Telegram Notification (Mock Test)

**Purpose:** Verify notification function works.

**Steps:**
```bash
# Without valid credentials - should silently fail
source health-monitor.sh
send_telegram "Test message - should silently fail"

# With valid credentials (set in config):
# TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy bash -c '
# source health-monitor.sh
# send_telegram "🧪 Test from health monitor"
# '

# Check /var/log/peters-erp/health-monitor.log for errors
```

**Success Criteria:** No errors in logs (silent failure without credentials is OK)

---

### 🟢 Test 8: Multiple Consecutive Failures Alert

**Purpose:** Verify critical alert triggers after MAX_RETRIES.

**Steps:**
```bash
# This is a destructive test - run on staging only
# Modify MAX_RETRIES to 2 in health-monitor.sh for quick test:
sed -i 's/MAX_RETRIES=3/MAX_RETRIES=2/' health-monitor.sh

# Start monitor
./health-monitor.sh &
MONITOR_PID=$!

# Kill both containers
docker kill peters-erp-staging-frontend peters-erp-staging-backend

# Wait for 2 consecutive failures (about 60-90 seconds)
sleep 90

# Check logs for critical alert
grep -i "critical\|multiple" /var/log/peters-erp/health-monitor.log

# Restore MAX_RETRIES
sed -i 's/MAX_RETRIES=2/MAX_RETRIES=3/' health-monitor.sh

# Restart containers manually
docker restart peters-erp-staging-frontend peters-erp-staging-backend
kill $MONITOR_PID
```

**Success Criteria:** Critical alert logged after max failures

---

### 🟢 Test 9: Systemd Service Installation

**Purpose:** Verify systemd service can be installed and started.

**Steps:**
```bash
# Copy service file
cp /opt/peters-erp/scripts/peters-erp-health-monitor.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable service (so it starts on boot)
systemctl enable peters-erp-health-monitor.service

# Start service
systemctl start peters-erp-health-monitor.service

# Check status
systemctl status peters-erp-health-monitor.service --no-pager

# Check it's running
systemctl is-active peters-erp-health-monitor.service
# Expected: active

# Check logs via journal
journalctl -u peters-erp-health-monitor.service --no-pager -n 20
```

**Success Criteria:** Service runs without errors, status shows "active"

---

### 🟢 Test 10: Log Rotation

**Purpose:** Verify logs don't grow unbounded.

**Steps:**
```bash
# Check log file size
ls -lh /var/log/peters-erp/health-monitor.log

# Generate some log entries (run monitor briefly)
timeout 10 ./health-monitor.sh || true

# Check size after short run
ls -lh /var/log/peters-erp/health-monitor.log

# For production: setup logrotate
cat > /etc/logrotate.d/peters-erp-health-monitor << 'EOF'
/var/log/peters-erp/health-monitor.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

**Success Criteria:** Logrotate config created, logs manageable

---

## Automated Test Script

Run all tests automatically:

```bash
#!/bin/bash
# test-health-monitor.sh

set -e

echo "========================================="
echo "  Peters ERP Health Monitor Test Suite"
echo "========================================="

cd /opt/peters-erp/scripts

# Test 1: Syntax check
echo "Test 1: Syntax check..."
bash -n health-monitor.sh || { echo "FAIL: Syntax error"; exit 1; }
echo "PASS"

# Test 2: Service connectivity
echo "Test 2: Service connectivity..."
curl -sf http://localhost:8001/api/health > /dev/null || { echo "FAIL: Backend down"; exit 1; }
curl -sf http://localhost:5175/ > /dev/null || { echo "FAIL: Frontend down"; exit 1; }
echo "PASS"

# Test 3: Container status
echo "Test 3: Container status..."
docker ps --filter "name=peters-erp-staging" --format "{{.Names}}" | grep -q "peters-erp-staging-backend" || { echo "FAIL: Backend container missing"; exit 1; }
docker ps --filter "name=peters-erp-staging" --format "{{.Names}}" | grep -q "peters-erp-staging-frontend" || { echo "FAIL: Frontend container missing"; exit 1; }
echo "PASS"

# Test 4: Systemd service (if installed)
echo "Test 4: Systemd service..."
if systemctl is-enabled peters-erp-health-monitor.service &>/dev/null; then
    systemctl is-active peters-erp-health-monitor.service || { echo "FAIL: Service not active"; exit 1; }
    echo "PASS (service active)"
else
    echo "SKIP (service not installed)"
fi

# Test 5: Log file exists
echo "Test 5: Log file..."
[ -f /var/log/peters-erp/health-monitor.log ] || { echo "FAIL: Log file missing"; exit 1; }
echo "PASS"

echo "========================================="
echo "  All tests passed!"
echo "========================================="
```

---

## Monitoring Dashboard

### Quick Status Check

```bash
# One-liner status check
echo "=== Peters ERP Status ===" && \
echo "Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/api/health)" && \
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5175/)" && \
echo "Containers: $(docker ps --filter 'name=peters-erp-staging' --format '{{.Names}}' | wc -l)" && \
echo "Monitor: $(systemctl is-active peters-erp-health-monitor.service 2>/dev/null || echo 'not installed')"
```

### Expected Output
```
=== Peters ERP Status ===
Backend: 200
Frontend: 200
Containers: 2
Monitor: active
```

---

## Troubleshooting

### Frontend still not reachable after monitor restart

```bash
# Manual debug
docker logs peters-erp-staging-frontend --tail 50
docker exec peters-erp-staging-frontend nginx -t
docker exec peters-erp-staging-frontend ps aux | grep nginx

# If nginx not running inside container
docker exec peters-erp-staging-frontend nginx
```

### Monitor not detecting failures

```bash
# Check if monitor is running
ps aux | grep health-monitor

# Check logs
tail -f /var/log/peters-erp/health-monitor.log

# Check curl works manually
curl -v http://localhost:5175/
```

### Telegram not sending

```bash
# Test with curl directly
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=Test"
```

---

## Deployment Checklist

After setting up the health monitor:

- [ ] Copy `health-monitor.conf.example` to `health-monitor.conf`
- [ ] Configure Telegram credentials (optional)
- [ ] Make script executable: `chmod +x health-monitor.sh`
- [ ] Test manually: `./health-monitor.sh` (run briefly, Ctrl+C to stop)
- [ ] Install systemd service: `cp ...petrs-erp-health-monitor.service /etc/systemd/system/`
- [ ] Enable on boot: `systemctl enable peters-erp-health-monitor.service`
- [ ] Start service: `systemctl start peters-erp-health-monitor.service`
- [ ] Verify status: `systemctl status peters-erp-health-monitor.service`
- [ ] Setup logrotate (optional)
- [ ] Add to monitoring dashboard

---

## Maintenance

### Updating the Monitor

```bash
# Pull latest from repo
cd /opt/peters-erp/repo && git pull

# Copy new version
cp /opt/peters-erp/repo/scripts/health-monitor.sh /opt/peters-erp/scripts/

# Restart service
systemctl restart peters-erp-health-monitor.service
```

### Adjusting Parameters

Edit `/opt/peters-erp/scripts/health-monitor.conf`:
- `CHECK_INTERVAL`: Seconds between checks (default: 30)
- `RESTART_COOLDOWN`: Seconds to wait before restarting same service (default: 300)
- `MAX_RETRIES`: Consecutive failures before critical alert (default: 3)

Then restart: `systemctl restart peters-erp-health-monitor.service`