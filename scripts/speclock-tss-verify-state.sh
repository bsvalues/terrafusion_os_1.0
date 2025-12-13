#!/usr/bin/env bash
set -euo pipefail

# State Mesh TSS Verification Script
# Verifies county quorum signatures on state reports

AUTH="${1:-docs/spec-lock/AUTHORITIES.state.json}"

SIG=$(jq -r '.tss.signature_path' "$AUTH")
PUB=$(jq -r '.tss.group_public_key_path' "$AUTH")
DIGEST="${2:-artifacts/speclock/tss/state/manifest.digest.json}"

echo "🜂 STATE MESH: verify"
cargo run -q --manifest-path tools/speclock-tss/Cargo.toml -- \
  verify --digest "$DIGEST" --signature "$SIG" --group-pub "$PUB"
echo "✅ state mesh signature verified"
