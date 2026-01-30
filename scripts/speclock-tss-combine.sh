#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock COSMIC TIER - Aggregate Signature Shares
# ═══════════════════════════════════════════════════════════════════════════════
#
# Combines k-of-n signature shares into ONE final FROST signature.
# This is the coordinator operation - requires k shares from signers.
#
# Usage:
#   ./scripts/speclock-tss-combine.sh [authorities] [digest] [shares_dir]
#
# Defaults:
#   authorities: docs/spec-lock/AUTHORITIES.json
#   digest:      artifacts/speclock/tss/manifest.digest.json
#   shares_dir:  artifacts/speclock/tss/shares
#
# Outputs:
#   artifacts/speclock/tss/manifest.sig        (raw signature hex)
#   artifacts/speclock/tss/manifest.proof.json (audit proof)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

AUTH="${1:-docs/spec-lock/AUTHORITIES.json}"
DIGEST="${2:-artifacts/speclock/tss/manifest.digest.json}"
SHARES_DIR="${3:-artifacts/speclock/tss/shares}"

# Read TSS config from AUTHORITIES.json
MODE=$(jq -r '.mode // "mythic"' "$AUTH")
if [[ "$MODE" != "cosmic_tss" ]]; then
    echo "⚠️  AUTHORITIES.json mode is '$MODE', not 'cosmic_tss'. Skipping."
    exit 0
fi

K=$(jq -r '.tss.threshold_k' "$AUTH")
SIG_PATH=$(jq -r '.tss.signature_path' "$AUTH")
PROOF_PATH=$(jq -r '.tss.proof_path' "$AUTH")
GROUP_PUB_PATH=$(jq -r '.tss.group_public_key_path' "$AUTH")

echo "🜂 COSMIC: Aggregating signature shares"
echo "   Threshold:   $K-of-n"
echo "   Shares:      $SHARES_DIR"
echo "   Group Pub:   $GROUP_PUB_PATH"

# Check we have a key package (any participant's will have the public key package)
KEY_PACKAGE=$(find "$SHARES_DIR/../keys" -name "*.key_package.json" 2>/dev/null | head -1 || echo "")
if [[ -z "$KEY_PACKAGE" ]]; then
    echo "❌ No key package found. Run DKG first."
    exit 1
fi

# Check we have enough shares
SHARE_COUNT=$(find "$SHARES_DIR" -name "*.share.json" 2>/dev/null | wc -l)
if [[ "$SHARE_COUNT" -lt "$K" ]]; then
    echo "❌ Not enough shares: have $SHARE_COUNT, need $K"
    exit 2
fi

# Get the message file (digest content as bytes)
MSG_FILE=$(jq -r '.manifest_path' "$DIGEST")
if [[ ! -f "$MSG_FILE" ]]; then
    MSG_FILE="artifacts/speclock/manifest.json"
fi

mkdir -p "$(dirname "$SIG_PATH")"
mkdir -p "$(dirname "$PROOF_PATH")"

# Build TSS tool
cargo build --release --manifest-path tools/speclock-tss/Cargo.toml --quiet 2>/dev/null || \
cargo build --manifest-path tools/speclock-tss/Cargo.toml --quiet

# Aggregate
./target/release/speclock-tss aggregate \
    --message "$MSG_FILE" \
    --commitments-dir "$SHARES_DIR/../commitments" \
    --shares-dir "$SHARES_DIR" \
    --public-key-package "$KEY_PACKAGE" \
    --out-signature "$SIG_PATH" \
    --out-proof "$PROOF_PATH" 2>/dev/null || \
./target/debug/speclock-tss aggregate \
    --message "$MSG_FILE" \
    --commitments-dir "$SHARES_DIR/../commitments" \
    --shares-dir "$SHARES_DIR" \
    --public-key-package "$KEY_PACKAGE" \
    --out-signature "$SIG_PATH" \
    --out-proof "$PROOF_PATH"

echo "✅ Signature aggregated"
echo "   Signature: $SIG_PATH"
echo "   Proof:     $PROOF_PATH"
