#!/usr/bin/env bash
# =============================================================================
# SpecLock Sign Manifest (MYTHIC TIER)
# =============================================================================
# Signs the SpecLock manifest using Cosign.
# Produces a bundle file containing signature + Rekor inclusion proof.
#
# Usage:
#   ./scripts/speclock-sign-manifest.sh [manifest] [bundle]
#
# Environment:
#   COSIGN_KEY - Path to private key (for key-based signing)
#   COSIGN_PASSWORD - Password for private key (if encrypted)
#   (If COSIGN_KEY not set, uses keyless OIDC signing)
# =============================================================================

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
BUNDLE="${2:-artifacts/speclock/manifest.bundle.json}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🜂 SpecLock Manifest Signing (MYTHIC TIER)"
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
    echo "   Run: python scripts/speclock-manifest.py"
    exit 1
fi

# Ensure output directory exists
mkdir -p "$(dirname "$BUNDLE")"

echo "📄 Manifest: $MANIFEST"
echo "📦 Bundle:   $BUNDLE"
echo ""

# Keyless vs key-pair signing
if [[ -n "${COSIGN_KEY:-}" ]]; then
    echo "🔑 Using key-based signing: $COSIGN_KEY"
    echo ""

    cosign sign-blob \
        --key "$COSIGN_KEY" \
        --bundle "$BUNDLE" \
        "$MANIFEST"
else
    echo "🌐 Using keyless (OIDC) signing"
    echo "   (Requires OIDC identity configured in CI)"
    echo ""

    cosign sign-blob \
        --bundle "$BUNDLE" \
        "$MANIFEST"
fi

echo ""
echo "✅ Bundle written: $BUNDLE"
echo ""

# Display bundle info
if command -v jq >/dev/null 2>&1; then
    echo "Bundle metadata:"
    jq -r '.rekorBundle.Payload.logID // "N/A"' "$BUNDLE" 2>/dev/null || true
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ SpecLock Manifest Signed (MYTHIC TIER COMPLETE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
