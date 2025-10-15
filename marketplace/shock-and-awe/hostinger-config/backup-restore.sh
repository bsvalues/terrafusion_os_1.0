#!/bin/bash

#################################################################################
# TerraFusion Market - Backup and Restore System for Hostinger
# Automated backup, restore, and maintenance procedures
#################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="terrafusionmarket.io"
FTP_HOST="files.000webhost.com"
REMOTE_PATH="/public_html"
BACKUP_DIR="./backups"
LOG_FILE="./backup-$(date +%Y%m%d_%H%M%S).log"
RETENTION_DAYS=30

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

echo -e "${BLUE}"
cat << 'EOF'
████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
   ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

                           BACKUP & RESTORE SYSTEM
                              Production Maintenance v1.0
EOF
echo -e "${NC}"

load_environment() {
    log "Loading environment configuration..."
    
    if [[ -f ".env.production" ]]; then
        source .env.production
        log "Production environment loaded"
    elif [[ -f "hostinger-config/.env.production" ]]; then
        source hostinger-config/.env.production
        log "Hostinger environment loaded"
    else
        warning "Environment file not found. Using defaults."
    fi
    
    # Prompt for FTP credentials if not set
    if [[ -z "${FTP_USER:-}" ]]; then
        read -p "Enter FTP username: " FTP_USER
    fi
    
    if [[ -z "${FTP_PASS:-}" ]]; then
        read -s -p "Enter FTP password: " FTP_PASS
        echo
    fi
}

create_full_backup() {
    log "Creating full site backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    local backup_name="terrafusion-full-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Download all files from server
    log "Downloading files from server..."
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
set cmd:fail-exit yes
mirror --delete --verbose $REMOTE_PATH $backup_path/website
quit
EOF
    
    # Backup database (if credentials available)
    if [[ -n "${DB_HOST:-}" ]] && [[ -n "${DB_USER:-}" ]] && [[ -n "${DB_PASS:-}" ]] && [[ -n "${DB_NAME:-}" ]]; then
        log "Creating database backup..."
        mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$backup_path/database.sql" || warning "Database backup failed"
    else
        warning "Database credentials not available. Skipping database backup."
    fi
    
    # Create backup metadata
    cat > "$backup_path/backup-info.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "domain": "$DOMAIN",
    "type": "full",
    "files_count": $(find "$backup_path/website" -type f | wc -l),
    "backup_size": "$(du -sh "$backup_path" | cut -f1)",
    "environment": "production"
}
EOF
    
    # Compress backup
    log "Compressing backup..."
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    
    # Remove uncompressed backup
    rm -rf "$backup_path"
    
    # Verify backup
    if [[ -f "$backup_path.tar.gz" ]]; then
        log "Backup created successfully: $backup_name.tar.gz"
        log "Backup size: $(du -sh "$backup_path.tar.gz" | cut -f1)"
    else
        error "Backup creation failed"
    fi
}

create_incremental_backup() {
    log "Creating incremental backup..."
    
    local backup_name="terrafusion-incremental-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    local last_backup_file="$BACKUP_DIR/.last_backup"
    
    mkdir -p "$backup_path"
    
    # Get last backup timestamp
    local last_backup_time=""
    if [[ -f "$last_backup_file" ]]; then
        last_backup_time=$(cat "$last_backup_file")
        log "Last backup: $last_backup_time"
    else
        warning "No previous backup found. Creating full backup."
        create_full_backup
        return
    fi
    
    # Download only changed files
    log "Downloading changed files since $last_backup_time..."
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
mirror --delete --verbose --newer-than="$last_backup_time" $REMOTE_PATH $backup_path/website
quit
EOF
    
    # Create backup metadata
    cat > "$backup_path/backup-info.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "domain": "$DOMAIN",
    "type": "incremental",
    "since": "$last_backup_time",
    "files_count": $(find "$backup_path/website" -type f | wc -l),
    "backup_size": "$(du -sh "$backup_path" | cut -f1)"
}
EOF
    
    # Compress and cleanup
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"
    
    # Update last backup timestamp
    date -Iseconds > "$last_backup_file"
    
    log "Incremental backup created: $backup_name.tar.gz"
}

restore_from_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring from backup: $backup_file"
    
    # Extract backup
    local restore_dir="./restore-temp"
    mkdir -p "$restore_dir"
    
    tar -xzf "$backup_file" -C "$restore_dir"
    
    # Find extracted directory
    local extracted_dir=$(find "$restore_dir" -maxdepth 1 -type d -name "terrafusion-*" | head -1)
    
    if [[ -z "$extracted_dir" ]]; then
        error "Could not find extracted backup directory"
    fi
    
    # Restore website files
    if [[ -d "$extracted_dir/website" ]]; then
        log "Restoring website files..."
        
        # Upload to server
        lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
set cmd:fail-exit yes
mirror --reverse --delete --verbose $extracted_dir/website $REMOTE_PATH
quit
EOF
        
        log "Website files restored successfully"
    fi
    
    # Restore database
    if [[ -f "$extracted_dir/database.sql" ]]; then
        log "Database backup found. Manual restoration required."
        warning "Run the following command to restore database:"
        warning "mysql -h \$DB_HOST -u \$DB_USER -p \$DB_NAME < $extracted_dir/database.sql"
    fi
    
    # Cleanup
    rm -rf "$restore_dir"
    
    log "Restore completed successfully"
}

list_backups() {
    log "Available backups:"
    
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]]; then
        warning "No backups found"
        return
    fi
    
    echo -e "${BLUE}Backup Files:${NC}"
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
        echo "  $line"
    done
    
    echo -e "\n${BLUE}Total backup size:${NC}"
    du -sh "$BACKUP_DIR" 2>/dev/null || echo "  0B"
}

cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        warning "Backup directory does not exist"
        return
    fi
    
    local deleted_count=0
    
    # Find and delete old backups
    while IFS= read -r -d '' file; do
        if [[ -f "$file" ]]; then
            rm "$file"
            log "Deleted old backup: $(basename "$file")"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -eq 0 ]]; then
        log "No old backups to clean up"
    else
        log "Cleaned up $deleted_count old backup(s)"
    fi
}

verify_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Verifying backup: $backup_file"
    
    # Test archive integrity
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        log "✓ Archive integrity check passed"
    else
        error "✗ Archive is corrupted"
    fi
    
    # Check backup contents
    local temp_dir="./verify-temp"
    mkdir -p "$temp_dir"
    
    tar -xzf "$backup_file" -C "$temp_dir"
    
    local extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "terrafusion-*" | head -1)
    
    if [[ -d "$extracted_dir/website" ]]; then
        local file_count=$(find "$extracted_dir/website" -type f | wc -l)
        log "✓ Website files: $file_count files found"
        
        # Check for essential files
        local essential_files=("index.html" ".htaccess")
        for file in "${essential_files[@]}"; do
            if [[ -f "$extracted_dir/website/$file" ]]; then
                log "✓ Essential file found: $file"
            else
                warning "✗ Essential file missing: $file"
            fi
        done
    else
        warning "✗ Website files not found in backup"
    fi
    
    if [[ -f "$extracted_dir/database.sql" ]]; then
        log "✓ Database backup found"
    else
        warning "✗ Database backup not found"
    fi
    
    if [[ -f "$extracted_dir/backup-info.json" ]]; then
        log "✓ Backup metadata found"
        cat "$extracted_dir/backup-info.json"
    else
        warning "✗ Backup metadata missing"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log "Backup verification completed"
}

create_maintenance_mode() {
    log "Enabling maintenance mode..."
    
    # Upload maintenance page
    if [[ -f "hostinger-config/maintenance.html" ]]; then
        lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
put hostinger-config/maintenance.html $REMOTE_PATH/maintenance.html
quit
EOF
        
        # Redirect to maintenance page
        lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
put /dev/stdin $REMOTE_PATH/.htaccess-backup
quit
EOF < <(cat << 'HTACCESS'
# Maintenance mode redirect
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/maintenance.html$
RewriteCond %{REMOTE_ADDR} !^YOUR_IP_HERE$
RewriteRule ^(.*)$ /maintenance.html [R=503,L]
ErrorDocument 503 /maintenance.html
Header always set Retry-After "3600"
HTACCESS
)
        
        log "Maintenance mode enabled"
    else
        warning "Maintenance page not found"
    fi
}

disable_maintenance_mode() {
    log "Disabling maintenance mode..."
    
    # Restore original .htaccess
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
set ftp:ssl-allow no
get $REMOTE_PATH/.htaccess $REMOTE_PATH/.htaccess-maintenance
rm $REMOTE_PATH/maintenance.html
quit
EOF
    
    log "Maintenance mode disabled"
}

monitor_disk_usage() {
    log "Monitoring disk usage..."
    
    # Check local backup disk usage
    if [[ -d "$BACKUP_DIR" ]]; then
        local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        log "Local backup usage: $backup_size"
        
        # Warn if backup directory is large
        local backup_size_bytes=$(du -sb "$BACKUP_DIR" | cut -f1)
        local max_size=$((10 * 1024 * 1024 * 1024)) # 10GB
        
        if [[ $backup_size_bytes -gt $max_size ]]; then
            warning "Backup directory is large ($backup_size). Consider cleanup."
        fi
    fi
    
    # Check server disk usage (if possible)
    log "Checking server disk usage..."
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << 'EOF'
set ftp:ssl-allow no
du
quit
EOF
}

create_backup_schedule() {
    log "Creating backup schedule script..."
    
    cat > backup-schedule.sh << 'EOF'
#!/bin/bash
# TerraFusion Market Backup Schedule
# Add to crontab: 0 2 * * * /path/to/backup-schedule.sh

cd "$(dirname "$0")"

# Daily incremental backup
if [ "$(date +%w)" != "0" ]; then
    ./hostinger-config/backup-restore.sh --incremental
else
    # Weekly full backup on Sunday
    ./hostinger-config/backup-restore.sh --full
fi

# Cleanup old backups
./hostinger-config/backup-restore.sh --cleanup

# Monitor and alert if needed
./hostinger-config/backup-restore.sh --monitor
EOF

    chmod +x backup-schedule.sh
    log "Backup schedule script created"
}

show_help() {
    echo "TerraFusion Market Backup & Restore System"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --full                 Create full backup"
    echo "  --incremental          Create incremental backup"
    echo "  --restore FILE         Restore from backup file"
    echo "  --list                 List available backups"
    echo "  --verify FILE          Verify backup integrity"
    echo "  --cleanup              Remove old backups"
    echo "  --maintenance-on       Enable maintenance mode"
    echo "  --maintenance-off      Disable maintenance mode"
    echo "  --monitor              Monitor disk usage"
    echo "  --schedule             Create backup schedule"
    echo "  --help                 Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --full                                # Create full backup"
    echo "  $0 --restore backups/backup.tar.gz      # Restore from backup"
    echo "  $0 --verify backups/backup.tar.gz       # Verify backup"
}

main() {
    case "${1:-}" in
        --full)
            load_environment
            create_full_backup
            ;;
        --incremental)
            load_environment
            create_incremental_backup
            ;;
        --restore)
            if [[ -z "${2:-}" ]]; then
                error "Backup file required for restore"
            fi
            load_environment
            restore_from_backup "$2"
            ;;
        --list)
            list_backups
            ;;
        --verify)
            if [[ -z "${2:-}" ]]; then
                error "Backup file required for verification"
            fi
            verify_backup "$2"
            ;;
        --cleanup)
            cleanup_old_backups
            ;;
        --maintenance-on)
            load_environment
            create_maintenance_mode
            ;;
        --maintenance-off)
            load_environment
            disable_maintenance_mode
            ;;
        --monitor)
            monitor_disk_usage
            ;;
        --schedule)
            create_backup_schedule
            ;;
        --help|"")
            show_help
            ;;
        *)
            error "Unknown option: $1. Use --help for usage information."
            ;;
    esac
}

main "$@"