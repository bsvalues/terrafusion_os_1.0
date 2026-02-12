#!/bin/bash

# RAG Drive FTP Hub Database Restore Script
# This script restores a PostgreSQL database from a backup

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

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if a backup file is specified
if [ $# -eq 0 ]; then
    # If no argument is provided, use the latest backup if available
    if [ -f "./backups/latest_backup.sql" ]; then
        BACKUP_FILE="./backups/latest_backup.sql"
        echo -e "${YELLOW}No backup file specified. Using the latest backup:${NC} $BACKUP_FILE"
    else
        echo -e "${RED}Error: No backup file specified and no latest backup found.${NC}"
        echo "Usage: $0 <backup_file>"
        echo "Available backups:"
        
        # Create backup directory if it doesn't exist
        BACKUP_DIR="./backups"
        mkdir -p $BACKUP_DIR
        
        # List available backups if any
        if [ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
            ls -lh $BACKUP_DIR/*.sql 2>/dev/null | awk '{print $9, "(" $5 ")"}'
        else
            echo "No backups found in $BACKUP_DIR"
        fi
        
        exit 1
    fi
else
    BACKUP_FILE=$1
    
    # Check if the backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

# Confirmation prompt
echo -e "${YELLOW}WARNING: This will overwrite the existing database!${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"
echo
read -p "Are you sure you want to restore this database? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Database restore canceled.${NC}"
    exit 0
fi

# Create a new backup before restoring (safety measure)
echo -e "${YELLOW}Creating a backup of the current database state...${NC}"
SAFETY_BACKUP_DIR="./backups/pre_restore"
mkdir -p $SAFETY_BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SAFETY_BACKUP="$SAFETY_BACKUP_DIR/pre_restore_$TIMESTAMP.sql"

# Check if we're running in Docker environment
if [ -n "$(command -v docker)" ] && [ -n "$(docker ps -q -f name=rag-drive-db)" ]; then
    echo -e "${YELLOW}Using Docker container for operations...${NC}"
    
    # Create safety backup
    docker exec rag-drive-db pg_dump -U $DB_USER -F c $DB_NAME > "$SAFETY_BACKUP"
    SAFETY_RESULT=$?
    
    if [ $SAFETY_RESULT -eq 0 ]; then
        echo -e "${GREEN}Safety backup created: $SAFETY_BACKUP${NC}"
    else
        echo -e "${RED}Warning: Safety backup failed. Proceeding with restore anyway...${NC}"
    fi
    
    echo -e "${YELLOW}Restoring database from backup...${NC}"
    
    # Drop and recreate the database
    docker exec rag-drive-db psql -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
    docker exec rag-drive-db psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    docker exec rag-drive-db psql -U $DB_USER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Restore from backup
    cat "$BACKUP_FILE" | docker exec -i rag-drive-db pg_restore -U $DB_USER -d $DB_NAME
    RESTORE_RESULT=$?
else
    # Check if pg_restore is installed
    if ! command -v pg_restore &> /dev/null; then
        echo -e "${RED}Error: pg_restore command not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    # Create safety backup
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -F c $DB_NAME > "$SAFETY_BACKUP"
    SAFETY_RESULT=$?
    
    if [ $SAFETY_RESULT -eq 0 ]; then
        echo -e "${GREEN}Safety backup created: $SAFETY_BACKUP${NC}"
    else
        echo -e "${RED}Warning: Safety backup failed. Proceeding with restore anyway...${NC}"
    fi
    
    echo -e "${YELLOW}Restoring database from backup...${NC}"
    
    # Drop and recreate the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Restore from backup
    PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
    RESTORE_RESULT=$?
fi

# Check restore result
if [ $RESTORE_RESULT -eq 0 ]; then
    echo -e "${GREEN}Database restored successfully!${NC}"
    exit 0
else
    echo -e "${RED}Warning: Restore completed with warnings or errors (exit code: $RESTORE_RESULT).${NC}"
    echo -e "${YELLOW}This may not be a problem if there were only warnings.${NC}"
    echo "If needed, you can restore the pre-restore backup: $SAFETY_BACKUP"
    exit $RESTORE_RESULT
fi