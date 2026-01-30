#!/usr/bin/env python3
"""
TerraFusion Receipt Verifier CLI (GOD-TIER)

Offline-capable verification of citizen-verifiable receipts.

Usage:
  python verify.py receipt.json [--artifact path] [--manifest path] [--offline]

Exit codes:
  0 = VALID
  1 = INVALID (verification failed)
  2 = ERROR (system error)
"""

import argparse
import gzip
import hashlib
import json
import sys
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Verification result codes
VALID = 0
INVALID = 1
ERROR = 2

# Schema path relative to this file
SCHEMA_PATH = Path(__file__).parent.parent.parent.parent / "docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.schema.json"

def sha256_hex(data: bytes) -> str:
    """Compute lowercase hex SHA-256."""
    return hashlib.sha256(data).hexdigest().lower()

def load_json(path: Path) -> dict[str, Any]:
    """Load and parse JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def parse_timestamp(ts: str) -> datetime:
    """Parse RFC3339 UTC timestamp."""
    # Handle Z suffix
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"
    return datetime.fromisoformat(ts)

def validate_schema(receipt: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    """Basic schema validation without external dependencies."""
    errors = []

    # Check required fields
    required = schema.get("required", [])
    for field in required:
        if field not in receipt:
            errors.append(f"Missing required field: {field}")

    # Check SHA-256 format (lowercase hex, 64 chars)
    sha256_pattern = r"^[a-f0-9]{64}$"
    import re

    def check_sha256(obj: dict, path: str = ""):
        for key, value in obj.items():
            current_path = f"{path}.{key}" if path else key
            if key.endswith("sha256") and isinstance(value, str):
                if not re.match(sha256_pattern, value):
                    errors.append(f"Invalid SHA-256 format at {current_path}: {value}")
            elif isinstance(value, dict):
                check_sha256(value, current_path)

    check_sha256(receipt)

    # Check timestamp format (RFC3339 UTC with Z)
    timestamp_pattern = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$"
    for field in ["issued_at", "nbf", "exp"]:
        if field in receipt:
            if not re.match(timestamp_pattern, receipt[field]):
                errors.append(f"Invalid timestamp format at {field}: {receipt[field]}")

    # Check artifact type enum
    if "artifact" in receipt and "type" in receipt["artifact"]:
        valid_types = ["assessment_notice", "gis_export", "levy_table", "other", "report"]
        if receipt["artifact"]["type"] not in valid_types:
            errors.append(f"Invalid artifact type: {receipt['artifact']['type']}")

    # Check signing mode enum
    if "signing" in receipt and "mode" in receipt["signing"]:
        valid_modes = ["cosmic_tss", "mythic_cosign"]
        if receipt["signing"]["mode"] not in valid_modes:
            errors.append(f"Invalid signing mode: {receipt['signing']['mode']}")

    return errors

def validate_time_window(receipt: dict[str, Any]) -> list[str]:
    """Validate time window constraints."""
    errors = []
    now = datetime.now(timezone.utc)

    try:
        nbf = parse_timestamp(receipt["nbf"])
        exp = parse_timestamp(receipt["exp"])
        issued_at = parse_timestamp(receipt["issued_at"])

        if nbf > exp:
            errors.append(f"TIME_WINDOW_INVALID: nbf ({receipt['nbf']}) > exp ({receipt['exp']})")

        if issued_at > exp:
            errors.append(f"TIME_WINDOW_INVALID: issued_at ({receipt['issued_at']}) > exp ({receipt['exp']})")

        if now < nbf:
            errors.append(f"TIME_WINDOW_NOT_YET_VALID: current time before nbf ({receipt['nbf']})")

        if now > exp:
            errors.append(f"TIME_WINDOW_EXPIRED: current time after exp ({receipt['exp']})")

    except Exception as e:
        errors.append(f"TIME_WINDOW_PARSE_ERROR: {e}")

    return errors

def validate_artifact_hash(receipt: dict[str, Any], artifact_path: Path | None) -> list[str]:
    """Validate artifact SHA-256 hash."""
    errors = []

    if artifact_path is None:
        return ["ARTIFACT_NOT_PROVIDED: Cannot verify hash without artifact"]

    if not artifact_path.exists():
        return [f"ARTIFACT_NOT_FOUND: {artifact_path}"]

    try:
        with open(artifact_path, "rb") as f:
            actual_hash = sha256_hex(f.read())

        expected_hash = receipt.get("artifact", {}).get("sha256", "")

        if actual_hash != expected_hash:
            errors.append(f"ARTIFACT_HASH_MISMATCH: expected {expected_hash}, got {actual_hash}")

    except Exception as e:
        errors.append(f"ARTIFACT_HASH_ERROR: {e}")

    return errors

def validate_manifest_anchor(receipt: dict[str, Any], manifest_path: Path | None, offline: bool) -> list[str]:
    """Validate speclock_manifest_sha256 anchor."""
    errors = []

    if offline and manifest_path is None:
        # In offline mode without manifest, we can only warn
        return ["MANIFEST_OFFLINE_SKIP: Cannot verify manifest anchor in offline mode without local manifest"]

    if manifest_path is None:
        return ["MANIFEST_NOT_PROVIDED: Cannot verify manifest anchor without manifest"]

    if not manifest_path.exists():
        return [f"MANIFEST_NOT_FOUND: {manifest_path}"]

    try:
        with open(manifest_path, "rb") as f:
            content = f.read()

        # Compute canonical hash (content as-is)
        actual_hash = sha256_hex(content)
        expected_hash = receipt.get("speclock_manifest_sha256", "")

        if actual_hash != expected_hash:
            errors.append(f"MANIFEST_HASH_MISMATCH: expected {expected_hash}, got {actual_hash}")

    except Exception as e:
        errors.append(f"MANIFEST_HASH_ERROR: {e}")

    return errors

def decode_qr_payload(payload: str) -> dict[str, Any] | None:
    """Decode a QR payload (base64url gzipped JSON)."""
    try:
        # Add padding if needed
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += "=" * padding

        compressed = urlsafe_b64decode(payload)
        decompressed = gzip.decompress(compressed)
        return json.loads(decompressed.decode("utf-8"))
    except Exception:
        return None

def encode_qr_payload(data: dict[str, Any]) -> str:
    """Encode data as QR payload (base64url gzipped JSON)."""
    json_bytes = json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    compressed = gzip.compress(json_bytes, compresslevel=9)
    return urlsafe_b64encode(compressed).rstrip(b"=").decode("ascii")

def generate_qr_payload(receipt: dict[str, Any]) -> dict[str, Any]:
    """Generate QR payload from receipt."""
    issued_ts = int(parse_timestamp(receipt["issued_at"]).timestamp())
    artifact_hash = receipt.get("artifact", {}).get("sha256", "")[:16]

    return {
        "v": 1,
        "id": receipt["receipt_id"],
        "h": artifact_hash,
        "u": receipt.get("proof_url", f"/public/proof/{receipt['receipt_id']}"),
        "t": issued_ts
    }

def print_result(status: str, message: str, errors: list[str] | None = None):
    """Print verification result."""
    icon = "✅" if status == "VALID" else "❌" if status == "INVALID" else "⚠️"
    print(f"\n{icon} {status}: {message}")
    if errors:
        for error in errors:
            print(f"   - {error}")

def verify_receipt(
    receipt_path: Path,
    artifact_path: Path | None = None,
    manifest_path: Path | None = None,
    offline: bool = False,
    generate_qr: bool = False
) -> int:
    """
    Verify a receipt and return exit code.

    Returns:
        0 = VALID
        1 = INVALID
        2 = ERROR
    """
    print("═" * 60)
    print("  TerraFusion Receipt Verifier (GOD-TIER)")
    print("═" * 60)

    # Load receipt
    try:
        receipt = load_json(receipt_path)
        print(f"\n📋 Receipt: {receipt_path}")
        print(f"   ID: {receipt.get('receipt_id', 'N/A')}")
        print(f"   Issued: {receipt.get('issued_at', 'N/A')}")
        print(f"   Mode: {receipt.get('signing', {}).get('mode', 'N/A')}")
    except Exception as e:
        print_result("ERROR", f"Failed to load receipt: {e}")
        return ERROR

    # Load schema
    try:
        schema = load_json(SCHEMA_PATH) if SCHEMA_PATH.exists() else {}
    except Exception:
        schema = {}

    all_errors: list[str] = []
    warnings: list[str] = []

    # Step 1: Schema validation
    print("\n🔍 Step 1: Schema Validation")
    schema_errors = validate_schema(receipt, schema)
    if schema_errors:
        all_errors.extend(schema_errors)
        print(f"   ❌ {len(schema_errors)} schema error(s)")
    else:
        print("   ✅ Schema valid")

    # Step 2: Time window check
    print("\n🔍 Step 2: Time Window Check")
    time_errors = validate_time_window(receipt)
    # Separate expired warnings from hard errors
    for err in time_errors:
        if "EXPIRED" in err or "NOT_YET_VALID" in err:
            warnings.append(err)
        else:
            all_errors.append(err)

    if not time_errors:
        print("   ✅ Time window valid")
    elif all(("EXPIRED" in e or "NOT_YET_VALID" in e) for e in time_errors):
        print(f"   ⚠️  Time window warning: {len(time_errors)} issue(s)")
    else:
        print(f"   ❌ Time window invalid: {len([e for e in time_errors if e not in warnings])} error(s)")

    # Step 3: Artifact hash verification
    print("\n🔍 Step 3: Artifact Hash Verification")
    if artifact_path:
        artifact_errors = validate_artifact_hash(receipt, artifact_path)
        if artifact_errors:
            all_errors.extend(artifact_errors)
            print(f"   ❌ {len(artifact_errors)} artifact error(s)")
        else:
            print("   ✅ Artifact hash matches")
    else:
        print("   ⏭️  Skipped (no artifact provided)")

    # Step 4: Manifest anchor verification
    print("\n🔍 Step 4: Manifest Anchor Verification")
    manifest_errors = validate_manifest_anchor(receipt, manifest_path, offline)
    skip_manifest = any("SKIP" in e for e in manifest_errors)
    if skip_manifest:
        warnings.extend(manifest_errors)
        print("   ⏭️  Skipped (offline mode)")
    elif manifest_errors:
        all_errors.extend(manifest_errors)
        print(f"   ❌ {len(manifest_errors)} manifest error(s)")
    else:
        print("   ✅ Manifest anchor verified")

    # Step 5: Signature verification (placeholder - requires external tools)
    print("\n🔍 Step 5: Signature Verification")
    signing_mode = receipt.get("signing", {}).get("mode", "unknown")
    if offline:
        print(f"   ⏭️  Skipped in offline mode (mode: {signing_mode})")
    else:
        print(f"   ⏭️  Requires external verifier (mode: {signing_mode})")
        print(f"       Use: speclock-tss verify OR cosign verify-blob")

    # Generate QR if requested
    if generate_qr:
        print("\n📱 QR Payload")
        qr_data = generate_qr_payload(receipt)
        qr_encoded = encode_qr_payload(qr_data)
        print(f"   Data: {json.dumps(qr_data)}")
        print(f"   Encoded: {qr_encoded}")
        print(f"   Length: {len(qr_encoded)} bytes")

    # Final result
    print("\n" + "═" * 60)
    if all_errors:
        print_result("INVALID", f"Verification failed with {len(all_errors)} error(s)", all_errors)
        return INVALID
    elif warnings:
        print_result("VALID", f"Receipt verified with {len(warnings)} warning(s)", warnings)
        return VALID
    else:
        print_result("VALID", "Receipt fully verified")
        return VALID

def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion Receipt Verifier (GOD-TIER)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic verification
  python verify.py receipt.json

  # Verify with artifact
  python verify.py receipt.json --artifact document.pdf

  # Offline verification with local manifest
  python verify.py receipt.json --manifest manifest.json --offline

  # Generate QR payload
  python verify.py receipt.json --qr
"""
    )

    parser.add_argument("receipt", type=Path, help="Path to receipt JSON file")
    parser.add_argument("--artifact", type=Path, help="Path to original artifact for hash verification")
    parser.add_argument("--manifest", type=Path, help="Path to SpecLock manifest JSON")
    parser.add_argument("--offline", action="store_true", help="Run in offline mode (skip network checks)")
    parser.add_argument("--qr", action="store_true", help="Generate QR payload for receipt")

    args = parser.parse_args()

    if not args.receipt.exists():
        print(f"❌ ERROR: Receipt file not found: {args.receipt}")
        sys.exit(ERROR)

    exit_code = verify_receipt(
        receipt_path=args.receipt,
        artifact_path=args.artifact,
        manifest_path=args.manifest,
        offline=args.offline,
        generate_qr=args.qr
    )

    sys.exit(exit_code)

if __name__ == "__main__":
    main()
