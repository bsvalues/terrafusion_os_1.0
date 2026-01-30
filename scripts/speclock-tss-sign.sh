#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock COSMIC TIER - Signing Ceremony Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# Runs a complete FROST signing ceremony with k-of-n participants.
# Each participant provides their signature share; coordinator aggregates.
#
# In production, each participant runs signing on their own machine.
# This script simulates the full ceremony for testing/development.
#
# Usage:
#   ./scripts/speclock-tss-sign.sh [participant_ids...]
#
# Example (2-of-3, signers 1 and 2):
#   ./scripts/speclock-tss-sign.sh 1 2
#
# Defaults: Uses first k participants from AUTHORITIES.json
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

AUTH="docs/spec-lock/AUTHORITIES.json"
TSS_DIR="artifacts/speclock/tss"
KEYS_DIR="$TSS_DIR/keys"
COMMIT_DIR="$TSS_DIR/commitments"
SHARES_DIR="$TSS_DIR/shares"
MANIFEST="artifacts/speclock/manifest.json"

# Get threshold from config
K=$(jq -r '.tss.threshold_k' "$AUTH")

# Determine signers
if [[ $# -gt 0 ]]; then
    SIGNERS=("$@")
else
    # Default: use first k participants
    SIGNERS=($(seq 1 "$K"))
fi

if [[ ${#SIGNERS[@]} -lt $K ]]; then
    echo "❌ Need at least $K signers, got ${#SIGNERS[@]}"
    exit 2
fi

echo "🜂 COSMIC SIGN: Creating threshold signature"
echo "   Signers: ${SIGNERS[*]}"
echo "   Threshold: $K"
echo ""

# Clean up previous signing session
rm -rf "$COMMIT_DIR" "$SHARES_DIR"
mkdir -p "$COMMIT_DIR" "$SHARES_DIR"

# Build TSS tool
TSS_BIN="./target/release/speclock-tss"
if [[ ! -f "$TSS_BIN" ]]; then
    cargo build --release --manifest-path tools/speclock-tss/Cargo.toml --quiet 2>/dev/null || \
    cargo build --manifest-path tools/speclock-tss/Cargo.toml --quiet
    TSS_BIN="./target/debug/speclock-tss"
    [[ -f "./target/release/speclock-tss" ]] && TSS_BIN="./target/release/speclock-tss"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Round 1: Each signer generates nonces + commitment
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Sign Round 1: Generating commitments"
echo "─────────────────────────────────────────────────────────────────"

for id in "${SIGNERS[@]}"; do
    echo "  Participant $id..."
    KEY_PKG="$KEYS_DIR/participant_${id}.key_package.json"
    if [[ ! -f "$KEY_PKG" ]]; then
        echo "❌ Key package not found: $KEY_PKG"
        echo "   Run ./scripts/speclock-tss-dkg.sh first"
        exit 1
    fi

    $TSS_BIN sign-r1 \
        --id "$id" \
        --key-package "$KEY_PKG" \
        --out-commitment "$COMMIT_DIR/participant_${id}.json" \
        --out-nonces "$COMMIT_DIR/participant_${id}.nonces"
done

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Round 2: Each signer generates their signature share
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Sign Round 2: Generating signature shares"
echo "─────────────────────────────────────────────────────────────────"

for id in "${SIGNERS[@]}"; do
    echo "  Participant $id..."
    KEY_PKG="$KEYS_DIR/participant_${id}.key_package.json"

    $TSS_BIN sign-r2 \
        --id "$id" \
        --key-package "$KEY_PKG" \
        --nonces "$COMMIT_DIR/participant_${id}.nonces" \
        --message "$MANIFEST" \
        --commitments-dir "$COMMIT_DIR" \
        --out-share "$SHARES_DIR/participant_${id}.share.json"
done

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregate: Coordinator combines shares
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Aggregating signature shares"
echo "─────────────────────────────────────────────────────────────────"

# Use any participant's key package (all have the same public key package)
FIRST_SIGNER="${SIGNERS[0]}"
KEY_PKG="$KEYS_DIR/participant_${FIRST_SIGNER}.key_package.json"

SIG_PATH=$(jq -r '.tss.signature_path' "$AUTH")
PROOF_PATH=$(jq -r '.tss.proof_path' "$AUTH")

mkdir -p "$(dirname "$SIG_PATH")"

$TSS_BIN aggregate \
    --message "$MANIFEST" \
    --commitments-dir "$COMMIT_DIR" \
    --shares-dir "$SHARES_DIR" \
    --public-key-package "$KEY_PKG" \
    --out-signature "$SIG_PATH" \
    --out-proof "$PROOF_PATH"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Verify the signature
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Verifying signature"
echo "─────────────────────────────────────────────────────────────────"

GROUP_PUB="$TSS_DIR/group.pub"

$TSS_BIN verify \
    --message "$MANIFEST" \
    --signature "$SIG_PATH" \
    --group-pub "$GROUP_PUB"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ COSMIC SIGNING CEREMONY COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Signature: $SIG_PATH"
echo "  Proof:     $PROOF_PATH"
echo "  Signers:   ${SIGNERS[*]}"
echo ""

# Show signature
SIG=$(cat "$SIG_PATH" | tr -d '\n')
echo "  Signature (hex): $SIG"
