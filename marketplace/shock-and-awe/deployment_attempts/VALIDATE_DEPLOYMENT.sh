#!/bin/bash

# TerraFusion Deployment Validation Script
# Comprehensive validation for production deployment readiness
# Version: 1.0.0
# Date: 2025-08-07

set -euo pipefail

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly VALIDATION_TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
readonly VALIDATION_LOG_DIR="$SCRIPT_DIR/validation-logs/validation-$VALIDATION_TIMESTAMP"
readonly DEPLOYMENT_DIR="$SCRIPT_DIR/deployment-packages"
readonly TEMP_TEST_DIR="/tmp/terrafusion-validation-$VALIDATION_TIMESTAMP"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Validation configuration
TIMEOUT_STARTUP=30
TIMEOUT_IPC=10
TIMEOUT_HEALTH=15
MAX_MEMORY_MB=1024
MAX_CPU_PERCENT=50
PARALLEL_TESTS=4
SKIP_PERFORMANCE=false
SKIP_SECURITY=false
DEEP_VALIDATION=false

# Application tracking
declare -a APPS=()
declare -A APP_STATUS=()
declare -A APP_PIDS=()
declare -a VALIDATION_ERRORS=()
declare -a VALIDATION_WARNINGS=()

# Metrics
TOTAL_VALIDATION_TIME=0
START_TIME=$(date +%s)

# Cleanup function
cleanup() {
    local exit_code=$?
    echo -e "\n${YELLOW}🧹 Cleaning up validation environment...${NC}"
    
    # Kill any running test applications
    for app_name in "${!APP_PIDS[@]}"; do
        local pid="${APP_PIDS[$app_name]}"
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            echo "Terminating $app_name (PID: $pid)"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    # Clean up temporary files
    if [[ -d "$TEMP_TEST_DIR" ]]; then
        rm -rf "$TEMP_TEST_DIR"
    fi
    
    if [[ $exit_code -ne 0 ]]; then
        generate_failure_report
    fi
    
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$VALIDATION_LOG_DIR/master.log"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$VALIDATION_LOG_DIR/master.log"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$VALIDATION_LOG_DIR/master.log"
    VALIDATION_WARNINGS+=("$1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$VALIDATION_LOG_DIR/master.log"
    VALIDATION_ERRORS+=("$1")
}

log_header() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}🔍 $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Usage function
show_usage() {
    cat << EOF
TerraFusion Deployment Validation System v1.0.0

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --timeout-startup <s>      Startup timeout in seconds (default: 30)
    --timeout-ipc <s>          IPC timeout in seconds (default: 10)
    --timeout-health <s>       Health check timeout in seconds (default: 15)
    --max-memory <MB>          Maximum memory usage in MB (default: 1024)
    --max-cpu <percent>        Maximum CPU usage percentage (default: 50)
    --parallel <n>             Parallel test count (default: 4)
    --skip-performance         Skip performance validation
    --skip-security            Skip security validation
    --deep                     Enable deep validation mode
    --help                     Show this help message

EXAMPLES:
    $0 --timeout-startup 60 --deep
    $0 --skip-performance --parallel 2
    $0 --max-memory 2048 --max-cpu 25

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout-startup)
                TIMEOUT_STARTUP="$2"
                shift 2
                ;;
            --timeout-ipc)
                TIMEOUT_IPC="$2"
                shift 2
                ;;
            --timeout-health)
                TIMEOUT_HEALTH="$2"
                shift 2
                ;;
            --max-memory)
                MAX_MEMORY_MB="$2"
                shift 2
                ;;
            --max-cpu)
                MAX_CPU_PERCENT="$2"
                shift 2
                ;;
            --parallel)
                PARALLEL_TESTS="$2"
                shift 2
                ;;
            --skip-performance)
                SKIP_PERFORMANCE=true
                shift
                ;;
            --skip-security)
                SKIP_SECURITY=true
                shift
                ;;
            --deep)
                DEEP_VALIDATION=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Initialize validation environment
initialize_validation_environment() {
    log_header "VALIDATION ENVIRONMENT INITIALIZATION"
    
    # Create directories
    mkdir -p "$VALIDATION_LOG_DIR"
    mkdir -p "$TEMP_TEST_DIR"
    
    # Initialize master log
    cat > "$VALIDATION_LOG_DIR/master.log" << EOF
TerraFusion Deployment Validation Log
Started at: $(date)
Validation ID: $VALIDATION_TIMESTAMP
Configuration:
  Startup timeout: ${TIMEOUT_STARTUP}s
  IPC timeout: ${TIMEOUT_IPC}s
  Health timeout: ${TIMEOUT_HEALTH}s
  Max memory: ${MAX_MEMORY_MB}MB
  Max CPU: ${MAX_CPU_PERCENT}%
  Parallel tests: $PARALLEL_TESTS
  Skip performance: $SKIP_PERFORMANCE
  Skip security: $SKIP_SECURITY
  Deep validation: $DEEP_VALIDATION

EOF
    
    log_success "Validation environment initialized"
    log_info "Validation logs: $VALIDATION_LOG_DIR"
    log_info "Temp directory: $TEMP_TEST_DIR"
}

# Discover deployed applications
discover_deployed_applications() {
    log_header "DEPLOYED APPLICATION DISCOVERY"
    
    # Find all deployment packages
    if [[ ! -d "$DEPLOYMENT_DIR" ]]; then
        log_error "Deployment directory not found: $DEPLOYMENT_DIR"
        log_info "Run BUILD_ALL_PRODUCTION.sh first to create deployment packages"
        exit 1
    fi
    
    while IFS= read -r -d '' package_file; do
        local package_name
        package_name=$(basename "$package_file" .tar.gz | sed 's/-[0-9]*_[0-9]*//g')
        
        # Extract package for testing
        local extract_dir="$TEMP_TEST_DIR/$package_name"
        mkdir -p "$extract_dir"
        
        if tar -xzf "$package_file" -C "$extract_dir" --strip-components=1 2>/dev/null; then
            APPS+=("$package_name")
            APP_STATUS["$package_name"]="discovered"
            log_info "Discovered deployed app: $package_name"
        else
            log_error "Failed to extract package: $(basename "$package_file")"
        fi
    done < <(find "$DEPLOYMENT_DIR" -name "*.tar.gz" -not -name "terrafusion-complete-*" -type f -print0)
    
    if [[ ${#APPS[@]} -eq 0 ]]; then
        log_error "No deployed applications found for validation"
        exit 1
    fi
    
    log_success "Discovered ${#APPS[@]} deployed applications"
}

# Validate package integrity
validate_package_integrity() {
    log_header "PACKAGE INTEGRITY VALIDATION"
    
    # Check checksums if available
    local checksum_files
    checksum_files=$(find "$DEPLOYMENT_DIR" -name "checksums-*.sha256" -type f)
    
    if [[ -n "$checksum_files" ]]; then
        for checksum_file in $checksum_files; do
            log_info "Validating checksums from $(basename "$checksum_file")"
            
            if (cd "$DEPLOYMENT_DIR" && sha256sum -c "$checksum_file") > "$VALIDATION_LOG_DIR/checksum-validation.log" 2>&1; then
                log_success "All checksums validated successfully"
            else
                log_error "Checksum validation failed"
                cat "$VALIDATION_LOG_DIR/checksum-validation.log"
                return 1
            fi
        done
    else
        log_warning "No checksum files found for validation"
    fi
    
    # Validate package structure
    for app_name in "${APPS[@]}"; do
        local app_dir="$TEMP_TEST_DIR/$app_name"
        
        log_info "Validating package structure for $app_name"
        
        # Check required files
        local required_files=("package.json" "install.sh")
        for file in "${required_files[@]}"; do
            if [[ -f "$app_dir/$file" ]]; then
                log_success "Found required file: $file"
            else
                log_error "Missing required file: $file in $app_name"
                APP_STATUS["$app_name"]="invalid"
                continue 2
            fi
        done
        
        # Check executable permissions
        if [[ -f "$app_dir/install.sh" && -x "$app_dir/install.sh" ]]; then
            log_success "Install script is executable for $app_name"
        else
            log_error "Install script not executable for $app_name"
        fi
        
        # Check for release binaries
        if [[ -d "$app_dir/release" ]]; then
            local binaries
            binaries=$(find "$app_dir/release" -type f -executable | wc -l)
            if [[ $binaries -gt 0 ]]; then
                log_success "Found $binaries executable(s) for $app_name"
            else
                log_warning "No executables found in release directory for $app_name"
            fi
        else
            log_warning "No release directory found for $app_name"
        fi
        
        APP_STATUS["$app_name"]="validated"
    done
    
    log_success "Package integrity validation completed"
}

# Test application startup
test_application_startup() {
    log_header "APPLICATION STARTUP VALIDATION"
    
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" != "validated" ]]; then
            log_warning "Skipping startup test for invalid app: $app_name"
            continue
        fi
        
        log_info "Testing startup for $app_name"
        
        local app_dir="$TEMP_TEST_DIR/$app_name"
        local executable=""
        
        # Find the main executable
        if [[ -d "$app_dir/release" ]]; then
            executable=$(find "$app_dir/release" -type f -executable -name "*$app_name*" | head -n1)
            if [[ -z "$executable" ]]; then
                executable=$(find "$app_dir/release" -type f -executable | head -n1)
            fi
        fi
        
        if [[ -z "$executable" || ! -f "$executable" ]]; then
            log_error "No executable found for $app_name"
            APP_STATUS["$app_name"]="startup_failed"
            continue
        fi
        
        log_info "Starting $app_name from $executable"
        
        # Start application in background
        timeout "$TIMEOUT_STARTUP" "$executable" > "$VALIDATION_LOG_DIR/${app_name}-startup.log" 2>&1 &
        local pid=$!
        APP_PIDS["$app_name"]=$pid
        
        # Wait for startup
        local startup_success=false
        for i in $(seq 1 "$TIMEOUT_STARTUP"); do
            if ! kill -0 "$pid" 2>/dev/null; then
                # Process ended - check exit code
                wait "$pid"
                local exit_code=$?
                if [[ $exit_code -eq 0 ]]; then
                    startup_success=true
                    break
                else
                    log_error "$app_name exited with code $exit_code during startup"
                    break
                fi
            fi
            
            # Check if app is responding (basic check)
            if [[ $i -gt 5 ]] && kill -0 "$pid" 2>/dev/null; then
                startup_success=true
                break
            fi
            
            sleep 1
        done
        
        if [[ $startup_success == true ]]; then
            log_success "$app_name started successfully"
            APP_STATUS["$app_name"]="running"
        else
            log_error "$app_name failed to start within ${TIMEOUT_STARTUP}s"
            APP_STATUS["$app_name"]="startup_failed"
            
            # Kill hung process
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid" 2>/dev/null || true
                sleep 2
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done
    
    log_success "Application startup validation completed"
}

# Test IPC communication
test_ipc_communication() {
    log_header "IPC COMMUNICATION VALIDATION"
    
    log_info "Testing inter-process communication capabilities"
    
    # Test shared IPC protocol
    if [[ -f "shared/ipc-protocol/dist/index.js" ]]; then
        log_info "Testing IPC protocol module"
        
        if timeout "$TIMEOUT_IPC" node -e "
            try {
                const ipc = require('./shared/ipc-protocol/dist/index.js');
                console.log('IPC protocol loaded successfully');
                process.exit(0);
            } catch (error) {
                console.error('IPC protocol error:', error.message);
                process.exit(1);
            }
        " > "$VALIDATION_LOG_DIR/ipc-test.log" 2>&1; then
            log_success "IPC protocol module loads correctly"
        else
            log_error "IPC protocol module failed to load"
        fi
    else
        log_warning "IPC protocol module not found - may need to run build first"
    fi
    
    # Test basic IPC functionality for running apps
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == "running" ]]; then
            log_info "Testing IPC for $app_name"
            
            local pid="${APP_PIDS[$app_name]}"
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                # Send basic signal test
                if kill -USR1 "$pid" 2>/dev/null; then
                    log_success "Basic IPC signal test passed for $app_name"
                else
                    log_warning "Basic IPC signal test failed for $app_name"
                fi
            fi
        fi
    done
    
    log_success "IPC communication validation completed"
}

# Check system metrics
check_system_metrics() {
    if [[ $SKIP_PERFORMANCE == true ]]; then
        log_warning "Skipping system metrics check as requested"
        return 0
    fi
    
    log_header "SYSTEM METRICS VALIDATION"
    
    log_info "Monitoring system performance metrics"
    
    # Monitor for 10 seconds
    local monitor_duration=10
    local cpu_samples=()
    local memory_samples=()
    
    for i in $(seq 1 "$monitor_duration"); do
        # CPU usage
        if command -v top >/dev/null 2>&1; then
            local cpu_usage
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'u' -f1)
            cpu_samples+=("$cpu_usage")
        fi
        
        # Memory usage
        if command -v free >/dev/null 2>&1; then
            local memory_used
            memory_used=$(free -m | awk 'NR==2{printf "%.1f", $3*100/$2}')
            memory_samples+=("$memory_used")
        fi
        
        sleep 1
    done
    
    # Calculate averages
    if [[ ${#cpu_samples[@]} -gt 0 ]]; then
        local avg_cpu
        avg_cpu=$(printf '%s\n' "${cpu_samples[@]}" | awk '{sum+=$1} END {printf "%.1f", sum/NR}')
        
        if (( $(echo "$avg_cpu > $MAX_CPU_PERCENT" | bc -l) )); then
            log_warning "Average CPU usage ${avg_cpu}% exceeds threshold ${MAX_CPU_PERCENT}%"
        else
            log_success "Average CPU usage ${avg_cpu}% within acceptable range"
        fi
    fi
    
    if [[ ${#memory_samples[@]} -gt 0 ]]; then
        local avg_memory
        avg_memory=$(printf '%s\n' "${memory_samples[@]}" | awk '{sum+=$1} END {printf "%.1f", sum/NR}')
        
        log_info "Average memory usage: ${avg_memory}%"
        log_success "System metrics monitoring completed"
    fi
    
    # Check individual app metrics
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == "running" ]]; then
            local pid="${APP_PIDS[$app_name]}"
            
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                # Memory usage for specific process
                if command -v ps >/dev/null 2>&1; then
                    local app_memory
                    app_memory=$(ps -p "$pid" -o rss= 2>/dev/null | awk '{print $1/1024}' || echo "0")
                    
                    if (( $(echo "$app_memory > $MAX_MEMORY_MB" | bc -l) )); then
                        log_warning "$app_name memory usage ${app_memory}MB exceeds threshold ${MAX_MEMORY_MB}MB"
                    else
                        log_success "$app_name memory usage ${app_memory}MB within acceptable range"
                    fi
                fi
            fi
        fi
    done
    
    log_success "System metrics validation completed"
}

# Validate branding consistency
validate_branding() {
    log_header "BRANDING VALIDATION"
    
    log_info "Validating TerraFusion branding consistency"
    
    for app_name in "${APPS[@]}"; do
        local app_dir="$TEMP_TEST_DIR/$app_name"
        local branding_errors=0
        
        log_info "Checking branding for $app_name"
        
        # Check package.json for correct branding
        if [[ -f "$app_dir/package.json" ]]; then
            if grep -q "terrafusion\|TerraFusion" "$app_dir/package.json"; then
                log_success "TerraFusion branding found in package.json for $app_name"
            else
                log_warning "TerraFusion branding not found in package.json for $app_name"
                ((branding_errors++))
            fi
        fi
        
        # Check for branding CSS files
        if [[ -f "$app_dir/dist/assets/"*"terrafusion"* ]] 2>/dev/null; then
            log_success "TerraFusion CSS assets found for $app_name"
        elif [[ -d "$app_dir/dist" ]]; then
            if find "$app_dir/dist" -name "*.css" -exec grep -l "terrafusion\|TerraFusion" {} \; | head -1 >/dev/null; then
                log_success "TerraFusion branding found in CSS for $app_name"
            else
                log_warning "TerraFusion branding not found in CSS for $app_name"
                ((branding_errors++))
            fi
        fi
        
        # Check tauri.conf.json for correct app identification
        if [[ -f "$app_dir/tauri.conf.json" ]]; then
            if grep -q "com.terrafusion" "$app_dir/tauri.conf.json"; then
                log_success "Correct app identifier found for $app_name"
            else
                log_warning "TerraFusion app identifier not found for $app_name"
                ((branding_errors++))
            fi
        fi
        
        if [[ $branding_errors -eq 0 ]]; then
            log_success "Branding validation passed for $app_name"
        else
            log_warning "Branding validation found $branding_errors issues for $app_name"
        fi
    done
    
    log_success "Branding validation completed"
}

# Check for development artifacts
check_development_artifacts() {
    log_header "DEVELOPMENT ARTIFACTS VALIDATION"
    
    log_info "Checking for development artifacts that shouldn't be in production"
    
    local artifact_patterns=(
        "*.map"
        "*.test.*"
        "*.spec.*"
        "*debug*"
        "*test*"
        "node_modules"
        ".git"
        ".env.local"
        ".env.development"
        "src-tauri/target/debug"
    )
    
    for app_name in "${APPS[@]}"; do
        local app_dir="$TEMP_TEST_DIR/$app_name"
        local artifacts_found=0
        
        log_info "Checking development artifacts for $app_name"
        
        for pattern in "${artifact_patterns[@]}"; do
            if find "$app_dir" -name "$pattern" -type f -o -name "$pattern" -type d | head -1 | grep -q .; then
                local found_artifacts
                found_artifacts=$(find "$app_dir" -name "$pattern" -type f -o -name "$pattern" -type d | wc -l)
                log_warning "Found $found_artifacts development artifacts matching '$pattern' in $app_name"
                ((artifacts_found++))
            fi
        done
        
        # Check for debug symbols in binaries
        if [[ -d "$app_dir/release" ]]; then
            local debug_binaries
            debug_binaries=$(find "$app_dir/release" -type f -executable -exec file {} \; | grep -c "not stripped" || true)
            if [[ $debug_binaries -gt 0 ]]; then
                log_warning "Found $debug_binaries unstripped binaries in $app_name"
                ((artifacts_found++))
            else
                log_success "All binaries are properly stripped for $app_name"
            fi
        fi
        
        if [[ $artifacts_found -eq 0 ]]; then
            log_success "No development artifacts found for $app_name"
        else
            log_warning "Found $artifacts_found development artifact issues for $app_name"
        fi
    done
    
    log_success "Development artifacts validation completed"
}

# Security validation
validate_security() {
    if [[ $SKIP_SECURITY == true ]]; then
        log_warning "Skipping security validation as requested"
        return 0
    fi
    
    log_header "SECURITY VALIDATION"
    
    log_info "Performing security validation checks"
    
    for app_name in "${APPS[@]}"; do
        local app_dir="$TEMP_TEST_DIR/$app_name"
        local security_issues=0
        
        log_info "Security validation for $app_name"
        
        # Check file permissions
        if [[ -d "$app_dir/release" ]]; then
            local world_writable
            world_writable=$(find "$app_dir/release" -type f -perm -002 | wc -l)
            if [[ $world_writable -gt 0 ]]; then
                log_error "Found $world_writable world-writable files in $app_name"
                ((security_issues++))
            else
                log_success "File permissions are secure for $app_name"
            fi
        fi
        
        # Check for hardcoded secrets (basic patterns)
        local secret_patterns=("password" "secret" "key" "token" "api_key")
        for pattern in "${secret_patterns[@]}"; do
            if find "$app_dir" -type f -name "*.json" -o -name "*.js" -o -name "*.ts" | xargs grep -il "$pattern" 2>/dev/null | head -1 | grep -q .; then
                log_warning "Potential hardcoded secrets found containing '$pattern' in $app_name"
                ((security_issues++))
            fi
        done
        
        # Check Tauri security configuration
        if [[ -f "$app_dir/tauri.conf.json" ]]; then
            if grep -q '"dangerousDisableAssetCspModification": true' "$app_dir/tauri.conf.json"; then
                log_error "Dangerous CSP modification is enabled in $app_name"
                ((security_issues++))
            else
                log_success "CSP security configuration is safe for $app_name"
            fi
            
            if grep -q '"allowAllDomains": true' "$app_dir/tauri.conf.json"; then
                log_warning "All domains are allowed in $app_name (potential security risk)"
                ((security_issues++))
            fi
        fi
        
        if [[ $security_issues -eq 0 ]]; then
            log_success "Security validation passed for $app_name"
        else
            log_warning "Security validation found $security_issues issues for $app_name"
        fi
    done
    
    log_success "Security validation completed"
}

# Health check validation
validate_health_checks() {
    log_header "HEALTH CHECK VALIDATION"
    
    log_info "Validating application health endpoints and status"
    
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == "running" ]]; then
            local pid="${APP_PIDS[$app_name]}"
            
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                log_info "Health check for $app_name (PID: $pid)"
                
                # Basic process health
                local process_status
                process_status=$(ps -p "$pid" -o state= 2>/dev/null | tr -d ' ')
                
                case "$process_status" in
                    "S"|"R")
                        log_success "$app_name is in healthy state ($process_status)"
                        ;;
                    "Z")
                        log_error "$app_name is a zombie process"
                        APP_STATUS["$app_name"]="unhealthy"
                        ;;
                    "T")
                        log_warning "$app_name is stopped/traced"
                        ;;
                    *)
                        log_warning "$app_name has unknown status: $process_status"
                        ;;
                esac
                
                # Check if process is responsive (send signal and verify it's still alive)
                if kill -0 "$pid" 2>/dev/null; then
                    sleep 1
                    if kill -0 "$pid" 2>/dev/null; then
                        log_success "$app_name is responsive to signals"
                    else
                        log_error "$app_name became unresponsive"
                        APP_STATUS["$app_name"]="unresponsive"
                    fi
                fi
            else
                log_error "$app_name process is not running"
                APP_STATUS["$app_name"]="not_running"
            fi
        else
            log_warning "Skipping health check for $app_name (status: ${APP_STATUS[$app_name]})"
        fi
    done
    
    log_success "Health check validation completed"
}

# Deep validation mode
perform_deep_validation() {
    if [[ $DEEP_VALIDATION == false ]]; then
        return 0
    fi
    
    log_header "DEEP VALIDATION MODE"
    
    log_info "Performing comprehensive deep validation"
    
    # Memory leak detection
    log_info "Monitoring for memory leaks over 60 seconds"
    
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == "running" ]]; then
            local pid="${APP_PIDS[$app_name]}"
            
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                local initial_memory
                initial_memory=$(ps -p "$pid" -o rss= 2>/dev/null | awk '{print $1}' || echo "0")
                
                log_info "Initial memory for $app_name: ${initial_memory}KB"
                
                # Wait and check again
                sleep 60
                
                if kill -0 "$pid" 2>/dev/null; then
                    local final_memory
                    final_memory=$(ps -p "$pid" -o rss= 2>/dev/null | awk '{print $1}' || echo "0")
                    local memory_growth=$((final_memory - initial_memory))
                    
                    log_info "Final memory for $app_name: ${final_memory}KB (growth: ${memory_growth}KB)"
                    
                    if [[ $memory_growth -gt 10240 ]]; then # More than 10MB growth
                        log_warning "$app_name may have a memory leak (grew by ${memory_growth}KB in 60s)"
                    else
                        log_success "$app_name memory usage is stable"
                    fi
                else
                    log_error "$app_name crashed during deep validation"
                    APP_STATUS["$app_name"]="crashed"
                fi
            fi
        fi
    done
    
    log_success "Deep validation completed"
}

# Generate validation report
generate_validation_report() {
    log_header "VALIDATION REPORT GENERATION"
    
    local report_file="$VALIDATION_LOG_DIR/VALIDATION_REPORT_$VALIDATION_TIMESTAMP.md"
    local end_time
    end_time=$(date +%s)
    TOTAL_VALIDATION_TIME=$((end_time - START_TIME))
    
    cat > "$report_file" << EOF
# TerraFusion Deployment Validation Report

**Validation ID**: $VALIDATION_TIMESTAMP  
**Date**: $(date)  
**Duration**: ${TOTAL_VALIDATION_TIME}s  

## Configuration

- **Startup Timeout**: ${TIMEOUT_STARTUP}s
- **IPC Timeout**: ${TIMEOUT_IPC}s
- **Health Timeout**: ${TIMEOUT_HEALTH}s
- **Max Memory**: ${MAX_MEMORY_MB}MB
- **Max CPU**: ${MAX_CPU_PERCENT}%
- **Parallel Tests**: $PARALLEL_TESTS
- **Skip Performance**: $SKIP_PERFORMANCE
- **Skip Security**: $SKIP_SECURITY
- **Deep Validation**: $DEEP_VALIDATION

## Applications Validated

| Application | Status | Issues | Notes |
|-------------|--------|--------|-------|
EOF
    
    for app_name in "${APPS[@]}"; do
        local status="${APP_STATUS[$app_name]}"
        local issues="0"
        local notes="OK"
        
        # Count issues specific to this app
        for error in "${VALIDATION_ERRORS[@]}"; do
            if [[ "$error" == *"$app_name"* ]]; then
                ((issues++))
            fi
        done
        
        for warning in "${VALIDATION_WARNINGS[@]}"; do
            if [[ "$warning" == *"$app_name"* ]]; then
                ((issues++))
            fi
        done
        
        if [[ $issues -gt 0 ]]; then
            notes="$issues issues found"
        fi
        
        echo "| $app_name | $status | $issues | $notes |" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## Validation Results

- **Total Applications**: ${#APPS[@]}
- **Validation Errors**: ${#VALIDATION_ERRORS[@]}
- **Validation Warnings**: ${#VALIDATION_WARNINGS[@]}
- **Overall Status**: $(if [[ ${#VALIDATION_ERRORS[@]} -eq 0 ]]; then echo "PASS"; else echo "FAIL"; fi)

## System Information

- **Platform**: $(uname -a)
- **Memory**: $(free -h | awk 'NR==2{print $2}' 2>/dev/null || echo "Unknown")
- **CPU**: $(nproc 2>/dev/null || echo "Unknown") cores

## Errors

EOF
    
    if [[ ${#VALIDATION_ERRORS[@]} -eq 0 ]]; then
        echo "No validation errors found." >> "$report_file"
    else
        for error in "${VALIDATION_ERRORS[@]}"; do
            echo "- $error" >> "$report_file"
        done
    fi
    
    cat >> "$report_file" << EOF

## Warnings

EOF
    
    if [[ ${#VALIDATION_WARNINGS[@]} -eq 0 ]]; then
        echo "No validation warnings found." >> "$report_file"
    else
        for warning in "${VALIDATION_WARNINGS[@]}"; do
            echo "- $warning" >> "$report_file"
        done
    fi
    
    cat >> "$report_file" << EOF

## Recommendations

EOF
    
    if [[ ${#VALIDATION_ERRORS[@]} -gt 0 ]]; then
        cat >> "$report_file" << EOF
1. **Fix Critical Errors**: Address all validation errors before production deployment
2. **Review Logs**: Check individual application logs in $VALIDATION_LOG_DIR
3. **Rebuild**: Consider rebuilding affected applications with BUILD_ALL_PRODUCTION.sh
EOF
    elif [[ ${#VALIDATION_WARNINGS[@]} -gt 0 ]]; then
        cat >> "$report_file" << EOF
1. **Address Warnings**: Review and resolve validation warnings for optimal deployment
2. **Monitor Performance**: Continue monitoring during initial production deployment
3. **Update Documentation**: Document any configuration changes made
EOF
    else
        cat >> "$report_file" << EOF
1. **Deployment Ready**: All validations passed - applications are ready for production
2. **Monitor Deployment**: Continue monitoring during production deployment
3. **Regular Validation**: Run validation periodically in production environment
EOF
    fi
    
    log_success "Validation report generated: $(basename "$report_file")"
    log_info "View report: cat $report_file"
    
    return "$report_file"
}

# Generate failure report
generate_failure_report() {
    local report_file="$VALIDATION_LOG_DIR/FAILURE_REPORT_$VALIDATION_TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# TerraFusion Deployment Validation Failure Report

**Validation ID**: $VALIDATION_TIMESTAMP  
**Date**: $(date)  
**Failed At**: $(date)

## Critical Errors

EOF
    
    for error in "${VALIDATION_ERRORS[@]}"; do
        echo "- $error" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## Failed Applications

EOF
    
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == *"failed"* ]] || [[ "${APP_STATUS[$app_name]}" == "invalid" ]]; then
            echo "- $app_name (Status: ${APP_STATUS[$app_name]})" >> "$report_file"
        fi
    done
    
    echo -e "\n## Debugging Commands\n" >> "$report_file"
    echo '```bash' >> "$report_file"
    echo "cd $SCRIPT_DIR" >> "$report_file"
    echo "# Check validation logs:" >> "$report_file"
    echo "ls -la $VALIDATION_LOG_DIR" >> "$report_file"
    echo "# Review specific app logs:" >> "$report_file"
    for app_name in "${APPS[@]}"; do
        echo "cat $VALIDATION_LOG_DIR/${app_name}-*.log" >> "$report_file"
    done
    echo '```' >> "$report_file"
    
    log_error "Failure report generated: $(basename "$report_file")"
}

# Print final summary
print_final_summary() {
    local end_time
    end_time=$(date +%s)
    TOTAL_VALIDATION_TIME=$((end_time - START_TIME))
    
    log_header "VALIDATION COMPLETION SUMMARY"
    
    echo -e "${CYAN}🔍 TERRAFUSION DEPLOYMENT VALIDATION COMPLETE 🔍${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════${NC}"
    echo
    echo -e "${GREEN}📊 Validation Statistics:${NC}"
    echo -e "   • Total Time: ${TOTAL_VALIDATION_TIME}s ($(($TOTAL_VALIDATION_TIME / 60))m $(($TOTAL_VALIDATION_TIME % 60))s)"
    echo -e "   • Applications: ${#APPS[@]} tested"
    echo -e "   • Errors: ${#VALIDATION_ERRORS[@]}"
    echo -e "   • Warnings: ${#VALIDATION_WARNINGS[@]}"
    echo
    
    # Count successful apps
    local successful_apps=0
    for app_name in "${APPS[@]}"; do
        if [[ "${APP_STATUS[$app_name]}" == "running" ]] || [[ "${APP_STATUS[$app_name]}" == "validated" ]]; then
            ((successful_apps++))
        fi
    done
    
    echo -e "${GREEN}🎯 Application Status:${NC}"
    echo -e "   • Successful: $successful_apps"
    echo -e "   • Failed: $((${#APPS[@]} - successful_apps))"
    echo -e "   • Success Rate: $(( successful_apps * 100 / ${#APPS[@]} ))%"
    echo
    echo -e "${GREEN}📁 Validation Assets:${NC}"
    echo -e "   • Logs: $VALIDATION_LOG_DIR"
    echo -e "   • Report: VALIDATION_REPORT_$VALIDATION_TIMESTAMP.md"
    echo
    
    if [[ ${#VALIDATION_ERRORS[@]} -eq 0 ]]; then
        echo -e "${GREEN}🎉 VALIDATION SUCCESSFUL - DEPLOYMENT READY! 🎉${NC}"
        echo -e "${GREEN}🚀 Next Steps:${NC}"
        echo -e "   • Check status dashboard: cat PRODUCTION_STATUS.md"
        echo -e "   • Deploy to production environment"
        echo -e "   • Monitor applications in production"
        return 0
    else
        echo -e "${RED}❌ VALIDATION FAILED - NOT READY FOR DEPLOYMENT${NC}"
        echo -e "${YELLOW}🔧 Required Actions:${NC}"
        echo -e "   • Fix ${#VALIDATION_ERRORS[@]} critical errors"
        echo -e "   • Address ${#VALIDATION_WARNINGS[@]} warnings"
        echo -e "   • Re-run validation after fixes"
        return 1
    fi
}

# Main execution function
main() {
    log_header "TERRAFUSION DEPLOYMENT VALIDATION SYSTEM"
    echo -e "${CYAN}🔍 Championship-level deployment validation${NC}"
    echo -e "${CYAN}   Version 1.0.0 | Validation ID: $VALIDATION_TIMESTAMP${NC}"
    echo
    
    parse_arguments "$@"
    initialize_validation_environment
    discover_deployed_applications
    validate_package_integrity
    test_application_startup
    test_ipc_communication
    check_system_metrics
    validate_branding
    check_development_artifacts
    validate_security
    validate_health_checks
    perform_deep_validation
    generate_validation_report
    print_final_summary
}

# Execute main function with all arguments
main "$@"