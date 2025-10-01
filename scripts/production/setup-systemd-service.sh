#!/bin/bash

# TerraFusion OS SystemD Service Setup
# Benton County Production Deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
SERVICE_USER="terrafusion"
SERVICE_GROUP="terrafusion"
INSTALL_DIR="/opt/terrafusion"
COUNTY="benton"
DOTNET_VERSION="8.0"

echo "=== TerraFusion OS SystemD Service Setup ==="
echo "County: $COUNTY"
echo "Install Directory: $INSTALL_DIR"
echo "Service User: $SERVICE_USER"

# Verify .NET runtime is installed
if ! command -v dotnet &> /dev/null; then
    echo "ERROR: .NET runtime not found. Please install .NET $DOTNET_VERSION runtime first."
    echo "Run: wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb"
    echo "     sudo dpkg -i packages-microsoft-prod.deb"
    echo "     sudo apt-get update && sudo apt-get install -y aspnetcore-runtime-$DOTNET_VERSION"
    exit 1
fi

# Create service user and group if not exists
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user: $SERVICE_USER"
    sudo useradd -r -s /bin/false -d "$INSTALL_DIR" -c "TerraFusion OS Service" "$SERVICE_USER"
fi

# Create installation directory
echo "Creating installation directory..."
sudo mkdir -p "$INSTALL_DIR"/{api,frontend,logs,config,data}
sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
sudo chmod -R 755 "$INSTALL_DIR"

# Create environment file
echo "Creating environment configuration..."
sudo tee "$INSTALL_DIR/config/terrafusion.env" > /dev/null << EOF
# TerraFusion OS Environment Configuration
# Benton County Production

TERRAFUSION_ENV=production
TERRAFUSION_COUNTY=benton
TERRAFUSION_LEGACY=PACS_9.0
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://localhost:${TF_STATIC_PORT:-8080}

# Database
ConnectionStrings__DefaultConnection=Host=localhost;Database=terrafusion_benton;Username=terrafusion_db;Password=CHANGE_ME

# Plugin Security Keys
TF_BENTON_PLUGIN_KEY=CHANGE_ME_BENTON_PLUGIN_HMAC_KEY

# Logging
LOGGING__LOGLEVEL__DEFAULT=Information
LOGGING__LOGLEVEL__MICROSOFT=Warning

# Security
CORS__ALLOWEDORIGINS=http://localhost:${TF_STATIC_PORT:-8080},https://terrafusion.bentoncounty.gov
JWT__SECRETKEY=CHANGE_ME_JWT_SECRET_KEY
JWT__ISSUER=TerraFusion-Benton
JWT__AUDIENCE=TerraFusion-Users

# Performance
SIGNALR__MAXCONNECTIONS=1000
SIGNALR__KEEPALIVETIMEOUT=00:02:00
EOF

sudo chown "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR/config/terrafusion.env"
sudo chmod 600 "$INSTALL_DIR/config/terrafusion.env"

# Create systemd service file for API
echo "Creating TerraFusion API systemd service..."
sudo tee /etc/systemd/system/terrafusion-api.service > /dev/null << EOF
[Unit]
Description=TerraFusion OS API Service - Benton County
Documentation=https://github.com/terrafusion/os
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$INSTALL_DIR/api
ExecStart=/usr/bin/dotnet TerraFusion.API.dll
Restart=always
RestartSec=10
TimeoutStopSec=30
KillMode=mixed
SyslogIdentifier=terrafusion-api

# Environment
EnvironmentFile=$INSTALL_DIR/config/terrafusion.env

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$INSTALL_DIR /var/log/terrafusion /tmp
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictRealtime=yes
RestrictNamespaces=yes

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service file for Frontend (if using Node.js/Electron in production)
echo "Creating TerraFusion Frontend systemd service..."
sudo tee /etc/systemd/system/terrafusion-frontend.service > /dev/null << EOF
[Unit]
Description=TerraFusion OS Frontend Service - Benton County
Documentation=https://github.com/terrafusion/os
After=network.target terrafusion-api.service
Wants=terrafusion-api.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
TimeoutStopSec=30
SyslogIdentifier=terrafusion-frontend

# Environment
EnvironmentFile=$INSTALL_DIR/config/terrafusion.env
Environment=NODE_ENV=production
Environment=PORT=\${{TF_FRONTEND_PORT:-3000}}

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$INSTALL_DIR /var/log/terrafusion /tmp

# Resource limits
LimitNOFILE=65536
MemoryMax=1G
CPUQuota=100%

[Install]
WantedBy=multi-user.target
EOF

# Create database backup service
echo "Creating database backup service..."
sudo tee /etc/systemd/system/terrafusion-backup.service > /dev/null << EOF
[Unit]
Description=TerraFusion OS Database Backup - Benton County
Documentation=https://github.com/terrafusion/os

[Service]
Type=oneshot
User=$SERVICE_USER
Group=$SERVICE_GROUP
ExecStart=/usr/local/bin/terrafusion-backup.sh
SyslogIdentifier=terrafusion-backup

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=$INSTALL_DIR /var/backups/terrafusion
EOF

# Create backup timer
sudo tee /etc/systemd/system/terrafusion-backup.timer > /dev/null << EOF
[Unit]
Description=TerraFusion OS Daily Backup Timer
Requires=terrafusion-backup.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1800

[Install]
WantedBy=timers.target
EOF

# Create health check service
echo "Creating health check service..."
sudo tee /etc/systemd/system/terrafusion-healthcheck.service > /dev/null << EOF
[Unit]
Description=TerraFusion OS Health Check - Benton County
Documentation=https://github.com/terrafusion/os

[Service]
Type=oneshot
User=$SERVICE_USER
Group=$SERVICE_GROUP
ExecStart=/usr/local/bin/terrafusion-healthcheck.sh
SyslogIdentifier=terrafusion-healthcheck

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/var/log/terrafusion
EOF

# Create health check timer (every 5 minutes)
sudo tee /etc/systemd/system/terrafusion-healthcheck.timer > /dev/null << EOF
[Unit]
Description=TerraFusion OS Health Check Timer
Requires=terrafusion-healthcheck.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Create health check script
echo "Creating health check script..."
sudo tee /usr/local/bin/terrafusion-healthcheck.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Health Check Script
# Monitors API, database, and system resources

HEALTH_LOG="/var/log/terrafusion/health.log"
API_URL="http://localhost:${TF_STATIC_PORT:-8080}/health"
DB_NAME="terrafusion_benton"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$HEALTH_LOG"
}

# Check API health
check_api() {
    if curl -s -f "$API_URL" > /dev/null 2>&1; then
        log_message "API: HEALTHY"
        return 0
    else
        log_message "API: UNHEALTHY - Failed to connect to $API_URL"
        return 1
    fi
}

# Check database connectivity
check_database() {
    if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_message "DATABASE: HEALTHY"
        return 0
    else
        log_message "DATABASE: UNHEALTHY - Cannot connect to $DB_NAME"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local usage=$(df /opt/terrafusion | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $usage -lt 85 ]]; then
        log_message "DISK: HEALTHY - ${usage}% used"
        return 0
    else
        log_message "DISK: WARNING - ${usage}% used (threshold: 85%)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -lt 90 ]]; then
        log_message "MEMORY: HEALTHY - ${mem_usage}% used"
        return 0
    else
        log_message "MEMORY: WARNING - ${mem_usage}% used (threshold: 90%)"
        return 1
    fi
}

# Run all checks
api_ok=0
db_ok=0
disk_ok=0
mem_ok=0

check_api || api_ok=1
check_database || db_ok=1
check_disk_space || disk_ok=1
check_memory || mem_ok=1

# Overall health status
if [[ $api_ok -eq 0 && $db_ok -eq 0 && $disk_ok -eq 0 && $mem_ok -eq 0 ]]; then
    log_message "SYSTEM: HEALTHY - All checks passed"
    exit 0
else
    log_message "SYSTEM: DEGRADED - One or more checks failed"
    
    # Restart API if it's unhealthy
    if [[ $api_ok -ne 0 ]]; then
        log_message "SYSTEM: Attempting to restart terrafusion-api service"
        systemctl restart terrafusion-api
    fi
    
    exit 1
fi
EOF

sudo chmod +x /usr/local/bin/terrafusion-healthcheck.sh

# Create deployment script
echo "Creating deployment script..."
sudo tee /usr/local/bin/terrafusion-deploy.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Deployment Script
# Deploys built application to production directory

set -euo pipefail

SOURCE_DIR="${1:-/tmp/terrafusion-build}"
INSTALL_DIR="/opt/terrafusion"
SERVICE_USER="terrafusion"

if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "ERROR: Source directory $SOURCE_DIR not found"
    exit 1
fi

echo "=== TerraFusion OS Deployment ==="
echo "Source: $SOURCE_DIR"
echo "Target: $INSTALL_DIR"

# Stop services
echo "Stopping services..."
sudo systemctl stop terrafusion-frontend || true
sudo systemctl stop terrafusion-api || true

# Backup current installation
if [[ -d "$INSTALL_DIR/api" ]]; then
    echo "Creating backup..."
    sudo cp -r "$INSTALL_DIR" "/tmp/terrafusion-backup-$(date +%Y%m%d-%H%M%S)"
fi

# Deploy API
if [[ -d "$SOURCE_DIR/api" ]]; then
    echo "Deploying API..."
    sudo rm -rf "$INSTALL_DIR/api"
    sudo cp -r "$SOURCE_DIR/api" "$INSTALL_DIR/"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/api"
    sudo chmod +x "$INSTALL_DIR/api/TerraFusion.API" || true
fi

# Deploy Frontend
if [[ -d "$SOURCE_DIR/frontend" ]]; then
    echo "Deploying Frontend..."
    sudo rm -rf "$INSTALL_DIR/frontend"
    sudo cp -r "$SOURCE_DIR/frontend" "$INSTALL_DIR/"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/frontend"
fi

# Start services
echo "Starting services..."
sudo systemctl start terrafusion-api
sudo systemctl start terrafusion-frontend

# Wait for services to start
sleep 5

# Verify deployment
if systemctl is-active --quiet terrafusion-api; then
    echo "✅ API service started successfully"
else
    echo "❌ API service failed to start"
    sudo journalctl -u terrafusion-api --no-pager -n 20
fi

if systemctl is-active --quiet terrafusion-frontend; then
    echo "✅ Frontend service started successfully"
else
    echo "❌ Frontend service failed to start"
    sudo journalctl -u terrafusion-frontend --no-pager -n 20
fi

echo "Deployment completed at $(date)"
EOF

sudo chmod +x /usr/local/bin/terrafusion-deploy.sh

# Reload systemd and enable services
echo "Enabling systemd services..."
sudo systemctl daemon-reload
sudo systemctl enable terrafusion-api.service
sudo systemctl enable terrafusion-frontend.service
sudo systemctl enable terrafusion-backup.timer
sudo systemctl enable terrafusion-healthcheck.timer

# Start timers
sudo systemctl start terrafusion-backup.timer
sudo systemctl start terrafusion-healthcheck.timer

echo ""
echo "✅ SystemD service setup completed successfully!"
echo ""
echo "Services created:"
echo "  - terrafusion-api.service (API backend)"
echo "  - terrafusion-frontend.service (Frontend server)"
echo "  - terrafusion-backup.service (Database backup)"
echo "  - terrafusion-healthcheck.service (Health monitoring)"
echo ""
echo "Timers enabled:"
echo "  - terrafusion-backup.timer (Daily backups)"
echo "  - terrafusion-healthcheck.timer (5-minute health checks)"
echo ""
echo "Management commands:"
echo "  - Start services: sudo systemctl start terrafusion-api terrafusion-frontend"
echo "  - Stop services: sudo systemctl stop terrafusion-api terrafusion-frontend"
echo "  - Check status: sudo systemctl status terrafusion-api"
echo "  - View logs: sudo journalctl -u terrafusion-api -f"
echo "  - Deploy: sudo /usr/local/bin/terrafusion-deploy.sh /path/to/build"
echo ""
echo "⚠️  IMPORTANT: Update the following in $INSTALL_DIR/config/terrafusion.env:"
echo "  - Database connection string"
echo "  - Plugin HMAC keys"
echo "  - JWT secret key"
