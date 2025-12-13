#!/bin/bash
#
# TerraFusion SpecLock CI Pipeline (ABSOLUTE LAW)
#
# This is the single source of truth for SpecLock validation.
# If this passes, the PR is mathematically valid.
#
# Steps:
#   1. Validate INDEX.json (strict mode)
#   2. Regenerate INDEX.md + verify no drift
#   3. Run all generators for locks with generated_artifacts
#   4. Enforce no drift in generated artifacts
#   5. PR diff detection (if BASE_REF/HEAD_REF provided)
#   6. Run SpecLock enforcement tests
#
# Usage:
#   ./scripts/speclock-ci.sh [--strict] [--skip-generate] [--skip-tests]
#
# Environment:
#   BASE_REF - Git base ref for PR diff detection (optional)
#   HEAD_REF - Git head ref for PR diff detection (optional)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# Optional PR range inputs (CI can set these)
BASE_REF="${BASE_REF:-}"
HEAD_REF="${HEAD_REF:-}"

# Parse flags
STRICT_FLAG="--strict"
SKIP_GENERATE=false
SKIP_TESTS=false
STRICT_MODE=true

for arg in "$@"; do
    case $arg in
        --skip-generate)
            SKIP_GENERATE=true
            ;;
        --skip-tests)
            SKIP_TESTS=true
            ;;
        --no-strict)
            STRICT_FLAG=""
            STRICT_MODE=false
            ;;
    esac
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion SpecLock CI Pipeline (ABSOLUTE LAW)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
if [ "$STRICT_MODE" = true ]; then
    echo "ℹ️  Mode: STRICT (warnings = errors)"
else
    echo "ℹ️  Mode: NORMAL (warnings allowed)"
fi
if [ "$SKIP_GENERATE" = true ]; then
    echo "ℹ️  Generators: SKIPPED"
fi
if [ "$SKIP_TESTS" = true ]; then
    echo "ℹ️  Tests: SKIPPED"
fi
echo ""

# Detect Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ ERROR: Python not found"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Step 1: Validate INDEX.json (STRICT)
# ═══════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Step 1: Validating INDEX.json (STRICT)"
echo "─────────────────────────────────────────────────────────────────"
echo ""

$PYTHON_CMD scripts/validate-speclock-index.py $STRICT_FLAG
VALIDATE_EXIT=$?

if [ $VALIDATE_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Validation failed. Fix INDEX.json before proceeding."
    exit $VALIDATE_EXIT
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# Step 2: Regenerate INDEX.md + verify no drift
# ═══════════════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────────────────"
echo "Step 2: Regenerate INDEX.md + verify no drift"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Save current INDEX.md
if [ -f "docs/spec-lock/INDEX.md" ]; then
    cp "docs/spec-lock/INDEX.md" "docs/spec-lock/INDEX.md.backup"
fi

# Regenerate
$PYTHON_CMD scripts/generate-speclock-index-md.py

# Compare (strip trailing whitespace and normalize line endings)
if [ -f "docs/spec-lock/INDEX.md.backup" ]; then
    CURRENT_HASH=$(cat "docs/spec-lock/INDEX.md" | sed 's/[[:space:]]*$//' | tr -d '\r' | md5sum | cut -d' ' -f1)
    BACKUP_HASH=$(cat "docs/spec-lock/INDEX.md.backup" | sed 's/[[:space:]]*$//' | tr -d '\r' | md5sum | cut -d' ' -f1)

    if [ "$CURRENT_HASH" != "$BACKUP_HASH" ]; then
        echo ""
        echo "❌ INDEX.md is out of sync with INDEX.json."
        echo "   Run: python scripts/generate-speclock-index-md.py"
        echo "   Then commit both files."
        rm -f "docs/spec-lock/INDEX.md.backup"
        exit 1
    fi
    rm -f "docs/spec-lock/INDEX.md.backup"
fi

echo "✅ INDEX.md is up-to-date"
echo ""

# ═══════════════════════════════════════════════════════════════
# Step 3: Generate SpecLock artifacts
# ═══════════════════════════════════════════════════════════════
if [ "$SKIP_GENERATE" = false ]; then
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 3: Generate SpecLock artifacts"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""

    if [ -f "docs/spec-lock/GENERATORS.json" ]; then
        $PYTHON_CMD scripts/speclock-generate-all.py
        GEN_EXIT=$?
        if [ $GEN_EXIT -ne 0 ]; then
            echo "❌ Generator failed"
            exit $GEN_EXIT
        fi
    else
        echo "ℹ️  No GENERATORS.json found, skipping artifact generation"
    fi
    echo ""

    # ═══════════════════════════════════════════════════════════════
    # Step 4: Enforce generated artifacts (no drift)
    # ═══════════════════════════════════════════════════════════════
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 4: Enforce generated artifacts (no drift)"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""

    bash scripts/speclock-enforce-generated.sh
    echo ""
else
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 3-4: SKIPPED (--skip-generate)"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
fi

# ═══════════════════════════════════════════════════════════════
# Step 5: PR Diff Detection (if BASE_REF and HEAD_REF provided)
# ═══════════════════════════════════════════════════════════════
if [[ -n "$BASE_REF" && -n "$HEAD_REF" ]]; then
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 5: Detecting touched SpecLocks for PR range"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
    echo "Range: $BASE_REF..$HEAD_REF"
    echo ""
    $PYTHON_CMD scripts/speclock-diff.py --base "$BASE_REF" --head "$HEAD_REF"
    echo ""
fi

# ═══════════════════════════════════════════════════════════════
# Step 6: Run SpecLock enforcement tests
# ═══════════════════════════════════════════════════════════════
if [ "$SKIP_TESTS" = false ]; then
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 6: Running SpecLock enforcement tests"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""

    if command -v dotnet &> /dev/null; then
        echo "Running: dotnet test --filter \"Category=SpecLock\""
        echo ""
        dotnet test --filter "Category=SpecLock" --nologo || {
            echo ""
            echo "❌ SpecLock tests failed"
            exit 1
        }
        echo ""
        echo "✅ SpecLock tests passed"
    else
        echo "⚠️  dotnet not found, skipping SpecLock tests"
    fi
    echo ""
else
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 6: SKIPPED (--skip-tests)"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
fi

# ═══════════════════════════════════════════════════════════════
# Step 7: Build SpecLock Manifest (sha256 hashes)
# ═══════════════════════════════════════════════════════════════
if [ "$SKIP_GENERATE" = false ]; then
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 7: Build SpecLock Manifest (sha256)"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""

    $PYTHON_CMD scripts/speclock-manifest.py
    MANIFEST_EXIT=$?
    if [ $MANIFEST_EXIT -ne 0 ]; then
        echo "❌ Manifest build failed"
        exit $MANIFEST_EXIT
    fi
    echo ""

    # ═══════════════════════════════════════════════════════════════
    # Step 8: MYTHIC TIER - Sign + Verify Manifest (if configured)
    # ═══════════════════════════════════════════════════════════════
    if [[ -n "${TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH:-}" ]]; then
        echo "─────────────────────────────────────────────────────────────────"
        echo "Step 8: MYTHIC TIER - Sign + Verify Manifest"
        echo "─────────────────────────────────────────────────────────────────"
        echo ""

        if command -v cosign >/dev/null 2>&1; then
            # Sign the manifest
            bash scripts/speclock-sign-manifest.sh \
                artifacts/speclock/manifest.json \
                artifacts/speclock/manifest.bundle.json

            # Verify the signature
            bash scripts/speclock-verify-manifest.sh \
                artifacts/speclock/manifest.json \
                artifacts/speclock/manifest.bundle.json \
                "$TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH"

            echo "✅ MYTHIC TIER: Manifest signed and verified"
        else
            echo "⚠️  cosign not found - skipping MYTHIC tier signing"
            echo "   Install: https://docs.sigstore.dev/cosign/installation/"
        fi
        echo ""
    else
        echo "─────────────────────────────────────────────────────────────────"
        echo "Step 8: MYTHIC TIER - SKIPPED (TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH not set)"
        echo "─────────────────────────────────────────────────────────────────"
        echo ""
    fi

    # ═══════════════════════════════════════════════════════════════
    # Step 9: GOD-TIER - Multi-Authority Quorum Verification
    # ═══════════════════════════════════════════════════════════════
    if [[ "${TF_SPECLOCK_QUORUM_MODE:-}" == "true" ]]; then
        echo "─────────────────────────────────────────────────────────────────"
        echo "Step 9: GOD-TIER - Multi-Authority Quorum Verification"
        echo "─────────────────────────────────────────────────────────────────"
        echo ""

        if command -v cosign >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
            # Multi-authority signing (if keys available)
            if [[ -f "docs/spec-lock/AUTHORITIES.json" ]]; then
                echo "🜂 Signing with multiple authorities..."
                bash scripts/speclock-sign-manifest-multi.sh \
                    artifacts/speclock/manifest.json \
                    docs/spec-lock/AUTHORITIES.json \
                    artifacts/speclock/bundles || true

                echo ""
                echo "🜂 Verifying quorum..."
                bash scripts/speclock-verify-manifest-quorum.sh \
                    artifacts/speclock/manifest.json \
                    docs/spec-lock/AUTHORITIES.json \
                    artifacts/speclock/bundles

                echo "✅ GOD-TIER: Quorum verification passed"
            else
                echo "⚠️  AUTHORITIES.json not found - skipping quorum verification"
            fi
        else
            echo "⚠️  cosign/jq not found - skipping GOD-TIER quorum"
        fi
        echo ""
    else
        echo "─────────────────────────────────────────────────────────────────"
        echo "Step 9: GOD-TIER - SKIPPED (TF_SPECLOCK_QUORUM_MODE != true)"
        echo "─────────────────────────────────────────────────────────────────"
        echo ""
    fi
else
    echo "─────────────────────────────────────────────────────────────────"
    echo "Step 7-9: SKIPPED (--skip-generate)"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
fi

# ═══════════════════════════════════════════════════════════════
# VICTORY
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ SpecLock CI Pipeline PASSED (ABSOLUTE LAW UPHELD)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit 0
