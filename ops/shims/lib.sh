#!/usr/bin/env bash
# TerraFusion Ops Library - Robust bash utilities
# Provides hardened functions for safe script execution

# =============================================================================
# Strict Mode & Error Handling
# =============================================================================

# Enable strict mode for robust error handling
set -euo pipefail
IFS=$'\n\t'

# Global variables
declare -g TERRAFUSION_LIB_VERSION="2.0.0"
declare -g TERRAFUSION_LOG_LEVEL="${TERRAFUSION_LOG_LEVEL:-INFO}"
declare -g TERRAFUSION_LOG_DIR="${TERRAFUSION_LOG_DIR:-./var/log/ops}"
declare -g TERRAFUSION_LOCK_DIR="${TERRAFUSION_LOCK_DIR:-./var/lock}"
declare -g TERRAFUSION_PID_FILE=""
declare -g TERRAFUSION_CLEANUP_REGISTERED=false

# Color codes for output
declare -gr RED='\033[0;31m'
declare -gr GREEN='\033[0;32m'
declare -gr YELLOW='\033[1;33m'
declare -gr BLUE='\033[0;34m'
declare -gr PURPLE='\033[0;35m'
declare -gr CYAN='\033[0;36m'
declare -gr WHITE='\033[1;37m'
declare -gr NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================

log_setup() {
    local script_name="${1:-unknown}"
    local log_file="${TERRAFUSION_LOG_DIR}/${script_name}_$(date +%Y%m%d_%H%M%S).log"
    
    # Create log directory if it doesn't exist
    mkdir -p "${TERRAFUSION_LOG_DIR}"
    
    # Export for child processes
    export TERRAFUSION_CURRENT_LOG_FILE="$log_file"
    
    # Initialize log file
    echo "=== TerraFusion Ops Log Started: $(date) ===" > "$log_file"
    echo "Script: $script_name" >> "$log_file"
    echo "PID: $$" >> "$log_file"
    echo "User: $(whoami)" >> "$log_file"
    echo "PWD: $(pwd)" >> "$log_file"
    echo "=========================================" >> "$log_file"
    
    echo "$log_file"
}

log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[$timestamp] [$level] [$$] $message"
    
    # Write to log file if available
    if [[ -n "${TERRAFUSION_CURRENT_LOG_FILE:-}" ]]; then
        echo "$log_entry" >> "$TERRAFUSION_CURRENT_LOG_FILE"
    fi
    
    # Output to console based on log level
    case "$level" in
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" >&2
            ;;
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "DEBUG")
            [[ "$TERRAFUSION_LOG_LEVEL" == "DEBUG" ]] && echo -e "${CYAN}[DEBUG]${NC} $message"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

log_info() { log_message "INFO" "$1"; }
log_warn() { log_message "WARN" "$1"; }
log_error() { log_message "ERROR" "$1"; }
log_debug() { log_message "DEBUG" "$1"; }

# =============================================================================
# Signal Traps & Cleanup
# =============================================================================

setup_signal_traps() {
    local script_name="${1:-unknown}"
    
    # Register cleanup function
    if [[ "$TERRAFUSION_CLEANUP_REGISTERED" == "false" ]]; then
        trap "cleanup_and_exit 130 'Received SIGINT'" INT
        trap "cleanup_and_exit 143 'Received SIGTERM'" TERM
        trap "cleanup_and_exit 1 'Script error'" ERR
        trap "cleanup_and_exit 0 'Script completed'" EXIT
        
        TERRAFUSION_CLEANUP_REGISTERED=true
        log_debug "Signal traps registered for $script_name"
    fi
}

cleanup_and_exit() {
    local exit_code="${1:-0}"
    local reason="${2:-Unknown}"
    local end_time=$(date)
    
    # Disable ERR trap to prevent recursive calls
    trap - ERR
    
    log_info "Cleanup initiated: $reason (exit code: $exit_code)"
    
    # Remove PID file if it exists
    if [[ -n "${TERRAFUSION_PID_FILE:-}" ]] && [[ -f "$TERRAFUSION_PID_FILE" ]]; then
        rm -f "$TERRAFUSION_PID_FILE"
        log_debug "Removed PID file: $TERRAFUSION_PID_FILE"
    fi
    
    # Kill any background jobs
    local jobs_count=$(jobs -r | wc -l)
    if [[ $jobs_count -gt 0 ]]; then
        log_warn "Terminating $jobs_count background jobs"
        kill $(jobs -p) 2>/dev/null || true
    fi
    
    # Final log entry
    if [[ -n "${TERRAFUSION_CURRENT_LOG_FILE:-}" ]]; then
        echo "=== Script ended: $end_time (exit: $exit_code) ===" >> "$TERRAFUSION_CURRENT_LOG_FILE"
    fi
    
    # Only exit if not already exiting
    if [[ "$exit_code" != "0" ]] && [[ "${BASH_SUBSHELL:-0}" == "0" ]]; then
        exit "$exit_code"
    fi
}

# =============================================================================
# File Locking
# =============================================================================

acquire_lock() {
    local lock_name="$1"
    local timeout="${2:-60}"
    local lock_file="${TERRAFUSION_LOCK_DIR}/${lock_name}.lock"
    local wait_time=0
    
    mkdir -p "$TERRAFUSION_LOCK_DIR"
    
    while [[ $wait_time -lt $timeout ]]; do
        if (set -C; echo $$ > "$lock_file") 2>/dev/null; then
            log_debug "Acquired lock: $lock_name"
            return 0
        fi
        
        local lock_pid
        if lock_pid=$(cat "$lock_file" 2>/dev/null); then
            if ! kill -0 "$lock_pid" 2>/dev/null; then
                log_warn "Removing stale lock file (PID $lock_pid no longer exists)"
                rm -f "$lock_file"
                continue
            fi
        fi
        
        log_debug "Waiting for lock: $lock_name (${wait_time}s/${timeout}s)"
        sleep 2
        ((wait_time += 2))
    done
    
    log_error "Failed to acquire lock: $lock_name (timeout after ${timeout}s)"
    return 1
}

release_lock() {
    local lock_name="$1"
    local lock_file="${TERRAFUSION_LOCK_DIR}/${lock_name}.lock"
    
    if [[ -f "$lock_file" ]]; then
        local lock_pid
        if lock_pid=$(cat "$lock_file" 2>/dev/null) && [[ "$lock_pid" == "$$" ]]; then
            rm -f "$lock_file"
            log_debug "Released lock: $lock_name"
        else
            log_warn "Cannot release lock $lock_name: not owned by this process"
            return 1
        fi
    fi
}

# =============================================================================
# Retry Logic with Exponential Backoff
# =============================================================================

retry_with_backoff() {
    local max_attempts="$1"
    local initial_delay="${2:-1}"
    local max_delay="${3:-60}"
    local backoff_multiplier="${4:-2}"
    shift 4
    local command=("$@")
    
    local attempt=1
    local delay="$initial_delay"
    
    while [[ $attempt -le $max_attempts ]]; do
        log_debug "Attempt $attempt/$max_attempts: ${command[*]}"
        
        if "${command[@]}"; then
            log_debug "Command succeeded on attempt $attempt"
            return 0
        fi
        
        local exit_code=$?
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Command failed after $max_attempts attempts: ${command[*]}"
            return $exit_code
        fi
        
        log_warn "Attempt $attempt failed (exit: $exit_code), retrying in ${delay}s..."
        sleep "$delay"
        
        # Calculate next delay with exponential backoff
        delay=$((delay * backoff_multiplier))
        if [[ $delay -gt $max_delay ]]; then
            delay=$max_delay
        fi
        
        ((attempt++))
    done
}

# =============================================================================
# Timeout Wrapper
# =============================================================================

run_with_timeout() {
    local timeout_seconds="$1"
    shift
    local command=("$@")
    
    log_debug "Running with timeout ${timeout_seconds}s: ${command[*]}"
    
    # Use timeout command if available, otherwise use bash background job
    if command -v timeout >/dev/null 2>&1; then
        timeout "$timeout_seconds" "${command[@]}"
    else
        # Fallback implementation
        "${command[@]}" &
        local pid=$!
        
        # Wait for either the command to complete or timeout
        local count=0
        while [[ $count -lt $timeout_seconds ]]; do
            if ! kill -0 "$pid" 2>/dev/null; then
                wait "$pid"
                return $?
            fi
            sleep 1
            ((count++))
        done
        
        # Timeout reached, kill the process
        log_warn "Command timed out after ${timeout_seconds}s, terminating PID $pid"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 2
        kill -KILL "$pid" 2>/dev/null || true
        
        return 124  # Standard timeout exit code
    fi
}

# =============================================================================
# Process Management
# =============================================================================

create_pid_file() {
    local name="$1"
    local pid_file="${TERRAFUSION_LOCK_DIR}/${name}.pid"
    
    mkdir -p "$TERRAFUSION_LOCK_DIR"
    echo $$ > "$pid_file"
    
    # Set global variable for cleanup
    TERRAFUSION_PID_FILE="$pid_file"
    
    log_debug "Created PID file: $pid_file"
}

is_process_running() {
    local pid_file="$1"
    
    if [[ ! -f "$pid_file" ]]; then
        return 1
    fi
    
    local pid
    if ! pid=$(cat "$pid_file" 2>/dev/null); then
        return 1
    fi
    
    kill -0 "$pid" 2>/dev/null
}

# =============================================================================
# Validation Helpers
# =============================================================================

validate_required_tools() {
    local required_tools=("$@")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools before continuing"
        return 1
    fi
    
    log_debug "All required tools available: ${required_tools[*]}"
}

validate_directory() {
    local dir="$1"
    local create_if_missing="${2:-false}"
    
    if [[ ! -d "$dir" ]]; then
        if [[ "$create_if_missing" == "true" ]]; then
            log_info "Creating directory: $dir"
            mkdir -p "$dir"
        else
            log_error "Required directory not found: $dir"
            return 1
        fi
    fi
    
    if [[ ! -w "$dir" ]]; then
        log_error "Directory not writable: $dir"
        return 1
    fi
    
    log_debug "Directory validated: $dir"
}

validate_file() {
    local file="$1"
    local should_be_executable="${2:-false}"
    
    if [[ ! -f "$file" ]]; then
        log_error "Required file not found: $file"
        return 1
    fi
    
    if [[ ! -r "$file" ]]; then
        log_error "File not readable: $file"
        return 1
    fi
    
    if [[ "$should_be_executable" == "true" ]] && [[ ! -x "$file" ]]; then
        log_error "File not executable: $file"
        return 1
    fi
    
    log_debug "File validated: $file"
}

# =============================================================================
# JSON/YAML Parsing Helpers
# =============================================================================

parse_yaml() {
    local yaml_file="$1"
    local key="$2"
    
    if ! validate_file "$yaml_file"; then
        return 1
    fi
    
    # Simple YAML parser for basic key-value pairs
    # Note: This is a basic implementation. For complex YAML, use yq or python
    grep "^${key}:" "$yaml_file" | sed "s/^${key}:[[:space:]]*//" | sed 's/[[:space:]]*$//'
}

parse_json() {
    local json_file="$1"
    local key="$2"
    
    if ! validate_file "$json_file"; then
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        jq -r "$key" "$json_file"
    else
        log_error "jq not available for JSON parsing"
        return 1
    fi
}

# =============================================================================
# Environment & Configuration
# =============================================================================

load_environment() {
    local env_file="${1:-.env}"
    
    if [[ -f "$env_file" ]]; then
        log_debug "Loading environment from: $env_file"
        # shellcheck source=/dev/null
        set -a
        source "$env_file"
        set +a
    else
        log_debug "Environment file not found: $env_file"
    fi
}

export_terrafusion_vars() {
    # Export TerraFusion-specific environment variables
    export TERRAFUSION_VERSION="2.0.0"
    export TERRAFUSION_ENV="${TERRAFUSION_ENV:-development}"
    export TERRAFUSION_LOG_LEVEL="${TERRAFUSION_LOG_LEVEL:-INFO}"
    export TERRAFUSION_AI_AGENTS="${TERRAFUSION_AI_AGENTS:-50000}"
    export TERRAFUSION_ORCHESTRATION_LAYERS="${TERRAFUSION_ORCHESTRATION_LAYERS:-11}"
    
    log_debug "TerraFusion environment variables exported"
}

# =============================================================================
# Initialization Function
# =============================================================================

terrafusion_lib_init() {
    local script_name="${1:-$(basename "${BASH_SOURCE[1]}")}"
    local enable_locking="${2:-true}"
    
    # Initialize logging
    local log_file
    log_file=$(log_setup "$script_name")
    
    # Set up signal traps
    setup_signal_traps "$script_name"
    
    # Create PID file if locking is enabled
    if [[ "$enable_locking" == "true" ]]; then
        create_pid_file "$script_name"
    fi
    
    # Export TerraFusion environment
    export_terrafusion_vars
    
    log_info "TerraFusion Ops Library v$TERRAFUSION_LIB_VERSION initialized"
    log_info "Script: $script_name"
    log_info "Log file: $log_file"
    log_info "Environment: ${TERRAFUSION_ENV}"
    
    return 0
}

# =============================================================================
# Library Self-Test
# =============================================================================

terrafusion_lib_selftest() {
    echo "TerraFusion Ops Library Self-Test"
    echo "================================="
    
    # Test logging
    log_info "Testing logging functionality"
    log_warn "This is a warning message"
    log_debug "This is a debug message (may not appear)"
    
    # Test validation
    validate_required_tools "bash" "date" "grep" "sed"
    
    # Test directory validation
    validate_directory "/tmp" true
    
    echo "✅ All tests passed!"
}

# Run self-test if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    terrafusion_lib_selftest
fi