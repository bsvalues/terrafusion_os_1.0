#!/bin/bash
#
# TerraFusion Database Restore Script
# Companion script to db_backup.sh for restoring PostgreSQL backups
#
# Usage: ./db_restore.sh [options] <backup_file>
# Options:
#   -l    List available backups
#   -d    Download from S3 before restore
#   -t    Test mode (restore to test database)
#   -y    Skip confirmation prompt

set -euo pipefail

# Configuration (should match db_backup.sh)
BACKUP_DIR="/var/backups/terrafusion"
DB_NAME="terrafusion_production"
DB_USER="terrafusion_user"
DB_HOST="localhost"
DB_PORT="5432"
S3_BUCKET="s3://terrafusion-backups"
LOG_FILE="/var/log/terrafusion/restore.log"

# Create log directory
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

# List available backups
list_backups() {
    echo "=== Local Backups ==="
    echo "Daily backups:"
    ls -lh "$BACKUP_DIR/daily/"*.sql.gz 2>/dev/null | tail -10 || echo "  No daily backups found"
    
    echo -e "\nWeekly backups:"
    ls -lh "$BACKUP_DIR/weekly/"*.sql.gz 2>/dev/null | tail -5 || echo "  No weekly backups found"
    
    echo -e "\nMonthly backups:"
    ls -lh "$BACKUP_DIR/monthly/"*.sql.gz 2>/dev/null | tail -5 || echo "  No monthly backups found"
    
    if command -v aws &> /dev/null; then
        echo -e "\n=== S3 Backups ==="
        echo "Recent daily backups:"
        aws s3 ls "$S3_BUCKET/daily/" | tail -10 || echo "  No S3 backups found"
    fi
}

# Download from S3
download_from_s3() {
    local s3_path="$1"
    local local_file="$BACKUP_DIR/temp/$(basename "$s3_path")"
    
    log "Downloading backup from S3..."
    mkdir -p "$BACKUP_DIR/temp"
    
    if aws s3 cp "$s3_path" "$local_file"; then
        # Also download checksum if available
        aws s3 cp "${s3_path}.sha256" "${local_file}.sha256" 2>/dev/null || true
        echo "$local_file"
    else
        error_exit "Failed to download backup from S3"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity..."
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    # Verify gzip integrity
    if ! gzip -t "$backup_file"; then
        error_exit "Backup file is corrupted"
    fi
    
    # Check checksum if available
    if [ -f "${backup_file}.sha256" ]; then
        log "Verifying checksum..."
        if ! sha256sum -c "${backup_file}.sha256"; then
            error_exit "Checksum verification failed"
        fi
    fi
    
    log "Backup verification passed"
}

# Stop application services
stop_services() {
    log "Stopping application services..."
    
    services=("terrafusion-backend" "terrafusion-ai" "terrafusion-worker")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            sudo systemctl stop "$service"
            log "Stopped $service"
        fi
    done
    
    # Wait for connections to close
    sleep 5
}

# Start application services
start_services() {
    log "Starting application services..."
    
    services=("terrafusion-backend" "terrafusion-ai" "terrafusion-worker")
    for service in "${services[@]}"; do
        sudo systemctl start "$service"
        log "Started $service"
    done
    
    # Wait for services to be ready
    sleep 10
    
    # Verify services are running
    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            log "WARNING: $service failed to start"
        fi
    done
}

# Perform restore
perform_restore() {
    local backup_file="$1"
    local target_db="$2"
    
    log "Starting restore of $backup_file to $target_db..."
    
    # Create database if it doesn't exist
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$target_db'" | grep -q 1 || {
        log "Creating database $target_db..."
        PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U postgres -c "CREATE DATABASE $target_db OWNER $DB_USER;"
    }
    
    # Get backup size for progress estimation
    backup_size=$(du -h "$backup_file" | cut -f1)
    log "Backup file size: $backup_size"
    
    # Restore backup
    log "Restoring database (this may take several minutes)..."
    if zcat "$backup_file" | PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$target_db" -v ON_ERROR_STOP=1; then
        log "Restore completed successfully"
    else
        error_exit "Restore failed. Database may be in inconsistent state."
    fi
    
    # Run ANALYZE to update statistics
    log "Updating database statistics..."
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$target_db" -c "ANALYZE;"
    
    # Verify restore
    table_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$target_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    log "Restored database contains $table_count tables"
    
    # Check for critical tables
    critical_tables=("users" "projects" "costs" "audit_logs")
    for table in "${critical_tables[@]}"; do
        if PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$target_db" -c "SELECT 1 FROM $table LIMIT 1;" &>/dev/null; then
            row_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$target_db" -t -c "SELECT COUNT(*) FROM $table;")
            log "Table $table: $row_count rows"
        else
            log "WARNING: Critical table $table not found or empty"
        fi
    done
}

# Main execution
main() {
    local LIST=false
    local DOWNLOAD=false
    local TEST_MODE=false
    local SKIP_CONFIRM=false
    local backup_file=""
    
    # Parse arguments
    while getopts "ldty" opt; do
        case $opt in
            l) LIST=true ;;
            d) DOWNLOAD=true ;;
            t) TEST_MODE=true ;;
            y) SKIP_CONFIRM=true ;;
            *) echo "Usage: $0 [-l] [-d] [-t] [-y] [backup_file]"; exit 1 ;;
        esac
    done
    shift $((OPTIND-1))
    
    # List backups if requested
    if [ "$LIST" = true ]; then
        list_backups
        exit 0
    fi
    
    # Get backup file
    if [ $# -eq 0 ]; then
        echo "Error: No backup file specified"
        echo "Usage: $0 [options] <backup_file>"
        echo "Use -l to list available backups"
        exit 1
    fi
    
    backup_file="$1"
    
    log "=== TerraFusion Database Restore Started ==="
    
    # Download from S3 if requested
    if [ "$DOWNLOAD" = true ]; then
        backup_file=$(download_from_s3 "$backup_file")
    fi
    
    # Verify backup
    verify_backup "$backup_file"
    
    # Determine target database
    local target_db="$DB_NAME"
    if [ "$TEST_MODE" = true ]; then
        target_db="${DB_NAME}_test_restore"
        log "TEST MODE: Restoring to $target_db"
    fi
    
    # Show restore plan
    echo -e "\n=== Restore Plan ==="
    echo "Backup file: $backup_file"
    echo "Target database: $target_db"
    echo "Backup date: $(basename "$backup_file" | grep -oP '\d{8}_\d{6}')"
    
    if [ "$TEST_MODE" = false ]; then
        echo -e "\nWARNING: This will REPLACE ALL DATA in $target_db!"
        echo "Current data will be permanently lost unless backed up."
    fi
    
    # Confirm unless skipped
    if [ "$SKIP_CONFIRM" = false ]; then
        echo -e "\nDo you want to continue? (yes/no)"
        read -r response
        if [ "$response" != "yes" ]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
    
    # Create backup of current database before restore (unless test mode)
    if [ "$TEST_MODE" = false ]; then
        log "Creating backup of current database..."
        current_backup="$BACKUP_DIR/temp/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
        mkdir -p "$BACKUP_DIR/temp"
        PGPASSWORD="${PGPASSWORD:-}" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$target_db" | gzip -9 > "$current_backup"
        log "Current database backed up to: $current_backup"
    fi
    
    # Stop services (unless test mode)
    if [ "$TEST_MODE" = false ]; then
        stop_services
    fi
    
    # Perform restore
    perform_restore "$backup_file" "$target_db"
    
    # Start services (unless test mode)
    if [ "$TEST_MODE" = false ]; then
        start_services
        
        # Verify application health
        log "Verifying application health..."
        sleep 5
        if curl -f http://localhost:8080/health &>/dev/null; then
            log "Application health check passed"
        else
            log "WARNING: Application health check failed"
        fi
    fi
    
    log "=== Restore completed successfully ==="
    
    if [ "$TEST_MODE" = true ]; then
        echo -e "\nTest restore completed. Test database: $target_db"
        echo "To remove test database: psql -U postgres -c 'DROP DATABASE $target_db;'"
    fi
}

# Trap errors
trap 'error_exit "Script failed at line $LINENO"' ERR

# Run main function
main "$@"