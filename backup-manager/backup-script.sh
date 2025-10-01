#!/bin/bash
# TerraFusion Backup Manager Script

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=${RETENTION_DAYS:-30}
LOG_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory structure
mkdir -p "$BACKUP_DIR/consul"
mkdir -p "$BACKUP_DIR/kong-db"
mkdir -p "$BACKUP_DIR/rabbitmq"
mkdir -p "$BACKUP_DIR/kafka"
mkdir -p "$BACKUP_DIR/redis"
mkdir -p "$BACKUP_DIR/logs"

log "Starting TerraFusion backup process..."

# Backup Consul data
log "Backing up Consul data..."
if [ -d "/source/consul" ]; then
    tar -czf "$BACKUP_DIR/consul/consul_backup_${TIMESTAMP}.tar.gz" -C /source consul/
    log "Consul backup completed: consul_backup_${TIMESTAMP}.tar.gz"
else
    log "Warning: Consul source directory not found"
fi

# Backup Kong database
log "Backing up Kong PostgreSQL database..."
if [ -n "${POSTGRES_HOST:-}" ]; then
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d kong \
        -f "$BACKUP_DIR/kong-db/kong_db_backup_${TIMESTAMP}.sql"
    gzip "$BACKUP_DIR/kong-db/kong_db_backup_${TIMESTAMP}.sql"
    log "Kong database backup completed: kong_db_backup_${TIMESTAMP}.sql.gz"
else
    log "Warning: PostgreSQL connection info not provided"
fi

# Backup RabbitMQ data
log "Backing up RabbitMQ data..."
if [ -d "/source/rabbitmq" ]; then
    tar -czf "$BACKUP_DIR/rabbitmq/rabbitmq_backup_${TIMESTAMP}.tar.gz" -C /source rabbitmq/
    log "RabbitMQ backup completed: rabbitmq_backup_${TIMESTAMP}.tar.gz"
else
    log "Warning: RabbitMQ source directory not found"
fi

# Backup Kafka data
log "Backing up Kafka data..."
if [ -d "/source/kafka" ]; then
    tar -czf "$BACKUP_DIR/kafka/kafka_backup_${TIMESTAMP}.tar.gz" -C /source kafka/
    log "Kafka backup completed: kafka_backup_${TIMESTAMP}.tar.gz"
else
    log "Warning: Kafka source directory not found"
fi

# Backup Redis data
log "Backing up Redis data..."
if [ -d "/source/redis" ]; then
    tar -czf "$BACKUP_DIR/redis/redis_backup_${TIMESTAMP}.tar.gz" -C /source redis/
    log "Redis backup completed: redis_backup_${TIMESTAMP}.tar.gz"
else
    log "Warning: Redis source directory not found"
fi

# Backup application logs
log "Backing up application logs..."
if [ -d "/source/logs" ]; then
    tar -czf "$BACKUP_DIR/logs/logs_backup_${TIMESTAMP}.tar.gz" -C /source logs/
    log "Logs backup completed: logs_backup_${TIMESTAMP}.tar.gz"
else
    log "Warning: Logs source directory not found"
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.log" -mtime +$RETENTION_DAYS -delete

# Create health check file
touch /tmp/backup-manager-health

log "Backup process completed successfully"

# Calculate and log backup sizes
total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup size: $total_size"

exit 0