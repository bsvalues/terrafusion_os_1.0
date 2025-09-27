#!/usr/bin/env bash
# TerraFusion Safe Script Runner
# Hardened wrapper to prevent scripts from killing the wrapper process

# Source the TerraFusion ops library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

# =============================================================================
# Configuration
# =============================================================================

declare -g SAFE_RUN_VERSION="2.0.0"
declare -g DEFAULT_TIMEOUT=3600
declare -g DEFAULT_RETRIES=1
declare -g INVENTORY_FILE="ops/inventory.yaml"
declare -g WORKFLOW_FILE="ops/workflow.yaml"
declare -g DRY_RUN=false
declare -g CONTINUE_ON_ERROR=false

# =============================================================================
# Usage & Help
# =============================================================================

show_usage() {
    cat << EOF
TerraFusion Safe Script Runner v${SAFE_RUN_VERSION}

USAGE:
    $0 [OPTIONS] <script_name|workflow_name> [inventory|workflow]

OPTIONS:
    --name NAME              Script or workflow name to execute
    --dry-run               Execute in dry-run mode (no side effects)
    --timeout SECONDS       Override default timeout (default: ${DEFAULT_TIMEOUT})
    --retries COUNT         Number of retry attempts (default: ${DEFAULT_RETRIES})
    --continue-on-error     Continue execution on errors
    --inventory FILE        Path to inventory file (default: ${INVENTORY_FILE})
    --workflow FILE         Path to workflow file (default: ${WORKFLOW_FILE})
    --log-level LEVEL       Log level: DEBUG, INFO, WARN, ERROR (default: INFO)
    --help                  Show this help message

EXAMPLES:
    # Run a script from inventory with default settings
    $0 --name deploy_ai_swarms inventory

    # Dry-run a workflow
    $0 --name pre_demo_check --dry-run workflow

    # Run with custom timeout and retries
    $0 --name run_full_test_suite --timeout 7200 --retries 2 inventory

    # Continue on errors for maintenance workflows
    $0 --name daily_maintenance --continue-on-error workflow

TERRAFUSION QUICK COMMANDS:
    # Pre-demo validation
    $0 --name pre_demo_check --dry-run workflow

    # Benton County demo
    $0 --name demo_benton_full workflow

    # Production deployment
    $0 --name prod_deploy_and_verify workflow

    # Emergency recovery
    $0 --name emergency_recovery workflow

EOF
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    local script_name=""
    local source_type=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --name)
                script_name="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --timeout)
                DEFAULT_TIMEOUT="$2"
                shift 2
                ;;
            --retries)
                DEFAULT_RETRIES="$2"
                shift 2
                ;;
            --continue-on-error)
                CONTINUE_ON_ERROR=true
                shift
                ;;
            --inventory)
                INVENTORY_FILE="$2"
                shift 2
                ;;
            --workflow)
                WORKFLOW_FILE="$2"
                shift 2
                ;;
            --log-level)
                export TERRAFUSION_LOG_LEVEL="$2"
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            inventory|workflow)
                source_type="$1"
                shift
                ;;
            *)
                if [[ -z "$script_name" ]]; then
                    script_name="$1"
                else
                    log_error "Unknown argument: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    if [[ -z "$script_name" ]]; then
        log_error "Script or workflow name is required"
        show_usage
        exit 1
    fi
    
    if [[ -z "$source_type" ]]; then
        log_error "Source type (inventory|workflow) is required"
        show_usage
        exit 1
    fi
    
    echo "$script_name $source_type"
}

# =============================================================================
# Inventory & Workflow Loading
# =============================================================================

load_script_from_inventory() {
    local script_name="$1"
    
    if ! validate_file "$INVENTORY_FILE"; then
        log_error "Cannot load inventory file: $INVENTORY_FILE"
        return 1
    fi
    
    log_debug "Loading script '$script_name' from inventory"
    
    # Extract script information using basic parsing
    # In production, you'd want to use yq or a proper YAML parser
    local script_section
    if ! script_section=$(sed -n "/^  ${script_name}:/,/^  [a-zA-Z_]/p" "$INVENTORY_FILE" | head -n -1); then
        log_error "Script '$script_name' not found in inventory"
        return 1
    fi
    
    if [[ -z "$script_section" ]]; then
        log_error "Script '$script_name' not found in inventory"
        return 1
    fi
    
    # Parse script properties
    local script_path
    script_path=$(echo "$script_section" | grep "path:" | sed 's/.*path: *"\?\([^"]*\)"\?.*/\1/')
    
    local script_timeout
    script_timeout=$(echo "$script_section" | grep "timeout_default:" | sed 's/.*timeout_default: *\([0-9]*\).*/\1/')
    script_timeout=${script_timeout:-$DEFAULT_TIMEOUT}
    
    local script_retries
    script_retries=$(echo "$script_section" | grep "retries_default:" | sed 's/.*retries_default: *\([0-9]*\).*/\1/')
    script_retries=${script_retries:-$DEFAULT_RETRIES}
    
    local script_description
    script_description=$(echo "$script_section" | grep "description:" | sed 's/.*description: *"\([^"]*\)".*/\1/')
    
    if [[ -z "$script_path" ]]; then
        log_error "Script path not found for '$script_name'"
        return 1
    fi
    
    # Export for use by caller
    export SAFE_RUN_SCRIPT_PATH="$script_path"
    export SAFE_RUN_SCRIPT_TIMEOUT="$script_timeout"
    export SAFE_RUN_SCRIPT_RETRIES="$script_retries"
    export SAFE_RUN_SCRIPT_DESCRIPTION="$script_description"
    
    log_info "Loaded script: $script_name"
    log_debug "  Path: $script_path"
    log_debug "  Timeout: ${script_timeout}s"
    log_debug "  Retries: $script_retries"
    log_debug "  Description: $script_description"
    
    return 0
}

load_workflow_from_config() {
    local workflow_name="$1"
    
    if ! validate_file "$WORKFLOW_FILE"; then
        log_error "Cannot load workflow file: $WORKFLOW_FILE"
        return 1
    fi
    
    log_debug "Loading workflow '$workflow_name' from config"
    
    # Extract workflow information
    local workflow_section
    if ! workflow_section=$(sed -n "/^  ${workflow_name}:/,/^  [a-zA-Z_]/p" "$WORKFLOW_FILE" | head -n -1); then
        log_error "Workflow '$workflow_name' not found in config"
        return 1
    fi
    
    if [[ -z "$workflow_section" ]]; then
        log_error "Workflow '$workflow_name' not found in config"
        return 1
    fi
    
    # Parse workflow properties
    local workflow_timeout
    workflow_timeout=$(echo "$workflow_section" | grep "timeout:" | sed 's/.*timeout: *\([0-9]*\).*/\1/')
    workflow_timeout=${workflow_timeout:-$DEFAULT_TIMEOUT}
    
    local workflow_continue_on_error
    workflow_continue_on_error=$(echo "$workflow_section" | grep "continue_on_error:" | sed 's/.*continue_on_error: *\([a-z]*\).*/\1/')
    
    local workflow_description
    workflow_description=$(echo "$workflow_section" | grep "description:" | sed 's/.*description: *"\([^"]*\)".*/\1/')
    
    # Export for use by caller
    export SAFE_RUN_WORKFLOW_TIMEOUT="$workflow_timeout"
    export SAFE_RUN_WORKFLOW_CONTINUE_ON_ERROR="$workflow_continue_on_error"
    export SAFE_RUN_WORKFLOW_DESCRIPTION="$workflow_description"
    
    log_info "Loaded workflow: $workflow_name"
    log_debug "  Timeout: ${workflow_timeout}s"
    log_debug "  Continue on error: $workflow_continue_on_error"
    log_debug "  Description: $workflow_description"
    
    return 0
}

# =============================================================================
# Safe Script Execution
# =============================================================================

execute_script_safely() {
    local script_path="$1"
    local timeout="$2"
    local retries="$3"
    local description="$4"
    
    log_info "Executing: $description"
    log_info "Script: $script_path"
    
    # Validate script exists
    if ! validate_file "$script_path" true; then
        log_error "Script validation failed: $script_path"
        return 1
    fi
    
    # Dry-run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY-RUN: Would execute $script_path"
        log_info "DRY-RUN: Timeout: ${timeout}s, Retries: $retries"
        return 0
    fi
    
    # Acquire lock to prevent concurrent execution
    local lock_name
    lock_name="script_$(basename "$script_path" .sh)"
    
    if ! acquire_lock "$lock_name" 60; then
        log_error "Could not acquire lock for script execution"
        return 1
    fi
    
    local exit_code=0
    
    # Execute with retry logic
    if ! retry_with_backoff "$((retries + 1))" 5 30 2 \
         run_with_timeout "$timeout" bash "$script_path"; then
        exit_code=$?
        log_error "Script execution failed: $script_path (exit: $exit_code)"
    else
        log_info "Script execution completed successfully: $script_path"
    fi
    
    # Release lock
    release_lock "$lock_name"
    
    return $exit_code
}

execute_workflow_safely() {
    local workflow_name="$1"
    local timeout="$2"
    local continue_on_error="$3"
    local description="$4"
    
    log_info "Executing workflow: $workflow_name"
    log_info "Description: $description"
    log_info "Timeout: ${timeout}s"
    log_info "Continue on error: $continue_on_error"
    
    # Dry-run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY-RUN: Would execute workflow $workflow_name"
        return 0
    fi
    
    # Extract workflow steps
    local workflow_section
    workflow_section=$(sed -n "/^  ${workflow_name}:/,/^  [a-zA-Z_]/p" "$WORKFLOW_FILE" | head -n -1)
    
    # Parse steps
    local steps_section
    steps_section=$(echo "$workflow_section" | sed -n '/steps:/,$p' | tail -n +2)
    
    local step_count=0
    local failed_steps=0
    local start_time=$(date +%s)
    
    # Process each step
    while IFS= read -r line; do
        if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*name:[[:space:]]*\"?([^\"]+)\"? ]]; then
            local step_name="${BASH_REMATCH[1]}"
            ((step_count++))
            
            log_info "Workflow step $step_count: $step_name"
            
            # Check if this is a script or sub-workflow
            local step_script=""
            local step_workflow=""
            local step_continue_on_error="$continue_on_error"
            
            # Read following lines to get step details
            local step_details=""
            while IFS= read -r detail_line && [[ ! "$detail_line" =~ ^[[:space:]]*-[[:space:]]*name: ]]; do
                step_details+="$detail_line"$'\n'
                
                if [[ "$detail_line" =~ script:[[:space:]]*\"?([^\"]+)\"? ]]; then
                    step_script="${BASH_REMATCH[1]}"
                elif [[ "$detail_line" =~ workflow:[[:space:]]*\"?([^\"]+)\"? ]]; then
                    step_workflow="${BASH_REMATCH[1]}"
                elif [[ "$detail_line" =~ continue_on_error:[[:space:]]*([a-z]+) ]]; then
                    step_continue_on_error="${BASH_REMATCH[1]}"
                fi
            done
            
            # Execute step
            local step_exit_code=0
            
            if [[ -n "$step_script" ]]; then
                # Execute script step
                if load_script_from_inventory "$step_script"; then
                    if ! execute_script_safely "$SAFE_RUN_SCRIPT_PATH" \
                                             "$SAFE_RUN_SCRIPT_TIMEOUT" \
                                             "$SAFE_RUN_SCRIPT_RETRIES" \
                                             "$SAFE_RUN_SCRIPT_DESCRIPTION"; then
                        step_exit_code=$?
                    fi
                else
                    step_exit_code=1
                fi
                
            elif [[ -n "$step_workflow" ]]; then
                # Execute sub-workflow (recursive call)
                if load_workflow_from_config "$step_workflow"; then
                    if ! execute_workflow_safely "$step_workflow" \
                                                "$SAFE_RUN_WORKFLOW_TIMEOUT" \
                                                "$SAFE_RUN_WORKFLOW_CONTINUE_ON_ERROR" \
                                                "$SAFE_RUN_WORKFLOW_DESCRIPTION"; then
                        step_exit_code=$?
                    fi
                else
                    step_exit_code=1
                fi
            else
                log_error "Step $step_name has no script or workflow defined"
                step_exit_code=1
            fi
            
            # Handle step failure
            if [[ $step_exit_code -ne 0 ]]; then
                ((failed_steps++))
                log_error "Workflow step failed: $step_name (exit: $step_exit_code)"
                
                if [[ "$step_continue_on_error" != "true" ]] && [[ "$CONTINUE_ON_ERROR" != "true" ]]; then
                    log_error "Workflow aborted due to step failure: $step_name"
                    return $step_exit_code
                else
                    log_warn "Continuing workflow despite step failure: $step_name"
                fi
            else
                log_info "Workflow step completed: $step_name"
            fi
            
            # Check overall timeout
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            
            if [[ $elapsed -gt $timeout ]]; then
                log_error "Workflow timeout reached: ${elapsed}s > ${timeout}s"
                return 124
            fi
        fi
    done <<< "$steps_section"
    
    # Final workflow status
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    if [[ $failed_steps -eq 0 ]]; then
        log_info "Workflow completed successfully: $workflow_name"
        log_info "Steps executed: $step_count, Duration: ${total_time}s"
        return 0
    else
        log_warn "Workflow completed with failures: $workflow_name"
        log_warn "Steps executed: $step_count, Failed: $failed_steps, Duration: ${total_time}s"
        return 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    # Initialize TerraFusion library
    terrafusion_lib_init "safe-run" true
    
    # Parse command line arguments
    local parsed_args
    parsed_args=$(parse_arguments "$@")
    read -r script_name source_type <<< "$parsed_args"
    
    log_info "TerraFusion Safe Script Runner v$SAFE_RUN_VERSION"
    log_info "Target: $script_name ($source_type)"
    log_info "Dry-run: $DRY_RUN"
    log_info "Continue on error: $CONTINUE_ON_ERROR"
    
    # Validate required tools
    validate_required_tools "bash" "sed" "grep" "date"
    
    # Create necessary directories
    validate_directory "$(dirname "$TERRAFUSION_LOG_DIR")" true
    validate_directory "$TERRAFUSION_LOCK_DIR" true
    
    # Execute based on source type
    case "$source_type" in
        "inventory")
            if load_script_from_inventory "$script_name"; then
                execute_script_safely "$SAFE_RUN_SCRIPT_PATH" \
                                     "${DEFAULT_TIMEOUT:-$SAFE_RUN_SCRIPT_TIMEOUT}" \
                                     "${DEFAULT_RETRIES:-$SAFE_RUN_SCRIPT_RETRIES}" \
                                     "$SAFE_RUN_SCRIPT_DESCRIPTION"
            else
                log_error "Failed to load script from inventory: $script_name"
                return 1
            fi
            ;;
        "workflow")
            if load_workflow_from_config "$script_name"; then
                execute_workflow_safely "$script_name" \
                                       "${DEFAULT_TIMEOUT:-$SAFE_RUN_WORKFLOW_TIMEOUT}" \
                                       "${CONTINUE_ON_ERROR:-$SAFE_RUN_WORKFLOW_CONTINUE_ON_ERROR}" \
                                       "$SAFE_RUN_WORKFLOW_DESCRIPTION"
            else
                log_error "Failed to load workflow from config: $script_name"
                return 1
            fi
            ;;
        *)
            log_error "Invalid source type: $source_type"
            return 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi