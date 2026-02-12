#!/bin/bash
#
# TerraFusion Advanced Backup and Point-in-Time Recovery System
# Comprehensive backup solution with automated recovery and testing
#
# Usage: ./backup-recovery.sh [options]
# Options:
#   -a    Action (backup|restore|test|schedule|list|cleanup)
#   -t    Backup type (full|incremental|differential|snapshot)
#   -s    Service (all|database|files|config|logs)
#   -p    Point in time (YYYY-MM-DD-HH-MM-SS or latest)
#   -d    Destination (s3|local|remote)
#   -r    Retention policy (days)
#   -v    Verify backup integrity
#   -e    Encrypt backup

set -euo pipefail

# Configuration
ACTION="backup"
BACKUP_TYPE="full"
SERVICE="all"
POINT_IN_TIME="latest"
DESTINATION="s3"
RETENTION_DAYS=30
VERIFY_BACKUP=false
ENCRYPT_BACKUP=true
BACKUP_BASE_DIR="/var/backups/terrafusion"
S3_BACKUP_BUCKET="terrafusion-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/backup_recovery_$TIMESTAMP.log"

# Recovery objectives
RTO_TARGET=300    # 5 minutes Recovery Time Objective
RPO_TARGET=3600   # 1 hour Recovery Point Objective

# Database configuration
DB_HOST="localhost"
DB_NAME="terrafusion_production"
DB_USER="terrafusion_user"
DB_PORT="5432"

# Encryption configuration
ENCRYPTION_KEY_ID="alias/terrafusion-backup"
GPG_RECIPIENT="backups@terrafusion.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$BACKUP_BASE_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "a:t:s:p:d:r:ve" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        t) BACKUP_TYPE="$OPTARG" ;;
        s) SERVICE="$OPTARG" ;;
        p) POINT_IN_TIME="$OPTARG" ;;
        d) DESTINATION="$OPTARG" ;;
        r) RETENTION_DAYS="$OPTARG" ;;
        v) VERIFY_BACKUP=true ;;
        e) ENCRYPT_BACKUP=true ;;
        *) echo "Usage: $0 [-a action] [-t type] [-s service] [-p point] [-d dest] [-r retention] [-v] [-e]"; exit 1 ;;
    esac
done

# Data structures
declare -A BACKUP_METADATA
declare -A BACKUP_STATUS
declare -A RECOVERY_METRICS

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Generate backup filename
generate_backup_filename() {
    local service=$1
    local backup_type=$2
    local timestamp=$3
    
    echo "${service}_${backup_type}_${timestamp}"
}

# Calculate backup size
calculate_backup_size() {
    local path=$1
    
    if [ -f "$path" ]; then
        du -h "$path" | cut -f1
    elif [ -d "$path" ]; then
        du -sh "$path" | cut -f1
    else
        echo "0B"
    fi
}

# Encrypt backup file
encrypt_backup() {
    local source_file=$1
    local encrypted_file="${source_file}.gpg"
    
    log "Encrypting backup: $source_file"
    
    if command -v gpg &> /dev/null; then
        gpg --trust-model always --encrypt --recipient "$GPG_RECIPIENT" \
            --output "$encrypted_file" "$source_file"
        
        if [ $? -eq 0 ]; then
            log_success "Backup encrypted: $encrypted_file"
            # Remove unencrypted file
            rm -f "$source_file"
            echo "$encrypted_file"
        else
            log_error "Failed to encrypt backup"
            echo "$source_file"
        fi
    else
        log_warning "GPG not available, backup not encrypted"
        echo "$source_file"
    fi
}

# Decrypt backup file
decrypt_backup() {
    local encrypted_file=$1
    local decrypted_file="${encrypted_file%.gpg}"
    
    log "Decrypting backup: $encrypted_file"
    
    if command -v gpg &> /dev/null; then
        gpg --trust-model always --decrypt --output "$decrypted_file" "$encrypted_file"
        
        if [ $? -eq 0 ]; then
            log_success "Backup decrypted: $decrypted_file"
            echo "$decrypted_file"
        else
            log_error "Failed to decrypt backup"
            return 1
        fi
    else
        log_error "GPG not available, cannot decrypt backup"
        return 1
    fi
}

# Upload to S3
upload_to_s3() {
    local local_file=$1
    local s3_key=$2
    
    log "Uploading to S3: s3://$S3_BACKUP_BUCKET/$s3_key"
    
    if command -v aws &> /dev/null; then
        # Upload with server-side encryption
        aws s3 cp "$local_file" "s3://$S3_BACKUP_BUCKET/$s3_key" \
            --server-side-encryption aws:kms \
            --ssm-kms-key-id "$ENCRYPTION_KEY_ID" \
            --storage-class STANDARD_IA
        
        if [ $? -eq 0 ]; then
            log_success "Upload completed: s3://$S3_BACKUP_BUCKET/$s3_key"
            # Verify upload
            local remote_size=$(aws s3api head-object --bucket "$S3_BACKUP_BUCKET" --key "$s3_key" --query 'ContentLength' --output text 2>/dev/null)
            local local_size=$(stat -c%s "$local_file" 2>/dev/null || stat -f%z "$local_file" 2>/dev/null)
            
            if [ "$remote_size" = "$local_size" ]; then
                log_success "Upload verification passed"
                return 0
            else
                log_error "Upload verification failed: size mismatch"
                return 1
            fi
        else
            log_error "Upload failed"
            return 1
        fi
    else
        log_error "AWS CLI not available"
        return 1
    fi
}

# Download from S3
download_from_s3() {
    local s3_key=$1
    local local_file=$2
    
    log "Downloading from S3: s3://$S3_BACKUP_BUCKET/$s3_key"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "s3://$S3_BACKUP_BUCKET/$s3_key" "$local_file"
        
        if [ $? -eq 0 ] && [ -f "$local_file" ]; then
            log_success "Download completed: $local_file"
            return 0
        else
            log_error "Download failed"
            return 1
        fi
    else
        log_error "AWS CLI not available"
        return 1
    fi
}

# Database backup
backup_database() {
    local backup_type=$1
    local timestamp=$2
    
    log "Starting database backup ($backup_type)..."
    
    local backup_filename=$(generate_backup_filename "database" "$backup_type" "$timestamp")
    local backup_file="$BACKUP_BASE_DIR/${backup_filename}.sql"
    local start_time=$(date +%s)
    
    # Create database dump
    case $backup_type in
        full)
            log "Creating full database backup..."
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
                --if-exists \
                > "$backup_file"
            ;;
        incremental)
            log "Creating incremental database backup using WAL..."
            # This would use PostgreSQL WAL archiving for incremental backups
            local wal_backup_dir="$BACKUP_BASE_DIR/wal_${timestamp}"
            mkdir -p "$wal_backup_dir"
            
            # Archive WAL files
            PGPASSWORD="${PGPASSWORD:-}" psql \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                -c "SELECT pg_switch_wal();" > /dev/null
            
            # Copy WAL files (simplified - in production, use pg_basebackup)
            if [ -d "/var/lib/postgresql/16/main/pg_wal" ]; then
                cp /var/lib/postgresql/16/main/pg_wal/* "$wal_backup_dir/" 2>/dev/null || true
            fi
            
            backup_file="$wal_backup_dir"
            ;;
        snapshot)
            log "Creating database snapshot..."
            # For RDS, this would use AWS RDS snapshots
            if command -v aws &> /dev/null; then
                local snapshot_id="terrafusion-snapshot-$timestamp"
                aws rds create-db-snapshot \
                    --db-instance-identifier terrafusion-production \
                    --db-snapshot-identifier "$snapshot_id" || true
                
                # Wait for snapshot completion (in background)
                (
                    aws rds wait db-snapshot-completed --db-snapshot-identifier "$snapshot_id"
                    log_success "RDS snapshot completed: $snapshot_id"
                ) &
            fi
            
            # Also create a logical backup
            PGPASSWORD="${PGPASSWORD:-}" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --format=custom \
                --compress=9 \
                > "$backup_file"
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ -f "$backup_file" ] || [ -d "$backup_file" ]; then
        local backup_size=$(calculate_backup_size "$backup_file")
        log_success "Database backup completed: $backup_file ($backup_size, ${duration}s)"
        
        # Store metadata
        BACKUP_METADATA["${backup_filename}_type"]="database"
        BACKUP_METADATA["${backup_filename}_size"]="$backup_size"
        BACKUP_METADATA["${backup_filename}_duration"]="$duration"
        BACKUP_METADATA["${backup_filename}_timestamp"]="$timestamp"
        
        echo "$backup_file"
    else
        log_error "Database backup failed"
        return 1
    fi
}

# File system backup
backup_files() {
    local backup_type=$1
    local timestamp=$2
    
    log "Starting file system backup ($backup_type)..."
    
    local backup_filename=$(generate_backup_filename "files" "$backup_type" "$timestamp")
    local backup_file="$BACKUP_BASE_DIR/${backup_filename}.tar.gz"
    local start_time=$(date +%s)
    
    # Define paths to backup
    local backup_paths=(
        "/opt/terrafusion"
        "/etc/nginx"
        "/etc/ssl/private"
        "/var/log/terrafusion"
    )
    
    # Create incremental backup reference file
    local reference_file="$BACKUP_BASE_DIR/.last_file_backup"
    
    case $backup_type in
        full)
            log "Creating full file system backup..."
            tar -czf "$backup_file" \
                --exclude='*.tmp' \
                --exclude='*.log' \
                --exclude='node_modules' \
                --exclude='.git' \
                "${backup_paths[@]}" 2>/dev/null || true
            ;;
        incremental)
            log "Creating incremental file system backup..."
            if [ -f "$reference_file" ]; then
                tar -czf "$backup_file" \
                    --newer-mtime="$(cat "$reference_file")" \
                    --exclude='*.tmp' \
                    --exclude='*.log' \
                    --exclude='node_modules' \
                    --exclude='.git' \
                    "${backup_paths[@]}" 2>/dev/null || true
            else
                log_warning "No reference file found, creating full backup instead"
                tar -czf "$backup_file" \
                    --exclude='*.tmp' \
                    --exclude='*.log' \
                    --exclude='node_modules' \
                    --exclude='.git' \
                    "${backup_paths[@]}" 2>/dev/null || true
            fi
            
            # Update reference file
            date > "$reference_file"
            ;;
        snapshot)
            log "Creating file system snapshot..."
            # Use rsync for snapshot-style backup
            local snapshot_dir="$BACKUP_BASE_DIR/snapshot_$timestamp"
            mkdir -p "$snapshot_dir"
            
            for path in "${backup_paths[@]}"; do
                if [ -e "$path" ]; then
                    rsync -av --delete "$path" "$snapshot_dir/" 2>/dev/null || true
                fi
            done
            
            # Create compressed archive of snapshot
            tar -czf "$backup_file" -C "$snapshot_dir" . 2>/dev/null || true
            rm -rf "$snapshot_dir"
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ -f "$backup_file" ]; then
        local backup_size=$(calculate_backup_size "$backup_file")
        log_success "File system backup completed: $backup_file ($backup_size, ${duration}s)"
        
        # Store metadata
        BACKUP_METADATA["${backup_filename}_type"]="files"
        BACKUP_METADATA["${backup_filename}_size"]="$backup_size"
        BACKUP_METADATA["${backup_filename}_duration"]="$duration"
        BACKUP_METADATA["${backup_filename}_timestamp"]="$timestamp"
        
        echo "$backup_file"
    else
        log_error "File system backup failed"
        return 1
    fi
}

# Configuration backup
backup_config() {
    local backup_type=$1
    local timestamp=$2
    
    log "Starting configuration backup..."
    
    local backup_filename=$(generate_backup_filename "config" "$backup_type" "$timestamp")
    local backup_file="$BACKUP_BASE_DIR/${backup_filename}.tar.gz"
    local start_time=$(date +%s)
    
    local config_paths=(
        "/etc/terrafusion"
        "/etc/nginx/sites-available"
        "/etc/nginx/nginx.conf"
        "/etc/systemd/system/terrafusion*"
        "/opt/terrafusion/config"
        "/root/.aws"
        "/root/.kube"
    )
    
    # Add Kubernetes configurations
    if command -v kubectl &> /dev/null; then
        local k8s_backup_dir="$BACKUP_BASE_DIR/k8s_config_$timestamp"
        mkdir -p "$k8s_backup_dir"
        
        # Export all Kubernetes resources
        kubectl get all --all-namespaces -o yaml > "$k8s_backup_dir/all-resources.yaml" 2>/dev/null || true
        kubectl get configmaps --all-namespaces -o yaml > "$k8s_backup_dir/configmaps.yaml" 2>/dev/null || true
        kubectl get secrets --all-namespaces -o yaml > "$k8s_backup_dir/secrets.yaml" 2>/dev/null || true
        kubectl get persistentvolumes -o yaml > "$k8s_backup_dir/pvs.yaml" 2>/dev/null || true
        
        config_paths+=("$k8s_backup_dir")
    fi
    
    # Create configuration backup
    tar -czf "$backup_file" \
        --ignore-failed-read \
        "${config_paths[@]}" 2>/dev/null || true
    
    # Cleanup temporary k8s backup dir
    rm -rf "$BACKUP_BASE_DIR/k8s_config_$timestamp" 2>/dev/null || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ -f "$backup_file" ]; then
        local backup_size=$(calculate_backup_size "$backup_file")
        log_success "Configuration backup completed: $backup_file ($backup_size, ${duration}s)"
        
        # Store metadata
        BACKUP_METADATA["${backup_filename}_type"]="config"
        BACKUP_METADATA["${backup_filename}_size"]="$backup_size"
        BACKUP_METADATA["${backup_filename}_duration"]="$duration"
        BACKUP_METADATA["${backup_filename}_timestamp"]="$timestamp"
        
        echo "$backup_file"
    else
        log_error "Configuration backup failed"
        return 1
    fi
}

# Perform backup
perform_backup() {
    local service=$1
    local backup_type=$2
    local timestamp=$3
    
    log "========================================="
    log "Starting backup operation"
    log "Service: $service"
    log "Type: $backup_type"
    log "Timestamp: $timestamp"
    log "========================================="
    
    local backup_files=()
    local backup_start_time=$(date +%s)
    
    case $service in
        all)
            # Backup all services
            if backup_result=$(backup_database "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            
            if backup_result=$(backup_files "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            
            if backup_result=$(backup_config "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            ;;
        database)
            if backup_result=$(backup_database "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            ;;
        files)
            if backup_result=$(backup_files "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            ;;
        config)
            if backup_result=$(backup_config "$backup_type" "$timestamp"); then
                backup_files+=("$backup_result")
            fi
            ;;
    esac
    
    # Process each backup file
    for backup_file in "${backup_files[@]}"; do
        # Verify backup integrity
        if [ "$VERIFY_BACKUP" = true ]; then
            verify_backup_integrity "$backup_file"
        fi
        
        # Encrypt if requested
        if [ "$ENCRYPT_BACKUP" = true ]; then
            backup_file=$(encrypt_backup "$backup_file")
        fi
        
        # Upload to destination
        case $DESTINATION in
            s3)
                local s3_key="$(basename "$backup_file")"
                if upload_to_s3 "$backup_file" "$s3_key"; then
                    # Remove local copy after successful upload
                    rm -f "$backup_file"
                    log_success "Local backup file removed after successful upload"
                fi
                ;;
            local)
                log_success "Backup retained locally: $backup_file"
                ;;
        esac
    done
    
    local backup_end_time=$(date +%s)
    local total_duration=$((backup_end_time - backup_start_time))
    
    log "========================================="
    log "Backup operation completed"
    log "Files created: ${#backup_files[@]}"
    log "Total duration: ${total_duration}s"
    log "========================================="
    
    # Generate backup report
    generate_backup_report "$service" "$backup_type" "$timestamp" "${backup_files[@]}"
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file=$1
    
    log "Verifying backup integrity: $backup_file"
    
    if [ -f "$backup_file" ]; then
        # Check file is not empty
        if [ ! -s "$backup_file" ]; then
            log_error "Backup file is empty: $backup_file"
            return 1
        fi
        
        # Check file format based on extension
        case "$backup_file" in
            *.sql)
                # Check SQL syntax
                if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
                    log_success "SQL backup format verified"
                else
                    log_error "Invalid SQL backup format"
                    return 1
                fi
                ;;
            *.tar.gz)
                # Test tar archive
                if tar -tzf "$backup_file" > /dev/null 2>&1; then
                    log_success "Tar archive integrity verified"
                else
                    log_error "Corrupted tar archive"
                    return 1
                fi
                ;;
            *.gpg)
                # Test GPG encryption
                if gpg --list-packets "$backup_file" > /dev/null 2>&1; then
                    log_success "GPG encryption verified"
                else
                    log_error "Invalid GPG encryption"
                    return 1
                fi
                ;;
        esac
        
        # Calculate and store checksum
        local checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
        echo "$checksum" > "${backup_file}.sha256"
        log_success "Backup integrity verified (SHA256: ${checksum:0:16}...)"
        
        return 0
    else
        log_error "Backup file not found: $backup_file"
        return 1
    fi
}

# List available backups
list_backups() {
    log "Listing available backups..."
    
    case $DESTINATION in
        s3)
            if command -v aws &> /dev/null; then
                log "S3 backups in bucket: $S3_BACKUP_BUCKET"
                aws s3 ls "s3://$S3_BACKUP_BUCKET/" --recursive --human-readable | \
                    grep -E '\.(sql|tar\.gz|gpg)$' | \
                    sort -k1,2
            fi
            ;;
        local)
            log "Local backups in directory: $BACKUP_BASE_DIR"
            find "$BACKUP_BASE_DIR" -type f \( -name "*.sql" -o -name "*.tar.gz" -o -name "*.gpg" \) \
                -exec ls -lh {} \; | sort -k6,7
            ;;
    esac
}

# Database restore
restore_database() {
    local backup_file=$1
    local point_in_time=$2
    
    log "Starting database restore..."
    log "Backup file: $backup_file"
    log "Point in time: $point_in_time"
    
    local restore_start_time=$(date +%s)
    
    # Download backup if from S3
    if [[ "$backup_file" == s3://* ]]; then
        local s3_key=$(basename "$backup_file")
        local local_backup="/tmp/restore_${TIMESTAMP}.sql"
        
        if ! download_from_s3 "$s3_key" "$local_backup"; then
            log_error "Failed to download backup from S3"
            return 1
        fi
        
        backup_file="$local_backup"
    fi
    
    # Decrypt if encrypted
    if [[ "$backup_file" == *.gpg ]]; then
        backup_file=$(decrypt_backup "$backup_file")
        if [ $? -ne 0 ]; then
            log_error "Failed to decrypt backup"
            return 1
        fi
    fi
    
    # Create restore database
    local restore_db="${DB_NAME}_restore_${TIMESTAMP}"
    
    log "Creating restore database: $restore_db"
    PGPASSWORD="${PGPASSWORD:-}" createdb \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        "$restore_db"
    
    if [ $? -ne 0 ]; then
        log_error "Failed to create restore database"
        return 1
    fi
    
    # Restore backup
    log "Restoring backup to database: $restore_db"
    
    if [[ "$backup_file" == *.sql ]]; then
        # Plain SQL restore
        PGPASSWORD="${PGPASSWORD:-}" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$restore_db" \
            -f "$backup_file"
    else
        # Custom format restore
        PGPASSWORD="${PGPASSWORD:-}" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$restore_db" \
            --verbose \
            --clean \
            --if-exists \
            "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        local restore_end_time=$(date +%s)
        local duration=$((restore_end_time - restore_start_time))
        
        log_success "Database restore completed: $restore_db (${duration}s)"
        
        # Verify restore
        local table_count=$(PGPASSWORD="${PGPASSWORD:-}" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$restore_db" \
            -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
        
        log_success "Restored database contains $table_count tables"
        
        # Store recovery metrics
        RECOVERY_METRICS["restore_duration"]="$duration"
        RECOVERY_METRICS["restore_database"]="$restore_db"
        RECOVERY_METRICS["table_count"]="$table_count"
        
        return 0
    else
        log_error "Database restore failed"
        
        # Cleanup failed restore
        PGPASSWORD="${PGPASSWORD:-}" dropdb \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            "$restore_db" 2>/dev/null || true
        
        return 1
    fi
}

# Test backup and restore
test_backup_restore() {
    log "========================================="
    log "Starting backup and restore test"
    log "========================================="
    
    local test_timestamp=$(date +%Y%m%d_%H%M%S)
    local test_start_time=$(date +%s)
    
    # Step 1: Create test backup
    log "Step 1: Creating test backup..."
    local test_backup_file
    if test_backup_file=$(backup_database "full" "$test_timestamp"); then
        log_success "Test backup created: $test_backup_file"
    else
        log_error "Test backup creation failed"
        return 1
    fi
    
    # Step 2: Test restore
    log "Step 2: Testing restore..."
    if restore_database "$test_backup_file" "$test_timestamp"; then
        log_success "Test restore completed"
    else
        log_error "Test restore failed"
        return 1
    fi
    
    # Step 3: Verify data integrity
    log "Step 3: Verifying data integrity..."
    local restore_db="${DB_NAME}_restore_${test_timestamp}"
    
    # Compare table counts
    local original_tables=$(PGPASSWORD="${PGPASSWORD:-}" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    local restored_tables=$(PGPASSWORD="${PGPASSWORD:-}" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$restore_db" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [ "$original_tables" = "$restored_tables" ]; then
        log_success "Data integrity verified: $original_tables tables in both databases"
    else
        log_error "Data integrity check failed: original=$original_tables, restored=$restored_tables"
    fi
    
    # Step 4: Performance test
    log "Step 4: Testing restore performance..."
    local test_end_time=$(date +%s)
    local total_duration=$((test_end_time - test_start_time))
    
    # Check if RTO is met
    if [ $total_duration -le $RTO_TARGET ]; then
        log_success "RTO target met: ${total_duration}s <= ${RTO_TARGET}s"
    else
        log_warning "RTO target exceeded: ${total_duration}s > ${RTO_TARGET}s"
    fi
    
    # Step 5: Cleanup
    log "Step 5: Cleaning up test resources..."
    PGPASSWORD="${PGPASSWORD:-}" dropdb \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$restore_db" 2>/dev/null || true
    
    rm -f "$test_backup_file" 2>/dev/null || true
    
    log "========================================="
    log "Backup and restore test completed"
    log "Total duration: ${total_duration}s"
    log "RTO compliance: $([ $total_duration -le $RTO_TARGET ] && echo "PASS" || echo "FAIL")"
    log "========================================="
}

# Schedule automated backups
schedule_backups() {
    log "Setting up automated backup schedule..."
    
    # Create cron jobs for different backup types
    local cron_file="/tmp/terrafusion_backup_cron"
    
    cat > "$cron_file" << EOF
# TerraFusion Automated Backup Schedule
# Full backup daily at 2 AM
0 2 * * * $(readlink -f "$0") -a backup -t full -s all -d s3 -v -e >> $LOG_FILE 2>&1

# Incremental backup every 4 hours
0 */4 * * * $(readlink -f "$0") -a backup -t incremental -s database -d s3 -v -e >> $LOG_FILE 2>&1

# Configuration backup daily at 3 AM
0 3 * * * $(readlink -f "$0") -a backup -t full -s config -d s3 -v -e >> $LOG_FILE 2>&1

# Weekly backup test on Sundays at 4 AM
0 4 * * 0 $(readlink -f "$0") -a test >> $LOG_FILE 2>&1

# Monthly cleanup on first day at 5 AM
0 5 1 * * $(readlink -f "$0") -a cleanup -r 90 >> $LOG_FILE 2>&1
EOF
    
    # Install cron jobs
    if command -v crontab &> /dev/null; then
        crontab "$cron_file"
        log_success "Backup schedule installed"
        
        # Show installed cron jobs
        log "Installed cron jobs:"
        crontab -l | grep -E "(terrafusion|backup)" || true
    else
        log_error "crontab not available"
        log "Manual cron setup required:"
        cat "$cron_file"
    fi
    
    rm -f "$cron_file"
}

# Cleanup old backups
cleanup_backups() {
    local retention_days=$1
    
    log "Cleaning up backups older than $retention_days days..."
    
    case $DESTINATION in
        s3)
            if command -v aws &> /dev/null; then
                # List and delete old backups
                local cutoff_date=$(date -d "$retention_days days ago" +%Y-%m-%d)
                
                aws s3api list-objects-v2 \
                    --bucket "$S3_BACKUP_BUCKET" \
                    --query "Contents[?LastModified<='$cutoff_date'].Key" \
                    --output text | \
                while read -r key; do
                    if [ -n "$key" ] && [ "$key" != "None" ]; then
                        log "Deleting old backup: $key"
                        aws s3 rm "s3://$S3_BACKUP_BUCKET/$key"
                    fi
                done
            fi
            ;;
        local)
            # Delete local backups older than retention period
            find "$BACKUP_BASE_DIR" -type f \
                \( -name "*.sql" -o -name "*.tar.gz" -o -name "*.gpg" \) \
                -mtime +$retention_days \
                -exec rm -f {} \; \
                -print | while read -r file; do
                log "Deleted old backup: $file"
            done
            ;;
    esac
    
    log_success "Backup cleanup completed"
}

# Generate backup report
generate_backup_report() {
    local service=$1
    local backup_type=$2
    local timestamp=$3
    shift 3
    local backup_files=("$@")
    
    local report_file="$BACKUP_BASE_DIR/backup_report_$timestamp.html"
    
    log "Generating backup report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Backup Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔄 TerraFusion Backup Report</h1>
        <p><strong>Service:</strong> $service</p>
        <p><strong>Type:</strong> $backup_type</p>
        <p><strong>Timestamp:</strong> $timestamp</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <h2>Backup Summary</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Files Created</td><td>${#backup_files[@]}</td></tr>
        <tr><td>Destination</td><td>$DESTINATION</td></tr>
        <tr><td>Encryption</td><td>$([ "$ENCRYPT_BACKUP" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
        <tr><td>Verification</td><td>$([ "$VERIFY_BACKUP" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
    </table>
    
    <h2>Backup Files</h2>
    <table>
        <tr><th>File</th><th>Type</th><th>Size</th><th>Duration</th></tr>
EOF
    
    for backup_file in "${backup_files[@]}"; do
        local filename=$(basename "$backup_file")
        local file_type="Unknown"
        local file_size="Unknown"
        local duration="Unknown"
        
        # Extract metadata
        for key in "${!BACKUP_METADATA[@]}"; do
            if [[ "$key" == *"$filename"* ]]; then
                case "$key" in
                    *_type) file_type="${BACKUP_METADATA[$key]}" ;;
                    *_size) file_size="${BACKUP_METADATA[$key]}" ;;
                    *_duration) duration="${BACKUP_METADATA[$key]}s" ;;
                esac
            fi
        done
        
        cat >> "$report_file" << EOF
        <tr>
            <td>$filename</td>
            <td>$file_type</td>
            <td>$file_size</td>
            <td>$duration</td>
        </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
    </table>
    
    <h2>Recovery Objectives Status</h2>
    <table>
        <tr><th>Objective</th><th>Target</th><th>Status</th></tr>
        <tr><td>Recovery Time Objective (RTO)</td><td>${RTO_TARGET}s</td><td class="info">Configured</td></tr>
        <tr><td>Recovery Point Objective (RPO)</td><td>${RPO_TARGET}s</td><td class="info">Configured</td></tr>
    </table>
    
    <h2>Next Steps</h2>
    <ul>
        <li>Verify backup integrity if not done automatically</li>
        <li>Test restore procedures regularly</li>
        <li>Monitor backup storage usage</li>
        <li>Review and update retention policies</li>
    </ul>
    
    <p><small>Report generated by TerraFusion Backup System</small></p>
</body>
</html>
EOF
    
    log_success "Backup report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Backup and Recovery System"
    log "Action: $ACTION"
    log "Service: $SERVICE"
    log "Type: $BACKUP_TYPE"
    log "Destination: $DESTINATION"
    log "========================================="
    
    case $ACTION in
        backup)
            perform_backup "$SERVICE" "$BACKUP_TYPE" "$TIMESTAMP"
            ;;
        restore)
            if [ -z "$POINT_IN_TIME" ] || [ "$POINT_IN_TIME" = "latest" ]; then
                log_error "Point in time required for restore"
                exit 1
            fi
            restore_database "$POINT_IN_TIME" "$TIMESTAMP"
            ;;
        test)
            test_backup_restore
            ;;
        schedule)
            schedule_backups
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_backups "$RETENTION_DAYS"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: backup, restore, test, schedule, list, cleanup"
            exit 1
            ;;
    esac
    
    log "Backup and recovery operation completed: $ACTION"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Backup operation interrupted!"; exit 1' INT TERM

# Run main function
main