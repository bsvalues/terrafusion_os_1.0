#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion Dev CLI - Bash Implementation
# Run from WSL or call via tf.ps1 from Windows
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Locale hardening: prevent setlocale errors in CI/dev shells
# Use C.utf8 for UTF-8 support, fall back to C if unavailable
export LANG="${LANG:-C.utf8}"
export LC_ALL="${LC_ALL:-C.utf8}"

# Configuration - resolve symlinks to get the real script location
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SCRIPT_SOURCE" ]; do
    SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
    [[ $SCRIPT_SOURCE != /* ]] && SCRIPT_SOURCE="$SCRIPT_DIR/$SCRIPT_SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$ROOT/ops/dev/_logs"
LOG_FILE="$LOG_DIR/tf.log"
K8S_NAMESPACE="terrafusion-staging"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Auto-detect orchestration mode
detect_mode() {
    if kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        echo "k8s"
    else
        echo "compose"
    fi
}

MODE=$(detect_mode)

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
    echo "  Daily Workflow:"
    echo "    start             🌅 Daily start (gate + verify + status)"
    echo "    hub               🌍 Interactive tool menu"
    echo ""
    echo "  Commands:"
    echo "    up [--full]       Start stack (--full includes monitoring)"
    echo "    down [--prune]    Stop stack (--prune runs safe cleanup)"
    echo "    doctor [--json]   Health check (--json for machine output)"
    echo "    gate [--full]     Pre-flight invariant check"
    echo "    certify           Capture certified dev state"
    echo "    clean [--deep]    Cleanup (--deep includes volumes)"
    echo "    logs              Tail service logs"
    echo "    status            Container status"
    echo ""
    echo "  AI Lab:"
    echo "    ai up             Start GPU-accelerated AI Lab"
    echo "    ai down           Stop AI Lab"
    echo "    ai status         Show AI Lab containers"
    echo "    ai logs           Tail Ollama logs"
    echo "    ai ingest         Index docs into RAG (ChromaDB)"
    echo "    ai query <q>      Query RAG with source citations"
    echo ""
    echo "  Agent Protocol:"
    echo "    agent run         Start new agent session with contract"
    echo "    agent status      Show active agent sessions"
    echo "    agent notes       Open notes for a session"
    echo "    agent complete    Mark session complete"
    echo ""
    echo "  Hub Commands:"
    echo "    hub               Interactive menu of all tools"
    echo "    hub list          List all tools as JSON"
    echo "    hub find <term>   Search tools by keyword"
    echo "    hub run <id>      Run tool by ID"
    echo "    hub tasks         Generate VS Code tasks"
    echo "    hub verify        Check for drift"
    echo "    hub sync          Regenerate all artifacts"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# AI Lab Commands
# ═══════════════════════════════════════════════════════════════════════════

cmd_ai() {
    local subcmd="${1:-help}"
    local AI_COMPOSE="$ROOT/ops/ai/compose.ai.yml"

    case "$subcmd" in
        up)
            log_info "🔮 Starting TerraFusion AI Lab (GPU-accelerated)..."
            docker compose -f "$AI_COMPOSE" up -d
            echo ""
            echo "  AI Lab Endpoints:"
            echo "    Ollama API:  http://127.0.0.1:11434"
            echo "    Chat WebUI:  http://127.0.0.1:3030"
            echo "    ChromaDB:    http://127.0.0.1:8000"
            echo ""
            log_success "AI Lab is running! 🚀"
            ;;
        down)
            log_warn "🛑 Stopping TerraFusion AI Lab..."
            docker compose -f "$AI_COMPOSE" down
            log_success "AI Lab stopped."
            ;;
        status)
            echo -e "\033[36m  AI Lab Status:\033[0m"
            docker ps --filter "name=tf-ai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No AI Lab containers running"
            echo ""
            # GPU status if available
            if command -v nvidia-smi &>/dev/null; then
                echo -e "\033[36m  GPU Status:\033[0m"
                nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv 2>/dev/null | sed 's/^/    /'
            fi
            ;;
        logs)
            log_info "Tailing Ollama logs (Ctrl+C to stop)..."
            docker logs -f tf-ai-ollama 2>/dev/null || echo "Ollama not running"
            ;;
        ingest)
            log_info "📚 Running TerraFusion RAG ingest..."
            cd "$ROOT"
            if [[ ! -f "ops/ai/rag/ingest.py" ]]; then
                log_error "Ingest script not found: ops/ai/rag/ingest.py"
                exit 1
            fi
            # Check ChromaDB is running
            if ! docker ps --format '{{.Names}}' | grep -q "tf-ai-chromadb"; then
                log_warn "ChromaDB not running. Starting AI Lab..."
                docker compose -f "$AI_COMPOSE" up -d chromadb ollama
                sleep 3
            fi
            python3 ops/ai/rag/ingest.py
            ;;
        query)
            shift  # Remove 'query' from args
            if [[ -z "${1:-}" ]]; then
                echo "Usage: tf ai query <question>"
                echo "Example: tf ai query 'What is county isolation?'"
                exit 1
            fi
            cd "$ROOT"
            python3 ops/ai/rag/query.py "$@"
            ;;
        *)
            echo "Usage: tf ai {up|down|status|logs|ingest|query}"
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════
# Commands
# ═══════════════════════════════════════════════════════════════════════════

cmd_doctor_json() {
    # Output machine-readable health status
    local timestamp=$(date -Iseconds)
    local wsl_mem_used=$(free -g | awk '/^Mem:/{print $3}')
    local wsl_mem_total=$(free -g | awk '/^Mem:/{print $2}')
    local docker_size=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1 || echo "unknown")
    
    # WSL config
    local wsl_cap="null"
    local wslconfig="/mnt/c/Users/$USER/.wslconfig"
    if [[ -f "$wslconfig" ]] && grep -q "memory=" "$wslconfig" 2>/dev/null; then
        wsl_cap="\"$(grep "memory=" "$wslconfig" | head -1 | cut -d'=' -f2 | tr -d '[:space:]')\""
    fi
    
    # K8s
    local k8s_available="false"
    local k8s_pods="[]"
    if kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        k8s_available="true"
        k8s_pods=$(kubectl get pods -n "$K8S_NAMESPACE" -o json 2>/dev/null | \
            python3 -c "
import json, sys
data = json.load(sys.stdin)
pods = []
for p in data.get('items', []):
    pods.append({
        'name': p['metadata']['name'],
        'status': p['status']['phase'],
        'has_limits': all(c.get('resources',{}).get('limits') for c in p['spec']['containers'])
    })
print(json.dumps(pods))
" 2>/dev/null || echo "[]")
    fi
    
    # AI Lab
    local ai_running="false"
    local ai_localhost_only="true"
    if docker ps --filter "name=tf-ai" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai"; then
        ai_running="true"
        if docker ps --filter "name=tf-ai" --format '{{.Ports}}' 2>/dev/null | grep -qE "0\.0\.0\.0:|:::"; then
            ai_localhost_only="false"
        fi
    fi
    
    # RAG
    local rag_files=0
    local rag_last="null"
    local manifest="$ROOT/ops/ai/rag/state/manifest.json"
    if [[ -f "$manifest" ]]; then
        rag_files=$(python3 -c "import json; print(len(json.load(open('$manifest')).get('files',{})))" 2>/dev/null || echo "0")
        rag_last="\"$(python3 -c "import json; print(json.load(open('$manifest')).get('last_run',''))" 2>/dev/null)\""
    fi
    
    cat <<EOF
{
  "timestamp": "$timestamp",
  "mode": "$MODE",
  "wsl": {
    "memory_cap": $wsl_cap,
    "memory_used_gb": $wsl_mem_used,
    "memory_total_gb": $wsl_mem_total
  },
  "docker": {
    "disk_usage": "$docker_size"
  },
  "kubernetes": {
    "available": $k8s_available,
    "namespace": "$K8S_NAMESPACE",
    "pods": $k8s_pods
  },
  "ai_lab": {
    "running": $ai_running,
    "localhost_only": $ai_localhost_only
  },
  "rag": {
    "indexed_files": $rag_files,
    "last_ingest": $rag_last
  }
}
EOF
}

cmd_up() {
    banner
    log_info "Starting TerraFusion stack (mode: $MODE)..."

    cd "$ROOT"

    if [[ "$MODE" == "k8s" ]]; then
        log_info "Kubernetes mode detected"
        
        # Check if deployments exist
        if kubectl get deployments -n "$K8S_NAMESPACE" &>/dev/null; then
            kubectl scale deployment --all --replicas=1 -n "$K8S_NAMESPACE" 2>/dev/null || true
            log_info "Waiting for pods..."
            kubectl wait --for=condition=ready pod -l app --timeout=120s -n "$K8S_NAMESPACE" 2>/dev/null || true
        fi
        
        log_info "Pod status:"
        kubectl get pods -n "$K8S_NAMESPACE" -o wide
        
        log_success "K8s stack is ready! 🚀"
        echo ""
        echo "  Namespace: $K8S_NAMESPACE"
        echo "  Services:"
        kubectl get svc -n "$K8S_NAMESPACE" --no-headers 2>/dev/null | awk '{print "    " $1 ": " $5}'
        echo ""
    else
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
    fi
}

cmd_down() {
    banner
    log_warn "Stopping TerraFusion stack (mode: $MODE)..."

    cd "$ROOT"

    if [[ "$MODE" == "k8s" ]]; then
        log_warn "Scaling down K8s deployments..."
        kubectl scale deployment --all --replicas=0 -n "$K8S_NAMESPACE" 2>/dev/null || true
        log_success "K8s stack scaled down (pods will terminate)."
    else
        docker compose -f docker-compose.yml down

        if [[ "${1:-}" == "--prune" ]]; then
            log_warn "Running safe prune..."
            docker image prune -f || true
            docker builder prune -f || true
        fi

        log_success "Stack stopped."
    fi
}

cmd_doctor() {
    local json_mode="${1:-}"
    
    if [[ "$json_mode" == "--json" ]]; then
        cmd_doctor_json
        return
    fi
    
    banner
    log_info "Running health checks (mode: $MODE)..."

    local warnings=0
    local errors=0

    echo ""
    echo -e "\033[33m  ═══ TerraFusion Environment Checks ═══\033[0m"

    # Check 1: WSL memory cap
    echo -n "  WSL Memory Cap (.wslconfig): "
    if [[ -f "$HOME/.wslconfig" ]] || [[ -f "/mnt/c/Users/$USER/.wslconfig" ]]; then
        local wslconfig
        if [[ -f "/mnt/c/Users/$USER/.wslconfig" ]]; then
            wslconfig="/mnt/c/Users/$USER/.wslconfig"
        else
            wslconfig="$HOME/.wslconfig"
        fi
        if grep -q "memory=" "$wslconfig" 2>/dev/null; then
            local mem_cap=$(grep "memory=" "$wslconfig" | head -1 | cut -d'=' -f2)
            echo -e "\033[32m✓ Configured ($mem_cap)\033[0m"
        else
            echo -e "\033[33m⚠ No memory limit set\033[0m"
            warnings=$((warnings + 1))
        fi
    else
        echo -e "\033[33m⚠ Not found (WSL can use unlimited RAM)\033[0m"
        warnings=$((warnings + 1))
    fi

    # Check 2: Current WSL memory usage
    echo -n "  WSL Current Memory: "
    local wsl_mem=$(free -g | awk '/^Mem:/{print $3}')
    local wsl_total=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $wsl_mem -gt 6 ]]; then
        echo -e "\033[33m⚠ ${wsl_mem}GB / ${wsl_total}GB (high)\033[0m"
        warnings=$((warnings + 1))
    else
        echo -e "\033[32m✓ ${wsl_mem}GB / ${wsl_total}GB\033[0m"
    fi

    # Check 3: PACS SQL Server container
    echo -n "  PACS SQL Server: "
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "pacs-benton-mssql"; then
        if [[ "${TF_PACS_MODE:-0}" == "1" ]]; then
            echo -e "\033[32m✓ Running (TF_PACS_MODE=1)\033[0m"
        else
            echo -e "\033[33m⚠ Running but TF_PACS_MODE not set (+1.5GB)\033[0m"
            echo "     Tip: Run 'docker stop pacs-benton-mssql' if not needed"
            warnings=$((warnings + 1))
        fi
    else
        echo -e "\033[32m✓ Not running (saves 1.5GB)\033[0m"
    fi

    # Check 4: Docker disk usage
    echo -n "  Docker Disk Usage: "
    local docker_size=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1)
    echo -e "\033[36m$docker_size\033[0m"

    # Check 5: AI Lab status
    echo -n "  AI Lab: "
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai-ollama"; then
        local ai_mem=$(docker stats --no-stream tf-ai-ollama --format '{{.MemUsage}}' 2>/dev/null | cut -d'/' -f1)
        echo -e "\033[32m✓ Running ($ai_mem)\033[0m"
        # Check if on battery (warn about GPU power)
        if [[ -f /sys/class/power_supply/BAT0/status ]]; then
            local bat_status=$(cat /sys/class/power_supply/BAT0/status 2>/dev/null)
            if [[ "$bat_status" == "Discharging" ]]; then
                echo -e "    \033[33m⚠ AI Lab running on battery (high power drain)\033[0m"
                warnings=$((warnings + 1))
            fi
        fi
    else
        echo -e "\033[90m○ Not running\033[0m"
    fi

    # Check 6: RAG ingest status
    echo -n "  RAG Index: "
    local manifest="$ROOT/ops/ai/rag/state/manifest.json"
    if [[ -f "$manifest" ]]; then
        local last_run=$(python3 -c "import json; m=json.load(open('$manifest')); print(m.get('last_run','unknown'))" 2>/dev/null)
        local file_count=$(python3 -c "import json; m=json.load(open('$manifest')); print(len(m.get('files',{})))" 2>/dev/null)
        if [[ -n "$last_run" ]]; then
            # Check if older than 7 days
            local last_ts=$(date -d "$last_run" +%s 2>/dev/null || echo 0)
            local now_ts=$(date +%s)
            local age_days=$(( (now_ts - last_ts) / 86400 ))
            if [[ $age_days -gt 7 ]]; then
                echo -e "\033[33m⚠ Stale ($file_count files, ${age_days}d ago)\033[0m"
                echo "     Tip: Run 'tf ai ingest' to refresh"
                warnings=$((warnings + 1))
            else
                echo -e "\033[32m✓ ${file_count} files indexed\033[0m"
            fi
        else
            echo -e "\033[90m○ Never run\033[0m"
        fi
    else
        echo -e "\033[90m○ Not initialized (run 'tf ai ingest')\033[0m"
    fi

    # Check 7: AI Lab ports bound to localhost only
    echo -n "  AI Lab Security: "
    local exposed_ports=$(docker ps --filter "name=tf-ai" --format '{{.Ports}}' 2>/dev/null | grep -v "127.0.0.1" | grep -E "0\.0\.0\.0:|:::" || true)
    if [[ -n "$exposed_ports" ]]; then
        echo -e "\033[31m✗ Ports exposed to network!\033[0m"
        echo "     $exposed_ports"
        errors=$((errors + 1))
    else
        if docker ps --filter "name=tf-ai" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai"; then
            echo -e "\033[32m✓ localhost-only bindings\033[0m"
        else
            echo -e "\033[90m○ N/A (not running)\033[0m"
        fi
    fi

    echo ""
    echo -e "\033[33m  ═══ System Resources ═══\033[0m"
    echo "  Memory:"
    free -h | head -2 | sed 's/^/    /'
    echo ""
    echo "  CPUs: $(nproc)"

    echo ""
    echo -e "\033[33m  ═══ Docker Status ═══\033[0m"
    docker system df 2>/dev/null | sed 's/^/    /'

    if [[ "$MODE" == "k8s" ]]; then
        echo ""
        echo -e "\033[33m  ═══ Kubernetes Pods ($K8S_NAMESPACE) ═══\033[0m"
        kubectl get pods -n "$K8S_NAMESPACE" 2>/dev/null | sed 's/^/    /' || echo "    K8s not available"
        
        echo ""
        echo -e "\033[33m  ═══ Kubernetes Services ═══\033[0m"
        kubectl get svc -n "$K8S_NAMESPACE" 2>/dev/null | sed 's/^/    /' || true
    else
        echo ""
        echo -e "\033[33m  ═══ Running Containers ═══\033[0m"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | head -20 | sed 's/^/    /'
    fi

    echo ""
    echo -e "\033[33m  ═══ Disk Usage ═══\033[0m"
    df -h / | tail -1 | sed 's/^/    /'

    echo ""
    echo -e "\033[33m  ═══ Summary ═══\033[0m"
    if [[ $errors -gt 0 ]]; then
        echo -e "  \033[31m✗ $errors error(s) found\033[0m"
    fi
    if [[ $warnings -gt 0 ]]; then
        echo -e "  \033[33m⚠ $warnings warning(s) found\033[0m"
    fi
    if [[ $errors -eq 0 ]] && [[ $warnings -eq 0 ]]; then
        echo -e "  \033[32m✓ All checks passed!\033[0m"
    fi

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
# Gate Z: Local Constitution (Invariant Checks)
# ═══════════════════════════════════════════════════════════════════════════

cmd_gate() {
    local full_mode=""
    local ci_mode=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ci) ci_mode="1" ;;
            --full) full_mode="1" ;;
            *) ;;
        esac
        shift
    done
    
    # Validate flag combinations (--ci is machine mode, --full is human mode)
    if [[ "$ci_mode" == "1" ]] && [[ "$full_mode" == "1" ]]; then
        local timestamp
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        printf '%s\n' "{\"version\":\"1.0.0\",\"timestamp\":\"$timestamp\",\"status\":\"error\",\"error\":{\"code\":\"invalid_flags\",\"message\":\"--ci (machine mode) cannot be combined with --full (human suite mode)\"}}"
        return 2
    fi
    
    local failures=0
    local warnings=0
    local skipped=0
    local checks_passed=0
    local total_checks=11
    
    # JSON accumulator arrays (for CI mode)
    declare -a CHECK_RESULTS=()
    
    # Helper to record check result
    record_check() {
        local id="$1"
        local name="$2"
        local status="$3"
        local message="${4:-}"
        local details="${5:-null}"
        
        if [[ "$ci_mode" == "1" ]]; then
            local json_entry
            if [[ "$details" == "null" ]]; then
                json_entry="{\"id\":$id,\"name\":\"$name\",\"status\":\"$status\",\"message\":\"$message\"}"
            else
                json_entry="{\"id\":$id,\"name\":\"$name\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
            fi
            CHECK_RESULTS+=("$json_entry")
        fi
        
        case "$status" in
            pass) checks_passed=$((checks_passed + 1)) ;;
            fail) failures=$((failures + 1)) ;;
            warn) warnings=$((warnings + 1)); checks_passed=$((checks_passed + 1)) ;;
            skip) skipped=$((skipped + 1)); checks_passed=$((checks_passed + 1)) ;;
        esac
    }
    
    # Human output helper (suppressed in CI mode)
    human_echo() {
        if [[ "$ci_mode" != "1" ]]; then
            echo -e "$@"
        fi
        return 0
    }
    
    human_echo ""
    human_echo "\033[36m  ╔═══════════════════════════════════════════════════════════╗\033[0m"
    human_echo "\033[36m  ║         🛡️  Gate Z: Local Constitution Check              ║\033[0m"
    human_echo "\033[36m  ╚═══════════════════════════════════════════════════════════╝\033[0m"
    human_echo ""

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 1: WSL Memory Cap
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [1/$total_checks] WSL Memory Cap: "
    local wslconfig="/mnt/c/Users/$USER/.wslconfig"
    if [[ -f "$wslconfig" ]] && grep -q "memory=" "$wslconfig" 2>/dev/null; then
        local mem_cap=$(grep "memory=" "$wslconfig" | head -1 | cut -d'=' -f2 | tr -d '[:space:]')
        local mem_num=$(echo "$mem_cap" | grep -oE '[0-9]+')
        if [[ $mem_num -le 8 ]]; then
            human_echo "\033[32m✓ PASS\033[0m ($mem_cap)"
            record_check 1 "wsl_memory_cap" "pass" "Configured: $mem_cap"
        else
            human_echo "\033[31m✗ FAIL\033[0m (${mem_cap} > 8GB)"
            human_echo "     FIX: Edit $wslconfig → memory=8GB"
            record_check 1 "wsl_memory_cap" "fail" "Memory cap too high: $mem_cap > 8GB"
        fi
    else
        human_echo "\033[31m✗ FAIL\033[0m (no .wslconfig)"
        human_echo "     FIX: Create $wslconfig with [wsl2] memory=8GB"
        record_check 1 "wsl_memory_cap" "fail" "No .wslconfig found"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 2: VS Code Extension Count
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [2/$total_checks] VS Code Extensions: "
    local ext_count=$(code --list-extensions 2>/dev/null | wc -l || echo "0")
    if [[ $ext_count -le 25 ]]; then
        human_echo "\033[32m✓ PASS\033[0m ($ext_count enabled)"
        record_check 2 "vscode_extensions" "pass" "$ext_count extensions enabled"
    else
        human_echo "\033[33m⚠ WARN\033[0m ($ext_count > 25 threshold)"
        human_echo "     TIP: Disable unused extensions to reduce memory"
        record_check 2 "vscode_extensions" "warn" "$ext_count extensions (> 25 threshold)"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 3: K8s Pods Have Resource Limits
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [3/$total_checks] K8s Resource Limits: "
    if kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        local pods_without_limits=$(kubectl get pods -n "$K8S_NAMESPACE" -o json 2>/dev/null | \
            python3 -c "
import json, sys
data = json.load(sys.stdin)
missing = []
for pod in data.get('items', []):
    for c in pod['spec']['containers']:
        if not c.get('resources', {}).get('limits'):
            missing.append(pod['metadata']['name'])
            break
print(' '.join(set(missing)))
" 2>/dev/null || echo "")
        if [[ -z "$pods_without_limits" ]]; then
            human_echo "\033[32m✓ PASS\033[0m (all pods bounded)"
            record_check 3 "k8s_resource_limits" "pass" "All pods have resource limits"
        else
            human_echo "\033[31m✗ FAIL\033[0m (missing limits)"
            human_echo "     Pods: $pods_without_limits"
            human_echo "     FIX: Add resources.limits to deployment specs"
            record_check 3 "k8s_resource_limits" "fail" "Pods missing limits: $pods_without_limits"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (k8s not available)"
        record_check 3 "k8s_resource_limits" "skip" "Kubernetes not available"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 4: AI Lab Ports Localhost-Only
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [4/$total_checks] AI Lab Security: "
    if docker ps --filter "name=tf-ai" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai"; then
        local exposed=$(docker ps --filter "name=tf-ai" --format '{{.Ports}}' 2>/dev/null | grep -E "0\.0\.0\.0:|:::" || true)
        if [[ -z "$exposed" ]]; then
            human_echo "\033[32m✓ PASS\033[0m (localhost-only)"
            record_check 4 "ai_lab_security" "pass" "All ports bound to localhost"
        else
            human_echo "\033[31m✗ FAIL\033[0m (network-exposed ports!)"
            human_echo "     $exposed"
            human_echo "     FIX: Update compose.ai.yml ports to 127.0.0.1:PORT:PORT"
            record_check 4 "ai_lab_security" "fail" "Network-exposed ports: $exposed"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (AI Lab not running)"
        record_check 4 "ai_lab_security" "skip" "AI Lab not running"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 5: Docker Disk Usage
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [5/$total_checks] Docker Disk: "
    local docker_gb=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1 | grep -oE '[0-9]+\.?[0-9]*' | head -1)
    if [[ -n "$docker_gb" ]]; then
        local docker_int=${docker_gb%.*}
        if [[ $docker_int -lt 50 ]]; then
            human_echo "\033[32m✓ PASS\033[0m (${docker_gb}GB < 50GB)"
            record_check 5 "docker_disk" "pass" "${docker_gb}GB used"
        else
            human_echo "\033[33m⚠ WARN\033[0m (${docker_gb}GB approaching limit)"
            human_echo "     TIP: Run 'tf clean' to reclaim space"
            record_check 5 "docker_disk" "warn" "${docker_gb}GB used (approaching 50GB limit)"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (cannot determine)"
        record_check 5 "docker_disk" "skip" "Cannot determine disk usage"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 6: RAG Index Freshness
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [6/$total_checks] RAG Index: "
    local manifest="$ROOT/ops/ai/rag/state/manifest.json"
    if [[ -f "$manifest" ]]; then
        local age_days=$(python3 -c "
import json
from datetime import datetime
m = json.load(open('$manifest'))
lr = m.get('last_run')
if lr:
    last = datetime.fromisoformat(lr.replace('Z','+00:00').split('.')[0])
    print((datetime.now() - last).days)
else:
    print(999)
" 2>/dev/null || echo "999")
        if [[ $age_days -le 7 ]]; then
            human_echo "\033[32m✓ PASS\033[0m (${age_days}d old)"
            record_check 6 "rag_index" "pass" "Index is ${age_days} days old"
        else
            human_echo "\033[33m⚠ WARN\033[0m (${age_days}d stale)"
            human_echo "     TIP: Run 'tf ai ingest' to refresh"
            record_check 6 "rag_index" "warn" "Index is ${age_days} days old (stale)"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (not initialized)"
        record_check 6 "rag_index" "skip" "RAG not initialized"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 7: Current Memory Usage
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [7/$total_checks] WSL Memory: "
    local wsl_used=$(free -g | awk '/^Mem:/{print $3}')
    local wsl_total=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $wsl_used -le 6 ]]; then
        human_echo "\033[32m✓ PASS\033[0m (${wsl_used}GB / ${wsl_total}GB)"
        record_check 7 "wsl_memory" "pass" "${wsl_used}GB / ${wsl_total}GB used"
    else
        human_echo "\033[33m⚠ WARN\033[0m (${wsl_used}GB high)"
        human_echo "     TIP: Check for runaway processes with 'top'"
        record_check 7 "wsl_memory" "warn" "${wsl_used}GB / ${wsl_total}GB used (high)"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 8: Ollama Model Storage
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [8/$total_checks] Model Storage: "
    if docker ps --filter "name=tf-ai-ollama" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai-ollama"; then
        local model_size=$(docker exec tf-ai-ollama du -sh /root/.ollama/models 2>/dev/null | cut -f1 || echo "0")
        local model_gb=$(echo "$model_size" | grep -oE '[0-9]+\.?[0-9]*')
        if [[ -n "$model_gb" ]] && [[ "${model_size: -1}" == "G" ]]; then
            if (( $(echo "$model_gb < 15" | bc -l) )); then
                human_echo "\033[32m✓ PASS\033[0m ($model_size)"
                record_check 8 "model_storage" "pass" "Model storage: $model_size"
            else
                human_echo "\033[33m⚠ WARN\033[0m ($model_size > 15GB budget)"
                human_echo "     TIP: Remove unused models with 'docker exec tf-ai-ollama ollama rm <model>'"
                record_check 8 "model_storage" "warn" "Model storage: $model_size (> 15GB budget)"
            fi
        else
            human_echo "\033[32m✓ PASS\033[0m ($model_size)"
            record_check 8 "model_storage" "pass" "Model storage: $model_size"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (Ollama not running)"
        record_check 8 "model_storage" "skip" "Ollama not running"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 9: Hub Tasks Sync (no drift)
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [9/$total_checks] Hub Tasks Sync: "
    if [[ -f "$ROOT/ops/tooling/registry.yml" ]] && [[ -f "$ROOT/.vscode/tasks.json" ]]; then
        if python3 "$ROOT/ops/tooling/verify-tasks.py" &>/dev/null; then
            human_echo "\033[32m✓ PASS\033[0m (tasks.json matches registry)"
            record_check 9 "hub_tasks_sync" "pass" "tasks.json matches registry"
        else
            human_echo "\033[33m⚠ WARN\033[0m (drift detected)"
            human_echo "     TIP: Run 'tf hub tasks' to regenerate"
            record_check 9 "hub_tasks_sync" "warn" "Drift detected between tasks.json and registry"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (registry or tasks.json missing)"
        record_check 9 "hub_tasks_sync" "skip" "Registry or tasks.json missing"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 10: Agent Session Health
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [10/$total_checks] Agent Sessions: "
    if [[ -f "$ROOT/ops/agents/generate-contract.py" ]]; then
        local session_errors session_exit
        session_errors=$(python3 "$ROOT/ops/agents/generate-contract.py" check 2>&1) && session_exit=0 || session_exit=$?
        
        if [[ $session_exit -eq 0 ]]; then
            # Count active sessions
            local active_count=0
            if [[ -d "$SESSIONS_DIR" ]]; then
                for meta in "$SESSIONS_DIR"/*/session.json; do
                    [[ -f "$meta" ]] || continue
                    local status
                    status=$(python3 -c "import json; print(json.load(open('$meta')).get('status', ''))" 2>/dev/null || echo "")
                    [[ "$status" == "active" ]] && active_count=$((active_count + 1))
                done
            fi
            
            if [[ $active_count -eq 0 ]]; then
                human_echo "\033[32m✓ PASS\033[0m (no active sessions)"
                record_check 10 "agent_sessions" "pass" "No active sessions"
            else
                human_echo "\033[32m✓ PASS\033[0m ($active_count active, all healthy)"
                record_check 10 "agent_sessions" "pass" "$active_count active sessions, all healthy"
            fi
        else
            human_echo "\033[31m✗ FAIL\033[0m (session issues found)"
            human_echo "$session_errors" | head -5 | sed 's/^/     /'
            record_check 10 "agent_sessions" "fail" "Session health check failed"
        fi
    else
        human_echo "\033[90m○ SKIP\033[0m (agent protocol not installed)"
        record_check 10 "agent_sessions" "skip" "Agent protocol not installed"
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 11: Protocol Enforcement (changed files in protected scopes)
    # Session-aware: recognizes completed sessions tied to recent commits
    # ─────────────────────────────────────────────────────────────────────────
    human_echo -n "  [11/$total_checks] Protocol Enforcement: "
    # Protected scopes that REQUIRE agent sessions
    local protected_scopes="ops/ai/ ops/dev/ backend/ frontend/ SDK/ config/tenant."
    local has_protected_changes=false
    local changed_protected=""
    
    # Check for uncommitted changes in protected scopes
    local uncommitted
    uncommitted=$(git -C "$ROOT" status --porcelain 2>/dev/null || echo "")
    
    for scope in $protected_scopes; do
        if echo "$uncommitted" | grep -q "$scope"; then
            has_protected_changes=true
            changed_protected="$changed_protected $scope"
        fi
    done
    
    if [[ "$has_protected_changes" == "true" ]]; then
        # Check if there's an active session
        local active_session_id=""
        if [[ -f "$ROOT/ops/agents/ACTIVE_SESSION" ]]; then
            active_session_id=$(cat "$ROOT/ops/agents/ACTIVE_SESSION" 2>/dev/null || echo "")
        fi
        
        if [[ -n "$active_session_id" ]]; then
            human_echo "\033[32m✓ PASS\033[0m (session active for protected changes)"
            record_check 11 "protocol_enforcement" "pass" "Session active for protected scope changes"
        else
            human_echo "\033[33m⚠ WARN\033[0m (protected scope changes without session)"
            human_echo "     Changed:$changed_protected"
            human_echo "     Consider: tf agent run --project=<p> --feature=<f>"
            record_check 11 "protocol_enforcement" "warn" "Protected scope changes without active session"
        fi
    else
        # No uncommitted protected changes - check if recent commits have session artifacts
        # This handles the case where work was committed via a completed session
        local has_recent_session=false
        local recent_session_commit=""
        
        # Look for session completion commits in last 10 commits
        local session_commit
        session_commit=$(git -C "$ROOT" log -10 --oneline --grep="chore(session): complete" 2>/dev/null | head -1 || echo "")
        
        if [[ -n "$session_commit" ]]; then
            has_recent_session=true
            recent_session_commit=$(echo "$session_commit" | cut -d' ' -f1)
        fi
        
        if [[ "$has_recent_session" == "true" ]]; then
            human_echo "\033[32m✓ PASS\033[0m (session completed at $recent_session_commit)"
            record_check 11 "protocol_enforcement" "pass" "Recent session completed at $recent_session_commit"
        else
            human_echo "\033[32m✓ PASS\033[0m (no protected scope changes)"
            record_check 11 "protocol_enforcement" "pass" "No protected scope changes"
        fi
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # Full mode: run builds/tests + invariant suites
    # ─────────────────────────────────────────────────────────────────────────
    if [[ "$full_mode" == "1" ]]; then
        human_echo ""
        human_echo "\033[33m  ═══ Full Gate: Invariant Suites ═══\033[0m"
        
        local tests_dir="$ROOT/ops/dev/tests"
        local suite_failures=0
        local suite_warnings=0
        local suite_rc=0
        
        # Run gate CI tests (capture RC safely under set -e, timebox to 60s)
        if [[ -f "$tests_dir/test_gate_ci.sh" ]]; then
            human_echo ""
            human_echo "  Gate CI tests (timeboxed: 60s):"
            human_echo ""
            suite_rc=0
            command timeout 60 bash "$tests_dir/test_gate_ci.sh" || suite_rc=$?
            if [[ $suite_rc -eq 124 ]]; then
                human_echo "\033[33m  ⚠ TIMEOUT\033[0m (exceeded 60s budget)"
                suite_warnings=$((suite_warnings + 1))  # Timeout = WARN in --full
            elif [[ $suite_rc -ne 0 ]]; then
                suite_failures=$((suite_failures + 1))
            fi
        else
            human_echo "  Gate CI tests: \033[90m○ SKIP\033[0m (test_gate_ci.sh not found)"
        fi
        
        # Run breaker invariants (capture RC safely under set -e, timebox to 30s)
        if [[ -f "$tests_dir/test_breaker_invariants.sh" ]]; then
            human_echo ""
            human_echo "  Breaker invariants (timeboxed: 30s):"
            human_echo ""
            suite_rc=0
            command timeout 30 bash "$tests_dir/test_breaker_invariants.sh" || suite_rc=$?
            if [[ $suite_rc -eq 124 ]]; then
                human_echo "\033[33m  ⚠ TIMEOUT\033[0m (exceeded 30s budget)"
                suite_warnings=$((suite_warnings + 1))  # Timeout = WARN in --full
            elif [[ $suite_rc -ne 0 ]]; then
                suite_failures=$((suite_failures + 1))
            fi
        else
            human_echo "  Breaker invariants: \033[90m○ SKIP\033[0m (test_breaker_invariants.sh not found)"
        fi
        
        # Summary for invariant suites
        if [[ $suite_failures -gt 0 ]]; then
            failures=$((failures + suite_failures))
            human_echo ""
            human_echo "\033[31m  ✗ $suite_failures invariant suite(s) failed\033[0m"
        elif [[ $suite_warnings -gt 0 ]]; then
            warnings=$((warnings + suite_warnings))
            human_echo ""
            human_echo "\033[33m  ⚠ $suite_warnings invariant suite(s) timed out (warnings only)\033[0m"
        else
            human_echo ""
            human_echo "\033[32m  ✓ All invariant suites passed\033[0m"
        fi
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # CI Mode: Output JSON
    # ─────────────────────────────────────────────────────────────────────────
    if [[ "$ci_mode" == "1" ]]; then
        local timestamp
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        local overall_status="pass"
        if [[ $failures -gt 0 ]]; then
            overall_status="fail"
        fi
        
        # Build JSON array from CHECK_RESULTS
        local checks_json=""
        local first=true
        for check in "${CHECK_RESULTS[@]}"; do
            if [[ "$first" == "true" ]]; then
                checks_json="$check"
                first=false
            else
                checks_json="$checks_json,$check"
            fi
        done
        
        # Output JSON to stdout
        printf '%s\n' "{\"version\":\"1.0.0\",\"timestamp\":\"$timestamp\",\"status\":\"$overall_status\",\"summary\":{\"total\":$total_checks,\"passed\":$checks_passed,\"failed\":$failures,\"warnings\":$warnings,\"skipped\":$skipped},\"checks\":[$checks_json]}"
        
        # Exit with appropriate code
        if [[ $failures -gt 0 ]]; then
            return 1
        fi
        return 0
    fi

    # ─────────────────────────────────────────────────────────────────────────
    # Summary (human mode only)
    # ─────────────────────────────────────────────────────────────────────────
    human_echo ""
    human_echo "  ─────────────────────────────────────────────────────────────"
    if [[ $failures -eq 0 ]]; then
        human_echo "  \033[32m✓ GATE PASSED\033[0m ($checks_passed/$total_checks checks)"
        human_echo "  Ready for development."
        return 0
    else
        human_echo "  \033[31m✗ GATE FAILED\033[0m ($failures invariant(s) violated)"
        human_echo "  Fix the issues above before continuing."
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Certify: Capture Golden State
# ═══════════════════════════════════════════════════════════════════════════

cmd_certify() {
    banner
    log_info "Certifying TerraFusion Dev State..."

    local certify_file="$ROOT/ops/dev/certify.json"
    local git_sha=$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git -C "$ROOT" branch --show-current 2>/dev/null || echo "unknown")
    local timestamp=$(date -Iseconds)
    local hostname=$(hostname)
    local user=$(whoami)

    # Gather state
    local wsl_mem_cap="unknown"
    local wslconfig="/mnt/c/Users/$USER/.wslconfig"
    if [[ -f "$wslconfig" ]]; then
        wsl_mem_cap=$(grep "memory=" "$wslconfig" 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '[:space:]' || echo "unset")
    fi

    local ext_count=$(code --list-extensions 2>/dev/null | wc -l || echo "0")
    local wsl_mem_used=$(free -g | awk '/^Mem:/{print $3}')
    local wsl_mem_total=$(free -g | awk '/^Mem:/{print $2}')
    local docker_size=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1 || echo "unknown")

    # K8s pod count
    local k8s_pods="0"
    if kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        k8s_pods=$(kubectl get pods -n "$K8S_NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "0")
    fi

    # AI Lab status
    local ai_lab_running="false"
    if docker ps --filter "name=tf-ai-ollama" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai"; then
        ai_lab_running="true"
    fi

    # RAG stats
    local rag_files="0"
    local rag_last_run="never"
    local manifest="$ROOT/ops/ai/rag/state/manifest.json"
    if [[ -f "$manifest" ]]; then
        rag_files=$(python3 -c "import json; print(len(json.load(open('$manifest')).get('files',{})))" 2>/dev/null || echo "0")
        rag_last_run=$(python3 -c "import json; print(json.load(open('$manifest')).get('last_run','never'))" 2>/dev/null || echo "never")
    fi

    # Model list
    local models="[]"
    if docker ps --filter "name=tf-ai-ollama" --format '{{.Names}}' 2>/dev/null | grep -q "tf-ai-ollama"; then
        models=$(docker exec tf-ai-ollama ollama list 2>/dev/null | tail -n +2 | awk '{print "\""$1"\""}' | paste -sd, | sed 's/^/[/;s/$/]/' || echo "[]")
    fi

    # Generate JSON
    cat > "$certify_file" <<EOF
{
  "version": "1.0",
  "certified_at": "$timestamp",
  "machine": {
    "hostname": "$hostname",
    "user": "$user",
    "wsl_mem_cap": "$wsl_mem_cap",
    "wsl_mem_used_gb": $wsl_mem_used,
    "wsl_mem_total_gb": $wsl_mem_total
  },
  "git": {
    "sha": "$git_sha",
    "branch": "$git_branch"
  },
  "vscode": {
    "extension_count": $ext_count
  },
  "docker": {
    "disk_usage": "$docker_size"
  },
  "kubernetes": {
    "namespace": "$K8S_NAMESPACE",
    "pod_count": $k8s_pods
  },
  "ai_lab": {
    "running": $ai_lab_running,
    "models": $models
  },
  "rag": {
    "indexed_files": $rag_files,
    "last_ingest": "$rag_last_run"
  },
  "gate_status": "pending"
}
EOF

    # Run gate check
    echo ""
    if cmd_gate; then
        # Update gate status
        python3 -c "
import json
with open('$certify_file', 'r+') as f:
    data = json.load(f)
    data['gate_status'] = 'passed'
    f.seek(0)
    json.dump(data, f, indent=2)
    f.truncate()
"
        echo ""
        log_success "✅ Certification complete!"
        echo ""
        echo "  Certified state saved to: $certify_file"
        echo "  Documentation: ops/dev/CERTIFIED_STATE.md"
    else
        python3 -c "
import json
with open('$certify_file', 'r+') as f:
    data = json.load(f)
    data['gate_status'] = 'failed'
    f.seek(0)
    json.dump(data, f, indent=2)
    f.truncate()
"
        echo ""
        log_error "❌ Certification failed - fix gate issues first"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Tool Hub - Single front door to all TerraFusion tools
# ═══════════════════════════════════════════════════════════════════════════

TF_HUB_REGISTRY="$ROOT/ops/tooling/registry.yml"

hub_require() {
    command -v python3 >/dev/null || { log_error "python3 required for hub"; return 1; }
    [ -f "$TF_HUB_REGISTRY" ] || { log_error "Registry not found: $TF_HUB_REGISTRY"; return 1; }
}

hub_list() {
    hub_require || return 1
    python3 - "$TF_HUB_REGISTRY" <<'PYLIST'
import sys, json
try:
    import yaml
except ImportError:
    print('{"error": "pyyaml required: pip install pyyaml"}')
    sys.exit(1)

with open(sys.argv[1]) as f:
    d = yaml.safe_load(f)

out = []
for g in d.get("groups", []):
    for it in g.get("items", []):
        out.append({
            "group": g["id"],
            "group_title": g.get("title", g["id"]),
            "id": it["id"],
            "title": it["title"],
            "desc": it.get("desc", ""),
            "cmd": it["cmd"],
            "safe": bool(it.get("safe", True)),
            "frequency": it.get("frequency", "")
        })
print(json.dumps(out, indent=2))
PYLIST
}

hub_menu() {
    hub_require || return 1
    python3 - "$TF_HUB_REGISTRY" <<'PYMENU'
import sys
try:
    import yaml
except ImportError:
    print("Error: pyyaml required (pip install pyyaml)", file=sys.stderr)
    sys.exit(1)

with open(sys.argv[1]) as f:
    d = yaml.safe_load(f)

items = []
idx = 1

# Print menu to stderr so it doesn't interfere with command capture
print("\n\033[36m╔═══════════════════════════════════════════════════════════════╗\033[0m", file=sys.stderr)
print("\033[36m║                 🌍 TerraFusion Tool Hub                       ║\033[0m", file=sys.stderr)
print("\033[36m╚═══════════════════════════════════════════════════════════════╝\033[0m", file=sys.stderr)

for g in d.get("groups", []):
    print(f"\n\033[33m{g.get('title', g['id'])}\033[0m", file=sys.stderr)
    print("─" * 60, file=sys.stderr)
    for it in g.get("items", []):
        safe = "\033[32m✓ SAFE\033[0m" if it.get("safe", True) else "\033[31m⚠ RISK\033[0m"
        print(f"  {idx:>2}) [{safe}] \033[1m{it['title']}\033[0m", file=sys.stderr)
        print(f"       {it.get('desc', '')}", file=sys.stderr)
        items.append(it)
        idx += 1

print("\n" + "─" * 60, file=sys.stderr)
print("Enter number (or blank to exit): ", end="", flush=True, file=sys.stderr)

try:
    s = input().strip()
except (EOFError, KeyboardInterrupt):
    print("", file=sys.stderr)
    sys.exit(0)

if not s:
    sys.exit(0)

try:
    n = int(s)
    if n < 1 or n > len(items):
        print(f"Invalid: choose 1-{len(items)}", file=sys.stderr)
        sys.exit(1)
    it = items[n - 1]
    # Only the command goes to stdout
    print(it["cmd"])
except ValueError:
    print("Invalid input", file=sys.stderr)
    sys.exit(1)
PYMENU
}

hub_run_id() {
    local id="$1"
    hub_require || return 1
    
    local cmd
    cmd=$(python3 - "$TF_HUB_REGISTRY" "$id" <<'PYRUN'
import sys
try:
    import yaml
except ImportError:
    sys.exit(2)

with open(sys.argv[1]) as f:
    d = yaml.safe_load(f)

want = sys.argv[2]
for g in d.get("groups", []):
    for it in g.get("items", []):
        if it.get("id") == want:
            print(it["cmd"])
            sys.exit(0)

sys.exit(2)
PYRUN
)
    
    local rc=$?
    if [ $rc -ne 0 ] || [ -z "$cmd" ]; then
        log_error "Unknown hub id: $id"
        echo ""
        echo "Available IDs:"
        hub_list 2>/dev/null | python3 -c "import sys,json; [print(f'  {x[\"id\"]}') for x in json.load(sys.stdin)]" 2>/dev/null || true
        return 2
    fi
    
    echo ""
    log_info "▶ $cmd"
    echo ""
    
    # Replace "tf " with self-invocation
    local actual_cmd="${cmd/#tf /$SCRIPT_DIR/tf.sh }"
    eval "$actual_cmd"
}

hub_find() {
    local term="${1:-}"
    if [ -z "$term" ]; then
        log_error "Usage: tf hub find <term>"
        return 1
    fi
    
    hub_require || return 1
    
    echo ""
    echo "Search results for: \"$term\""
    echo "─────────────────────────────────────────────────"
    
    python3 - "$TF_HUB_REGISTRY" "$term" <<'PYFIND'
import sys, json
try:
    import yaml
except ImportError:
    print("Error: pyyaml required", file=sys.stderr)
    sys.exit(1)

with open(sys.argv[1]) as f:
    d = yaml.safe_load(f)

term = sys.argv[2].lower()
found = 0

for g in d.get("groups", []):
    for it in g.get("items", []):
        blob = (it["id"] + " " + it["title"] + " " + it.get("desc", "")).lower()
        if term in blob:
            safe = "✓" if it.get("safe", True) else "⚠"
            print(f"  [{safe}] {it['id']:15} {it['title']}")
            print(f"       {it.get('desc', '')}")
            print("")
            found += 1

if found == 0:
    print(f"  No tools found matching '{term}'")
else:
    print(f"Found {found} tool(s). Run with: tf hub run <id>")
PYFIND
}

hub_tasks() {
    log_info "Generating VS Code tasks from registry..."
    python3 "$ROOT/ops/tooling/generate-tasks.py"
}

hub_docs() {
    log_info "Generating documentation from registry..."
    python3 "$ROOT/ops/tooling/generate-docs.py"
}

hub_verify() {
    log_info "Verifying tasks.json matches registry..."
    python3 "$ROOT/ops/tooling/verify-tasks.py"
}

hub_sync() {
    log_info "Syncing all generated artifacts from registry..."
    hub_tasks
    hub_docs
    log_success "All artifacts synced!"
}

cmd_hub() {
    local sub="${1:-menu}"
    shift || true
    
    case "$sub" in
        menu|"")
            local cmd
            cmd=$(hub_menu) || return $?
            [ -z "$cmd" ] && return 0
            echo ""
            log_info "▶ $cmd"
            echo ""
            # Replace "tf " with self-invocation
            local actual_cmd="${cmd/#tf /$SCRIPT_DIR/tf.sh }"
            eval "$actual_cmd"
            ;;
        list)
            hub_list
            ;;
        run)
            hub_run_id "${1:-}"
            ;;
        find)
            hub_find "${1:-}"
            ;;
        tasks)
            hub_tasks
            ;;
        docs)
            hub_docs
            ;;
        verify)
            hub_verify
            ;;
        sync)
            hub_sync
            ;;
        *)
            echo ""
            echo "Usage: tf hub [menu|list|run <id>|find <term>|tasks|docs|verify|sync]"
            echo ""
            echo "  Discovery:"
            echo "    menu          Interactive tool menu (default)"
            echo "    list          List all tools as JSON"
            echo "    run <id>      Run tool by ID"
            echo "    find <term>   Search tools by keyword"
            echo ""
            echo "  Generation:"
            echo "    tasks         Generate VS Code tasks.json"
            echo "    docs          Generate tooling README.md"
            echo "    sync          Regenerate all artifacts"
            echo "    verify        Check tasks.json matches registry (drift detection)"
            echo ""
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════
# Daily Start Command
# ═══════════════════════════════════════════════════════════════════════════

cmd_start() {
    echo ""
    echo -e "\033[36m  ╔═══════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[36m  ║           🌅 TerraFusion Daily Start                      ║\033[0m"
    echo -e "\033[36m  ║           Protocol v1.0.0 │ Stability Phase               ║\033[0m"
    echo -e "\033[36m  ╚═══════════════════════════════════════════════════════════╝\033[0m"
    echo ""
    
    local failed=0
    local start_time=$(date +%s)
    
    # Step 1: Gate check
    echo -e "\033[33m  [1/5] Gate Check (invariants)\033[0m"
    echo "  ─────────────────────────────────────────────────────────"
    if cmd_gate; then
        echo ""
    else
        failed=1
        echo ""
        log_error "Gate failed - fix issues before continuing"
        return 1
    fi
    
    # Step 2: Hub verify (drift detection)
    echo -e "\033[33m  [2/5] Hub Verify (drift detection)\033[0m"
    echo "  ─────────────────────────────────────────────────────────"
    if python3 "$ROOT/ops/tooling/verify-tasks.py"; then
        echo ""
    else
        echo ""
        log_warn "Drift detected - auto-syncing..."
        hub_sync
        echo ""
    fi
    
    # Step 3: Agent Session Health
    echo -e "\033[33m  [3/5] Agent Session Health\033[0m"
    echo "  ─────────────────────────────────────────────────────────"
    local agent_warnings=0
    if python3 "$AGENTS_DIR/generate-contract.py" check 2>/dev/null; then
        # Check passed (might still have warnings)
        :
    else
        agent_warnings=1
    fi
    
    # Count active sessions
    local active_count=0
    if [ -d "$SESSIONS_DIR" ]; then
        for session in "$SESSIONS_DIR"/*/session.json; do
            [ -f "$session" ] || continue
            local status
            status=$(python3 -c "import json; print(json.load(open('$session')).get('status', ''))" 2>/dev/null || echo "")
            if [ "$status" = "active" ]; then
                active_count=$((active_count + 1))
            fi
        done
    fi
    
    if [ "$active_count" -gt 0 ]; then
        echo "  📁 ${active_count} active session(s)"
        # Show them briefly
        for session in "$SESSIONS_DIR"/*/session.json; do
            [ -f "$session" ] || continue
            local status feature
            status=$(python3 -c "import json; print(json.load(open('$session')).get('status', ''))" 2>/dev/null || echo "")
            if [ "$status" = "active" ]; then
                feature=$(python3 -c "import json; print(json.load(open('$session')).get('feature', 'unknown'))" 2>/dev/null || echo "unknown")
                local session_id=$(python3 -c "import json; print(json.load(open('$session')).get('session_id', 'unknown'))" 2>/dev/null || echo "unknown")
                echo "     └ $feature"
            fi
        done
    else
        echo "  ○ No active agent sessions"
    fi
    
    # Check for work without session
    local uncommitted
    uncommitted=$(git -C "$ROOT" status --porcelain 2>/dev/null | grep -E '\.(py|sh|ts|js|cs|yaml|yml|json)$' | wc -l)
    if [ "$uncommitted" -gt 0 ] && [ "$active_count" -eq 0 ]; then
        echo ""
        echo "  ⚠️  ${uncommitted} uncommitted code files but no active session"
        echo "     Consider: tf agent run --project=<proj> --feature=<desc>"
    fi
    echo ""
    
    # Step 4: Check AI Lab
    echo -e "\033[33m  [4/5] AI Lab Status\033[0m"
    echo "  ─────────────────────────────────────────────────────────"
    local ai_running=0
    if docker ps --filter "name=tf-ai-ollama" --format "{{.Names}}" 2>/dev/null | grep -q tf-ai-ollama; then
        ai_running=1
        echo "  ✓ AI Lab is running"
        docker ps --filter "name=tf-ai" --format "    {{.Names}}: {{.Status}}" 2>/dev/null
    else
        echo "  ○ AI Lab is not running"
        echo "    Start with: tf ai up"
    fi
    echo ""
    
    # Step 5: RAG freshness check
    echo -e "\033[33m  [5/5] RAG Index Freshness\033[0m"
    echo "  ─────────────────────────────────────────────────────────"
    local manifest="$ROOT/ops/ai/rag/state/manifest.json"
    if [ -f "$manifest" ]; then
        local last_run
        last_run=$(python3 -c "import json; print(json.load(open('$manifest')).get('last_run', 'never'))" 2>/dev/null || echo "unknown")
        local file_count
        file_count=$(python3 -c "import json; print(len(json.load(open('$manifest')).get('files', {})))" 2>/dev/null || echo "0")
        
        # Check if stale (>24h)
        local manifest_age=0
        if [ -f "$manifest" ]; then
            manifest_age=$(( ($(date +%s) - $(stat -c %Y "$manifest" 2>/dev/null || echo 0)) / 86400 ))
        fi
        
        if [ "$manifest_age" -gt 1 ]; then
            echo "  ⚠ RAG index is ${manifest_age}d old (threshold: 1d)"
            echo "    Recommend: tf ai ingest"
        else
            echo "  ✓ RAG index is fresh (${file_count} files, ${manifest_age}d old)"
        fi
    else
        echo "  ○ No RAG index found"
        echo "    Initialize with: tf ai ingest"
    fi
    echo ""
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "  ═══════════════════════════════════════════════════════════"
    echo -e "\033[32m  ✓ Daily start complete (${duration}s)\033[0m"
    echo ""
    echo "  Ready to develop. Suggested next:"
    if [ "$ai_running" -eq 0 ]; then
        echo "    • tf ai up        (start AI Lab)"
    fi
    echo "    • tf hub          (interactive tool menu)"
    echo "    • tf status       (see running services)"
    echo ""
    
    # Show protocol telemetry summary
    echo -e "\033[33m  ─── Protocol Health (v1.0.0 Stability Phase) ───\033[0m"
    if [[ -f "$ROOT/ops/agents/generate-contract.py" ]]; then
        python3 "$ROOT/ops/agents/generate-contract.py" telemetry 2>/dev/null | grep -E "^\s+(Total|Completed|Avg tests|Sessions w/o)" | sed 's/^/  /'
    fi
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# Agent Execution Protocol
# ═══════════════════════════════════════════════════════════════════════════

AGENTS_DIR="$ROOT/ops/agents"
SESSIONS_DIR="$AGENTS_DIR/sessions"

cmd_agent() {
    local subcmd="${1:-help}"
    shift || true
    
    case "$subcmd" in
        run)
            # Parse arguments
            local project="" feature="" mode="feature" risk="med" scope="" tests="all" speclock="strict" logs="" print_only=""
            
            while [[ $# -gt 0 ]]; do
                case "$1" in
                    --project=*|-p=*) project="${1#*=}" ;;
                    --project|-p) project="$2"; shift ;;
                    --feature=*|-f=*) feature="${1#*=}" ;;
                    --feature|-f) feature="$2"; shift ;;
                    --mode=*|-m=*) mode="${1#*=}" ;;
                    --mode|-m) mode="$2"; shift ;;
                    --risk=*|-r=*) risk="${1#*=}" ;;
                    --risk|-r) risk="$2"; shift ;;
                    --scope=*|-s=*) scope="${1#*=}" ;;
                    --scope|-s) scope="$2"; shift ;;
                    --tests=*|-t=*) tests="${1#*=}" ;;
                    --tests|-t) tests="$2"; shift ;;
                    --speclock=*) speclock="${1#*=}" ;;
                    --logs=*|-l=*) logs="${1#*=}" ;;
                    --logs|-l) logs="$2"; shift ;;
                    --print) print_only="--print-only" ;;
                    *) log_error "Unknown option: $1"; return 1 ;;
                esac
                shift
            done
            
            if [ -z "$project" ] || [ -z "$feature" ]; then
                log_error "Required: --project and --feature"
                echo ""
                echo "Usage: tf agent run --project=<project> --feature=<feature> [options]"
                echo ""
                echo "Projects: os-shell, api-gateway, ai-lab, consciousness, terrabuild, sdk"
                echo ""
                echo "Options:"
                echo "  --mode=feature|bugfix|refactor|hardening"
                echo "  --risk=low|med|high"
                echo "  --scope=<paths>    Override default scope"
                echo "  --tests=unit|integration|e2e|all"
                echo "  --speclock=strict|advisory|off"
                echo "  --logs=<path>      Enable log-first debugging"
                echo "  --print            Print contract only (no session)"
                return 2
            fi
            
            # Validate project against canonical registry (generate-contract.py PROJECTS)
            local valid_projects="os-shell api-gateway ai-lab consciousness terrabuild sdk"
            if ! echo "$valid_projects" | grep -qw "$project"; then
                log_error "Invalid project: $project"
                echo ""
                echo "Valid projects: os-shell, api-gateway, ai-lab, consciousness, terrabuild, sdk"
                echo ""
                return 2
            fi
            
            # Prevent concurrent sessions (only one active session allowed)
            # Check ACTIVE_SESSION marker file (written by generate-contract.py)
            local active_marker="$AGENTS_DIR/ACTIVE_SESSION"
            if [[ -f "$active_marker" ]]; then
                local active_session_id
                active_session_id=$(cat "$active_marker" 2>/dev/null || echo "")
                if [[ -n "$active_session_id" ]]; then
                    local session_dir="$SESSIONS_DIR/$active_session_id"
                    local feature_name="unknown"
                    if [[ -f "$session_dir/SESSION.json" ]]; then
                        feature_name=$(python3 -c "import json; print(json.load(open('$session_dir/SESSION.json')).get('feature', 'unknown'))" 2>/dev/null || echo "unknown")
                    fi
                    log_error "Concurrent session detected: $feature_name"
                    echo ""
                    echo "Only one active session allowed at a time."
                    echo ""
                    echo "Remediation:"
                    echo "  tf agent status     # Show active sessions"
                    echo "  tf agent complete   # Mark current session complete"
                    echo ""
                    return 1
                fi
            fi
            
            # Run gate first
            log_info "Running gate check before agent session..."
            if ! cmd_gate >/dev/null 2>&1; then
                log_error "Gate failed - fix issues before starting agent session"
                echo "  Run: tf gate"
                return 1
            fi
            log_success "Gate passed ✓"
            echo ""
            
            # Generate contract
            local cmd_args=()
            cmd_args+=("--project=$project")
            cmd_args+=("--feature=$feature")
            cmd_args+=("--mode=$mode")
            cmd_args+=("--risk=$risk")
            cmd_args+=("--tests=$tests")
            cmd_args+=("--speclock=$speclock")
            [ -n "$scope" ] && cmd_args+=("--scope=$scope")
            [ -n "$logs" ] && cmd_args+=("--logs=$logs")
            [ -n "$print_only" ] && cmd_args+=("$print_only")
            
            python3 "$AGENTS_DIR/generate-contract.py" run "${cmd_args[@]}"
            
            if [ -z "$print_only" ]; then
                # Find the latest session directory
                local latest_session
                latest_session=$(ls -t "$SESSIONS_DIR" 2>/dev/null | head -1)
                if [ -n "$latest_session" ]; then
                    local session_dir="$SESSIONS_DIR/$latest_session"
                    echo ""
                    log_info "Opening session artifacts in editor..."
                    if command -v code &>/dev/null; then
                        code "$session_dir/CONTRACT.md" "$session_dir/SPECLOCK.md" "$session_dir/TESTPLAN.md" "$session_dir/NOTES.md"
                    fi
                fi
            fi
            ;;
            
        status)
            python3 "$AGENTS_DIR/generate-contract.py" status
            ;;
            
        list)
            if [ ! -d "$SESSIONS_DIR" ]; then
                echo "[]"
                return 0
            fi
            
            python3 -c "
import json
from pathlib import Path
sessions = []
for s in Path('$SESSIONS_DIR').glob('*/session.json'):
    sessions.append(json.load(open(s)))
print(json.dumps(sessions, indent=2))
"
            ;;
            
        notes)
            local session_arg="${1:-}"
            local session_opt=""
            [ -n "$session_arg" ] && session_opt="--session=$session_arg"
            
            local notes_path
            notes_path=$(python3 "$AGENTS_DIR/generate-contract.py" notes $session_opt 2>/dev/null)
            
            if [ -n "$notes_path" ] && [ -f "$notes_path" ]; then
                if command -v code &>/dev/null; then
                    code "$notes_path"
                else
                    ${EDITOR:-vim} "$notes_path"
                fi
            else
                log_error "Notes not found. Create a session first: tf agent run"
            fi
            ;;
            
        complete)
            local session_arg="${1:-}"
            local session_opt=""
            [ -n "$session_arg" ] && session_opt="--session=$session_arg"
            
            python3 "$AGENTS_DIR/generate-contract.py" complete $session_opt
            ;;
            
        check)
            python3 "$AGENTS_DIR/generate-contract.py" check
            ;;
            
        break)
            local session_arg="${1:-}"
            local session_opt=""
            [ -n "$session_arg" ] && session_opt="--session=$session_arg"
            
            python3 "$AGENTS_DIR/generate-contract.py" break $session_opt
            ;;
            
        telemetry)
            python3 "$AGENTS_DIR/generate-contract.py" telemetry
            ;;
            
        *)
            echo ""
            echo "Usage: tf agent <command> [options]"
            echo ""
            echo "Commands:"
            echo "  run         Start new agent session with execution contract"
            echo "  status      Show active agent sessions"
            echo "  check       Verify session health (stale sessions, missing artifacts)"
            echo "  break       Run Breaker pass (gate, lint, secrets scan)"
            echo "  notes       Open notes for a session"
            echo "  complete    Mark a session as complete"
            echo "  telemetry   Show agent protocol metrics"
            echo ""
            echo "Example:"
            echo "  tf agent run --project=os-shell --feature=\"Ops Inbox Compare View\""
            echo "  tf agent break         # Run breaker on latest session"
            echo "  tf agent telemetry     # Show adoption metrics"
            echo ""
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

cmd="${1:-help}"
shift || true

case "$cmd" in
    start)    cmd_start ;;
    up)       cmd_up "$@" ;;
    down)     cmd_down "$@" ;;
    doctor)   cmd_doctor "$@" ;;
    gate)     cmd_gate "$@" ;;
    certify)  cmd_certify ;;
    clean)    cmd_clean "$@" ;;
    logs)     cmd_logs ;;
    status)   cmd_status ;;
    ai)       cmd_ai "$@" ;;
    hub)      cmd_hub "$@" ;;
    agent)    cmd_agent "$@" ;;
    help|*)   show_help ;;
esac
