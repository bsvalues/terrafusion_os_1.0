#!/bin/bash

# TerraFusion OS - Workspace Doctor
# Purpose: Comprehensive workspace health check and AI context preparation
# Usage: ./scripts/workspace-doctor.sh [workspace-name]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

WORKSPACE_NAME=${1:-"current"}

log_header() {
    echo -e "${CYAN}🏥 $1${NC}"
    echo "$(printf '=%.0s' $(seq 1 ${#1}))"
}

log_section() {
    echo -e "${PURPLE}📋 $1${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

detect_current_workspace() {
    # Try to detect which workspace we're in based on current directory and open files
    if [[ -f ".vscode/settings.json" ]]; then
        if grep -q "backend" .vscode/settings.json 2>/dev/null; then
            echo "backend"
        elif grep -q "frontend" .vscode/settings.json 2>/dev/null; then
            echo "frontend"
        else
            echo "master"
        fi
    else
        echo "unknown"
    fi
}

check_git_status() {
    log_section "Git Repository Status"

    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi

    local branch=$(git branch --show-current)
    local status_lines=$(git status --porcelain | wc -l)
    local unpushed=$(git log --oneline @{u}.. 2>/dev/null | wc -l || echo "0")

    echo "  Branch: $branch"
    echo "  Modified files: $status_lines"
    echo "  Unpushed commits: $unpushed"

    if [[ $status_lines -gt 0 ]]; then
        log_warning "Repository has uncommitted changes"
        git status --short | head -10
    else
        log_success "Repository is clean"
    fi
    echo ""
}

check_build_status() {
    log_section "Build & Compilation Status"

    # Backend build check
    if [[ -f "backend/TerraFusion.sln" ]]; then
        echo "  Checking backend compilation..."
        if cd backend && dotnet build --nologo --verbosity quiet >/dev/null 2>&1; then
            log_success "Backend compiles successfully"
        else
            log_error "Backend compilation failed"
            echo "    Run: cd backend && dotnet build"
        fi
        cd "$ROOT_DIR"
    fi

    # Frontend build check
    if [[ -f "frontend/package.json" ]]; then
        echo "  Checking frontend dependencies..."
        if [[ -d "frontend/node_modules" ]]; then
            log_success "Frontend dependencies installed"
        else
            log_warning "Frontend dependencies not installed"
            echo "    Run: cd frontend && npm install"
        fi
    fi
    echo ""
}

check_service_health() {
    log_section "Service Health Status"

    echo "  Checking running services..."

    # Check Consciousness Engine (port 3004)
    if curl -s --max-time 3 http://localhost:3004/health >/dev/null 2>&1; then
        local response=$(curl -s --max-time 3 http://localhost:3004/health)
        log_success "Consciousness Engine: $response"
    else
        log_warning "Consciousness Engine (3004): Not responding"
    fi

    # Check API Gateway (port 5000)
    if curl -s --max-time 3 http://localhost:5000/health >/dev/null 2>&1; then
        local response=$(curl -s --max-time 3 http://localhost:5000/health)
        log_success "API Gateway: $response"
    else
        log_warning "API Gateway (5000): Not responding"
    fi

    # Check Frontend Dev Server (port 3000)
    if curl -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
        log_success "Frontend Dev Server: Running"
    else
        log_warning "Frontend Dev Server (3000): Not responding"
    fi
    echo ""
}

check_workspace_size() {
    log_section "Workspace Size Analysis"

    local workspaces_size=$(du -sh workspaces/ 2>/dev/null | cut -f1 || echo "Unknown")
    local backend_size=$(du -sh backend/ 2>/dev/null | cut -f1 || echo "Unknown")
    local frontend_size=$(du -sh frontend/ 2>/dev/null | cut -f1 || echo "Unknown")

    echo "  Workspaces directory: $workspaces_size"
    echo "  Backend directory: $backend_size"
    echo "  Frontend directory: $frontend_size"

    # Quick size warnings
    local workspaces_kb=$(du -sk workspaces/ 2>/dev/null | cut -f1 || echo "0")
    if (( workspaces_kb > 1048576 )); then  # > 1GB
        log_warning "Workspaces directory is large (>1GB) - consider cleanup"
        echo "    Run: ./scripts/workspace-cleanup.sh"
    fi
    echo ""
}

check_recent_errors() {
    log_section "Recent Error Analysis"

    echo "  Checking for recent error patterns..."

    # Check dotnet build logs
    if [[ -f "backend/build.log" ]]; then
        local error_count=$(grep -i "error" backend/build.log | wc -l)
        echo "    Backend build errors: $error_count"
    fi

    # Check npm logs
    if [[ -f "frontend/npm-debug.log" ]]; then
        local npm_errors=$(tail -5 frontend/npm-debug.log | wc -l)
        echo "    Frontend npm issues: $npm_errors"
    fi

    # Check for any .pid files (running services)
    local pid_files=$(find . -name "*.pid" 2>/dev/null | wc -l)
    if [[ $pid_files -gt 0 ]]; then
        echo "    Active service PIDs found: $pid_files"
        find . -name "*.pid" -exec echo "      {}" \;
    fi
    echo ""
}

generate_ai_context() {
    log_section "AI Companion Context"

    local workspace_type=$WORKSPACE_NAME
    if [[ "$workspace_type" == "current" ]]; then
        workspace_type=$(detect_current_workspace)
    fi

    echo "  Detected workspace: $workspace_type"
    echo ""
    echo "🤖 Quick AI Context:"
    echo "---"

    case $workspace_type in
        "backend")
            echo "**Workspace**: Backend (.NET 8 Microservices)"
            echo "**AI Profile**: TerraFusion Backend Architect & Bug Surgeon"
            echo "**Context Files**: backend/README.md, backend/TerraFusion.sln"
            echo "**Common Tasks**: Fix compile errors, optimize APIs, debug services"
            ;;
        "frontend")
            echo "**Workspace**: Frontend (React 18 PWA)"
            echo "**AI Profile**: TerraFusion Frontend UX & State Management Copilot"
            echo "**Context Files**: frontend/README.md, platform/design-system/"
            echo "**Common Tasks**: Build components, wire APIs, improve UX"
            ;;
        "master"|"unknown")
            echo "**Workspace**: Master (Full System)"
            echo "**AI Profile**: TerraFusion Systems Navigator & Integration Oracle"
            echo "**Context Files**: WORKSPACES.md, DAILY_DEV_RUNBOOK.md"
            echo "**Common Tasks**: Navigate architecture, debug integrations"
            ;;
    esac

    echo ""
    echo "📋 **Copy this to your AI assistant**:"
    echo "See WORKSPACE_AI_PROFILES.md for complete $workspace_type profile"
    echo ""
}

generate_recommendations() {
    log_section "Health Recommendations"

    echo "🎯 **Top 3 Actions**:"
    echo ""

    # Check service status and recommend actions
    if ! curl -s --max-time 3 http://localhost:3004/health >/dev/null 2>&1 && \
       ! curl -s --max-time 3 http://localhost:5000/health >/dev/null 2>&1; then
        echo "1. 🚀 **Start Core Services**:"
        echo "   - Open: code workspaces/backend.code-workspace"
        echo "   - Run: Ctrl+Shift+P → Tasks → \"Launch Core Services (Degraded)\""
        echo ""
    fi

    # Check build status
    if [[ -f "backend/TerraFusion.sln" ]] && ! cd backend && dotnet build --nologo --verbosity quiet >/dev/null 2>&1; then
        echo "2. 🔧 **Fix Build Issues**:"
        echo "   - Run: cd backend && dotnet build"
        echo "   - Call the Surgeon AI for specific errors"
        echo ""
        cd "$ROOT_DIR"
    fi

    # Check dependencies
    if [[ -f "frontend/package.json" ]] && [[ ! -d "frontend/node_modules" ]]; then
        echo "3. 📦 **Install Dependencies**:"
        echo "   - Run: cd frontend && npm install"
        echo "   - Or use VS Code task: \"Install Frontend Dependencies\""
        echo ""
    fi

    echo "💡 **Quick Commands**:"
    echo "   - Health check: ./scripts/health-check.sh"
    echo "   - Full runbook: see DAILY_DEV_RUNBOOK.md"
    echo "   - AI companions: see WORKSPACE_COMPANIONS.md"
    echo ""
}

main() {
    clear
    log_header "TerraFusion OS Workspace Doctor"
    echo "Analyzing workspace health and preparing AI context..."
    echo "Date: $(date)"
    echo "Workspace: $WORKSPACE_NAME"
    echo ""

    check_git_status
    check_build_status
    check_service_health
    check_workspace_size
    check_recent_errors
    generate_ai_context
    generate_recommendations

    echo -e "${CYAN}🏥 Doctor's Assessment Complete${NC}"
    echo "Ready for development with AI assistance!"
}

# Run main function
main "$@"
