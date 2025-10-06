# TerraFusion Design Ledger Specification

## Constitutional Design Sovereignty

The **Design Ledger** is a cryptographic audit log that ensures **immutable governance** of all design system changes. Every modification to `design/tokens.json` is recorded, signed, and verified, creating an unbroken chain of custody.

## Ledger Entry Schema

Each design change generates a JSON ledger entry:

```json
{
  "timestamp": "2025-10-02T14:30:00Z",
  "actor": "alice@terrafusion.dev",
  "commit": "a3f2c8d",
  "change": {
    "path": "colors.terra-primary",
    "before": "#4A6FDC",
    "after": "#5A7FEC"
  },
  "fingerprint": "sha256:3a4f9c...",
  "signature": "ed25519:9f8a2b..."
}
```

## Cryptographic Verification

### 1. Fingerprint Generation
```bash
sha256sum design/tokens.json > .trust-fabric/latest-fingerprint
```

### 2. Ed25519 Signature
```bash
# Generate key pair (once)
openssl genpkey -algorithm ED25519 -out .trust-fabric/signing-key.pem

# Sign fingerprint
openssl pkeyutl -sign -inkey .trust-fabric/signing-key.pem \
  -in .trust-fabric/latest-fingerprint -out .trust-fabric/latest-signature
```

### 3. Verification (CI Pipeline)
```bash
# Verify signature matches public key
openssl pkeyutl -verify -pubin -inkey .trust-fabric/public-key.pem \
  -sigfile .trust-fabric/latest-signature -in .trust-fabric/latest-fingerprint
```

## Policy Enforcement Hooks

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

if git diff --cached design/tokens.json | grep -q '^+'; then
  echo "⚠️  Design token change detected - ledger entry required"
  
  # Prompt for change justification
  read -p "Change reason: " REASON
  
  # Generate ledger entry
  ./tools/tf-designctl-node/bin/tf-designctl.js ledger-sign \
    --reason "$REASON"
fi
```

### CI Validation (GitHub Actions)
```yaml
- name: Verify Design Ledger
  run: |
    # Ensure all token changes have corresponding ledger entries
    if git diff origin/main design/tokens.json | grep -q '^+'; then
      ./scripts/verify-ledger-signature.sh || exit 1
    fi
```

## Ledger Storage

- **Location**: `.trust-fabric/ledger/`
- **Format**: One JSON file per change (e.g., `2025-10-02-143000.json`)
- **Versioning**: Git-tracked for historical audit

## Benefits

1. **Constitutional Governance**: Every design decision is recorded and auditable
2. **Tamper-Proof**: Cryptographic signatures prevent unauthorized changes
3. **Accountability**: Actor attribution for all modifications
4. **Rollback Safety**: SHA256 fingerprints enable precise state restoration
5. **Compliance**: Audit trail for regulatory requirements (SOC 2, ISO 27001)

## Implementation Priority

- ✅ Schema definition (this document)
- ✅ Example entry (see `examples/entry-2025-10-02.json`)
- 🔲 Signing script (`scripts/ledger-sign.sh`)
- 🔲 Verification script (`scripts/verify-ledger-signature.sh`)
- 🔲 Git hooks integration
- 🔲 CI pipeline enforcement
