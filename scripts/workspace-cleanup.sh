#!/bin/bash

# TerraFusion OS Workspace Cleanup Script
# Purpose: Clean up workspace artifacts, temporary files, and normalize structure
# Usage: ./scripts/workspace-cleanup.sh [--dry-run|--force]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACES_DIR="$ROOT_DIR/workspaces"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--dry-run|--force]"
            echo "  --dry-run  Show what would be cleaned without making changes"
            echo "  --force    Perform cleanup without prompting"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

execute_or_simulate() {
    local command="$1"
    local description="$2"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would $description"
        log_info "Command: $command"
    else
        log_info "$description"
        eval "$command"
        if [[ $? -eq 0 ]]; then
            log_success "Completed: $description"
        else
            log_error "Failed: $description"
        fi
    fi
}

cleanup_backup_workspace_files() {
    log_info "🧹 Cleaning up backup workspace files..."

    local patterns=(
        "*.code-workspace.backup"
        "*.code-workspace.copy"
        "*.code-workspace.old"
        "*.code-workspace.temp"
        "*-backup.code-workspace"
        "*-copy.code-workspace"
        "*-old.code-workspace"
        "*-temp.code-workspace"
    )

    local found=0
    for pattern in "${patterns[@]}"; do
        while IFS= read -r -d '' file; do
            execute_or_simulate "rm '$file'" "Remove backup workspace file: $(basename "$file")"
            ((found++))
        done < <(find "$ROOT_DIR" -name "$pattern" -type f -print0 2>/dev/null || true)
    done

    if [[ $found -eq 0 ]]; then
        log_success "No backup workspace files found"
    fi
}

cleanup_node_modules() {
    log_info "🧹 Cleaning up node_modules in workspace directories..."

    local found=0
    while IFS= read -r -d '' dir; do
        execute_or_simulate "rm -rf '$dir'" "Remove: $dir"
        ((found++))
    done < <(find "$WORKSPACES_DIR" -name "node_modules" -type d -print0 2>/dev/null || true)

    if [[ $found -eq 0 ]]; then
        log_success "No node_modules found in workspaces"
    fi
}

cleanup_build_artifacts() {
    log_info "🧹 Cleaning up build artifacts..."

    local patterns=(
        "dist"
        "build"
        "out"
        ".next"
        "coverage"
        ".nyc_output"
        "*.tsbuildinfo"
    )

    local found=0
    for pattern in "${patterns[@]}"; do
        while IFS= read -r -d '' item; do
            execute_or_simulate "rm -rf '$item'" "Remove build artifact: $item"
            ((found++))
        done < <(find "$WORKSPACES_DIR" -name "$pattern" -print0 2>/dev/null || true)
    done

    if [[ $found -eq 0 ]]; then
        log_success "No build artifacts found"
    fi
}

cleanup_empty_directories() {
    log_info "🧹 Cleaning up empty directories..."

    local found=0
    # Find empty directories (excluding .git and other special dirs)
    while IFS= read -r -d '' dir; do
        # Skip if directory is .git or contains important hidden files
        if [[ "$dir" == *"/.git"* ]] || [[ "$dir" == *"/.vscode"* ]]; then
            continue
        fi

        # Check if directory is truly empty (no files, no subdirs)
        if [[ -z "$(ls -A "$dir" 2>/dev/null)" ]]; then
            execute_or_simulate "rmdir '$dir'" "Remove empty directory: ${dir#$WORKSPACES_DIR/}"
            ((found++))
        fi
    done < <(find "$WORKSPACES_DIR" -type d -empty -print0 2>/dev/null || true)

    if [[ $found -eq 0 ]]; then
        log_success "No empty directories found"
    fi
}

normalize_workspace_naming() {
    log_info "🧹 Checking workspace naming conventions..."

    local found=0
    # Find directories with uppercase or non-standard names
    while IFS= read -r -d '' dir; do
        local basename=$(basename "$dir")
        local dirname=$(dirname "$dir")
        local normalized=$(echo "$basename" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g')

        if [[ "$basename" != "$normalized" ]]; then
            local new_path="$dirname/$normalized"
            execute_or_simulate "mv '$dir' '$new_path'" "Normalize directory name: $basename → $normalized"
            ((found++))
        fi
    done < <(find "$WORKSPACES_DIR" -maxdepth 1 -type d -not -name "workspaces" -print0 2>/dev/null || true)

    if [[ $found -eq 0 ]]; then
        log_success "All workspace directory names are properly normalized"
    fi
}

cleanup_log_files() {
    log_info "🧹 Cleaning up log files..."

    local patterns=(
        "*.log"
        "npm-debug.log*"
        "yarn-debug.log*"
        "yarn-error.log*"
        ".pnpm-debug.log"
    )

    local found=0
    for pattern in "${patterns[@]}"; do
        while IFS= read -r -d '' file; do
            execute_or_simulate "rm '$file'" "Remove log file: $(basename "$file")"
            ((found++))
        done < <(find "$WORKSPACES_DIR" -name "$pattern" -type f -print0 2>/dev/null || true)
    done

    if [[ $found -eq 0 ]]; then
        log_success "No log files found"
    fi
}

cleanup_temp_files() {
    log_info "🧹 Cleaning up temporary files..."

    local patterns=(
        "*.tmp"
        "*.temp"
        "*~"
        ".DS_Store"
        "Thumbs.db"
        "*.swp"
        "*.swo"
    )

    local found=0
    for pattern in "${patterns[@]}"; do
        while IFS= read -r -d '' file; do
            execute_or_simulate "rm '$file'" "Remove temp file: $(basename "$file")"
            ((found++))
        done < <(find "$WORKSPACES_DIR" -name "$pattern" -type f -print0 2>/dev/null || true)
    done

    if [[ $found -eq 0 ]]; then
        log_success "No temporary files found"
    fi
}

generate_cleanup_report() {
    local report_file="$ROOT_DIR/workspace-cleanup-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "TerraFusion OS Workspace Cleanup Report"
        echo "======================================="
        echo "Date: $(date)"
        echo "Mode: $(if [[ "$DRY_RUN" == "true" ]]; then echo "DRY RUN"; else echo "EXECUTED"; fi)"
        echo ""
        echo "Workspace Statistics:"
        echo "- Total workspace files: $(find "$WORKSPACES_DIR" -name "*.code-workspace" -type f | wc -l)"
        echo "- Total workspace directories: $(find "$WORKSPACES_DIR" -maxdepth 1 -type d | wc -l)"
        echo "- Total size: $(du -sh "$WORKSPACES_DIR" | cut -f1)"
        echo ""
        echo "Cleanup Actions Performed:"
        echo "- Backup workspace files: Cleaned"
        echo "- Node modules: Cleaned"
        echo "- Build artifacts: Cleaned"
        echo "- Empty directories: Cleaned"
        echo "- Log files: Cleaned"
        echo "- Temporary files: Cleaned"
        echo "- Naming normalization: Checked"
        echo ""
        echo "For detailed output, see terminal log"
    } > "$report_file"

    log_success "Cleanup report generated: $report_file"
}

main() {
    log_info "🚀 TerraFusion OS Workspace Cleanup Starting..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "🔍 DRY RUN MODE - No changes will be made"
    elif [[ "$FORCE" == "false" ]]; then
        echo -n "This will clean up workspace files and directories. Continue? [y/N] "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled"
            exit 0
        fi
    fi

    cd "$ROOT_DIR"

    # Run cleanup operations
    cleanup_backup_workspace_files
    cleanup_node_modules
    cleanup_build_artifacts
    cleanup_log_files
    cleanup_temp_files
    cleanup_empty_directories
    normalize_workspace_naming

    generate_cleanup_report

    log_success "🎉 Workspace cleanup completed!"
}

# Check if workspaces directory exists
if [[ ! -d "$WORKSPACES_DIR" ]]; then
    log_error "Workspaces directory not found: $WORKSPACES_DIR"
    exit 1
fi

# Run main function
main "$@"
