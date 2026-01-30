#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion SpecLock COSMIC TIER - Compute Manifest Digest
# ═══════════════════════════════════════════════════════════════════════════════
#
# Computes SHA-256 digest of the manifest file. This is what gets signed.
#
# Usage:
#   ./scripts/speclock-tss-digest.sh [manifest] [out]
#
# Defaults:
#   manifest: artifacts/speclock/manifest.json
#   out:      artifacts/speclock/tss/manifest.digest.json
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
OUT="${2:-artifacts/speclock/tss/manifest.digest.json}"

echo "🜂 COSMIC: Computing manifest digest"
echo "   Manifest: $MANIFEST"
echo "   Output:   $OUT"

mkdir -p "$(dirname "$OUT")"

# Build and run the TSS tool
cargo build --release --manifest-path tools/speclock-tss/Cargo.toml --quiet 2>/dev/null || \
cargo build --manifest-path tools/speclock-tss/Cargo.toml --quiet

./target/release/speclock-tss digest \
    --manifest "$MANIFEST" \
    --out "$OUT" 2>/dev/null || \
./target/debug/speclock-tss digest \
    --manifest "$MANIFEST" \
    --out "$OUT"

echo "✅ Digest written to $OUT"
