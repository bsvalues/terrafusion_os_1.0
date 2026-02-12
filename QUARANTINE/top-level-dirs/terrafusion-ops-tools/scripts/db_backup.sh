#!/bin/bash
#
# TerraFusion Database Backup Script
# This script performs automated PostgreSQL backups with rotation and optional cloud upload
#
# Usage: ./db_backup.sh [options]
# Options:
#   -f    Force backup even if recent backup exists
#   -u    Upload to cloud storage (S3/GCS)
#   -c    Cleanup old backups based on retention policy
#   -t    Test restore (verify backup integrity)

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/terrafusion"
DB_NAME="terrafusion_production"
DB_USER="terrafusion_user"
DB_HOST="localhost"
DB_PORT="5432"
RETENTION_DAYS=30
RETENTION_WEEKLY=12  # Keep 12 weekly backups
RETENTION_MONTHLY=12 # Keep 12 monthly backups
S3_BUCKET="s3://terrafusion-backups"
LOG_FILE="/var/log/terrafusion/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_STR=$(date +"%Y-%m-%d")

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,temp}
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check prerequisites
check_requirements() {
    log "Checking requirements..."
    
    # Check if PostgreSQL client is installed
    if ! command -v pg_dump &> /dev/null; then
        error_exit "pg_dump not found. Please install PostgreSQL client."
    fi
    
    # Check if database is accessible
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
        error_exit "Cannot connect to database. Check credentials and connectivity."
    fi
    
    # Check disk space (require at least 10GB free)
    available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 10485760 ]; then
        error_exit "Insufficient disk space. At least 10GB required."
    fi
    
    log "Requirements check passed."
}

# Perform database backup
perform_backup() {
    local backup_file="$BACKUP_DIR/daily/${DB_NAME}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log "Starting backup of $DB_NAME..."
    
    # Get database size for estimation
    db_size=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    log "Database size: $db_size"
    
    # Perform backup with progress
    PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        --create \
        --clean \
        2>&1 | tee -a "$LOG_FILE" > "$backup_file"
    
    if [ "${PIPESTATUS[0]}" -ne 0 ]; then
        rm -f "$backup_file"
        error_exit "Backup failed. Check log for details."
    fi
    
    # Compress backup
    log "Compressing backup..."
    gzip -9 "$backup_file"
    
    # Calculate checksums
    local checksum=$(sha256sum "$compressed_file" | awk '{print $1}')
    echo "$checksum  $(basename "$compressed_file")" > "${compressed_file}.sha256"
    
    # Verify compressed file
    if ! gzip -t "$compressed_file"; then
        error_exit "Compressed backup file is corrupted."
    fi
    
    local final_size=$(du -h "$compressed_file" | cut -f1)
    log "Backup completed successfully. Size: $final_size"
    log "Checksum: $checksum"
    
    echo "$compressed_file"
}

# Copy to weekly/monthly if needed
archive_backup() {
    local backup_file="$1"
    local day_of_week=$(date +%u)
    local day_of_month=$(date +%d)
    
    # Weekly backup (every Sunday)
    if [ "$day_of_week" -eq 7 ]; then
        log "Creating weekly backup..."
        cp "$backup_file" "$BACKUP_DIR/weekly/"
        cp "${backup_file}.sha256" "$BACKUP_DIR/weekly/"
    fi
    
    # Monthly backup (1st of each month)
    if [ "$day_of_month" -eq 1 ]; then
        log "Creating monthly backup..."
        cp "$backup_file" "$BACKUP_DIR/monthly/"
        cp "${backup_file}.sha256" "$BACKUP_DIR/monthly/"
    fi
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    
    if ! command -v aws &> /dev/null; then
        log "WARNING: AWS CLI not installed. Skipping cloud upload."
        return
    fi
    
    log "Uploading to S3..."
    
    # Upload with server-side encryption
    aws s3 cp "$backup_file" "$S3_BUCKET/daily/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --metadata "backup-date=$DATE_STR,hostname=$(hostname)" \
        || log "WARNING: S3 upload failed"
    
    # Upload checksum
    aws s3 cp "${backup_file}.sha256" "$S3_BUCKET/daily/" \
        || log "WARNING: Checksum upload failed"
    
    # Upload to glacier for long-term storage (monthly backups)
    if [[ $(date +%d) -eq 1 ]]; then
        aws s3 cp "$backup_file" "$S3_BUCKET/glacier/" \
            --storage-class GLACIER \
            --server-side-encryption AES256 \
            || log "WARNING: Glacier upload failed"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Clean daily backups older than RETENTION_DAYS
    find "$BACKUP_DIR/daily" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/daily" -name "*.sha256" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean weekly backups older than RETENTION_WEEKLY weeks
    find "$BACKUP_DIR/weekly" -name "*.sql.gz" -type f -mtime +$((RETENTION_WEEKLY * 7)) -delete
    find "$BACKUP_DIR/weekly" -name "*.sha256" -type f -mtime +$((RETENTION_WEEKLY * 7)) -delete
    
    # Clean monthly backups older than RETENTION_MONTHLY months  
    find "$BACKUP_DIR/monthly" -name "*.sql.gz" -type f -mtime +$((RETENTION_MONTHLY * 30)) -delete
    find "$BACKUP_DIR/monthly" -name "*.sha256" -type f -mtime +$((RETENTION_MONTHLY * 30)) -delete
    
    # Clean S3 if available
    if command -v aws &> /dev/null && [ "$UPLOAD" = true ]; then
        log "Cleaning S3 backups..."
        # Delete daily backups older than 30 days
        aws s3 ls "$S3_BUCKET/daily/" | while read -r line; do
            create_date=$(echo "$line" | awk '{print $1" "$2}')
            create_date_seconds=$(date -d "$create_date" +%s)
            older_than_seconds=$(date -d "$RETENTION_DAYS days ago" +%s)
            if [ "$create_date_seconds" -lt "$older_than_seconds" ]; then
                file_name=$(echo "$line" | awk '{print $4}')
                aws s3 rm "$S3_BUCKET/daily/$file_name"
            fi
        done
    fi
    
    log "Cleanup completed."
}

# Test restore (verify backup integrity)
test_restore() {
    local backup_file="$1"
    local test_db="${DB_NAME}_test_restore"
    
    log "Testing restore of $backup_file..."
    
    # Create test database
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U postgres -c "DROP DATABASE IF EXISTS $test_db;"
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U postgres -c "CREATE DATABASE $test_db;"
    
    # Restore backup to test database
    if zcat "$backup_file" | PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$test_db" &> /dev/null; then
        log "Restore test passed."
        
        # Verify table count
        table_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        log "Restored database has $table_count tables."
        
        # Clean up test database
        PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U postgres -c "DROP DATABASE $test_db;"
    else
        error_exit "Restore test failed. Backup may be corrupted."
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Email notification (requires mail/sendmail configured)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "TerraFusion Backup $status" ops-team@terrafusion.com
    fi
    
    # Slack notification (requires webhook URL)
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"TerraFusion Backup $status: $message\"}" \
            "$SLACK_WEBHOOK" &> /dev/null
    fi
}

# Main execution
main() {
    local FORCE=false
    local UPLOAD=false
    local CLEANUP=false
    local TEST=false
    
    # Parse arguments
    while getopts "fuct" opt; do
        case $opt in
            f) FORCE=true ;;
            u) UPLOAD=true ;;
            c) CLEANUP=true ;;
            t) TEST=true ;;
            *) echo "Usage: $0 [-f] [-u] [-c] [-t]"; exit 1 ;;
        esac
    done
    
    log "=== TerraFusion Database Backup Started ==="
    
    # Check if recent backup exists (unless forced)
    if [ "$FORCE" = false ]; then
        recent_backup=$(find "$BACKUP_DIR/daily" -name "${DB_NAME}_*.sql.gz" -mtime -1 -type f | head -1)
        if [ -n "$recent_backup" ]; then
            log "Recent backup found: $recent_backup. Skipping. Use -f to force."
            exit 0
        fi
    fi
    
    # Check requirements
    check_requirements
    
    # Perform backup
    backup_file=$(perform_backup)
    
    # Archive if needed
    archive_backup "$backup_file"
    
    # Upload to cloud if requested
    if [ "$UPLOAD" = true ]; then
        upload_to_cloud "$backup_file"
    fi
    
    # Test restore if requested
    if [ "$TEST" = true ]; then
        test_restore "$backup_file"
    fi
    
    # Cleanup old backups if requested
    if [ "$CLEANUP" = true ]; then
        cleanup_old_backups
    fi
    
    # Send success notification
    send_notification "SUCCESS" "Backup completed: $(basename "$backup_file")"
    
    log "=== Backup completed successfully ==="
}

# Trap errors
trap 'error_exit "Script failed at line $LINENO"' ERR

# Run main function
main "$@"