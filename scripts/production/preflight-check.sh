#!/bin/bash

# TerraFusion OS Production Preflight Check
# Benton County Production Deployment Verification

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
COUNTY="benton"
DB_NAME="terrafusion_benton"
DB_USER="terrafusion_db"
API_URL="http://localhost:5000"
WS_URL="ws://localhost:7000/terrafusion/core"
INSTALL_DIR="/opt/terrafusion"
LOG_DIR="/var/log/terrafusion"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log_message() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check function wrapper
check_component() {
    local component="$1"
    local check_function="$2"
    
    log_info "Checking $component..."
    
    if $check_function; then
        log_success "$component: OPERATIONAL"
        return 0
    else
        log_error "$component: FAILED"
        return 1
    fi
}

# System requirements check
check_system_requirements() {
    local errors=0
    
    # Check .NET runtime
    if command -v dotnet &> /dev/null; then
        local dotnet_version=$(dotnet --version 2>/dev/null | head -n1)
        log_success ".NET Runtime: $dotnet_version"
    else
        log_error ".NET Runtime not found"
        ((errors++))
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        local pg_version=$(psql --version | awk '{print $3}')
        log_success "PostgreSQL: $pg_version"
    else
        log_error "PostgreSQL not found"
        ((errors++))
    fi
    
    # Check Node.js (for frontend)
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js: $node_version"
    else
        log_warning "Node.js not found (optional for production)"
    fi
    
    # Check system resources
    local total_mem=$(free -m | awk 'NR==2{print $2}')
    local available_disk=$(df -BG "$PROJECT_ROOT" | awk 'NR==2{print $4}' | sed 's/G//')
    
    if [[ $total_mem -ge 4096 ]]; then
        log_success "Memory: ${total_mem}MB (>= 4GB required)"
    else
        log_error "Memory: ${total_mem}MB (< 4GB required)"
        ((errors++))
    fi
    
    if [[ $available_disk -ge 10 ]]; then
        log_success "Disk Space: ${available_disk}GB available"
    else
        log_error "Disk Space: ${available_disk}GB (< 10GB required)"
        ((errors++))
    fi
    
    return $errors
}

# Database connectivity check
check_database() {
    # Test database connection
    if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        log_success "Database connection established"
    else
        log_error "Cannot connect to database: $DB_NAME"
        return 1
    fi
    
    # Check Harris import schema
    if sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'harris_import';" | grep -q "3"; then
        log_success "Harris import schema present"
    else
        log_error "Harris import schema missing or incomplete"
        return 1
    fi
    
    # Check audit schema
    if sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'audit';" | grep -q "1"; then
        log_success "Audit schema present"
    else
        log_error "Audit schema missing"
        return 1
    fi
    
    return 0
}

# Service status check
check_services() {
    local errors=0
    
    # Check if services exist
    local services=("terrafusion-api" "terrafusion-backup.timer" "terrafusion-healthcheck.timer")
    
    for service in "${services[@]}"; do
        if systemctl list-unit-files | grep -q "$service"; then
            if systemctl is-active --quiet "$service"; then
                log_success "Service $service: ACTIVE"
            else
                log_warning "Service $service: INACTIVE"
                # Try to start the service
                if sudo systemctl start "$service" 2>/dev/null; then
                    log_success "Service $service: STARTED"
                else
                    log_error "Service $service: FAILED TO START"
                    ((errors++))
                fi
            fi
        else
            log_error "Service $service: NOT FOUND"
            ((errors++))
        fi
    done
    
    return $errors
}

# API endpoint check
check_api_endpoints() {
    # Wait for API to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s -f "$API_URL/health" &>/dev/null; then
            log_success "API health endpoint responding"
            break
        else
            ((attempt++))
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "API health endpoint not responding after ${max_attempts} attempts"
                return 1
            fi
            sleep 2
        fi
    done
    
    # Test SignalR negotiate endpoint
    if curl -s -f "$API_URL/terrafusion/core/negotiate" &>/dev/null; then
        log_success "SignalR negotiate endpoint responding"
    else
        log_error "SignalR negotiate endpoint not responding"
        return 1
    fi
    
    return 0
}

# Plugin system check
check_plugin_system() {
    local errors=0
    
    # Check plugin directory structure
    local plugin_dirs=("cama-core" "levy-core" "gis-core" "valuation-tools" "harris-pacs")
    
    for plugin in "${plugin_dirs[@]}"; do
        local plugin_path="$PROJECT_ROOT/frontend/src/plugins/$plugin"
        
        if [[ -d "$plugin_path" ]]; then
            # Check for manifest
            if [[ -f "$plugin_path/manifest.json" ]]; then
                log_success "Plugin $plugin: manifest found"
            else
                log_error "Plugin $plugin: manifest missing"
                ((errors++))
            fi
            
            # Check for main component
            if [[ -f "$plugin_path/index.tsx" ]]; then
                log_success "Plugin $plugin: component found"
            else
                log_error "Plugin $plugin: component missing"
                ((errors++))
            fi
        else
            log_error "Plugin $plugin: directory missing"
            ((errors++))
        fi
    done
    
    # Check Benton County configuration
    local benton_config="$PROJECT_ROOT/frontend/config/counties/benton.json"
    if [[ -f "$benton_config" ]]; then
        if jq -e '.requiredModules | length > 0' "$benton_config" &>/dev/null; then
            local module_count=$(jq -r '.requiredModules | length' "$benton_config")
            log_success "Benton County config: $module_count plugins configured"
        else
            log_error "Benton County config: no plugins configured"
            ((errors++))
        fi
    else
        log_error "Benton County config: file missing"
        ((errors++))
    fi
    
    return $errors
}

# Backup system check
check_backup_system() {
    local errors=0
    
    # Check backup directories
    local backup_dirs=("/var/backups/terrafusion/database" "/var/backups/terrafusion/application" "/var/backups/terrafusion/config")
    
    for dir in "${backup_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Backup directory exists: $dir"
        else
            log_error "Backup directory missing: $dir"
            ((errors++))
        fi
    done
    
    # Check backup scripts
    local backup_scripts=("/usr/local/bin/terrafusion-backup.sh" "/usr/local/bin/terrafusion-restore.sh")
    
    for script in "${backup_scripts[@]}"; do
        if [[ -x "$script" ]]; then
            log_success "Backup script executable: $script"
        else
            log_error "Backup script missing or not executable: $script"
            ((errors++))
        fi
    done
    
    # Test backup dry run
    if /usr/local/bin/terrafusion-backup.sh --dry-run &>/dev/null; then
        log_success "Backup system: dry run successful"
    else
        log_error "Backup system: dry run failed"
        ((errors++))
    fi
    
    return $errors
}

# Logging system check
check_logging_system() {
    local errors=0
    
    # Check log directories
    local log_dirs=("$LOG_DIR/api" "$LOG_DIR/plugins" "$LOG_DIR/audit" "$LOG_DIR/migration")
    
    for dir in "${log_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Log directory exists: $dir"
        else
            log_error "Log directory missing: $dir"
            ((errors++))
        fi
    done
    
    # Check log rotation configuration
    if [[ -f "/etc/logrotate.d/terrafusion" ]]; then
        log_success "Log rotation configured"
    else
        log_error "Log rotation not configured"
        ((errors++))
    fi
    
    # Check rsyslog configuration
    if [[ -f "/etc/rsyslog.d/50-terrafusion.conf" ]]; then
        log_success "Rsyslog configuration present"
    else
        log_error "Rsyslog configuration missing"
        ((errors++))
    fi
    
    return $errors
}

# Security check
check_security() {
    local errors=0
    
    # Check service user
    if id "terrafusion" &>/dev/null; then
        log_success "Service user 'terrafusion' exists"
    else
        log_error "Service user 'terrafusion' missing"
        ((errors++))
    fi
    
    # Check file permissions
    if [[ -d "$INSTALL_DIR" ]]; then
        local owner=$(stat -c '%U:%G' "$INSTALL_DIR" 2>/dev/null || echo "unknown")
        if [[ "$owner" == "terrafusion:terrafusion" ]]; then
            log_success "Install directory ownership correct"
        else
            log_error "Install directory ownership incorrect: $owner"
            ((errors++))
        fi
    fi
    
    # Check environment file security
    local env_file="$INSTALL_DIR/config/terrafusion.env"
    if [[ -f "$env_file" ]]; then
        local perms=$(stat -c '%a' "$env_file" 2>/dev/null || echo "000")
        if [[ "$perms" == "600" ]]; then
            log_success "Environment file permissions secure"
        else
            log_error "Environment file permissions insecure: $perms"
            ((errors++))
        fi
    else
        log_warning "Environment file not found (may not be deployed yet)"
    fi
    
    return $errors
}

# Performance baseline check
check_performance() {
    local errors=0
    
    # Check system load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_threshold=$(echo "$cpu_cores * 0.8" | bc -l)
    
    if (( $(echo "$load_avg < $load_threshold" | bc -l) )); then
        log_success "System load: $load_avg (threshold: $load_threshold)"
    else
        log_warning "System load high: $load_avg (threshold: $load_threshold)"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -lt 80 ]]; then
        log_success "Memory usage: ${mem_usage}%"
    else
        log_warning "Memory usage high: ${mem_usage}%"
    fi
    
    # Check disk I/O
    local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 85 ]]; then
        log_success "Disk usage: ${disk_usage}%"
    else
        log_warning "Disk usage high: ${disk_usage}%"
    fi
    
    return $errors
}

# Main execution
main() {
    echo "═══════════════════════════════════════════════"
    echo "   TERRAFUSION OS - PRODUCTION PREFLIGHT CHECK   "
    echo "═══════════════════════════════════════════════"
    echo "County: $COUNTY"
    echo "Database: $DB_NAME"
    echo "Timestamp: $(date)"
    echo "═══════════════════════════════════════════════"
    echo ""
    
    local total_errors=0
    
    # Run all checks
    check_component "System Requirements" check_system_requirements || ((total_errors++))
    echo ""
    
    check_component "Database Connectivity" check_database || ((total_errors++))
    echo ""
    
    check_component "SystemD Services" check_services || ((total_errors++))
    echo ""
    
    check_component "API Endpoints" check_api_endpoints || ((total_errors++))
    echo ""
    
    check_component "Plugin System" check_plugin_system || ((total_errors++))
    echo ""
    
    check_component "Backup System" check_backup_system || ((total_errors++))
    echo ""
    
    check_component "Logging System" check_logging_system || ((total_errors++))
    echo ""
    
    check_component "Security Configuration" check_security || ((total_errors++))
    echo ""
    
    check_component "Performance Baseline" check_performance || ((total_errors++))
    echo ""
    
    # Final verdict
    echo "═══════════════════════════════════════════════"
    if [[ $total_errors -eq 0 ]]; then
        log_success "🚀 ALL SYSTEMS OPERATIONAL - TERRAFUSION OS READY FOR PRODUCTION"
        echo ""
        log_info "Next steps:"
        log_info "1. Run initial Harris PACS import: psql -f scripts/production/initial-benton-import.sql"
        log_info "2. Start load testing: node scripts/production/load-test.js"
        log_info "3. Monitor logs: tail -f /var/log/terrafusion/api/terrafusion-api.log"
        echo ""
        exit 0
    else
        log_error "❌ PREFLIGHT FAILED - $total_errors CRITICAL ISSUES DETECTED"
        echo ""
        log_info "Please resolve the above issues before proceeding to production."
        echo ""
        exit 1
    fi
}

# Execute main function
main "$@"
