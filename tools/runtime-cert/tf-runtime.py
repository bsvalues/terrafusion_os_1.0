#!/usr/bin/env python3
"""
TerraFusion Runtime Certification CLI

Usage:
    tf-runtime cert <county> [--strict] [--base-url <url>] [--output <dir>]

Exit Codes:
    0 - All checks passed
    1 - One or more checks failed
    2 - Runtime error (network, config, etc.)
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Import check modules
CHECKS_DIR = Path(__file__).parent / "checks"
sys.path.insert(0, str(CHECKS_DIR))

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

VERSION = "1.0.0"
DEFAULT_BASE_URL = "http://localhost:5000"
DEFAULT_OUTPUT_DIR = "artifacts/cert"

# Check status values (deterministic order)
STATUS_PASS = "PASS"
STATUS_WARN = "WARN"
STATUS_FAIL = "FAIL"
STATUS_SKIP = "SKIP"
STATUS_ERROR = "ERROR"

# ═══════════════════════════════════════════════════════════════════════════════
# REPORT GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_timestamp() -> str:
    """Generate ISO 8601 timestamp for report naming."""
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def create_output_dir(base_dir: str, timestamp: str) -> Path:
    """Create timestamped output directory. Never overwrites existing."""
    output_path = Path(base_dir) / timestamp
    output_path.mkdir(parents=True, exist_ok=True)
    return output_path


def build_report(
    county: str,
    base_url: str,
    strict_mode: bool,
    checks: list[dict[str, Any]],
    start_time: datetime,
    end_time: datetime,
) -> dict[str, Any]:
    """Build the certification report structure per runtimecert.v1 spec."""
    duration_ms = int((end_time - start_time).total_seconds() * 1000)

    # Calculate summary
    summary = {
        "total": len(checks),
        "passed": sum(1 for c in checks if c["status"] == STATUS_PASS),
        "warned": sum(1 for c in checks if c["status"] == STATUS_WARN),
        "failed": sum(1 for c in checks if c["status"] == STATUS_FAIL),
        "skipped": sum(1 for c in checks if c["status"] == STATUS_SKIP),
        "errors": sum(1 for c in checks if c["status"] == STATUS_ERROR),
    }

    # Determine overall result
    if summary["errors"] > 0:
        result = "ERROR"
    elif summary["failed"] > 0:
        result = "FAIL"
    elif strict_mode and summary["warned"] > 0:
        result = "FAIL"  # Strict mode treats warnings as failures
    else:
        result = "PASS"

    return {
        "timestamp": start_time.isoformat(),
        "county": county,
        "base_url": base_url,
        "duration_ms": duration_ms,
        "result": result,
        "strict_mode": strict_mode,
        "checks": checks,
        "summary": summary,
    }


def write_json_report(report: dict[str, Any], output_dir: Path) -> Path:
    """Write machine-readable JSON report."""
    report_path = output_dir / "cert.report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, sort_keys=False)
    return report_path


def write_markdown_report(report: dict[str, Any], output_dir: Path) -> Path:
    """Write human-readable Markdown report."""
    report_path = output_dir / "cert.report.md"

    lines = [
        "# TerraFusion Runtime Certification Report",
        "",
        f"**County:** {report['county']}",
        f"**Base URL:** {report['base_url']}",
        f"**Timestamp:** {report['timestamp']}",
        f"**Duration:** {report['duration_ms']}ms",
        f"**Strict Mode:** {'Yes' if report['strict_mode'] else 'No'}",
        f"**Result:** {report['result']}",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "|--------|-------|",
        f"| Total | {report['summary']['total']} |",
        f"| Passed | {report['summary']['passed']} |",
        f"| Warned | {report['summary']['warned']} |",
        f"| Failed | {report['summary']['failed']} |",
        f"| Skipped | {report['summary']['skipped']} |",
        f"| Errors | {report['summary']['errors']} |",
        "",
        "## Check Results",
        "",
    ]

    for check in report["checks"]:
        status_emoji = {
            STATUS_PASS: "✅",
            STATUS_WARN: "⚠️",
            STATUS_FAIL: "❌",
            STATUS_SKIP: "⏭️",
            STATUS_ERROR: "💥",
        }.get(check["status"], "❓")

        lines.append(f"### {status_emoji} {check['name']}")
        lines.append("")
        lines.append(f"- **Status:** {check['status']}")
        lines.append(f"- **Duration:** {check['duration_ms']}ms")
        if check.get("message"):
            lines.append(f"- **Message:** {check['message']}")
        if check.get("details"):
            lines.append(f"- **Details:** `{json.dumps(check['details'])}`")
        lines.append("")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return report_path


# ═══════════════════════════════════════════════════════════════════════════════
# CHECK EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

def run_check(check_name: str, check_func, base_url: str, **kwargs) -> dict[str, Any]:
    """Execute a single check and capture results."""
    start = datetime.now(timezone.utc)
    try:
        result = check_func(base_url, **kwargs)
        end = datetime.now(timezone.utc)
        return {
            "name": check_name,
            "status": result.get("status", STATUS_ERROR),
            "duration_ms": int((end - start).total_seconds() * 1000),
            "message": result.get("message", ""),
            "details": result.get("details", {}),
        }
    except Exception as e:
        end = datetime.now(timezone.utc)
        return {
            "name": check_name,
            "status": STATUS_ERROR,
            "duration_ms": int((end - start).total_seconds() * 1000),
            "message": f"Check raised exception: {str(e)}",
            "details": {"exception": str(type(e).__name__)},
        }


def run_checks(base_url: str, county: str, strict: bool) -> list[dict[str, Any]]:
    """Run all certification checks in deterministic order."""
    checks = []

    # 1. PACS Contract Check
    try:
        from pacs_check import check_pacs
        checks.append(run_check("pacs_contract", check_pacs, base_url))
    except ImportError:
        checks.append({
            "name": "pacs_contract",
            "status": STATUS_ERROR,
            "duration_ms": 0,
            "message": "pacs_check.py module not found",
            "details": {},
        })

    # 2. SpecLock Index Check
    try:
        from speclock_check import check_speclock
        checks.append(run_check("speclock_index", check_speclock, base_url))
    except ImportError:
        checks.append({
            "name": "speclock_index",
            "status": STATUS_ERROR,
            "duration_ms": 0,
            "message": "speclock_check.py module not found",
            "details": {},
        })

    # 3. Health Ready Check
    try:
        from health_check import check_health_ready
        checks.append(run_check("health_ready", check_health_ready, base_url))
    except ImportError:
        checks.append({
            "name": "health_ready",
            "status": STATUS_ERROR,
            "duration_ms": 0,
            "message": "health_check.py module not found",
            "details": {},
        })

    # 4. Health Live Check
    try:
        from health_check import check_health_live
        checks.append(run_check("health_live", check_health_live, base_url))
    except ImportError:
        checks.append({
            "name": "health_live",
            "status": STATUS_ERROR,
            "duration_ms": 0,
            "message": "health_check.py module not found",
            "details": {},
        })

    return checks


# ═══════════════════════════════════════════════════════════════════════════════
# CLI COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_cert(args) -> int:
    """Execute the cert command."""
    print("🔒 TerraFusion Runtime Certification")
    print(f"   County: {args.county}")
    print(f"   Base URL: {args.base_url}")
    print(f"   Strict Mode: {args.strict}")
    print()

    try:
        # Generate timestamp for this run
        timestamp = generate_timestamp()
        output_dir = create_output_dir(args.output, timestamp)

        print(f"📁 Output directory: {output_dir}")
        print()

        # Run checks
        start_time = datetime.now(timezone.utc)
        print("🔍 Running certification checks...")
        checks = run_checks(args.base_url, args.county, args.strict)
        end_time = datetime.now(timezone.utc)

        # Build report
        report = build_report(
            county=args.county,
            base_url=args.base_url,
            strict_mode=args.strict,
            checks=checks,
            start_time=start_time,
            end_time=end_time,
        )

        # Write reports
        json_path = write_json_report(report, output_dir)
        md_path = write_markdown_report(report, output_dir)

        print()
        print(f"📄 JSON Report: {json_path}")
        print(f"📝 Markdown Report: {md_path}")
        print()

        # Print summary
        summary = report["summary"]
        print("═══════════════════════════════════════════════════")
        print(f"  CERTIFICATION RESULT: {report['result']}")
        print("═══════════════════════════════════════════════════")
        print(f"  Total: {summary['total']} | Passed: {summary['passed']} | "
              f"Warned: {summary['warned']} | Failed: {summary['failed']} | "
              f"Errors: {summary['errors']}")
        print()

        # Determine exit code (deterministic: 0=pass, 1=fail, 2=error)
        if report["result"] == "ERROR":
            sys.exit(2)
        elif report["result"] == "FAIL":
            sys.exit(1)
        else:
            sys.exit(0)

    except Exception as e:
        print(f"💥 Fatal error: {e}", file=sys.stderr)
        sys.exit(2)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRYPOINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        prog="tf-runtime",
        description="TerraFusion Runtime Certification CLI",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {VERSION}")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # cert subcommand
    cert_parser = subparsers.add_parser(
        "cert",
        help="Run certification checks against a TerraFusion instance",
    )
    cert_parser.add_argument(
        "county",
        type=str,
        help="County identifier (e.g., benton, yakima)",
    )
    cert_parser.add_argument(
        "--strict",
        action="store_true",
        default=False,
        help="Fail on warnings, not just errors",
    )
    cert_parser.add_argument(
        "--base-url",
        type=str,
        default=DEFAULT_BASE_URL,
        help=f"Target TerraFusion instance URL (default: {DEFAULT_BASE_URL})",
    )
    cert_parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory for reports (default: {DEFAULT_OUTPUT_DIR})",
    )

    args = parser.parse_args()

    if args.command == "cert":
        cmd_cert(args)  # cmd_cert calls sys.exit() directly
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
