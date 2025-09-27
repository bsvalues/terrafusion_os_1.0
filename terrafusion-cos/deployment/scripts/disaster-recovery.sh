#!/bin/bash

# TerraFusion cOS Disaster Recovery Script
# Complete system restoration for government-critical operations

set -euo pipefail

# Configuration
RESTORE_TIMESTAMP=${1:-"latest"}
S3_BUCKET="${S3_BACKUP_BUCKET:-terrafusion-cos-backups}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"
NAMESPACE_PROD="terrafusion-production"
NAMESPACE_DB="terrafusion-database"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "/var/log/terrafusion-recovery.log"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
    exit 1
}

# Validate prerequisites
validate_recovery_prerequisites() {
    log "Validating disaster recovery prerequisites..."
    
    # Check kubectl access
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot access Kubernetes cluster"
    
    # Check AWS CLI
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS CLI not configured"
    
    # Check encryption key
    [ -n "${ENCRYPTION_KEY}" ] || error "BACKUP_ENCRYPTION_KEY not set"
    
    # Check required tools
    command -v psql >/dev/null 2>&1 || error "psql not available"
    command -v redis-cli >/dev/null 2>&1 || error "redis-cli not available"
    command -v gpg >/dev/null 2>&1 || error "gpg not available"
    
    log "Recovery prerequisites validated successfully"
}

# Find latest backup if not specified
find_latest_backup() {
    if [ "$RESTORE_TIMESTAMP" = "latest" ]; then
        log "Finding latest backup..."
        
        # Find latest database backup
        local latest_db=$(aws s3 ls "s3://$S3_BUCKET/database/" | grep "postgresql_backup_" | sort | tail -1 | awk '{print $4}')
        
        if [ -z "$latest_db" ]; then
            error "No database backups found"
        fi
        
        # Extract timestamp from filename
        RESTORE_TIMESTAMP=$(echo "$latest_db" | sed 's/postgresql_backup_\(.*\)\.sql\.gpg/\1/')
        log "Latest backup timestamp: $RESTORE_TIMESTAMP"
    fi
}

# Create maintenance page
enable_maintenance_mode() {
    log "Enabling maintenance mode..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: maintenance-page
  namespace: $NAMESPACE_PROD
data:
  index.html: |
    <!DOCTYPE html>
    <html>
    <head>
        <title>TerraFusion cOS - Under Maintenance</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0099ff; color: white; }
            .container { max-width: 600px; margin: 0 auto; }
            .logo { font-size: 2em; margin-bottom: 20px; }
            .message { font-size: 1.2em; line-height: 1.6; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🏛️ TerraFusion cOS</div>
            <h1>System Under Maintenance</h1>
            <div class="message">
                <p>TerraFusion County Operating System is currently undergoing scheduled maintenance.</p>
                <p>Government services will be restored shortly.</p>
                <p>For emergency services, please contact your local emergency number.</p>
                <p><strong>Expected restoration: Within 30 minutes</strong></p>
            </div>
        </div>
    </body>
    </html>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: maintenance-page
  namespace: $NAMESPACE_PROD
spec:
  replicas: 2
  selector:
    matchLabels:
      app: maintenance-page
  template:
    metadata:
      labels:
        app: maintenance-page
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: maintenance-content
          mountPath: /usr/share/nginx/html
      volumes:
      - name: maintenance-content
        configMap:
          name: maintenance-page
---
apiVersion: v1
kind: Service
metadata:
  name: maintenance-page-service
  namespace: $NAMESPACE_PROD
spec:
  selector:
    app: maintenance-page
  ports:
  - port: 80
    targetPort: 80
EOF

    # Update ingress to point to maintenance page
    kubectl patch ingress terrafusion-cos-ingress -n $NAMESPACE_PROD --type='json' \
        -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "maintenance-page-service"}]'
    
    log "Maintenance mode enabled"
}

# Scale down production deployment
scale_down_production() {
    log "Scaling down production deployment..."
    
    # Scale down main application
    kubectl scale deployment terrafusion-cos -n $NAMESPACE_PROD --replicas=0
    
    # Wait for pods to terminate
    kubectl wait --for=delete pod -l app=terrafusion-cos -n $NAMESPACE_PROD --timeout=300s
    
    log "Production deployment scaled down"
}

# Restore PostgreSQL database
restore_postgresql() {
    log "Starting PostgreSQL database restoration..."
    
    local backup_file="postgresql_backup_${RESTORE_TIMESTAMP}.sql"
    local encrypted_file="${backup_file}.gpg"
    
    # Download encrypted backup from S3
    log "Downloading database backup from S3..."
    aws s3 cp "s3://$S3_BUCKET/database/$encrypted_file" "$encrypted_file"
    
    # Decrypt backup
    log "Decrypting database backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --decrypt "$encrypted_file" > "$backup_file"
    rm "$encrypted_file"
    
    # Get database credentials
    local db_password=$(kubectl get secret terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.data.postgres-password}' | base64 -d)
    local db_host=$(kubectl get service terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.spec.clusterIP}')
    
    # Stop database connections
    log "Preparing database for restoration..."
    PGPASSWORD="$db_password" psql -h "$db_host" -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'terrafusion_cos_prod' AND pid <> pg_backend_pid();"
    
    # Restore database
    log "Restoring PostgreSQL database..."
    PGPASSWORD="$db_password" psql -h "$db_host" -U postgres -d postgres < "$backup_file" || error "Database restoration failed"
    
    rm "$backup_file"
    
    # Verify restoration
    local record_count=$(PGPASSWORD="$db_password" psql -h "$db_host" -U postgres -d terrafusion_cos_prod -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "Database restored with $record_count tables"
    
    log "PostgreSQL restoration completed successfully"
}

# Restore Redis data
restore_redis() {
    log "Starting Redis data restoration..."
    
    local backup_file="redis_backup_${RESTORE_TIMESTAMP}.rdb"
    local encrypted_file="${backup_file}.gpg"
    
    # Download encrypted backup from S3
    log "Downloading Redis backup from S3..."
    aws s3 cp "s3://$S3_BUCKET/redis/$encrypted_file" "$encrypted_file"
    
    # Decrypt backup
    log "Decrypting Redis backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --decrypt "$encrypted_file" > "$backup_file"
    rm "$encrypted_file"
    
    # Stop Redis temporarily
    kubectl scale statefulset terrafusion-redis-master -n $NAMESPACE_DB --replicas=0
    kubectl wait --for=delete pod -l app=terrafusion-redis-master -n $NAMESPACE_DB --timeout=300s
    
    # Restore Redis dump file
    log "Restoring Redis data..."
    kubectl cp "$backup_file" "${NAMESPACE_DB}/terrafusion-redis-master-0:/data/dump.rdb" || true
    rm "$backup_file"
    
    # Restart Redis
    kubectl scale statefulset terrafusion-redis-master -n $NAMESPACE_DB --replicas=1
    kubectl wait --for=condition=ready pod -l app=terrafusion-redis-master -n $NAMESPACE_DB --timeout=300s
    
    log "Redis restoration completed successfully"
}

# Restore configurations
restore_configurations() {
    log "Starting configuration restoration..."
    
    local config_backup="configurations_${RESTORE_TIMESTAMP}.tar"
    local encrypted_file="${config_backup}.gpg"
    
    # Download encrypted backup from S3
    log "Downloading configuration backup from S3..."
    aws s3 cp "s3://$S3_BUCKET/configurations/$encrypted_file" "$encrypted_file"
    
    # Decrypt backup
    log "Decrypting configuration backup..."
    gpg --batch --yes --passphrase "$ENCRYPTION_KEY" --decrypt "$encrypted_file" > "$config_backup"
    rm "$encrypted_file"
    
    # Extract configurations
    local temp_dir=$(mktemp -d)
    tar -xf "$config_backup" -C "$temp_dir"
    rm "$config_backup"
    
    # Restore secrets
    log "Restoring Kubernetes secrets..."
    kubectl delete secrets --all -n $NAMESPACE_PROD --ignore-not-found=true
    kubectl apply -f "$temp_dir/secrets.yaml"
    
    # Restore ConfigMaps
    log "Restoring ConfigMaps..."
    kubectl delete configmaps --all -n $NAMESPACE_PROD --ignore-not-found=true
    kubectl apply -f "$temp_dir/configmaps.yaml"
    
    rm -rf "$temp_dir"
    log "Configuration restoration completed successfully"
}

# Restore from volume snapshots
restore_persistent_volumes() {
    log "Starting persistent volume restoration..."
    
    # Get available snapshots for the restore timestamp
    local snapshots=$(kubectl get volumesnapshots -n $NAMESPACE_PROD --no-headers | grep "$RESTORE_TIMESTAMP" | awk '{print $1}')
    
    for snapshot in $snapshots; do
        log "Restoring from volume snapshot: $snapshot"
        
        # Extract PVC name from snapshot name
        local pvc_name=$(echo "$snapshot" | sed "s/snapshot-\(.*\)-$RESTORE_TIMESTAMP/\1/")
        
        # Create PVC from snapshot
        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${pvc_name}-restored
  namespace: $NAMESPACE_PROD
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  dataSource:
    name: $snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
EOF
        
        # Wait for PVC to be bound
        kubectl wait --for=condition=Bound pvc/${pvc_name}-restored -n $NAMESPACE_PROD --timeout=300s
        
        log "Persistent volume restored: ${pvc_name}-restored"
    done
    
    log "Persistent volume restoration completed"
}

# Scale up production deployment
scale_up_production() {
    log "Scaling up production deployment..."
    
    # Scale up main application
    kubectl scale deployment terrafusion-cos -n $NAMESPACE_PROD --replicas=12
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=terrafusion-cos -n $NAMESPACE_PROD --timeout=600s
    
    # Verify health
    local ready_pods=$(kubectl get pods -l app=terrafusion-cos -n $NAMESPACE_PROD --no-headers | grep "Running" | wc -l)
    log "$ready_pods production pods are running"
    
    log "Production deployment scaled up successfully"
}

# Disable maintenance mode
disable_maintenance_mode() {
    log "Disabling maintenance mode..."
    
    # Restore original ingress routing
    kubectl patch ingress terrafusion-cos-ingress -n $NAMESPACE_PROD --type='json' \
        -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "terrafusion-cos-api-service"}]'
    
    # Remove maintenance page
    kubectl delete deployment,service,configmap maintenance-page -n $NAMESPACE_PROD --ignore-not-found=true
    
    log "Maintenance mode disabled"
}

# Run post-recovery tests
run_recovery_verification() {
    log "Running post-recovery verification..."
    
    # Health check
    sleep 30  # Allow services to fully initialize
    
    local api_endpoint="https://api.terrafusion.gov"
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" "$api_endpoint/health" || echo "000")
    
    if [ "$health_status" = "200" ]; then
        log "Health check passed"
    else
        error "Health check failed with status: $health_status"
    fi
    
    # Database connectivity test
    local db_password=$(kubectl get secret terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.data.postgres-password}' | base64 -d)
    local db_host=$(kubectl get service terrafusion-postgresql -n $NAMESPACE_DB -o jsonpath='{.spec.clusterIP}')
    
    PGPASSWORD="$db_password" psql -h "$db_host" -U postgres -d terrafusion_cos_prod -c "SELECT 1;" >/dev/null || error "Database connectivity test failed"
    log "Database connectivity verified"
    
    # Redis connectivity test
    local redis_password=$(kubectl get secret terrafusion-redis -n $NAMESPACE_DB -o jsonpath='{.data.redis-password}' | base64 -d)
    local redis_host=$(kubectl get service terrafusion-redis-master -n $NAMESPACE_DB -o jsonpath='{.spec.clusterIP}')
    
    redis-cli -h "$redis_host" -a "$redis_password" --no-auth-warning ping | grep -q "PONG" || error "Redis connectivity test failed"
    log "Redis connectivity verified"
    
    log "Recovery verification completed successfully"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to monitoring system
    if command -v curl >/dev/null 2>&1; then
        curl -X POST \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"TerraFusion cOS Recovery $status: $message\",\"severity\":\"critical\"}" \
            "${WEBHOOK_URL:-https://hooks.slack.com/services/PLACEHOLDER}" \
            >/dev/null 2>&1 || true
    fi
    
    # Log to system journal
    logger -t terrafusion-recovery "$status: $message"
}

# Main execution
main() {
    log "Starting TerraFusion cOS disaster recovery process..."
    log "Restore timestamp: $RESTORE_TIMESTAMP"
    
    trap 'send_notification "FAILED" "Recovery process failed at $(date)"' ERR
    
    validate_recovery_prerequisites
    find_latest_backup
    enable_maintenance_mode
    scale_down_production
    restore_postgresql
    restore_redis
    restore_configurations
    restore_persistent_volumes
    scale_up_production
    disable_maintenance_mode
    run_recovery_verification
    
    send_notification "SUCCESS" "Disaster recovery completed successfully at $(date)"
    log "TerraFusion cOS disaster recovery process completed successfully"
    log "System restored to timestamp: $RESTORE_TIMESTAMP"
}

# Show usage
usage() {
    echo "Usage: $0 [RESTORE_TIMESTAMP]"
    echo ""
    echo "RESTORE_TIMESTAMP: Backup timestamp to restore (format: YYYYMMDD_HHMMSS)"
    echo "                   Use 'latest' to restore from the most recent backup"
    echo ""
    echo "Examples:"
    echo "  $0 latest                    # Restore from latest backup"
    echo "  $0 20241201_120000          # Restore from specific timestamp"
    echo ""
    echo "Environment variables required:"
    echo "  BACKUP_ENCRYPTION_KEY       # GPG passphrase for backup decryption"
    echo "  S3_BACKUP_BUCKET           # S3 bucket containing backups"
    echo "  WEBHOOK_URL                # Optional: Notification webhook URL"
}

# Handle command line arguments
if [ $# -gt 1 ]; then
    usage
    exit 1
fi

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    usage
    exit 0
fi

# Execute main function
main "$@"