#!/usr/bin/env bash
# =============================================================================
# SpecLock Quorum Verification (GOD-TIER)
# =============================================================================
# Verifies SpecLock manifest against MULTIPLE authority signatures.
# Enforces:
#   - Quorum: minimum N signatures required
#   - Federation: at least one required_authority must sign
#   - Time window: manifest nbf <= now <= exp (if present)
#
# Usage:
#   ./scripts/speclock-verify-manifest-quorum.sh [manifest] [authorities] [bundle_dir]
#
# Exit codes:
#   0 - Quorum satisfied
#   1 - General error
#   2 - Quorum not met
#   3 - Time window violation
#   4 - Required authority missing
# =============================================================================

set -euo pipefail

MANIFEST="${1:-artifacts/speclock/manifest.json}"
AUTH_FILE="${2:-docs/spec-lock/AUTHORITIES.json}"
BUNDLE_DIR="${3:-artifacts/speclock/bundles}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🜂 SpecLock Quorum Verification (GOD-TIER)"
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

echo "📄 Manifest:    $MANIFEST"
echo "🔑 Authorities: $AUTH_FILE"
echo "📦 Bundle Dir:  $BUNDLE_DIR"
echo ""

# ═══════════════════════════════════════════════════════════════
# Step 1: Time Window Verification (GOD-TIER)
# ═══════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Step 1: Time Window Verification"
echo "─────────────────────────────────────────────────────────────────"

now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
nbf=$(jq -r '.nbf // ""' "$MANIFEST")
exp=$(jq -r '.exp // ""' "$MANIFEST")

echo "   Now: $now"
echo "   NBF: ${nbf:-"(not set)"}"
echo "   EXP: ${exp:-"(not set)"}"

if [[ -n "$nbf" && "$now" < "$nbf" ]]; then
    echo ""
    echo "❌ Manifest not yet valid (nbf=$nbf, now=$now)"
    exit 3
fi

if [[ -n "$exp" && "$now" > "$exp" ]]; then
    echo ""
    echo "❌ Manifest expired (exp=$exp, now=$now)"
    exit 3
fi

echo "✅ Time window OK"
echo ""

# ═══════════════════════════════════════════════════════════════
# Step 2: Signature Quorum Verification
# ═══════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Step 2: Signature Quorum Verification"
echo "─────────────────────────────────────────────────────────────────"

quorum=$(jq -r '.quorum // 1' "$AUTH_FILE")
echo "   Required quorum: $quorum"
echo ""

verified_count=0
verified_ids=()

# Get required authorities (federated constraint)
required_authorities=$(jq -r '.federated_quorum.required_authorities[]? // empty' "$AUTH_FILE" 2>/dev/null || echo "")
hit_required=0

# Verify each active authority
while IFS= read -r auth; do
    id=$(echo "$auth" | jq -r '.id')
    name=$(echo "$auth" | jq -r '.name')
    pub_key_path=$(echo "$auth" | jq -r '.public_key_path')
    valid_from=$(echo "$auth" | jq -r '.valid_from // ""')
    valid_to=$(echo "$auth" | jq -r '.valid_to // ""')

    bundle="$BUNDLE_DIR/manifest.$id.bundle.json"

    # Skip if bundle doesn't exist
    if [[ ! -f "$bundle" ]]; then
        echo "   ⚪ $name ($id): no bundle found"
        continue
    fi

    # Skip if public key doesn't exist
    if [[ ! -f "$pub_key_path" ]]; then
        echo "   ⚠️  $name ($id): public key not found at $pub_key_path"
        continue
    fi

    # Check authority validity period
    if [[ -n "$valid_from" && "$now" < "$valid_from" ]]; then
        echo "   ⚠️  $name ($id): authority not yet valid"
        continue
    fi

    if [[ -n "$valid_to" && "$now" > "$valid_to" ]]; then
        echo "   ⚠️  $name ($id): authority expired"
        continue
    fi

    # Verify signature
    if cosign verify-blob --key "$pub_key_path" --bundle "$bundle" "$MANIFEST" >/dev/null 2>&1; then
        echo "   ✅ $name ($id): VERIFIED"
        verified_count=$((verified_count + 1))
        verified_ids+=("$id")

        # Check if this is a required authority
        for req in $required_authorities; do
            if [[ "$id" == "$req" ]]; then
                hit_required=1
            fi
        done
    else
        echo "   ❌ $name ($id): verification failed"
    fi
done < <(jq -c '.authorities[] | select(.active==true)' "$AUTH_FILE")

echo ""

# ═══════════════════════════════════════════════════════════════
# Step 3: Evaluate Results
# ═══════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Step 3: Evaluate Results"
echo "─────────────────────────────────────────────────────────────────"

echo "   Verified: $verified_count / $quorum required"
echo "   Signers:  ${verified_ids[*]:-"(none)"}"
echo ""

# Check federated constraint
if [[ -n "$required_authorities" && "$hit_required" -eq 0 ]]; then
    echo "❌ Required authority missing (federated constraint)"
    echo "   Required: $required_authorities"
    exit 4
fi

# Check quorum
if [[ "$verified_count" -lt "$quorum" ]]; then
    echo "❌ Quorum not met ($verified_count/$quorum)"
    exit 2
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Quorum Satisfied ($verified_count/$quorum)"
if [[ -n "$required_authorities" ]]; then
    echo "  ✅ Federated Constraint Satisfied"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
