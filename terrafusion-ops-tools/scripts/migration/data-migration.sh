#!/bin/bash
#
# TerraFusion Data Migration Script
# Migrates data from old system to new TerraFusion database
#
# Usage: ./data-migration.sh [options]
# Options:
#   -s    Source database connection string
#   -d    Destination database connection string
#   -t    Table to migrate (users|projects|costs|all)
#   -b    Batch size (default: 1000)
#   -v    Validate data after migration
#   -r    Resume from failed migration
#   --dry-run    Test migration without making changes

set -euo pipefail

# Configuration
SOURCE_DB=""
DEST_DB="postgresql://terrafusion_user:password@localhost:5432/terrafusion_production"
TABLE_FILTER="all"
BATCH_SIZE=1000
VALIDATE_DATA=false
RESUME_MIGRATION=false
DRY_RUN=false
MIGRATION_LOG="/var/log/terrafusion/migration_$(date +%Y%m%d_%H%M%S).log"
PROGRESS_FILE="/tmp/terrafusion_migration_progress.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create log directory
mkdir -p "$(dirname "$MIGRATION_LOG")"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--source)
            SOURCE_DB="$2"
            shift 2
            ;;
        -d|--destination)
            DEST_DB="$2"
            shift 2
            ;;
        -t|--table)
            TABLE_FILTER="$2"
            shift 2
            ;;
        -b|--batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -v|--validate)
            VALIDATE_DATA=true
            shift
            ;;
        -r|--resume)
            RESUME_MIGRATION=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Usage: $0 [-s source_db] [-d dest_db] [-t table] [-b batch_size] [-v] [-r] [--dry-run]"
            exit 1
            ;;
    esac
done

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$MIGRATION_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$MIGRATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$MIGRATION_LOG"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if python3 is available
    if ! command -v python3 &> /dev/null; then
        log_error "python3 not found. Please install Python 3."
        exit 1
    fi
    
    # Check required Python packages
    if ! python3 -c "import pandas, psycopg2, sqlalchemy" 2>/dev/null; then
        log_error "Required Python packages not found. Please install: pandas psycopg2-binary sqlalchemy"
        exit 1
    fi
    
    # Check source database connection
    if [ -z "$SOURCE_DB" ]; then
        log_error "Source database connection string is required (-s option)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Test database connections
test_connections() {
    log "Testing database connections..."
    
    # Test source connection
    if ! python3 -c "
import sys
from sqlalchemy import create_engine
try:
    engine = create_engine('$SOURCE_DB')
    conn = engine.connect()
    conn.close()
    print('Source DB: Connected')
except Exception as e:
    print(f'Source DB: Failed - {e}')
    sys.exit(1)
"; then
        log_error "Failed to connect to source database"
        exit 1
    fi
    
    # Test destination connection
    if ! python3 -c "
import sys
from sqlalchemy import create_engine
try:
    engine = create_engine('$DEST_DB')
    conn = engine.connect()
    conn.close()
    print('Destination DB: Connected')
except Exception as e:
    print(f'Destination DB: Failed - {e}')
    sys.exit(1)
"; then
        log_error "Failed to connect to destination database"
        exit 1
    fi
    
    log_success "Database connections verified"
}

# Create migration tables
create_migration_tables() {
    log "Creating migration tracking tables..."
    
    psql "$DEST_DB" << 'EOF'
CREATE TABLE IF NOT EXISTS migration_status (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    source_count INTEGER,
    migrated_count INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migration_mapping (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    old_id VARCHAR(255) NOT NULL,
    new_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_name, old_id)
);
EOF

    log_success "Migration tables created"
}

# Create data migration script
create_migration_script() {
    cat > "/tmp/migrate_data.py" << 'EOF'
import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
import json
import sys
import uuid
from datetime import datetime

def log_message(message):
    print(f"[{datetime.now()}] {message}")

def migrate_users(source_engine, dest_engine, batch_size, dry_run=False):
    log_message("Starting users migration...")
    
    # Read users from source
    query = """
    SELECT 
        id as old_id,
        username,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
    FROM users 
    ORDER BY id
    """
    
    users_df = pd.read_sql(query, source_engine)
    total_count = len(users_df)
    log_message(f"Found {total_count} users to migrate")
    
    if dry_run:
        log_message("DRY RUN: Would migrate users")
        return total_count, 0
    
    migrated_count = 0
    errors = []
    
    # Process in batches
    for i in range(0, len(users_df), batch_size):
        batch = users_df.iloc[i:i+batch_size]
        
        for _, user in batch.iterrows():
            try:
                # Generate new UUID
                new_id = str(uuid.uuid4())
                
                # Insert user
                insert_query = text("""
                INSERT INTO users (
                    id, username, email, password_hash, first_name, last_name,
                    role, is_active, created_at, updated_at
                ) VALUES (
                    :id, :username, :email, :password_hash, :first_name, :last_name,
                    :role, :is_active, :created_at, :updated_at
                )
                """)
                
                dest_engine.execute(insert_query, {
                    'id': new_id,
                    'username': user['username'],
                    'email': user['email'],
                    'password_hash': user['password_hash'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'is_active': user['is_active'],
                    'created_at': user['created_at'],
                    'updated_at': user['updated_at']
                })
                
                # Store mapping
                mapping_query = text("""
                INSERT INTO migration_mapping (table_name, old_id, new_id)
                VALUES (:table_name, :old_id, :new_id)
                """)
                
                dest_engine.execute(mapping_query, {
                    'table_name': 'users',
                    'old_id': str(user['old_id']),
                    'new_id': new_id
                })
                
                migrated_count += 1
                
            except Exception as e:
                errors.append(f"User {user['old_id']}: {str(e)}")
                log_message(f"Error migrating user {user['old_id']}: {e}")
        
        log_message(f"Processed batch {i//batch_size + 1}/{(len(users_df)-1)//batch_size + 1}")
    
    if errors:
        log_message(f"Migration completed with {len(errors)} errors")
        for error in errors[:10]:  # Show first 10 errors
            log_message(f"  - {error}")
    
    return total_count, migrated_count

def migrate_projects(source_engine, dest_engine, batch_size, dry_run=False):
    log_message("Starting projects migration...")
    
    # Read projects from source
    query = """
    SELECT 
        p.id as old_id,
        p.name,
        p.description,
        p.type,
        p.location,
        p.area_sqft,
        p.floors,
        p.status,
        p.owner_id as old_owner_id,
        p.total_cost,
        p.created_at,
        p.updated_at
    FROM projects p
    ORDER BY p.id
    """
    
    projects_df = pd.read_sql(query, source_engine)
    total_count = len(projects_df)
    log_message(f"Found {total_count} projects to migrate")
    
    if dry_run:
        log_message("DRY RUN: Would migrate projects")
        return total_count, 0
    
    # Get user mappings
    user_mappings = {}
    mapping_query = "SELECT old_id, new_id FROM migration_mapping WHERE table_name = 'users'"
    mappings_df = pd.read_sql(mapping_query, dest_engine)
    for _, row in mappings_df.iterrows():
        user_mappings[row['old_id']] = row['new_id']
    
    migrated_count = 0
    errors = []
    
    # Process in batches
    for i in range(0, len(projects_df), batch_size):
        batch = projects_df.iloc[i:i+batch_size]
        
        for _, project in batch.iterrows():
            try:
                # Generate new UUID
                new_id = str(uuid.uuid4())
                
                # Map owner ID
                old_owner_id = str(project['old_owner_id'])
                new_owner_id = user_mappings.get(old_owner_id)
                
                if not new_owner_id:
                    log_message(f"Warning: Owner ID {old_owner_id} not found in mappings")
                    continue
                
                # Insert project
                insert_query = text("""
                INSERT INTO projects (
                    id, name, description, type, location, area_sqft, floors,
                    status, owner_id, total_cost, created_at, updated_at
                ) VALUES (
                    :id, :name, :description, :type, :location, :area_sqft, :floors,
                    :status, :owner_id, :total_cost, :created_at, :updated_at
                )
                """)
                
                dest_engine.execute(insert_query, {
                    'id': new_id,
                    'name': project['name'],
                    'description': project['description'],
                    'type': project['type'],
                    'location': project['location'],
                    'area_sqft': project['area_sqft'],
                    'floors': project['floors'],
                    'status': project['status'],
                    'owner_id': new_owner_id,
                    'total_cost': project['total_cost'],
                    'created_at': project['created_at'],
                    'updated_at': project['updated_at']
                })
                
                # Store mapping
                mapping_query = text("""
                INSERT INTO migration_mapping (table_name, old_id, new_id)
                VALUES (:table_name, :old_id, :new_id)
                """)
                
                dest_engine.execute(mapping_query, {
                    'table_name': 'projects',
                    'old_id': str(project['old_id']),
                    'new_id': new_id
                })
                
                migrated_count += 1
                
            except Exception as e:
                errors.append(f"Project {project['old_id']}: {str(e)}")
                log_message(f"Error migrating project {project['old_id']}: {e}")
        
        log_message(f"Processed batch {i//batch_size + 1}/{(len(projects_df)-1)//batch_size + 1}")
    
    return total_count, migrated_count

def migrate_costs(source_engine, dest_engine, batch_size, dry_run=False):
    log_message("Starting costs migration...")
    
    # Read costs from source
    query = """
    SELECT 
        c.id as old_id,
        c.project_id as old_project_id,
        c.category,
        c.item_name,
        c.quantity,
        c.unit_cost,
        c.total_cost,
        c.notes,
        c.created_at,
        c.updated_at
    FROM costs c
    ORDER BY c.id
    """
    
    costs_df = pd.read_sql(query, source_engine)
    total_count = len(costs_df)
    log_message(f"Found {total_count} cost entries to migrate")
    
    if dry_run:
        log_message("DRY RUN: Would migrate costs")
        return total_count, 0
    
    # Get project mappings
    project_mappings = {}
    mapping_query = "SELECT old_id, new_id FROM migration_mapping WHERE table_name = 'projects'"
    mappings_df = pd.read_sql(mapping_query, dest_engine)
    for _, row in mappings_df.iterrows():
        project_mappings[row['old_id']] = row['new_id']
    
    migrated_count = 0
    errors = []
    
    # Process in batches
    for i in range(0, len(costs_df), batch_size):
        batch = costs_df.iloc[i:i+batch_size]
        
        for _, cost in batch.iterrows():
            try:
                # Generate new UUID
                new_id = str(uuid.uuid4())
                
                # Map project ID
                old_project_id = str(cost['old_project_id'])
                new_project_id = project_mappings.get(old_project_id)
                
                if not new_project_id:
                    log_message(f"Warning: Project ID {old_project_id} not found in mappings")
                    continue
                
                # Insert cost
                insert_query = text("""
                INSERT INTO costs (
                    id, project_id, category, item_name, quantity, unit_cost,
                    total_cost, notes, created_at, updated_at
                ) VALUES (
                    :id, :project_id, :category, :item_name, :quantity, :unit_cost,
                    :total_cost, :notes, :created_at, :updated_at
                )
                """)
                
                dest_engine.execute(insert_query, {
                    'id': new_id,
                    'project_id': new_project_id,
                    'category': cost['category'],
                    'item_name': cost['item_name'],
                    'quantity': cost['quantity'],
                    'unit_cost': cost['unit_cost'],
                    'total_cost': cost['total_cost'],
                    'notes': cost['notes'],
                    'created_at': cost['created_at'],
                    'updated_at': cost['updated_at']
                })
                
                # Store mapping
                mapping_query = text("""
                INSERT INTO migration_mapping (table_name, old_id, new_id)
                VALUES (:table_name, :old_id, :new_id)
                """)
                
                dest_engine.execute(mapping_query, {
                    'table_name': 'costs',
                    'old_id': str(cost['old_id']),
                    'new_id': new_id
                })
                
                migrated_count += 1
                
            except Exception as e:
                errors.append(f"Cost {cost['old_id']}: {str(e)}")
                log_message(f"Error migrating cost {cost['old_id']}: {e}")
        
        log_message(f"Processed batch {i//batch_size + 1}/{(len(costs_df)-1)//batch_size + 1}")
    
    return total_count, migrated_count

def main():
    source_db = sys.argv[1]
    dest_db = sys.argv[2]
    table_filter = sys.argv[3]
    batch_size = int(sys.argv[4])
    dry_run = sys.argv[5] == 'true'
    
    # Create engines
    source_engine = create_engine(source_db)
    dest_engine = create_engine(dest_db)
    
    results = {}
    
    # Migrate data based on filter
    if table_filter in ['all', 'users']:
        total, migrated = migrate_users(source_engine, dest_engine, batch_size, dry_run)
        results['users'] = {'total': total, 'migrated': migrated}
    
    if table_filter in ['all', 'projects']:
        total, migrated = migrate_projects(source_engine, dest_engine, batch_size, dry_run)
        results['projects'] = {'total': total, 'migrated': migrated}
    
    if table_filter in ['all', 'costs']:
        total, migrated = migrate_costs(source_engine, dest_engine, batch_size, dry_run)
        results['costs'] = {'total': total, 'migrated': migrated}
    
    # Output results as JSON
    print("MIGRATION_RESULTS_JSON_START")
    print(json.dumps(results))
    print("MIGRATION_RESULTS_JSON_END")

if __name__ == "__main__":
    main()
EOF
}

# Save migration progress
save_progress() {
    local table=$1
    local status=$2
    local total_count=$3
    local migrated_count=$4
    local error_message=${5:-""}
    
    local progress=$(cat "$PROGRESS_FILE" 2>/dev/null || echo '{}')
    
    progress=$(echo "$progress" | python3 -c "
import sys, json
data = json.load(sys.stdin)
data['$table'] = {
    'status': '$status',
    'total_count': $total_count,
    'migrated_count': $migrated_count,
    'error_message': '$error_message',
    'timestamp': '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'
}
print(json.dumps(data, indent=2))
")
    
    echo "$progress" > "$PROGRESS_FILE"
}

# Run data migration
run_migration() {
    local table=$1
    
    log "Starting migration for table: $table"
    
    # Update migration status
    psql "$DEST_DB" << EOF
INSERT INTO migration_status (table_name, start_time, status)
VALUES ('$table', CURRENT_TIMESTAMP, 'running')
ON CONFLICT (table_name) DO UPDATE SET
    start_time = CURRENT_TIMESTAMP,
    status = 'running',
    error_message = NULL;
EOF
    
    # Create migration script
    create_migration_script
    
    # Run migration
    local output
    if output=$(python3 /tmp/migrate_data.py "$SOURCE_DB" "$DEST_DB" "$table" "$BATCH_SIZE" "$DRY_RUN" 2>&1); then
        # Extract JSON results
        local results=$(echo "$output" | sed -n '/MIGRATION_RESULTS_JSON_START/,/MIGRATION_RESULTS_JSON_END/p' | sed '1d;$d')
        
        if [ -n "$results" ]; then
            # Parse results
            local table_info=$(echo "$results" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for table_name, info in data.items():
    print(f'{table_name}:{info[\"total\"]}:{info[\"migrated\"]}')
")
            
            while IFS=':' read -r table_name total_count migrated_count; do
                log_success "Migration completed for $table_name: $migrated_count/$total_count records"
                
                # Update database status
                psql "$DEST_DB" << EOF
UPDATE migration_status 
SET end_time = CURRENT_TIMESTAMP,
    status = 'completed',
    source_count = $total_count,
    migrated_count = $migrated_count
WHERE table_name = '$table_name';
EOF
                
                # Save progress
                save_progress "$table_name" "completed" "$total_count" "$migrated_count"
                
            done <<< "$table_info"
        fi
    else
        log_error "Migration failed for $table: $output"
        
        # Update database status
        psql "$DEST_DB" << EOF
UPDATE migration_status 
SET end_time = CURRENT_TIMESTAMP,
    status = 'failed',
    error_message = '$output'
WHERE table_name = '$table';
EOF
        
        # Save progress
        save_progress "$table" "failed" "0" "0" "$output"
        return 1
    fi
    
    # Cleanup
    rm -f /tmp/migrate_data.py
}

# Validate migrated data
validate_migration() {
    local table=$1
    
    log "Validating migration for table: $table"
    
    # Get counts from both databases
    local source_count=$(python3 -c "
from sqlalchemy import create_engine
engine = create_engine('$SOURCE_DB')
result = engine.execute('SELECT COUNT(*) FROM $table')
print(result.fetchone()[0])
")
    
    local dest_count=$(psql -t "$DEST_DB" -c "SELECT COUNT(*) FROM $table" | xargs)
    
    log "Source count: $source_count"
    log "Destination count: $dest_count"
    
    if [ "$source_count" -eq "$dest_count" ]; then
        log_success "Validation passed for $table"
        return 0
    else
        log_error "Validation failed for $table: counts don't match"
        return 1
    fi
}

# Generate migration report
generate_report() {
    local report_file="/var/reports/migration/migration_report_$(date +%Y%m%d_%H%M%S).html"
    mkdir -p "$(dirname "$report_file")"
    
    log "Generating migration report: $report_file"
    
    # Get migration status from database
    local migration_data=$(psql -t "$DEST_DB" -c "
    SELECT 
        table_name,
        source_count,
        migrated_count,
        status,
        EXTRACT(EPOCH FROM (end_time - start_time)) as duration,
        error_message
    FROM migration_status 
    ORDER BY table_name
    " | sed '/^$/d')
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Data Migration Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #5cb85c; }
        .error { border-left-color: #d9534f; }
        .warning { border-left-color: #f0ad4e; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-completed { color: green; font-weight: bold; }
        .status-failed { color: red; font-weight: bold; }
        .status-running { color: orange; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Data Migration Report</h1>
        <p>Generated: $(date)</p>
        <p>Source Database: ${SOURCE_DB%:*}</p>
        <p>Destination Database: ${DEST_DB%:*}</p>
    </div>
    
    <div class="summary">
        <h2>Migration Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Table</th>
                    <th>Source Count</th>
                    <th>Migrated Count</th>
                    <th>Status</th>
                    <th>Duration (s)</th>
                    <th>Error Message</th>
                </tr>
            </thead>
            <tbody>
EOF
    
    while IFS='|' read -r table_name source_count migrated_count status duration error_message; do
        # Clean up the values
        table_name=$(echo "$table_name" | xargs)
        source_count=$(echo "$source_count" | xargs)
        migrated_count=$(echo "$migrated_count" | xargs)
        status=$(echo "$status" | xargs)
        duration=$(echo "$duration" | xargs)
        error_message=$(echo "$error_message" | xargs)
        
        cat >> "$report_file" << EOF
                <tr>
                    <td>$table_name</td>
                    <td>$source_count</td>
                    <td>$migrated_count</td>
                    <td><span class="status-$status">$status</span></td>
                    <td>$duration</td>
                    <td>$error_message</td>
                </tr>
EOF
    done <<< "$migration_data"
    
    cat >> "$report_file" << EOF
            </tbody>
        </table>
    </div>
    
    <div class="summary">
        <h2>Migration Log</h2>
        <pre>$(tail -100 "$MIGRATION_LOG" 2>/dev/null || echo "Log file not available")</pre>
    </div>
    
    <div class="summary">
        <h2>Next Steps</h2>
        <ul>
            <li>Verify data integrity in destination database</li>
            <li>Update application configuration to use new database</li>
            <li>Run comprehensive tests</li>
            <li>Create backup of old system before decommissioning</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Migration report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Data Migration Started"
    log "========================================="
    
    if [ "$DRY_RUN" = true ]; then
        log "*** DRY RUN MODE - No changes will be made ***"
    fi
    
    check_prerequisites
    test_connections
    
    if [ "$RESUME_MIGRATION" = false ]; then
        create_migration_tables
    fi
    
    # Determine tables to migrate
    local tables=()
    case $TABLE_FILTER in
        all)
            tables=("users" "projects" "costs")
            ;;
        users|projects|costs)
            tables=("$TABLE_FILTER")
            ;;
        *)
            log_error "Invalid table filter: $TABLE_FILTER"
            exit 1
            ;;
    esac
    
    # Run migrations
    local failed_tables=()
    for table in "${tables[@]}"; do
        if run_migration "$table"; then
            if [ "$VALIDATE_DATA" = true ] && [ "$DRY_RUN" = false ]; then
                validate_migration "$table"
            fi
        else
            failed_tables+=("$table")
        fi
    done
    
    # Summary
    log ""
    log "========================================="
    log "Migration Summary"
    log "========================================="
    
    if [ ${#failed_tables[@]} -eq 0 ]; then
        log_success "All migrations completed successfully"
    else
        log_error "Failed migrations: ${failed_tables[*]}"
    fi
    
    # Generate report
    if [ "$DRY_RUN" = false ]; then
        generate_report
    fi
    
    log "Migration log: $MIGRATION_LOG"
    log "Progress file: $PROGRESS_FILE"
    log "========================================="
    
    # Exit with appropriate code
    if [ ${#failed_tables[@]} -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main