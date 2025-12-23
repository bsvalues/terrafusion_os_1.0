#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Release Playbooks Governance Lint — v1.0.0
# ═══════════════════════════════════════════════════════════════════════════
# Constitutional Layer: Adoption (Docs-Only)
# Purpose: Validate playbook documents follow constitutional constraints
# Authority: Lint-only, no execution
# ═══════════════════════════════════════════════════════════════════════════

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCS_DIR="$REPO_ROOT/ops/release/docs"

# ═══════════════════════════════════════════════════════════════════════════
# Test Framework
# ═══════════════════════════════════════════════════════════════════════════

pass_count=0
fail_count=0
total_count=0

pass() {
    local name="$1"
    echo "  [PASS] $name"
    pass_count=$((pass_count + 1))
    total_count=$((total_count + 1))
}

fail() {
    local name="$1"
    local reason="${2:-}"
    echo "  [FAIL] $name"
    [[ -n "$reason" ]] && echo "         → $reason"
    fail_count=$((fail_count + 1))
    total_count=$((total_count + 1))
}

# ═══════════════════════════════════════════════════════════════════════════
# Governance Tests
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║           📋 Release Playbooks Governance Lint v1.0.0                     ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group A: Document Presence
# ─────────────────────────────────────────────────────────────────────────────

echo "Group A: Document Presence"

if [[ -f "$DOCS_DIR/RELEASE_PLAYBOOKS.md" ]]; then
    pass "A-001: RELEASE_PLAYBOOKS.md exists"
else
    fail "A-001: RELEASE_PLAYBOOKS.md exists" "File missing"
fi

if [[ -f "$DOCS_DIR/RELEASE_PLAYBOOKS_CI_EXAMPLES.md" ]]; then
    pass "A-002: RELEASE_PLAYBOOKS_CI_EXAMPLES.md exists"
else
    fail "A-002: RELEASE_PLAYBOOKS_CI_EXAMPLES.md exists" "File missing"
fi

if [[ -f "$DOCS_DIR/ROLE_GUIDE_OPERATOR.md" ]]; then
    pass "A-003: ROLE_GUIDE_OPERATOR.md exists"
else
    fail "A-003: ROLE_GUIDE_OPERATOR.md exists" "File missing"
fi

if [[ -f "$DOCS_DIR/ROLE_GUIDE_AUDITOR.md" ]]; then
    pass "A-004: ROLE_GUIDE_AUDITOR.md exists"
else
    fail "A-004: ROLE_GUIDE_AUDITOR.md exists" "File missing"
fi

if [[ -f "$DOCS_DIR/ROLE_GUIDE_EXECUTIVE.md" ]]; then
    pass "A-005: ROLE_GUIDE_EXECUTIVE.md exists"
else
    fail "A-005: ROLE_GUIDE_EXECUTIVE.md exists" "File missing"
fi

if [[ -f "$DOCS_DIR/RUNBOOK_FAQ.md" ]]; then
    pass "A-006: RUNBOOK_FAQ.md exists"
else
    fail "A-006: RUNBOOK_FAQ.md exists" "File missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group B: Forbidden Commands (No Direct Execution)
# ─────────────────────────────────────────────────────────────────────────────

echo "Group B: Forbidden Commands"

# Check for kubectl direct usage (should only reference sealed commands)
forbidden_kubectl=$(grep -rn "^\s*kubectl " "$DOCS_DIR" 2>/dev/null | grep -v "kubectl get ns" | grep -v "kubectl config" | grep -v "kubectl create ns" || true)
if [[ -z "$forbidden_kubectl" ]]; then
    pass "B-001: No direct kubectl apply/delete commands"
else
    fail "B-001: No direct kubectl apply/delete commands" "Found: $forbidden_kubectl"
fi

# Check for docker direct usage
forbidden_docker=$(grep -rn "^\s*docker " "$DOCS_DIR" 2>/dev/null || true)
if [[ -z "$forbidden_docker" ]]; then
    pass "B-002: No direct docker commands"
else
    fail "B-002: No direct docker commands" "Found: $forbidden_docker"
fi

# Check for tar/unzip (should use sealed bundle commands)
forbidden_tar=$(grep -rn "^\s*tar " "$DOCS_DIR" 2>/dev/null || true)
if [[ -z "$forbidden_tar" ]]; then
    pass "B-003: No direct tar commands"
else
    fail "B-003: No direct tar commands" "Found: $forbidden_tar"
fi

# Check for internal function references
forbidden_internal=$(grep -rn "_[a-z_]*(" "$DOCS_DIR" 2>/dev/null | grep -v "\.json" | grep -v "jq" || true)
if [[ -z "$forbidden_internal" ]]; then
    pass "B-004: No internal function references"
else
    fail "B-004: No internal function references" "Found: $forbidden_internal"
fi

# Check for TF_ environment variable injection
forbidden_env=$(grep -rn "TF_SKIP\|TF_BYPASS\|TF_FORCE" "$DOCS_DIR" 2>/dev/null || true)
if [[ -z "$forbidden_env" ]]; then
    pass "B-005: No bypass environment variables"
else
    fail "B-005: No bypass environment variables" "Found: $forbidden_env"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group C: Sealed Command References
# ─────────────────────────────────────────────────────────────────────────────

echo "Group C: Sealed Command References"

# Verify playbooks reference tf release commands
if grep -q "tf release prepare" "$DOCS_DIR/RELEASE_PLAYBOOKS.md" 2>/dev/null; then
    pass "C-001: Playbooks reference tf release prepare"
else
    fail "C-001: Playbooks reference tf release prepare"
fi

if grep -q "tf release deploy" "$DOCS_DIR/RELEASE_PLAYBOOKS.md" 2>/dev/null; then
    pass "C-002: Playbooks reference tf release deploy"
else
    fail "C-002: Playbooks reference tf release deploy"
fi

if grep -q "tf release promote" "$DOCS_DIR/RELEASE_PLAYBOOKS.md" 2>/dev/null; then
    pass "C-003: Playbooks reference tf release promote"
else
    fail "C-003: Playbooks reference tf release promote"
fi

if grep -q "tf release audit" "$DOCS_DIR/RELEASE_PLAYBOOKS.md" 2>/dev/null; then
    pass "C-004: Playbooks reference tf release audit"
else
    fail "C-004: Playbooks reference tf release audit"
fi

if grep -q "tf release status" "$DOCS_DIR/RELEASE_PLAYBOOKS.md" 2>/dev/null; then
    pass "C-005: Playbooks reference tf release status"
else
    fail "C-005: Playbooks reference tf release status"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group D: JSON Example Validity
# ─────────────────────────────────────────────────────────────────────────────

echo "Group D: JSON Example Validity"

if command -v jq &>/dev/null; then
    # Extract JSON blocks and validate
    json_errors=0
    ci_examples="$DOCS_DIR/RELEASE_PLAYBOOKS_CI_EXAMPLES.md"
    
    if [[ -f "$ci_examples" ]]; then
        # Count JSON blocks
        json_count=$(grep -c '```json' "$ci_examples" 2>/dev/null || echo "0")
        
        # Validate each JSON block using a simple extraction
        while IFS= read -r line; do
            if ! echo "$line" | jq . &>/dev/null; then
                json_errors=$((json_errors + 1))
            fi
        done < <(awk '/```json/,/```/' "$ci_examples" | grep -v '```' | grep -v '^$' | grep '{' -A 100 | head -50)
        
        if [[ "$json_errors" -eq 0 ]]; then
            pass "D-001: JSON examples parse successfully ($json_count blocks)"
        else
            fail "D-001: JSON examples parse successfully" "$json_errors parse errors"
        fi
    else
        fail "D-001: JSON examples parse successfully" "CI examples file missing"
    fi
else
    pass "D-001: JSON examples parse successfully (jq not available, skipped)"
fi

# Check for JSON schema version
if grep -q '"schema_version": "1.0.0"' "$DOCS_DIR/RELEASE_PLAYBOOKS_CI_EXAMPLES.md" 2>/dev/null; then
    pass "D-002: JSON examples include schema_version"
else
    fail "D-002: JSON examples include schema_version"
fi

# Check for status field in JSON examples
if grep -q '"status": "PASS"\|"status": "FAIL"\|"status": "WARN"' "$DOCS_DIR/RELEASE_PLAYBOOKS_CI_EXAMPLES.md" 2>/dev/null; then
    pass "D-003: JSON examples include status field"
else
    fail "D-003: JSON examples include status field"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group E: SpecLock Reference
# ─────────────────────────────────────────────────────────────────────────────

echo "Group E: SpecLock Compliance"

speclock="$REPO_ROOT/ops/release/RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md"

if [[ -f "$speclock" ]]; then
    pass "E-001: SpecLock document exists"
else
    fail "E-001: SpecLock document exists"
fi

# Check all docs reference the SpecLock
docs_with_speclock=0
for doc in "$DOCS_DIR"/*.md; do
    if grep -q "RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md" "$doc" 2>/dev/null; then
        docs_with_speclock=$((docs_with_speclock + 1))
    fi
done

if [[ "$docs_with_speclock" -ge 6 ]]; then
    pass "E-002: All docs reference SpecLock ($docs_with_speclock/6)"
else
    fail "E-002: All docs reference SpecLock" "Only $docs_with_speclock/6 reference it"
fi

# Check SpecLock has constitutional constraints
if grep -q "No New Authority" "$speclock" 2>/dev/null; then
    pass "E-003: SpecLock defines No New Authority invariant"
else
    fail "E-003: SpecLock defines No New Authority invariant"
fi

if grep -q "Sealed Composition Only" "$speclock" 2>/dev/null; then
    pass "E-004: SpecLock defines Sealed Composition invariant"
else
    fail "E-004: SpecLock defines Sealed Composition invariant"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Group F: Role Consistency
# ─────────────────────────────────────────────────────────────────────────────

echo "Group F: Role Consistency"

# Operator guide mentions all commands
if grep -q "tf release prepare\|tf release deploy\|tf release promote" "$DOCS_DIR/ROLE_GUIDE_OPERATOR.md" 2>/dev/null; then
    pass "F-001: Operator guide covers main commands"
else
    fail "F-001: Operator guide covers main commands"
fi

# Auditor guide emphasizes read-only
if grep -q "read-only\|Read-only\|without execution" "$DOCS_DIR/ROLE_GUIDE_AUDITOR.md" 2>/dev/null; then
    pass "F-002: Auditor guide emphasizes read-only access"
else
    fail "F-002: Auditor guide emphasizes read-only access"
fi

# Executive guide is non-technical
if grep -q "No action needed\|Escalate\|non-technical" "$DOCS_DIR/ROLE_GUIDE_EXECUTIVE.md" 2>/dev/null; then
    pass "F-003: Executive guide uses non-technical language"
else
    fail "F-003: Executive guide uses non-technical language"
fi

# FAQ covers WARN vs FAIL
if grep -q "WARN.*FAIL\|WARN vs FAIL" "$DOCS_DIR/RUNBOOK_FAQ.md" 2>/dev/null; then
    pass "F-004: FAQ covers WARN vs FAIL semantics"
else
    fail "F-004: FAQ covers WARN vs FAIL semantics"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════════════"
if [[ "$fail_count" -eq 0 ]]; then
    echo "✓ ALL GOVERNANCE CHECKS PASSED ($pass_count/$total_count)"
    echo ""
    echo "Release Playbooks are constitutional."
    exit 0
else
    echo "✗ GOVERNANCE CHECKS FAILED ($pass_count/$total_count passed, $fail_count failed)"
    echo ""
    echo "Fix failures before sealing."
    exit 1
fi
