#!/bin/bash
set -e

# Peters ERP - VPS Initial Setup Script
# Run this on your VPS after clean Ubuntu 24.04 install

echo "=========================================="
echo "  Peters ERP - VPS Setup"
echo "=========================================="

# Configuration
REPO_URL="git@github.com:weareuntitled/peters-erp.git"
VPS_DIR="/opt/peters-erp"
DOMAIN_STAGING="staging.peters-erp.com"
DOMAIN_PROD="peters-erp.com"
EMAIL="djdanep@gmail.com"

# 1. Update system
echo ""
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install essential tools
echo ""
echo "🔧 Installing essential tools..."
apt install -y \
    curl \
    git \
    wget \
    ufw \
    fail2ban \
    nginx \
    certbot \
    python3-certbot-nginx \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# 3. Install Docker
echo ""
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker root
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Install docker-compose-plugin
apt install -y docker-compose-plugin

# 4. Configure Firewall
echo ""
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 5. Create directory structure
echo ""
echo "📁 Creating directory structure..."
mkdir -p "$VPS_DIR"/{staging,production,data/staging,data/production,static,scripts,repo}
chmod 755 "$VPS_DIR"

# 6. Clone repository
echo ""
echo "📂 Cloning repository..."
if [ -d "$VPS_DIR/repo/.git" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd "$VPS_DIR/repo"
    git pull
else
    git clone "$REPO_URL" "$VPS_DIR/repo"
fi

# 7. Create environment files
echo ""
echo "🔑 Creating environment files..."

# Generate random secret keys
STAGING_SECRET=$(openssl rand -hex 32)
PROD_SECRET=$(openssl rand -hex 32)

cat > "$VPS_DIR/.env.staging" << EOF
SECRET_KEY=$STAGING_SECRET
DATABASE_URL=sqlite:///app/data/gswin_modern.db
API_URL=https://$DOMAIN_STAGING/api
CORS_ORIGINS=https://$DOMAIN_STAGING
LOG_LEVEL=debug
EOF

cat > "$VPS_DIR/.env.production" << EOF
SECRET_KEY=$PROD_SECRET
DATABASE_URL=sqlite:///app/data/gswin_modern.db
API_URL=https://$DOMAIN_PROD/api
CORS_ORIGINS=https://$DOMAIN_PROD,https://www.$DOMAIN_PROD
LOG_LEVEL=info
EOF

cat > "$VPS_DIR/.env.production" << EOF
SECRET_KEY=$PROD_SECRET
DATABASE_URL=sqlite:///app/data/gswin_modern.db
API_URL=https://$DOMAIN_PROD/api
CORS_ORIGINS=https://$DOMAIN_PROD,https://www.$DOMAIN_PROD
LOG_LEVEL=info
EOF

chmod 600 "$VPS_DIR/.env.staging" "$VPS_DIR/.env.production"

# 8. Setup scripts
echo ""
echo "📜 Setting up deployment scripts..."
cp "$VPS_DIR/repo/scripts/"*.sh "$VPS_DIR/scripts/"
chmod +x "$VPS_DIR/scripts/"*.sh

# Create .current_tag and .previous_tag files
echo "latest" > "$VPS_DIR/.current_tag"
echo "latest" > "$VPS_DIR/.previous_tag"

# 9. Setup Nginx
echo ""
echo "🌐 Setting up Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Copy nginx configs
cp "$VPS_DIR/repo/deploy/nginx/$DOMAIN_STAGING.conf" /etc/nginx/sites-available/
cp "$VPS_DIR/repo/deploy/nginx/$DOMAIN_PROD.conf" /etc/nginx/sites-available/

# Enable sites
ln -sf "/etc/nginx/sites-available/$DOMAIN_STAGING.conf" /etc/nginx/sites-enabled/
ln -sf "/etc/nginx/sites-available/$DOMAIN_PROD.conf" /etc/nginx/sites-enabled/

# Test nginx config
nginx -t || exit 1
systemctl restart nginx
systemctl enable nginx

# 10. Upload initial database (prompt user)
echo ""
echo "💾 Database setup..."
if [ ! -f "$VPS_DIR/data/production/gswin_modern.db" ]; then
    echo "No production database found at $VPS_DIR/data/production/gswin_modern.db"
    echo "Please upload your database file manually:"
    echo "  scp gswin_modern.db root@<VPS_IP>:$VPS_DIR/data/production/"
    echo "  scp gswin_modern.db root@<VPS_IP>:$VPS_DIR/data/staging/"
else
    echo "Database already exists"
fi

# 11. Setup backups directory
mkdir -p "$VPS_DIR/data/production/backups"
mkdir -p "$VPS_DIR/data/staging/backups"

# 12. Setup fail2ban
echo ""
echo "🛡️ Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# 13. Automatic security updates
echo ""
echo "🔒 Installing automatic security updates..."
apt install -y unattended-upgrades
systemctl enable unattended-upgrades

# 14. Daily cleanup
echo ""
echo "🧹 Setting up daily cleanup..."
cat > /etc/cron.daily/peters-erp-cleanup << 'EOF'
#!/bin/bash
# Clean old Docker images, containers, and volumes
docker system prune -f --filter "until=168h" > /dev/null 2>&1
# Clean old backups (keep last 30 days)
find /opt/peters-erp/data -name "*.backup-*.sqlite" -mtime +30 -delete > /dev/null 2>&1
EOF
chmod +x /etc/cron.daily/peters-erp-cleanup

# 15. SSL Certificates (prompt for DNS setup)
echo ""
echo "=========================================="
echo "  Setup Summary"
echo "=========================================="
echo ""
echo "✅ Directories created: $VPS_DIR"
echo "✅ Repository cloned: $VPS_DIR/repo"
echo "✅ Nginx configured"
echo "✅ Firewall enabled"
echo "✅ Docker installed"
echo "✅ Scripts installed"
echo ""
echo "⚠️  Next Steps:"
echo ""
echo "1. DNS Configuration:"
echo "   Add A records:"
echo "   - $DOMAIN_STAGING → $(curl -s ifconfig.me)"
echo "   - $DOMAIN_PROD → $(curl -s ifconfig.me)"
echo "   - www.$DOMAIN_PROD → $(curl -s ifconfig.me)"
echo ""
echo "2. Upload initial database:"
echo "   scp gswin_modern.db root@$(curl -s ifconfig.me):$VPS_DIR/data/production/"
echo "   scp gswin_modern.db root@$(curl -s ifconfig.me):$VPS_DIR/data/staging/"
echo ""
echo "3. Setup SSL certificates (after DNS propagation):"
echo "   certbot --nginx -d $DOMAIN_STAGING -d $DOMAIN_PROD -d www.$DOMAIN_PROD --non-interactive --agree-tos --email $EMAIL"
echo ""
echo "4. Setup GitHub secrets (see DEPLOYMENT_V2.md):"
echo "   - SSH_HOST, SSH_USER, SSH_KEY"
echo "   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD"
echo "   - EMAIL_TO"
echo ""
echo "5. First staging deploy:"
echo "   cd $VPS_DIR/scripts"
echo "   ./deploy-staging.sh latest"
echo ""
echo "6. Then push to main branch to trigger auto-deploy"
echo ""
echo "📚 Full documentation: $VPS_DIR/repo/DEPLOYMENT_V2.md"
