#!/usr/bin/env python3
"""
TerraFusion FOIA Bundle Generator (GOD-TIER)

Generates a complete FOIA-compliant verification bundle for a receipt.

Usage:
  python foia_bundle.py receipt.json --artifact artifact.bin --manifest manifest.json --out bundle.zip

Bundle contents:
  - receipt.json       (signed receipt)
  - artifact.bin       (original artifact)
  - manifest.json      (SpecLock manifest at issuance)
  - proof.json         (cryptographic proof chain)
  - VERIFY.md          (human-readable instructions)
  - signature.sig      (raw signature, if applicable)
  - bundle.json        (cosign bundle, if applicable)
"""

import argparse
import hashlib
import json
import shutil
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

def sha256_hex(data: bytes) -> str:
    """Compute lowercase hex SHA-256."""
    return hashlib.sha256(data).hexdigest().lower()

def load_json(path: Path) -> dict[str, Any]:
    """Load and parse JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_verify_md(receipt: dict[str, Any]) -> str:
    """Generate human-readable verification instructions."""
    return f"""# TerraFusion Receipt Verification Instructions

## Receipt Information

- **Receipt ID:** {receipt.get('receipt_id', 'N/A')}
- **Issued:** {receipt.get('issued_at', 'N/A')}
- **Valid From:** {receipt.get('nbf', 'N/A')}
- **Expires:** {receipt.get('exp', 'N/A')}
- **Artifact Type:** {receipt.get('artifact', {}).get('type', 'N/A')}
- **Signing Mode:** {receipt.get('signing', {}).get('mode', 'N/A')}

## Verification Steps

### Step 1: Verify Artifact Hash

The artifact file included in this bundle should have the following SHA-256 hash:

```
{receipt.get('artifact', {}).get('sha256', 'N/A')}
```

To verify on Linux/macOS:
```bash
sha256sum artifact.bin
```

To verify on Windows (PowerShell):
```powershell
Get-FileHash artifact.bin -Algorithm SHA256
```

### Step 2: Verify Time Window

The receipt is valid from `{receipt.get('nbf', 'N/A')}` until `{receipt.get('exp', 'N/A')}`.

### Step 3: Verify SpecLock Manifest

The receipt references SpecLock manifest with hash:
```
{receipt.get('speclock_manifest_sha256', 'N/A')}
```

Verify the manifest.json file has this hash:
```bash
sha256sum manifest.json
```

### Step 4: Verify Signature

The receipt was signed using **{receipt.get('signing', {}).get('mode', 'unknown')}** mode.

#### For COSMIC TSS signatures:

```bash
speclock-tss verify \\
  --digest proof.json \\
  --signature signature.sig \\
  --group-pub <group_public_key>
```

#### For MYTHIC Cosign signatures:

```bash
cosign verify-blob \\
  --bundle bundle.json \\
  --certificate-identity <identity> \\
  --certificate-oidc-issuer <issuer> \\
  receipt.json
```

## Online Verification

You can also verify this receipt online at:

```
{receipt.get('proof_url', '/public/proof/' + receipt.get('receipt_id', ''))}
```

## CLI Verification

For complete offline verification, use the TerraFusion receipt verifier:

```bash
python verify.py receipt.json --artifact artifact.bin --manifest manifest.json --offline
```

## Contact

For questions about this receipt or verification process, contact:
- TerraFusion Support: support@terrafusion.gov
- County Assessor's Office

---

**Government. Transcended.**

Bundle generated: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
"""

def generate_proof_json(receipt: dict[str, Any], manifest_path: Path | None) -> dict[str, Any]:
    """Generate cryptographic proof chain document."""
    proof = {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        "receipt_id": receipt.get("receipt_id"),
        "verification_chain": [
            {
                "step": 1,
                "name": "artifact_integrity",
                "artifact_sha256": receipt.get("artifact", {}).get("sha256"),
                "artifact_type": receipt.get("artifact", {}).get("type")
            },
            {
                "step": 2,
                "name": "time_window",
                "nbf": receipt.get("nbf"),
                "exp": receipt.get("exp"),
                "issued_at": receipt.get("issued_at")
            },
            {
                "step": 3,
                "name": "manifest_anchor",
                "speclock_manifest_sha256": receipt.get("speclock_manifest_sha256")
            },
            {
                "step": 4,
                "name": "signature",
                "mode": receipt.get("signing", {}).get("mode"),
                "signature_sha256": receipt.get("signing", {}).get("signature_sha256")
            }
        ],
        "signing_details": receipt.get("signing", {})
    }

    # Add manifest hash verification if available
    if manifest_path and manifest_path.exists():
        with open(manifest_path, "rb") as f:
            actual_hash = sha256_hex(f.read())
        proof["manifest_hash_verified"] = actual_hash == receipt.get("speclock_manifest_sha256")
        proof["manifest_hash_actual"] = actual_hash

    return proof

def create_foia_bundle(
    receipt_path: Path,
    artifact_path: Path | None,
    manifest_path: Path | None,
    signature_path: Path | None,
    cosign_bundle_path: Path | None,
    output_path: Path
) -> None:
    """Create a FOIA-compliant verification bundle."""

    print("═" * 60)
    print("  TerraFusion FOIA Bundle Generator (GOD-TIER)")
    print("═" * 60)

    # Load receipt
    receipt = load_json(receipt_path)
    print(f"\n📋 Receipt: {receipt.get('receipt_id')}")

    # Create zip bundle
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add receipt
        print("   📄 Adding receipt.json")
        zf.write(receipt_path, "receipt.json")

        # Add artifact if provided
        if artifact_path and artifact_path.exists():
            print(f"   📄 Adding artifact.bin ({artifact_path.name})")
            zf.write(artifact_path, "artifact.bin")
        else:
            print("   ⚠️  No artifact provided")

        # Add manifest if provided
        if manifest_path and manifest_path.exists():
            print("   📄 Adding manifest.json")
            zf.write(manifest_path, "manifest.json")
        else:
            print("   ⚠️  No manifest provided")

        # Generate and add proof.json
        print("   📄 Generating proof.json")
        proof = generate_proof_json(receipt, manifest_path)
        zf.writestr("proof.json", json.dumps(proof, indent=2, sort_keys=True))

        # Generate and add VERIFY.md
        print("   📄 Generating VERIFY.md")
        verify_md = generate_verify_md(receipt)
        zf.writestr("VERIFY.md", verify_md)

        # Add signature if provided
        if signature_path and signature_path.exists():
            print("   📄 Adding signature.sig")
            zf.write(signature_path, "signature.sig")

        # Add cosign bundle if provided
        if cosign_bundle_path and cosign_bundle_path.exists():
            print("   📄 Adding bundle.json")
            zf.write(cosign_bundle_path, "bundle.json")

    # Report bundle size
    bundle_size = output_path.stat().st_size
    print(f"\n✅ Bundle created: {output_path}")
    print(f"   Size: {bundle_size:,} bytes")

    # List contents
    print("\n📦 Bundle contents:")
    with zipfile.ZipFile(output_path, 'r') as zf:
        for info in zf.infolist():
            print(f"   - {info.filename} ({info.file_size:,} bytes)")

def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion FOIA Bundle Generator (GOD-TIER)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("receipt", type=Path, help="Path to receipt JSON file")
    parser.add_argument("--artifact", type=Path, help="Path to original artifact file")
    parser.add_argument("--manifest", type=Path, help="Path to SpecLock manifest JSON")
    parser.add_argument("--signature", type=Path, help="Path to raw signature file")
    parser.add_argument("--cosign-bundle", type=Path, help="Path to Cosign bundle JSON")
    parser.add_argument("--out", type=Path, default=Path("foia_bundle.zip"), help="Output bundle path")

    args = parser.parse_args()

    if not args.receipt.exists():
        print(f"❌ ERROR: Receipt file not found: {args.receipt}")
        sys.exit(2)

    create_foia_bundle(
        receipt_path=args.receipt,
        artifact_path=args.artifact,
        manifest_path=args.manifest,
        signature_path=args.signature,
        cosign_bundle_path=args.cosign_bundle,
        output_path=args.out
    )

if __name__ == "__main__":
    main()
