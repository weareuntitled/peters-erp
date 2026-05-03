# HTTPS Hardening Runbook

This runbook prevents mixed-content regressions and unstable API routing in Peters ERP.

## Goals
- Frontend must never call `http://` APIs when page is loaded over HTTPS.
- Frontend and backend communication must stay same-origin through `/api`.
- Deployments must always produce a new hashed JS bundle and cleanly replace old assets.

## Safe Defaults (Code)
- Use relative API base URL by default: `VITE_API_URL=/api`.
- Keep API URL resolution centralized in `frontend/src/api/apiClient.ts`.
- Auto-upgrade accidental `http://...` env values to `https://...` when browser protocol is HTTPS.
- Build static/logo URLs via `buildStaticUrl(...)` from `apiClient.ts`.

## Nginx Topology (Required)

### Host nginx (`/etc/nginx/sites-enabled/peters-erp.com.conf`)
- `80 -> 301 https://$host$request_uri`
- `443` server should proxy only to frontend container:
  - `location / { proxy_pass http://localhost:5175; }`
- Do not add separate `location /api` here unless intentionally bypassing frontend container.

### Frontend container nginx (`/etc/nginx/conf.d/default.conf`)
- Serve SPA from `/usr/share/nginx/html`.
- Proxy API to backend service name in docker network:
  - `location /api { proxy_pass http://peters-erp-staging-backend:8000; }`

## Deploy Procedure (Frontend)
1. Build locally:
   - `npm run build` in `frontend/`
2. Archive and upload:
   - create tar from `frontend/dist`
   - copy tar to server
3. Deploy into running frontend container:
   - remove old `/usr/share/nginx/html/*`
   - copy new `dist/*` into `/usr/share/nginx/html/`
   - set permissions:
     - directories: `755`
     - files: `644`
   - reload nginx in frontend container
4. Verify live hash changed in `index.html` script src.

## Verification Checklist
- `https://peters-erp.com/api/health` returns `200`.
- `https://peters-erp.com/` loads new hashed bundle.
- Browser DevTools Network:
  - no `http://peters-erp.com/api/...` requests
  - all API calls are `https://peters-erp.com/api/...`
- Console has no mixed content errors.

## Regression Guardrails
- Before merge, grep frontend source for hardcoded insecure URLs:
  - `http://peters-erp.com`
  - `http://localhost:8000`
  - direct absolute API strings outside api client helpers
- Keep all API calls using `apiClient` (or values derived from it).

## Known Operational Pitfall
- `docker cp` can produce unreadable file modes in container layers.
- If you see `403`, `500`, or `Permission denied` from nginx static files, re-apply permissions under `/usr/share/nginx/html`.

## Where Compose Usually Lives on Hostinger
- Common path used in this project: `/opt/peters-erp/` (or deployment root you selected).
- If file is not visible in panel UI, verify via SSH and `find` in your deploy root.
