#!/bin/bash

# TerraFusion OS Production Logging Setup
# Benton County Production Deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
LOG_DIR="/var/log/terrafusion"
SERVICE_USER="terrafusion"
COUNTY="benton"

echo "=== TerraFusion OS Production Logging Setup ==="
echo "County: $COUNTY"
echo "Log Directory: $LOG_DIR"
echo "Service User: $SERVICE_USER"

# Create service user if not exists
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user: $SERVICE_USER"
    sudo useradd -r -s /bin/false -d /opt/terrafusion "$SERVICE_USER"
fi

# Create log directories
echo "Creating log directories..."
sudo mkdir -p "$LOG_DIR"/{api,frontend,plugins,audit,migration}
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
sudo chmod -R 755 "$LOG_DIR"

# Create logrotate configuration
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/terrafusion > /dev/null << 'EOF'
/var/log/terrafusion/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 terrafusion terrafusion
    postrotate
        systemctl reload terrafusion-api || true
    endscript
}

/var/log/terrafusion/audit/*.log {
    daily
    missingok
    rotate 365
    compress
    delaycompress
    notifempty
    create 644 terrafusion terrafusion
    copytruncate
}
EOF

# Create rsyslog configuration for TerraFusion
echo "Configuring rsyslog..."
sudo tee /etc/rsyslog.d/50-terrafusion.conf > /dev/null << 'EOF'
# TerraFusion OS Logging Configuration
# Benton County Production

# API logs
:programname, isequal, "terrafusion-api" /var/log/terrafusion/api/terrafusion-api.log
& stop

# Plugin logs
:programname, isequal, "terrafusion-plugins" /var/log/terrafusion/plugins/plugins.log
& stop

# Audit logs (high priority)
:programname, isequal, "terrafusion-audit" /var/log/terrafusion/audit/audit.log
& stop

# Migration logs
:programname, isequal, "terrafusion-migration" /var/log/terrafusion/migration/migration.log
& stop

# Security events
:msg, contains, "SECURITY_EVENT" /var/log/terrafusion/audit/security.log
& stop
EOF

# Restart rsyslog
echo "Restarting rsyslog..."
sudo systemctl restart rsyslog

# Create systemd journal configuration
echo "Configuring systemd journal..."
sudo mkdir -p /etc/systemd/journald.conf.d
sudo tee /etc/systemd/journald.conf.d/terrafusion.conf > /dev/null << 'EOF'
[Journal]
# TerraFusion OS Journal Configuration
Storage=persistent
Compress=yes
SplitMode=uid
RateLimitInterval=30s
RateLimitBurst=10000
SystemMaxUse=2G
SystemKeepFree=1G
SystemMaxFileSize=128M
RuntimeMaxUse=1G
RuntimeKeepFree=512M
MaxRetentionSec=1month
EOF

sudo systemctl restart systemd-journald

# Create monitoring script for log health
echo "Creating log monitoring script..."
sudo tee /usr/local/bin/terrafusion-log-monitor.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Log Health Monitor
# Checks log file sizes, permissions, and rotation

LOG_DIR="/var/log/terrafusion"
MAX_SIZE_MB=500
ALERT_EMAIL="admin@bentoncounty.gov"

check_log_size() {
    local file="$1"
    local size_mb=$(du -m "$file" 2>/dev/null | cut -f1)
    
    if [[ $size_mb -gt $MAX_SIZE_MB ]]; then
        echo "WARNING: $file is ${size_mb}MB (exceeds ${MAX_SIZE_MB}MB limit)"
        logger -p local0.warn "TerraFusion log file $file exceeds size limit: ${size_mb}MB"
        return 1
    fi
    return 0
}

check_log_permissions() {
    local file="$1"
    local owner=$(stat -c '%U:%G' "$file" 2>/dev/null)
    
    if [[ "$owner" != "terrafusion:terrafusion" ]]; then
        echo "WARNING: $file has incorrect ownership: $owner"
        logger -p local0.warn "TerraFusion log file $file has incorrect ownership: $owner"
        return 1
    fi
    return 0
}

# Check all log files
find "$LOG_DIR" -name "*.log" -type f | while read -r logfile; do
    check_log_size "$logfile"
    check_log_permissions "$logfile"
done

# Check disk space
disk_usage=$(df "$LOG_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $disk_usage -gt 85 ]]; then
    echo "WARNING: Log directory disk usage is ${disk_usage}%"
    logger -p local0.warn "TerraFusion log directory disk usage critical: ${disk_usage}%"
fi

echo "Log health check completed at $(date)"
EOF

sudo chmod +x /usr/local/bin/terrafusion-log-monitor.sh

# Create cron job for log monitoring
echo "Setting up log monitoring cron job..."
sudo tee /etc/cron.d/terrafusion-log-monitor > /dev/null << 'EOF'
# TerraFusion OS Log Monitoring
# Runs every 15 minutes
*/15 * * * * terrafusion /usr/local/bin/terrafusion-log-monitor.sh >> /var/log/terrafusion/monitor.log 2>&1
EOF

# Create log analysis script
echo "Creating log analysis script..."
sudo tee /usr/local/bin/terrafusion-log-analysis.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Log Analysis Tool
# Generates daily reports and alerts

LOG_DIR="/var/log/terrafusion"
REPORT_DIR="/var/log/terrafusion/reports"
DATE=$(date +%Y-%m-%d)

mkdir -p "$REPORT_DIR"

echo "=== TerraFusion OS Daily Log Report - $DATE ===" > "$REPORT_DIR/daily-$DATE.txt"
echo "" >> "$REPORT_DIR/daily-$DATE.txt"

# API Error Summary
echo "API Errors (Last 24 hours):" >> "$REPORT_DIR/daily-$DATE.txt"
grep -i "error\|exception\|failed" "$LOG_DIR/api/"*.log 2>/dev/null | \
    grep "$(date -d '1 day ago' +%Y-%m-%d)" | \
    wc -l >> "$REPORT_DIR/daily-$DATE.txt"

# Plugin Activity
echo "" >> "$REPORT_DIR/daily-$DATE.txt"
echo "Plugin Invocations (Last 24 hours):" >> "$REPORT_DIR/daily-$DATE.txt"
grep "PluginInvoke" "$LOG_DIR/plugins/"*.log 2>/dev/null | \
    grep "$(date -d '1 day ago' +%Y-%m-%d)" | \
    wc -l >> "$REPORT_DIR/daily-$DATE.txt"

# Security Events
echo "" >> "$REPORT_DIR/daily-$DATE.txt"
echo "Security Events (Last 24 hours):" >> "$REPORT_DIR/daily-$DATE.txt"
grep "SECURITY_EVENT" "$LOG_DIR/audit/"*.log 2>/dev/null | \
    grep "$(date -d '1 day ago' +%Y-%m-%d)" | \
    wc -l >> "$REPORT_DIR/daily-$DATE.txt"

# Migration Activity
echo "" >> "$REPORT_DIR/daily-$DATE.txt"
echo "Migration Events (Last 24 hours):" >> "$REPORT_DIR/daily-$DATE.txt"
grep -i "harris.*pacs\|migration" "$LOG_DIR/migration/"*.log 2>/dev/null | \
    grep "$(date -d '1 day ago' +%Y-%m-%d)" | \
    wc -l >> "$REPORT_DIR/daily-$DATE.txt"

echo "" >> "$REPORT_DIR/daily-$DATE.txt"
echo "Report generated at $(date)" >> "$REPORT_DIR/daily-$DATE.txt"

# Keep only last 30 days of reports
find "$REPORT_DIR" -name "daily-*.txt" -mtime +30 -delete

logger -p local0.info "TerraFusion daily log analysis completed"
EOF

sudo chmod +x /usr/local/bin/terrafusion-log-analysis.sh

# Create daily analysis cron job
echo "Setting up daily analysis cron job..."
sudo tee -a /etc/cron.d/terrafusion-log-monitor > /dev/null << 'EOF'

# Daily log analysis at 6 AM
0 6 * * * terrafusion /usr/local/bin/terrafusion-log-analysis.sh
EOF

# Set up log file templates
echo "Creating initial log files..."
sudo touch "$LOG_DIR"/{api/terrafusion-api.log,plugins/plugins.log,audit/audit.log,migration/migration.log,monitor.log}
sudo chown terrafusion:terrafusion "$LOG_DIR"/*.log "$LOG_DIR"/*/*.log
sudo chmod 644 "$LOG_DIR"/*.log "$LOG_DIR"/*/*.log

# Create log configuration for .NET application
echo "Creating .NET logging configuration..."
mkdir -p "$PROJECT_ROOT/backend/TerraFusion.API/Config"
tee "$PROJECT_ROOT/backend/TerraFusion.API/Config/logging.json" > /dev/null << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning",
      "TerraFusion": "Debug"
    },
    "Console": {
      "LogLevel": {
        "Default": "Information"
      }
    },
    "File": {
      "LogLevel": {
        "Default": "Information"
      },
      "Path": "/var/log/terrafusion/api/terrafusion-api.log",
      "Append": true,
      "MaxSizeBytes": 104857600,
      "MaxRollingFiles": 10
    },
    "EventLog": {
      "LogLevel": {
        "Default": "Warning"
      }
    }
  }
}
EOF

echo ""
echo "✅ Production logging setup completed successfully!"
echo ""
echo "Log directories created:"
echo "  - API logs: $LOG_DIR/api/"
echo "  - Plugin logs: $LOG_DIR/plugins/"
echo "  - Audit logs: $LOG_DIR/audit/"
echo "  - Migration logs: $LOG_DIR/migration/"
echo ""
echo "Monitoring configured:"
echo "  - Log rotation: /etc/logrotate.d/terrafusion"
echo "  - Health monitoring: /usr/local/bin/terrafusion-log-monitor.sh"
echo "  - Daily analysis: /usr/local/bin/terrafusion-log-analysis.sh"
echo ""
echo "Next steps:"
echo "  1. Run setup-systemd-service.sh to create the systemd service"
echo "  2. Configure application logging in appsettings.Production.json"
echo "  3. Test log rotation with: sudo logrotate -f /etc/logrotate.d/terrafusion"
