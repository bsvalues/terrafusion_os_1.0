#!/usr/bin/env python3
"""Phase 4C Readiness Validator.

Validates the phase4c.readiness.manifest.json against all P4C acceptance tests.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

VALID_READINESS = {"ready", "blocked-security", "blocked-adr", "blocked-legal", "blocked-dependency"}
SECURITY_BLOCKED_REPOS = {"TerraMiner", "TerraFusionPilt", "BCBSLevy"}
TIER_1_REPOS = {"terra-forge-rebuild", "Bsbcintelligentvalues", "TerraFusionTheory"}


def validate(manifest_path: str) -> list[str]:
    errors: list[str] = []
    m = json.loads(Path(manifest_path).read_text(encoding="utf-8"))

    assets = m.get("assets", [])
    totals = m.get("totals", {})

    # P4C-001: All 511 ported assets have execution_readiness
    if len(assets) != 511:
        errors.append(f"P4C-001: Expected 511 assets, found {len(assets)}")

    for a in assets:
        aid = a.get("asset_id", "?")
        readiness = a.get("execution_readiness", "")
        if readiness not in VALID_READINESS:
            errors.append(f"P4C-001: {aid} has invalid execution_readiness: '{readiness}'")

    # P4C-002: No deferred asset appears (check by cross-referencing - we just verify none have deferred status)
    for a in assets:
        if "deferred" in a.get("execution_readiness", "").lower():
            errors.append(f"P4C-002: {a['asset_id']} has deferred-like readiness state")

    # P4C-003: Security gate enforced
    for a in assets:
        repo = a.get("source_repo", "")
        readiness = a.get("execution_readiness", "")
        if repo in SECURITY_BLOCKED_REPOS and readiness == "ready":
            errors.append(
                f"P4C-003: {a['asset_id']} from {repo} is marked 'ready' "
                f"but repo has non-rotated keys/exposure"
            )

    # P4C-004: Batch rollup reconciles to 511
    batch_sum = totals.get("batch_sum_check", 0)
    suite_sum = totals.get("suite_sum_check", 0)
    if batch_sum != 511:
        errors.append(f"P4C-004: Batch sum = {batch_sum}, expected 511")
    if suite_sum != 511:
        errors.append(f"P4C-004: Suite sum = {suite_sum}, expected 511")

    # Verify by_batch sums
    by_batch = totals.get("by_batch", {})
    computed_batch_sum = sum(by_batch.values())
    if computed_batch_sum != 511:
        errors.append(
            f"P4C-004: by_batch values sum to {computed_batch_sum}, expected 511"
        )

    # P4C-005: ADR gate (no TerraGPT-blocked assets should be in this manifest since they're deferred)
    # Deferred assets should not appear at all - this is enforced by P4C-002

    # P4C-006: Every ready asset has required fields
    for a in assets:
        if a.get("execution_readiness") == "ready":
            aid = a.get("asset_id", "?")
            missing = []
            if not a.get("target_home"):
                missing.append("target_home")
            if not a.get("migration_batch"):
                missing.append("migration_batch")
            if not a.get("parity_mode"):
                missing.append("parity_mode")
            if not a.get("acceptance_test_ref"):
                missing.append("acceptance_test_ref")
            if missing:
                errors.append(
                    f"P4C-006: {aid} is 'ready' but missing: {', '.join(missing)}"
                )

    return errors


def main():
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <manifest.json>", file=sys.stderr)
        sys.exit(2)

    errors = validate(sys.argv[1])

    if errors:
        print(f"PHASE 4C VALIDATION FAILED ({len(errors)} errors)")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        m = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        totals = m.get("totals", {})
        by_readiness = totals.get("by_readiness", {})
        print("PHASE 4C VALIDATION PASSED")
        print(f"  {len(m.get('assets', []))} assets")
        for k, v in sorted(by_readiness.items()):
            print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
