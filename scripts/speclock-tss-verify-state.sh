#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock - State Mesh TSS Verification
# ═══════════════════════════════════════════════════════════════════════════════
#
# Verifies county quorum signatures on state reports.
#
# Exit codes:
#   0 - Signature valid
#   1 - Signature invalid or missing / verification required but failed
#   9 - State TSS mode not configured (policy-based skip, NOT a bypass)
#
# CONSTITUTIONAL: Uses Python jsonq.py fallback if jq unavailable.
#                 NEVER skips verification due to missing tools.
#                 NEVER silently defaults missing values when mode is enabled.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH="${1:-docs/spec-lock/AUTHORITIES.state.json}"
DIGEST="${2:-artifacts/speclock/tss/state/manifest.digest.json}"

# ═══════════════════════════════════════════════════════════════════════════════
# JSON Query Helper - uses jq if available, falls back to Python jsonq.py
# CONSTITUTIONAL: Must never skip due to missing tools
# CONSTITUTIONAL: Must fail on missing keys (no silent defaults)
# ═══════════════════════════════════════════════════════════════════════════════
jsonq_strict() {
    local file="$1"
    local path="$2"
    local result

    if command -v jq &>/dev/null; then
        result=$(jq -e -r "$path" "$file" 2>/dev/null)
        local rc=$?
        if [[ $rc -ne 0 ]]; then
            echo "❌ FATAL: Key '$path' not found in $file" >&2
            return 1
        fi
        echo "$result"
    elif command -v python3 &>/dev/null && [[ -f "$SCRIPT_DIR/jsonq.py" ]]; then
        result=$(python3 "$SCRIPT_DIR/jsonq.py" "$file" "$path" -r 2>&1)
        local rc=$?
        if [[ $rc -ne 0 ]]; then
            echo "❌ FATAL: Key '$path' not found in $file" >&2
            return 1
        fi
        echo "$result"
    elif command -v python &>/dev/null && [[ -f "$SCRIPT_DIR/jsonq.py" ]]; then
        result=$(python "$SCRIPT_DIR/jsonq.py" "$file" "$path" -r 2>&1)
        local rc=$?
        if [[ $rc -ne 0 ]]; then
            echo "❌ FATAL: Key '$path' not found in $file" >&2
            return 1
        fi
        echo "$result"
    else
        echo "❌ FATAL: Neither jq nor Python available for JSON queries" >&2
        echo "   Install jq or ensure Python is in PATH" >&2
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# POLICY CHECK: Is state authorities file present?
# Exit 9 = policy-based skip (not configured), NOT a tool bypass
# ═══════════════════════════════════════════════════════════════════════════════
if [[ ! -f "$AUTH" ]]; then
    echo "⚠️  State authorities file not found: $AUTH (state mesh not configured)"
    exit 9
fi

# Check if state TSS is enabled
MODE=$(jsonq_strict "$AUTH" ".mode") || {
    echo "⚠️  Cannot read mode from state AUTHORITIES. State mesh not configured."
    exit 9
}

if [[ "$MODE" != "state_tss" && "$MODE" != "cosmic_tss" ]]; then
    echo "⚠️  State AUTHORITIES mode is '$MODE', not 'state_tss'. Skipping."
    exit 9
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STATE TSS MODE ENABLED - Verification is now REQUIRED (fail-closed)
# ═══════════════════════════════════════════════════════════════════════════════
echo "🜂 STATE TSS MODE ENABLED - Verification REQUIRED"

SIG=$(jsonq_strict "$AUTH" ".tss.signature_path") || {
    echo "❌ FATAL: .tss.signature_path not configured but state_tss mode enabled"
    exit 1
}

PUB=$(jsonq_strict "$AUTH" ".tss.group_public_key_path") || {
    echo "❌ FATAL: .tss.group_public_key_path not configured but state_tss mode enabled"
    exit 1
}

echo "🜂 STATE MESH: Verifying threshold signature"
echo "   Signature: $SIG"
echo "   Group Pub: $PUB"

if [[ ! -f "$SIG" ]]; then
    echo "❌ Signature file not found: $SIG"
    exit 1
fi

if [[ ! -f "$PUB" ]]; then
    echo "❌ Group public key not found: $PUB"
    exit 1
fi

# Build and verify
cargo run -q --manifest-path tools/speclock-tss/Cargo.toml -- \
  verify --digest "$DIGEST" --signature "$SIG" --group-pub "$PUB"
echo "✅ STATE MESH signature VERIFIED"
