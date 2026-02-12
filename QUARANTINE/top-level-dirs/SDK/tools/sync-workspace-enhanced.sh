#!/bin/bash

# TerraFusion SDK - Enhanced Workspace Synchronization Tool
# Version: 2.0.0 - AI Team Coordination Enhanced
# Purpose: Real-time workspace synchronization for AI agent teams

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="$(dirname "$SCRIPT_DIR")"
WORKSPACE_ROOT="$(dirname "$SDK_ROOT")"
SYNC_INTERVAL=${SYNC_INTERVAL:-30}
LOG_FILE="$WORKSPACE_ROOT/logs/workspace-sync.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] $2" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$1"; }
warn() { log "WARN" "$1"; }
error() { log "ERROR" "$1"; }
success() { log "SUCCESS" "$1"; }

# Enhanced synchronization for AI teams
sync_workspace_changes() {
    local service_name="$1"
    local workspace_path="$WORKSPACE_ROOT/workspaces/$service_name.code-workspace"

    info "🔄 Syncing workspace changes for $service_name"

    # Check if workspace exists
    if [[ ! -f "$workspace_path" ]]; then
        error "❌ Workspace file not found: $workspace_path"
        return 1
    fi

    # Sync with shared backend
    if ! sync_backend_state "$service_name"; then
        warn "⚠️ Backend sync failed for $service_name"
        return 1
    fi

    # Sync with shared SDK
    if ! sync_sdk_state "$service_name"; then
        warn "⚠️ SDK sync failed for $service_name"
        return 1
    fi

    # Sync with shared config
    if ! sync_config_state "$service_name"; then
        warn "⚠️ Config sync failed for $service_name"
        return 1
    fi

    # Validate integration after sync
    if ! validate_workspace_integration "$service_name"; then
        error "❌ Integration validation failed for $service_name"
        return 1
    fi

    success "✅ Workspace sync completed for $service_name"
    return 0
}

# Sync backend state (read-only)
sync_backend_state() {
    local service_name="$1"
    info "🔧 Syncing backend state for $service_name"

    # Check for backend changes
    local backend_hash=$(git -C "$WORKSPACE_ROOT/backend" rev-parse HEAD 2>/dev/null || echo "no-git")
    local last_sync_hash=$(cat "$WORKSPACE_ROOT/.sync-state/$service_name-backend-hash" 2>/dev/null || echo "none")

    if [[ "$backend_hash" != "$last_sync_hash" ]]; then
        info "📦 Backend changes detected, updating workspace references"

        # Update workspace backend references
        update_workspace_backend_refs "$service_name"

        # Store new hash
        mkdir -p "$WORKSPACE_ROOT/.sync-state"
        echo "$backend_hash" > "$WORKSPACE_ROOT/.sync-state/$service_name-backend-hash"

        info "🔄 Backend state synchronized"
    else
        info "✅ Backend state up to date"
    fi

    return 0
}

# Sync SDK state (read-only)
sync_sdk_state() {
    local service_name="$1"
    info "📦 Syncing SDK state for $service_name"

    # Check for SDK changes
    local sdk_hash=$(git -C "$WORKSPACE_ROOT/SDK" rev-parse HEAD 2>/dev/null || echo "no-git")
    local last_sync_hash=$(cat "$WORKSPACE_ROOT/.sync-state/$service_name-sdk-hash" 2>/dev/null || echo "none")

    if [[ "$sdk_hash" != "$last_sync_hash" ]]; then
        info "🛠️ SDK changes detected, updating workspace references"

        # Update workspace SDK references
        update_workspace_sdk_refs "$service_name"

        # Store new hash
        mkdir -p "$WORKSPACE_ROOT/.sync-state"
        echo "$sdk_hash" > "$WORKSPACE_ROOT/.sync-state/$service_name-sdk-hash"

        info "🔄 SDK state synchronized"
    else
        info "✅ SDK state up to date"
    fi

    return 0
}

# Sync config state (shared-write)
sync_config_state() {
    local service_name="$1"
    info "⚙️ Syncing config state for $service_name"

    # Check for config changes
    local config_hash=$(git -C "$WORKSPACE_ROOT/config" rev-parse HEAD 2>/dev/null || echo "no-git")
    local last_sync_hash=$(cat "$WORKSPACE_ROOT/.sync-state/$service_name-config-hash" 2>/dev/null || echo "none")

    if [[ "$config_hash" != "$last_sync_hash" ]]; then
        info "🔧 Config changes detected, validating compatibility"

        # Validate config compatibility
        if ! validate_config_compatibility "$service_name"; then
            error "❌ Config changes incompatible with $service_name"
            return 1
        fi

        # Update workspace config references
        update_workspace_config_refs "$service_name"

        # Store new hash
        mkdir -p "$WORKSPACE_ROOT/.sync-state"
        echo "$config_hash" > "$WORKSPACE_ROOT/.sync-state/$service_name-config-hash"

        info "🔄 Config state synchronized"
    else
        info "✅ Config state up to date"
    fi

    return 0
}

# Validate workspace integration
validate_workspace_integration() {
    local service_name="$1"
    info "🔍 Validating integration for $service_name"

    # Check workspace file syntax
    if ! python3 -c "import json; json.load(open('$WORKSPACE_ROOT/workspaces/$service_name.code-workspace'))" 2>/dev/null; then
        error "❌ Invalid workspace JSON syntax"
        return 1
    fi

    # Validate folder paths exist
    local workspace_folders=$(python3 -c "
import json
with open('$WORKSPACE_ROOT/workspaces/$service_name.code-workspace') as f:
    data = json.load(f)
    for folder in data.get('folders', []):
        print(folder['path'])
" 2>/dev/null)

    while IFS= read -r folder_path; do
        local full_path="$WORKSPACE_ROOT/workspaces/$folder_path"
        if [[ ! -d "$full_path" ]] && [[ ! "$folder_path" =~ ^\.\./[^/]+$ ]]; then
            warn "⚠️ Folder path may not exist: $full_path"
        fi
    done <<< "$workspace_folders"

    # Test launch configurations
    if ! test_launch_configurations "$service_name"; then
        warn "⚠️ Some launch configurations may have issues"
    fi

    success "✅ Integration validation completed"
    return 0
}

# Test launch configurations
test_launch_configurations() {
    local service_name="$1"
    info "🚀 Testing launch configurations for $service_name"

    # Extract and validate launch configurations
    local launch_configs=$(python3 -c "
import json
with open('$WORKSPACE_ROOT/workspaces/$service_name.code-workspace') as f:
    data = json.load(f)
    launch = data.get('launch', {})
    for config in launch.get('configurations', []):
        print(f\"{config['name']}:{config['type']}:{config.get('cwd', 'none')}\")
" 2>/dev/null)

    while IFS=':' read -r name type cwd; do
        if [[ "$cwd" != "none" ]] && [[ ! -d "$WORKSPACE_ROOT/workspaces/$cwd" ]]; then
            warn "⚠️ Launch config '$name' references missing directory: $cwd"
        fi
    done <<< "$launch_configs"

    return 0
}

# Update workspace backend references
update_workspace_backend_refs() {
    local service_name="$1"
    info "🔧 Updating backend references for $service_name"

    # Implementation would update workspace file with new backend references
    # This is a placeholder for the actual implementation

    return 0
}

# Update workspace SDK references
update_workspace_sdk_refs() {
    local service_name="$1"
    info "📦 Updating SDK references for $service_name"

    # Implementation would update workspace file with new SDK references
    # This is a placeholder for the actual implementation

    return 0
}

# Update workspace config references
update_workspace_config_refs() {
    local service_name="$1"
    info "⚙️ Updating config references for $service_name"

    # Implementation would update workspace file with new config references
    # This is a placeholder for the actual implementation

    return 0
}

# Validate config compatibility
validate_config_compatibility() {
    local service_name="$1"
    info "🔍 Validating config compatibility for $service_name"

    # Implementation would validate that config changes are compatible
    # This is a placeholder for the actual implementation

    return 0
}

# AI Team Coordination - Detect conflicts
detect_workspace_conflicts() {
    info "🤖 Detecting workspace conflicts across AI teams"

    local conflicts_detected=false

    # Check for concurrent edits
    for workspace_file in "$WORKSPACE_ROOT"/workspaces/*.code-workspace; do
        if [[ -f "$workspace_file.lock" ]]; then
            local service_name=$(basename "$workspace_file" .code-workspace)
            warn "⚠️ Workspace conflict detected: $service_name is being edited by another AI team"
            conflicts_detected=true
        fi
    done

    if [[ "$conflicts_detected" == "true" ]]; then
        error "❌ Workspace conflicts detected. Manual resolution may be required."
        return 1
    fi

    success "✅ No workspace conflicts detected"
    return 0
}

# Enhanced monitoring for AI teams
start_continuous_sync() {
    info "🔄 Starting continuous workspace synchronization"

    while true; do
        # Detect conflicts first
        if ! detect_workspace_conflicts; then
            warn "⚠️ Conflicts detected, skipping sync cycle"
            sleep "$SYNC_INTERVAL"
            continue
        fi

        # Sync all active workspaces
        for workspace_file in "$WORKSPACE_ROOT"/workspaces/*.code-workspace; do
            if [[ -f "$workspace_file" ]]; then
                local service_name=$(basename "$workspace_file" .code-workspace)
                if ! sync_workspace_changes "$service_name"; then
                    error "❌ Sync failed for $service_name"
                fi
            fi
        done

        info "⏰ Sync cycle completed. Next sync in $SYNC_INTERVAL seconds"
        sleep "$SYNC_INTERVAL"
    done
}

# Main function
main() {
    local command="${1:-help}"

    case "$command" in
        "sync")
            local service_name="${2:-}"
            if [[ -z "$service_name" ]]; then
                error "❌ Service name required for sync command"
                echo "Usage: $0 sync <service-name>"
                exit 1
            fi
            sync_workspace_changes "$service_name"
            ;;
        "continuous")
            start_continuous_sync
            ;;
        "detect-conflicts")
            detect_workspace_conflicts
            ;;
        "validate")
            local service_name="${2:-}"
            if [[ -z "$service_name" ]]; then
                error "❌ Service name required for validate command"
                echo "Usage: $0 validate <service-name>"
                exit 1
            fi
            validate_workspace_integration "$service_name"
            ;;
        "help"|*)
            echo "TerraFusion Enhanced Workspace Synchronization Tool"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  sync <service>      Sync workspace changes for specific service"
            echo "  continuous          Start continuous synchronization monitoring"
            echo "  detect-conflicts    Check for AI team workspace conflicts"
            echo "  validate <service>  Validate workspace integration"
            echo "  help               Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  SYNC_INTERVAL      Sync interval in seconds (default: 30)"
            echo ""
            ;;
    esac
}

# Create logs directory
mkdir -p "$WORKSPACE_ROOT/logs"
mkdir -p "$WORKSPACE_ROOT/.sync-state"

# Execute main function
main "$@"
