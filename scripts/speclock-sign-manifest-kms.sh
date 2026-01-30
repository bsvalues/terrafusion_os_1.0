#!/usr/bin/env bash
# =============================================================================
# SpecLock KMS Sign (GOD-TIER)
# =============================================================================
# Signs the SpecLock manifest using hardware-backed KMS keys.
# Supports: AWS KMS, Azure Key Vault, GCP KMS
# NO PRIVATE KEYS ON DISK. EVER.
#
# Usage:
#   ./scripts/speclock-sign-manifest-kms.sh [manifest] [authorities] [out_dir]
#
# Prerequisites:
#   - AWS: aws configure + IAM permissions for kms:Sign
#   - Azure: az login + Key Vault access policy
#   - GCP: gcloud auth + KMS cryptoKeyVersions.useToSign
# =============================================================================

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
AUTH_FILE="${2:-docs/spec-lock/AUTHORITIES.json}"
OUT_DIR="${3:-artifacts/speclock/bundles}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🔐 SpecLock KMS Signing (GOD-TIER)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for cosign
if ! command -v cosign >/dev/null 2>&1; then
    echo "❌ ERROR: cosign is required in PATH"
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

sign_count=0

# Process each active authority with KMS config
while IFS= read -r auth; do
    id=$(echo "$auth" | jq -r '.id')
    name=$(echo "$auth" | jq -r '.name')
    provider=$(echo "$auth" | jq -r '.kms.provider // "local"')
    key_ref=$(echo "$auth" | jq -r '.kms.key_ref // ""')

    bundle="$OUT_DIR/manifest.$id.bundle.json"

    # Skip local keys (handled by speclock-sign-manifest-multi.sh)
    if [[ "$provider" == "local" ]]; then
        echo "⚪ $name ($id): local key (use speclock-sign-manifest-multi.sh)"
        continue
    fi

    echo "─────────────────────────────────────────────────────────────────"
    echo "🔐 KMS-Signing as: $name ($id)"
    echo "   Provider: $provider"
    echo "   Key Ref:  $key_ref"
    echo ""

    case "$provider" in
        aws)
            # AWS KMS signing
            echo "   Using AWS KMS..."
            cosign sign-blob \
                --key "awskms://$key_ref" \
                --bundle "$bundle" \
                "$MANIFEST"
            ;;
        azure)
            # Azure Key Vault signing
            echo "   Using Azure Key Vault..."
            cosign sign-blob \
                --key "azurekms://$key_ref" \
                --bundle "$bundle" \
                "$MANIFEST"
            ;;
        gcp)
            # Google Cloud KMS signing
            echo "   Using GCP KMS..."
            cosign sign-blob \
                --key "gcpkms://$key_ref" \
                --bundle "$bundle" \
                "$MANIFEST"
            ;;
        *)
            echo "   ⚠️  Unsupported KMS provider: $provider"
            continue
            ;;
    esac

    if [[ -f "$bundle" ]]; then
        sign_count=$((sign_count + 1))
        echo "   ✅ Signed: $bundle"
    else
        echo "   ❌ Failed to create bundle"
    fi
    echo ""
done < <(jq -c '.authorities[] | select(.active==true)' "$AUTH_FILE")

echo "═══════════════════════════════════════════════════════════════"
if [[ "$sign_count" -eq 0 ]]; then
    echo "  ⚠️  No KMS signatures produced"
    echo "  (Use speclock-sign-manifest-multi.sh for local keys)"
else
    echo "  ✅ KMS Signing Complete ($sign_count signatures)"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
