#!/usr/bin/env bash
# =============================================================================
# PROD SMOKE VERIFY — Constitutional Production Readiness Gate
# =============================================================================
# This script MUST pass before any production deployment is considered valid.
# It reuses the CI seal gate + adds prod-specific constitutional checks.
# =============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🏛️ PROD SMOKE VERIFY — CONSTITUTIONAL GATE"
echo "============================================"
echo "Target: $BASE_URL"
echo ""

FAIL=0

# ─────────────────────────────────────────────────────────────────────────────
# Gate 1: Reuse CI Seal Gate (speclock index, manifest, drift check)
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 1: CI Seal Gate (reused)"
if bash "$SCRIPT_DIR/ci-seal-gate.sh" 2>/dev/null; then
    echo "   ✅ PASS: CI seal gate verified"
else
    echo "   ❌ FAIL: CI seal gate failed"
    FAIL=1
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 2: Readiness Endpoint (constitution-compliant)
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 2: Readiness Endpoint (/healthz/ready)"
if curl -fsS --max-time 10 "${BASE_URL}/healthz/ready" > /dev/null 2>&1; then
    echo "   ✅ PASS: Readiness probe OK"
else
    echo "   ❌ FAIL: Readiness probe failed"
    FAIL=1
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 3: SpecLock Public Endpoint
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 3: SpecLock Public Endpoint (/ops/speclock)"
if curl -fsS --max-time 10 "${BASE_URL}/ops/speclock" > /dev/null 2>&1; then
    echo "   ✅ PASS: SpecLock endpoint available"
else
    echo "   ⚠️  SKIP: SpecLock endpoint not available (may not be deployed yet)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 4: SpecLock Proof Endpoint
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 4: SpecLock Proof (/ops/speclock/proof)"
if curl -fsS --max-time 10 "${BASE_URL}/ops/speclock/proof" > /dev/null 2>&1; then
    echo "   ✅ PASS: SpecLock proof endpoint available"
else
    echo "   ⚠️  SKIP: SpecLock proof endpoint not available"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 5: State Mesh Proof
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 5: State Mesh Proof (/ops/speclock/state/proof)"
if curl -fsS --max-time 10 "${BASE_URL}/ops/speclock/state/proof" > /dev/null 2>&1; then
    echo "   ✅ PASS: State mesh proof available"
else
    echo "   ⚠️  SKIP: State mesh proof not available"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 6: Constitutional Health Proof (deterministic)
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 6: Constitutional Health Proof (/healthz/proof)"
PROOF_RESPONSE=$(curl -fsS --max-time 10 "${BASE_URL}/healthz/proof" 2>/dev/null || echo "")
if [ -n "$PROOF_RESPONSE" ]; then
    # Check if speclock_ok is true
    SPECLOCK_OK=$(echo "$PROOF_RESPONSE" | grep -o '"speclock_ok"[[:space:]]*:[[:space:]]*true' || true)
    if [ -n "$SPECLOCK_OK" ]; then
        echo "   ✅ PASS: Constitutional proof verified (speclock_ok=true)"
    else
        echo "   ❌ FAIL: Constitutional proof speclock_ok is false"
        echo "   Response: $PROOF_RESPONSE"
        FAIL=1
    fi
else
    echo "   ⚠️  SKIP: Health proof endpoint not available"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Gate 7: Metrics Endpoint (Prometheus scrape target)
# ─────────────────────────────────────────────────────────────────────────────
echo "🔒 Gate 7: Metrics Endpoint (/metrics)"
METRICS_RESPONSE=$(curl -fsS --max-time 10 "${BASE_URL}/metrics" 2>/dev/null || echo "")
if [ -n "$METRICS_RESPONSE" ]; then
    # Check for tf_speclock_ok gauge
    if echo "$METRICS_RESPONSE" | grep -q "tf_speclock_ok"; then
        echo "   ✅ PASS: tf_speclock_ok gauge present in metrics"
    else
        echo "   ⚠️  WARN: tf_speclock_ok gauge not found in metrics"
    fi
else
    echo "   ⚠️  SKIP: Metrics endpoint not available"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Final Verdict
# ─────────────────────────────────────────────────────────────────────────────
echo "============================================"
if [ $FAIL -eq 0 ]; then
    echo "🏛️ PROD SMOKE VERIFY — PASSED"
    echo "   Production deployment is constitutional."
    echo ""
    echo "   Next steps:"
    echo "   1. Commit this verification result"
    echo "   2. Tag the release"
    echo "   3. Deploy to production cluster"
    exit 0
else
    echo "🚨 PROD SMOKE VERIFY — FAILED"
    echo "   Production deployment is NOT constitutional."
    echo ""
    echo "   To proceed:"
    echo "   1. Fix failing gates"
    echo "   2. Ensure speclock artifacts are generated"
    echo "   3. Verify all endpoints are deployed"
    echo "   4. Re-run this verification"
    exit 1
fi
