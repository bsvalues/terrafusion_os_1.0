#!/bin/bash

# TerraFusion Post-Removal Script for Linux
# Runs after package removal to clean up services and data

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}TerraFusion Post-Removal Cleanup${NC}"

# Stop and disable service
if systemctl is-active --quiet terrafusion; then
    systemctl stop terrafusion
fi

if systemctl is-enabled --quiet terrafusion; then
    systemctl disable terrafusion
fi

# Remove systemd service file
rm -f /etc/systemd/system/terrafusion.service
systemctl daemon-reload

# Remove service user and data (optional - commented out for safety)
# userdel terrafusion 2>/dev/null || true
# rm -rf /var/lib/terrafusion

# Remove firewall rule (if ufw is available)
if command -v ufw &> /dev/null; then
    ufw delete allow 5000/tcp 2>/dev/null || true
fi

echo -e "${YELLOW}TerraFusion cleanup completed${NC}"

exit 0