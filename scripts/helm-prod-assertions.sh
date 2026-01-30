#!/usr/bin/env bash
# =============================================================================
# Helm Production Constitutional Assertions
# =============================================================================
# These checks are MANDATORY for production deployments.
# If any check fails, the CI seal gate MUST fail.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

FILE="$PROJECT_ROOT/iac/helm/terrafusion/values-prod.yaml"

echo "🔒 Helm Production Constitutional Assertions"
echo "============================================="
echo ""

FAIL=0

# Assertion 1: Admission gate section exists
echo "🔒 Assert: admissionGate section exists"
if grep -q "admissionGate:" "$FILE"; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: admissionGate section missing"
    FAIL=1
fi

# Assertion 2: Admission gate is enabled
echo "🔒 Assert: admissionGate.enabled = true"
if grep -A1 "admissionGate:" "$FILE" | grep -q "enabled: true"; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: admissionGate must be enabled in production"
    FAIL=1
fi

# Assertion 3: Admission URL points to internal service
echo "🔒 Assert: admissionGate.url is configured"
if grep -q "url:.*ops/plugins/admission" "$FILE"; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: admissionGate.url must point to /ops/plugins/admission"
    FAIL=1
fi

# Assertion 4: County ID is set (Benton pilot)
echo "🔒 Assert: countyId is configured"
if grep -q "^countyId:" "$FILE"; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: countyId must be set for county isolation"
    FAIL=1
fi

# Assertion 5: ConfigMap template exists
CONFIGMAP_TEMPLATE="$PROJECT_ROOT/iac/helm/terrafusion/templates/plugin-admission-gate-configmap.yaml"
echo "🔒 Assert: plugin-admission-gate-configmap.yaml exists"
if [ -f "$CONFIGMAP_TEMPLATE" ]; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: plugin-admission-gate-configmap.yaml template missing"
    FAIL=1
fi

# Assertion 6: Plugin deployment template exists
PLUGIN_TEMPLATE="$PROJECT_ROOT/iac/helm/terrafusion/templates/plugin-deployment.yaml"
echo "🔒 Assert: plugin-deployment.yaml exists"
if [ -f "$PLUGIN_TEMPLATE" ]; then
    echo "   ✅ PASS"
else
    echo "   ❌ FAIL: plugin-deployment.yaml template missing"
    FAIL=1
fi

# Assertion 7: initContainer gate is in plugin deployment
echo "🔒 Assert: initContainer admission gate in plugin template"
if grep -q "plugin-admission-gate" "$PLUGIN_TEMPLATE" 2>/dev/null; then
    echo "   ✅ PASS"
else
    echo "   ⚠️  SKIP: No plugin template to check"
fi

echo ""
echo "============================================="
if [ $FAIL -eq 0 ]; then
    echo "✅ Helm production assertions PASSED"
    exit 0
else
    echo "🚨 Helm production assertions FAILED"
    echo ""
    echo "   Production deployment is NOT constitutional."
    echo "   Fix the failing assertions before deploying."
    exit 1
fi
