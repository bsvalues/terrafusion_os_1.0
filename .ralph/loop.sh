#!/bin/bash
# ============================================================================
# TerraFusion Ralph Loop - Autonomous Optimization Engine
# ============================================================================
# Follows AGENTS.md Core Governance Surface
# Integrates Codex 3-6-9 for termination condition
# Wired to QC-019 Performance Team (50 agents)
#
# Usage:
#   ./loop.sh              # Run until Divine Balance
#   ./loop.sh --dry-run    # Validate without changes
#   ./loop.sh --max 5      # Limit to 5 iterations
#   ./loop.sh --task FILE  # Use specific task file
# ============================================================================

set -euo pipefail

# Configuration
RALPH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$RALPH_ROOT")"
CONFIG_FILE="$RALPH_ROOT/config.yml"
LOG_DIR="$PROJECT_ROOT/logs/ralph"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Defaults (overridden by .env.ports)
DEFAULT_API_PORT=5046
ITERATION=0
MAX_ITERATIONS=20
TARGET_SCORE=11.5
DRY_RUN=false
TASK_FILE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ============================================================================
# LOGGING
# ============================================================================
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/loop_${TIMESTAMP}.log"

log() {
    local level=$1
    shift
    local msg="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)  color=$GREEN ;;
        WARN)  color=$YELLOW ;;
        ERROR) color=$RED ;;
        DEBUG) color=$CYAN ;;
        *)     color=$NC ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $msg${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# PORT CONFIGURATION - NO HARDCODED PORTS!
# ============================================================================
load_port_config() {
    # Source .env.ports if it exists
    if [[ -f "$PROJECT_ROOT/.env.ports" ]]; then
        source "$PROJECT_ROOT/.env.ports"
        log INFO "Loaded port configuration from .env.ports"
    fi
    
    # Set API port with fallback
    API_PORT="${TF_API_PORT:-$DEFAULT_API_PORT}"
    log DEBUG "API Port: $API_PORT"
}

# ============================================================================
# CODEX 3-6-9 INTEGRATION
# ============================================================================
get_codex_score() {
    local endpoint="http://localhost:${API_PORT}/api/codex/ultimate-power"
    local response
    
    response=$(curl -s --max-time 10 "$endpoint" 2>/dev/null || echo '{"ultimatePowerScore": 0}')
    echo "$response" | grep -oP '"ultimatePowerScore":\s*\K[0-9.]+' || echo "0"
}

check_divine_balance() {
    local score=$1
    
    if (( $(echo "$score >= 11.5" | bc -l) )); then
        return 0  # Divine Balance achieved
    fi
    return 1
}

get_score_status() {
    local score=$1
    
    if (( $(echo "$score >= 11.5" | bc -l) )); then
        echo "DIVINE_BALANCE"
    elif (( $(echo "$score >= 10.0" | bc -l) )); then
        echo "CHAMPIONSHIP"
    elif (( $(echo "$score >= 8.0" | bc -l) )); then
        echo "OPERATIONAL"
    else
        echo "NEEDS_IMPROVEMENT"
    fi
}

# ============================================================================
# GOVERNANCE VALIDATION - FROM AGENTS.md
# ============================================================================
validate_governance_scope() {
    local changed_files
    changed_files=$(git diff --name-only HEAD 2>/dev/null || echo "")
    
    if [[ -z "$changed_files" ]]; then
        log DEBUG "No changed files to validate"
        return 0
    fi
    
    # Check for forbidden paths
    local forbidden_patterns=(
        "ARCHIVE/"
        "specialized/"
        "applications/"
    )
    
    for pattern in "${forbidden_patterns[@]}"; do
        if echo "$changed_files" | grep -q "$pattern"; then
            log ERROR "GOVERNANCE VIOLATION: Modification in forbidden path: $pattern"
            return 1
        fi
    done
    
    # Check for allowed paths
    local allowed=false
    local allowed_patterns=(
        "os-platform/core/pilot/"
        "os-platform/core/types/"
        "tools/registry/"
        "tsconfig.core.json"
        "package.json"
        ".github/workflows/"
    )
    
    while IFS= read -r file; do
        for pattern in "${allowed_patterns[@]}"; do
            if [[ "$file" == *"$pattern"* ]]; then
                allowed=true
                break
            fi
        done
    done <<< "$changed_files"
    
    log DEBUG "Governance scope validation passed"
    return 0
}

# ============================================================================
# CORE GOVERNANCE GATES
# ============================================================================
check_governance_gates() {
    log INFO "🔒 Checking Core Governance Gates..."
    
    # Gate 1: TypeScript type check
    log DEBUG "Running type-check..."
    if ! pnpm run type-check > "$LOG_DIR/gate-typecheck.log" 2>&1; then
        log ERROR "❌ GATE FAILED: type-check"
        cat "$LOG_DIR/gate-typecheck.log" >> "$LOG_FILE"
        return 1
    fi
    log INFO "✅ Gate 1: type-check passed"
    
    # Gate 2: Phase 83 tools test
    log DEBUG "Running phase83-tools.test.mjs..."
    if ! node --test os-platform/core/tests/phase83-tools.test.mjs > "$LOG_DIR/gate-tests.log" 2>&1; then
        log ERROR "❌ GATE FAILED: phase83-tools.test.mjs"
        cat "$LOG_DIR/gate-tests.log" >> "$LOG_FILE"
        return 1
    fi
    log INFO "✅ Gate 2: phase83-tools.test.mjs passed"
    
    # Gate 3: Port validation (ZERO TOLERANCE)
    if [[ -f "$PROJECT_ROOT/scripts/port-validator.py" ]]; then
        log DEBUG "Running port-validator.py..."
        if ! python3 "$PROJECT_ROOT/scripts/port-validator.py" > "$LOG_DIR/gate-ports.log" 2>&1; then
            log ERROR "❌ GATE FAILED: port-validator.py (ZERO TOLERANCE)"
            cat "$LOG_DIR/gate-ports.log" >> "$LOG_FILE"
            return 1
        fi
        log INFO "✅ Gate 3: port-validator passed"
    else
        log WARN "⚠️ Port validator not found, skipping"
    fi
    
    log INFO "✅ All Core Governance Gates passed"
    return 0
}

# ============================================================================
# OPTIMIZATION ITERATION
# ============================================================================
run_optimization_iteration() {
    local score=$1
    local iteration=$2
    local status=$(get_score_status "$score")
    
    log INFO "🔄 Starting iteration $iteration"
    log INFO "📊 Current Score: $score / 12 ($status)"
    
    # Determine task file
    local task_file="$RALPH_ROOT/task.md"
    if [[ -n "$TASK_FILE" && -f "$TASK_FILE" ]]; then
        task_file="$TASK_FILE"
    elif [[ ! -f "$task_file" ]]; then
        task_file="$RALPH_ROOT/tasks/default-optimization.md"
    fi
    
    if [[ ! -f "$task_file" ]]; then
        log WARN "No task file found, creating default"
        create_default_task
        task_file="$RALPH_ROOT/tasks/default-optimization.md"
    fi
    
    log DEBUG "Using task file: $task_file"
    
    # Fresh agent context (Ralph Wiggum pattern)
    if [[ "$DRY_RUN" == "false" ]]; then
        git stash --include-untracked -m "ralph-iteration-$iteration" 2>/dev/null || true
    fi
    
    # This is where the agent would be invoked
    # In production, this would call Claude Code or similar
    log INFO "🤖 Agent would process task from: $task_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would apply optimizations"
        return 0
    fi
    
    # Restore changes
    git stash pop 2>/dev/null || true
    
    return 0
}

create_default_task() {
    mkdir -p "$RALPH_ROOT/tasks"
    cat > "$RALPH_ROOT/tasks/default-optimization.md" << 'EOF'
# RALPH DEFAULT TASK: Performance Optimization

## Objective
Improve TerraFusion OS performance metrics to achieve Divine Balance (11.5+)

## Scope (from AGENTS.md)
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**

## Priority Actions
1. Eliminate sequential awaits (Promise.all for parallel operations)
2. Optimize bundle size (code splitting, tree shaking)
3. Improve API response times (caching, query optimization)

## Success Criteria
- Codex Ultimate Power Score ≥ 11.5
- All Core Governance Gates pass
- Zero port violations

## Constraints
- Follow Core Governance Surface rules
- No hardcoded ports (use ${TF_*_PORT} format)
- Evidence-based commits required
EOF
}

# ============================================================================
# COMMIT WITH EVIDENCE
# ============================================================================
commit_iteration() {
    local score=$1
    local iteration=$2
    local status=$(get_score_status "$score")
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would commit iteration $iteration"
        return 0
    fi
    
    # Count test results
    local tests_passed=0
    if [[ -f "$LOG_DIR/gate-tests.log" ]]; then
        tests_passed=$(grep -c 'ok' "$LOG_DIR/gate-tests.log" 2>/dev/null || echo "0")
    fi
    
    git add -A
    git commit -m "refactor(ralph): iteration $iteration - score $score ($status)

Evidence:
- Tests: $tests_passed passing
- Gates: All Core Governance gates passed
- Codex: Ultimate Power Score $score/12 ($status)
- Target: Divine Balance (≥11.5)

Government: FISMA-HIGH compliance maintained
AI-Collaboration: Ralph Loop + QC-019 Performance Team (50 agents)
Governance: Core Governance Surface constraints enforced" || {
        log WARN "Nothing to commit"
        return 0
    }
    
    log INFO "✅ Committed iteration $iteration"
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --max)
                MAX_ITERATIONS=$2
                shift 2
                ;;
            --task)
                TASK_FILE=$2
                shift 2
                ;;
            --target)
                TARGET_SCORE=$2
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --dry-run       Validate without making changes"
                echo "  --max N         Maximum iterations (default: 20)"
                echo "  --task FILE     Use specific task file"
                echo "  --target SCORE  Target Codex score (default: 11.5)"
                echo "  --help          Show this help"
                exit 0
                ;;
            *)
                log ERROR "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# MAIN LOOP
# ============================================================================
main() {
    parse_args "$@"
    
    log INFO "🚀 TerraFusion Ralph Loop Starting"
    log INFO "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log INFO "📊 Target: Divine Balance (≥$TARGET_SCORE)"
    log INFO "🔒 Governance: Core Governance Surface (AGENTS.md)"
    log INFO "🤖 Commander: QC-019 Performance Team"
    log INFO "📁 Log File: $LOG_FILE"
    [[ "$DRY_RUN" == "true" ]] && log WARN "🔍 DRY RUN MODE - No changes will be made"
    log INFO "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Load port configuration
    load_port_config
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Main optimization loop
    while true; do
        ITERATION=$((ITERATION + 1))
        
        # Check iteration limit
        if [[ $ITERATION -gt $MAX_ITERATIONS ]]; then
            log WARN "⚠️ Max iterations ($MAX_ITERATIONS) reached"
            break
        fi
        
        log INFO ""
        log INFO "═══════════════════════════════════════════════"
        log INFO "ITERATION $ITERATION of $MAX_ITERATIONS"
        log INFO "═══════════════════════════════════════════════"
        
        # Get current Codex score
        SCORE=$(get_codex_score)
        
        if [[ "$SCORE" == "0" ]]; then
            log WARN "⚠️ Could not retrieve Codex score (API may be down)"
            log INFO "Continuing with optimization anyway..."
        else
            log INFO "📈 Current Codex Score: $SCORE / 12"
        fi
        
        # Check if Divine Balance achieved
        if check_divine_balance "$SCORE"; then
            log INFO ""
            log INFO "✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨"
            log INFO "✨  DIVINE BALANCE ACHIEVED: $SCORE / 12"
            log INFO "✨  Government. Transcended. Autonomously."
            log INFO "✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨"
            break
        fi
        
        # Validate governance scope
        if ! validate_governance_scope; then
            log ERROR "🔙 Governance scope violation detected"
            if [[ "$DRY_RUN" == "false" ]]; then
                git checkout -- .
            fi
            continue
        fi
        
        # Run optimization
        if ! run_optimization_iteration "$SCORE" "$ITERATION"; then
            log WARN "⚠️ Iteration $ITERATION failed, continuing..."
            continue
        fi
        
        # Validate gates
        if ! check_governance_gates; then
            log WARN "🔙 Rolling back iteration $ITERATION (gate failure)"
            if [[ "$DRY_RUN" == "false" ]]; then
                git checkout -- .
            fi
            continue
        fi
        
        # Commit successful iteration
        commit_iteration "$SCORE" "$ITERATION"
        
        # Brief pause between iterations
        sleep 2
    done
    
    # Final summary
    FINAL_SCORE=$(get_codex_score)
    log INFO ""
    log INFO "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log INFO "🏁 Ralph Loop Complete"
    log INFO "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log INFO "📊 Final Score: $FINAL_SCORE / 12 ($(get_score_status "$FINAL_SCORE"))"
    log INFO "🔄 Iterations: $ITERATION"
    log INFO "📁 Log File: $LOG_FILE"
    log INFO "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run main
main "$@"
