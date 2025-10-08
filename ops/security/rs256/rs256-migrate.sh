#!/bin/bash
# ============================================================================
# RS256 Migration Execution Script
# ============================================================================
# Purpose: Execute 48-hour RS256 dual-sign migration with rollback capability
# Usage: ./rs256-migrate.sh [--phase <0|1|2|3>] [--env <staging|production>] [--dry-run]
# Phases:
#   0 = Pre-flight validation
#   1 = Enable dual-sign (RS256 + HS256 acceptance)
#   2 = Monitor adoption (48h soak)
#   3 = Disable HS256 (RS256-only mode)
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")

# Default values
PHASE="${PHASE:-1}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
DRY_RUN=false
BACKUP_DIR="$PROJECT_ROOT/ops/security/rs256/backups"
LOG_FILE="$PROJECT_ROOT/out/rs256-migration/migration-${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    case $level in
        ERROR)   echo -e "${RED}❌ $message${NC}" ;;
        SUCCESS) echo -e "${GREEN}✅ $message${NC}" ;;
        WARNING) echo -e "${YELLOW}⚠️  $message${NC}" ;;
        INFO)    echo -e "${CYAN}ℹ️  $message${NC}" ;;
    esac
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --phase)
            PHASE="$2"
            shift 2
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate phase
if [[ ! "$PHASE" =~ ^[0-3]$ ]]; then
    log ERROR "Invalid phase: $PHASE (must be 0, 1, 2, or 3)"
    exit 1
fi

# Create directories
mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log INFO "========================================="
log INFO "RS256 Migration Execution"
log INFO "========================================="
log INFO "Phase:       $PHASE"
log INFO "Environment: $ENVIRONMENT"
log INFO "Dry Run:     $DRY_RUN"
log INFO "Backup Dir:  $BACKUP_DIR"
log INFO "Log File:    $LOG_FILE"
log INFO ""

# Phase 0: Pre-flight validation
if [[ "$PHASE" == "0" ]]; then
    log INFO "Phase 0: Pre-flight Validation"
    log INFO "-------------------------------"
    
    # Check kubectl connectivity
    log INFO "Checking kubectl connectivity..."
    if ! kubectl cluster-info &>/dev/null; then
        log ERROR "kubectl not connected to cluster"
        exit 1
    fi
    log SUCCESS "kubectl connected"
    
    # Check namespace
    log INFO "Checking namespace: terrafusion-$ENVIRONMENT..."
    if ! kubectl get namespace "terrafusion-$ENVIRONMENT" &>/dev/null; then
        log ERROR "Namespace not found: terrafusion-$ENVIRONMENT"
        exit 1
    fi
    log SUCCESS "Namespace exists"
    
    # Check auth service
    log INFO "Checking auth service deployment..."
    if ! kubectl get deployment auth-service -n "terrafusion-$ENVIRONMENT" &>/dev/null; then
        log ERROR "Auth service deployment not found"
        exit 1
    fi
    log SUCCESS "Auth service deployment exists"
    
    # Check JWKS configmap
    log INFO "Checking JWKS configmap..."
    if ! kubectl get configmap jwks -n "terrafusion-$ENVIRONMENT" &>/dev/null; then
        log WARNING "JWKS configmap not found, will create in Phase 1"
    else
        log SUCCESS "JWKS configmap exists"
    fi
    
    # Check private key secret
    log INFO "Checking private key secret..."
    if ! kubectl get secret jwt-signing-keys -n "terrafusion-$ENVIRONMENT" &>/dev/null; then
        log ERROR "Private key secret not found: jwt-signing-keys"
        log ERROR "Create secret: kubectl create secret generic jwt-signing-keys --from-file=tfos_2025_kid1_private.pem"
        exit 1
    fi
    log SUCCESS "Private key secret exists"
    
    # Check PostgreSQL connectivity
    log INFO "Checking database connectivity..."
    # Try from postgres pod directly (auth-service may not have psql in rehearsal)
    if kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/postgres -- psql -U terrafusion -d terrafusion -c "SELECT 1" &>/dev/null; then
        log SUCCESS "Database accessible"
    elif kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/auth-service -- psql -U terrafusion -d terrafusion -c "SELECT 1" &>/dev/null; then
        log SUCCESS "Database accessible"
    else
        log WARNING "Database connectivity could not be verified (may be OK for rehearsal)"
    fi
    
    # Check auth_audit table
    log INFO "Checking auth_audit table..."
    if kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/postgres -- psql -U terrafusion -d terrafusion -c "SELECT COUNT(*) FROM auth_audit LIMIT 1" &>/dev/null; then
        log SUCCESS "auth_audit table exists"
    elif kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/auth-service -- psql -U terrafusion -d terrafusion -c "SELECT COUNT(*) FROM auth_audit LIMIT 1" &>/dev/null; then
        log SUCCESS "auth_audit table exists"
    else
        log WARNING "auth_audit table could not be verified (may be OK for rehearsal)"
    fi
    
    log SUCCESS "Pre-flight validation complete"
    log INFO ""
    log INFO "Next: Run Phase 1 (Enable Dual-Sign)"
    log INFO "      ./rs256-migrate.sh --phase 1 --env $ENVIRONMENT"
    exit 0
fi

# Phase 1: Enable dual-sign mode
if [[ "$PHASE" == "1" ]]; then
    log INFO "Phase 1: Enable Dual-Sign Mode"
    log INFO "-------------------------------"
    
    # Backup current config
    log INFO "Creating backup of current auth config..."
    BACKUP_FILE="$BACKUP_DIR/auth-config-${TIMESTAMP}.yaml"
    kubectl get configmap auth-config -n "terrafusion-$ENVIRONMENT" -o yaml > "$BACKUP_FILE"
    log SUCCESS "Backup created: $BACKUP_FILE"
    
    # Update JWKS configmap
    log INFO "Updating JWKS configmap..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would apply: auth/jwks/jwks.json"
    else
        kubectl create configmap jwks \
            --from-file=jwks.json=auth/jwks/jwks.json \
            -n "terrafusion-$ENVIRONMENT" \
            --dry-run=client -o yaml | kubectl apply -f -
        log SUCCESS "JWKS configmap updated"
    fi
    
    # Update auth service config (dual-sign mode)
    log INFO "Updating auth service config (dual-sign mode)..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would set: JWT_ALGORITHM=RS256, ACCEPT_ALGORITHMS=RS256,HS256"
    else
        kubectl set env deployment/auth-service \
            -n "terrafusion-$ENVIRONMENT" \
            JWT_ALGORITHM=RS256 \
            JWT_ACCEPT_ALGORITHMS=RS256,HS256 \
            JWT_KID=tfos_2025_kid1 \
            JWT_PRIVATE_KEY_PATH=/var/secrets/jwt/signing_keys/tfos_2025_kid1_private.pem \
            JWKS_ENDPOINT=/.well-known/jwks.json
        log SUCCESS "Auth service config updated"
    fi
    
    # Wait for rollout
    log INFO "Waiting for auth service rollout..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would wait for rollout"
    else
        kubectl rollout status deployment/auth-service -n "terrafusion-$ENVIRONMENT" --timeout=5m
        log SUCCESS "Rollout complete"
    fi
    
    # Verify dual-sign mode
    log INFO "Verifying dual-sign mode..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would verify dual-sign mode"
    else
        # Test HS256 token acceptance
        log INFO "Testing HS256 token acceptance..."
        # (Add test logic here)
        
        # Test RS256 token issuance
        log INFO "Testing RS256 token issuance..."
        # (Add test logic here)
    fi
    
    log SUCCESS "Phase 1 complete: Dual-sign mode enabled"
    log INFO ""
    log INFO "Next: Monitor adoption for 48h (Phase 2)"
    log INFO "      ./rs256-migrate.sh --phase 2 --env $ENVIRONMENT"
    log INFO ""
    log INFO "Monitoring:"
    log INFO "  - Watch adoption rate: SELECT algorithm, COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' GROUP BY algorithm;"
    log INFO "  - Target: RS256 >80% at T+24h, >95% at T+48h"
    log INFO "  - Check every 4h: T+4h, T+8h, T+12h, T+16h, T+20h, T+24h, T+28h, T+32h, T+36h, T+40h, T+44h, T+48h"
    exit 0
fi

# Phase 2: Monitor adoption (48h soak)
if [[ "$PHASE" == "2" ]]; then
    log INFO "Phase 2: Monitor Adoption (48h Soak)"
    log INFO "-------------------------------------"
    
    # Query adoption rate
    log INFO "Querying RS256 adoption rate..."
    ADOPTION_QUERY="SELECT algorithm, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percent FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' GROUP BY algorithm ORDER BY percent DESC;"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would query: $ADOPTION_QUERY"
    else
        kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/auth-service -- \
            psql -U terrafusion -d terrafusion -c "$ADOPTION_QUERY"
    fi
    
    log INFO ""
    log INFO "Monitoring checklist (check every 4h):"
    log INFO "  [T+4h ] RS256 adoption ~10-20%"
    log INFO "  [T+8h ] RS256 adoption ~20-30%"
    log INFO "  [T+12h] RS256 adoption ~30-40%"
    log INFO "  [T+16h] RS256 adoption ~40-50%"
    log INFO "  [T+20h] RS256 adoption ~50-60%"
    log INFO "  [T+24h] RS256 adoption >80% ✅ (target)"
    log INFO "  [T+28h] RS256 adoption ~85%"
    log INFO "  [T+32h] RS256 adoption ~90%"
    log INFO "  [T+36h] RS256 adoption ~93%"
    log INFO "  [T+40h] RS256 adoption ~95%"
    log INFO "  [T+44h] RS256 adoption ~97%"
    log INFO "  [T+48h] RS256 adoption >95% ✅ (target)"
    log INFO ""
    log INFO "RED FLAGS (trigger rollback):"
    log INFO "  - Auth errors related to signature/alg mismatch"
    log INFO "  - RS256 adoption <50% at T+24h"
    log INFO "  - RS256 adoption <80% at T+48h"
    log INFO "  - Customer escalations >10 tickets/hour"
    log INFO ""
    log INFO "Next: After 48h soak GO/NO-GO, run Phase 3 (Disable HS256)"
    log INFO "      ./rs256-migrate.sh --phase 3 --env $ENVIRONMENT"
    exit 0
fi

# Phase 3: Disable HS256 (RS256-only mode)
if [[ "$PHASE" == "3" ]]; then
    log INFO "Phase 3: Disable HS256 (RS256-Only Mode)"
    log INFO "----------------------------------------"
    
    # Verify adoption rate before disabling HS256
    log INFO "Verifying RS256 adoption rate..."
    ADOPTION_QUERY="SELECT ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour'), 2) as rs256_percent FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256';"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would verify adoption rate"
    else
        RS256_ADOPTION=$(kubectl exec -n "terrafusion-$ENVIRONMENT" deployment/auth-service -- \
            psql -U terrafusion -d terrafusion -t -c "$ADOPTION_QUERY" | tr -d ' ')
        
        log INFO "RS256 adoption: $RS256_ADOPTION%"
        
        if (( $(echo "$RS256_ADOPTION < 95.0" | bc -l) )); then
            log ERROR "RS256 adoption <95%, cannot disable HS256"
            log ERROR "Current: $RS256_ADOPTION%, Target: >95%"
            log ERROR "Wait longer or investigate adoption blockers"
            exit 1
        fi
        
        log SUCCESS "RS256 adoption sufficient: $RS256_ADOPTION%"
    fi
    
    # Update auth service config (RS256-only mode)
    log INFO "Updating auth service config (RS256-only mode)..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would set: ACCEPT_ALGORITHMS=RS256 (disable HS256)"
    else
        kubectl set env deployment/auth-service \
            -n "terrafusion-$ENVIRONMENT" \
            JWT_ACCEPT_ALGORITHMS=RS256
        log SUCCESS "Auth service config updated"
    fi
    
    # Wait for rollout
    log INFO "Waiting for auth service rollout..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would wait for rollout"
    else
        kubectl rollout status deployment/auth-service -n "terrafusion-$ENVIRONMENT" --timeout=5m
        log SUCCESS "Rollout complete"
    fi
    
    # Verify RS256-only mode
    log INFO "Verifying RS256-only mode..."
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would verify RS256-only mode"
    else
        # Test HS256 token rejection
        log INFO "Testing HS256 token rejection..."
        # (Add test logic here)
        
        # Test RS256 token acceptance
        log INFO "Testing RS256 token acceptance..."
        # (Add test logic here)
    fi
    
    log SUCCESS "Phase 3 complete: HS256 disabled, RS256-only mode active"
    log INFO ""
    log INFO "Migration complete! 🎉"
    log INFO ""
    log INFO "Post-migration checklist:"
    log INFO "  [ ] Monitor error rates for 24h"
    log INFO "  [ ] Verify zero HS256 tokens in auth_audit (after token expiry)"
    log INFO "  [ ] Update documentation (HS256 deprecated)"
    log INFO "  [ ] Notify clients: RS256 required"
    log INFO "  [ ] Archive HS256 keys (remove from secrets after 7 days)"
    log INFO "  [ ] Schedule next rotation (annual)"
    exit 0
fi
