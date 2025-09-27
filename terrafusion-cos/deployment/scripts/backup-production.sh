#!/bin/bash

# TerraFusion cOS Production Disaster Recovery & Backup System
# Government-grade backup and recovery for critical county operations

set -euo pipefail

# Configuration
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_RETENTION_DAYS=90
S3_BUCKET="${S3_BACKUP_BUCKET:-terrafusion-cos-backups}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"
NAMESPACE_PROD="terrafusion-production"
NAMESPACE_DB="terrafusion-database"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "/var/log/terrafusion-backup.log"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
    exit 1
}

# Validate prerequisites
validate_prerequisites() {
    log "Validating backup prerequisites..."
    
    # Check kubectl access
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot access Kubernetes cluster"
    
    # Check AWS CLI for S3 backups
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS CLI not configured"
    
    # Check encryption key
    [ -n "${ENCRYPTION_KEY}" ] || error "BACKUP_ENCRYPTION_KEY not set"
    
    # Check required tools
    command -v pg_dump >/dev/null 2>&1 || error "pg_dump not available"
    command -v redis-cli >/dev/null 2>&1 || error "redis-cli not available"
    command -v gpg >/dev/null 2>&1 || error "gpg not available"
    
    log "Prerequisites validated successfully"
}

# Database backup
backup_postgresql() {
    log "Starting PostgreSQL database backup..."
    
    local backup_file="postgresql_backup_${BACKUP_TIMESTAMP}.sql"
    local encrypted_file="${backup_file}.gpg"
    
    # Get database credentials from Kubernetes secrets
    local db_password=$(kubectl get secret terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.data.postgres-password}' | base64 -d)
    local db_host=$(kubectl get service terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.spec.clusterIP}')
    
    # Create database backup
    log "Dumping PostgreSQL database..."
    PGPASSWORD="$db_password" pg_dump \
        -h "$db_host" \
        -U postgres \
        -d terrafusion_cos_prod \
        --verbose \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        > "$backup_file" || error "PostgreSQL backup failed"
    
    # Encrypt backup
    log "Encrypting database backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --cipher-algo AES256 --compress-algo 2 --symmetric --output "$encrypted_file" "$backup_file"
    rm "$backup_file"
    
    # Upload to S3
    log "Uploading encrypted database backup to S3..."
    aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/database/$encrypted_file" --storage-class STANDARD_IA
    
    # Verify upload
    aws s3 ls "s3://$S3_BUCKET/database/$encrypted_file" >/dev/null || error "S3 upload verification failed"
    
    rm "$encrypted_file"
    log "PostgreSQL backup completed successfully"
}

# Redis backup
backup_redis() {
    log "Starting Redis backup..."
    
    local backup_file="redis_backup_${BACKUP_TIMESTAMP}.rdb"
    local encrypted_file="${backup_file}.gpg"
    
    # Get Redis credentials
    local redis_password=$(kubectl get secret terrafusion-redis -n $NAMESPACE_DB -o jsonpath='{.data.redis-password}' | base64 -d)
    local redis_host=$(kubectl get service terrafusion-redis-master -n $NAMESPACE_DB -o jsonpath='{.spec.clusterIP}')
    
    # Create Redis backup
    log "Creating Redis backup..."
    redis-cli -h "$redis_host" -a "$redis_password" --no-auth-warning BGSAVE
    
    # Wait for backup to complete
    while [ "$(redis-cli -h "$redis_host" -a "$redis_password" --no-auth-warning LASTSAVE)" = "$(redis-cli -h "$redis_host" -a "$redis_password" --no-auth-warning LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy Redis dump file
    kubectl cp "${NAMESPACE_DB}/terrafusion-redis-master-0:/data/dump.rdb" "$backup_file"
    
    # Encrypt backup
    log "Encrypting Redis backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --cipher-algo AES256 --compress-algo 2 --symmetric --output "$encrypted_file" "$backup_file"
    rm "$backup_file"
    
    # Upload to S3
    log "Uploading encrypted Redis backup to S3..."
    aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/redis/$encrypted_file" --storage-class STANDARD_IA
    
    rm "$encrypted_file"
    log "Redis backup completed successfully"
}

# Application configuration backup
backup_configurations() {
    log "Starting configuration backups..."
    
    local config_backup="configurations_${BACKUP_TIMESTAMP}.tar"
    local encrypted_file="${config_backup}.gpg"
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    
    # Backup Kubernetes secrets
    log "Backing up Kubernetes secrets..."
    kubectl get secrets -n $NAMESPACE_PROD -o yaml > "$temp_dir/secrets.yaml"
    kubectl get secrets -n $NAMESPACE_DB -o yaml > "$temp_dir/database-secrets.yaml"
    
    # Backup ConfigMaps
    log "Backing up ConfigMaps..."
    kubectl get configmaps -n $NAMESPACE_PROD -o yaml > "$temp_dir/configmaps.yaml"
    
    # Backup deployments and services
    log "Backing up deployment configurations..."
    kubectl get deployments,services,ingresses,hpa,pdb -n $NAMESPACE_PROD -o yaml > "$temp_dir/deployments.yaml"
    
    # Create archive
    tar -cf "$config_backup" -C "$temp_dir" .
    rm -rf "$temp_dir"
    
    # Encrypt configuration backup
    log "Encrypting configuration backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --cipher-algo AES256 --compress-algo 2 --symmetric --output "$encrypted_file" "$config_backup"
    rm "$config_backup"
    
    # Upload to S3
    log "Uploading encrypted configuration backup to S3..."
    aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/configurations/$encrypted_file" --storage-class STANDARD_IA
    
    rm "$encrypted_file"
    log "Configuration backup completed successfully"
}

# Persistent volume backup
backup_persistent_volumes() {
    log "Starting persistent volume backups..."
    
    # Get all PVCs in production namespace
    local pvcs=$(kubectl get pvc -n $NAMESPACE_PROD -o jsonpath='{.items[*].metadata.name}')
    
    for pvc in $pvcs; do
        log "Backing up PVC: $pvc"
        
        local snapshot_name="snapshot-${pvc}-${BACKUP_TIMESTAMP}"
        
        # Create volume snapshot (assuming VolumeSnapshot CRD is available)
        cat <<EOF | kubectl apply -f -
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: $snapshot_name
  namespace: $NAMESPACE_PROD
spec:
  volumeSnapshotClassName: csi-snapshotter
  source:
    persistentVolumeClaimName: $pvc
EOF
        
        # Wait for snapshot to be ready
        kubectl wait --for=condition=readytouse volumesnapshot/$snapshot_name -n $NAMESPACE_PROD --timeout=300s
        
        log "Volume snapshot created: $snapshot_name"
    done
    
    log "Persistent volume backups completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +"%Y%m%d")
    
    # Clean up S3 backups
    for prefix in database redis configurations; do
        aws s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "$prefix/" --query "Contents[?LastModified<='$(date -d "$BACKUP_RETENTION_DAYS days ago" --iso-8601)'].Key" --output text | \
        while read -r key; do
            if [ -n "$key" ]; then
                log "Deleting old backup: $key"
                aws s3 rm "s3://$S3_BUCKET/$key"
            fi
        done
    done
    
    # Clean up old volume snapshots
    kubectl get volumesnapshots -n $NAMESPACE_PROD -o json | \
    jq -r --arg cutoff "$cutoff_date" '.items[] | select(.metadata.creationTimestamp < $cutoff) | .metadata.name' | \
    while read -r snapshot; do
        if [ -n "$snapshot" ]; then
            log "Deleting old volume snapshot: $snapshot"
            kubectl delete volumesnapshot "$snapshot" -n $NAMESPACE_PROD
        fi
    done
    
    log "Cleanup completed"
}

# Backup verification
verify_backups() {
    log "Verifying backup integrity..."
    
    # Verify S3 backups exist
    local db_backup="postgresql_backup_${BACKUP_TIMESTAMP}.sql.gpg"
    local redis_backup="redis_backup_${BACKUP_TIMESTAMP}.rdb.gpg"
    local config_backup="configurations_${BACKUP_TIMESTAMP}.tar.gpg"
    
    aws s3 ls "s3://$S3_BUCKET/database/$db_backup" >/dev/null || error "Database backup verification failed"
    aws s3 ls "s3://$S3_BUCKET/redis/$redis_backup" >/dev/null || error "Redis backup verification failed"
    aws s3 ls "s3://$S3_BUCKET/configurations/$config_backup" >/dev/null || error "Configuration backup verification failed"
    
    log "Backup verification completed successfully"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to monitoring system (customize based on your alerting setup)
    if command -v curl >/dev/null 2>&1; then
        curl -X POST \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"TerraFusion cOS Backup $status: $message\",\"severity\":\"info\"}" \
            "${WEBHOOK_URL:-https://hooks.slack.com/services/PLACEHOLDER}" \
            >/dev/null 2>&1 || true
    fi
    
    # Log to system journal
    logger -t terrafusion-backup "$status: $message"
}

# Main execution
main() {
    log "Starting TerraFusion cOS backup process..."
    
    trap 'send_notification "FAILED" "Backup process failed at $(date)"' ERR
    
    validate_prerequisites
    backup_postgresql
    backup_redis
    backup_configurations
    backup_persistent_volumes
    verify_backups
    cleanup_old_backups
    
    send_notification "SUCCESS" "Backup process completed successfully at $(date)"
    log "TerraFusion cOS backup process completed successfully"
}

# Execute main function
main "$@"