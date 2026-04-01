#!/bin/bash

# TerraFusion Post-Installation Script for Linux
# Runs after package installation to configure services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}TerraFusion Post-Installation Configuration${NC}"

# Create service user if it doesn't exist
if ! id "terrafusion" &>/dev/null; then
    useradd --system --shell /bin/false --home /var/lib/terrafusion --create-home terrafusion
    echo -e "${YELLOW}Created service user: terrafusion${NC}"
fi

# Set proper permissions
chown -R terrafusion:terrafusion /opt/terrafusion
chown -R terrafusion:terrafusion /var/lib/terrafusion

# Create systemd service
cat > /etc/systemd/system/terrafusion.service << EOF
[Unit]
Description=TerraFusion Civil Infrastructure
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=terrafusion
WorkingDirectory=/opt/terrafusion
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable terrafusion

# Start PostgreSQL if not running
if ! systemctl is-active --quiet postgresql; then
    systemctl start postgresql || true
fi

# Create database and user
sudo -u postgres createdb terrafusion 2>/dev/null || true
sudo -u postgres createuser terrafusion 2>/dev/null || true

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    ufw allow 5000/tcp || true
fi

# Start TerraFusion service
systemctl start terrafusion

echo -e "${GREEN}TerraFusion installation completed successfully!${NC}"
echo -e "${YELLOW}Access the application at: http://localhost:5000${NC}"

exit 0