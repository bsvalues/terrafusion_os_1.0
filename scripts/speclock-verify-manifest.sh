#!/usr/bin/env bash
# =============================================================================
# SpecLock Verify Manifest (MYTHIC TIER)
# =============================================================================
# Verifies the SpecLock manifest signature using Cosign.
# Requires a public key for deterministic runtime verification.
#
# Usage:
#   ./scripts/speclock-verify-manifest.sh [manifest] [bundle] [pubkey]
#
# Example:
#   ./scripts/speclock-verify-manifest.sh \
#       artifacts/speclock/manifest.json \
#       artifacts/speclock/manifest.bundle.json \
#       artifacts/speclock/cosign.pub
# =============================================================================

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
BUNDLE="${2:-artifacts/speclock/manifest.bundle.json}"
PUBKEY="${3:-}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🜂 SpecLock Manifest Verification (MYTHIC TIER)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for cosign
if ! command -v cosign >/dev/null 2>&1; then
    echo "❌ ERROR: cosign is required in PATH"
    echo "   Install: https://docs.sigstore.dev/cosign/installation/"
    exit 1
fi

# Check manifest exists
if [[ ! -f "$MANIFEST" ]]; then
    echo "❌ ERROR: Manifest not found: $MANIFEST"
    exit 1
fi

# Check bundle exists
if [[ ! -f "$BUNDLE" ]]; then
    echo "❌ ERROR: Bundle not found: $BUNDLE"
    exit 1
fi

echo "📄 Manifest: $MANIFEST"
echo "📦 Bundle:   $BUNDLE"

if [[ -n "$PUBKEY" ]]; then
    echo "🔑 Public Key: $PUBKEY"
    echo ""

    if [[ ! -f "$PUBKEY" ]]; then
        echo "❌ ERROR: Public key not found: $PUBKEY"
        exit 1
    fi

    cosign verify-blob \
        --key "$PUBKEY" \
        --bundle "$BUNDLE" \
        "$MANIFEST" >/dev/null

    echo ""
    echo "✅ Signature verification OK"
else
    echo ""
    echo "❌ ERROR: Public key required for deterministic runtime verification."
    echo ""
    echo "For key-based verification:"
    echo "  1. Generate keypair: cosign generate-key-pair"
    echo "  2. Store public key: artifacts/speclock/cosign.pub"
    echo "  3. Set: TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH=artifacts/speclock/cosign.pub"
    echo ""
    echo "For keyless (OIDC) verification, identity constraints must be specified."
    echo "In sovereign/government deployments, key-based signing is recommended."
    exit 2
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ SpecLock Manifest Verified (MYTHIC TIER COMPLETE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
