#!/usr/bin/env python3
"""
TerraFusion Runtime Certification Harness

Certifies a live/cluster TerraFusion instance against runtimecontract.v1.
Performs all constitutional checks:
  1. Endpoint presence (/healthz/ready, /healthz/proof, /ops/speclock)
  2. Proof schema validation (deterministic, lexicographic keys)
  3. Metric exposition (tf_speclock_ok, tf_state_mesh_ok, tf_receipt_count)
  4. State mesh health
  5. Constitutional invariant verification

Usage:
  runtime-cert.py --target http://localhost:5000
  runtime-cert.py --target https://terrafusion.benton.gov --county benton
  runtime-cert.py --kubeconfig ~/.kube/config --namespace terrafusion

Exit codes:
  0 = CERTIFIED (all checks pass)
  1 = CERTIFICATION_FAILED (one or more checks failed)
  2 = UNREACHABLE (target not reachable)
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

SPEC_PATH = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json"
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")

REQUIRED_METRICS = [
    "tf_speclock_ok",
    "tf_state_mesh_ok",
    "tf_receipt_count",
    "tf_runtime_boot_timestamp",
]

# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class CheckResult:
    """Result of a single certification check."""
    name: str
    passed: bool
    message: str
    severity: str = "error"  # error, warning, info
    details: Optional[Dict[str, Any]] = None


@dataclass
class CertificationReport:
    """Full certification report."""
    target: str
    timestamp: str
    overall_passed: bool
    checks: List[CheckResult]
    spec_version: str = "v1.0.0"
    county: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def find_repo_root() -> str:
    """Find repository root containing docs/spec-lock."""
    d = os.path.dirname(os.path.abspath(__file__))
    while d != os.path.dirname(d):
        if os.path.isdir(os.path.join(d, "docs", "spec-lock")):
            return d
        d = os.path.dirname(d)
    # Fallback: assume we're in tools/runtime-cert/
    return os.path.abspath(os.path.join(d, "..", ".."))


def load_spec() -> dict:
    """Load the runtimecontract.v1 spec."""
    repo_root = find_repo_root()
    path = os.path.join(repo_root, SPEC_PATH)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[WARN] Spec not found at {path}, using embedded defaults")
        return {}


def http_get(url: str, timeout: int = 10) -> Tuple[int, str, dict]:
    """
    Make HTTP GET request.
    Returns: (status_code, body, headers)
    """
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode('utf-8')
            headers = dict(resp.headers)
            return resp.status, body, headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', errors='replace'), {}
    except urllib.error.URLError as e:
        return 0, str(e.reason), {}
    except Exception as e:
        return 0, str(e), {}


def parse_prometheus_metrics(text: str) -> Dict[str, float]:
    """Parse Prometheus exposition format into metric dict."""
    metrics = {}
    for line in text.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # Handle metrics with or without labels
        # e.g., tf_speclock_ok 1 or tf_receipt_count{county="benton"} 42
        match = re.match(r'^([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(?:\{[^}]*\})?\s+([0-9.eE+-]+)', line)
        if match:
            name, value = match.groups()
            try:
                metrics[name] = float(value)
            except ValueError:
                pass
    return metrics


# ═══════════════════════════════════════════════════════════════════════════════
# CERTIFICATION CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

def check_readiness(target: str) -> CheckResult:
    """Check /healthz/ready endpoint."""
    url = f"{target.rstrip('/')}/healthz/ready"
    status, body, _ = http_get(url)

    if status == 0:
        return CheckResult(
            name="readiness_endpoint",
            passed=False,
            message=f"Unreachable: {body}",
            severity="error"
        )

    if status == 200:
        return CheckResult(
            name="readiness_endpoint",
            passed=True,
            message="Readiness endpoint returns 200 OK",
            details={"status": status, "url": url}
        )

    return CheckResult(
        name="readiness_endpoint",
        passed=False,
        message=f"Readiness returned {status} (expected 200)",
        severity="error",
        details={"status": status, "body": body[:500]}
    )


def check_proof_endpoint(target: str) -> CheckResult:
    """Check /healthz/proof endpoint and validate schema."""
    url = f"{target.rstrip('/')}/healthz/proof"
    status, body, _ = http_get(url)

    if status == 0:
        return CheckResult(
            name="proof_endpoint",
            passed=False,
            message=f"Unreachable: {body}",
            severity="error"
        )

    if status != 200:
        return CheckResult(
            name="proof_endpoint",
            passed=False,
            message=f"Proof endpoint returned {status} (expected 200)",
            severity="error",
            details={"status": status}
        )

    # Parse and validate proof JSON
    try:
        proof = json.loads(body)
    except json.JSONDecodeError as e:
        return CheckResult(
            name="proof_endpoint",
            passed=False,
            message=f"Proof response is not valid JSON: {e}",
            severity="error"
        )

    # Check required fields
    required = ["speclock_ok", "state_mesh_ok", "manifest_sha256", "timestamp_epoch",
                "receipt_count", "state_proof_present"]
    missing = [f for f in required if f not in proof]

    if missing:
        return CheckResult(
            name="proof_endpoint",
            passed=False,
            message=f"Proof missing required fields: {missing}",
            severity="error",
            details={"missing": missing, "proof_keys": list(proof.keys())}
        )

    return CheckResult(
        name="proof_endpoint",
        passed=True,
        message="Proof endpoint returns valid schema",
        details={"proof": proof}
    )


def check_proof_determinism(target: str) -> CheckResult:
    """Check that proof response is deterministic (lexicographic keys)."""
    url = f"{target.rstrip('/')}/healthz/proof"
    status, body, _ = http_get(url)

    if status != 200:
        return CheckResult(
            name="proof_determinism",
            passed=False,
            message="Cannot check determinism - proof endpoint unavailable",
            severity="warning"
        )

    try:
        proof = json.loads(body)
        keys = list(proof.keys())
        sorted_keys = sorted(keys)

        if keys != sorted_keys:
            return CheckResult(
                name="proof_determinism",
                passed=False,
                message="Proof keys are NOT lexicographically sorted",
                severity="error",
                details={"actual": keys, "expected": sorted_keys}
            )

        return CheckResult(
            name="proof_determinism",
            passed=True,
            message="Proof keys are lexicographically sorted",
            details={"keys": keys}
        )
    except Exception as e:
        return CheckResult(
            name="proof_determinism",
            passed=False,
            message=f"Failed to parse proof: {e}",
            severity="error"
        )


def check_proof_sha256_format(target: str) -> CheckResult:
    """Check that manifest_sha256 is lowercase hex."""
    url = f"{target.rstrip('/')}/healthz/proof"
    status, body, _ = http_get(url)

    if status != 200:
        return CheckResult(
            name="sha256_format",
            passed=False,
            message="Cannot check SHA-256 - proof endpoint unavailable",
            severity="warning"
        )

    try:
        proof = json.loads(body)
        sha = proof.get("manifest_sha256", "")

        if not SHA256_PATTERN.match(sha):
            return CheckResult(
                name="sha256_format",
                passed=False,
                message="manifest_sha256 does not match ^[a-f0-9]{64}$",
                severity="error",
                details={"actual": sha}
            )

        return CheckResult(
            name="sha256_format",
            passed=True,
            message="manifest_sha256 is valid lowercase hex",
            details={"sha256": sha}
        )
    except Exception as e:
        return CheckResult(
            name="sha256_format",
            passed=False,
            message=f"Failed to parse proof: {e}",
            severity="error"
        )


def check_speclock_status(target: str) -> CheckResult:
    """Check that speclock_ok is true."""
    url = f"{target.rstrip('/')}/healthz/proof"
    status, body, _ = http_get(url)

    if status != 200:
        return CheckResult(
            name="speclock_status",
            passed=False,
            message="Cannot check speclock_ok - proof endpoint unavailable",
            severity="warning"
        )

    try:
        proof = json.loads(body)
        speclock_ok = proof.get("speclock_ok", False)

        if not speclock_ok:
            return CheckResult(
                name="speclock_status",
                passed=False,
                message="speclock_ok is FALSE - constitutional violation",
                severity="error",
                details={"speclock_ok": speclock_ok}
            )

        return CheckResult(
            name="speclock_status",
            passed=True,
            message="speclock_ok is TRUE",
            details={"speclock_ok": speclock_ok}
        )
    except Exception as e:
        return CheckResult(
            name="speclock_status",
            passed=False,
            message=f"Failed to parse proof: {e}",
            severity="error"
        )


def check_state_mesh_status(target: str) -> CheckResult:
    """Check that state_mesh_ok is true."""
    url = f"{target.rstrip('/')}/healthz/proof"
    status, body, _ = http_get(url)

    if status != 200:
        return CheckResult(
            name="state_mesh_status",
            passed=False,
            message="Cannot check state_mesh_ok - proof endpoint unavailable",
            severity="warning"
        )

    try:
        proof = json.loads(body)
        state_mesh_ok = proof.get("state_mesh_ok", False)

        if not state_mesh_ok:
            return CheckResult(
                name="state_mesh_status",
                passed=False,
                message="state_mesh_ok is FALSE - constitutional violation",
                severity="error",
                details={"state_mesh_ok": state_mesh_ok}
            )

        return CheckResult(
            name="state_mesh_status",
            passed=True,
            message="state_mesh_ok is TRUE",
            details={"state_mesh_ok": state_mesh_ok}
        )
    except Exception as e:
        return CheckResult(
            name="state_mesh_status",
            passed=False,
            message=f"Failed to parse proof: {e}",
            severity="error"
        )


def check_metrics_endpoint(target: str) -> CheckResult:
    """Check /metrics endpoint exists and has required metrics."""
    url = f"{target.rstrip('/')}/metrics"
    status, body, _ = http_get(url)

    if status == 0:
        return CheckResult(
            name="metrics_endpoint",
            passed=False,
            message=f"Unreachable: {body}",
            severity="error"
        )

    if status != 200:
        return CheckResult(
            name="metrics_endpoint",
            passed=False,
            message=f"Metrics endpoint returned {status} (expected 200)",
            severity="error"
        )

    metrics = parse_prometheus_metrics(body)
    missing = [m for m in REQUIRED_METRICS if m not in metrics]

    if missing:
        return CheckResult(
            name="metrics_endpoint",
            passed=False,
            message=f"Missing required metrics: {missing}",
            severity="error",
            details={"missing": missing, "found": list(metrics.keys())[:20]}
        )

    return CheckResult(
        name="metrics_endpoint",
        passed=True,
        message="All required metrics present",
        details={"metrics": {k: metrics[k] for k in REQUIRED_METRICS if k in metrics}}
    )


def check_speclock_api(target: str) -> CheckResult:
    """Check /ops/speclock endpoint."""
    url = f"{target.rstrip('/')}/ops/speclock"
    status, body, _ = http_get(url)

    if status == 0:
        return CheckResult(
            name="speclock_api",
            passed=False,
            message=f"Unreachable: {body}",
            severity="error"
        )

    if status != 200:
        return CheckResult(
            name="speclock_api",
            passed=False,
            message=f"SpecLock API returned {status} (expected 200)",
            severity="error"
        )

    try:
        data = json.loads(body)
        return CheckResult(
            name="speclock_api",
            passed=True,
            message="SpecLock API accessible",
            details={"locks_count": len(data.get("locks", []))}
        )
    except json.JSONDecodeError:
        return CheckResult(
            name="speclock_api",
            passed=True,
            message="SpecLock API accessible (non-JSON response)",
            severity="warning"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN CERTIFICATION LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

def run_certification(target: str, county: Optional[str] = None) -> CertificationReport:
    """Run all certification checks against target."""
    checks = []

    # Core endpoint checks
    checks.append(check_readiness(target))
    checks.append(check_proof_endpoint(target))
    checks.append(check_proof_determinism(target))
    checks.append(check_proof_sha256_format(target))

    # Constitutional status checks
    checks.append(check_speclock_status(target))
    checks.append(check_state_mesh_status(target))

    # Observability checks
    checks.append(check_metrics_endpoint(target))
    checks.append(check_speclock_api(target))

    # Determine overall pass/fail
    error_checks = [c for c in checks if not c.passed and c.severity == "error"]
    overall_passed = len(error_checks) == 0

    return CertificationReport(
        target=target,
        timestamp=datetime.utcnow().isoformat() + "Z",
        overall_passed=overall_passed,
        checks=checks,
        county=county
    )


def print_report(report: CertificationReport, verbose: bool = False):
    """Print certification report to stdout."""
    print("\n" + "═" * 70)
    print(" TerraFusion Runtime Certification Report")
    print("═" * 70)
    print(f"  Target:    {report.target}")
    print(f"  Timestamp: {report.timestamp}")
    print(f"  County:    {report.county or 'N/A'}")
    print(f"  Spec:      runtimecontract.{report.spec_version}")
    print("═" * 70 + "\n")

    passed = [c for c in report.checks if c.passed]
    failed = [c for c in report.checks if not c.passed]

    if passed:
        print("✅ PASSED CHECKS:")
        for c in passed:
            print(f"   ✓ {c.name}: {c.message}")
            if verbose and c.details:
                for k, v in c.details.items():
                    print(f"     └─ {k}: {v}")

    print()

    if failed:
        print("❌ FAILED CHECKS:")
        for c in failed:
            icon = "✗" if c.severity == "error" else "⚠"
            print(f"   {icon} {c.name}: {c.message}")
            if verbose and c.details:
                for k, v in c.details.items():
                    print(f"     └─ {k}: {v}")

    print()
    print("═" * 70)
    if report.overall_passed:
        print(" 🎖️  CERTIFICATION: PASSED")
        print("     All constitutional requirements satisfied.")
    else:
        print(" ❌ CERTIFICATION: FAILED")
        print(f"     {len(failed)} check(s) failed.")
    print("═" * 70 + "\n")


def export_json(report: CertificationReport, path: str):
    """Export report as JSON."""
    data = {
        "target": report.target,
        "timestamp": report.timestamp,
        "spec_version": report.spec_version,
        "county": report.county,
        "overall_passed": report.overall_passed,
        "checks": [
            {
                "name": c.name,
                "passed": c.passed,
                "message": c.message,
                "severity": c.severity,
                "details": c.details
            }
            for c in report.checks
        ]
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"[runtime-cert] Report exported to {path}")


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion Runtime Certification Harness",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --target http://localhost:5000
  %(prog)s --target https://terrafusion.benton.gov --county benton
  %(prog)s --target http://localhost:5000 --output report.json --verbose
        """
    )
    parser.add_argument("--target", "-t", required=True,
                        help="Target URL (e.g., http://localhost:5000)")
    parser.add_argument("--county", "-c", default=None,
                        help="County identifier (for reporting)")
    parser.add_argument("--output", "-o", default=None,
                        help="Export JSON report to file")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show detailed check output")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Only output exit code (for CI)")

    args = parser.parse_args()

    # Run certification
    report = run_certification(args.target, args.county)

    # Output
    if not args.quiet:
        print_report(report, args.verbose)

    if args.output:
        export_json(report, args.output)

    # Exit code
    if report.overall_passed:
        return 0
    else:
        # Check if target was unreachable
        unreachable = any("Unreachable" in c.message for c in report.checks)
        return 2 if unreachable else 1


if __name__ == "__main__":
    sys.exit(main())
