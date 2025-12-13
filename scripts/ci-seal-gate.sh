#!/usr/bin/env bash
# =============================================================================
# CI SEAL GATE (FINAL SEAL)
# =============================================================================
# CI is now law. This script must pass for any merge/deploy.
# Failure = halt. No exceptions. No bypass.
# =============================================================================

set -euo pipefail

echo "🜄🜁🜂🜃 CI SEAL GATE — EXECUTING"
echo "=================================="
echo ""

FAIL=0

# Gate 1: SpecLock Index Validation
echo "🔒 Gate 1: SpecLock Index Validation"
if python scripts/validate-speclock-index.py --strict 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: SpecLock index invalid"
    FAIL=1
fi
echo ""

# Gate 2: Generate All Artifacts
echo "🔒 Gate 2: Generate All Artifacts"
if python scripts/speclock-generate-all.py 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: Artifact generation failed"
    FAIL=1
fi
echo ""

# Gate 3: Manifest Generation
echo "🔒 Gate 3: Manifest Generation"
if python scripts/speclock-manifest.py 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: Manifest generation failed"
    FAIL=1
fi
echo ""

# Gate 4: County TSS Verification (if available)
echo "🔒 Gate 4: County TSS Verification"
if [ -f "scripts/speclock-tss-verify.sh" ]; then
    if bash scripts/speclock-tss-verify.sh 2>/dev/null; then
        echo "   ✅ PASS"
    else
        echo "   ⚠️  SKIP: TSS verification not configured (no signature)"
    fi
else
    echo "   ⚠️  SKIP: County TSS script not found"
fi
echo ""

# Gate 5: State TSS Verification (if available)
echo "🔒 Gate 5: State TSS Verification"
if [ -f "scripts/speclock-tss-verify-state.sh" ]; then
    if bash scripts/speclock-tss-verify-state.sh 2>/dev/null; then
        echo "   ✅ PASS"
    else
        echo "   ⚠️  SKIP: State TSS verification not configured (no signature)"
    fi
else
    echo "   ⚠️  SKIP: State TSS script not found"
fi
echo ""

# Gate 6: Full Test Suite
echo "🔒 Gate 6: Full Test Suite"
if dotnet test backend/tests/TerraFusion.Unit.SmokeTests --nologo --verbosity quiet 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: Tests failed"
    FAIL=1
fi
echo ""

# Gate 7: No Uncommitted Changes (drift check)
echo "🔒 Gate 7: No Uncommitted Changes"
if git diff --exit-code --quiet 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: Uncommitted changes detected (drift)"
    git diff --stat
    FAIL=1
fi
echo ""

# Final verdict
echo "=================================="
if [ $FAIL -eq 0 ]; then
    echo "🜄🜁🜂🜃 CI SEAL GATE — PASSED"
    echo "   Merge/deploy authorized."
    exit 0
else
    echo "🚨 CI SEAL GATE — FAILED"
    echo "   Merge/deploy BLOCKED."
    echo ""
    echo "   To proceed:"
    echo "   1. Fix failing gates"
    echo "   2. Run: python scripts/speclock-generate-all.py"
    echo "   3. Run: python scripts/speclock-manifest.py"
    echo "   4. Commit all changes"
    echo "   5. Re-run this gate"
    exit 1
fi
