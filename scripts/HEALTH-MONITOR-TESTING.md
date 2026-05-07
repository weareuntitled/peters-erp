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
| Email Configuration | ✅ PASS | msmtp installed & configured |
| Email Sending (Simple) | ✅ PASS | Received at djdanep@gmail.com (18:40) |
| Email with Server Logs | ✅ PASS | Formatted email with live data received |

### Live Test Log Excerpt
```
[2026-05-07 16:01:23] Frontend is DOWN (HTTP 000000)
[2026-05-07 16:01:23] Attempting restart for Frontend
[2026-05-07 16:01:23] Restart attempt 1 of 3
[2026-05-07 16:01:34] Frontend is UP after restart
```

### Email Test Results
```
Simple Test: djdanep@gmail.com - Received 18:40
Content: "This is a simple test email..."
Server: 187.77.68.83
```

### Verified On Server
- SSH: root@187.77.68.83
- Service: peters-erp-health-monitor.service (active)
- Log: /var/log/peters-erp/health-monitor.log
- msmtp config: /opt/peters-erp/scripts/msmtprc
- Both services: http://187.77.68.83:5175/ (frontend), http://187.77.68.83:8001/api/health (backend)

---

## Email Testing

### Prerequisites
```bash
# On staging server
ssh root@187.77.68.83

# Verify msmtp is installed
which msmtp

# Check config exists
cat /opt/peters-erp/scripts/msmtprc

# Verify Gmail app password is set
grep "password" /opt/peters-erp/scripts/msmtprc
```

### Test 1: Simple Email Send
```bash
# Create test email
cat > /tmp/email-test.txt << 'EOF'
To: djdanep@gmail.com
Subject: Test Email - Simple

This is a simple test email from the server.
Time: $(date)
Server: 187.77.68.83
EOF

# Send using msmtp
msmtp --file=/opt/peters-erp/scripts/msmtprc -t djdanep@gmail.com < /tmp/email-test.txt

# Check inbox - should arrive within 1-2 minutes
```

**Expected:** Email arrives at djdanep@gmail.com with subject "Test Email - Simple"

### Test 2: Formatted Email with Server Status
```bash
# Run the formatted email script
/opt/peters-erp/scripts/send-live-report-v2.sh

# Check inbox - should have formatted email with:
# - Server IP (187.77.68.83)
# - Timestamp
# - Service status (HTTP codes)
# - Container status
# - Recent logs (last 15 lines)
```

**Expected:** Formatted email with live server data received

### Test 3: Auto-Recovery Email Alert
```bash
# Start monitoring if not running
systemctl start peters-erp-health-monitor.service

# Kill frontend container to trigger auto-restart
docker kill peters-erp-staging-frontend

# Wait 40-60 seconds for:
# 1. Monitor to detect failure
# 2. Container to restart
# 3. Recovery email to be sent

# Check inbox for:
# Subject: "Peters ERP - Peters ERP Auto-Recovery"
# or: "Peters ERP - Peters ERP Recovered"
```

**Expected:** Recovery email sent to djdanep@gmail.com

### Test 4: Daily Status Report
```bash
# Check current email report interval
grep EMAIL_REPORT_INTERVAL /opt/peters-erp/scripts/health-monitor.conf
# Default: 86400 (24 hours)

# To test immediately, change to 60 (1 minute)
sed -i 's/EMAIL_REPORT_INTERVAL=.*/EMAIL_REPORT_INTERVAL=60/' /opt/peters-erp/scripts/health-monitor.conf

# Restart service to pick up new interval
systemctl restart peters-erp-health-monitor.service

# Wait 2 minutes, then check inbox for daily report
# Subject: "Peters ERP - Server Status Report & Logs"

# Restore to daily (optional)
sed -i 's/EMAIL_REPORT_INTERVAL=.*/EMAIL_REPORT_INTERVAL=86400/' /opt/peters-erp/scripts/health-monitor.conf
systemctl restart peters-erp-health-monitor.service
```

### Troubleshooting Email Issues

#### Email not arriving
```bash
# Check msmtp configuration
msmtp --file=/opt/peters-erp/scripts/msmtprc -v djdanep@gmail.com < /dev/null

# Check for errors in output:
# - "password: *" should show your app password
# - "host = smtp.gmail.com" should be set
# - "tls = on" should be enabled

# Test SMTP connection manually
timeout 10 telnet smtp.gmail.com 587
# Expected: "Connected to smtp.gmail.com"
```

#### Gmail App Password Issues
1. Verify 2-Factor Authentication is enabled
2. Generate new App Password: https://myaccount.google.com/apppasswords
3. Name: "Peters ERP Health Monitor"
4. Update `/opt/peters-erp/scripts/msmtprc` with new password
5. Restart service: `systemctl restart peters-erp-health-monitor.service`

#### Check Health Monitor Logs for Email Errors
```bash
# View recent logs
tail -50 /var/log/peters-erp/health-monitor.log | grep -i "email\|send\|msmtp"

# If "command not found" errors:
# Verify msmtp is installed: which msmtp
# If not: apt-get install -y msmtp msmtp-mta mailutils
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