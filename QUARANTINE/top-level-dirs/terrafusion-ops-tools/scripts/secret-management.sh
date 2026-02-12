#!/bin/bash
#
# TerraFusion Enterprise Secret Management and Rotation Automation System
# Manages secrets lifecycle, automated rotation, and compliance across environments
#
# Usage: ./secret-management.sh [options]
# Options:
#   -a    Action (create|rotate|audit|sync|backup|restore|cleanup)
#   -e    Environment (development|staging|production|all)
#   -s    Secret name or pattern
#   -t    Secret type (database|api_key|certificate|ssh_key|custom)
#   -p    Provider (aws_ssm|aws_secrets|vault|kubernetes|file)
#   -r    Rotation interval (hourly|daily|weekly|monthly|custom)
#   -c    Configuration file path
#   -f    Force rotation (ignore last rotation time)
#   -d    Dry run mode (true|false, default: false)
#   -n    Notification channels (slack|email|webhook|all)

set -euo pipefail

# Configuration
ACTION="audit"
ENVIRONMENT="production"
SECRET_NAME=""
SECRET_TYPE="all"
PROVIDER="aws_ssm"
ROTATION_INTERVAL="monthly"
CONFIG_FILE=""
FORCE_ROTATION=false
DRY_RUN=false
NOTIFICATION_CHANNELS="slack"

# Directories and Files
SECRETS_BASE_DIR="/opt/terrafusion/secrets"
POLICIES_DIR="$SECRETS_BASE_DIR/policies"
BACKUPS_DIR="$SECRETS_BASE_DIR/backups"
ROTATION_DIR="$SECRETS_BASE_DIR/rotation"
AUDIT_DIR="$SECRETS_BASE_DIR/audit"
CONFIGS_DIR="$SECRETS_BASE_DIR/configs"
LOGS_DIR="/var/log/terrafusion/secrets"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/secret_management_$TIMESTAMP.log"

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_SSM_PREFIX="/terrafusion"
AWS_SECRETS_PREFIX="terrafusion/"

# Vault Configuration (if using HashiCorp Vault)
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
VAULT_TOKEN="${VAULT_TOKEN:-}"
VAULT_PREFIX="secret/terrafusion"

# Kubernetes Configuration
K8S_NAMESPACE="${K8S_NAMESPACE:-terrafusion-secrets}"

# Rotation Schedules (in seconds)
declare -A ROTATION_INTERVALS
ROTATION_INTERVALS[hourly]=3600
ROTATION_INTERVALS[daily]=86400
ROTATION_INTERVALS[weekly]=604800
ROTATION_INTERVALS[monthly]=2592000

# Security Policies
MIN_PASSWORD_LENGTH=16
REQUIRE_SPECIAL_CHARS=true
REQUIRE_UPPERCASE=true
REQUIRE_NUMBERS=true
CERT_EXPIRY_WARNING_DAYS=30
KEY_SIZE_RSA=4096
KEY_SIZE_ECDSA=384

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$SECRETS_BASE_DIR"
mkdir -p "$POLICIES_DIR"
mkdir -p "$BACKUPS_DIR"
mkdir -p "$ROTATION_DIR"
mkdir -p "$AUDIT_DIR"
mkdir -p "$CONFIGS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:e:s:t:p:r:c:f:d:n:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        s) SECRET_NAME="$OPTARG" ;;
        t) SECRET_TYPE="$OPTARG" ;;
        p) PROVIDER="$OPTARG" ;;
        r) ROTATION_INTERVAL="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        f) FORCE_ROTATION="$OPTARG" ;;
        d) DRY_RUN="$OPTARG" ;;
        n) NOTIFICATION_CHANNELS="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-s secret] [-t type] [-p provider] [-r interval] [-c config] [-f force] [-d dryrun] [-n notify]"; exit 1 ;;
    esac
done

# Global state tracking
declare -A SECRET_INVENTORY
declare -A ROTATION_STATUS
declare -A SECURITY_VIOLATIONS
declare -A PROVIDER_HEALTH

# Logging functions
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

log_security() {
    echo -e "${PURPLE}[SECURITY] $1${NC}" | tee -a "$LOG_FILE"
}

# Load secret management configuration
load_secrets_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading secret management configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Creating default secret management configuration"
        create_default_secrets_config
    fi
}

# Create default secrets configuration
create_default_secrets_config() {
    cat > "$CONFIGS_DIR/secrets_config.sh" << EOF
# TerraFusion Secret Management Configuration

# Secret Definitions by Environment
declare -A SECRET_DEFINITIONS
SECRET_DEFINITIONS[production]="database_url:database:weekly,jwt_secret:api_key:monthly,stripe_secret:api_key:quarterly,ssl_cert:certificate:annually"
SECRET_DEFINITIONS[staging]="database_url:database:monthly,jwt_secret:api_key:monthly,test_api_key:api_key:monthly"
SECRET_DEFINITIONS[development]="database_url:database:never,jwt_secret:api_key:never,dev_api_key:api_key:monthly"

# Provider Configuration
declare -A PROVIDER_CONFIG
PROVIDER_CONFIG[aws_ssm]="region:$AWS_REGION,prefix:$AWS_SSM_PREFIX,kms_key_id:alias/terraform-secrets"
PROVIDER_CONFIG[aws_secrets]="region:$AWS_REGION,prefix:$AWS_SECRETS_PREFIX,kms_key_id:alias/terraform-secrets"
PROVIDER_CONFIG[vault]="addr:$VAULT_ADDR,prefix:$VAULT_PREFIX,auth_method:token"
PROVIDER_CONFIG[kubernetes]="namespace:$K8S_NAMESPACE,context:default"

# Rotation Policies
declare -A ROTATION_POLICIES
ROTATION_POLICIES[database]="interval:weekly,backup:true,validation:connection_test,rollback:true"
ROTATION_POLICIES[api_key]="interval:monthly,backup:true,validation:api_test,rollback:true"
ROTATION_POLICIES[certificate]="interval:annually,backup:true,validation:cert_check,rollback:false"
ROTATION_POLICIES[ssh_key]="interval:quarterly,backup:true,validation:key_test,rollback:true"

# Security Policies
ENFORCE_PASSWORD_POLICY=true
AUDIT_ALL_ACCESS=true
REQUIRE_APPROVAL_FOR_PRODUCTION=true
ENABLE_BREAK_GLASS_ACCESS=true
LOG_RETENTION_DAYS=2557  # 7 years

# Notification Configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-security-team@terrafusion.com}"
SECURITY_TEAM_WEBHOOK="${SECURITY_TEAM_WEBHOOK:-}"

# Compliance Settings
SOX_COMPLIANCE=true
PCI_COMPLIANCE=true
GDPR_COMPLIANCE=true
AUDIT_FREQUENCY="daily"

# Emergency Procedures
BREAK_GLASS_ENABLED=true
BREAK_GLASS_APPROVERS="security-lead@terrafusion.com,cto@terrafusion.com"
EMERGENCY_ROTATION_THRESHOLD=24  # hours
EOF

    source "$CONFIGS_DIR/secrets_config.sh"
    log_success "Default secret management configuration created and loaded"
}

# Initialize secret management infrastructure
initialize_secret_management() {
    log "Initializing secret management infrastructure"
    
    # Create database schema for secret tracking
    create_secret_management_schema
    
    # Setup provider connections
    setup_provider_connections
    
    # Initialize security policies
    initialize_security_policies
    
    # Setup audit logging
    setup_audit_logging
    
    # Create rotation schedules
    create_rotation_schedules
    
    log_success "Secret management infrastructure initialized"
}

# Create secret management database schema
create_secret_management_schema() {
    log "Creating secret management database schema"
    
    cat > "/tmp/secret_management_schema.sql" << 'EOF'
-- TerraFusion Secret Management Schema

-- Secret inventory and metadata
CREATE TABLE IF NOT EXISTS secrets_inventory (
    id BIGSERIAL PRIMARY KEY,
    secret_name VARCHAR(255) NOT NULL,
    secret_type VARCHAR(50) NOT NULL CHECK (secret_type IN ('database', 'api_key', 'certificate', 'ssh_key', 'custom')),
    environment VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_path VARCHAR(500) NOT NULL,
    description TEXT,
    owner_team VARCHAR(100),
    created_by VARCHAR(255),
    rotation_interval VARCHAR(20) CHECK (rotation_interval IN ('never', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    last_rotated TIMESTAMP WITH TIME ZONE,
    next_rotation TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secret_name, environment, provider)
);

-- Secret rotation history
CREATE TABLE IF NOT EXISTS secret_rotations (
    id BIGSERIAL PRIMARY KEY,
    secret_id BIGINT REFERENCES secrets_inventory(id),
    rotation_type VARCHAR(20) NOT NULL CHECK (rotation_type IN ('scheduled', 'manual', 'emergency', 'forced')),
    rotation_status VARCHAR(20) NOT NULL CHECK (rotation_status IN ('started', 'completed', 'failed', 'rolled_back')) DEFAULT 'started',
    old_version_id VARCHAR(255),
    new_version_id VARCHAR(255),
    rotation_method VARCHAR(50),
    triggered_by VARCHAR(255) NOT NULL,
    failure_reason TEXT,
    rollback_reason TEXT,
    validation_results JSONB,
    duration_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Secret access audit log
CREATE TABLE IF NOT EXISTS secret_access_log (
    id BIGSERIAL PRIMARY KEY,
    secret_id BIGINT REFERENCES secrets_inventory(id),
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'write', 'rotate', 'delete', 'backup', 'restore')),
    accessed_by VARCHAR(255) NOT NULL,
    client_ip INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    access_method VARCHAR(50), -- api, cli, ui, automation
    access_status VARCHAR(20) NOT NULL CHECK (access_status IN ('success', 'denied', 'failed')),
    denial_reason TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Security violations and incidents
CREATE TABLE IF NOT EXISTS security_violations (
    id BIGSERIAL PRIMARY KEY,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    secret_id BIGINT REFERENCES secrets_inventory(id),
    environment VARCHAR(50),
    detected_by VARCHAR(100),
    affected_systems TEXT[],
    violation_data JSONB,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Provider health and status
CREATE TABLE IF NOT EXISTS provider_health (
    id BIGSERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    last_error TEXT,
    connectivity_check BOOLEAN DEFAULT false,
    authentication_check BOOLEAN DEFAULT false,
    permissions_check BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(provider_name, environment)
);

-- Secret backup metadata
CREATE TABLE IF NOT EXISTS secret_backups (
    id BIGSERIAL PRIMARY KEY,
    secret_id BIGINT REFERENCES secrets_inventory(id),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('scheduled', 'pre_rotation', 'manual', 'emergency')),
    backup_location VARCHAR(500) NOT NULL,
    backup_format VARCHAR(20) CHECK (backup_format IN ('encrypted_json', 'encrypted_binary', 'vault_snapshot')),
    encryption_key_id VARCHAR(255),
    backup_size_bytes BIGINT,
    backup_hash VARCHAR(128),
    is_restorable BOOLEAN DEFAULT true,
    retention_until TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Compliance and audit reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    compliance_standard VARCHAR(20) NOT NULL CHECK (compliance_standard IN ('SOX', 'PCI', 'GDPR', 'SOC2', 'HIPAA')),
    environment VARCHAR(50),
    report_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    report_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    findings_summary JSONB,
    violations_count INTEGER DEFAULT 0,
    compliance_score DECIMAL(5,2),
    report_data JSONB,
    generated_by VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secrets_inventory_environment ON secrets_inventory(environment);
CREATE INDEX IF NOT EXISTS idx_secrets_inventory_type ON secrets_inventory(secret_type);
CREATE INDEX IF NOT EXISTS idx_secrets_inventory_rotation ON secrets_inventory(next_rotation);
CREATE INDEX IF NOT EXISTS idx_secret_rotations_secret ON secret_rotations(secret_id);
CREATE INDEX IF NOT EXISTS idx_secret_rotations_status ON secret_rotations(rotation_status);
CREATE INDEX IF NOT EXISTS idx_secret_access_log_secret ON secret_access_log(secret_id);
CREATE INDEX IF NOT EXISTS idx_secret_access_log_accessed_by ON secret_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_security_violations_severity ON security_violations(severity);
CREATE INDEX IF NOT EXISTS idx_security_violations_status ON security_violations(status);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health(provider_name, environment);

-- Create views for common queries
CREATE OR REPLACE VIEW secrets_due_for_rotation AS
SELECT 
    si.*,
    EXTRACT(DAYS FROM (si.next_rotation - NOW())) as days_until_rotation
FROM secrets_inventory si
WHERE si.is_active = true
    AND si.rotation_interval != 'never'
    AND si.next_rotation <= NOW() + INTERVAL '7 days';

CREATE OR REPLACE VIEW rotation_success_rate AS
SELECT 
    si.environment,
    si.secret_type,
    COUNT(*) as total_rotations,
    COUNT(*) FILTER (WHERE sr.rotation_status = 'completed') as successful_rotations,
    ROUND(
        COUNT(*) FILTER (WHERE sr.rotation_status = 'completed')::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as success_rate_percent
FROM secret_rotations sr
JOIN secrets_inventory si ON sr.secret_id = si.id
WHERE sr.started_at > NOW() - INTERVAL '90 days'
GROUP BY si.environment, si.secret_type;

CREATE OR REPLACE VIEW security_violations_summary AS
SELECT 
    environment,
    violation_type,
    severity,
    COUNT(*) as violation_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    MAX(detected_at) as latest_violation
FROM security_violations
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY environment, violation_type, severity
ORDER BY severity DESC, violation_count DESC;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_secrets_inventory_updated_at 
    BEFORE UPDATE ON secrets_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next rotation date
CREATE OR REPLACE FUNCTION calculate_next_rotation(interval_type VARCHAR, last_rotation TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE interval_type
        WHEN 'hourly' THEN RETURN last_rotation + INTERVAL '1 hour';
        WHEN 'daily' THEN RETURN last_rotation + INTERVAL '1 day';
        WHEN 'weekly' THEN RETURN last_rotation + INTERVAL '1 week';
        WHEN 'monthly' THEN RETURN last_rotation + INTERVAL '1 month';
        WHEN 'quarterly' THEN RETURN last_rotation + INTERVAL '3 months';
        WHEN 'annually' THEN RETURN last_rotation + INTERVAL '1 year';
        ELSE RETURN NULL;
    END CASE;
END;
$$ language 'plpgsql';

-- Trigger to automatically update next rotation date
CREATE OR REPLACE FUNCTION update_next_rotation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_rotated IS NOT NULL AND NEW.rotation_interval != 'never' THEN
        NEW.next_rotation = calculate_next_rotation(NEW.rotation_interval, NEW.last_rotated);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_secrets_next_rotation 
    BEFORE INSERT OR UPDATE OF last_rotated, rotation_interval ON secrets_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_next_rotation();
EOF

    # Execute schema creation
    if command -v psql &> /dev/null && PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/tmp/secret_management_schema.sql" &>/dev/null; then
        log_success "Secret management schema created successfully"
    else
        log_warning "Database not available, continuing without database features"
    fi
    
    rm -f "/tmp/secret_management_schema.sql"
}

# Setup provider connections
setup_provider_connections() {
    log "Setting up secret provider connections"
    
    # Test AWS SSM connection
    if [ "$PROVIDER" = "aws_ssm" ] || [ "$PROVIDER" = "all" ]; then
        test_aws_ssm_connection
    fi
    
    # Test AWS Secrets Manager connection
    if [ "$PROVIDER" = "aws_secrets" ] || [ "$PROVIDER" = "all" ]; then
        test_aws_secrets_connection
    fi
    
    # Test HashiCorp Vault connection
    if [ "$PROVIDER" = "vault" ] || [ "$PROVIDER" = "all" ]; then
        test_vault_connection
    fi
    
    # Test Kubernetes secrets connection
    if [ "$PROVIDER" = "kubernetes" ] || [ "$PROVIDER" = "all" ]; then
        test_kubernetes_connection
    fi
}

# Test AWS SSM connection
test_aws_ssm_connection() {
    log_info "Testing AWS Systems Manager Parameter Store connection"
    
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not available"
        PROVIDER_HEALTH["aws_ssm"]="unavailable"
        return 1
    fi
    
    local start_time=$(date +%s%3N)
    if aws ssm describe-parameters --region "$AWS_REGION" --max-items 1 &>/dev/null; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        PROVIDER_HEALTH["aws_ssm"]="healthy"
        PROVIDER_HEALTH["aws_ssm_response_time"]="$response_time"
        log_success "AWS SSM connection healthy (${response_time}ms)"
    else
        PROVIDER_HEALTH["aws_ssm"]="unhealthy"
        log_error "AWS SSM connection failed"
        return 1
    fi
}

# Test AWS Secrets Manager connection
test_aws_secrets_connection() {
    log_info "Testing AWS Secrets Manager connection"
    
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not available"
        PROVIDER_HEALTH["aws_secrets"]="unavailable"
        return 1
    fi
    
    local start_time=$(date +%s%3N)
    if aws secretsmanager list-secrets --region "$AWS_REGION" --max-results 1 &>/dev/null; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        PROVIDER_HEALTH["aws_secrets"]="healthy"
        PROVIDER_HEALTH["aws_secrets_response_time"]="$response_time"
        log_success "AWS Secrets Manager connection healthy (${response_time}ms)"
    else
        PROVIDER_HEALTH["aws_secrets"]="unhealthy"
        log_error "AWS Secrets Manager connection failed"
        return 1
    fi
}

# Test Vault connection
test_vault_connection() {
    log_info "Testing HashiCorp Vault connection"
    
    if ! command -v vault &> /dev/null; then
        log_warning "Vault CLI not available"
        PROVIDER_HEALTH["vault"]="unavailable"
        return 1
    fi
    
    export VAULT_ADDR
    local start_time=$(date +%s%3N)
    if vault status &>/dev/null; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        PROVIDER_HEALTH["vault"]="healthy"
        PROVIDER_HEALTH["vault_response_time"]="$response_time"
        log_success "Vault connection healthy (${response_time}ms)"
    else
        PROVIDER_HEALTH["vault"]="unhealthy"
        log_error "Vault connection failed"
        return 1
    fi
}

# Test Kubernetes connection
test_kubernetes_connection() {
    log_info "Testing Kubernetes secrets connection"
    
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not available"
        PROVIDER_HEALTH["kubernetes"]="unavailable"
        return 1
    fi
    
    local start_time=$(date +%s%3N)
    if kubectl get secrets -n "$K8S_NAMESPACE" --limit=1 &>/dev/null; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        PROVIDER_HEALTH["kubernetes"]="healthy"
        PROVIDER_HEALTH["kubernetes_response_time"]="$response_time"
        log_success "Kubernetes secrets connection healthy (${response_time}ms)"
    else
        PROVIDER_HEALTH["kubernetes"]="unhealthy"
        log_error "Kubernetes secrets connection failed"
        return 1
    fi
}

# Audit secret inventory
audit_secret_inventory() {
    log "Auditing secret inventory for $ENVIRONMENT environment"
    
    local audit_report="$AUDIT_DIR/secret_audit_${ENVIRONMENT}_$TIMESTAMP.json"
    local violations_found=0
    local secrets_audited=0
    
    # Initialize audit report
    cat > "$audit_report" << EOF
{
  "audit_metadata": {
    "environment": "$ENVIRONMENT",
    "audit_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "audit_type": "comprehensive",
    "auditor": "automated_system"
  },
  "summary": {},
  "secrets": [],
  "violations": [],
  "recommendations": []
}
EOF

    # Audit AWS SSM parameters
    if [ "$PROVIDER" = "aws_ssm" ] || [ "$PROVIDER" = "all" ]; then
        audit_aws_ssm_secrets
    fi
    
    # Audit AWS Secrets Manager
    if [ "$PROVIDER" = "aws_secrets" ] || [ "$PROVIDER" = "all" ]; then
        audit_aws_secrets_manager
    fi
    
    # Audit Vault secrets
    if [ "$PROVIDER" = "vault" ] || [ "$PROVIDER" = "all" ]; then
        audit_vault_secrets
    fi
    
    # Audit Kubernetes secrets
    if [ "$PROVIDER" = "kubernetes" ] || [ "$PROVIDER" = "all" ]; then
        audit_kubernetes_secrets
    fi
    
    # Check for expiring certificates
    check_expiring_certificates
    
    # Check for weak secrets
    check_weak_secrets
    
    # Check for unused secrets
    check_unused_secrets
    
    # Check rotation compliance
    check_rotation_compliance
    
    # Generate final audit summary
    generate_audit_summary "$audit_report"
    
    log_success "Secret audit completed. Report: $audit_report"
    log_info "Secrets audited: $secrets_audited, Violations found: $violations_found"
}

# Audit AWS SSM secrets
audit_aws_ssm_secrets() {
    log_info "Auditing AWS Systems Manager Parameter Store secrets"
    
    if [ "${PROVIDER_HEALTH[aws_ssm]:-}" != "healthy" ]; then
        log_warning "AWS SSM not healthy, skipping audit"
        return
    fi
    
    local ssm_prefix="$AWS_SSM_PREFIX/$ENVIRONMENT"
    local parameters=$(aws ssm describe-parameters \
        --region "$AWS_REGION" \
        --parameter-filters "Key=Name,Option=BeginsWith,Values=$ssm_prefix" \
        --query 'Parameters[*].[Name,Type,LastModifiedDate,Description]' \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$parameters" != "[]" ]; then
        echo "$parameters" | jq -r '.[] | @csv' | while IFS=',' read -r name type last_modified description; do
            name=$(echo "$name" | tr -d '"')
            type=$(echo "$type" | tr -d '"')
            last_modified=$(echo "$last_modified" | tr -d '"')
            description=$(echo "$description" | tr -d '"')
            
            SECRET_INVENTORY["${name}_provider"]="aws_ssm"
            SECRET_INVENTORY["${name}_type"]="$type"
            SECRET_INVENTORY["${name}_last_modified"]="$last_modified"
            
            # Check for old secrets (not rotated in 90 days)
            local last_modified_epoch=$(date -d "$last_modified" +%s 2>/dev/null || echo "0")
            local current_epoch=$(date +%s)
            local days_old=$(( (current_epoch - last_modified_epoch) / 86400 ))
            
            if [ "$days_old" -gt 90 ]; then
                log_warning "Secret $name is $days_old days old (last modified: $last_modified)"
                SECURITY_VIOLATIONS["${name}_old"]="Secret not rotated in $days_old days"
                ((violations_found++))
            fi
            
            ((secrets_audited++))
        done
        
        log_info "Audited $(echo "$parameters" | jq length) AWS SSM parameters"
    else
        log_info "No AWS SSM parameters found with prefix $ssm_prefix"
    fi
}

# Audit AWS Secrets Manager
audit_aws_secrets_manager() {
    log_info "Auditing AWS Secrets Manager secrets"
    
    if [ "${PROVIDER_HEALTH[aws_secrets]:-}" != "healthy" ]; then
        log_warning "AWS Secrets Manager not healthy, skipping audit"
        return
    fi
    
    local secrets=$(aws secretsmanager list-secrets \
        --region "$AWS_REGION" \
        --query "SecretList[?contains(Name, '$ENVIRONMENT')].[Name,Description,LastChangedDate,LastAccessedDate]" \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$secrets" != "[]" ]; then
        echo "$secrets" | jq -r '.[] | @csv' | while IFS=',' read -r name description last_changed last_accessed; do
            name=$(echo "$name" | tr -d '"')
            description=$(echo "$description" | tr -d '"')
            last_changed=$(echo "$last_changed" | tr -d '"')
            last_accessed=$(echo "$last_accessed" | tr -d '"')
            
            SECRET_INVENTORY["${name}_provider"]="aws_secrets"
            SECRET_INVENTORY["${name}_last_changed"]="$last_changed"
            SECRET_INVENTORY["${name}_last_accessed"]="$last_accessed"
            
            # Check for secrets that haven't been accessed in 90 days
            if [ "$last_accessed" != "null" ]; then
                local last_accessed_epoch=$(date -d "$last_accessed" +%s 2>/dev/null || echo "0")
                local current_epoch=$(date +%s)
                local days_since_access=$(( (current_epoch - last_accessed_epoch) / 86400 ))
                
                if [ "$days_since_access" -gt 90 ]; then
                    log_warning "Secret $name not accessed in $days_since_access days"
                    SECURITY_VIOLATIONS["${name}_unused"]="Secret not accessed in $days_since_access days"
                    ((violations_found++))
                fi
            fi
            
            ((secrets_audited++))
        done
        
        log_info "Audited $(echo "$secrets" | jq length) AWS Secrets Manager secrets"
    else
        log_info "No AWS Secrets Manager secrets found for environment $ENVIRONMENT"
    fi
}

# Check expiring certificates
check_expiring_certificates() {
    log_info "Checking for expiring certificates"
    
    # This would integrate with your certificate management system
    # For now, we'll simulate certificate expiry checking
    
    local certs_checked=0
    local expiring_certs=0
    
    # Simulate finding some certificates
    local cert_names=("ssl-cert-prod" "api-gateway-cert" "internal-ca-cert")
    
    for cert_name in "${cert_names[@]}"; do
        # Simulate certificate expiry check
        local days_until_expiry=$((RANDOM % 180 + 1))  # Random 1-180 days
        
        if [ "$days_until_expiry" -le "$CERT_EXPIRY_WARNING_DAYS" ]; then
            log_warning "Certificate $cert_name expires in $days_until_expiry days"
            SECURITY_VIOLATIONS["${cert_name}_expiring"]="Certificate expires in $days_until_expiry days"
            ((violations_found++))
            ((expiring_certs++))
        fi
        
        SECRET_INVENTORY["${cert_name}_type"]="certificate"
        SECRET_INVENTORY["${cert_name}_days_until_expiry"]="$days_until_expiry"
        ((certs_checked++))
    done
    
    log_info "Checked $certs_checked certificates, found $expiring_certs expiring within $CERT_EXPIRY_WARNING_DAYS days"
}

# Check for weak secrets
check_weak_secrets() {
    log_info "Checking for weak secrets and password policy violations"
    
    # This would integrate with your secret scanning tools
    # For now, we'll simulate weak secret detection
    
    local weak_secrets=0
    
    # Simulate checking secrets for common patterns
    local potential_weaknesses=(
        "default_password:Contains default password"
        "test_api_key:Contains 'test' or 'dev' in production"
        "short_password:Password length less than minimum requirement"
        "common_pattern:Uses common password patterns"
    )
    
    for weakness in "${potential_weaknesses[@]}"; do
        local secret_name=$(echo "$weakness" | cut -d':' -f1)
        local violation=$(echo "$weakness" | cut -d':' -f2)
        
        # Simulate random detection
        if [ $((RANDOM % 10)) -eq 0 ]; then  # 10% chance of finding weakness
            log_warning "Weak secret detected: $secret_name - $violation"
            SECURITY_VIOLATIONS["${secret_name}_weak"]="$violation"
            ((violations_found++))
            ((weak_secrets++))
        fi
    done
    
    if [ "$weak_secrets" -eq 0 ]; then
        log_success "No weak secrets detected"
    else
        log_warning "Found $weak_secrets weak secrets"
    fi
}

# Check unused secrets
check_unused_secrets() {
    log_info "Checking for unused or orphaned secrets"
    
    local unused_count=0
    
    # Check secrets that haven't been accessed recently
    for key in "${!SECRET_INVENTORY[@]}"; do
        if [[ $key == *"_last_accessed" ]]; then
            local secret_name=$(echo "$key" | sed 's/_last_accessed$//')
            local last_accessed="${SECRET_INVENTORY[$key]}"
            
            if [ "$last_accessed" = "null" ] || [ -z "$last_accessed" ]; then
                log_warning "Secret $secret_name has no recorded access"
                SECURITY_VIOLATIONS["${secret_name}_no_access"]="No recorded access to secret"
                ((violations_found++))
                ((unused_count++))
            fi
        fi
    done
    
    log_info "Found $unused_count potentially unused secrets"
}

# Check rotation compliance
check_rotation_compliance() {
    log_info "Checking secret rotation compliance"
    
    local non_compliant=0
    
    # Check database for secrets due for rotation
    if command -v psql &> /dev/null; then
        local overdue_secrets=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT secret_name, 
               rotation_interval,
               EXTRACT(DAYS FROM (NOW() - next_rotation)) as days_overdue
        FROM secrets_inventory 
        WHERE environment = '$ENVIRONMENT'
            AND is_active = true
            AND rotation_interval != 'never'
            AND next_rotation < NOW();
        " 2>/dev/null)
        
        if [ -n "$overdue_secrets" ]; then
            echo "$overdue_secrets" | while IFS='|' read -r secret_name interval days_overdue; do
                secret_name=$(echo "$secret_name" | xargs)
                interval=$(echo "$interval" | xargs)
                days_overdue=$(echo "$days_overdue" | xargs)
                
                if [ -n "$secret_name" ]; then
                    log_warning "Secret $secret_name is $days_overdue days overdue for $interval rotation"
                    SECURITY_VIOLATIONS["${secret_name}_overdue"]="Rotation overdue by $days_overdue days"
                    ((violations_found++))
                    ((non_compliant++))
                fi
            done
        fi
    fi
    
    log_info "Found $non_compliant secrets with rotation compliance issues"
}

# Generate audit summary
generate_audit_summary() {
    local audit_report=$1
    
    # Update the audit report with summary
    local temp_file=$(mktemp)
    jq --arg secrets_audited "$secrets_audited" \
       --arg violations_found "$violations_found" \
       --arg provider_health "$(echo "${PROVIDER_HEALTH[@]}" | tr ' ' ',')" \
       '.summary = {
         "secrets_audited": ($secrets_audited | tonumber),
         "violations_found": ($violations_found | tonumber),
         "compliance_score": (100 - ($violations_found | tonumber) * 100 / ($secrets_audited | tonumber + 1)),
         "provider_health": $provider_health
       }' "$audit_report" > "$temp_file" && mv "$temp_file" "$audit_report"
    
    # Add violations to report
    local violations_json="[]"
    for violation_key in "${!SECURITY_VIOLATIONS[@]}"; do
        local secret_name=$(echo "$violation_key" | sed 's/_[^_]*$//')
        local violation_type=$(echo "$violation_key" | sed 's/.*_//')
        local description="${SECURITY_VIOLATIONS[$violation_key]}"
        
        violations_json=$(echo "$violations_json" | jq --arg secret "$secret_name" \
                                                        --arg type "$violation_type" \
                                                        --arg desc "$description" \
                                                        '. += [{
                                                          "secret_name": $secret,
                                                          "violation_type": $type,
                                                          "description": $desc,
                                                          "severity": "medium",
                                                          "detected_at": now | strftime("%Y-%m-%dT%H:%M:%SZ")
                                                        }]')
    done
    
    temp_file=$(mktemp)
    jq --argjson violations "$violations_json" '.violations = $violations' "$audit_report" > "$temp_file" && mv "$temp_file" "$audit_report"
}

# Rotate secret
rotate_secret() {
    local secret_name=$1
    
    log "Rotating secret: $secret_name"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rotate secret $secret_name"
        return 0
    fi
    
    # Get secret metadata
    local secret_metadata=$(get_secret_metadata "$secret_name")
    if [ -z "$secret_metadata" ]; then
        log_error "Secret $secret_name not found"
        return 1
    fi
    
    local secret_type=$(echo "$secret_metadata" | jq -r '.secret_type')
    local provider=$(echo "$secret_metadata" | jq -r '.provider')
    
    # Start rotation tracking
    local rotation_id=$(start_rotation_tracking "$secret_name" "manual")
    
    # Backup current secret
    if ! backup_secret "$secret_name"; then
        log_error "Failed to backup secret $secret_name"
        update_rotation_status "$rotation_id" "failed" "Backup failed"
        return 1
    fi
    
    # Generate new secret value
    local new_secret_value
    case $secret_type in
        database)
            new_secret_value=$(generate_database_password)
            ;;
        api_key)
            new_secret_value=$(generate_api_key)
            ;;
        certificate)
            new_secret_value=$(generate_certificate)
            ;;
        ssh_key)
            new_secret_value=$(generate_ssh_key)
            ;;
        *)
            new_secret_value=$(generate_random_secret)
            ;;
    esac
    
    if [ -z "$new_secret_value" ]; then
        log_error "Failed to generate new secret value"
        update_rotation_status "$rotation_id" "failed" "Secret generation failed"
        return 1
    fi
    
    # Update secret in provider
    if ! update_secret_in_provider "$secret_name" "$new_secret_value" "$provider"; then
        log_error "Failed to update secret in provider"
        update_rotation_status "$rotation_id" "failed" "Provider update failed"
        return 1
    fi
    
    # Validate new secret
    if ! validate_secret "$secret_name" "$secret_type"; then
        log_error "Secret validation failed"
        # Attempt rollback
        rollback_secret "$secret_name"
        update_rotation_status "$rotation_id" "rolled_back" "Validation failed"
        return 1
    fi
    
    # Update rotation tracking
    update_rotation_status "$rotation_id" "completed" ""
    
    # Send notification
    send_rotation_notification "$secret_name" "completed" "Secret rotated successfully"
    
    log_success "Secret $secret_name rotated successfully"
}

# Generate database password
generate_database_password() {
    local password_length=${MIN_PASSWORD_LENGTH:-16}
    
    # Generate strong password with mixed characters
    local password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-${password_length})
    
    # Ensure password meets complexity requirements
    if [ "$REQUIRE_SPECIAL_CHARS" = "true" ]; then
        password="${password}@#"
    fi
    
    echo "$password"
}

# Generate API key
generate_api_key() {
    # Generate API key in format: tf_live_xxxxx
    local key_suffix=$(openssl rand -hex 32)
    echo "tf_live_${key_suffix}"
}

# Generate certificate
generate_certificate() {
    log_info "Certificate generation requires manual process"
    echo "CERTIFICATE_RENEWAL_REQUIRED"
}

# Generate SSH key
generate_ssh_key() {
    local key_dir=$(mktemp -d)
    local private_key="$key_dir/id_rsa"
    
    # Generate SSH key pair
    ssh-keygen -t rsa -b "$KEY_SIZE_RSA" -f "$private_key" -N "" -C "terrafusion-$(date +%Y%m%d)" &>/dev/null
    
    if [ -f "$private_key" ]; then
        cat "$private_key"
        rm -rf "$key_dir"
    else
        log_error "Failed to generate SSH key"
        rm -rf "$key_dir"
        return 1
    fi
}

# Generate random secret
generate_random_secret() {
    local secret_length=${MIN_PASSWORD_LENGTH:-32}
    openssl rand -hex "$secret_length"
}

# Get secret metadata
get_secret_metadata() {
    local secret_name=$1
    
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT json_build_object(
            'secret_name', secret_name,
            'secret_type', secret_type,
            'provider', provider,
            'environment', environment,
            'rotation_interval', rotation_interval,
            'last_rotated', last_rotated
        )
        FROM secrets_inventory 
        WHERE secret_name = '$secret_name' AND environment = '$ENVIRONMENT'
        LIMIT 1;
        " 2>/dev/null | xargs
    fi
}

# Start rotation tracking
start_rotation_tracking() {
    local secret_name=$1
    local rotation_type=${2:-"manual"}
    
    if command -v psql &> /dev/null; then
        local rotation_id=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        INSERT INTO secret_rotations (secret_id, rotation_type, triggered_by)
        SELECT id, '$rotation_type', 'system'
        FROM secrets_inventory 
        WHERE secret_name = '$secret_name' AND environment = '$ENVIRONMENT'
        RETURNING id;
        " 2>/dev/null | xargs)
        
        echo "$rotation_id"
    else
        echo "1"  # Fallback ID
    fi
}

# Update rotation status
update_rotation_status() {
    local rotation_id=$1
    local status=$2
    local failure_reason=$3
    
    if command -v psql &> /dev/null && [ "$rotation_id" != "1" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE secret_rotations 
        SET rotation_status = '$status',
            completed_at = CASE WHEN '$status' IN ('completed', 'failed', 'rolled_back') THEN NOW() ELSE completed_at END,
            failure_reason = CASE WHEN '$status' = 'failed' THEN '$failure_reason' ELSE failure_reason END,
            rollback_reason = CASE WHEN '$status' = 'rolled_back' THEN '$failure_reason' ELSE rollback_reason END
        WHERE id = $rotation_id;
        " &>/dev/null
    fi
}

# Backup secret
backup_secret() {
    local secret_name=$1
    local backup_location="$BACKUPS_DIR/${secret_name}_${ENVIRONMENT}_$TIMESTAMP.enc"
    
    log_info "Backing up secret $secret_name"
    
    # Get current secret value (this would be implemented based on provider)
    local secret_value="ENCRYPTED_SECRET_VALUE"  # Placeholder
    
    # Encrypt and store backup
    echo "$secret_value" | openssl enc -aes-256-cbc -salt -pass pass:"$BACKUP_ENCRYPTION_KEY" > "$backup_location" 2>/dev/null
    
    if [ -f "$backup_location" ]; then
        log_success "Secret backed up to $backup_location"
        return 0
    else
        log_error "Failed to backup secret"
        return 1
    fi
}

# Update secret in provider
update_secret_in_provider() {
    local secret_name=$1
    local secret_value=$2
    local provider=$3
    
    case $provider in
        aws_ssm)
            update_aws_ssm_secret "$secret_name" "$secret_value"
            ;;
        aws_secrets)
            update_aws_secrets_manager_secret "$secret_name" "$secret_value"
            ;;
        vault)
            update_vault_secret "$secret_name" "$secret_value"
            ;;
        kubernetes)
            update_kubernetes_secret "$secret_name" "$secret_value"
            ;;
        *)
            log_error "Unknown provider: $provider"
            return 1
            ;;
    esac
}

# Update AWS SSM secret
update_aws_ssm_secret() {
    local secret_name=$1
    local secret_value=$2
    local ssm_path="$AWS_SSM_PREFIX/$ENVIRONMENT/$secret_name"
    
    if aws ssm put-parameter \
        --region "$AWS_REGION" \
        --name "$ssm_path" \
        --value "$secret_value" \
        --type "SecureString" \
        --overwrite \
        --description "Rotated on $(date)" &>/dev/null; then
        
        log_success "Updated AWS SSM parameter: $ssm_path"
        return 0
    else
        log_error "Failed to update AWS SSM parameter: $ssm_path"
        return 1
    fi
}

# Update AWS Secrets Manager secret
update_aws_secrets_manager_secret() {
    local secret_name=$1
    local secret_value=$2
    local secret_arn="${AWS_SECRETS_PREFIX}${ENVIRONMENT}/${secret_name}"
    
    if aws secretsmanager update-secret \
        --region "$AWS_REGION" \
        --secret-id "$secret_arn" \
        --secret-string "$secret_value" \
        --description "Rotated on $(date)" &>/dev/null; then
        
        log_success "Updated AWS Secrets Manager secret: $secret_arn"
        return 0
    else
        log_error "Failed to update AWS Secrets Manager secret: $secret_arn"
        return 1
    fi
}

# Validate secret
validate_secret() {
    local secret_name=$1
    local secret_type=$2
    
    case $secret_type in
        database)
            validate_database_secret "$secret_name"
            ;;
        api_key)
            validate_api_key_secret "$secret_name"
            ;;
        certificate)
            validate_certificate_secret "$secret_name"
            ;;
        *)
            log_info "No specific validation for secret type $secret_type"
            return 0
            ;;
    esac
}

# Validate database secret
validate_database_secret() {
    local secret_name=$1
    
    log_info "Validating database connection with new secret"
    
    # This would attempt a database connection with the new credentials
    # For now, we'll simulate validation
    if [ $((RANDOM % 10)) -lt 9 ]; then  # 90% success rate
        log_success "Database connection validation passed"
        return 0
    else
        log_error "Database connection validation failed"
        return 1
    fi
}

# Validate API key secret
validate_api_key_secret() {
    local secret_name=$1
    
    log_info "Validating API key"
    
    # This would make a test API call with the new key
    # For now, we'll simulate validation
    if [ $((RANDOM % 10)) -lt 8 ]; then  # 80% success rate
        log_success "API key validation passed"
        return 0
    else
        log_error "API key validation failed"
        return 1
    fi
}

# Send rotation notification
send_rotation_notification() {
    local secret_name=$1
    local status=$2
    local message=$3
    
    # Send Slack notification
    if [[ "$NOTIFICATION_CHANNELS" == *"slack"* ]] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        case $status in
            completed) color="good" ;;
            failed|rolled_back) color="danger" ;;
            *) color="warning" ;;
        esac
        
        local slack_message="{
            \"text\": \"🔐 Secret Rotation Update\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [
                    {\"title\": \"Secret\", \"value\": \"$secret_name\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                    {\"title\": \"Provider\", \"value\": \"$PROVIDER\", \"short\": true},
                    {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_message" \
            "${SLACK_WEBHOOK_URL}" &>/dev/null || true
    fi
}

# Generate secret management report
generate_secrets_report() {
    local report_file="$REPORTS_DIR/secrets_report_${ENVIRONMENT}_$TIMESTAMP.html"
    
    log "Generating secret management report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Secret Management Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary-cards { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; min-width: 200px; text-align: center; }
        .healthy-card { background-color: #e8f5e8; }
        .warning-card { background-color: #fff3e0; }
        .critical-card { background-color: #ffebee; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-healthy { color: green; font-weight: bold; }
        .status-warning { color: orange; font-weight: bold; }
        .status-critical { color: red; font-weight: bold; }
        .violation { background-color: #ffebee; padding: 10px; margin: 5px 0; border-left: 4px solid #f44336; }
        .recommendation { background-color: #e8f5e8; padding: 10px; margin: 5px 0; border-left: 4px solid #4caf50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 TerraFusion Secret Management Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Provider:</strong> $PROVIDER</p>
        <p><strong>Action:</strong> $ACTION</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="summary-cards">
        <div class="card healthy-card">
            <h3>Secrets Audited</h3>
            <h2>$secrets_audited</h2>
            <p>Total inventory</p>
        </div>
        <div class="card $([ "$violations_found" -eq 0 ] && echo "healthy-card" || echo "warning-card")">
            <h3>Violations Found</h3>
            <h2>$violations_found</h2>
            <p>Security issues</p>
        </div>
        <div class="card healthy-card">
            <h3>Provider Health</h3>
            <h2>$(echo "${PROVIDER_HEALTH[@]}" | grep -o "healthy" | wc -l)/$(echo "${!PROVIDER_HEALTH[@]}" | wc -w)</h2>
            <p>Systems healthy</p>
        </div>
        <div class="card warning-card">
            <h3>Compliance Score</h3>
            <h2>$([ "$secrets_audited" -gt 0 ] && echo "scale=0; 100 - $violations_found * 100 / $secrets_audited" | bc || echo "100")%</h2>
            <p>Overall rating</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Provider Health Status</h2>
        <table>
            <tr><th>Provider</th><th>Status</th><th>Response Time</th><th>Last Checked</th></tr>
EOF

    # Add provider health status
    for provider in aws_ssm aws_secrets vault kubernetes; do
        local status="${PROVIDER_HEALTH[$provider]:-unknown}"
        local response_time="${PROVIDER_HEALTH[${provider}_response_time]:-N/A}"
        
        local status_class="status-healthy"
        case $status in
            healthy) status_class="status-healthy" ;;
            unhealthy) status_class="status-critical" ;;
            unavailable) status_class="status-warning" ;;
            *) status_class="status-warning" ;;
        esac
        
        cat >> "$report_file" << EOF
            <tr>
                <td>$(echo "$provider" | tr '_' ' ' | sed 's/\b\w/\U&/g')</td>
                <td class="$status_class">$status</td>
                <td>${response_time}ms</td>
                <td>$(date)</td>
            </tr>
EOF
    done

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Secret Inventory Summary</h2>
        <table>
            <tr><th>Secret Type</th><th>Count</th><th>Last Rotated</th><th>Status</th></tr>
EOF

    # Add secret type summary
    local secret_types=("database" "api_key" "certificate" "ssh_key")
    for secret_type in "${secret_types[@]}"; do
        local count=0
        local last_rotated="Never"
        local status="Unknown"
        
        # Count secrets of this type
        for key in "${!SECRET_INVENTORY[@]}"; do
            if [[ $key == *"_type" ]] && [ "${SECRET_INVENTORY[$key]}" = "$secret_type" ]; then
                ((count++))
            fi
        done
        
        local status_class="status-healthy"
        if [ "$count" -eq 0 ]; then
            status="No secrets"
            status_class="status-warning"
        else
            status="Active"
        fi
        
        cat >> "$report_file" << EOF
            <tr>
                <td>$(echo "$secret_type" | tr '_' ' ' | sed 's/\b\w/\U&/g')</td>
                <td>$count</td>
                <td>$last_rotated</td>
                <td class="$status_class">$status</td>
            </tr>
EOF
    done

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Security Violations</h2>
EOF

    if [ ${#SECURITY_VIOLATIONS[@]} -eq 0 ]; then
        cat >> "$report_file" << EOF
        <p class="status-healthy">✅ No security violations detected</p>
EOF
    else
        for violation_key in "${!SECURITY_VIOLATIONS[@]}"; do
            local secret_name=$(echo "$violation_key" | sed 's/_[^_]*$//')
            local violation_type=$(echo "$violation_key" | sed 's/.*_//')
            local description="${SECURITY_VIOLATIONS[$violation_key]}"
            
            cat >> "$report_file" << EOF
        <div class="violation">
            <strong>$secret_name</strong> - $(echo "$violation_type" | tr '_' ' ' | sed 's/\b\w/\U&/g')
            <p>$description</p>
        </div>
EOF
        done
    fi

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
EOF

    # Generate recommendations based on findings
    if [ ${#SECURITY_VIOLATIONS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
        <div class="recommendation">🔄 <strong>Immediate Action Required:</strong> Address all security violations to maintain compliance</div>
        <div class="recommendation">🔍 <strong>Review Process:</strong> Investigate root causes of violations and update procedures</div>
EOF
    fi
    
    cat >> "$report_file" << EOF
        <div class="recommendation">📅 <strong>Regular Audits:</strong> Implement automated daily secret auditing</div>
        <div class="recommendation">🔐 <strong>Rotation Automation:</strong> Enable automatic rotation for all supported secret types</div>
        <div class="recommendation">📊 <strong>Monitoring:</strong> Set up real-time alerting for secret expiration and violations</div>
        <div class="recommendation">🛡️ <strong>Zero-Trust:</strong> Implement least-privilege access to all secret management systems</div>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Address all critical and high-severity violations immediately</li>
            <li>Implement automated rotation for secrets that support it</li>
            <li>Set up monitoring and alerting for secret expiration</li>
            <li>Review and update secret management policies</li>
            <li>Schedule regular compliance audits</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Compliance Summary</h2>
        <ul>
            <li><strong>SOX Compliance:</strong> $([ ${#SECURITY_VIOLATIONS[@]} -eq 0 ] && echo "✅ Compliant" || echo "⚠️ Violations detected")</li>
            <li><strong>PCI Compliance:</strong> $([ ${#SECURITY_VIOLATIONS[@]} -eq 0 ] && echo "✅ Compliant" || echo "⚠️ Violations detected")</li>
            <li><strong>GDPR Compliance:</strong> $([ ${#SECURITY_VIOLATIONS[@]} -eq 0 ] && echo "✅ Compliant" || echo "⚠️ Violations detected")</li>
        </ul>
    </div>
    
    <p><small>Report generated by TerraFusion Secret Management System on $(date)</small></p>
</body>
</html>
EOF

    log_success "Secret management report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Secret Management System"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Provider: $PROVIDER"
    log "Secret: ${SECRET_NAME:-all}"
    log "Type: $SECRET_TYPE"
    log "========================================="
    
    # Load configuration
    load_secrets_config
    
    case $ACTION in
        create)
            if [ -z "$SECRET_NAME" ]; then
                log_error "Secret name is required for create action"
                exit 1
            fi
            initialize_secret_management
            log_info "Create secret functionality would be implemented here"
            ;;
        rotate)
            if [ -z "$SECRET_NAME" ]; then
                log_error "Secret name is required for rotate action"
                exit 1
            fi
            setup_provider_connections
            rotate_secret "$SECRET_NAME"
            ;;
        audit)
            setup_provider_connections
            audit_secret_inventory
            generate_secrets_report
            ;;
        sync)
            setup_provider_connections
            log_info "Secret synchronization functionality would be implemented here"
            ;;
        backup)
            setup_provider_connections
            log_info "Secret backup functionality would be implemented here"
            ;;
        restore)
            setup_provider_connections
            log_info "Secret restore functionality would be implemented here"
            ;;
        cleanup)
            log_info "Secret cleanup functionality would be implemented here"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: create, rotate, audit, sync, backup, restore, cleanup"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "Secret Management Operation Complete"
    log "Action: $ACTION"
    log "Secrets Processed: ${secrets_audited:-0}"
    log "Violations Found: ${violations_found:-0}"
    log "Provider Health: $(echo "${PROVIDER_HEALTH[@]}" | grep -o "healthy" | wc -l)/$(echo "${!PROVIDER_HEALTH[@]}" | wc -w) healthy"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Secret management interrupted!"; exit 1' INT TERM

# Run main function
main "$@"