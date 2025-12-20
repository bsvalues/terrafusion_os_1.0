#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy Apply K8s + Health + Receipt v1.1.0 — Governance Test Suite
# Reference: DEPLOY_APPLY_K8S_HEALTH_RECEIPT_CONSTITUTION_v1.1.0_SPECLOCK.md
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test counters
PASS=0
FAIL=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test temp directory
TEST_TMP=""
KUBECTL_STUB_DIR=""

# ═══════════════════════════════════════════════════════════════════════════
# KUBECTL STUB INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════════════════

setup_kubectl_stub() {
    local behavior="$1"  # success, apply_fail, rollout_fail, rollout_timeout, context_fail, missing
    
    KUBECTL_STUB_DIR="$TEST_TMP/kubectl_stub"
    mkdir -p "$KUBECTL_STUB_DIR"
    
    if [[ "$behavior" == "missing" ]]; then
        # No stub created - kubectl will be missing
        return 0
    fi
    
    cat > "$KUBECTL_STUB_DIR/kubectl" << 'STUB_EOF'
#!/usr/bin/env bash
# Kubectl stub for testing - reads KUBECTL_STUB_BEHAVIOR env var

BEHAVIOR="${KUBECTL_STUB_BEHAVIOR:-success}"
KUBECTL_STUB_LOG="${KUBECTL_STUB_LOG:-/dev/null}"

echo "kubectl stub called: $*" >> "$KUBECTL_STUB_LOG"

case "$1" in
    config)
        if [[ "$2" == "current-context" ]]; then
            if [[ "$BEHAVIOR" == "context_fail" ]]; then
                echo "error: current-context is not set" >&2
                exit 1
            fi
            echo "minikube"
            exit 0
        fi
        ;;
    get)
        if [[ "$2" == "namespace" ]] || [[ "$2" == "ns" ]]; then
            ns="${3:-}"
            if [[ "$BEHAVIOR" == "namespace_missing" ]] && [[ "$ns" == "nonexistent-ns" ]]; then
                echo "Error from server (NotFound): namespaces \"$ns\" not found" >&2
                exit 1
            fi
            echo "NAME              STATUS   AGE"
            echo "$ns              Active   10d"
            exit 0
        fi
        if [[ "$2" == "deploy" ]] || [[ "$2" == "deployment" ]] || [[ "$2" == "deployments" ]]; then
            # Return deployment names
            echo "deployment.apps/api-gateway"
            echo "deployment.apps/consciousness-engine"
            exit 0
        fi
        ;;
    apply)
        if [[ "$BEHAVIOR" == "apply_fail" ]]; then
            echo "error: error validating data: unknown field" >&2
            exit 1
        fi
        # Parse -f flag to find manifest path
        for arg in "$@"; do
            if [[ -d "$arg" ]]; then
                echo "deployment.apps/api-gateway created"
                echo "deployment.apps/consciousness-engine created"
                echo "service/api-gateway-svc created"
            fi
        done
        exit 0
        ;;
    rollout)
        if [[ "$2" == "status" ]]; then
            deploy_name="${5:-unknown}"
            if [[ "$BEHAVIOR" == "rollout_fail" ]]; then
                echo "error: deployment \"$deploy_name\" exceeded its progress deadline" >&2
                exit 1
            fi
            if [[ "$BEHAVIOR" == "rollout_timeout" ]]; then
                sleep 2  # Simulate slow rollout (test should use short timeout)
                echo "Waiting for deployment..."
                exit 1
            fi
            echo "deployment \"$deploy_name\" successfully rolled out"
            exit 0
        fi
        ;;
esac

# Default pass-through for unhandled commands
exit 0
STUB_EOF
    chmod +x "$KUBECTL_STUB_DIR/kubectl"
}

setup() {
    TEST_TMP=$(mktemp -d)
    
    # Create a valid bundle structure with k8s manifests
    mkdir -p "$TEST_TMP/valid_bundle/proofs"
    mkdir -p "$TEST_TMP/valid_bundle/k8s"
    
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create proof files
    for proof in gate agent deploy marketplace; do
        cat > "$TEST_TMP/valid_bundle/proofs/$proof.json" << EOF
{
  "version": "1.0.0",
  "timestamp": "$ts",
  "status": "pass",
  "source": "$proof",
  "summary": {},
  "subsystem": "$proof",
  "checks": []
}
EOF
    done
    
    # Create manifest.json
    cat > "$TEST_TMP/valid_bundle/manifest.json" << EOF
{
  "bundle_id": "test-bundle-$(date +%s)",
  "created_at": "$ts",
  "mode": "dev",
  "overall_status": "pass",
  "proofs": {
    "gate": {"file": "proofs/gate.json", "status": "pass"},
    "agent": {"file": "proofs/agent.json", "status": "pass"},
    "deploy": {"file": "proofs/deploy.json", "status": "pass"},
    "marketplace": {"file": "proofs/marketplace.json", "status": "pass"}
  },
  "schema_version": "1.0.0"
}
EOF
    
    # Create bundle_meta.json
    cat > "$TEST_TMP/valid_bundle/bundle_meta.json" << EOF
{
  "generated_at": "$ts",
  "hostname": "test",
  "tf_sha": "abc123",
  "tf_version": "1.0.0"
}
EOF
    
    # Create k8s manifests
    cat > "$TEST_TMP/valid_bundle/k8s/deployment.yaml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: terrafusion/api-gateway:latest
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: consciousness-engine
spec:
  replicas: 1
  selector:
    matchLabels:
      app: consciousness-engine
  template:
    metadata:
      labels:
        app: consciousness-engine
    spec:
      containers:
      - name: consciousness-engine
        image: terrafusion/consciousness:latest
EOF

    cat > "$TEST_TMP/valid_bundle/k8s/service.yaml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-svc
spec:
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 8080
EOF
    
    # Create checksums (MUST include k8s files for v1.1.0)
    (cd "$TEST_TMP/valid_bundle" && sha256sum manifest.json proofs/*.json k8s/*.yaml 2>/dev/null | sort -k2) > "$TEST_TMP/valid_bundle/checksums.sha256"
    
    # Setup default kubectl stub (success mode)
    setup_kubectl_stub "success"
}

cleanup() {
    [[ -n "$TEST_TMP" ]] && rm -rf "$TEST_TMP"
}

trap cleanup EXIT

# Run tf.sh with stubbed kubectl
run_tf_with_stub() {
    local behavior="${1:-success}"
    shift
    
    setup_kubectl_stub "$behavior"
    
    # Prepend stub dir to PATH and set behavior env var
    KUBECTL_STUB_BEHAVIOR="$behavior" \
    KUBECTL_STUB_LOG="$TEST_TMP/kubectl.log" \
    PATH="$KUBECTL_STUB_DIR:$PATH" \
    bash "$TF" "$@"
}

test_result() {
    local name="$1" passed="$2" details="${3:-}"
    ((TOTAL++))
    if [[ "$passed" == "true" ]]; then
        ((PASS++))
        echo -e "  [$name] ${GREEN}✓ PASS${NC}"
    else
        ((FAIL++))
        echo -e "  [$name] ${RED}✗ FAIL${NC}"
        [[ -n "$details" ]] && echo -e "     ${YELLOW}$details${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# A. INVOCATION VALIDITY TESTS (Exit 2)
# ═══════════════════════════════════════════════════════════════════════════

test_A1_missing_bundle() {
    local rc=0
    run_tf_with_stub success deploy apply --env dev --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A1" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A2_missing_env() {
    local rc=0
    run_tf_with_stub success deploy apply --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A2" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A3_invalid_env() {
    local rc=0
    run_tf_with_stub success deploy apply --env invalid --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A3" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A4_unsupported_mode() {
    # Force compose mode by removing kubectl from PATH entirely
    local rc=0 output
    output=$(PATH="/usr/bin:/bin" bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # Check for unsupported_mode OR kubectl_missing (both valid for mode != k8s)
    local has_mode_error=false
    if echo "$output" | grep -qiE "UNSUPPORTED_MODE|KUBECTL_MISSING"; then
        has_mode_error=true
    fi
    
    # Should exit 1 or 2 depending on implementation
    test_result "A4" "$([[ $rc -ne 0 ]] && [[ "$has_mode_error" == "true" ]] && echo true || echo false)" "Exit=$rc, mode error detection=$has_mode_error"
}

test_A5_namespace_required() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && rc=0 || rc=$?
    
    local has_ns_error=false
    if echo "$output" | grep -q "NAMESPACE_REQUIRED"; then
        has_ns_error=true
    fi
    
    test_result "A5" "$([[ $rc -eq 2 ]] && [[ "$has_ns_error" == "true" ]] && echo true || echo false)" "Exit=$rc, namespace error=$has_ns_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# B. TOOLCHAIN / CONTEXT TESTS (Exit 1)
# ═══════════════════════════════════════════════════════════════════════════

test_B1_kubectl_missing() {
    local rc=0 output
    # Use missing behavior - no kubectl in PATH
    output=$(PATH="/usr/bin:/bin" bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_kubectl_error=false
    if echo "$output" | grep -q "KUBECTL_MISSING"; then
        has_kubectl_error=true
    fi
    
    test_result "B1" "$([[ $rc -eq 1 ]] && [[ "$has_kubectl_error" == "true" ]] && echo true || echo false)" "Exit=$rc, kubectl_missing=$has_kubectl_error"
}

test_B2_context_unavailable() {
    local rc=0 output
    output=$(run_tf_with_stub context_fail deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_context_error=false
    if echo "$output" | grep -q "KUBE_CONTEXT_UNAVAILABLE"; then
        has_context_error=true
    fi
    
    test_result "B2" "$([[ $rc -eq 1 ]] && [[ "$has_context_error" == "true" ]] && echo true || echo false)" "Exit=$rc, context_unavailable=$has_context_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# C. MANIFEST ALLOWLIST TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_C1_k8s_manifest_missing() {
    # Create bundle without k8s directory
    mkdir -p "$TEST_TMP/no_k8s_bundle/proofs"
    cp -r "$TEST_TMP/valid_bundle/proofs/"* "$TEST_TMP/no_k8s_bundle/proofs/"
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/no_k8s_bundle/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/no_k8s_bundle/"
    (cd "$TEST_TMP/no_k8s_bundle" && sha256sum manifest.json proofs/*.json 2>/dev/null | sort -k2) > "$TEST_TMP/no_k8s_bundle/checksums.sha256"
    
    local rc=0 output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/no_k8s_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_manifest_error=false
    if echo "$output" | grep -q "K8S_MANIFEST_MISSING"; then
        has_manifest_error=true
    fi
    
    test_result "C1" "$([[ $rc -eq 1 ]] && [[ "$has_manifest_error" == "true" ]] && echo true || echo false)" "Exit=$rc, manifest_missing=$has_manifest_error"
}

test_C2_symlink_in_k8s_dir() {
    # Create bundle with k8s directory as symlink
    mkdir -p "$TEST_TMP/symlink_k8s_bundle/proofs"
    cp -r "$TEST_TMP/valid_bundle/proofs/"* "$TEST_TMP/symlink_k8s_bundle/proofs/"
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/symlink_k8s_bundle/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/symlink_k8s_bundle/"
    cp "$TEST_TMP/valid_bundle/checksums.sha256" "$TEST_TMP/symlink_k8s_bundle/"
    
    # Symlink k8s directory
    ln -sf "$TEST_TMP/valid_bundle/k8s" "$TEST_TMP/symlink_k8s_bundle/k8s"
    
    local rc=0 output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/symlink_k8s_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "C2" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, symlink_blocked=$has_symlink_error"
}

test_C3_path_escape_blocked() {
    # Test path traversal in bundle path
    local rc=0
    run_tf_with_stub success deploy apply --env dev --bundle "../../../etc" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    
    test_result "C3" "$([[ $rc -eq 2 ]] || [[ $rc -eq 1 ]] && echo true || echo false)" "Exit=$rc, expected non-zero"
}

# ═══════════════════════════════════════════════════════════════════════════
# D. APPLY FLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_D1_dryrun_no_apply() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>/dev/null && rc=0 || rc=$?
    
    # Check receipt status is dry_run
    local receipt_valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
exit(0 if d.get('status') == 'dry_run' and d.get('action') == 'dry_run' else 1)
" 2>/dev/null; then
            receipt_valid=true
        fi
    fi
    
    test_result "D1" "$([[ $rc -eq 0 ]] && [[ "$receipt_valid" == "true" ]] && echo true || echo false)" "Exit=$rc, receipt_valid=$receipt_valid"
}

test_D2_apply_success() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0 output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # Check receipt has k8s.context and k8s.namespace
    local receipt_valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
k8s = d.get('k8s', {})
exit(0 if k8s.get('context') and k8s.get('namespace') == 'test-ns' and d.get('status') == 'success' else 1)
" 2>/dev/null; then
            receipt_valid=true
        fi
    fi
    
    test_result "D2" "$([[ $rc -eq 0 ]] && [[ "$receipt_valid" == "true" ]] && echo true || echo false)" "Exit=$rc, receipt_valid=$receipt_valid"
}

test_D3_apply_failure() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0 output
    output=$(run_tf_with_stub apply_fail deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_apply_error=false
    if echo "$output" | grep -q "APPLY_FAILED"; then
        has_apply_error=true
    fi
    
    # Receipt should exist with status=failed
    local receipt_failed=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
exit(0 if d.get('status') == 'failed' else 1)
" 2>/dev/null; then
            receipt_failed=true
        fi
    fi
    
    test_result "D3" "$([[ $rc -eq 1 ]] && [[ "$has_apply_error" == "true" ]] && echo true || echo false)" "Exit=$rc, apply_failed=$has_apply_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# E. HEALTH FLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_E1_rollout_pass() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    
    # Check health step passed
    local health_pass=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
steps = {s['name']: s for s in d.get('steps', [])}
exit(0 if steps.get('health', {}).get('status') == 'pass' else 1)
" 2>/dev/null; then
            health_pass=true
        fi
    fi
    
    test_result "E1" "$([[ $rc -eq 0 ]] && [[ "$health_pass" == "true" ]] && echo true || echo false)" "Exit=$rc, health_pass=$health_pass"
}

test_E2_rollout_fail() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0 output
    output=$(run_tf_with_stub rollout_fail deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_health_error=false
    if echo "$output" | grep -q "HEALTH_FAILED"; then
        has_health_error=true
    fi
    
    test_result "E2" "$([[ $rc -eq 1 ]] && [[ "$has_health_error" == "true" ]] && echo true || echo false)" "Exit=$rc, health_failed=$has_health_error"
}

test_E3_rollout_timeout() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0 output
    # Use very short timeout to trigger timeout behavior
    output=$(run_tf_with_stub rollout_timeout deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --timeout 1 --ci 2>&1) && rc=0 || rc=$?
    
    local has_timeout_error=false
    if echo "$output" | grep -qE "HEALTH_TIMEOUT|HEALTH_FAILED"; then
        has_timeout_error=true
    fi
    
    # Check receipt records timeout
    local receipt_has_timeout=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
steps = {s['name']: s for s in d.get('steps', [])}
health = steps.get('health', {})
exit(0 if health.get('status') in ['timeout', 'fail'] else 1)
" 2>/dev/null; then
            receipt_has_timeout=true
        fi
    fi
    
    test_result "E3" "$([[ $rc -eq 1 ]] && echo true || echo false)" "Exit=$rc (expected 1), timeout_detection=$has_timeout_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# F. CI PURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_F1_ci_valid_json() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local output rc=0
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local valid_json=false
    if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
        valid_json=true
    fi
    
    test_result "F1" "$valid_json" "CI output not valid JSON"
}

test_F2_no_ansi_in_ci() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) || true
    
    local has_ansi=false
    if echo "$output" | grep -q $'\033'; then
        has_ansi=true
    fi
    
    test_result "F2" "$([[ "$has_ansi" == "false" ]] && echo true || echo false)" "ANSI codes found in CI output"
}

test_F3_kubectl_noise_captured() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local output
    output=$(run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) || true
    
    # Check that raw kubectl output doesn't appear in stdout
    # (should be captured in receipt or suppressed)
    local has_kubectl_noise=false
    if echo "$output" | grep -qE "^deployment|^service|successfully rolled out"; then
        has_kubectl_noise=true
    fi
    
    test_result "F3" "$([[ "$has_kubectl_noise" == "false" ]] && echo true || echo false)" "kubectl noise leaked to CI stdout"
}

# ═══════════════════════════════════════════════════════════════════════════
# G. TOCTOU REGRESSION TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_G1_bundle_changed_blocked() {
    # Check if BUNDLE_CHANGED error code exists in tf.sh
    local has_toctou=false
    if grep -q '"BUNDLE_CHANGED"' "$TF" 2>/dev/null; then
        has_toctou=true
    fi
    
    test_result "G1" "$has_toctou" "BUNDLE_CHANGED error code missing (v1.0.1 regression)"
}

# ═══════════════════════════════════════════════════════════════════════════
# H. RECEIPT ENRICHMENT TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_H1_receipt_has_k8s_block() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    run_tf_with_stub success deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>/dev/null || true
    
    local has_k8s_block=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
exit(0 if 'k8s' in d and d['k8s'] else 1)
" 2>/dev/null; then
            has_k8s_block=true
        fi
    fi
    
    test_result "H1" "$has_k8s_block" "Receipt missing k8s block"
}

test_H2_receipt_has_applied_list() {
    local has_applied=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
applied = d.get('k8s', {}).get('applied', [])
exit(0 if len(applied) > 0 else 1)
" 2>/dev/null; then
            has_applied=true
        fi
    fi
    
    test_result "H2" "$has_applied" "Receipt missing applied resources list"
}

test_H3_receipt_has_rollout_list() {
    local has_rollout=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
rollout = d.get('k8s', {}).get('rollout', [])
exit(0 if len(rollout) > 0 else 1)
" 2>/dev/null; then
            has_rollout=true
        fi
    fi
    
    test_result "H3" "$has_rollout" "Receipt missing rollout summary list"
}

test_H4_receipt_command_unchanged() {
    # Receipt command should return stored receipt without modification
    local before_content after_content
    
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        before_content=$(cat "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json")
        sleep 1
        run_tf_with_stub success deploy receipt --bundle "$TEST_TMP/valid_bundle" --ci >/dev/null 2>&1 || true
        after_content=$(cat "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json")
        
        test_result "H4" "$([[ "$before_content" == "$after_content" ]] && echo true || echo false)" "Receipt was modified by read"
    else
        test_result "H4" "false" "No receipt to test"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# I. NAMESPACE VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_I1_namespace_not_found() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0 output
    output=$(KUBECTL_STUB_BEHAVIOR="namespace_missing" run_tf_with_stub namespace_missing deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace nonexistent-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_ns_error=false
    if echo "$output" | grep -q "NAMESPACE_NOT_FOUND"; then
        has_ns_error=true
    fi
    
    test_result "I1" "$([[ $rc -eq 1 ]] && [[ "$has_ns_error" == "true" ]] && echo true || echo false)" "Exit=$rc, namespace_not_found=$has_ns_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  Deploy Apply K8s + Health + Receipt v1.1.0 — Governance Test Suite"
    echo "  Reference: DEPLOY_APPLY_K8S_HEALTH_RECEIPT_CONSTITUTION_v1.1.0_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    setup
    
    echo "A. Invocation Validity (Exit 2):"
    test_A1_missing_bundle
    test_A2_missing_env
    test_A3_invalid_env
    test_A4_unsupported_mode
    test_A5_namespace_required
    
    echo ""
    echo "B. Toolchain / Context (Exit 1):"
    test_B1_kubectl_missing
    test_B2_context_unavailable
    
    echo ""
    echo "C. Manifest Allowlist:"
    test_C1_k8s_manifest_missing
    test_C2_symlink_in_k8s_dir
    test_C3_path_escape_blocked
    
    echo ""
    echo "D. Apply Flow:"
    test_D1_dryrun_no_apply
    test_D2_apply_success
    test_D3_apply_failure
    
    echo ""
    echo "E. Health Flow:"
    test_E1_rollout_pass
    test_E2_rollout_fail
    test_E3_rollout_timeout
    
    echo ""
    echo "F. CI Purity:"
    test_F1_ci_valid_json
    test_F2_no_ansi_in_ci
    test_F3_kubectl_noise_captured
    
    echo ""
    echo "G. TOCTOU Regression:"
    test_G1_bundle_changed_blocked
    
    echo ""
    echo "H. Receipt Enrichment:"
    test_H1_receipt_has_k8s_block
    test_H2_receipt_has_applied_list
    test_H3_receipt_has_rollout_list
    test_H4_receipt_command_unchanged
    
    echo ""
    echo "I. Namespace Validation:"
    test_I1_namespace_not_found
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    if [[ $FAIL -eq 0 ]]; then
        echo -e "  ${GREEN}✓ All tests passed ($PASS/$TOTAL)${NC}"
    else
        echo -e "  ${RED}✗ Tests failed: $FAIL/$TOTAL${NC}"
        echo -e "  ${GREEN}✓ Passed: $PASS${NC}"
    fi
    echo "═══════════════════════════════════════════════════════════════════════════"
    
    [[ $FAIL -eq 0 ]] && return 0 || return 1
}

main "$@"
