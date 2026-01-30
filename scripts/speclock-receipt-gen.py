#!/usr/bin/env python3
"""
SpecLock Receipt Generator
==========================
Generates receipt schema and verifier artifacts from speclock.spec.json
"""

import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate receipt artifacts")
    parser.add_argument("--lock", required=True, help="Lock ID (e.g., receipt.v1)")
    parser.add_argument("--out", required=True, help="Output file path")
    args = parser.parse_args()

    # --out is the full file path, determine which artifact to generate
    out_path = Path(args.out)
    out_dir = out_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    artifact_name = out_path.name

    # Load spec to get artifact_types and signing_modes
    spec_path = Path(__file__).parent.parent / "docs" / "spec-lock" / "locks" / "receipt" / "receipt.v1" / "speclock.spec.json"
    spec = {}
    if spec_path.exists():
        with open(spec_path) as f:
            spec = json.load(f)

    artifact_types = spec.get("artifact_types", ["assessment_notice", "levy_table", "gis_export", "report", "other"])
    signing_modes = spec.get("signing_modes", ["mythic_cosign", "cosmic_tss"])

    # Generate receipt.schema.json - matches test expectations exactly
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TerraFusion Receipt",
        "description": "Citizen-verifiable receipt for government artifacts",
        "type": "object",
        "required": [
            "receipt_id",
            "issued_at",
            "nbf",
            "exp",
            "artifact",
            "speclock_manifest_sha256",
            "signing",
            "proof_url"
        ],
        "properties": {
            "receipt_id": {
                "type": "string",
                "pattern": "^r[a-z0-9]{1,63}$",
                "description": "Unique receipt identifier"
            },
            "issued_at": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "RFC3339 UTC timestamp when receipt was issued"
            },
            "nbf": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "Not-before timestamp (RFC3339 UTC)"
            },
            "exp": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "Expiration timestamp (RFC3339 UTC)"
            },
            "artifact": {
                "type": "object",
                "required": ["type", "sha256"],
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": artifact_types,
                        "description": "Type of artifact being receipted"
                    },
                    "sha256": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "SHA-256 hash of artifact (lowercase hex)"
                    }
                }
            },
            "speclock_manifest_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 of the speclock manifest at receipt time"
            },
            "signing": {
                "type": "object",
                "required": ["mode", "signature_sha256"],
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": signing_modes,
                        "description": "Signing mode used"
                    },
                    "signature_sha256": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "SHA-256 of signature"
                    },
                    "group_pub_sha256": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "SHA-256 of group public key (for TSS)"
                    },
                    "participants_used": {
                        "type": "integer",
                        "minimum": 1,
                        "description": "Number of participants in TSS signing"
                    }
                }
            },
            "proof_url": {
                "type": "string",
                "format": "uri",
                "description": "URL where citizens can verify this receipt"
            },
            "policy_bundle_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 of policy bundle (optional)"
            }
        }
    }

    # Determine which artifact to generate based on output filename
    if "schema" in artifact_name:
        with open(out_path, "w") as f:
            json.dump(schema, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "openapi" in artifact_name:
        openapi = {
            "openapi": "3.0.3",
            "info": {"title": "Receipt API", "version": "1.0.0"},
            "paths": {
                "/ops/receipts": {
                    "get": {"summary": "List receipts", "responses": {"200": {"description": "OK"}}},
                    "post": {"summary": "Create receipt", "responses": {"201": {"description": "Created"}}}
                },
                "/ops/receipts/{receiptId}": {
                    "get": {"summary": "Get receipt", "responses": {"200": {"description": "OK"}}},
                },
                "/ops/receipts/{receiptId}/verify": {
                    "get": {"summary": "Verify receipt", "responses": {"200": {"description": "OK"}}}
                }
            }
        }
        with open(out_path, "w") as f:
            json.dump(openapi, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "verifier" in artifact_name:
        verifier = {
            "version": "1.0.0",
            "verificationEndpoint": "/ops/receipts/{receiptId}/verify",
            "proofFields": ["sha256", "timestamp", "countyId"],
            "publicProofRequired": True,
            "foiaBundleSupported": True
        }
        with open(out_path, "w") as f:
            json.dump(verifier, f, indent=2)
        print(f"✅ Generated: {out_path}")
    else:
        print(f"⚠️  Unknown artifact type: {artifact_name}")
        return 1

    print(f"\n✅ Receipt artifact generated for {args.lock}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
