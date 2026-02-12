#!/bin/bash
#
# TerraFusion Multi-Environment Configuration Manager
# Manages environment-specific configurations across development, staging, and production
#
# Usage: ./config-manager.sh [options]
# Options:
#   -a    Action (deploy|validate|diff|sync|backup|restore)
#   -e    Environment (development|staging|production|all)
#   -s    Service (all|api|frontend|database|redis)
#   -f    Configuration file path
#   -v    Validate configuration
#   -d    Dry run mode
#   -b    Create backup before changes

set -euo pipefail

# Configuration
ACTION="deploy"
ENVIRONMENT="development"
SERVICE="all"
CONFIG_FILE=""
VALIDATE_CONFIG=false
DRY_RUN=false
CREATE_BACKUP=false
CONFIG_BASE_DIR="/opt/terrafusion/config"
ENVIRONMENTS_DIR="$CONFIG_BASE_DIR/environments"
TEMPLATES_DIR="$CONFIG_BASE_DIR/templates"
BACKUP_DIR="$CONFIG_BASE_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/config_manager_$TIMESTAMP.log"

# SSM Parameter prefixes
SSM_PREFIX_DEV="/terrafusion/development"
SSM_PREFIX_STAGING="/terrafusion/staging"  
SSM_PREFIX_PROD="/terrafusion/production"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$ENVIRONMENTS_DIR"
mkdir -p "$TEMPLATES_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "a:e:s:f:vdb" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        s) SERVICE="$OPTARG" ;;
        f) CONFIG_FILE="$OPTARG" ;;
        v) VALIDATE_CONFIG=true ;;
        d) DRY_RUN=true ;;
        b) CREATE_BACKUP=true ;;
        *) echo "Usage: $0 [-a action] [-e env] [-s service] [-f file] [-v] [-d] [-b]"; exit 1 ;;
    esac
done

# Data structures
declare -A CONFIG_VALIDATION_ERRORS
declare -A CONFIG_DIFFERENCES
declare -A DEPLOYED_CONFIGS

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

# Validate environment name
validate_environment() {
    local env=$1
    case $env in
        development|staging|production|all) return 0 ;;
        *) return 1 ;;
    esac
}

# Get SSM parameter prefix for environment
get_ssm_prefix() {
    local env=$1
    case $env in
        development) echo "$SSM_PREFIX_DEV" ;;
        staging) echo "$SSM_PREFIX_STAGING" ;;
        production) echo "$SSM_PREFIX_PROD" ;;
    esac
}

# Load environment configuration
load_environment_config() {
    local env=$1
    local config_file="$ENVIRONMENTS_DIR/${env}.env"
    
    if [ -f "$config_file" ]; then
        log "Loading configuration for environment: $env"
        # Source the config file in a subshell to avoid polluting current environment
        (
            set -a  # Export all variables
            source "$config_file"
            env | grep -E '^[A-Z_]+'
        )
    else
        log_error "Configuration file not found: $config_file"
        return 1
    fi
}

# Validate configuration values
validate_configuration() {
    local env=$1
    local config_data=$2
    
    log "Validating configuration for environment: $env"
    
    local errors=0
    
    # Required variables for all environments
    local required_vars=(
        "ENVIRONMENT"
        "PROJECT_NAME" 
        "DATABASE_HOST"
        "DATABASE_NAME"
        "REDIS_HOST"
        "API_HOST"
        "API_PORT"
        "SECRET_KEY"
    )
    
    # Environment-specific validations
    case $env in
        production)
            required_vars+=(
                "ENABLE_2FA"
                "BACKUP_ENABLED"
                "AUDIT_LOGGING"
                "ENCRYPTION_AT_REST"
                "AUTO_SCALING_ENABLED"
            )
            ;;
        staging)
            required_vars+=(
                "ENABLE_2FA"
                "BACKUP_ENABLED"
                "AUDIT_LOGGING"
            )
            ;;
    esac
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if ! echo "$config_data" | grep -q "^${var}="; then
            CONFIG_VALIDATION_ERRORS["${env}_missing_${var}"]="Required variable $var is missing"
            ((errors++))
        fi
    done
    
    # Validate specific values
    local environment_value=$(echo "$config_data" | grep "^ENVIRONMENT=" | cut -d'=' -f2)
    if [ "$environment_value" != "$env" ]; then
        CONFIG_VALIDATION_ERRORS["${env}_environment_mismatch"]="ENVIRONMENT value '$environment_value' doesn't match expected '$env'"
        ((errors++))
    fi
    
    # Security validations for production
    if [ "$env" = "production" ]; then
        # Check for development secrets
        if echo "$config_data" | grep -q "dev-.*-secret\|test-.*-key\|development"; then
            CONFIG_VALIDATION_ERRORS["${env}_dev_secrets"]="Development secrets found in production configuration"
            ((errors++))
        fi
        
        # Check security settings
        local debug_enabled=$(echo "$config_data" | grep "^.*_DEBUG=" | cut -d'=' -f2)
        if [ "$debug_enabled" = "true" ]; then
            CONFIG_VALIDATION_ERRORS["${env}_debug_enabled"]="Debug mode enabled in production"
            ((errors++))
        fi
        
        # Check SSL settings
        local ssl_redirect=$(echo "$config_data" | grep "^SECURE_SSL_REDIRECT=" | cut -d'=' -f2)
        if [ "$ssl_redirect" != "true" ]; then
            CONFIG_VALIDATION_ERRORS["${env}_ssl_not_enforced"]="SSL redirect not enforced in production"
            ((errors++))
        fi
    fi
    
    # Port conflict validation
    local ports=($(echo "$config_data" | grep "_PORT=" | cut -d'=' -f2 | sort))
    local unique_ports=($(printf '%s\n' "${ports[@]}" | sort -u))
    
    if [ ${#ports[@]} -ne ${#unique_ports[@]} ]; then
        CONFIG_VALIDATION_ERRORS["${env}_port_conflicts"]="Port conflicts detected in configuration"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Configuration validation passed for $env"
        return 0
    else
        log_error "Configuration validation failed for $env with $errors errors"
        return 1
    fi
}

# Deploy configuration to environment
deploy_configuration() {
    local env=$1
    local service=$2
    
    log "Deploying configuration for environment: $env, service: $service"
    
    # Load configuration
    local config_data
    if ! config_data=$(load_environment_config "$env"); then
        log_error "Failed to load configuration for $env"
        return 1
    fi
    
    # Validate configuration
    if [ "$VALIDATE_CONFIG" = true ]; then
        if ! validate_configuration "$env" "$config_data"; then
            log_error "Configuration validation failed, aborting deployment"
            return 1
        fi
    fi
    
    # Create backup if requested
    if [ "$CREATE_BACKUP" = true ]; then
        backup_current_configuration "$env"
    fi
    
    # Deploy based on service
    case $service in
        all)
            deploy_database_config "$env" "$config_data"
            deploy_redis_config "$env" "$config_data"
            deploy_api_config "$env" "$config_data"
            deploy_frontend_config "$env" "$config_data"
            deploy_secrets_to_ssm "$env" "$config_data"
            ;;
        database)
            deploy_database_config "$env" "$config_data"
            ;;
        redis)
            deploy_redis_config "$env" "$config_data"
            ;;
        api)
            deploy_api_config "$env" "$config_data"
            ;;
        frontend)
            deploy_frontend_config "$env" "$config_data"
            ;;
    esac
    
    # Verify deployment
    if verify_deployment "$env" "$service"; then
        log_success "Configuration deployment completed for $env"
        DEPLOYED_CONFIGS["$env"]="success"
    else
        log_error "Configuration deployment verification failed for $env"
        DEPLOYED_CONFIGS["$env"]="failed"
        return 1
    fi
}

# Deploy database configuration
deploy_database_config() {
    local env=$1
    local config_data=$2
    
    log "Deploying database configuration for $env"
    
    # Extract database configuration
    local db_config=$(echo "$config_data" | grep "^DATABASE_")
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy database configuration:"
        echo "$db_config" | while IFS= read -r line; do
            log_info "  $line"
        done
        return 0
    fi
    
    # Create database configuration file
    local db_config_file="/etc/terrafusion/database-${env}.conf"
    local db_config_dir=$(dirname "$db_config_file")
    
    mkdir -p "$db_config_dir"
    
    cat > "$db_config_file" << EOF
# TerraFusion Database Configuration - $env
# Generated on $(date)

$(echo "$db_config" | sed 's/^DATABASE_//')
EOF
    
    # Set appropriate permissions
    chmod 600 "$db_config_file"
    chown root:root "$db_config_file" 2>/dev/null || true
    
    log_success "Database configuration deployed: $db_config_file"
}

# Deploy Redis configuration
deploy_redis_config() {
    local env=$1
    local config_data=$2
    
    log "Deploying Redis configuration for $env"
    
    # Extract Redis configuration
    local redis_config=$(echo "$config_data" | grep "^REDIS_")
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy Redis configuration:"
        echo "$redis_config" | while IFS= read -r line; do
            log_info "  $line"
        done
        return 0
    fi
    
    # Create Redis configuration file
    local redis_config_file="/etc/terrafusion/redis-${env}.conf"
    local redis_config_dir=$(dirname "$redis_config_file")
    
    mkdir -p "$redis_config_dir"
    
    cat > "$redis_config_file" << EOF
# TerraFusion Redis Configuration - $env
# Generated on $(date)

$(echo "$redis_config" | sed 's/^REDIS_//')
EOF
    
    chmod 600 "$redis_config_file"
    chown root:root "$redis_config_file" 2>/dev/null || true
    
    log_success "Redis configuration deployed: $redis_config_file"
}

# Deploy API configuration
deploy_api_config() {
    local env=$1
    local config_data=$2
    
    log "Deploying API configuration for $env"
    
    # Extract API configuration
    local api_config=$(echo "$config_data" | grep "^API_")
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy API configuration:"
        echo "$api_config" | while IFS= read -r line; do
            log_info "  $line"
        done
        return 0
    fi
    
    # Create API configuration file
    local api_config_file="/etc/terrafusion/api-${env}.env"
    local api_config_dir=$(dirname "$api_config_file")
    
    mkdir -p "$api_config_dir"
    
    cat > "$api_config_file" << EOF
# TerraFusion API Configuration - $env
# Generated on $(date)

$api_config
EOF
    
    chmod 600 "$api_config_file"
    chown root:root "$api_config_file" 2>/dev/null || true
    
    log_success "API configuration deployed: $api_config_file"
}

# Deploy frontend configuration  
deploy_frontend_config() {
    local env=$1
    local config_data=$2
    
    log "Deploying frontend configuration for $env"
    
    # Extract frontend configuration
    local frontend_config=$(echo "$config_data" | grep "^FRONTEND_")
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy frontend configuration:"
        echo "$frontend_config" | while IFS= read -r line; do
            log_info "  $line"
        done
        return 0
    fi
    
    # Create frontend configuration file
    local frontend_config_file="/etc/terrafusion/frontend-${env}.env"
    local frontend_config_dir=$(dirname "$frontend_config_file")
    
    mkdir -p "$frontend_config_dir"
    
    cat > "$frontend_config_file" << EOF
# TerraFusion Frontend Configuration - $env
# Generated on $(date)

$frontend_config
EOF
    
    chmod 600 "$frontend_config_file"
    chown root:root "$frontend_config_file" 2>/dev/null || true
    
    log_success "Frontend configuration deployed: $frontend_config_file"
}

# Deploy secrets to AWS Systems Manager Parameter Store
deploy_secrets_to_ssm() {
    local env=$1
    local config_data=$2
    
    log "Deploying secrets to SSM Parameter Store for $env"
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not available, skipping SSM deployment"
        return 1
    fi
    
    local ssm_prefix=$(get_ssm_prefix "$env")
    
    # Extract secret values that should be stored in SSM
    local secret_vars=(
        "SECRET_KEY"
        "JWT_SECRET_KEY"
        "DATABASE_URL"
        "REDIS_URL"
    )
    
    # Add environment-specific secrets
    case $env in
        production|staging)
            secret_vars+=(
                "STRIPE_SECRET_KEY"
                "SENDGRID_API_KEY"
                "TWILIO_AUTH_TOKEN"
            )
            ;;
    esac
    
    for var in "${secret_vars[@]}"; do
        local value=$(echo "$config_data" | grep "^${var}=" | cut -d'=' -f2-)
        
        if [ -n "$value" ] && [[ ! "$value" =~ ^ssm: ]]; then
            local ssm_param_name="${ssm_prefix}/${var,,}"  # Convert to lowercase
            
            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would store $var in SSM parameter: $ssm_param_name"
                continue
            fi
            
            # Store in SSM with encryption
            if aws ssm put-parameter \
                --name "$ssm_param_name" \
                --value "$value" \
                --type "SecureString" \
                --overwrite \
                --description "TerraFusion $env environment - $var" \
                --tags "Key=Environment,Value=$env" "Key=Project,Value=TerraFusion" \
                &>/dev/null; then
                
                log_success "Stored $var in SSM: $ssm_param_name"
            else
                log_error "Failed to store $var in SSM: $ssm_param_name"
            fi
        fi
    done
}

# Compare configurations between environments
compare_configurations() {
    local env1=$1
    local env2=$2
    
    log "Comparing configurations between $env1 and $env2"
    
    local config1
    local config2
    
    if ! config1=$(load_environment_config "$env1"); then
        log_error "Failed to load configuration for $env1"
        return 1
    fi
    
    if ! config2=$(load_environment_config "$env2"); then
        log_error "Failed to load configuration for $env2"
        return 1
    fi
    
    # Create temporary files for comparison
    local temp1="/tmp/config_${env1}_$TIMESTAMP"
    local temp2="/tmp/config_${env2}_$TIMESTAMP"
    
    echo "$config1" | sort > "$temp1"
    echo "$config2" | sort > "$temp2"
    
    # Compare configurations
    local diff_output
    if diff_output=$(diff -u "$temp1" "$temp2"); then
        log_success "No differences found between $env1 and $env2 configurations"
    else
        log_warning "Differences found between $env1 and $env2:"
        echo "$diff_output" | while IFS= read -r line; do
            case "$line" in
                +++*|---*) log_info "$line" ;;
                +*) log_info "${GREEN}$line${NC}" ;;
                -*) log_info "${RED}$line${NC}" ;;
                *) log_info "$line" ;;
            esac
        done
        
        CONFIG_DIFFERENCES["${env1}_vs_${env2}"]="differences_found"
    fi
    
    # Cleanup
    rm -f "$temp1" "$temp2"
}

# Sync configuration from one environment to another
sync_configuration() {
    local source_env=$1
    local target_env=$2
    
    log "Syncing configuration from $source_env to $target_env"
    
    # Load source configuration
    local source_config
    if ! source_config=$(load_environment_config "$source_env"); then
        log_error "Failed to load source configuration from $source_env"
        return 1
    fi
    
    # Create backup of target environment
    if [ "$CREATE_BACKUP" = true ]; then
        backup_current_configuration "$target_env"
    fi
    
    # Update environment-specific values
    local synced_config=$(echo "$source_config" | sed "s/ENVIRONMENT=$source_env/ENVIRONMENT=$target_env/g")
    
    # Environment-specific adjustments
    case "$target_env" in
        development)
            synced_config=$(echo "$synced_config" | sed 's/DEBUG=false/DEBUG=true/g')
            synced_config=$(echo "$synced_config" | sed 's/LOG_LEVEL=WARN/LOG_LEVEL=DEBUG/g')
            ;;
        production)
            synced_config=$(echo "$synced_config" | sed 's/DEBUG=true/DEBUG=false/g')
            synced_config=$(echo "$synced_config" | sed 's/LOG_LEVEL=DEBUG/LOG_LEVEL=WARN/g')
            ;;
    esac
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would sync configuration from $source_env to $target_env"
        return 0
    fi
    
    # Write synced configuration
    local target_config_file="$ENVIRONMENTS_DIR/${target_env}.env"
    echo "$synced_config" > "$target_config_file"
    
    log_success "Configuration synced from $source_env to $target_env"
}

# Backup current configuration
backup_current_configuration() {
    local env=$1
    
    log "Creating backup of current configuration for $env"
    
    local config_file="$ENVIRONMENTS_DIR/${env}.env"
    local backup_file="$BACKUP_DIR/${env}_config_backup_$TIMESTAMP.env"
    
    if [ -f "$config_file" ]; then
        cp "$config_file" "$backup_file"
        log_success "Configuration backup created: $backup_file"
    else
        log_warning "No existing configuration file found for $env"
    fi
}

# Restore configuration from backup
restore_configuration() {
    local env=$1
    local backup_file=$2
    
    log "Restoring configuration for $env from backup: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    local config_file="$ENVIRONMENTS_DIR/${env}.env"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would restore configuration from $backup_file to $config_file"
        return 0
    fi
    
    # Create current backup before restore
    if [ -f "$config_file" ]; then
        local current_backup="$BACKUP_DIR/${env}_pre_restore_$TIMESTAMP.env"
        cp "$config_file" "$current_backup"
        log_info "Current configuration backed up to: $current_backup"
    fi
    
    # Restore from backup
    cp "$backup_file" "$config_file"
    log_success "Configuration restored from backup: $backup_file"
}

# Verify deployment
verify_deployment() {
    local env=$1
    local service=$2
    
    log "Verifying deployment for environment: $env, service: $service"
    
    local verification_passed=true
    
    # Check if configuration files exist
    case $service in
        all|database)
            if [ ! -f "/etc/terrafusion/database-${env}.conf" ]; then
                log_error "Database configuration file missing for $env"
                verification_passed=false
            fi
            ;;& # Fall through
        all|redis)
            if [ ! -f "/etc/terrafusion/redis-${env}.conf" ]; then
                log_error "Redis configuration file missing for $env"
                verification_passed=false
            fi
            ;;& # Fall through
        all|api)
            if [ ! -f "/etc/terrafusion/api-${env}.env" ]; then
                log_error "API configuration file missing for $env"
                verification_passed=false
            fi
            ;;& # Fall through
        all|frontend)
            if [ ! -f "/etc/terrafusion/frontend-${env}.env" ]; then
                log_error "Frontend configuration file missing for $env"
                verification_passed=false
            fi
            ;;
    esac
    
    # Verify SSM parameters for non-development environments
    if [[ "$env" =~ ^(staging|production)$ ]] && command -v aws &> /dev/null; then
        local ssm_prefix=$(get_ssm_prefix "$env")
        
        # Check critical SSM parameters
        local critical_params=("secret_key" "jwt_secret_key" "database_url")
        
        for param in "${critical_params[@]}"; do
            if ! aws ssm get-parameter --name "${ssm_prefix}/${param}" &>/dev/null; then
                log_error "Critical SSM parameter missing: ${ssm_prefix}/${param}"
                verification_passed=false
            fi
        done
    fi
    
    if [ "$verification_passed" = true ]; then
        log_success "Deployment verification passed for $env"
        return 0
    else
        log_error "Deployment verification failed for $env"
        return 1
    fi
}

# List available configurations
list_configurations() {
    log "Available configurations:"
    
    for env_file in "$ENVIRONMENTS_DIR"/*.env; do
        if [ -f "$env_file" ]; then
            local env_name=$(basename "$env_file" .env)
            local last_modified=$(stat -c %y "$env_file" 2>/dev/null || stat -f %Sm "$env_file" 2>/dev/null)
            local file_size=$(stat -c %s "$env_file" 2>/dev/null || stat -f %z "$env_file" 2>/dev/null)
            
            log_info "$env_name: $env_file ($(echo "scale=1; $file_size / 1024" | bc -l 2>/dev/null || echo $((file_size / 1024)))KB, modified: ${last_modified:0:19})"
        fi
    done
    
    # List backups
    log "Available backups:"
    for backup_file in "$BACKUP_DIR"/*_config_backup_*.env; do
        if [ -f "$backup_file" ]; then
            local backup_name=$(basename "$backup_file")
            local backup_date=$(echo "$backup_name" | grep -oE '[0-9]{8}_[0-9]{6}')
            log_info "$backup_name (Date: ${backup_date:0:8} ${backup_date:9:2}:${backup_date:11:2}:${backup_date:13:2})"
        fi
    done
}

# Generate configuration report
generate_config_report() {
    local report_file="$BACKUP_DIR/config_report_$TIMESTAMP.html"
    
    log "Generating configuration report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Configuration Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 TerraFusion Configuration Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Action:</strong> $ACTION</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
    </div>
    
    <div class="section">
        <h2>Deployment Status</h2>
        <table>
            <tr><th>Environment</th><th>Status</th></tr>
EOF
    
    for env in "${!DEPLOYED_CONFIGS[@]}"; do
        local status="${DEPLOYED_CONFIGS[$env]}"
        local status_class=$([ "$status" = "success" ] && echo "success" || echo "error")
        
        cat >> "$report_file" << EOF
            <tr><td>$env</td><td class="$status_class">$status</td></tr>
EOF
    done
    
    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Validation Errors</h2>
EOF
    
    if [ ${#CONFIG_VALIDATION_ERRORS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
        <table>
            <tr><th>Environment</th><th>Error</th></tr>
EOF
        
        for error_key in "${!CONFIG_VALIDATION_ERRORS[@]}"; do
            local env=$(echo "$error_key" | cut -d'_' -f1)
            local error="${CONFIG_VALIDATION_ERRORS[$error_key]}"
            
            cat >> "$report_file" << EOF
            <tr><td>$env</td><td class="error">$error</td></tr>
EOF
        done
        
        cat >> "$report_file" << EOF
        </table>
EOF
    else
        cat >> "$report_file" << EOF
        <p class="success">No validation errors found.</p>
EOF
    fi
    
    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Configuration Differences</h2>
EOF
    
    if [ ${#CONFIG_DIFFERENCES[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
        <table>
            <tr><th>Comparison</th><th>Status</th></tr>
EOF
        
        for diff_key in "${!CONFIG_DIFFERENCES[@]}"; do
            local comparison="$diff_key"
            local status="${CONFIG_DIFFERENCES[$diff_key]}"
            
            cat >> "$report_file" << EOF
            <tr><td>$comparison</td><td class="warning">$status</td></tr>
EOF
        done
        
        cat >> "$report_file" << EOF
        </table>
EOF
    else
        cat >> "$report_file" << EOF
        <p class="success">No configuration differences analyzed.</p>
EOF
    fi
    
    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <ul>
            <li><strong>Environments processed:</strong> ${#DEPLOYED_CONFIGS[@]}</li>
            <li><strong>Validation errors:</strong> ${#CONFIG_VALIDATION_ERRORS[@]}</li>
            <li><strong>Configuration differences:</strong> ${#CONFIG_DIFFERENCES[@]}</li>
            <li><strong>Dry run mode:</strong> $([ "$DRY_RUN" = true ] && echo "Enabled" || echo "Disabled")</li>
            <li><strong>Backup created:</strong> $([ "$CREATE_BACKUP" = true ] && echo "Yes" || echo "No")</li>
        </ul>
    </div>
    
    <p><small>Report generated by TerraFusion Configuration Manager</small></p>
</body>
</html>
EOF
    
    log_success "Configuration report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Configuration Manager"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Service: $SERVICE"
    log "Dry Run: $DRY_RUN"
    log "========================================="
    
    case $ACTION in
        deploy)
            if [ "$ENVIRONMENT" = "all" ]; then
                for env in development staging production; do
                    if validate_environment "$env"; then
                        deploy_configuration "$env" "$SERVICE"
                    fi
                done
            else
                if validate_environment "$ENVIRONMENT"; then
                    deploy_configuration "$ENVIRONMENT" "$SERVICE"
                else
                    log_error "Invalid environment: $ENVIRONMENT"
                    exit 1
                fi
            fi
            ;;
        validate)
            if [ "$ENVIRONMENT" = "all" ]; then
                for env in development staging production; do
                    if validate_environment "$env"; then
                        local config_data
                        if config_data=$(load_environment_config "$env"); then
                            validate_configuration "$env" "$config_data"
                        fi
                    fi
                done
            else
                if validate_environment "$ENVIRONMENT"; then
                    local config_data
                    if config_data=$(load_environment_config "$ENVIRONMENT"); then
                        validate_configuration "$ENVIRONMENT" "$config_data"
                    fi
                else
                    log_error "Invalid environment: $ENVIRONMENT"
                    exit 1
                fi
            fi
            ;;
        diff)
            if [ -n "$CONFIG_FILE" ]; then
                # Compare specific config file with environment
                log_info "Comparing file $CONFIG_FILE with $ENVIRONMENT environment"
            else
                # Compare between environments
                compare_configurations "development" "staging"
                compare_configurations "staging" "production"
                compare_configurations "development" "production"
            fi
            ;;
        sync)
            if [ -n "$CONFIG_FILE" ]; then
                # Extract source environment from config file path
                local source_env=$(basename "$CONFIG_FILE" .env)
                sync_configuration "$source_env" "$ENVIRONMENT"
            else
                log_error "Source configuration file required for sync operation"
                exit 1
            fi
            ;;
        backup)
            if [ "$ENVIRONMENT" = "all" ]; then
                for env in development staging production; do
                    backup_current_configuration "$env"
                done
            else
                backup_current_configuration "$ENVIRONMENT"
            fi
            ;;
        restore)
            if [ -z "$CONFIG_FILE" ]; then
                log_error "Backup file required for restore operation"
                exit 1
            fi
            restore_configuration "$ENVIRONMENT" "$CONFIG_FILE"
            ;;
        list)
            list_configurations
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: deploy, validate, diff, sync, backup, restore, list"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_config_report
    
    log ""
    log "========================================="
    log "Configuration Management Complete"
    log "Action: $ACTION"
    log "Environments processed: ${#DEPLOYED_CONFIGS[@]}"
    log "Validation errors: ${#CONFIG_VALIDATION_ERRORS[@]}"
    log "========================================="
    log "Log file: $LOG_FILE"
}

# Handle interrupts
trap 'log_error "Configuration management interrupted!"; exit 1' INT TERM

# Run main function
main