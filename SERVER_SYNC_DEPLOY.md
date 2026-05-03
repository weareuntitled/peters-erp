# Server Sync + Deploy

Use this workflow to sync server code with GitHub and deploy staging in one command.

## Paths
- Repo checkout on server: `/opt/peters-erp/repo`
- Deploy script in repo: `/opt/peters-erp/repo/scripts/deploy-staging-sync.sh`
- Staging compose file: `/opt/peters-erp/repo/docker-compose.staging.source.yml`

## One-command deploy (on server)
```bash
bash /opt/peters-erp/repo/scripts/deploy-staging-sync.sh
```

What this does:
1. `git fetch/checkout/pull` latest `main`
2. Rebuild backend/frontend images from repo source
3. Restart staging containers with health checks
4. Keep data mounts in `/opt/peters-erp/data/staging` and `/opt/peters-erp/static`

## Daily flow from local
1. On local machine:
   ```bash
   git add -A
   git commit -m "your message"
   git push origin main
   ```
2. On server:
   ```bash
   bash /opt/peters-erp/repo/scripts/deploy-staging-sync.sh
   ```

## Quick verification
```bash
curl -s https://peters-erp.com/api/health
curl -I https://peters-erp.com/
docker ps --format '{{.Names}} {{.Status}}' | grep peters-erp-staging
```

## Troubleshooting
- If deploy fails on build: inspect logs from script output, then run:
  ```bash
  docker logs --tail 120 peters-erp-staging-backend
  docker logs --tail 120 peters-erp-staging-frontend
  ```
- If UI serves old JS: hard refresh browser (`Ctrl+Shift+R`).
- If static files fail with permission errors:
  ```bash
  docker exec peters-erp-staging-frontend sh -c 'find /usr/share/nginx/html -type d -exec chmod 755 {} \; && find /usr/share/nginx/html -type f -exec chmod 644 {} \;'
  ```
