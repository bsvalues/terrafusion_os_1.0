#!/usr/bin/env bash
# =============================================================================
# SpecLock Multi-Authority Sign (GOD-TIER)
# =============================================================================
# Signs the SpecLock manifest with MULTIPLE authorities (dual-sign / N-sign).
# Produces one bundle per authority in the bundles directory.
#
# Usage:
#   ./scripts/speclock-sign-manifest-multi.sh [manifest] [authorities] [out_dir]
#
# Example:
#   ./scripts/speclock-sign-manifest-multi.sh \
#       artifacts/speclock/manifest.json \
#       docs/spec-lock/AUTHORITIES.json \
#       artifacts/speclock/bundles
#
# Environment:
#   COSIGN_PASSWORD - Password for encrypted private keys (if any)
# =============================================================================

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
AUTH_FILE="${2:-docs/spec-lock/AUTHORITIES.json}"
OUT_DIR="${3:-artifacts/speclock/bundles}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🜂 SpecLock Multi-Authority Signing (GOD-TIER)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for cosign
if ! command -v cosign >/dev/null 2>&1; then
    echo "❌ ERROR: cosign is required in PATH"
    echo "   Install: https://docs.sigstore.dev/cosign/installation/"
    exit 1
fi

# Check for jq
if ! command -v jq >/dev/null 2>&1; then
    echo "❌ ERROR: jq is required in PATH"
    exit 1
fi

# Check manifest exists
if [[ ! -f "$MANIFEST" ]]; then
    echo "❌ ERROR: Manifest not found: $MANIFEST"
    echo "   Run: python scripts/speclock-manifest.py"
    exit 1
fi

# Check authorities file exists
if [[ ! -f "$AUTH_FILE" ]]; then
    echo "❌ ERROR: Authorities file not found: $AUTH_FILE"
    exit 1
fi

# Create output directory
mkdir -p "$OUT_DIR"

echo "📄 Manifest:    $MANIFEST"
echo "🔑 Authorities: $AUTH_FILE"
echo "📦 Output Dir:  $OUT_DIR"
echo ""

# Get active authorities
authorities=$(jq -c '.authorities[] | select(.active==true)' "$AUTH_FILE")
sign_count=0

while IFS= read -r auth; do
    id=$(echo "$auth" | jq -r '.id')
    name=$(echo "$auth" | jq -r '.name')
    provider=$(echo "$auth" | jq -r '.kms.provider // "local"')
    key_ref=$(echo "$auth" | jq -r '.kms.key_ref // ""')
    pub_key_path=$(echo "$auth" | jq -r '.public_key_path')

    bundle="$OUT_DIR/manifest.$id.bundle.json"

    echo "─────────────────────────────────────────────────────────────────"
    echo "🜂 Signing as: $name ($id)"
    echo "   Provider:  $provider"
    echo "   Bundle:    $bundle"
    echo ""

    case "$provider" in
        local)
            # Local key file (for development)
            if [[ -z "$key_ref" || ! -f "$key_ref" ]]; then
                echo "⚠️  Local key not found: $key_ref (skipping)"
                continue
            fi
            cosign sign-blob --key "$key_ref" --bundle "$bundle" "$MANIFEST"
            ;;
        aws)
            # AWS KMS
            cosign sign-blob --key "awskms://$key_ref" --bundle "$bundle" "$MANIFEST"
            ;;
        azure)
            # Azure Key Vault
            cosign sign-blob --key "azurekms://$key_ref" --bundle "$bundle" "$MANIFEST"
            ;;
        gcp)
            # Google Cloud KMS
            cosign sign-blob --key "gcpkms://$key_ref" --bundle "$bundle" "$MANIFEST"
            ;;
        *)
            echo "⚠️  Unknown KMS provider: $provider (skipping)"
            continue
            ;;
    esac

    sign_count=$((sign_count + 1))
    echo "✅ Signed: $bundle"
    echo ""
done <<< "$authorities"

echo "═══════════════════════════════════════════════════════════════"
if [[ "$sign_count" -eq 0 ]]; then
    echo "  ❌ No signatures produced (check key availability)"
    exit 1
else
    echo "  ✅ Multi-Authority Signing Complete ($sign_count signatures)"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
