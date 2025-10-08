#!/bin/bash
#
# observability-audit.sh
# Purpose: Hourly self-audit script for non-invasive observability integrity checks
# Principle: "Detect silent drift before it becomes a failure"
# Generated: 2025-10-07 T+36h
# Owner: SRE Team
#
# Usage:
#   bash observability-audit.sh                         # Interactive mode (prompts for action)
#   bash observability-audit.sh --mode=check-integrity  # Non-invasive validation (cron-safe)
#   bash observability-audit.sh --mode=fix-issues       # Attempt auto-remediation
#   bash observability-audit.sh --verbose               # Detailed output
#
# Schedule (Cron):
#   0 * * * * cd /path/to/terrafusion_os_1.0 && bash ops/tests/pre-flight/observability-audit.sh --mode=check-integrity
#

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="${SCRIPT_DIR}/../.."
LOG_FILE="${OPS_DIR}/logs/observability-audit-$(date +%Y%m%d-%H).log"

# Modes
MODE="interactive"
VERBOSE=false

# Thresholds
MAX_ORPHANED_ALERTS=0
MAX_STALE_METRICS_AGE=300  # 5 minutes
MIN_GRAFANA_DASHBOARDS=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log() {
    if [[ "$VERBOSE" == true ]] || [[ "$MODE" == "interactive" ]]; then
        echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*" | tee -a "${LOG_FILE}"
    else
        echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*" >> "${LOG_FILE}"
    fi
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "${LOG_FILE}" >&2
}

success() {
    echo -e "${GREEN}[PASS]${NC} $*" | tee -a "${LOG_FILE}"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "${LOG_FILE}"
}

# Create log directory
mkdir -p "$(dirname "${LOG_FILE}")"

# =============================================================================
# PARSE ARGUMENTS
# =============================================================================

for arg in "$@"; do
    case $arg in
        --mode=check-integrity)
            MODE="check-integrity"
            shift
            ;;
        --mode=fix-issues)
            MODE="fix-issues"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            error "Unknown argument: $arg"
            echo "Usage: $0 [--mode=check-integrity|fix-issues] [--verbose]"
            exit 1
            ;;
    esac
done

# =============================================================================
# AUDIT CHECKS
# =============================================================================

declare -a FAILURES=()
declare -a WARNINGS=()

# -----------------------------------------------------------------------------
# Check 1: F2 Alerts Registered in Prometheus
# -----------------------------------------------------------------------------

check_f2_alerts_registered() {
    log "Checking F2 circuit breaker alerts registered in Prometheus..."
    
    local alert_file="${OPS_DIR}/ops/tests/chaos/monitoring/f2-recovery.alerts.yaml"
    
    if [[ ! -f "$alert_file" ]]; then
        error "Alert file not found: $alert_file"
        FAILURES+=("F2 alert file missing")
        return 1
    fi
    
    local expected_alerts=6
    local defined_alerts=$(grep -c 'alert:' "$alert_file" || echo "0")
    
    if [[ $defined_alerts -eq $expected_alerts ]]; then
        success "F2 alerts defined: $defined_alerts/$expected_alerts ✓"
    else
        error "F2 alerts mismatch: $defined_alerts/$expected_alerts (expected $expected_alerts)"
        FAILURES+=("F2 alert count mismatch")
        return 1
    fi
    
    # Verify alerts loaded in Prometheus
    if command -v curl &> /dev/null; then
        local loaded_alerts=$(curl -s http://localhost:9090/api/v1/rules 2>/dev/null | grep -o '"alert":"F2_[^"]*"' | wc -l || echo "0")
        
        if [[ $loaded_alerts -ge $expected_alerts ]]; then
            success "F2 alerts loaded in Prometheus: $loaded_alerts ≥ $expected_alerts ✓"
        else
            warn "F2 alerts not fully loaded: $loaded_alerts/$expected_alerts"
            WARNINGS+=("F2 alerts not loaded in Prometheus")
        fi
    else
        warn "curl not found, skipping Prometheus alert check"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 2: RI Calculator Running
# -----------------------------------------------------------------------------

check_ri_calculator_running() {
    log "Checking RI calculator service..."
    
    if command -v curl &> /dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9091/metrics 2>/dev/null || echo "000")
        
        if [[ "$response" == "200" ]]; then
            success "RI calculator responding on port 9091 ✓"
            
            # Verify metrics exist
            local metric_count=$(curl -s http://localhost:9091/metrics 2>/dev/null | grep -c '^terrafusion_ri' || echo "0")
            
            if [[ $metric_count -ge 4 ]]; then
                success "RI metrics exported: $metric_count ≥ 4 ✓"
            else
                warn "RI metrics incomplete: $metric_count < 4"
                WARNINGS+=("RI metrics incomplete")
            fi
        else
            error "RI calculator not responding (HTTP $response)"
            FAILURES+=("RI calculator down")
            return 1
        fi
    else
        warn "curl not found, skipping RI calculator check"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 3: Recording Rules Evaluating
# -----------------------------------------------------------------------------

check_recording_rules() {
    log "Checking Prometheus recording rules..."
    
    local rules_file="${OPS_DIR}/ops/monitoring/ri-recording-rules.yaml"
    
    if [[ ! -f "$rules_file" ]]; then
        error "Recording rules file not found: $rules_file"
        FAILURES+=("Recording rules file missing")
        return 1
    fi
    
    local expected_rules=$(grep -c 'record:' "$rules_file" || echo "0")
    
    if [[ $expected_rules -gt 0 ]]; then
        success "Recording rules defined: $expected_rules ✓"
    else
        error "No recording rules found in $rules_file"
        FAILURES+=("Recording rules not defined")
        return 1
    fi
    
    # Verify rules loaded in Prometheus
    if command -v curl &> /dev/null; then
        local loaded_rules=$(curl -s http://localhost:9090/api/v1/rules 2>/dev/null | grep -c '"type":"recording"' || echo "0")
        
        if [[ $loaded_rules -gt 0 ]]; then
            success "Recording rules loaded in Prometheus: $loaded_rules ✓"
        else
            warn "Recording rules not loaded in Prometheus"
            WARNINGS+=("Recording rules not loaded")
        fi
        
        # Check if rules are evaluating (last_evaluation time)
        local recent_evaluations=$(curl -s http://localhost:9090/api/v1/rules 2>/dev/null | grep -c '"lastEvaluation":"' || echo "0")
        
        if [[ $recent_evaluations -gt 0 ]]; then
            success "Recording rules evaluating: $recent_evaluations recent evaluations ✓"
        else
            warn "Recording rules not evaluating"
            WARNINGS+=("Recording rules stale")
        fi
    else
        warn "curl not found, skipping Prometheus recording rules check"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 4: Grafana Dashboards Accessible
# -----------------------------------------------------------------------------

check_grafana_dashboards() {
    log "Checking Grafana dashboards..."
    
    if command -v curl &> /dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" http://grafana:3000/api/health 2>/dev/null || echo "000")
        
        if [[ "$response" == "200" ]]; then
            success "Grafana responding ✓"
            
            # Count dashboards (requires API key or anonymous access)
            local dashboard_count=$(curl -s http://grafana:3000/api/search?type=dash-db 2>/dev/null | grep -c '"type":"dash-db"' || echo "0")
            
            if [[ $dashboard_count -ge $MIN_GRAFANA_DASHBOARDS ]]; then
                success "Grafana dashboards: $dashboard_count ≥ $MIN_GRAFANA_DASHBOARDS ✓"
            else
                warn "Grafana dashboards: $dashboard_count < $MIN_GRAFANA_DASHBOARDS"
                WARNINGS+=("Insufficient Grafana dashboards")
            fi
        else
            warn "Grafana not responding (HTTP $response)"
            WARNINGS+=("Grafana unreachable")
        fi
    else
        warn "curl not found, skipping Grafana check"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 5: No Orphaned Alert Rules
# -----------------------------------------------------------------------------

check_orphaned_alerts() {
    log "Checking for orphaned alert rules..."
    
    # An alert is "orphaned" if:
    # 1. Defined in YAML but not loaded in Prometheus, OR
    # 2. Loaded in Prometheus but source YAML missing
    
    local alert_files=$(find "${OPS_DIR}/ops" -name "*.alerts.yaml" 2>/dev/null || echo "")
    
    if [[ -z "$alert_files" ]]; then
        warn "No alert files found"
        WARNINGS+=("No alert files found")
        return 0
    fi
    
    local orphaned_count=0
    
    for alert_file in $alert_files; do
        local defined_alerts=$(grep -c 'alert:' "$alert_file" || echo "0")
        
        if [[ $defined_alerts -eq 0 ]]; then
            continue
        fi
        
        # Extract alert names from YAML
        local alert_names=$(grep 'alert:' "$alert_file" | awk '{print $2}' | tr -d '"')
        
        # Check if each alert is loaded in Prometheus
        if command -v curl &> /dev/null; then
            for alert_name in $alert_names; do
                local loaded=$(curl -s http://localhost:9090/api/v1/rules 2>/dev/null | grep -c "\"alert\":\"$alert_name\"" || echo "0")
                
                if [[ $loaded -eq 0 ]]; then
                    warn "Orphaned alert: $alert_name (defined in $alert_file but not loaded)"
                    ((orphaned_count++))
                fi
            done
        fi
    done
    
    if [[ $orphaned_count -eq $MAX_ORPHANED_ALERTS ]]; then
        success "No orphaned alerts ✓"
    else
        warn "Orphaned alerts detected: $orphaned_count"
        WARNINGS+=("$orphaned_count orphaned alerts")
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 6: Metrics Not Stale
# -----------------------------------------------------------------------------

check_metrics_freshness() {
    log "Checking metrics freshness..."
    
    if command -v curl &> /dev/null; then
        # Check if RI metrics have been updated recently
        local last_scrape=$(curl -s http://localhost:9091/metrics 2>/dev/null | grep -m1 'terrafusion_ri_system' || echo "")
        
        if [[ -z "$last_scrape" ]]; then
            warn "No RI metrics found"
            WARNINGS+=("RI metrics missing")
            return 0
        fi
        
        # Prometheus metrics don't have timestamps by default, so we check if scrape_interval is healthy
        local scrape_interval=$(curl -s http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"scrapeInterval":"[^"]*"' | head -1 || echo "")
        
        if [[ -n "$scrape_interval" ]]; then
            success "Prometheus scraping targets ✓"
        else
            warn "Prometheus scrape interval unclear"
            WARNINGS+=("Prometheus scrape health unclear")
        fi
    else
        warn "curl not found, skipping metrics freshness check"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Check 7: Backup Manifests Exist
# -----------------------------------------------------------------------------

check_backup_manifests() {
    log "Checking backup manifests (rollback targets)..."
    
    local backup_files=(
        "ops/traffic/f1-retry-budget.backup.yaml"
        "ops/traffic/f2-circuit-breaker.backup.yaml"
        "ops/cache/f4-redis-pool.backup.yaml"
        "ops/security/rs256/jwt-secret.backup.txt"
    )
    
    local missing_backups=0
    
    for backup_file in "${backup_files[@]}"; do
        local full_path="${OPS_DIR}/$backup_file"
        
        if [[ -f "$full_path" ]]; then
            success "Backup exists: $backup_file ✓"
        else
            warn "Backup missing: $backup_file"
            ((missing_backups++))
        fi
    done
    
    if [[ $missing_backups -eq 0 ]]; then
        success "All backup manifests exist ✓"
    else
        warn "Missing $missing_backups backup manifest(s)"
        WARNINGS+=("$missing_backups missing backup manifests")
    fi
    
    return 0
}

# =============================================================================
# REMEDIATION FUNCTIONS
# =============================================================================

fix_issues() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "ATTEMPTING AUTO-REMEDIATION"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Fix 1: Reload Prometheus configuration
    if [[ " ${FAILURES[@]} " =~ "F2 alert count mismatch" ]]; then
        log "Reloading Prometheus configuration..."
        curl -X POST http://localhost:9090/-/reload 2>/dev/null || warn "Prometheus reload failed"
    fi
    
    # Fix 2: Restart RI calculator
    if [[ " ${FAILURES[@]} " =~ "RI calculator down" ]]; then
        log "Restarting RI calculator service..."
        pkill -f ri-calculator.py 2>/dev/null || true
        nohup python3 "${OPS_DIR}/ops/monitoring/ri-calculator.py" &
    fi
    
    # Fix 3: Create missing backup manifests
    if [[ " ${WARNINGS[@]} " =~ "missing backup manifests" ]]; then
        log "Creating missing backup manifests..."
        # This would require kubectl to fetch current configs
        warn "Manual intervention required: recreate backup manifests"
    fi
    
    success "Auto-remediation complete"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "TerraFusion OS - Observability Integrity Audit"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Timestamp:   $(date +'%Y-%m-%d %H:%M:%S %Z')"
    log "Mode:        $MODE"
    log "Log file:    ${LOG_FILE}"
    log ""
    
    # Run all checks
    check_f2_alerts_registered
    check_ri_calculator_running
    check_recording_rules
    check_grafana_dashboards
    check_orphaned_alerts
    check_metrics_freshness
    check_backup_manifests
    
    # Summary
    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "AUDIT SUMMARY"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local failure_count=${#FAILURES[@]}
    local warning_count=${#WARNINGS[@]}
    
    if [[ $failure_count -eq 0 ]] && [[ $warning_count -eq 0 ]]; then
        success "All checks passed ✓✓✓"
        exit 0
    elif [[ $failure_count -eq 0 ]]; then
        warn "$warning_count warning(s):"
        for warning in "${WARNINGS[@]}"; do
            warn "  - $warning"
        done
        exit 0
    else
        error "$failure_count failure(s):"
        for failure in "${FAILURES[@]}"; do
            error "  - $failure"
        done
        
        if [[ $warning_count -gt 0 ]]; then
            warn "$warning_count warning(s):"
            for warning in "${WARNINGS[@]}"; do
                warn "  - $warning"
            done
        fi
        
        if [[ "$MODE" == "fix-issues" ]]; then
            fix_issues
        elif [[ "$MODE" == "interactive" ]]; then
            read -p "Attempt auto-remediation? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                fix_issues
            fi
        fi
        
        exit 1
    fi
}

# Run main function
main "$@"
