#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion Dev CLI - Bash Implementation
# Run from WSL or call via tf.ps1 from Windows
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$ROOT/ops/dev/_logs"
LOG_FILE="$LOG_DIR/tf.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

log() {
    local msg="$1"
    local color="${2:-0}"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "\033[${color}m[$timestamp] $msg\033[0m"
    echo "[$timestamp] $msg" >> "$LOG_FILE"
}

log_info()    { log "$1" "36"; }  # Cyan
log_success() { log "$1" "32"; }  # Green
log_warn()    { log "$1" "33"; }  # Yellow
log_error()   { log "$1" "31"; }  # Red

banner() {
    echo ""
    echo -e "\033[36m  ╔═══════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[36m  ║           🌍 TerraFusion Dev CLI                          ║\033[0m"
    echo -e "\033[36m  ╚═══════════════════════════════════════════════════════════╝\033[0m"
    echo ""
}

show_help() {
    banner
    echo -e "\033[33m  Usage: tf.sh <command> [options]\033[0m"
    echo ""
    echo "  Commands:"
    echo "    up [--full]       Start stack (--full includes monitoring)"
    echo "    down [--prune]    Stop stack (--prune runs safe cleanup)"
    echo "    doctor            Health check"
    echo "    clean [--deep]    Cleanup (--deep includes volumes)"
    echo "    logs              Tail service logs"
    echo "    status            Container status"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# Commands
# ═══════════════════════════════════════════════════════════════════════════

cmd_up() {
    banner
    log_info "Starting TerraFusion stack..."

    cd "$ROOT"

    if [[ "${1:-}" == "--full" ]]; then
        log_warn "Full mode: starting all services including monitoring"
        docker compose -f docker-compose.yml -f compose/docker-compose.monitoring.yml up -d
    else
        docker compose -f docker-compose.yml up -d
    fi

    log_info "Waiting for services to be healthy..."
    sleep 5

    log_info "Service status:"
    docker compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

    log_success "Stack is up! 🚀"
    echo ""
    echo "  Endpoints:"
    echo "    Backend API:  http://localhost:8080"
    echo "    PostgreSQL:   localhost:5432"
    echo "    Redis:        localhost:6379"
    echo ""
}

cmd_down() {
    banner
    log_warn "Stopping TerraFusion stack..."

    cd "$ROOT"
    docker compose -f docker-compose.yml down

    if [[ "${1:-}" == "--prune" ]]; then
        log_warn "Running safe prune..."
        docker image prune -f || true
        docker builder prune -f || true
    fi

    log_success "Stack stopped."
}

cmd_doctor() {
    banner
    log_info "Running health checks..."

    echo ""
    echo -e "\033[33m  ═══ System Resources ═══\033[0m"
    echo "Memory:"
    free -h | head -2
    echo ""
    echo "CPUs: $(nproc)"

    echo ""
    echo -e "\033[33m  ═══ Docker Status ═══\033[0m"
    docker system df

    echo ""
    echo -e "\033[33m  ═══ Running Containers ═══\033[0m"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20

    echo ""
    echo -e "\033[33m  ═══ Disk Usage ═══\033[0m"
    df -h / | tail -1

    echo ""
    log_success "Health check complete."
}

cmd_clean() {
    banner

    if [[ "${1:-}" == "--deep" ]]; then
        log_error "Running deep clean (careful!)..."
        docker system prune -f || true
        docker volume prune -f || true
    else
        log_warn "Running safe clean..."
        docker image prune -f || true
        docker builder prune -f || true
    fi

    log_success "Clean complete."
}

cmd_logs() {
    banner
    log_info "Tailing logs (Ctrl+C to stop)..."
    cd "$ROOT"
    docker compose -f docker-compose.yml logs -f --tail=100
}

cmd_status() {
    banner
    log_info "Container status:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

cmd="${1:-help}"
shift || true

case "$cmd" in
    up)      cmd_up "$@" ;;
    down)    cmd_down "$@" ;;
    doctor)  cmd_doctor ;;
    clean)   cmd_clean "$@" ;;
    logs)    cmd_logs ;;
    status)  cmd_status ;;
    help|*)  show_help ;;
esac
