#!/usr/bin/env python3
"""
Health Endpoints Runtime Certification Check
=============================================
Part of TerraFusion go-live acceptance gate.

Validates that /healthz/ready and /healthz/live endpoints return 200.

Exit Codes:
  0 - PASS: All health endpoints healthy
  1 - FAIL: One or more health endpoints failing
  2 - ERROR: Script execution error

Usage:
  python health_check.py [--url URL] [--timeout SECONDS]

Environment Variables:
  TERRAFUSION_API_URL - Base URL (default: http://localhost:5000)
  HEALTH_CHECK_TIMEOUT - Request timeout in seconds (default: 10)
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

# Health endpoints to validate (deterministic order)
HEALTH_ENDPOINTS = [
    {
        "name": "health_ready",
        "path": "/healthz/ready",
        "description": "Kubernetes readiness probe",
        "required": True,  # fail_behavior: fail_closed
    },
    {
        "name": "health_live",
        "path": "/healthz/live",
        "description": "Kubernetes liveness probe",
        "required": False,  # fail_behavior: warn
    },
]


def check_endpoint(base_url: str, path: str, timeout: int) -> tuple[int | None, str | None, float]:
    """
    Check a single health endpoint.

    Returns:
        (status_code: int | None, error: str | None, latency_ms: float)
    """
    url = f"{base_url.rstrip('/')}{path}"
    start = datetime.now()

    try:
        request = urllib.request.Request(url, method='GET')
        request.add_header('Accept', 'application/json')
        request.add_header('User-Agent', 'TerraFusion-RuntimeCert/1.0')

        with urllib.request.urlopen(request, timeout=timeout) as response:
            latency_ms = (datetime.now() - start).total_seconds() * 1000
            return response.status, None, latency_ms

    except urllib.error.HTTPError as e:
        latency_ms = (datetime.now() - start).total_seconds() * 1000
        return e.code, f"HTTP {e.code}: {e.reason}", latency_ms
    except urllib.error.URLError as e:
        latency_ms = (datetime.now() - start).total_seconds() * 1000
        return None, f"Connection error: {e.reason}", latency_ms
    except Exception as e:
        latency_ms = (datetime.now() - start).total_seconds() * 1000
        return None, f"Unexpected error: {e}", latency_ms


def check_health_endpoints(base_url: str, timeout: int) -> tuple[bool, dict, list[str], list[str]]:
    """
    Validates all health endpoints.

    Returns:
        (passed: bool, details: dict, errors: list[str], warnings: list[str])
    """
    errors = []
    warnings = []
    details = {
        "base_url": base_url,
        "endpoints": [],
        "total_latency_ms": 0,
    }

    for endpoint in HEALTH_ENDPOINTS:
        name = endpoint["name"]
        path = endpoint["path"]
        required = endpoint["required"]

        status_code, error, latency_ms = check_endpoint(base_url, path, timeout)

        endpoint_result = {
            "name": name,
            "path": path,
            "description": endpoint["description"],
            "status_code": status_code,
            "latency_ms": round(latency_ms, 2),
            "passed": status_code == 200,
            "required": required,
        }

        if error:
            endpoint_result["error"] = error

        details["endpoints"].append(endpoint_result)
        details["total_latency_ms"] += latency_ms

        # Determine pass/fail/warn
        if status_code != 200:
            if required:
                errors.append(f"{name} ({path}): expected 200, got {status_code or 'unreachable'}")
            else:
                warnings.append(f"{name} ({path}): expected 200, got {status_code or 'unreachable'}")

    details["total_latency_ms"] = round(details["total_latency_ms"], 2)
    passed = len(errors) == 0
    return passed, details, errors, warnings


def main():
    parser = argparse.ArgumentParser(description='Health Endpoints Runtime Certification Check')
    parser.add_argument('--url', default=os.environ.get('TERRAFUSION_API_URL', 'http://localhost:5000'),
                        help='TerraFusion API base URL')
    parser.add_argument('--timeout', type=int,
                        default=int(os.environ.get('HEALTH_CHECK_TIMEOUT', '10')),
                        help='Request timeout in seconds')
    parser.add_argument('--json', action='store_true',
                        help='Output results as JSON')
    parser.add_argument('--strict', action='store_true',
                        help='Treat warnings as errors')

    args = parser.parse_args()

    print("=" * 60)
    print("TerraFusion Health Endpoints Certification")
    print("=" * 60)
    print(f"Target: {args.url}")
    print(f"Timeout: {args.timeout}s")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("-" * 60)

    passed, details, errors, warnings = check_health_endpoints(args.url, args.timeout)

    # In strict mode, warnings become errors
    if args.strict and warnings:
        errors.extend(warnings)
        warnings = []
        passed = False

    if args.json:
        result = {
            "passed": passed,
            "url": args.url,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "errors": errors,
            "warnings": warnings,
            "details": details,
        }
        print(json.dumps(result, indent=2))
    else:
        if passed:
            print("✅ HEALTH ENDPOINTS CERTIFICATION: PASSED")
            print()
            print("Endpoints:")
            for ep in details["endpoints"]:
                status = "✓" if ep["passed"] else ("⚠" if not ep["required"] else "✗")
                print(f"  {status} {ep['name']}: {ep['status_code'] or 'N/A'} ({ep['latency_ms']:.1f}ms)")
            print()
            print(f"Total latency: {details['total_latency_ms']:.1f}ms")

            if warnings:
                print()
                print("Warnings:")
                for warn in warnings:
                    print(f"  ⚠ {warn}")
        else:
            print("❌ HEALTH ENDPOINTS CERTIFICATION: FAILED")
            print()
            print("Endpoints:")
            for ep in details["endpoints"]:
                status = "✓" if ep["passed"] else ("⚠" if not ep["required"] else "✗")
                line = f"  {status} {ep['name']}: {ep['status_code'] or 'unreachable'}"
                if ep.get("error"):
                    line += f" - {ep['error']}"
                print(line)
            print()
            print("Errors:")
            for err in errors:
                print(f"  ✗ {err}")

    print()
    print("=" * 60)

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: Script execution failed: {e}", file=sys.stderr)
        sys.exit(2)
