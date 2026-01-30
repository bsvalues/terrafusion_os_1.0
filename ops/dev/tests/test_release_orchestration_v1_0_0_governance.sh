#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Release Orchestration v1.0.0 Governance Tests
# ═══════════════════════════════════════════════════════════════════════════
#
# SpecLock: ops/release/RELEASE_ORCHESTRATION_CONSTITUTION_v1.0.0_SPECLOCK.md
#
# Test Groups:
#   A. Invocation Validity (4 tests)
#   B. Prepare Command (4 tests)
#   C. Deploy Command (4 tests)
#   D. Promote Command (4 tests)
#   E. Audit Command (4 tests)
#   F. Status Command (4 tests)
#
# Expected: RED baseline until Phase 3 (Builder) implements wrappers
# ═══════════════════════════════════════════════════════════════════════════

set -u  # Removed -e to allow test failures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF="$SCRIPT_DIR/../tf.sh"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo "  [$1] ✓ PASS"
    ((PASS_COUNT++))
}

fail() {
    echo "  [$1] ✗ FAIL: $2"
    ((FAIL_COUNT++))
}

# ═══════════════════════════════════════════════════════════════════════════
# Helper: Create minimal valid bundle for testing
# ═══════════════════════════════════════════════════════════════════════════
create_test_bundle() {
    local bundle_dir="$1"
    mkdir -p "$bundle_dir/proofs" "$bundle_dir/receipts" "$bundle_dir/k8s"
    
    # Minimal manifest
    cat > "$bundle_dir/manifest.json" << 'EOF'
{"name":"test-bundle","version":"1.0.0","created":"2024-12-22T10:00:00Z"}
EOF
    
    # Complete proofs (must have version, timestamp, status, source, summary)
    cat > "$bundle_dir/proofs/gate.json" << 'EOF'
{"version":"1.0.0","status":"pass","timestamp":"2024-12-22T10:00:00Z","source":"tf gate","summary":"All checks passed"}
EOF
    cat > "$bundle_dir/proofs/agent.json" << 'EOF'
{"version":"1.0.0","status":"pass","timestamp":"2024-12-22T10:00:00Z","source":"tf agent proof","summary":"No active sessions"}
EOF
    cat > "$bundle_dir/proofs/deploy.json" << 'EOF'
{"version":"1.0.0","status":"pass","timestamp":"2024-12-22T10:00:00Z","source":"tf deploy proof","summary":"Ready to deploy"}
EOF
    cat > "$bundle_dir/proofs/marketplace.json" << 'EOF'
{"version":"1.0.0","status":"pass","timestamp":"2024-12-22T10:00:00Z","source":"tf marketplace proof","summary":"Registry valid"}
EOF
    
    # Generate checksums
    (cd "$bundle_dir" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
}

create_bundle_with_receipts() {
    local bundle_dir="$1"
    create_test_bundle "$bundle_dir"
    
    # Add apply receipt
    cat > "$bundle_dir/receipts/apply_dev.json" << 'EOF'
{"version":"1.2.0","timestamp":"2024-12-22T08:00:00Z","environment":"dev","status":"success"}
EOF
    
    # Update checksums
    (cd "$bundle_dir" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Release Orchestration v1.0.0 Governance Tests"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# A. Invocation Validity
# ═══════════════════════════════════════════════════════════════════════════
echo "A. Invocation Validity:"

# A1: tf release prepare without --out → exit 2
output=$(bash "$TF" release prepare 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass "A1"
else
    fail "A1" "Expected exit 2, got $rc"
fi

# A2: tf release deploy without --bundle → exit 2
output=$(bash "$TF" release deploy --env dev 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass "A2"
else
    fail "A2" "Expected exit 2, got $rc"
fi

# A3: tf release promote without --to → exit 2
output=$(bash "$TF" release promote --bundle "$TMPDIR/fake" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass "A3"
else
    fail "A3" "Expected exit 2, got $rc"
fi

# A4: tf release audit --help → exit 0
output=$(bash "$TF" release audit --help 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass "A4"
else
    fail "A4" "Expected exit 0, got $rc"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# B. Prepare Command
# ═══════════════════════════════════════════════════════════════════════════
echo "B. Prepare Command:"

# B1: Prepare with valid args → exit 0, bundle exists
rm -rf "$TMPDIR/b1-bundle" 2>/dev/null || true
output=$(bash "$TF" release prepare --out "$TMPDIR/b1-bundle" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]] && [[ -d "$TMPDIR/b1-bundle" ]]; then
    pass "B1"
else
    fail "B1" "Expected exit 0 and bundle dir, got rc=$rc"
fi

# B2: Prepare with existing dir no --force → exit 1
mkdir -p "$TMPDIR/b2-existing"
output=$(bash "$TF" release prepare --out "$TMPDIR/b2-existing" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass "B2"
else
    fail "B2" "Expected exit 1, got $rc"
fi

# B3: Prepare + verify passes → JSON shows both steps pass
rm -rf "$TMPDIR/b3-bundle" 2>/dev/null || true
output=$(bash "$TF" release prepare --out "$TMPDIR/b3-bundle" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]] && echo "$output" | grep -q '"operation":"prepare"'; then
    if echo "$output" | grep -q '"name":"bundle"' && echo "$output" | grep -q '"name":"verify"'; then
        pass "B3"
    else
        fail "B3" "Missing steps in JSON output"
    fi
else
    fail "B3" "Expected success with prepare operation, got rc=$rc"
fi

# B4: Prepare with invalid mode → exit 2
output=$(bash "$TF" release prepare --out "$TMPDIR/b4-bundle" --mode invalid 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass "B4"
else
    fail "B4" "Expected exit 2, got $rc"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# C. Deploy Command
# ═══════════════════════════════════════════════════════════════════════════
echo "C. Deploy Command:"

# C1: Deploy with valid bundle → verify passes (apply may fail without K8s)
create_test_bundle "$TMPDIR/c1-bundle"
output=$(bash "$TF" release deploy --bundle "$TMPDIR/c1-bundle" --env dev --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
# Accept if verify step passed (even if apply failed due to no K8s)
if [[ $rc -eq 0 ]] || echo "$output" | grep -qE '"verify".*"pass"|"status":"pass"'; then
    pass "C1"
else
    fail "C1" "Expected verify to pass, got rc=$rc"
fi

# C2: Deploy with invalid bundle → exit 1, no apply called
mkdir -p "$TMPDIR/c2-invalid"
echo "corrupted" > "$TMPDIR/c2-invalid/manifest.json"
output=$(bash "$TF" release deploy --bundle "$TMPDIR/c2-invalid" --env dev --namespace test --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass "C2"
else
    fail "C2" "Expected exit 1, got $rc"
fi

# C3: Deploy --dry-run → valid JSON (K8s may not be available in test env)
create_test_bundle "$TMPDIR/c3-bundle"
output=$(bash "$TF" release deploy --bundle "$TMPDIR/c3-bundle" --env dev --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
# Accept if verify passed - apply result depends on K8s availability
if echo "$output" | grep -qE '"verify".*"pass"|Bundle verified'; then
    pass "C3"
else
    fail "C3" "Expected verify to pass in output"
fi

# C4: Deploy --ci → valid JSON output
create_test_bundle "$TMPDIR/c4-bundle"
output=$(bash "$TF" release deploy --bundle "$TMPDIR/c4-bundle" --env dev --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass "C4"
else
    fail "C4" "Invalid JSON output"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# D. Promote Command
# ═══════════════════════════════════════════════════════════════════════════
echo "D. Promote Command:"

# D1: Promote --to techsupport → infers --from dev
create_bundle_with_receipts "$TMPDIR/d1-bundle"
# Add promote receipt for chain
src_hash=$(sha256sum "$TMPDIR/d1-bundle/receipts/apply_dev.json" | awk '{print "sha256:"$1}')
cat > "$TMPDIR/d1-bundle/receipts/promote_dev_techsupport_20241222T090000Z.json" << EOF
{"version":"1.2.0","timestamp":"2024-12-22T09:00:00Z","source_receipt":{"path":"receipts/apply_dev.json","hash":"$src_hash"},"status":"success"}
EOF
(cd "$TMPDIR/d1-bundle" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
output=$(bash "$TF" release promote --bundle "$TMPDIR/d1-bundle" --to techsupport --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
# Accept if it shows from_env=dev
if echo "$output" | grep -qE '"from_env".*:.*"dev"|--from dev'; then
    pass "D1"
else
    fail "D1" "Expected from_env=dev inference, output: $output"
fi

# D2: Promote --to prod → infers --from techsupport
create_bundle_with_receipts "$TMPDIR/d2-bundle"
output=$(bash "$TF" release promote --bundle "$TMPDIR/d2-bundle" --to prod --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE '"from_env".*:.*"techsupport"|--from techsupport'; then
    pass "D2"
else
    fail "D2" "Expected from_env=techsupport inference"
fi

# D3: Promote without chain → exit 1 (--require-chain enforced)
create_test_bundle "$TMPDIR/d3-bundle"  # No receipts
output=$(bash "$TF" release promote --bundle "$TMPDIR/d3-bundle" --to techsupport --namespace test --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]] && echo "$output" | grep -qE 'MISSING_CHAIN|chain|receipt'; then
    pass "D3"
else
    fail "D3" "Expected chain failure, got rc=$rc"
fi

# D4: Promote with --skip-freshness → freshness check skipped
create_bundle_with_receipts "$TMPDIR/d4-bundle"
output=$(bash "$TF" release promote --bundle "$TMPDIR/d4-bundle" --to techsupport --namespace test --skip-freshness --dry-run --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE '"require_freshness".*:.*false|freshness.*skip'; then
    pass "D4"
else
    fail "D4" "Expected require_freshness=false"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# E. Audit Command
# ═══════════════════════════════════════════════════════════════════════════
echo "E. Audit Command:"

# E1: Audit valid bundle → all sections present
create_bundle_with_receipts "$TMPDIR/e1-bundle"
output=$(bash "$TF" release audit --bundle "$TMPDIR/e1-bundle" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -q '"integrity"' && echo "$output" | grep -q '"chain"' && echo "$output" | grep -q '"policy"'; then
    pass "E1"
else
    fail "E1" "Missing audit sections"
fi

# E2: Audit with chain → chain.count > 0
create_bundle_with_receipts "$TMPDIR/e2-bundle"
output=$(bash "$TF" release audit --bundle "$TMPDIR/e2-bundle" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE '"count".*:.*[1-9]|receipts.*found'; then
    pass "E2"
else
    fail "E2" "Expected chain count > 0"
fi

# E3: Audit invalid bundle → exit 1
mkdir -p "$TMPDIR/e3-invalid"
echo "bad" > "$TMPDIR/e3-invalid/manifest.json"
output=$(bash "$TF" release audit --bundle "$TMPDIR/e3-invalid" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass "E3"
else
    fail "E3" "Expected exit 1, got $rc"
fi

# E4: Audit --ci → valid JSON, no ANSI
create_bundle_with_receipts "$TMPDIR/e4-bundle"
output=$(bash "$TF" release audit --bundle "$TMPDIR/e4-bundle" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    # Check no ANSI codes
    if echo "$output" | grep -qE $'\033\['; then
        fail "E4" "ANSI codes in output"
    else
        pass "E4"
    fi
else
    fail "E4" "Invalid JSON output"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# F. Status Command
# ═══════════════════════════════════════════════════════════════════════════
echo "F. Status Command:"

# F1: Status healthy bundle → exit 0, status=healthy
create_bundle_with_receipts "$TMPDIR/f1-bundle"
output=$(bash "$TF" release status --bundle "$TMPDIR/f1-bundle" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]] && echo "$output" | grep -q '"status":"healthy"\|"healthy"'; then
    pass "F1"
else
    fail "F1" "Expected healthy status, got rc=$rc"
fi

# F2: Status corrupt bundle → exit 1, status=unhealthy
mkdir -p "$TMPDIR/f2-corrupt"
echo "corrupt" > "$TMPDIR/f2-corrupt/manifest.json"
output=$(bash "$TF" release status --bundle "$TMPDIR/f2-corrupt" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]] && echo "$output" | grep -qE '"status":"unhealthy"|"unhealthy"|fail'; then
    pass "F2"
else
    fail "F2" "Expected unhealthy status, got rc=$rc"
fi

# F3: Status bundle no receipts → latest_receipt=null
create_test_bundle "$TMPDIR/f3-bundle"  # No receipts
output=$(bash "$TF" release status --bundle "$TMPDIR/f3-bundle" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE '"latest_receipt".*:.*null|no.*receipt'; then
    pass "F3"
else
    fail "F3" "Expected latest_receipt=null"
fi

# F4: Status --ci → valid JSON
create_bundle_with_receipts "$TMPDIR/f4-bundle"
output=$(bash "$TF" release status --bundle "$TMPDIR/f4-bundle" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass "F4"
else
    fail "F4" "Invalid JSON output"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $FAIL_COUNT -eq 0 ]]; then
    echo "  ✓ All tests passed ($PASS_COUNT/$TOTAL)"
else
    echo "  ✗ Tests failed: $FAIL_COUNT/$TOTAL"
    echo "    (Expected: RED baseline until Phase 3 implements wrappers)"
fi
echo "═══════════════════════════════════════════════════════════════════════════"

exit $FAIL_COUNT
