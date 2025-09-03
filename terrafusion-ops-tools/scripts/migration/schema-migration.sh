#!/bin/bash
#
# TerraFusion Schema Migration Script
# Creates and applies database schema changes for migration
#
# Usage: ./schema-migration.sh [options]
# Options:
#   -d    Database connection string
#   -a    Action (create|apply|rollback|validate)
#   -v    Schema version
#   --dry-run    Test migration without making changes

set -euo pipefail

# Configuration
DB_CONNECTION="${DATABASE_URL:-postgresql://terrafusion_user:${DB_PASSWORD:-password}@localhost:5432/terrafusion_production}"
ACTION="create"
SCHEMA_VERSION="v1.0.0"
DRY_RUN=false
MIGRATIONS_DIR="/opt/terrafusion/migrations"
LOG_FILE="/var/log/terrafusion/schema_migration_$(date +%Y%m%d_%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create directories
mkdir -p "$MIGRATIONS_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DB_CONNECTION="$2"
            shift 2
            ;;
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -v|--version)
            SCHEMA_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Usage: $0 [-d db_connection] [-a action] [-v version] [--dry-run]"
            exit 1
            ;;
    esac
done

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

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    if psql "$DB_CONNECTION" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Failed to connect to database"
        exit 1
    fi
}

# Create schema migration tracking tables
create_migration_tables() {
    log "Creating schema migration tracking tables..."
    
    local sql="
-- Schema migrations tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    execution_time INTEGER, -- in milliseconds
    success BOOLEAN DEFAULT TRUE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);
"
    
    if [ "$DRY_RUN" = false ]; then
        psql "$DB_CONNECTION" -c "$sql"
        log_success "Migration tracking tables created"
    else
        log "DRY RUN: Would create migration tracking tables"
    fi
}

# Generate base schema
generate_base_schema() {
    local schema_file="$MIGRATIONS_DIR/001_initial_schema.sql"
    
    log "Generating base schema: $schema_file"
    
    cat > "$schema_file" << 'EOF'
-- TerraFusion Database Schema v1.0.0
-- Initial schema for TerraFusion application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'assessor',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('admin', 'assessor', 'auditor', 'manager', 'guest'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(500),
    area_sqft INTEGER,
    floors INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    estimated_completion DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    CONSTRAINT valid_area CHECK (area_sqft > 0),
    CONSTRAINT valid_floors CHECK (floors > 0)
);

-- Cost items table
CREATE TABLE IF NOT EXISTS costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50),
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    supplier VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_unit_cost CHECK (unit_cost >= 0)
);

-- Project collaborators (many-to-many)
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    
    UNIQUE(project_id, user_id),
    CONSTRAINT valid_collab_role CHECK (role IN ('owner', 'editor', 'viewer'))
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- AI predictions table
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Sessions table (for active user sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_file_size CHECK (file_size > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);

CREATE INDEX IF NOT EXISTS idx_costs_project ON costs(project_id);
CREATE INDEX IF NOT EXISTS idx_costs_category ON costs(category);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_costs_updated_at 
    BEFORE UPDATE ON costs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate project total cost
CREATE OR REPLACE FUNCTION calculate_project_total_cost(project_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(total_cost), 0.00) INTO total
    FROM costs
    WHERE project_id = project_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project total cost when costs change
CREATE OR REPLACE FUNCTION update_project_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET total_cost = calculate_project_total_cost(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.project_id
            ELSE NEW.project_id
        END
    )
    WHERE id = (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.project_id
            ELSE NEW.project_id
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_total_cost
    AFTER INSERT OR UPDATE OR DELETE ON costs
    FOR EACH ROW EXECUTE FUNCTION update_project_total_cost();

-- Create views for common queries
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.type,
    p.status,
    p.area_sqft,
    p.floors,
    p.total_cost,
    u.first_name || ' ' || u.last_name as owner_name,
    u.email as owner_email,
    COUNT(c.id) as cost_items_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
LEFT JOIN costs c ON p.id = c.project_id
GROUP BY p.id, u.first_name, u.last_name, u.email;

-- Create role for application
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'terrafusion_app') THEN
        CREATE ROLE terrafusion_app;
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE terrafusion_production TO terrafusion_app;
GRANT USAGE ON SCHEMA public TO terrafusion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO terrafusion_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO terrafusion_app;

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES (
    'admin',
    'admin@terrafusion.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQdH5QfFoKLLJre', -- admin123
    'System',
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Add database version info
INSERT INTO schema_migrations (version, filename, checksum) 
VALUES (
    '1.0.0',
    '001_initial_schema.sql',
    MD5('initial_schema_v1.0.0')
) ON CONFLICT (version) DO NOTHING;
EOF

    log_success "Base schema generated: $schema_file"
}

# Generate sample migration
generate_sample_migration() {
    local migration_file="$MIGRATIONS_DIR/002_add_project_templates.sql"
    
    log "Generating sample migration: $migration_file"
    
    cat > "$migration_file" << 'EOF'
-- Migration: Add project templates feature
-- Version: 1.1.0

-- Project templates table
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    default_area_sqft INTEGER,
    default_floors INTEGER DEFAULT 1,
    template_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template cost items
CREATE TABLE IF NOT EXISTS template_cost_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    default_quantity DECIMAL(10,2) DEFAULT 1.00,
    unit VARCHAR(50),
    estimated_unit_cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add template_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES project_templates(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_templates_type ON project_templates(type);
CREATE INDEX IF NOT EXISTS idx_project_templates_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_cost_items_template ON template_cost_items(template_id);
CREATE INDEX IF NOT EXISTS idx_projects_template ON projects(template_id);

-- Add trigger for updated_at
CREATE TRIGGER update_project_templates_updated_at 
    BEFORE UPDATE ON project_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample templates
INSERT INTO project_templates (name, description, type, default_area_sqft, default_floors, template_data)
VALUES 
    ('Small Residential House', 'Template for small residential construction projects', 'residential', 1500, 1, '{"style": "modern", "foundation": "slab"}'),
    ('Commercial Office Building', 'Template for commercial office construction', 'commercial', 10000, 3, '{"style": "contemporary", "foundation": "basement"}'),
    ('Industrial Warehouse', 'Template for industrial warehouse projects', 'industrial', 25000, 1, '{"style": "utilitarian", "foundation": "slab"}')
ON CONFLICT DO NOTHING;

-- Insert sample cost items for templates
WITH template_ids AS (
    SELECT id, name FROM project_templates WHERE name IN (
        'Small Residential House', 
        'Commercial Office Building', 
        'Industrial Warehouse'
    )
)
INSERT INTO template_cost_items (template_id, category, item_name, default_quantity, unit, estimated_unit_cost)
SELECT 
    t.id,
    'Foundation',
    'Concrete Foundation',
    1.0,
    'sqft',
    CASE 
        WHEN t.name = 'Small Residential House' THEN 8.50
        WHEN t.name = 'Commercial Office Building' THEN 12.00
        ELSE 6.75
    END
FROM template_ids t
UNION ALL
SELECT 
    t.id,
    'Framing',
    'Steel Framing',
    1.0,
    'sqft',
    CASE 
        WHEN t.name = 'Small Residential House' THEN 15.25
        WHEN t.name = 'Commercial Office Building' THEN 22.50
        ELSE 18.75
    END
FROM template_ids t;
EOF

    log_success "Sample migration generated: $migration_file"
}

# Calculate file checksum
calculate_checksum() {
    local file=$1
    md5sum "$file" | cut -d' ' -f1
}

# Apply migration
apply_migration() {
    local migration_file=$1
    local version=$2
    
    log "Applying migration: $migration_file"
    
    # Check if already applied
    local applied=$(psql -t "$DB_CONNECTION" -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version'" | xargs)
    
    if [ "$applied" -gt 0 ]; then
        log "Migration $version already applied, skipping"
        return 0
    fi
    
    # Calculate checksum
    local checksum=$(calculate_checksum "$migration_file")
    local start_time=$(date +%s%3N)
    
    if [ "$DRY_RUN" = false ]; then
        # Apply migration
        if psql "$DB_CONNECTION" -f "$migration_file"; then
            local end_time=$(date +%s%3N)
            local execution_time=$((end_time - start_time))
            
            # Record successful migration
            psql "$DB_CONNECTION" -c "
            INSERT INTO schema_migrations (version, filename, checksum, execution_time, success)
            VALUES ('$version', '$(basename "$migration_file")', '$checksum', $execution_time, TRUE)
            "
            
            log_success "Migration $version applied successfully in ${execution_time}ms"
        else
            # Record failed migration
            psql "$DB_CONNECTION" -c "
            INSERT INTO schema_migrations (version, filename, checksum, success)
            VALUES ('$version', '$(basename "$migration_file")', '$checksum', FALSE)
            " || true
            
            log_error "Migration $version failed"
            return 1
        fi
    else
        log "DRY RUN: Would apply migration $version"
    fi
}

# Rollback migration
rollback_migration() {
    local version=$1
    
    log "Rolling back migration: $version"
    
    # Check if migration was applied
    local migration_info=$(psql -t "$DB_CONNECTION" -c "
    SELECT filename, applied_at 
    FROM schema_migrations 
    WHERE version = '$version' AND success = TRUE
    " | xargs)
    
    if [ -z "$migration_info" ]; then
        log_error "Migration $version not found or not successfully applied"
        return 1
    fi
    
    # Look for rollback script
    local rollback_file="$MIGRATIONS_DIR/rollback_${version}.sql"
    
    if [ -f "$rollback_file" ]; then
        log "Found rollback script: $rollback_file"
        
        if [ "$DRY_RUN" = false ]; then
            if psql "$DB_CONNECTION" -f "$rollback_file"; then
                # Remove from migrations table
                psql "$DB_CONNECTION" -c "DELETE FROM schema_migrations WHERE version = '$version'"
                log_success "Migration $version rolled back successfully"
            else
                log_error "Rollback failed for migration $version"
                return 1
            fi
        else
            log "DRY RUN: Would rollback migration $version"
        fi
    else
        log_error "No rollback script found for migration $version"
        log "Manual rollback required"
        return 1
    fi
}

# Validate schema
validate_schema() {
    log "Validating database schema..."
    
    # Check for missing tables
    local required_tables=("users" "projects" "costs" "schema_migrations")
    local missing_tables=()
    
    for table in "${required_tables[@]}"; do
        local exists=$(psql -t "$DB_CONNECTION" -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name = '$table' AND table_schema = 'public'
        " | xargs)
        
        if [ "$exists" -eq 0 ]; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -gt 0 ]; then
        log_error "Missing tables: ${missing_tables[*]}"
        return 1
    fi
    
    # Check for required indexes
    local required_indexes=("idx_users_email" "idx_projects_owner" "idx_costs_project")
    local missing_indexes=()
    
    for index in "${required_indexes[@]}"; do
        local exists=$(psql -t "$DB_CONNECTION" -c "
        SELECT COUNT(*) FROM pg_indexes 
        WHERE indexname = '$index' AND schemaname = 'public'
        " | xargs)
        
        if [ "$exists" -eq 0 ]; then
            missing_indexes+=("$index")
        fi
    done
    
    if [ ${#missing_indexes[@]} -gt 0 ]; then
        log_error "Missing indexes: ${missing_indexes[*]}"
        return 1
    fi
    
    # Check constraints
    log "Checking database constraints..."
    local constraint_errors=$(psql -t "$DB_CONNECTION" -c "
    SELECT conname FROM pg_constraint 
    WHERE NOT convalidated AND contype IN ('c', 'f')
    " | xargs)
    
    if [ -n "$constraint_errors" ]; then
        log_error "Invalid constraints found: $constraint_errors"
        return 1
    fi
    
    log_success "Schema validation passed"
}

# Show migration status
show_migration_status() {
    log "Migration Status:"
    log "=================="
    
    psql "$DB_CONNECTION" -c "
    SELECT 
        version,
        filename,
        CASE 
            WHEN success THEN 'SUCCESS'
            ELSE 'FAILED'
        END as status,
        applied_at,
        execution_time || 'ms' as duration
    FROM schema_migrations 
    ORDER BY applied_at DESC
    "
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Schema Migration"
    log "Action: $ACTION"
    log "Version: $SCHEMA_VERSION"
    if [ "$DRY_RUN" = true ]; then
        log "Mode: DRY RUN"
    fi
    log "========================================="
    
    test_connection
    
    case $ACTION in
        create)
            create_migration_tables
            generate_base_schema
            generate_sample_migration
            log_success "Migration files created in $MIGRATIONS_DIR"
            ;;
        apply)
            create_migration_tables
            
            # Apply all pending migrations
            for migration_file in "$MIGRATIONS_DIR"/*.sql; do
                if [ -f "$migration_file" ]; then
                    local version=$(basename "$migration_file" .sql | cut -d'_' -f1)
                    apply_migration "$migration_file" "$version"
                fi
            done
            
            show_migration_status
            ;;
        rollback)
            rollback_migration "$SCHEMA_VERSION"
            show_migration_status
            ;;
        validate)
            validate_schema
            show_migration_status
            ;;
        status)
            show_migration_status
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: create, apply, rollback, validate, status"
            exit 1
            ;;
    esac
    
    log "========================================="
    log "Schema migration completed"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Run main function
main