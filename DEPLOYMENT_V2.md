# Peters ERP - Production Deployment Guide

## Overview

This guide sets up automatic deployment via GitHub Actions to your Hostinger VPS. Two environments run on the same VPS:

| Environment | Domain | Backend Port | Frontend Port | Git Branch |
|------------|---------|-------------|--------------|------------|
| **Staging** | staging.peters-erp.com | 8001 | 5175 | `main` (auto-deploy) |
| **Production** | peters-erp.com | 8000 | 5173 | Manual deploy via GitHub Actions |

## Prerequisites

- VPS with Ubuntu 24.04 LTS
- Domain names configured (staging and production)
- GitHub repository: `weareuntitled/peters-erp`
- VPS IP: `2.57.91.91`

---

## Phase 1: VPS Server Setup

### 1.1 Connect & Update
```bash
ssh root@2.57.91.91
```

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl git wget ufw fail2ban nginx certbot python3-certbot-nginx
```

### 1.2 Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check status
ufw status
```

### 1.3 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add root to docker group
usermod -aG docker root

# Install docker-compose plugin
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 1.4 Create Directory Structure
```bash
mkdir -p /opt/peters-erp/{staging,production,data/staging,data/production,static,scripts,repo}
chmod 755 /opt/peters-erp
```

### 1.5 Clone Repository
```bash
cd /opt/peters-erp
git clone weareuntitled/peters-erp.git repo
cd repo
```

### 1.6 Setup Environment Files
```bash
# Staging
cat > /opt/peters-erp/.env.staging << 'EOF'
SECRET_KEY=change-me-to-random-string-for-staging
DATABASE_URL=sqlite:///app/data/gswin_modern.db
API_URL=https://{STAGING_DOMAIN}/api
CORS_ORIGINS=https://{STAGING_DOMAIN},http://localhost:5173
EOF

# Production
cat > /opt/peters-erp/.env.production << 'EOF'
SECRET_KEY=CHANGE-ME-TO-STRONG-RANDOM-STRING
DATABASE_URL=sqlite:///app/data/gswin_modern.db
API_URL=https://{PROD_DOMAIN}/api
CORS_ORIGINS=https://{PROD_DOMAIN},https://www.{PROD_DOMAIN}
EOF
```

---

## Phase 2: Database Setup

### 2.1 Initial Database Upload
If migrating from local development:
```bash
# On your local machine, upload the database
scp C:\Users\hi\gswin-erp\data\gswin_modern.db root@2.57.91.91:/opt/peters-erp/data/production/
scp C:\Users\hi\gswin-erp\data\gswin_modern.db root@2.57.91.91:/opt/peters-erp/data/staging/
```

### 2.2 Set Permissions
```bash
chmod 644 /opt/peters-erp/data/production/gswin_modern.db
chmod 644 /opt/peters-erp/data/staging/gswin_modern.db
```

---

## Phase 3: Nginx Configuration

### 3.1 Copy nginx configs
```bash
cp /opt/peters-erp/repo/deploy/nginx/staging.peters-erp.com.conf /etc/nginx/sites-available/
cp /opt/peters-erp/repo/deploy/nginx/peters-erp.com.conf /etc/nginx/sites-available/
```

### 3.2 Enable sites
```bash
ln -sf /etc/nginx/sites-available/staging.peters-erp.com.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/peters-erp.com.conf /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t
systemctl restart nginx
```

### 3.3 Obtain SSL Certificates
```bash
# Staging
certbot --nginx -d staging.peters-erp.com --non-interactive --agree-tos --email djdanep@gmail.com

# Production
certbot --nginx -d peters-erp.com -d www.peters-erp.com --non-interactive --agree-tos --email djdanep@gmail.com

# Auto-renewal is configured automatically
certbot renew --dry-run
```

---

## Phase 4: GitHub Setup

### 4.1 Add GitHub Secrets
Go to: `https://github.com/weareuntitled/peters-erp/settings/secrets/actions`

| Secret Name | Value |
|-------------|-------|
| `SSH_HOST` | `2.57.91.91` |
| `SSH_USER` | `root` |
| `SSH_KEY` | *(SSH private key content)* |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | *(Your email)* |
| `SMTP_PASSWORD` | *(Email password/app password)* |
| `EMAIL_TO` | `djdanep@gmail.com` |

### 4.2 Generate SSH Key for GitHub Actions
On your local machine:
```bash
# Windows PowerShell
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\peters-erp-deploy"

# Copy public key to VPS
Get-Content "$env:USERPROFILE\.ssh\peters-erp-deploy.pub" | ssh root@2.57.91.91 "cat >> ~/.ssh/authorized_keys"

# Copy private key to GitHub
Get-Content "$env:USERPROFILE\.ssh\peters-erp-deploy" | Set-Clipboard
# Paste into SSH_KEY secret
```

### 4.3 Enable GitHub Container Registry
No action needed - GHCR is enabled automatically for public repos. For private repos, ensure "Packages" feature is enabled.

---

## Phase 5: Initial Deployment

### 5.1 Setup Scripts
```bash
cd /opt/peters-erp/repo
chmod +x scripts/*.sh
```

### 5.2 Deploy Staging
```bash
cd /opt/peters-erp
./scripts/deploy-staging.sh latest
```

### 5.3 Setup GitHub Actions Runner (if using self-hosted)
Not needed - we use GitHub-hosted runners with SSH deployment.

### 5.4 Trigger First Staging Deploy
```bash
# Push any change to main branch
git checkout main
git push origin main
```

GitHub Actions will automatically:
1. Build Docker images
2. Push to GitHub Container Registry
3. Deploy to staging
4. Send email notification

---

## Phase 6: Production Deployment

### 6.1 Manual Deploy
1. Go to GitHub Actions tab
2. Click "Deploy to Production"
3. Select the `main` branch or a specific tag
4. Type confirmation string
5. Click "Run workflow"

### 6.2 Monitor Deploy
- Check GitHub Actions logs
- Check email notification
- Visit `https://peters-erp.com` to verify

---

## Phase 7: Database Sync (Staging)

To sync production database to staging:
1. Go to GitHub Actions tab
2. Click "Sync DB to Staging"
3. Type confirmation string
4. Click "Run workflow"

Or manually on VPS:
```bash
cd /opt/peters-erp/repo
./scripts/sync-db-to-staging.sh
```

---

## Troubleshooting

### Check Deployment Status
```bash
cd /opt/peters-erp/repo
./scripts/status.sh
```

### View Logs
```bash
# Staging
docker logs -f peters-erp-staging-backend
docker logs -f peters-erp-staging-frontend

# Production
docker logs -f peters-erp-prod-backend
docker logs -f peters-erp-prod-frontend
```

### Restart Services
```bash
# Staging
cd /opt/peters-erp/repo
docker compose -f docker-compose.staging.yml restart

# Production
cd /opt/peters-erp/repo
docker compose -f docker-compose.production.yml restart
```

### Rollback Production
1. Go to GitHub Actions tab
2. Click "Rollback Production"
3. Enter the previous tag
4. Type confirmation string
5. Click "Run workflow"

### SSL Certificate Issues
```bash
# Renew certificates
certbot renew

# Force renewal
certbot renew --force-renewal
```

---

## Maintenance

### Update Ubuntu
```bash
apt update && apt upgrade -y
```

### Update Docker Images
Done automatically via GitHub Actions on each deploy.

### Clean Old Docker Images
```bash
docker image prune -f --filter "until=168h"
```

### Backup Database
```bash
# Production backup
cp /opt/peters-erp/data/production/gswin_modern.db \
   /opt/peters-erp/data/production/gswin_modern.db.backup-$(date +%Y%m%d)
```

---

## Workflow Summary

```
Developer Push to main
       │
       ▼
GitHub Actions Build
       │
       ├── Build backend image
       ├── Build frontend image
       └── Push to GHCR
       │
       ▼
GitHub Actions Deploy Staging
       │
       ├── SSH to VPS
       ├── Pull new images
       ├── Restart staging containers
       └── Health check
       │
       ▼
   Email to djdanep@gmail.com
       │
       ▼
   Test on staging.peters-erp.com
       │
       ▼
Manual Deploy to Production
       │
       ├── GitHub Actions: Deploy to Production
       ├── Backup database
       ├── Deploy to production
       └── Health check
       │
       ▼
   Email confirmation
```

---

## Support

For issues, check:
1. GitHub Actions logs
2. VPS logs: `docker logs -f <container>`
3. Nginx logs: `/var/log/nginx/error.log`
4. System logs: `journalctl -u nginx`, `journalctl -u docker`
