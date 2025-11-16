#!/bin/bash

# TerraFusion OS Workspace Size Check Script
# Purpose: Check workspace directory sizes and identify largest workspaces
# Usage: ./scripts/check-workspace-size.sh [--detailed|--summary]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACES_DIR="$ROOT_DIR/workspaces"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DETAILED=false
SUMMARY_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed)
            DETAILED=true
            shift
            ;;
        --summary)
            SUMMARY_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--detailed|--summary]"
            echo "  --detailed  Show detailed breakdown of each workspace"
            echo "  --summary   Show only summary statistics"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log_header() {
    echo -e "${CYAN}$1${NC}"
    echo "$(printf '=%.0s' $(seq 1 ${#1}))"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

convert_bytes() {
    local bytes=$1

    # Handle different size ranges
    if (( $(echo "$bytes >= 1073741824" | bc -l) )); then
        printf "%.1f GB" $(echo "scale=1; $bytes / 1073741824" | bc -l)
    elif (( $(echo "$bytes >= 1048576" | bc -l) )); then
        printf "%.1f MB" $(echo "scale=1; $bytes / 1048576" | bc -l)
    elif (( $(echo "$bytes >= 1024" | bc -l) )); then
        printf "%.1f KB" $(echo "scale=1; $bytes / 1024" | bc -l)
    else
        printf "%s B" "$bytes"
    fi
}check_workspace_sizes() {
    log_header "📊 TerraFusion OS Workspace Size Analysis"
    echo "Workspace Directory: $WORKSPACES_DIR"
    echo "Analysis Date: $(date)"
    echo ""

    # Get total workspace size
    local total_size
    total_size=$(du -s "$WORKSPACES_DIR" 2>/dev/null | cut -f1)
    local total_size_mb=$((total_size))

    log_info "Total workspace size: $(convert_bytes $((total_size * 1024)))"
    echo ""

    if [[ "$SUMMARY_ONLY" == "false" ]]; then
        log_header "📁 Individual Workspace Sizes"

        # Create temporary file for sorting
        local temp_file
        temp_file=$(mktemp)

        # Get sizes for all directories and workspace files
        while IFS= read -r -d '' dir; do
            local dir_name=$(basename "$dir")
            local size_kb
            size_kb=$(du -s "$dir" 2>/dev/null | cut -f1 || echo "0")
            printf "%010d\t%s\n" "$size_kb" "$dir_name" >> "$temp_file"
        done < <(find "$WORKSPACES_DIR" -maxdepth 1 -type d -not -name "workspaces" -print0 2>/dev/null)

        # Add workspace files
        while IFS= read -r -d '' file; do
            local file_name=$(basename "$file")
            local size_kb
            size_kb=$(du -s "$file" 2>/dev/null | cut -f1 || echo "0")
            printf "%010d\t%s\n" "$size_kb" "$file_name" >> "$temp_file"
        done < <(find "$WORKSPACES_DIR" -maxdepth 1 -name "*.code-workspace" -type f -print0 2>/dev/null)

        # Sort by size (descending) and display
        local count=0
        while IFS=$'\t' read -r size_kb name; do
            # Remove leading zeros to avoid octal interpretation
            size_kb=$(echo "$size_kb" | sed 's/^0*//')
            [[ -z "$size_kb" ]] && size_kb=0

            local size_bytes=$(echo "$size_kb * 1024" | bc)
            local status_icon

            if (( $(echo "$size_kb >= 10240" | bc -l) )); then  # >= 10 MB
                status_icon="🔴 LARGE"
            elif (( $(echo "$size_kb >= 1024" | bc -l) )); then  # >= 1 MB
                status_icon="🟡 MEDIUM"
            elif (( $(echo "$size_kb >= 100" | bc -l) )); then   # >= 100 KB
                status_icon="🟢 SMALL"
            else
                status_icon="⚪ TINY"
            fi

            printf "  %-20s %s %12s\n" "$status_icon" "$name" "$(convert_bytes $size_bytes)"
            ((count++))

            # Show detailed breakdown if requested and size is significant
            if [[ "$DETAILED" == "true" ]] && (( $(echo "$size_kb >= 1024" | bc -l) )); then
                local full_path="$WORKSPACES_DIR/$name"
                if [[ -d "$full_path" ]]; then
                    echo "    Breakdown:"
                    du -h "$full_path"/* 2>/dev/null | sort -hr | head -5 | sed 's/^/      /'
                    echo ""
                fi
            fi
        done < <(sort -nr "$temp_file")

        rm -f "$temp_file"
        echo ""
        log_info "Total items analyzed: $count"
    fi
}

check_disk_usage_concerns() {
    log_header "⚠️  Disk Usage Analysis"

    # Check if workspaces directory is unusually large (> 1GB)
    local total_size_kb
    total_size_kb=$(du -s "$WORKSPACES_DIR" 2>/dev/null | cut -f1)

    if ((total_size_kb > 1048576)); then  # > 1GB
        log_warning "Workspace directory is quite large ($(convert_bytes $((total_size_kb * 1024))))"
        echo "  Consider running workspace cleanup: ./scripts/workspace-cleanup.sh"
    fi

    # Check for very large individual workspaces
    local large_workspaces=0
    while IFS= read -r -d '' dir; do
        local dir_name=$(basename "$dir")
        local size_kb
        size_kb=$(du -s "$dir" 2>/dev/null | cut -f1 || echo "0")

        if ((size_kb > 102400)); then  # > 100MB
            log_warning "Large workspace detected: $dir_name ($(convert_bytes $((size_kb * 1024))))"
            ((large_workspaces++))
        fi
    done < <(find "$WORKSPACES_DIR" -maxdepth 1 -type d -not -name "workspaces" -print0 2>/dev/null)

    if [[ $large_workspaces -eq 0 ]]; then
        log_info "✅ No unusually large workspaces detected"
    fi
    echo ""
}

generate_recommendations() {
    log_header "💡 Recommendations"

    local total_size_kb
    total_size_kb=$(du -s "$WORKSPACES_DIR" 2>/dev/null | cut -f1)

    echo "Based on the analysis:"
    echo ""

    if ((total_size_kb > 512000)); then  # > 500MB
        echo "🧹 Consider running cleanup:"
        echo "   ./scripts/workspace-cleanup.sh --dry-run  # Preview cleanup"
        echo "   ./scripts/workspace-cleanup.sh           # Execute cleanup"
        echo ""
    fi

    echo "📊 Regular monitoring:"
    echo "   ./scripts/check-workspace-size.sh --summary  # Quick check"
    echo "   ./scripts/check-workspace-size.sh --detailed # Full analysis"
    echo ""

    echo "📁 Workspace management:"
    echo "   - Keep only active development workspaces"
    echo "   - Use .gitignore patterns to exclude build artifacts"
    echo "   - Run periodic cleanup to remove temporary files"
    echo "   - Consider archiving unused workspace configurations"
    echo ""
}

generate_size_report() {
    local report_file="$ROOT_DIR/workspace-size-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "TerraFusion OS Workspace Size Report"
        echo "==================================="
        echo "Date: $(date)"
        echo "Workspace Directory: $WORKSPACES_DIR"
        echo ""

        local total_size_kb
        total_size_kb=$(du -s "$WORKSPACES_DIR" 2>/dev/null | cut -f1)
        echo "Total Size: $(convert_bytes $((total_size_kb * 1024)))"

        echo ""
        echo "Top 10 Largest Items:"

        # Create temporary file for sorting
        local temp_file
        temp_file=$(mktemp)

        # Get sizes and sort
        find "$WORKSPACES_DIR" -maxdepth 1 -type d -not -name "workspaces" -exec du -s {} \; 2>/dev/null | sort -nr | head -10 | while read -r size name; do
            printf "  %12s  %s\n" "$(convert_bytes $((size * 1024)))" "$(basename "$name")"
        done >> "$temp_file"

        cat "$temp_file"
        rm -f "$temp_file"

        echo ""
        echo "Generated by: check-workspace-size.sh"
        echo "For detailed analysis: ./scripts/check-workspace-size.sh --detailed"
    } > "$report_file"

    log_info "📄 Size report saved to: $report_file"
}

main() {
    # Check if workspaces directory exists
    if [[ ! -d "$WORKSPACES_DIR" ]]; then
        echo -e "${RED}Error: Workspaces directory not found: $WORKSPACES_DIR${NC}"
        exit 1
    fi

    check_workspace_sizes
    check_disk_usage_concerns

    if [[ "$SUMMARY_ONLY" == "false" ]]; then
        generate_recommendations
        generate_size_report
    fi
}

# Run main function
main "$@"
