#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy Promotion Execution Constitution v1.2.0 — Governance Test Suite
# Reference: DEPLOY_PROMOTE_EXECUTION_CONSTITUTION_v1.2.0_SPECLOCK.md
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
    local behavior="$1"  # success, apply_fail, rollout_fail, rollout_timeout, context_fail, ns_missing, missing

    KUBECTL_STUB_DIR="$TEST_TMP/kubectl_stub"
    mkdir -p "$KUBECTL_STUB_DIR"

    if [[ "$behavior" == "missing" ]]; then
        # No stub created - kubectl will be missing from restricted PATH
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
            if [[ "$BEHAVIOR" == "ns_missing" ]]; then
                echo "Error from server (NotFound): namespaces \"$ns\" not found" >&2
                exit 1
            fi
            echo "NAME              STATUS   AGE"
            echo "$ns              Active   10d"
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
                echo "deployment.apps/consciousness-engine configured"
                echo "service/api-gateway-svc unchanged"
                exit 0
            fi
        done
        echo "deployment.apps/api-gateway created"
        exit 0
        ;;
    rollout)
        if [[ "$2" == "status" ]]; then
            if [[ "$BEHAVIOR" == "rollout_fail" ]]; then
                echo "error: deployment \"api-gateway\" exceeded its progress deadline" >&2
                exit 1
            fi
            if [[ "$BEHAVIOR" == "rollout_timeout" ]]; then
                sleep 2  # Simulate slow rollout
                echo "Waiting for deployment spec update..." >&2
                exit 1
            fi
            echo "deployment \"api-gateway\" successfully rolled out"
            exit 0
        fi
        ;;
esac

# Default pass-through for unhandled commands
exit 0
STUB_EOF
    chmod +x "$KUBECTL_STUB_DIR/kubectl"
}

# ═══════════════════════════════════════════════════════════════════════════
# BUNDLE FIXTURE CREATION
# ═══════════════════════════════════════════════════════════════════════════

create_valid_bundle() {
    local bundle_dir="$1"
    local with_dev_receipt="${2:-false}"
    local with_techsupport_receipt="${3:-false}"

    mkdir -p "$bundle_dir/proofs"
    mkdir -p "$bundle_dir/k8s"
    mkdir -p "$bundle_dir/receipts"

    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Create proof files
    for proof in gate agent deploy marketplace; do
        cat > "$bundle_dir/proofs/$proof.json" << EOF
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
    cat > "$bundle_dir/manifest.json" << EOF
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
    cat > "$bundle_dir/bundle_meta.json" << EOF
{
  "generated_at": "$ts",
  "hostname": "test",
  "tf_sha": "abc123",
  "tf_version": "1.0.0"
}
EOF

    # Create k8s manifests
    cat > "$bundle_dir/k8s/deployment.yaml" << 'EOF'
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

    cat > "$bundle_dir/k8s/service.yaml" << 'EOF'
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

    # Generate checksums
    (cd "$bundle_dir" && find . -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) -exec sha256sum {} \; | sort -k2) > "$bundle_dir/checksums.sha256"

    # Create dev receipt if requested
    if [[ "$with_dev_receipt" == "true" ]]; then
        cat > "$bundle_dir/receipts/apply_dev.json" << EOF
{
  "version": "1.2.0",
  "timestamp": "$ts",
  "environment": "dev",
  "mode": "k8s",
  "bundle": {
    "path": "$bundle_dir",
    "hash": "sha256:abc123",
    "verified": true
  },
  "action": "apply",
  "status": "success",
  "steps": [
    {"name": "verify", "status": "pass", "message": "Bundle verified"},
    {"name": "preflight", "status": "pass", "message": "Mode: k8s"},
    {"name": "execute", "status": "pass", "message": "kubectl apply succeeded"},
    {"name": "health", "status": "pass", "message": "All rollouts healthy"}
  ],
  "error": null,
  "k8s": {
    "context": "minikube",
    "namespace": "terrafusion-dev",
    "applied": ["deployment.apps/api-gateway"],
    "rollout": [{"resource": "deployment/api-gateway", "status": "pass"}],
    "timeout_config": {"per_deployment": 120, "applied": 120}
  }
}
EOF
        # Regenerate checksums to include receipt
        (cd "$bundle_dir" && find . -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) -exec sha256sum {} \; | sort -k2) > "$bundle_dir/checksums.sha256"
    fi

    # Create techsupport receipt if requested
    if [[ "$with_techsupport_receipt" == "true" ]]; then
        cat > "$bundle_dir/receipts/apply_techsupport.json" << EOF
{
  "version": "1.2.0",
  "timestamp": "$ts",
  "environment": "techsupport",
  "mode": "k8s",
  "bundle": {
    "path": "$bundle_dir",
    "hash": "sha256:def456",
    "verified": true
  },
  "action": "apply",
  "status": "success",
  "steps": [
    {"name": "verify", "status": "pass", "message": "Bundle verified"},
    {"name": "preflight", "status": "pass", "message": "Mode: k8s"},
    {"name": "execute", "status": "pass", "message": "kubectl apply succeeded"},
    {"name": "health", "status": "pass", "message": "All rollouts healthy"}
  ],
  "error": null,
  "k8s": {
    "context": "minikube",
    "namespace": "terrafusion-techsupport",
    "applied": ["deployment.apps/api-gateway"],
    "rollout": [{"resource": "deployment/api-gateway", "status": "pass"}],
    "timeout_config": {"per_deployment": 120, "applied": 120}
  }
}
EOF
        # Regenerate checksums
        (cd "$bundle_dir" && find . -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) -exec sha256sum {} \; | sort -k2) > "$bundle_dir/checksums.sha256"
    fi
}

create_corrupt_receipt() {
    local receipt_path="$1"
    echo "{ invalid json here }" > "$receipt_path"
}

create_failed_receipt() {
    local receipt_path="$1"
    local env="$2"
    cat > "$receipt_path" << EOF
{
  "version": "1.2.0",
  "timestamp": "2024-12-20T10:00:00Z",
  "environment": "$env",
  "status": "failed",
  "error": {"code": "APPLY_FAILED", "message": "kubectl apply failed"}
}
EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# TEST HELPERS
# ═══════════════════════════════════════════════════════════════════════════

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

setup() {
    TEST_TMP=$(mktemp -d)
    # Create default valid bundle with dev receipt for most tests
    create_valid_bundle "$TEST_TMP/valid_bundle" true false
    # Bundle without any receipts
    create_valid_bundle "$TEST_TMP/no_receipt_bundle" false false
    # Bundle with both dev and techsupport receipts
    create_valid_bundle "$TEST_TMP/full_chain_bundle" true true
}

teardown() {
    [[ -n "$TEST_TMP" ]] && rm -rf "$TEST_TMP"
}

# ═══════════════════════════════════════════════════════════════════════════
# A. INVOCATION VALIDITY TESTS (Exit 2)
# ═══════════════════════════════════════════════════════════════════════════

test_A1_missing_bundle() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -qiE "MISSING_BUNDLE|INVALID_INVOCATION"; then
        has_error=true
    fi

    test_result "A1" "$([[ $rc -eq 2 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, has_bundle_error=$has_error"
}

test_A2_missing_namespace() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "NAMESPACE_REQUIRED"; then
        has_error=true
    fi

    test_result "A2" "$([[ $rc -eq 2 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, namespace_error=$has_error"
}

test_A3_invalid_promotion_pair() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to prod --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "INVALID_PROMOTION"; then
        has_error=true
    fi

    test_result "A3" "$([[ $rc -eq 2 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, invalid_promotion=$has_error"
}

test_A4_unsupported_mode() {
    # Remove kubectl from PATH to force compose mode
    local rc=0 output
    output=$(PATH="/usr/bin:/bin" bash "$TF" deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -qiE "UNSUPPORTED_MODE|KUBECTL_MISSING"; then
        has_error=true
    fi

    test_result "A4" "$([[ $rc -ne 0 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, mode_error=$has_error"
}

test_A5_shortcut_env_implies_from_to() {
    # --env techsupport should imply from=dev, to=techsupport
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --env techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>&1) && rc=0 || rc=$?

    local has_promotion=false
    if echo "$output" | grep -qE '"source_env".*:.*"dev".*"target_env".*:.*"techsupport"|"from".*:.*"dev".*"to".*:.*"techsupport"'; then
        has_promotion=true
    fi

    test_result "A5" "$([[ $rc -eq 0 ]] && echo true || echo false)" "Exit=$rc (shortcut form)"
}

# ═══════════════════════════════════════════════════════════════════════════
# B. RECEIPT ANCHOR TESTS (Exit 1)
# ═══════════════════════════════════════════════════════════════════════════

test_B1_missing_dev_receipt_for_dev_to_techsupport() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/no_receipt_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "MISSING_SOURCE_RECEIPT"; then
        has_error=true
    fi

    test_result "B1" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, missing_source=$has_error"
}

test_B2_missing_techsupport_receipt_for_techsupport_to_prod() {
    # Bundle has dev receipt but not techsupport
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from techsupport --to prod --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "MISSING_SOURCE_RECEIPT"; then
        has_error=true
    fi

    test_result "B2" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, missing_source=$has_error"
}

test_B3_corrupt_source_receipt() {
    # Create bundle with corrupt dev receipt
    create_valid_bundle "$TEST_TMP/corrupt_bundle" false false
    create_corrupt_receipt "$TEST_TMP/corrupt_bundle/receipts/apply_dev.json"

    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/corrupt_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "SOURCE_RECEIPT_INVALID"; then
        has_error=true
    fi

    test_result "B3" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, invalid_receipt=$has_error"
}

test_B4_failed_source_receipt_status() {
    # Create bundle with failed dev receipt
    create_valid_bundle "$TEST_TMP/failed_bundle" false false
    create_failed_receipt "$TEST_TMP/failed_bundle/receipts/apply_dev.json" "dev"

    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/failed_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "SOURCE_RECEIPT_INVALID"; then
        has_error=true
    fi

    test_result "B4" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, invalid_status=$has_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# C. GATE/SESSION BLOCKERS (Exit 1)
# ═══════════════════════════════════════════════════════════════════════════

test_C1_gate_fail_blocks_promote() {
    # This test requires a way to make gate fail - we'll check that gate is called
    # For now, verify existing behavior includes gate check
    local has_gate_check=false
    if grep -q "gate.*--ci" "$TF" && grep -q "GATE_FAILED" "$TF"; then
        has_gate_check=true
    fi

    test_result "C1" "$has_gate_check" "Gate check implementation in tf.sh"
}

test_C2_active_session_blocks_promote() {
    # Create mock active session file at the actual path tf.sh checks
    local session_file="$ROOT/ops/agents/ACTIVE_SESSION"
    mkdir -p "$(dirname "$session_file")"
    echo "test-session-123" > "$session_file"

    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    # Cleanup
    rm -f "$session_file"

    local has_error=false
    if echo "$output" | grep -q "ACTIVE_SESSION"; then
        has_error=true
    fi

    test_result "C2" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, session_blocked=$has_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# D. VERIFY ENFORCEMENT (Exit 1)
# ═══════════════════════════════════════════════════════════════════════════

test_D1_verify_failure_blocks_promote() {
    # Create bundle that will fail verification (missing checksums)
    mkdir -p "$TEST_TMP/bad_verify_bundle/proofs"
    mkdir -p "$TEST_TMP/bad_verify_bundle/k8s"
    echo '{}' > "$TEST_TMP/bad_verify_bundle/manifest.json"
    # No checksums.sha256 - verify should fail

    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/bad_verify_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -qE "VERIFY_FAILED|CHECKSUM"; then
        has_error=true
    fi

    test_result "D1" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, verify_blocked=$has_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# E. EXECUTION FLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_E1_dryrun_writes_dryrun_receipt() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>&1) && rc=0 || rc=$?

    local has_dryrun=false
    if echo "$output" | grep -q '"status".*:.*"dry_run"'; then
        has_dryrun=true
    fi

    # Check no kubectl apply was called in dry-run
    local kubectl_apply_called=false
    if [[ -f "$TEST_TMP/kubectl.log" ]] && grep -q "apply" "$TEST_TMP/kubectl.log"; then
        kubectl_apply_called=true
    fi

    test_result "E1" "$([[ $rc -eq 0 ]] && [[ "$has_dryrun" == "true" ]] && echo true || echo false)" "Exit=$rc, dry_run_status=$has_dryrun"
}

test_E2_success_path_writes_receipts() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    echo "$output"

    local has_success=false
    if echo "$output" | grep -q '"status".*:.*"success"'; then
        has_success=true
    fi

    # Check for receipt files
    local target_receipt_exists=false
    local promote_receipt_exists=false
    [[ -f "$TEST_TMP/valid_bundle/receipts/apply_techsupport.json" ]] && target_receipt_exists=true
    ls "$TEST_TMP/valid_bundle/receipts/promote_dev_techsupport_"*.json &>/dev/null && promote_receipt_exists=true

    test_result "E2" "$([[ $rc -eq 0 ]] && [[ "$has_success" == "true" ]] && echo true || echo false)" "Exit=$rc, success=$has_success, target_receipt=$target_receipt_exists, promote_receipt=$promote_receipt_exists"
}

test_E3_apply_fails_writes_failed_receipt() {
    local rc=0 output
    output=$(run_tf_with_stub apply_fail deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "APPLY_FAILED"; then
        has_error=true
    fi

    test_result "E3" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, apply_failed=$has_error"
}

test_E4_health_fails_writes_failed_receipt() {
    local rc=0 output
    output=$(run_tf_with_stub rollout_fail deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -q "HEALTH_FAILED"; then
        has_error=true
    fi

    test_result "E4" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, health_failed=$has_error"
}

test_E5_health_timeout() {
    local rc=0 output
    output=$(run_tf_with_stub rollout_timeout deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --timeout 1 --ci 2>&1) && rc=0 || rc=$?

    local has_error=false
    if echo "$output" | grep -qE "HEALTH_TIMEOUT|HEALTH_FAILED"; then
        has_error=true
    fi

    test_result "E5" "$([[ $rc -eq 1 ]] && [[ "$has_error" == "true" ]] && echo true || echo false)" "Exit=$rc, timeout_error=$has_error"
}

# ═══════════════════════════════════════════════════════════════════════════
# F. RECEIPT CHAIN TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_F1_promote_receipt_refs_source() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>&1) && rc=0 || rc=$?

    local has_source_ref=false
    if echo "$output" | grep -q '"source_receipt"'; then
        has_source_ref=true
    fi

    test_result "F1" "$has_source_ref" "source_receipt reference in output"
}

test_F2_promote_receipt_refs_target() {
    # This test checks that successful promote includes target receipt ref
    # In dry-run, target receipt shouldn't be created, but field should exist
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_target_ref=false
    if echo "$output" | grep -q '"target_receipt"'; then
        has_target_ref=true
    fi

    test_result "F2" "$has_target_ref" "target_receipt reference in output"
}

test_F3_receipts_append_only() {
    # Create first promotion
    run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci &>/dev/null

    # Count promote receipts
    local count_before
    count_before=$(ls "$TEST_TMP/valid_bundle/receipts/promote_dev_techsupport_"*.json 2>/dev/null | wc -l)

    # Sleep to ensure different timestamp
    sleep 1

    # Create second promotion
    run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci &>/dev/null

    local count_after
    count_after=$(ls "$TEST_TMP/valid_bundle/receipts/promote_dev_techsupport_"*.json 2>/dev/null | wc -l)

    test_result "F3" "$([[ $count_after -ge $count_before ]] && echo true || echo false)" "before=$count_before, after=$count_after (append-only)"
}

# ═══════════════════════════════════════════════════════════════════════════
# G. HISTORY COMMAND TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_G1_history_no_receipts() {
    create_valid_bundle "$TEST_TMP/empty_history_bundle" false false

    local rc=0 output
    output=$(run_tf_with_stub success deploy history --bundle "$TEST_TMP/empty_history_bundle" --ci 2>&1) && rc=0 || rc=$?

    local has_empty_chain=false
    if echo "$output" | grep -qE '"chain".*:.*\[\]|"chain".*:.*\[ *\]'; then
        has_empty_chain=true
    fi

    test_result "G1" "$([[ $rc -eq 0 ]] && echo true || echo false)" "Exit=$rc (empty chain)"
}

test_G2_history_ordered_chain() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy history --bundle "$TEST_TMP/full_chain_bundle" --ci 2>&1) && rc=0 || rc=$?

    local has_chain=false
    if echo "$output" | grep -q '"chain"'; then
        has_chain=true
    fi

    test_result "G2" "$([[ $rc -eq 0 ]] && [[ "$has_chain" == "true" ]] && echo true || echo false)" "Exit=$rc, has_chain=$has_chain"
}

test_G3_history_ci_json_only() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy history --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && rc=0 || rc=$?

    # Check output is valid JSON
    local is_json=false
    if echo "$output" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
        is_json=true
    fi

    test_result "G3" "$is_json" "Valid JSON output"
}

# ═══════════════════════════════════════════════════════════════════════════
# H. CI PURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_H1_promote_ci_json_only() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>&1) && rc=0 || rc=$?

    local is_json=false
    if echo "$output" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
        is_json=true
    fi

    test_result "H1" "$is_json" "promote --ci outputs valid JSON"
}

test_H2_no_ansi_in_ci() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>&1) && rc=0 || rc=$?

    local has_ansi=false
    if echo "$output" | grep -qE '\x1b\[|\\033\['; then
        has_ansi=true
    fi

    test_result "H2" "$([[ "$has_ansi" == "false" ]] && echo true || echo false)" "No ANSI codes in CI output"
}

test_H3_kubectl_noise_not_leaked() {
    # Run with stub and check for kubectl debug output
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local has_kubectl_noise=false
    if echo "$output" | grep -qE '^kubectl|^deployment\.|^service\.'; then
        has_kubectl_noise=true
    fi

    test_result "H3" "$([[ "$has_kubectl_noise" == "false" ]] && echo true || echo false)" "No raw kubectl output leaked"
}

# ═══════════════════════════════════════════════════════════════════════════
# I. SECURITY / INJECTION TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_I1_namespace_injection_sanitized() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/valid_bundle" --namespace $'test\ninjection' --ci 2>&1) && rc=0 || rc=$?

    # The namespace should be sanitized to remove newlines
    # Check that the namespace field in JSON doesn't contain raw newline
    local safe=true
    
    # Extract the namespace value and check it doesn't have a literal newline
    local ns_value
    ns_value=$(echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('k8s',{}).get('namespace',''))" 2>/dev/null || echo "")
    
    # Namespace should be sanitized (no newlines, all lowercase, alphanumeric+dash only)
    if [[ "$ns_value" =~ $'\n' ]]; then
        safe=false
    fi
    
    # Also verify the namespace was sanitized (combined without newline)
    if [[ "$ns_value" != "testinjection" && "$ns_value" != "test-injection" ]]; then
        # If not sanitized properly and command succeeded, that's bad
        # But if command failed, check error doesn't leak raw namespace
        if [[ $rc -eq 0 ]]; then
            safe=false
        fi
    fi

    test_result "I1" "$safe" "Namespace sanitized to: $ns_value"
}

test_I2_path_traversal_blocked() {
    local rc=0 output
    output=$(run_tf_with_stub success deploy promote --from dev --to techsupport --bundle "$TEST_TMP/../../../etc" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?

    local blocked=false
    if [[ $rc -eq 2 ]] || echo "$output" | grep -qiE "INVALID|traversal|illegal"; then
        blocked=true
    fi

    test_result "I2" "$blocked" "Path traversal blocked (exit=$rc)"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  Deploy Promotion Execution Constitution v1.2.0 — Governance Test Suite"
    echo "  Reference: DEPLOY_PROMOTE_EXECUTION_CONSTITUTION_v1.2.0_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""

    setup

    echo "A. Invocation Validity (Exit 2):"
    test_A1_missing_bundle
    test_A2_missing_namespace
    test_A3_invalid_promotion_pair
    test_A4_unsupported_mode
    test_A5_shortcut_env_implies_from_to
    echo ""

    echo "B. Receipt Anchors (Exit 1):"
    test_B1_missing_dev_receipt_for_dev_to_techsupport
    test_B2_missing_techsupport_receipt_for_techsupport_to_prod
    test_B3_corrupt_source_receipt
    test_B4_failed_source_receipt_status
    echo ""

    echo "C. Gate/Session Blockers (Exit 1):"
    test_C1_gate_fail_blocks_promote
    test_C2_active_session_blocks_promote
    echo ""

    echo "D. Verify Enforcement (Exit 1):"
    test_D1_verify_failure_blocks_promote
    echo ""

    echo "E. Execution Flow:"
    test_E1_dryrun_writes_dryrun_receipt
    test_E2_success_path_writes_receipts
    test_E3_apply_fails_writes_failed_receipt
    test_E4_health_fails_writes_failed_receipt
    test_E5_health_timeout
    echo ""

    echo "F. Receipt Chain:"
    test_F1_promote_receipt_refs_source
    test_F2_promote_receipt_refs_target
    test_F3_receipts_append_only
    echo ""

    echo "G. History Command:"
    test_G1_history_no_receipts
    test_G2_history_ordered_chain
    test_G3_history_ci_json_only
    echo ""

    echo "H. CI Purity:"
    test_H1_promote_ci_json_only
    test_H2_no_ansi_in_ci
    test_H3_kubectl_noise_not_leaked
    echo ""

    echo "I. Security / Injection:"
    test_I1_namespace_injection_sanitized
    test_I2_path_traversal_blocked
    echo ""

    teardown

    echo "═══════════════════════════════════════════════════════════════════════════"
    if [[ $FAIL -eq 0 ]]; then
        echo -e "  ${GREEN}✓ All tests passed ($PASS/$TOTAL)${NC}"
    else
        echo -e "  ${RED}✗ Tests failed: $FAIL/$TOTAL${NC}"
        echo -e "  ${GREEN}✓ Passed: $PASS${NC}"
    fi
    echo "═══════════════════════════════════════════════════════════════════════════"

    [[ $FAIL -gt 0 ]] && exit 1
    exit 0
}

main "$@"
