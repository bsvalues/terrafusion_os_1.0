#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Test: Sterile Shell Cleanliness
# Ensures tf.sh produces no shell warnings when run with minimal environment
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

echo "Testing sterile shell (env -i) for warnings..."

# Run with minimal environment (no user bashrc/profile)
output=$(env -i PATH=/usr/bin:/bin HOME="$HOME" USER="$USER" \
    /usr/bin/timeout 5 bash "$TF" gate 2>&1 || true)

# Check for common shell warnings that indicate product bugs
if echo "$output" | grep -q "ambiguous redirect"; then
    echo "✗ FAIL: tf.sh triggers 'ambiguous redirect' warning"
    echo "  This indicates an unquoted redirect in tf.sh itself"
    exit 1
fi

if echo "$output" | grep -q "unbound variable"; then
    echo "✗ FAIL: tf.sh triggers 'unbound variable' error"
    echo "  This violates set -u (nounset) in sterile environment"
    exit 1
fi

echo "✓ PASS: tf.sh produces no shell warnings in sterile environment"
exit 0
