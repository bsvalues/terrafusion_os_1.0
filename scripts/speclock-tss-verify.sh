#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock COSMIC TIER - Verify Threshold Signature
# ═══════════════════════════════════════════════════════════════════════════════
#
# Verifies the aggregated FROST signature against the group public key.
# This is what CI and runtime use - ONE signature, ONE public key.
#
# Usage:
#   ./scripts/speclock-tss-verify.sh [authorities] [digest]
#
# Defaults:
#   authorities: docs/spec-lock/AUTHORITIES.json
#   digest:      artifacts/speclock/tss/manifest.digest.json
#
# Exit codes:
#   0 - Signature valid
#   1 - Signature invalid or missing / verification required but failed
#   9 - COSMIC mode not enabled (policy-based skip, NOT a bypass)
#
# CONSTITUTIONAL: Uses Python jsonq.py fallback if jq unavailable.
#                 NEVER skips verification due to missing tools.
#                 NEVER silently defaults missing values.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH="${1:-docs/spec-lock/AUTHORITIES.json}"
DIGEST="${2:-artifacts/speclock/tss/manifest.digest.json}"

# ═══════════════════════════════════════════════════════════════════════════════
# JSON Query Helper - uses jq if available, falls back to Python jsonq.py
# CONSTITUTIONAL: Must never skip due to missing tools
# CONSTITUTIONAL: Must fail on missing keys (no silent defaults)
# ═══════════════════════════════════════════════════════════════════════════════
jsonq_strict() {
    # Strict mode: fails if key missing, no defaults allowed
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

jsonq_optional() {
    # Optional mode: returns empty string if key missing (for truly optional fields)
    local file="$1"
    local path="$2"

    if command -v jq &>/dev/null; then
        jq -r "$path // empty" "$file" 2>/dev/null || echo ""
    elif command -v python3 &>/dev/null && [[ -f "$SCRIPT_DIR/jsonq.py" ]]; then
        python3 "$SCRIPT_DIR/jsonq.py" "$file" "$path" -r 2>/dev/null || echo ""
    elif command -v python &>/dev/null && [[ -f "$SCRIPT_DIR/jsonq.py" ]]; then
        python "$SCRIPT_DIR/jsonq.py" "$file" "$path" -r 2>/dev/null || echo ""
    else
        echo "❌ FATAL: Neither jq nor Python available for JSON queries" >&2
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# POLICY CHECK: Is cosmic_tss mode enabled?
# Exit 9 = policy-based skip (mode not configured), NOT a tool bypass
# ═══════════════════════════════════════════════════════════════════════════════
MODE=$(jsonq_strict "$AUTH" ".mode") || {
    echo "⚠️  Cannot read mode from AUTHORITIES.json. Assuming TSS not configured."
    exit 9
}

if [[ "$MODE" != "cosmic_tss" ]]; then
    echo "⚠️  AUTHORITIES.json mode is '$MODE', not 'cosmic_tss'. Skipping."
    exit 9
fi

# ═══════════════════════════════════════════════════════════════════════════════
# TSS MODE ENABLED - Verification is now REQUIRED (fail-closed)
# ═══════════════════════════════════════════════════════════════════════════════
echo "🜂 COSMIC TSS MODE ENABLED - Verification REQUIRED"

SIG_PATH=$(jsonq_strict "$AUTH" ".tss.signature_path") || {
    echo "❌ FATAL: .tss.signature_path not configured but cosmic_tss mode enabled"
    exit 1
}

GROUP_PUB_PATH=$(jsonq_strict "$AUTH" ".tss.group_public_key_path") || {
    echo "❌ FATAL: .tss.group_public_key_path not configured but cosmic_tss mode enabled"
    exit 1
}

echo "🜂 COSMIC: Verifying threshold signature"
echo "   Signature: $SIG_PATH"
echo "   Group Pub: $GROUP_PUB_PATH"

if [[ ! -f "$SIG_PATH" ]]; then
    echo "❌ Signature file not found: $SIG_PATH"
    exit 1
fi

if [[ ! -f "$GROUP_PUB_PATH" ]]; then
    echo "❌ Group public key not found: $GROUP_PUB_PATH"
    exit 1
fi

# Get message file (optional field - defaults to standard location)
MSG_FILE=$(jsonq_optional "$DIGEST" ".manifest_path")
if [[ -z "$MSG_FILE" || ! -f "$MSG_FILE" ]]; then
    MSG_FILE="artifacts/speclock/manifest.json"
fi

if [[ ! -f "$MSG_FILE" ]]; then
    echo "❌ Manifest file not found: $MSG_FILE"
    exit 1
fi

# Build TSS tool
cargo build --release --manifest-path tools/speclock-tss/Cargo.toml --quiet 2>/dev/null || \
cargo build --manifest-path tools/speclock-tss/Cargo.toml --quiet

# Verify
./target/release/speclock-tss verify \
    --message "$MSG_FILE" \
    --signature "$SIG_PATH" \
    --group-pub "$GROUP_PUB_PATH" 2>/dev/null || \
./target/debug/speclock-tss verify \
    --message "$MSG_FILE" \
    --signature "$SIG_PATH" \
    --group-pub "$GROUP_PUB_PATH"

echo "✅ COSMIC signature VERIFIED"
