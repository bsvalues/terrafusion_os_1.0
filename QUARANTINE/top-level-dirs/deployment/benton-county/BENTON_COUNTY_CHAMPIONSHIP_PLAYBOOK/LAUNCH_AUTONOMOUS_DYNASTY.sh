#!/bin/bash
# 🏆 LAUNCH THE AUTONOMOUS DYNASTY SYSTEM
# "Set it and forget it - Championship automation"

set -e

echo "🏆 LAUNCHING AUTONOMOUS DYNASTY SYSTEM"
echo "======================================"
echo "The self-running, self-improving championship machine"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if already running
if systemctl is-active --quiet benton-dynasty.service; then
    echo -e "${YELLOW}⚠️  Dynasty system already running${NC}"
    echo "Use 'systemctl status benton-dynasty.service' to check status"
    exit 0
fi

# System validation
echo -e "${BLUE}🔍 Validating system requirements...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Installing Ollama...${NC}"
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Create required directories
echo -e "${BLUE}📁 Creating dynasty infrastructure...${NC}"
directories=(
    "/var/log/benton-dynasty"
    "/var/lib/benton-dynasty/data"
    "/var/lib/benton-dynasty/models"
    "/var/lib/benton-dynasty/training"
    "/var/lib/benton-dynasty/backups"
    "/var/lib/benton-dynasty/reports"
)

for dir in "${directories[@]}"; do
    sudo mkdir -p "$dir"
    sudo chown $USER:$USER "$dir"
done

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip3 install --user aiohttp aiofiles pandas numpy asyncio prometheus-client

# Create systemd service
echo -e "${BLUE}🔧 Creating systemd service...${NC}"
sudo tee /etc/systemd/system/benton-dynasty.service > /dev/null <<EOF
[Unit]
Description=Benton County Autonomous Dynasty System
Documentation=https://github.com/benton-county/dynasty-docs
After=network-online.target ollama.service
Wants=network-online.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment="PYTHONPATH=$(pwd)"
Environment="OLLAMA_HOST=localhost:11434"
ExecStartPre=/bin/bash -c 'ollama serve || true'
ExecStart=/usr/bin/python3 $(pwd)/autonomous_orchestrator.py
Restart=always
RestartSec=30
StandardOutput=append:/var/log/benton-dynasty/dynasty.log
StandardError=append:/var/log/benton-dynasty/dynasty-error.log

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring service
echo -e "${BLUE}📊 Setting up monitoring...${NC}"
sudo tee /etc/systemd/system/benton-dynasty-monitor.service > /dev/null <<EOF
[Unit]
Description=Benton Dynasty Monitoring Dashboard
After=benton-dynasty.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 -m http.server 8888 --directory .
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create health check timer
echo -e "${BLUE}🏥 Setting up health checks...${NC}"
sudo tee /etc/systemd/system/benton-health-check.timer > /dev/null <<EOF
[Unit]
Description=Dynasty Health Check Timer
Requires=benton-health-check.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/benton-health-check.service > /dev/null <<EOF
[Unit]
Description=Dynasty Health Check

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'curl -s http://localhost:8888/health || systemctl restart benton-dynasty'
EOF

# Create backup timer
echo -e "${BLUE}💾 Setting up automated backups...${NC}"
sudo tee /etc/systemd/system/benton-backup.timer > /dev/null <<EOF
[Unit]
Description=Dynasty Backup Timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/benton-backup.service > /dev/null <<EOF
[Unit]
Description=Dynasty Backup

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'tar -czf /var/lib/benton-dynasty/backups/dynasty-\$(date +%Y%m%d).tar.gz /var/lib/benton-dynasty/data /var/lib/benton-dynasty/models'
EOF

# Enable and start services
echo -e "${BLUE}🚀 Starting dynasty services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable benton-dynasty.service
sudo systemctl enable benton-dynasty-monitor.service
sudo systemctl enable benton-health-check.timer
sudo systemctl enable benton-backup.timer

# Start services
sudo systemctl start benton-dynasty.service
sleep 5
sudo systemctl start benton-dynasty-monitor.service
sudo systemctl start benton-health-check.timer
sudo systemctl start benton-backup.timer

# Verify services are running
echo ""
echo -e "${BLUE}✅ Verifying dynasty systems...${NC}"

if systemctl is-active --quiet benton-dynasty.service; then
    echo -e "${GREEN}✅ Dynasty orchestrator: RUNNING${NC}"
else
    echo -e "${RED}❌ Dynasty orchestrator: FAILED${NC}"
fi

if systemctl is-active --quiet benton-dynasty-monitor.service; then
    echo -e "${GREEN}✅ Monitoring dashboard: RUNNING${NC}"
else
    echo -e "${RED}❌ Monitoring dashboard: FAILED${NC}"
fi

# Create convenience scripts
echo -e "${BLUE}📝 Creating management scripts...${NC}"

# Status script
cat > dynasty-status.sh << 'SCRIPT'
#!/bin/bash
echo "🏆 DYNASTY STATUS"
echo "================"
echo ""
echo "Core Services:"
systemctl status benton-dynasty.service --no-pager | grep "Active:"
echo ""
echo "Recent Logs:"
sudo journalctl -u benton-dynasty.service -n 10 --no-pager
echo ""
echo "Metrics:"
curl -s http://localhost:8888/metrics 2>/dev/null | grep -E "(uptime|queries_processed|models_trained)" || echo "Metrics not available yet"
SCRIPT
chmod +x dynasty-status.sh

# Stop script
cat > dynasty-stop.sh << 'SCRIPT'
#!/bin/bash
echo "🛑 Stopping dynasty services..."
sudo systemctl stop benton-dynasty-monitor.service
sudo systemctl stop benton-dynasty.service
echo "Dynasty services stopped"
SCRIPT
chmod +x dynasty-stop.sh

# Logs script
cat > dynasty-logs.sh << 'SCRIPT'
#!/bin/bash
echo "📜 DYNASTY LOGS"
echo "=============="
sudo journalctl -u benton-dynasty.service -f
SCRIPT
chmod +x dynasty-logs.sh

# Final output
echo ""
echo -e "${GREEN}🏆 AUTONOMOUS DYNASTY SYSTEM LAUNCHED!${NC}"
echo "====================================="
echo ""
echo "📊 Dashboard: http://localhost:8888/CHAMPIONSHIP_DASHBOARD.html"
echo "📜 Logs: ./dynasty-logs.sh or journalctl -u benton-dynasty -f"
echo "📈 Status: ./dynasty-status.sh"
echo "🛑 Stop: ./dynasty-stop.sh"
echo ""
echo "The system will now:"
echo "✅ Continuously collect Benton County data"
echo "✅ Train and improve models automatically"
echo "✅ Self-heal from failures"
echo "✅ Optimize performance continuously"
echo "✅ Generate daily reports"
echo ""
echo -e "${BLUE}The dynasty runs itself. Do Your Job is automated.${NC}"
echo ""

# Open dashboard in browser if possible
if command -v xdg-open &> /dev/null; then
    sleep 3
    xdg-open "http://localhost:8888/CHAMPIONSHIP_DASHBOARD.html" &
elif command -v open &> /dev/null; then
    sleep 3
    open "http://localhost:8888/CHAMPIONSHIP_DASHBOARD.html" &
fi

echo "🏈 Dynasty system is running autonomously!"