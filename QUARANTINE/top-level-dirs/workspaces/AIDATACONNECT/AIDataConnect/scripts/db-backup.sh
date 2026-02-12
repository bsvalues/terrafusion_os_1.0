#!/bin/bash

# RAG Drive FTP Hub Database Backup Script
# This script creates a backup of the PostgreSQL database

# Source environment variables if .env file exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default values if not set in .env
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_NAME=${POSTGRES_DB:-ragdrivedb}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with date and time
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ragdrive_db_backup_$TIMESTAMP.sql"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Display backup information
echo -e "${YELLOW}Creating database backup...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Output file: $BACKUP_FILE"

# Check if we're running in Docker environment
if [ -n "$(command -v docker)" ] && [ -n "$(docker ps -q -f name=rag-drive-db)" ]; then
    echo -e "${YELLOW}Using Docker container for backup...${NC}"
    docker exec rag-drive-db pg_dump -U $DB_USER -F c $DB_NAME > "$BACKUP_FILE"
    RESULT=$?
else
    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}Error: pg_dump command not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    # Create backup using pg_dump
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -F c $DB_NAME > "$BACKUP_FILE"
    RESULT=$?
fi

# Check if backup was successful
if [ $RESULT -eq 0 ]; then
    # Get file size
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}Backup successfully created!${NC}"
    echo "Location: $BACKUP_FILE"
    echo "Size: $FILESIZE"
    echo -e "${YELLOW}Use ./scripts/db-restore.sh $BACKUP_FILE to restore this backup${NC}"
    
    # Create a symlink to the latest backup
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest_backup.sql"
    echo "Symlink to latest backup created: $BACKUP_DIR/latest_backup.sql"
    
    # List all backups
    echo -e "\nAvailable backups:"
    ls -lh $BACKUP_DIR/*.sql | awk '{print $9, "(" $5 ")"}'
    
    # Purge old backups (keep last 10)
    BACKUP_COUNT=$(ls -1 $BACKUP_DIR/ragdrive_db_backup_*.sql | wc -l)
    if [ $BACKUP_COUNT -gt 10 ]; then
        echo -e "\n${YELLOW}Purging old backups (keeping the 10 most recent)...${NC}"
        ls -1t $BACKUP_DIR/ragdrive_db_backup_*.sql | tail -n +11 | xargs rm -f
        echo "Old backups purged"
    fi
    
    exit 0
else
    echo -e "${RED}Error: Backup failed!${NC}"
    exit 1
fi