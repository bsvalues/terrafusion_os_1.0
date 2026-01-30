#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock COSMIC TIER - DKG Ceremony Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# Runs a complete Distributed Key Generation ceremony for k-of-n threshold.
# This is typically run ONCE to establish the signing group.
#
# In production, each participant runs their own DKG rounds on separate machines.
# This script simulates the full ceremony for testing/development.
#
# Usage:
#   ./scripts/speclock-tss-dkg.sh [threshold_k] [participants_n]
#
# Defaults:
#   threshold_k:    2
#   participants_n: 3
#
# Outputs:
#   artifacts/speclock/tss/keys/participant_{id}.key_package.json
#   artifacts/speclock/tss/group.pub
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

K="${1:-2}"
N="${2:-3}"

TSS_DIR="artifacts/speclock/tss"
KEYS_DIR="$TSS_DIR/keys"
R1_DIR="$TSS_DIR/dkg/round1"
R2_DIR="$TSS_DIR/dkg/round2"

echo "🜂 COSMIC DKG: Generating $K-of-$N threshold key"
echo ""

# Clean up previous ceremony
rm -rf "$TSS_DIR/dkg" "$KEYS_DIR"
mkdir -p "$R1_DIR" "$R2_DIR" "$KEYS_DIR"

# Build TSS tool
echo "Building speclock-tss..."
cargo build --release --manifest-path tools/speclock-tss/Cargo.toml --quiet 2>/dev/null || \
cargo build --manifest-path tools/speclock-tss/Cargo.toml --quiet

TSS_BIN="./target/release/speclock-tss"
if [[ ! -f "$TSS_BIN" ]]; then
    TSS_BIN="./target/debug/speclock-tss"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Round 1: Each participant generates their commitment
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "DKG Round 1: Generating commitments"
echo "─────────────────────────────────────────────────────────────────"

for id in $(seq 1 "$N"); do
    echo "  Participant $id..."
    $TSS_BIN dkg-r1 \
        --id "$id" \
        --threshold "$K" \
        --participants "$N" \
        --out-package "$R1_DIR/participant_${id}.json" \
        --out-secret "$R1_DIR/participant_${id}.secret"
done

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Round 2: Each participant generates packages for others
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "DKG Round 2: Generating peer packages"
echo "─────────────────────────────────────────────────────────────────"

for id in $(seq 1 "$N"); do
    echo "  Participant $id..."
    mkdir -p "$R2_DIR/from_$id"
    $TSS_BIN dkg-r2 \
        --id "$id" \
        --secret "$R1_DIR/participant_${id}.secret" \
        --packages-dir "$R1_DIR" \
        --out-dir "$R2_DIR/from_$id"
done

# Collect all R2 packages into one directory
mkdir -p "$R2_DIR/all"
for id in $(seq 1 "$N"); do
    cp "$R2_DIR/from_$id"/*.json "$R2_DIR/all/" 2>/dev/null || true
done

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Finalize: Each participant computes their key package
# ═══════════════════════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "DKG Finalize: Generating key packages"
echo "─────────────────────────────────────────────────────────────────"

for id in $(seq 1 "$N"); do
    echo "  Participant $id..."
    $TSS_BIN dkg-final \
        --id "$id" \
        --secret "$R1_DIR/participant_${id}.secret" \
        --r1-packages-dir "$R1_DIR" \
        --r2-packages-dir "$R2_DIR/all" \
        --out-key-package "$KEYS_DIR/participant_${id}.key_package.json" \
        --out-group-pub "$TSS_DIR/group.pub"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DKG CEREMONY COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Threshold: $K-of-$N"
echo "  Group Key: $TSS_DIR/group.pub"
echo "  Key Pkgs:  $KEYS_DIR/participant_{1..$N}.key_package.json"
echo ""
echo "  ⚠️  Each participant must keep their key_package.json PRIVATE"
echo "  ⚠️  The group.pub is PUBLIC (used for verification)"
echo ""

# Show group public key
GROUP_KEY=$(jq -r '.public_key_bytes' "$TSS_DIR/group.pub")
echo "  Group Public Key: $GROUP_KEY"
