#!/bin/bash
# ============================================================================
# RS256 Key Generation Script
# ============================================================================
# Purpose: Generate RSA-2048 key pairs for JWT RS256 signing
# Usage: ./generate-keys.sh [--kid <key_id>] [--output-dir <path>]
# Security: Private keys stored in ops/keys/rs256/ (gitignored)
#           Public keys exported to JWKS format for auth/jwks/
# ============================================================================

set -euo pipefail

# Default configuration
DEFAULT_KID="tfos_2025_kid1"
DEFAULT_OUTPUT_DIR="ops/keys/rs256"
KEY_SIZE=2048
ALGORITHM="RS256"

# Parse command line arguments
KID="${1:-$DEFAULT_KID}"
OUTPUT_DIR="${2:-$DEFAULT_OUTPUT_DIR}"

echo "========================================"
echo "RS256 Key Generation"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Key ID (kid):     $KID"
echo "  Algorithm:        $ALGORITHM"
echo "  Key Size:         $KEY_SIZE bits"
echo "  Output Directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate RSA private key
PRIVATE_KEY="$OUTPUT_DIR/${KID}_private.pem"
PUBLIC_KEY="$OUTPUT_DIR/${KID}_public.pem"

echo "[1/6] Generating RSA private key..."
openssl genrsa -out "$PRIVATE_KEY" $KEY_SIZE 2>/dev/null

echo "[2/6] Extracting public key..."
openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY" 2>/dev/null

echo "[3/6] Setting secure permissions..."
chmod 600 "$PRIVATE_KEY"  # Private key: owner read/write only
chmod 644 "$PUBLIC_KEY"   # Public key: world-readable

# Extract modulus (n) and exponent (e) for JWKS
echo "[4/6] Extracting JWKS components..."

# Get modulus (n) - remove header/footer, decode base64, encode base64url
MODULUS=$(openssl rsa -in "$PRIVATE_KEY" -noout -modulus 2>/dev/null | \
          sed 's/Modulus=//' | \
          xxd -r -p | \
          base64 | \
          tr '+/' '-_' | \
          tr -d '=\n')

# Get exponent (e) - typically 65537 (0x010001)
EXPONENT=$(printf '%s' "AQAB")  # Base64url of 65537

# Generate JWKS JSON
JWKS_FILE="$OUTPUT_DIR/${KID}_jwks.json"

echo "[5/6] Creating JWKS file..."
cat > "$JWKS_FILE" <<EOF
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "$KID",
      "alg": "$ALGORITHM",
      "n": "$MODULUS",
      "e": "$EXPONENT"
    }
  ]
}
EOF

# Generate key metadata
METADATA_FILE="$OUTPUT_DIR/${KID}_metadata.json"

echo "[6/6] Creating key metadata..."
cat > "$METADATA_FILE" <<EOF
{
  "kid": "$KID",
  "algorithm": "$ALGORITHM",
  "key_size": $KEY_SIZE,
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "active",
  "usage": "JWT signing for TerraFusion OS 1.0",
  "private_key": "$PRIVATE_KEY",
  "public_key": "$PUBLIC_KEY",
  "jwks_file": "$JWKS_FILE",
  "rotation_schedule": "annual",
  "next_rotation": "$(date -u -d '+1 year' +"%Y-%m-%dT%H:%M:%SZ")",
  "security_notes": [
    "Private key stored with 600 permissions (owner-only access)",
    "Public key exported in JWKS format for verifiers",
    "Rotate keys annually or on compromise",
    "Keep at least 2 keys active during rotation (dual-sign window)"
  ]
}
EOF

# Verify key generation
echo ""
echo "========================================"
echo "✅ Key Generation Complete"
echo "========================================"
echo ""
echo "Files created:"
echo "  Private Key: $PRIVATE_KEY (600 permissions)"
echo "  Public Key:  $PUBLIC_KEY (644 permissions)"
echo "  JWKS:        $JWKS_FILE"
echo "  Metadata:    $METADATA_FILE"
echo ""
echo "Key Details:"
openssl rsa -in "$PRIVATE_KEY" -noout -text 2>/dev/null | grep -E "Private-Key:|publicExponent:"
echo ""
echo "Next Steps:"
echo "  1. Copy JWKS to auth service: cp $JWKS_FILE auth/jwks/jwks.json"
echo "  2. Configure auth service to use private key: $PRIVATE_KEY"
echo "  3. Set environment variable: JWT_PRIVATE_KEY_PATH=$PRIVATE_KEY"
echo "  4. Set kid in auth config: JWT_KID=$KID"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "  - Never commit private keys to version control"
echo "  - Add '$OUTPUT_DIR/*_private.pem' to .gitignore"
echo "  - Rotate keys annually or on suspected compromise"
echo "  - Use secrets management (Vault, AWS Secrets Manager) in production"
echo ""

# Test key pair (sign and verify)
echo "Testing key pair (sign + verify)..."
TEST_DATA="TerraFusion RS256 Test"
TEST_SIG="$OUTPUT_DIR/${KID}_test.sig"

# Sign with private key
echo -n "$TEST_DATA" | openssl dgst -sha256 -sign "$PRIVATE_KEY" -out "$TEST_SIG" 2>/dev/null

# Verify with public key
if echo -n "$TEST_DATA" | openssl dgst -sha256 -verify "$PUBLIC_KEY" -signature "$TEST_SIG" 2>/dev/null; then
    echo "✅ Key pair validation: PASSED"
    rm "$TEST_SIG"
else
    echo "❌ Key pair validation: FAILED"
    exit 1
fi

echo ""
echo "🎉 RS256 key generation successful!"
echo ""
