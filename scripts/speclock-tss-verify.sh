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
#   1 - Signature invalid or missing
#   9 - COSMIC mode not enabled
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

AUTH="${1:-docs/spec-lock/AUTHORITIES.json}"
DIGEST="${2:-artifacts/speclock/tss/manifest.digest.json}"

# Read TSS config
MODE=$(jq -r '.mode // "mythic"' "$AUTH")
if [[ "$MODE" != "cosmic_tss" ]]; then
    echo "⚠️  AUTHORITIES.json mode is '$MODE', not 'cosmic_tss'. Skipping."
    exit 9
fi

SIG_PATH=$(jq -r '.tss.signature_path' "$AUTH")
GROUP_PUB_PATH=$(jq -r '.tss.group_public_key_path' "$AUTH")

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

# Get message file
MSG_FILE=$(jq -r '.manifest_path' "$DIGEST" 2>/dev/null || echo "")
if [[ -z "$MSG_FILE" || ! -f "$MSG_FILE" ]]; then
    MSG_FILE="artifacts/speclock/manifest.json"
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
