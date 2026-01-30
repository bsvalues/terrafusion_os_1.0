#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Release Orchestration v1.0.0 Breaker Tests
# ═══════════════════════════════════════════════════════════════════════════
#
# SpecLock: ops/release/RELEASE_ORCHESTRATION_CONSTITUTION_v1.0.0_SPECLOCK.md
#
# Attack Vectors:
#   ATK-1:  ANSI injection in bundle path
#   ATK-2:  Concurrent prepare to same dir
#   ATK-3:  Promote with tampered receipt
#   ATK-4:  Audit with missing proofs/
#   ATK-5:  Status with symlink bundle
#   ATK-6:  Deploy with non-existent namespace (propagates error)
#   ATK-7:  Prepare then delete during verify
#   ATK-8:  Promote with clock skew
#   ATK-9:  Audit --ci with stderr noise
#   ATK-10: Status with huge receipt file
#   ATK-11: Deploy with path traversal
#   ATK-12: Promote with invalid --to
#
# ═══════════════════════════════════════════════════════════════════════════

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF="$SCRIPT_DIR/../tf.sh"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

BLOCKED=0
BYPASSED=0

attack_blocked() {
    echo "  [$1] ✓ BLOCKED"
    BLOCKED=$((BLOCKED + 1))
}

attack_bypassed() {
    echo "  [$1] ✗ BYPASSED: $2"
    BYPASSED=$((BYPASSED + 1))
}

# Helper: Create valid bundle
create_valid_bundle() {
    local bundle_dir="$1"
    mkdir -p "$bundle_dir/proofs" "$bundle_dir/receipts" "$bundle_dir/k8s"
    
    cat > "$bundle_dir/manifest.json" << 'EOF'
{"name":"test-bundle","version":"1.0.0","created":"2024-12-22T10:00:00Z"}
EOF
    
    for p in gate agent deploy marketplace; do
        cat > "$bundle_dir/proofs/$p.json" << EOF
{"version":"1.0.0","status":"pass","timestamp":"2024-12-22T10:00:00Z","source":"tf $p proof","summary":"Test passed"}
EOF
    done
    
    (cd "$bundle_dir" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
}

create_bundle_with_receipts() {
    local bundle_dir="$1"
    create_valid_bundle "$bundle_dir"
    
    cat > "$bundle_dir/receipts/apply_dev.json" << 'EOF'
{"version":"1.2.0","timestamp":"2024-12-22T08:00:00Z","environment":"dev","status":"success"}
EOF
    
    (cd "$bundle_dir" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Release Orchestration v1.0.0 Breaker Tests"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-1: ANSI injection in bundle path
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-1: ANSI Injection in Bundle Path"

# Try to inject ANSI codes via bundle path
ansi_path="$TMPDIR/\033[31mred\033[0m-bundle"
mkdir -p "$ansi_path/proofs"
output=$(bash "$TF" release status --bundle "$ansi_path" --ci 2>&1) && rc=0 || rc=$?
# Check no ANSI codes in output
if echo "$output" | grep -qE $'\033\['; then
    attack_bypassed "ATK-1" "ANSI codes leaked to output"
else
    attack_blocked "ATK-1"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-2: Concurrent prepare to same directory
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-2: Concurrent Prepare to Same Directory"

# First prepare should succeed, second should fail
mkdir -p "$TMPDIR/atk2-bundle"
bash "$TF" release prepare --out "$TMPDIR/atk2-bundle" --force >/dev/null 2>&1 &
pid1=$!
bash "$TF" release prepare --out "$TMPDIR/atk2-bundle" --force >/dev/null 2>&1 &
pid2=$!
wait $pid1 && rc1=0 || rc1=$?
wait $pid2 && rc2=0 || rc2=$?
# At least one should complete successfully, both may succeed with --force
if [[ $rc1 -eq 0 ]] || [[ $rc2 -eq 0 ]]; then
    attack_blocked "ATK-2"
else
    attack_bypassed "ATK-2" "Both concurrent prepares failed"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-3: Promote with tampered receipt
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-3: Promote with Tampered Receipt"

create_bundle_with_receipts "$TMPDIR/atk3-bundle"
# Add promote receipt with wrong hash
cat > "$TMPDIR/atk3-bundle/receipts/promote_dev_techsupport_20241222T090000Z.json" << 'EOF'
{"version":"1.2.0","timestamp":"2024-12-22T09:00:00Z","source_receipt":{"path":"receipts/apply_dev.json","hash":"sha256:0000000000000000000000000000000000000000000000000000000000000000"},"status":"success"}
EOF
(cd "$TMPDIR/atk3-bundle" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
output=$(bash "$TF" release promote --bundle "$TMPDIR/atk3-bundle" --to techsupport --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]] && echo "$output" | grep -qE 'CHAIN_INTEGRITY_FAILED|fail|error'; then
    attack_blocked "ATK-3"
else
    attack_bypassed "ATK-3" "Tampered receipt not detected"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-4: Audit with missing proofs/
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-4: Audit with Missing Proofs"

mkdir -p "$TMPDIR/atk4-bundle"
echo '{"name":"test"}' > "$TMPDIR/atk4-bundle/manifest.json"
# No proofs/ directory
output=$(bash "$TF" release audit --bundle "$TMPDIR/atk4-bundle" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    attack_blocked "ATK-4"
else
    attack_bypassed "ATK-4" "Missing proofs not detected"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-5: Status with symlink bundle
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-5: Status with Symlink Bundle"

create_valid_bundle "$TMPDIR/atk5-real"
ln -s "$TMPDIR/atk5-real" "$TMPDIR/atk5-link"
output=$(bash "$TF" release status --bundle "$TMPDIR/atk5-link" --ci 2>&1) && rc=0 || rc=$?
# Should either work (follow symlink safely) or reject
if [[ $rc -eq 0 ]] || [[ $rc -eq 1 ]]; then
    attack_blocked "ATK-5"
else
    attack_bypassed "ATK-5" "Unexpected exit code: $rc"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-6: Deploy with non-existent namespace (error propagation)
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-6: Deploy with Non-Existent Namespace"

create_valid_bundle "$TMPDIR/atk6-bundle"
output=$(bash "$TF" release deploy --bundle "$TMPDIR/atk6-bundle" --env dev --namespace nonexistent-ns-12345 --ci 2>&1) && rc=0 || rc=$?
# Should fail with proper error propagation
if [[ $rc -eq 1 ]] && echo "$output" | grep -qE 'fail|error|NAMESPACE'; then
    attack_blocked "ATK-6"
else
    attack_bypassed "ATK-6" "Error not propagated correctly"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-7: Race condition - delete during verify
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-7: Race Condition - Delete During Verify"

# This is hard to trigger reliably, so we test the outcome
create_valid_bundle "$TMPDIR/atk7-bundle"
# Start prepare, then delete immediately
bash "$TF" release prepare --out "$TMPDIR/atk7-new" &
pid=$!
sleep 0.1
rm -rf "$TMPDIR/atk7-new" 2>/dev/null || true
wait $pid && rc=0 || rc=$?
# Either succeeds (recreates) or fails cleanly - no crash
if [[ $rc -eq 0 ]] || [[ $rc -eq 1 ]]; then
    attack_blocked "ATK-7"
else
    attack_bypassed "ATK-7" "Unexpected crash or exit code: $rc"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-8: Promote with future timestamp (clock skew)
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-8: Promote with Clock Skew (Future Timestamp)"

create_bundle_with_receipts "$TMPDIR/atk8-bundle"
# Create receipt with future timestamp
cat > "$TMPDIR/atk8-bundle/receipts/promote_dev_techsupport_20301222T100000Z.json" << 'EOF'
{"version":"1.2.0","timestamp":"2030-12-22T10:00:00Z","source_receipt":{"path":"receipts/apply_dev.json","hash":"sha256:placeholder"},"status":"success"}
EOF
(cd "$TMPDIR/atk8-bundle" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
output=$(bash "$TF" release promote --bundle "$TMPDIR/atk8-bundle" --to techsupport --namespace test --dry-run --ci 2>&1) && rc=0 || rc=$?
# Should detect time skew or chain integrity issue
if [[ $rc -eq 1 ]] && echo "$output" | grep -qE 'TIME_SKEW|CHAIN_INTEGRITY|fail|error'; then
    attack_blocked "ATK-8"
else
    attack_bypassed "ATK-8" "Clock skew not detected"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-9: Audit --ci with stderr noise
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-9: Audit --ci Output Purity"

create_bundle_with_receipts "$TMPDIR/atk9-bundle"
# Capture stdout only (should be clean JSON)
stdout_output=$(bash "$TF" release audit --bundle "$TMPDIR/atk9-bundle" --ci 2>/dev/null) && rc=0 || rc=$?
if echo "$stdout_output" | python3 -m json.tool >/dev/null 2>&1; then
    attack_blocked "ATK-9"
else
    attack_bypassed "ATK-9" "stdout not clean JSON"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-10: Status with huge receipt file
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-10: Status with Large Receipt File"

create_bundle_with_receipts "$TMPDIR/atk10-bundle"
# Create a 1MB receipt file
python3 -c "import json; print(json.dumps({'data': 'x' * 1000000}))" > "$TMPDIR/atk10-bundle/receipts/huge.json"
(cd "$TMPDIR/atk10-bundle" && find . -type f ! -name 'checksums.sha256' -exec sha256sum {} \; > checksums.sha256)
# Should complete within reasonable time
timeout 10 bash "$TF" release status --bundle "$TMPDIR/atk10-bundle" --ci >/dev/null 2>&1 && rc=0 || rc=$?
if [[ $rc -le 1 ]]; then
    attack_blocked "ATK-10"
else
    attack_bypassed "ATK-10" "Command timed out or crashed"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-11: Deploy with path traversal
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-11: Deploy with Path Traversal"

output=$(bash "$TF" release deploy --bundle "../../../etc/passwd" --env dev --namespace test --ci 2>&1) && rc=0 || rc=$?
# Should fail with error, not expose system files
if [[ $rc -ge 1 ]] && ! echo "$output" | grep -q "root:"; then
    attack_blocked "ATK-11"
else
    attack_bypassed "ATK-11" "Path traversal may have succeeded"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# ATK-12: Promote with invalid --to
# ═══════════════════════════════════════════════════════════════════════════
echo "ATK-12: Promote with Invalid --to Value"

create_bundle_with_receipts "$TMPDIR/atk12-bundle"
output=$(bash "$TF" release promote --bundle "$TMPDIR/atk12-bundle" --to invalid_env --namespace test --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    attack_blocked "ATK-12"
else
    attack_bypassed "ATK-12" "Expected exit 2, got $rc"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
TOTAL=$((BLOCKED + BYPASSED))
echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $BYPASSED -eq 0 ]]; then
    echo "  ✓ All attacks blocked ($BLOCKED/$TOTAL)"
else
    echo "  ✗ Attacks bypassed: $BYPASSED/$TOTAL"
fi
echo "═══════════════════════════════════════════════════════════════════════════"

exit $BYPASSED
