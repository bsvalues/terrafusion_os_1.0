#!/usr/bin/env python3
"""
PACS Contract Runtime Certification Check
==========================================
Part of TerraFusion go-live acceptance gate.

Validates that a TerraFusion node's /ops/pacs/proof endpoint
returns a valid PACS contract proof.

Exit Codes:
  0 - PASS: PACS contract valid
  1 - FAIL: PACS contract invalid or unreachable
  2 - ERROR: Script execution error

Usage:
  python pacs_check.py [--url URL] [--timeout SECONDS]

Environment Variables:
  TERRAFUSION_API_URL - Base URL (default: http://localhost:5000)
  PACS_CHECK_TIMEOUT - Request timeout in seconds (default: 30)
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

# Contract expectations from pacscontract.v1
EXPECTED_CONTRACT_NAME = "pacscontract.v1"
EXPECTED_CONTRACT_VERSION = "1.0.0"
REQUIRED_VIEWS = [
    "vw_TerraFusion_Property_Core",
    "vw_TerraFusion_Property_Ownership",
    "vw_TerraFusion_Assessment_History"
]


def check_pacs_proof(base_url: str, timeout: int) -> tuple[bool, dict, list[str]]:
    """
    Calls /ops/pacs/proof and validates response.

    Returns:
        (passed: bool, proof: dict, errors: list[str])
    """
    errors = []
    proof = {}

    url = f"{base_url.rstrip('/')}/ops/pacs/proof"

    try:
        request = urllib.request.Request(url, method='GET')
        request.add_header('Accept', 'application/json')
        request.add_header('User-Agent', 'TerraFusion-RuntimeCert/1.0')

        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                errors.append(f"Non-200 status: {response.status}")
                return False, proof, errors

            body = response.read().decode('utf-8')
            proof = json.loads(body)

    except urllib.error.HTTPError as e:
        errors.append(f"HTTP error: {e.code} - {e.reason}")
        return False, proof, errors
    except urllib.error.URLError as e:
        errors.append(f"Connection error: {e.reason}")
        return False, proof, errors
    except json.JSONDecodeError as e:
        errors.append(f"Invalid JSON response: {e}")
        return False, proof, errors
    except Exception as e:
        errors.append(f"Unexpected error: {e}")
        return False, proof, errors

    # Validate response structure
    if not proof.get("enabled"):
        errors.append("PACS not enabled (enabled != true)")

    # Validate contract name/version
    contract = proof.get("contract", {})
    if contract.get("name") != EXPECTED_CONTRACT_NAME:
        errors.append(f"Contract name mismatch: expected '{EXPECTED_CONTRACT_NAME}', got '{contract.get('name')}'")

    if contract.get("version") != EXPECTED_CONTRACT_VERSION:
        errors.append(f"Contract version mismatch: expected '{EXPECTED_CONTRACT_VERSION}', got '{contract.get('version')}'")

    # Validate database connectivity
    databases = proof.get("databases", {})
    if databases.get("pacs_oltp") != "reachable":
        errors.append(f"pacs_oltp not reachable: {databases.get('pacs_oltp')}")

    # Validate views (no "missing" status allowed)
    views = proof.get("views", {})
    for view in REQUIRED_VIEWS:
        # Convert view name to response key format
        key = view.replace("vw_TerraFusion_", "vw_terra_fusion_").replace("_", "")
        # Try various key formats
        status = None
        for k, v in views.items():
            if view.lower().replace("_", "") in k.lower().replace("_", ""):
                status = v
                break

        if status == "missing":
            errors.append(f"View missing: {view}")
        elif status not in ("ok", None):
            errors.append(f"View status unknown for {view}: {status}")

    # Check for any "missing" status anywhere in response
    def check_for_missing(obj, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                check_for_missing(v, f"{path}.{k}" if path else k)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                check_for_missing(v, f"{path}[{i}]")
        elif obj == "missing":
            errors.append(f"'missing' status found at: {path}")

    check_for_missing(proof)

    # Check contractValid flag
    if not proof.get("contractValid", False):
        errors.append("contractValid is false")
        # Add any errors from the proof itself
        for err in proof.get("errors", []):
            errors.append(f"Proof error: {err}")

    passed = len(errors) == 0
    return passed, proof, errors


def main():
    parser = argparse.ArgumentParser(description='PACS Contract Runtime Certification Check')
    parser.add_argument('--url', default=os.environ.get('TERRAFUSION_API_URL', 'http://localhost:5000'),
                        help='TerraFusion API base URL')
    parser.add_argument('--timeout', type=int,
                        default=int(os.environ.get('PACS_CHECK_TIMEOUT', '30')),
                        help='Request timeout in seconds')
    parser.add_argument('--json', action='store_true',
                        help='Output results as JSON')

    args = parser.parse_args()

    print("=" * 60)
    print("TerraFusion PACS Contract Runtime Certification")
    print("=" * 60)
    print(f"Target: {args.url}")
    print(f"Timeout: {args.timeout}s")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("-" * 60)

    passed, proof, errors = check_pacs_proof(args.url, args.timeout)

    if args.json:
        result = {
            "passed": passed,
            "url": args.url,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "errors": errors,
            "proof": proof
        }
        print(json.dumps(result, indent=2))
    else:
        if passed:
            print("✅ PACS CONTRACT CERTIFICATION: PASSED")
            print()
            print("Contract Details:")
            print(f"  Name: {proof.get('contract', {}).get('name')}")
            print(f"  Version: {proof.get('contract', {}).get('version')}")
            print(f"  Manifest SHA256: {proof.get('contract', {}).get('manifestSha256', 'N/A')[:16]}...")
            print()
            print("Status:")
            print(f"  Database: {proof.get('databases', {}).get('pacs_oltp', 'unknown')}")
            print(f"  Views: {proof.get('views', {})}")
            print(f"  Latency: {proof.get('latencyMs', 'N/A')}ms")
            print(f"  Read-Only: {proof.get('readOnly', 'unknown')}")
        else:
            print("❌ PACS CONTRACT CERTIFICATION: FAILED")
            print()
            print("Errors:")
            for err in errors:
                print(f"  - {err}")
            print()
            if proof.get("warnings"):
                print("Warnings:")
                for warn in proof.get("warnings", []):
                    print(f"  - {warn}")

    print()
    print("=" * 60)

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: Script execution failed: {e}", file=sys.stderr)
        sys.exit(2)
