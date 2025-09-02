#!/bin/bash

# TerraFusion OS Backup and Disaster Recovery System
# Benton County Production Deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
BACKUP_DIR="/var/backups/terrafusion"
SERVICE_USER="terrafusion"
COUNTY="benton"
DB_NAME="terrafusion_benton"
DB_USER="terrafusion_db"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12

echo "=== TerraFusion OS Backup System Setup ==="
echo "County: $COUNTY"
echo "Backup Directory: $BACKUP_DIR"
echo "Database: $DB_NAME"

# Create backup directories
echo "Creating backup directories..."
sudo mkdir -p "$BACKUP_DIR"/{database,application,logs,config}
sudo mkdir -p "$BACKUP_DIR"/archive/{daily,weekly,monthly}
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$BACKUP_DIR"
sudo chmod -R 750 "$BACKUP_DIR"

# Create main backup script
echo "Creating backup script..."
sudo tee /usr/local/bin/terrafusion-backup.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Comprehensive Backup Script
# Handles database, application, and configuration backups

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/terrafusion"
DB_NAME="terrafusion_benton"
DB_USER="terrafusion_db"
INSTALL_DIR="/opt/terrafusion"
LOG_DIR="/var/log/terrafusion"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$BACKUP_LOG"
}

# Database backup function
backup_database() {
    local backup_file="$BACKUP_DIR/database/terrafusion_db_$TIMESTAMP.sql"
    local compressed_file="$backup_file.gz"
    
    log_message "Starting database backup..."
    
    # Create database dump
    if sudo -u postgres pg_dump "$DB_NAME" > "$backup_file" 2>/dev/null; then
        # Compress the backup
        gzip "$backup_file"
        
        # Verify backup integrity
        if gunzip -t "$compressed_file" 2>/dev/null; then
            local size=$(du -h "$compressed_file" | cut -f1)
            log_message "Database backup completed: $compressed_file ($size)"
            
            # Create latest symlink
            ln -sf "$(basename "$compressed_file")" "$BACKUP_DIR/database/latest.sql.gz"
            return 0
        else
            log_message "ERROR: Database backup verification failed"
            rm -f "$compressed_file"
            return 1
        fi
    else
        log_message "ERROR: Database backup failed"
        return 1
    fi
}

# Application backup function
backup_application() {
    local backup_file="$BACKUP_DIR/application/terrafusion_app_$TIMESTAMP.tar.gz"
    
    log_message "Starting application backup..."
    
    # Create application backup excluding logs and temp files
    if tar -czf "$backup_file" \
        -C "$INSTALL_DIR" \
        --exclude="logs/*" \
        --exclude="temp/*" \
        --exclude="*.log" \
        . 2>/dev/null; then
        
        local size=$(du -h "$backup_file" | cut -f1)
        log_message "Application backup completed: $backup_file ($size)"
        
        # Create latest symlink
        ln -sf "$(basename "$backup_file")" "$BACKUP_DIR/application/latest.tar.gz"
        return 0
    else
        log_message "ERROR: Application backup failed"
        return 1
    fi
}

# Configuration backup function
backup_configuration() {
    local backup_file="$BACKUP_DIR/config/terrafusion_config_$TIMESTAMP.tar.gz"
    
    log_message "Starting configuration backup..."
    
    # Backup system configuration files
    if tar -czf "$backup_file" \
        /etc/systemd/system/terrafusion*.service \
        /etc/systemd/system/terrafusion*.timer \
        /etc/logrotate.d/terrafusion \
        /etc/rsyslog.d/50-terrafusion.conf \
        /usr/local/bin/terrafusion-*.sh \
        "$INSTALL_DIR/config/" \
        2>/dev/null; then
        
        local size=$(du -h "$backup_file" | cut -f1)
        log_message "Configuration backup completed: $backup_file ($size)"
        
        # Create latest symlink
        ln -sf "$(basename "$backup_file")" "$BACKUP_DIR/config/latest.tar.gz"
        return 0
    else
        log_message "ERROR: Configuration backup failed"
        return 1
    fi
}

# Log backup function
backup_logs() {
    local backup_file="$BACKUP_DIR/logs/terrafusion_logs_$TIMESTAMP.tar.gz"
    
    log_message "Starting log backup..."
    
    # Backup recent logs (last 7 days)
    if find "$LOG_DIR" -name "*.log" -mtime -7 -print0 | \
        tar -czf "$backup_file" --null -T - 2>/dev/null; then
        
        local size=$(du -h "$backup_file" | cut -f1)
        log_message "Log backup completed: $backup_file ($size)"
        return 0
    else
        log_message "ERROR: Log backup failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_backups() {
    log_message "Cleaning up old backups..."
    
    # Daily backups - keep 30 days
    find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
    find "$BACKUP_DIR/application" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    find "$BACKUP_DIR/logs" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    # Archive old backups
    local archive_date=$(date -d '30 days ago' +%Y%m%d)
    
    # Move monthly backups to archive
    if [[ $(date +%d) == "01" ]]; then
        local monthly_dir="$BACKUP_DIR/archive/monthly/$(date +%Y%m)"
        mkdir -p "$monthly_dir"
        
        # Copy latest backups to monthly archive
        cp "$BACKUP_DIR/database/latest.sql.gz" "$monthly_dir/" 2>/dev/null || true
        cp "$BACKUP_DIR/application/latest.tar.gz" "$monthly_dir/" 2>/dev/null || true
        cp "$BACKUP_DIR/config/latest.tar.gz" "$monthly_dir/" 2>/dev/null || true
        
        log_message "Monthly archive created: $monthly_dir"
    fi
    
    # Clean old monthly archives (keep 12 months)
    find "$BACKUP_DIR/archive/monthly" -type d -mtime +365 -exec rm -rf {} + 2>/dev/null || true
    
    log_message "Backup cleanup completed"
}

# Verify backup integrity
verify_backups() {
    log_message "Verifying backup integrity..."
    
    local errors=0
    
    # Verify database backup
    if [[ -f "$BACKUP_DIR/database/latest.sql.gz" ]]; then
        if ! gunzip -t "$BACKUP_DIR/database/latest.sql.gz" 2>/dev/null; then
            log_message "ERROR: Database backup integrity check failed"
            ((errors++))
        fi
    fi
    
    # Verify application backup
    if [[ -f "$BACKUP_DIR/application/latest.tar.gz" ]]; then
        if ! tar -tzf "$BACKUP_DIR/application/latest.tar.gz" >/dev/null 2>&1; then
            log_message "ERROR: Application backup integrity check failed"
            ((errors++))
        fi
    fi
    
    # Verify configuration backup
    if [[ -f "$BACKUP_DIR/config/latest.tar.gz" ]]; then
        if ! tar -tzf "$BACKUP_DIR/config/latest.tar.gz" >/dev/null 2>&1; then
            log_message "ERROR: Configuration backup integrity check failed"
            ((errors++))
        fi
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_message "All backup integrity checks passed"
        return 0
    else
        log_message "Backup integrity verification failed with $errors errors"
        return 1
    fi
}

# Main backup execution
main() {
    log_message "=== TerraFusion OS Backup Started ==="
    
    local start_time=$(date +%s)
    local success=0
    
    # Execute backup functions
    backup_database || ((success++))
    backup_application || ((success++))
    backup_configuration || ((success++))
    backup_logs || ((success++))
    
    # Cleanup old backups
    cleanup_backups
    
    # Verify backup integrity
    verify_backups || ((success++))
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $success -eq 0 ]]; then
        log_message "=== Backup completed successfully in ${duration}s ==="
        
        # Send success notification
        logger -p local0.info "TerraFusion backup completed successfully"
        
        # Update backup status file
        echo "$(date '+%Y-%m-%d %H:%M:%S') SUCCESS" > "$BACKUP_DIR/last_backup_status"
        
        exit 0
    else
        log_message "=== Backup completed with $success errors in ${duration}s ==="
        
        # Send failure notification
        logger -p local0.error "TerraFusion backup completed with errors"
        
        # Update backup status file
        echo "$(date '+%Y-%m-%d %H:%M:%S') FAILED" > "$BACKUP_DIR/last_backup_status"
        
        exit 1
    fi
}

# Execute main function
main "$@"
EOF

sudo chmod +x /usr/local/bin/terrafusion-backup.sh

# Create restore script
echo "Creating restore script..."
sudo tee /usr/local/bin/terrafusion-restore.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Disaster Recovery Restore Script
# Restores from backup with verification

set -euo pipefail

BACKUP_DIR="/var/backups/terrafusion"
DB_NAME="terrafusion_benton"
INSTALL_DIR="/opt/terrafusion"
RESTORE_LOG="$BACKUP_DIR/restore.log"

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$RESTORE_LOG"
}

# Usage function
usage() {
    echo "Usage: $0 [database|application|config|full] [backup_file]"
    echo ""
    echo "Options:"
    echo "  database     - Restore database only"
    echo "  application  - Restore application files only"
    echo "  config       - Restore configuration only"
    echo "  full         - Restore everything from latest backups"
    echo ""
    echo "Examples:"
    echo "  $0 full"
    echo "  $0 database /var/backups/terrafusion/database/terrafusion_db_20240101_120000.sql.gz"
    echo "  $0 application /var/backups/terrafusion/application/terrafusion_app_20240101_120000.tar.gz"
    exit 1
}

# Database restore function
restore_database() {
    local backup_file="${1:-$BACKUP_DIR/database/latest.sql.gz}"
    
    if [[ ! -f "$backup_file" ]]; then
        log_message "ERROR: Database backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Starting database restore from: $backup_file"
    
    # Stop API service
    sudo systemctl stop terrafusion-api || true
    
    # Create backup of current database
    local current_backup="$BACKUP_DIR/database/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    sudo -u postgres pg_dump "$DB_NAME" | gzip > "$current_backup"
    log_message "Current database backed up to: $current_backup"
    
    # Drop and recreate database
    sudo -u postgres dropdb "$DB_NAME" || true
    sudo -u postgres createdb "$DB_NAME" -O terrafusion_db
    
    # Restore from backup
    if gunzip -c "$backup_file" | sudo -u postgres psql "$DB_NAME" >/dev/null 2>&1; then
        log_message "Database restore completed successfully"
        
        # Start API service
        sudo systemctl start terrafusion-api
        
        return 0
    else
        log_message "ERROR: Database restore failed"
        
        # Attempt to restore from current backup
        log_message "Attempting to restore from current backup..."
        gunzip -c "$current_backup" | sudo -u postgres psql "$DB_NAME" >/dev/null 2>&1
        
        sudo systemctl start terrafusion-api
        return 1
    fi
}

# Application restore function
restore_application() {
    local backup_file="${1:-$BACKUP_DIR/application/latest.tar.gz}"
    
    if [[ ! -f "$backup_file" ]]; then
        log_message "ERROR: Application backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Starting application restore from: $backup_file"
    
    # Stop services
    sudo systemctl stop terrafusion-frontend || true
    sudo systemctl stop terrafusion-api || true
    
    # Create backup of current installation
    local current_backup="$BACKUP_DIR/application/pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$current_backup" -C "$INSTALL_DIR" . 2>/dev/null
    log_message "Current application backed up to: $current_backup"
    
    # Clear installation directory (except config)
    find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name "config" -exec rm -rf {} +
    
    # Restore from backup
    if tar -xzf "$backup_file" -C "$INSTALL_DIR" 2>/dev/null; then
        # Fix permissions
        sudo chown -R terrafusion:terrafusion "$INSTALL_DIR"
        sudo chmod +x "$INSTALL_DIR/api/TerraFusion.API" 2>/dev/null || true
        
        log_message "Application restore completed successfully"
        
        # Start services
        sudo systemctl start terrafusion-api
        sudo systemctl start terrafusion-frontend
        
        return 0
    else
        log_message "ERROR: Application restore failed"
        
        # Attempt to restore from current backup
        log_message "Attempting to restore from current backup..."
        tar -xzf "$current_backup" -C "$INSTALL_DIR" 2>/dev/null
        sudo chown -R terrafusion:terrafusion "$INSTALL_DIR"
        
        sudo systemctl start terrafusion-api
        sudo systemctl start terrafusion-frontend
        
        return 1
    fi
}

# Configuration restore function
restore_configuration() {
    local backup_file="${1:-$BACKUP_DIR/config/latest.tar.gz}"
    
    if [[ ! -f "$backup_file" ]]; then
        log_message "ERROR: Configuration backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Starting configuration restore from: $backup_file"
    
    # Extract configuration files
    if tar -xzf "$backup_file" -C / 2>/dev/null; then
        # Reload systemd
        sudo systemctl daemon-reload
        
        # Restart rsyslog
        sudo systemctl restart rsyslog
        
        log_message "Configuration restore completed successfully"
        return 0
    else
        log_message "ERROR: Configuration restore failed"
        return 1
    fi
}

# Full restore function
restore_full() {
    log_message "=== Starting full system restore ==="
    
    local errors=0
    
    restore_configuration || ((errors++))
    restore_application || ((errors++))
    restore_database || ((errors++))
    
    if [[ $errors -eq 0 ]]; then
        log_message "=== Full restore completed successfully ==="
        return 0
    else
        log_message "=== Full restore completed with $errors errors ==="
        return 1
    fi
}

# Main execution
case "${1:-}" in
    database)
        restore_database "${2:-}"
        ;;
    application)
        restore_application "${2:-}"
        ;;
    config)
        restore_configuration "${2:-}"
        ;;
    full)
        restore_full
        ;;
    *)
        usage
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/terrafusion-restore.sh

# Create backup monitoring script
echo "Creating backup monitoring script..."
sudo tee /usr/local/bin/terrafusion-backup-monitor.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Backup Monitoring Script
# Checks backup health and sends alerts

BACKUP_DIR="/var/backups/terrafusion"
ALERT_EMAIL="admin@bentoncounty.gov"
MAX_AGE_HOURS=25  # Alert if backup is older than 25 hours

# Check if latest backup exists and is recent
check_backup_freshness() {
    local backup_file="$BACKUP_DIR/database/latest.sql.gz"
    
    if [[ ! -f "$backup_file" ]]; then
        echo "CRITICAL: No database backup found"
        logger -p local0.crit "TerraFusion: No database backup found"
        return 1
    fi
    
    local backup_age=$(( ($(date +%s) - $(stat -c %Y "$backup_file")) / 3600 ))
    
    if [[ $backup_age -gt $MAX_AGE_HOURS ]]; then
        echo "WARNING: Database backup is ${backup_age} hours old (threshold: ${MAX_AGE_HOURS}h)"
        logger -p local0.warn "TerraFusion: Database backup is ${backup_age} hours old"
        return 1
    fi
    
    echo "OK: Database backup is ${backup_age} hours old"
    return 0
}

# Check backup integrity
check_backup_integrity() {
    local backup_file="$BACKUP_DIR/database/latest.sql.gz"
    
    if ! gunzip -t "$backup_file" 2>/dev/null; then
        echo "CRITICAL: Database backup integrity check failed"
        logger -p local0.crit "TerraFusion: Database backup integrity check failed"
        return 1
    fi
    
    echo "OK: Database backup integrity verified"
    return 0
}

# Check backup disk usage
check_backup_disk_usage() {
    local usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $usage -gt 90 ]]; then
        echo "CRITICAL: Backup disk usage is ${usage}% (threshold: 90%)"
        logger -p local0.crit "TerraFusion: Backup disk usage critical: ${usage}%"
        return 1
    elif [[ $usage -gt 80 ]]; then
        echo "WARNING: Backup disk usage is ${usage}% (threshold: 80%)"
        logger -p local0.warn "TerraFusion: Backup disk usage warning: ${usage}%"
        return 1
    fi
    
    echo "OK: Backup disk usage is ${usage}%"
    return 0
}

# Main monitoring execution
echo "=== TerraFusion Backup Health Check - $(date) ==="

errors=0
check_backup_freshness || ((errors++))
check_backup_integrity || ((errors++))
check_backup_disk_usage || ((errors++))

if [[ $errors -eq 0 ]]; then
    echo "=== All backup health checks passed ==="
    exit 0
else
    echo "=== Backup health check failed with $errors errors ==="
    exit 1
fi
EOF

sudo chmod +x /usr/local/bin/terrafusion-backup-monitor.sh

# Create backup status web endpoint script
echo "Creating backup status script..."
sudo tee /usr/local/bin/terrafusion-backup-status.sh > /dev/null << 'EOF'
#!/bin/bash

# TerraFusion OS Backup Status Reporter
# Generates JSON status for monitoring dashboard

BACKUP_DIR="/var/backups/terrafusion"

# Generate JSON status
cat << EOF
{
  "timestamp": "$(date -Iseconds)",
  "county": "benton",
  "backups": {
    "database": {
      "latest": "$(readlink -f "$BACKUP_DIR/database/latest.sql.gz" 2>/dev/null || echo "none")",
      "size": "$(du -h "$BACKUP_DIR/database/latest.sql.gz" 2>/dev/null | cut -f1 || echo "0")",
      "age_hours": $(( ($(date +%s) - $(stat -c %Y "$BACKUP_DIR/database/latest.sql.gz" 2>/dev/null || echo 0)) / 3600 )),
      "count": $(find "$BACKUP_DIR/database" -name "*.sql.gz" 2>/dev/null | wc -l)
    },
    "application": {
      "latest": "$(readlink -f "$BACKUP_DIR/application/latest.tar.gz" 2>/dev/null || echo "none")",
      "size": "$(du -h "$BACKUP_DIR/application/latest.tar.gz" 2>/dev/null | cut -f1 || echo "0")",
      "age_hours": $(( ($(date +%s) - $(stat -c %Y "$BACKUP_DIR/application/latest.tar.gz" 2>/dev/null || echo 0)) / 3600 )),
      "count": $(find "$BACKUP_DIR/application" -name "*.tar.gz" 2>/dev/null | wc -l)
    },
    "configuration": {
      "latest": "$(readlink -f "$BACKUP_DIR/config/latest.tar.gz" 2>/dev/null || echo "none")",
      "size": "$(du -h "$BACKUP_DIR/config/latest.tar.gz" 2>/dev/null | cut -f1 || echo "0")",
      "age_hours": $(( ($(date +%s) - $(stat -c %Y "$BACKUP_DIR/config/latest.tar.gz" 2>/dev/null || echo 0)) / 3600 )),
      "count": $(find "$BACKUP_DIR/config" -name "*.tar.gz" 2>/dev/null | wc -l)
    }
  },
  "storage": {
    "total": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $2}')",
    "used": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $3}')",
    "available": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')",
    "usage_percent": $(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
  },
  "last_backup_status": "$(cat "$BACKUP_DIR/last_backup_status" 2>/dev/null || echo "unknown")"
}
EOF
EOF

sudo chmod +x /usr/local/bin/terrafusion-backup-status.sh

# Create backup monitoring cron job
echo "Setting up backup monitoring cron job..."
sudo tee /etc/cron.d/terrafusion-backup-monitor > /dev/null << 'EOF'
# TerraFusion OS Backup Monitoring
# Runs backup health checks every hour
0 * * * * terrafusion /usr/local/bin/terrafusion-backup-monitor.sh >> /var/log/terrafusion/backup-monitor.log 2>&1
EOF

# Set initial permissions
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$BACKUP_DIR"
sudo chmod -R 750 "$BACKUP_DIR"

# Create initial backup status file
sudo -u "$SERVICE_USER" touch "$BACKUP_DIR/last_backup_status"
echo "$(date '+%Y-%m-%d %H:%M:%S') INITIAL" | sudo -u "$SERVICE_USER" tee "$BACKUP_DIR/last_backup_status" > /dev/null

echo ""
echo "✅ Backup and disaster recovery system setup completed successfully!"
echo ""
echo "Backup directories created:"
echo "  - Database backups: $BACKUP_DIR/database/"
echo "  - Application backups: $BACKUP_DIR/application/"
echo "  - Configuration backups: $BACKUP_DIR/config/"
echo "  - Log backups: $BACKUP_DIR/logs/"
echo "  - Archives: $BACKUP_DIR/archive/"
echo ""
echo "Scripts installed:"
echo "  - Backup: /usr/local/bin/terrafusion-backup.sh"
echo "  - Restore: /usr/local/bin/terrafusion-restore.sh"
echo "  - Monitor: /usr/local/bin/terrafusion-backup-monitor.sh"
echo "  - Status: /usr/local/bin/terrafusion-backup-status.sh"
echo ""
echo "Automated scheduling:"
echo "  - Daily backups via systemd timer (terrafusion-backup.timer)"
echo "  - Hourly health checks via cron"
echo ""
echo "Management commands:"
echo "  - Manual backup: sudo /usr/local/bin/terrafusion-backup.sh"
echo "  - Full restore: sudo /usr/local/bin/terrafusion-restore.sh full"
echo "  - Database restore: sudo /usr/local/bin/terrafusion-restore.sh database"
echo "  - Check status: /usr/local/bin/terrafusion-backup-status.sh"
echo ""
echo "Retention policy:"
echo "  - Daily backups: $RETENTION_DAYS days"
echo "  - Monthly archives: $RETENTION_MONTHS months"
