# Hostinger Deployment Guide for GSWIN ERP

## Pre-built Files Checklist
These files should be uploaded to your Hostinger VPS in `/home/user/gswin-erp/`:

- `docker-compose.yml`
- `backend/Dockerfile`
- `backend/requirements.txt`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `data/gswin_modern.db` (existing database file)
- `.env` (environment variables, see below)

## 1. Build & Start Command
```bash
cd /home/user/gswin-erp
# Build with no cache (important for code changes)
docker-compose build --no-cache

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 2. Environment Variables (.env)
Create `/home/user/gswin-erp/.env`:
```env
# Backend
DATABASE_URL=sqlite:///data/gswin_modern.db
API_URL=https://your-domain.com/api
SECRET_KEY=your-strong-secret-key-here

# Frontend
VITE_API_URL=https://your-domain.com/api

# SMTP (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 3. Docker Compose (Production Mode)
The current `docker-compose.yml` is for development. For Hostinger:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/data
      - ./backend/static:/app/static
    environment:
      - DATABASE_URL=sqlite:///data/gswin_modern.db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
```

## 4. Nginx Configuration (Hostinger)
The `nginx.conf` should proxy `/api` to the backend. Example:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 5. SSL Certificate (Let's Encrypt on Hostinger)
After domain is pointing to VPS:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 6. Port Access
- **Backend API**: `localhost:8000` (internal only, exposed to nginx)
- **Frontend**: Ports `80` and `443` (external)
- **Database**: SQLite file on disk (no port needed)

## 7. Rebuild After Code Changes
If you modify code later:
```bash
cd /home/user/gswin-erp
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### PDF Generation Not Working
- Check WeasyPrint system deps are installed in `backend/Dockerfile`
- Container must include `libcairo2`, `libpango-1.0-0`, `libpangocairo-1.0-0`

### Logo Not Showing in PDFs
- Ensure `logo_pfad` in database uses absolute container path: `/app/app/static/logos/logo.svg`
- Upload logo via Settings page (Einstellungen → visuelles Erscheinungsbild)

### CORS Errors
- Frontend `.env` must point to correct backend URL
- Backend `main.py` must allow CORS from your domain

### Database Locked
- Ensure only one container accesses SQLite at a time
- Avoid volume mounts that create conflicts

## Database Migration (If Needed)
Since you use SQLite (single file), just copy the file:
```bash
# From local to server
scp data/gswin_modern.zip root@your-hostinger-ip:/home/user/gswin-erp/data/
```

Or backup/restore:
```bash
# Backup
docker exec gswin-backend cp /data/gswin_modern.db /data/gswin_modern.db.bak

# Restore
docker exec gswin-backend cp /data/gswin_modern.db.bak /data/gswin_modern.db
```
