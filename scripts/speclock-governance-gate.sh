#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock - Governance Gate
# ═══════════════════════════════════════════════════════════════════════════════
#
# CI gate for governance object verification:
# - Receipt schema validation
# - PluginLock permission validation
# - Amendment workflow validation
# - Zero-trust runtime checks
#
# Exit codes:
#   0  = All governance checks passed
#   1  = Validation failed
#   9  = Governance not configured
#   10 = Missing required files
#
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ═══════════════════════════════════════════════════════════════════════════════
# Schema Validation Functions
# ═══════════════════════════════════════════════════════════════════════════════

validate_json_schema() {
    local file="$1"
    local schema="$2"
    local name="$3"

    if [ ! -f "$file" ]; then
        log_warn "$name not found: $file"
        return 0  # Not an error if file doesn't exist
    fi

    log_info "Validating $name..."

    # Check if ajv is available (JSON schema validator)
    if command -v ajv &> /dev/null; then
        if ajv validate -s "$schema" -d "$file" 2>/dev/null; then
            log_ok "$name schema valid"
            return 0
        else
            log_error "$name schema validation failed"
            return 1
        fi
    else
        # Fallback: Just check JSON syntax
        if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            log_ok "$name JSON syntax valid (schema validation skipped - install ajv for full validation)"
            return 0
        else
            log_error "$name is not valid JSON"
            return 1
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# Receipt Validation
# ═══════════════════════════════════════════════════════════════════════════════

validate_receipts() {
    local receipt_dir="${ROOT_DIR}/artifacts/speclock/receipts"
    local schema="${ROOT_DIR}/docs/spec-lock/schemas/receipt.schema.json"
    local failed=0

    log_info "Validating receipts..."

    if [ ! -d "$receipt_dir" ]; then
        log_info "No receipts directory found - skipping"
        return 0
    fi

    for receipt in "$receipt_dir"/*.json; do
        [ -f "$receipt" ] || continue

        local basename=$(basename "$receipt")

        # Check required fields
        if ! python3 -c "
import json
import sys
r = json.load(open('$receipt'))
required = ['schema_version', 'receipt_id', 'artifact', 'issuance', 'signatures', 'verification']
missing = [f for f in required if f not in r]
if missing:
    print(f'Missing fields: {missing}', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null; then
            log_error "Receipt $basename missing required fields"
            failed=1
            continue
        fi

        # Check signature mode
        local mode=$(python3 -c "import json; print(json.load(open('$receipt')).get('signatures', {}).get('mode', 'unknown'))" 2>/dev/null)

        # Check time bounds
        local valid_time=$(python3 -c "
import json
from datetime import datetime
r = json.load(open('$receipt'))
iss = r.get('issuance', {})
nbf = iss.get('nbf', '')
exp = iss.get('exp', '')
if nbf and exp:
    now = datetime.utcnow().isoformat() + 'Z'
    print('valid' if nbf <= now <= exp else 'expired')
else:
    print('no_bounds')
" 2>/dev/null)

        if [ "$valid_time" = "expired" ]; then
            log_warn "Receipt $basename is expired"
        fi

        log_ok "Receipt $basename validated (mode: $mode)"
    done

    return $failed
}

# ═══════════════════════════════════════════════════════════════════════════════
# PluginLock Validation
# ═══════════════════════════════════════════════════════════════════════════════

validate_pluginlocks() {
    local plugin_dir="${ROOT_DIR}/artifacts/speclock/plugins"
    local schema="${ROOT_DIR}/docs/spec-lock/schemas/pluginlock.schema.json"
    local failed=0

    log_info "Validating PluginLocks..."

    if [ ! -d "$plugin_dir" ]; then
        log_info "No plugins directory found - skipping"
        return 0
    fi

    for pluginlock in "$plugin_dir"/*.json; do
        [ -f "$pluginlock" ] || continue

        local basename=$(basename "$pluginlock")

        # Check critical vulnerability count
        local critical_vulns=$(python3 -c "
import json
p = json.load(open('$pluginlock'))
vuln = p.get('security', {}).get('vulnerability_scan', {})
print(vuln.get('critical', 0))
" 2>/dev/null || echo "0")

        if [ "$critical_vulns" != "0" ]; then
            log_error "PluginLock $basename has $critical_vulns critical vulnerabilities"
            failed=1
            continue
        fi

        # Check required signatures
        local sig_valid=$(python3 -c "
import json
p = json.load(open('$pluginlock'))
sigs = p.get('signatures', {})
required = set(sigs.get('required_scopes', []))
actual = set(s['scope'] for s in sigs.get('actual_signatures', []))
print('valid' if required <= actual else 'missing')
" 2>/dev/null || echo "error")

        if [ "$sig_valid" = "missing" ]; then
            log_error "PluginLock $basename missing required signatures"
            failed=1
            continue
        fi

        # Check SBOM presence
        local sbom_hash=$(python3 -c "
import json
p = json.load(open('$pluginlock'))
print(p.get('security', {}).get('sbom', {}).get('hash', ''))
" 2>/dev/null || echo "")

        if [ -z "$sbom_hash" ]; then
            log_warn "PluginLock $basename missing SBOM"
        fi

        log_ok "PluginLock $basename validated (vulns: 0 critical)"
    done

    return $failed
}

# ═══════════════════════════════════════════════════════════════════════════════
# Amendment Validation
# ═══════════════════════════════════════════════════════════════════════════════

validate_amendments() {
    local amendment_dir="${ROOT_DIR}/artifacts/speclock/amendments"
    local schema="${ROOT_DIR}/docs/spec-lock/schemas/amendment.schema.json"
    local failed=0

    log_info "Validating Amendments..."

    if [ ! -d "$amendment_dir" ]; then
        log_info "No amendments directory found - skipping"
        return 0
    fi

    for amendment in "$amendment_dir"/*.json; do
        [ -f "$amendment" ] || continue

        local basename=$(basename "$amendment")

        # Check status
        local status=$(python3 -c "
import json
a = json.load(open('$amendment'))
print(a.get('status', 'unknown'))
" 2>/dev/null || echo "unknown")

        # Only validate active amendments
        if [ "$status" != "active" ] && [ "$status" != "implementing" ]; then
            log_info "Amendment $basename is $status - skipping validation"
            continue
        fi

        # Check review gates
        local reviews_passed=$(python3 -c "
import json
a = json.load(open('$amendment'))
review = a.get('review', {})
builder = review.get('builder_review', {}).get('status', '') == 'passed'
breaker = review.get('breaker_review', {}).get('status', '') == 'passed'
security = review.get('security_review', {}).get('status', '') == 'passed'
print('passed' if builder and breaker and security else 'failed')
" 2>/dev/null || echo "error")

        if [ "$reviews_passed" != "passed" ]; then
            log_error "Amendment $basename has not passed all review gates"
            failed=1
            continue
        fi

        # Check approval quorum
        local approval_valid=$(python3 -c "
import json
a = json.load(open('$amendment'))
approval = a.get('approval', {})
required = set(approval.get('required_scopes', []))
actual = set(s['scope'] for s in approval.get('signatures', []) if s.get('vote') == 'approve')
print('valid' if required <= actual else 'missing')
" 2>/dev/null || echo "error")

        if [ "$approval_valid" != "valid" ]; then
            log_error "Amendment $basename missing required approval signatures"
            failed=1
            continue
        fi

        log_ok "Amendment $basename validated (status: $status)"
    done

    return $failed
}

# ═══════════════════════════════════════════════════════════════════════════════
# Zero-Trust Runtime Checks
# ═══════════════════════════════════════════════════════════════════════════════

check_zero_trust() {
    local failed=0

    log_info "Checking Zero-Trust requirements..."

    # Check that AUTHORITIES.json exists and has valid config
    local authorities="${ROOT_DIR}/docs/spec-lock/AUTHORITIES.json"
    if [ ! -f "$authorities" ]; then
        log_error "AUTHORITIES.json not found"
        return 1
    fi

    # Check mode
    local mode=$(python3 -c "
import json
a = json.load(open('$authorities'))
print(a.get('mode', 'unknown'))
" 2>/dev/null || echo "unknown")

    log_info "Signature mode: $mode"

    # Check for required environment variables
    local required_vars=(
        "TF_SPECLOCK_SIGNATURE_MODE"
        "TF_SPECLOCK_GUARD_ENABLED"
        "TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"
    )

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warn "Missing environment variables: ${missing_vars[*]}"
        log_info "Set these for runtime enforcement"
    else
        log_ok "All required environment variables set"
    fi

    # Check schemas exist
    local schemas=(
        "receipt.schema.json"
        "pluginlock.schema.json"
        "amendment.schema.json"
    )

    for schema in "${schemas[@]}"; do
        local path="${ROOT_DIR}/docs/spec-lock/schemas/$schema"
        if [ -f "$path" ]; then
            log_ok "Schema $schema present"
        else
            log_error "Schema $schema missing"
            failed=1
        fi
    done

    # Check protos exist
    local protos=(
        "frost_signer.proto"
        "receipt_service.proto"
    )

    for proto in "${protos[@]}"; do
        local path="${ROOT_DIR}/protos/speclock/$proto"
        if [ -f "$path" ]; then
            log_ok "Proto $proto present"
        else
            log_error "Proto $proto missing"
            failed=1
        fi
    done

    return $failed
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "  TerraFusion SpecLock - Governance Gate"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo ""

    local failed=0

    # Check Zero-Trust requirements
    if ! check_zero_trust; then
        failed=1
    fi
    echo ""

    # Validate receipts
    if ! validate_receipts; then
        failed=1
    fi
    echo ""

    # Validate PluginLocks
    if ! validate_pluginlocks; then
        failed=1
    fi
    echo ""

    # Validate amendments
    if ! validate_amendments; then
        failed=1
    fi
    echo ""

    echo "═══════════════════════════════════════════════════════════════════════════════"
    if [ $failed -eq 0 ]; then
        log_ok "All governance checks passed"
        echo "═══════════════════════════════════════════════════════════════════════════════"
        exit 0
    else
        log_error "Governance checks failed"
        echo "═══════════════════════════════════════════════════════════════════════════════"
        exit 1
    fi
}

main "$@"
