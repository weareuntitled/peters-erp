# Peters ERP Health Monitor - Quick Reference

## Overview

Health monitor for staging server **187.77.68.83** that:
- Checks backend (8001) and frontend (5175) every 30s
- Auto-restarts containers on failure (5min cooldown)
- Sends daily status reports + alerts to **djdanep@gmail.com** via msmtp
- Runs as systemd service (survives reboots)

---

## Test Results (May 7, 2026)

| Test | Result |
|------|--------|
| Health Monitor Start | ✅ PASS |
| Backend Detection (HTTP 200) | ✅ PASS |
| Frontend Detection (HTTP 200) | ✅ PASS |
| Container Crash + Auto-Recovery | ✅ PASS (~10s) |
| Systemd Service | ✅ PASS (active) |
| Email (msmtp) | ✅ PASS (received at 18:40) |
| Formatted Email with Logs | ✅ PASS |

---

## Quick Commands

### Check Status
```bash
# Service status
systemctl status peters-erp-health-monitor.service

# View live logs
tail -f /var/log/peters-erp/health-monitor.log

# Quick health check
curl -s http://localhost:8001/api/health
curl -s http://localhost:5175/ > /dev/null && echo "Frontend UP"
```

### Manage Service
```bash
# Start/Stop/Restart
systemctl start peters-erp-health-monitor.service
systemctl stop peters-erp-health-monitor.service
systemctl restart peters-erp-health-monitor.service

# Enable/Disable on boot
systemctl enable peters-erp-health-monitor.service
systemctl disable peters-erp-health-monitor.service
```

### Test Email
```bash
# Send formatted email with server logs
/opt/peters-erp/scripts/send-live-report-v2.sh

# Simple email test
echo "Test" | msmtp --file=/opt/peters-erp/scripts/msmtprc -t djdanep@gmail.com
```

---

## Configuration

**File:** `/opt/peters-erp/scripts/health-monitor.conf`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `CHECK_INTERVAL` | 30 | Seconds between health checks |
| `RESTART_COOLDOWN` | 300 | Min seconds between restarts (prevents loops) |
| `MAX_RETRIES` | 3 | Consecutive failures before critical alert |
| `EMAIL_REPORT_INTERVAL` | 86400 | Seconds between daily reports (24h) |
| `EMAIL_TO` | djdanep@gmail.com | Email recipient |

**SMTP Config:** `/opt/peters-erp/scripts/msmtprc`

---

## Troubleshooting

### Services Not Recovering
```bash
# Check if monitor is running
ps aux | grep health-monitor

# Check logs for errors
tail -50 /var/log/peters-erp/health-monitor.log | grep -i "error\|fail"

# Restart monitor
systemctl restart peters-erp-health-monitor.service
```

### Email Not Arriving
```bash
# Verify msmtp works
msmtp --file=/opt/peters-erp/scripts/msmtprc -v djdanep@gmail.com < /dev/null

# Check Gmail app password in msmtprc
grep "password" /opt/peters-erp/scripts/msmtprc

# Re-generate app password: https://myaccount.google.com/apppasswords
```

### Frontend Not Reachable
```bash
# Check container status
docker ps --filter "name=peters-erp-staging"

# View container logs
docker logs peters-erp-staging-frontend --tail 50

# Restart container manually
docker restart peters-erp-staging-frontend
```

---

## Files

| File | Location | Purpose |
|------|----------|---------|
| Monitor Script | `/opt/peters-erp/scripts/health-monitor.sh` | Main monitoring logic |
| Systemd Service | `/etc/systemd/system/peters-erp-health-monitor.service` | Auto-start service |
| Config | `/opt/peters-erp/scripts/health-monitor.conf` | Configuration |
| SMTP Config | `/opt/peters-erp/scripts/msmtprc` | Gmail credentials |
| Log File | `/var/log/peters-erp/health-monitor.log` | Monitor logs |
| Email Script | `/opt/peters-erp/scripts/send-live-report-v2.sh` | Send formatted email |

---

## Server Info

| Service | URL |
|---------|-----|
| Backend API | http://187.77.68.83:8001/api/health |
| Frontend | http://187.77.68.83:5175/ |
| API Docs | http://187.77.68.83:8001/docs |

**SSH:** `ssh root@187.77.68.83`
