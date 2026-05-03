# Peters ERP — Operations Guide

## Access

| Service | URL | Port |
|---------|-----|------|
| **Staging Frontend** | http://187.77.68.83:5175 | 5175:80 |
| **Staging Backend API** | http://187.77.68.83:8001 | 8001:8000 |
| **Staging API Docs** | http://187.77.68.83:8001/docs | — |
| **SSH** | `root@187.77.68.83` | 22 |

## Login

- **Username:** `norbert`
- **Password:** `Spengler1508`

Secrets are stored on the server at `/opt/peters-erp/.env.staging`. Edit via Hostinger panel or SSH:
```bash
nano /opt/peters-erp/.env.staging
docker restart peters-erp-staging-backend
```

## Push Code to Staging

Push to `main` → GH Actions builds images → deploys automatically.

```bash
git push origin main
```

Then check:
```bash
curl http://187.77.68.83:5175/        # frontend
curl http://187.77.68.83:8001/health  # backend
```

## Sync Local Database to Staging

```bash
cd gswin-erp
bash scripts/sync-db-local-to-staging.sh data/gswin_modern.db
```

This copies your local DB to the server and restarts the backend.

## Check Status (on server)

```bash
# Running containers
docker ps

# Backend logs
docker logs peters-erp-staging-backend --tail 50

# Frontend logs
docker logs peters-erp-staging-frontend --tail 50

# Full restart
docker restart peters-erp-staging-backend
docker restart peters-erp-staging-frontend
```

## Architecture (Staging)

```
Browser → http://187.77.68.83:5175
              ↓ nginx (:80)
         Frontend container (peters-erp-frontend:manual)
              ↓ /api → proxy to backend:8000
         Backend container (peters-erp-backend:staging-xxx)
              ↓
         SQLite: /opt/peters-erp/data/staging/gswin_modern.db
```

- **Both containers** share the `peters-erp-staging` Docker network
- Backend has network alias `backend` so nginx can find it
- Secrets come from `/opt/peters-erp/.env.staging` (not in git)
- Static files (logos) served via `proxy_pass /static → backend:8000`

## SSH Quick Reference

```bash
sshpass -p "c0JAu@DqEXrG4C" ssh root@187.77.68.83
```

## Production Deploy

1. Go to GitHub → Actions → "Deploy to Production"
2. Click "Run workflow" → select branch/tag
3. Type `deploy-to-production` to confirm

Production secrets are at `/opt/peters-erp/.env.production` on the server.
