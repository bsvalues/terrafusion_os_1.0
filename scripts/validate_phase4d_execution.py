#!/usr/bin/env python3
"""Phase 4D Execution Validator.

Validates:
  - Master execution manifest (phase4d.execution.manifest.json)
  - Individual batch manifests (phase4d.wave*.batch.json)

Enforces P4D-001 through P4D-008.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Constitutional suite -> allowed destination prefixes
SUITE_PATHS = {
    "TerraForge": ["backend/TerraFusion.AI/", "backend/TerraFusion.Core/",
                    "backend/TerraFusion.API/", "frontend/src/",
                    "apps/terraforge/", "shared/", "docs/", "scripts/"],
    "TerraAtlas": ["backend/TerraFusion.AI/", "backend/TerraFusion.Data/",
                    "backend/TerraFusion.API/", "frontend/src/",
                    "apps/terraatlas/", "scripts/", "docs/"],
    "TerraCanon": ["backend/TerraFusion.API/", "backend/TerraFusion.Data/", "frontend/src/",
                    "apps/terracanon/", "scripts/", "backend/monitoring/", "docs/"],
    "TerraDais": ["backend/TerraFusion.API/", "backend/TerraFusion.Core/", "frontend/src/",
                   "apps/terradais/", "docs/", "scripts/"],
    "TerraDossier": ["backend/TerraFusion.AI/", "frontend/src/", "apps/terradossier/",
                      "docs/"],
    "OS Admin": ["backend/TerraFusion.Security/", "backend/TerraFusion.API/",
                  "frontend/src/", ".github/", "backend/Dockerfile", "backend/deploy",
                  "config/", "docs/", "scripts/"],
    "Shared": ["backend/TerraFusion.", "frontend/src/", "shared/", "tests/", "docs/",
               "scripts/"],
}

BLOCKED_REPOS = {"TerraMiner", "TerraFusionPilt", "BCBSLevy"}


def validate_master(manifest_path: str) -> list[str]:
    """Validate master execution manifest."""
    errors = []
    m = json.loads(Path(manifest_path).read_text(encoding="utf-8"))

    totals = m.get("totals", {})
    ready = totals.get("ready_assets", 0)
    batch_sum = totals.get("batch_sum_check", 0)

    if ready != 342:
        errors.append(f"P4D-001: Expected 342 ready assets, found {ready}")
    if batch_sum != 342:
        errors.append(f"P4D-004: Batch sum = {batch_sum}, expected 342")

    return errors


def validate_batch(batch_path: str) -> list[str]:
    """Validate individual batch manifest."""
    errors = []
    m = json.loads(Path(batch_path).read_text(encoding="utf-8"))

    batch_name = m.get("batch", "?")
    assets = m.get("assets", [])

    for a in assets:
        aid = a.get("asset_id", "?")
        repo = a.get("source_repo", "")
        suite = a.get("owner_suite", "")
        target_home = a.get("target_home", "")
        target_path = a.get("target_path", "")
        parity_mode = a.get("parity_mode", "")
        test_ref = a.get("acceptance_test_ref", "")
        test_owner = a.get("acceptance_test_owner", "")

        # P4D-003: No blocked-security repos
        if repo in BLOCKED_REPOS:
            errors.append(
                f"P4D-003: {aid} from blocked repo {repo} in batch {batch_name}"
            )

        # P4D-004: Destination path required
        if not target_home:
            errors.append(f"P4D-004: {aid} missing target_home")
        if not target_path:
            errors.append(f"P4D-004: {aid} missing target_path")

        # P4D-005: Acceptance test required
        if not test_ref:
            errors.append(f"P4D-005: {aid} missing acceptance_test_ref")
        if not test_owner:
            errors.append(f"P4D-005: {aid} missing acceptance_test_owner")

        # P4D-008: Destination path matches suite
        if suite in SUITE_PATHS and target_path:
            allowed = SUITE_PATHS[suite]
            if not any(target_path.startswith(prefix) for prefix in allowed):
                errors.append(
                    f"P4D-008: {aid} suite={suite} but target_path={target_path} "
                    f"does not match any allowed prefix"
                )

    return errors


def main():
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <manifest.json> [batch1.json ...]",
              file=sys.stderr)
        sys.exit(2)

    all_errors = []

    manifest_path = sys.argv[1]
    if "execution.manifest" in manifest_path:
        all_errors.extend(validate_master(manifest_path))
        print(f"Validated master: {manifest_path}")

    # Validate any batch files passed as additional args
    for batch_path in sys.argv[2:] if len(sys.argv) > 2 else sys.argv[1:]:
        if "wave" in batch_path:
            errs = validate_batch(batch_path)
            all_errors.extend(errs)
            m = json.loads(Path(batch_path).read_text(encoding="utf-8"))
            print(f"Validated batch: {batch_path} ({len(m.get('assets', []))} assets, "
                  f"{len(errs)} errors)")

    if all_errors:
        print(f"\nPHASE 4D VALIDATION FAILED ({len(all_errors)} errors)")
        for e in all_errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nPHASE 4D VALIDATION PASSED")


if __name__ == "__main__":
    main()
