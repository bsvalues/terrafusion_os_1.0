#!/usr/bin/env python3
"""Phase 4D: Generate execution manifests from Phase 4C readiness data.

Reads phase4c.readiness.manifest.json, filters to ready assets only,
and produces:
  - phase4d.execution.manifest.json (master manifest)
  - phase4d.wave1a.forge-valuation.json
  - phase4d.wave1a.forge-statistics.json
  - phase4d.wave1a.forge-regression.json
  - phase4d.wave1a.forge-calibration.json (single asset, included for completeness)

Hard rules:
  - Only execution_readiness=ready assets enter any batch
  - No deferred asset appears
  - No blocked-security asset appears
  - Every asset has target_home, migration_batch, parity_mode, acceptance_test_ref
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
ROOT = Path(__file__).resolve().parent.parent

# Wave definitions: wave -> {batch_name: batch_label}
WAVES = {
    "1A": {
        "label": "Forge core logic",
        "batches": ["forge-valuation", "forge-statistics", "forge-regression", "forge-calibration"],
    },
    "1B": {
        "label": "Canon/Shared support",
        "batches": ["canon-sync", "canon-etl", "canon-observability", "os-shared", "os-admin"],
    },
    "1C": {
        "label": "Atlas spatial layer",
        "batches": ["atlas-gis"],
    },
    "1D": {
        "label": "UI + workflow",
        "batches": ["forge-ui", "dais-workflow", "dais-levy", "dais-pilt", "dossier-documents"],
    },
}

# Canonical destination path prefixes by suite
SUITE_DEST_PREFIXES = {
    "TerraForge": "apps/terraforge/src",
    "TerraAtlas": "apps/terraatlas/src",
    "TerraCanon": "apps/terracanon/src",
    "TerraDais": "apps/terradais/src",
    "TerraDossier": "apps/terradossier/src",
    "OS Admin": "backend/TerraFusion.Security",
    "Shared": "shared/src",
}

# Batch -> domain subdirectory
BATCH_DOMAIN_DIRS = {
    "forge-valuation": "domain/valuation",
    "forge-statistics": "domain/statistics",
    "forge-regression": "domain/regression",
    "forge-calibration": "domain/calibration",
    "forge-ui": "ui",
    "atlas-gis": "domain/gis",
    "canon-sync": "domain/sync",
    "canon-etl": "domain/etl",
    "canon-observability": "domain/observability",
    "dais-workflow": "domain/workflow",
    "dais-levy": "domain/levy",
    "dais-pilt": "domain/pilt",
    "dossier-documents": "domain/documents",
    "os-shared": "shared",
    "os-admin": "admin",
}


def build_target_path(asset: dict) -> str:
    """Build canonical destination path from suite + batch + target_home."""
    suite = asset.get("owner_suite", "Shared")
    batch = asset.get("migration_batch", "")
    target_home = asset.get("target_home", "")

    # Use target_home directly if it looks like a real path
    if target_home and "/" in target_home:
        return target_home

    # Fallback: build from suite prefix + batch domain
    prefix = SUITE_DEST_PREFIXES.get(suite, "apps/unknown/src")
    domain_dir = BATCH_DOMAIN_DIRS.get(batch, "domain/unknown")
    return f"{prefix}/{domain_dir}"


def build_batch_asset(asset: dict) -> dict:
    """Build a batch-level asset entry from a readiness asset."""
    return {
        "asset_id": asset["asset_id"],
        "source_repo": asset["source_repo"],
        "description": asset.get("description", ""),
        "owner_suite": asset["owner_suite"],
        "target_home": asset["target_home"],
        "target_path": build_target_path(asset),
        "parity_mode": asset["parity_mode"],
        "acceptance_test_ref": asset["acceptance_test_ref"],
        "acceptance_test_owner": "founder",
        "execution_status": "planned",
        "parity_result": "",
        "regression_result": "",
        "execution_notes": "",
    }


def main():
    p4c_path = ROOT / "phase4c.readiness.manifest.json"
    p4c = json.loads(p4c_path.read_text(encoding="utf-8"))

    # Filter to ready-only assets
    ready_assets = [a for a in p4c["assets"] if a["execution_readiness"] == "ready"]
    print(f"Ready assets: {len(ready_assets)}")

    # Safety checks
    for a in ready_assets:
        assert a["execution_readiness"] == "ready", f"{a['asset_id']} not ready"
        assert a.get("target_home"), f"{a['asset_id']} missing target_home"
        assert a.get("migration_batch"), f"{a['asset_id']} missing migration_batch"
        assert a.get("parity_mode"), f"{a['asset_id']} missing parity_mode"

    # Group by batch
    by_batch: dict[str, list[dict]] = {}
    for a in ready_assets:
        b = a["migration_batch"]
        by_batch.setdefault(b, []).append(a)

    # Determine wave membership for each batch
    batch_to_wave: dict[str, str] = {}
    for wave_id, wave_def in WAVES.items():
        for b in wave_def["batches"]:
            batch_to_wave[b] = wave_id

    # Build master execution manifest
    wave_summaries = {}
    all_batch_manifests = []

    for wave_id, wave_def in WAVES.items():
        wave_assets = []
        wave_batches = {}
        for batch_name in wave_def["batches"]:
            assets = by_batch.get(batch_name, [])
            if not assets:
                continue
            wave_batches[batch_name] = len(assets)
            wave_assets.extend(assets)

        wave_summaries[f"wave-{wave_id}"] = {
            "label": wave_def["label"],
            "total_assets": len(wave_assets),
            "batches": wave_batches,
            "execution_status": "planned" if wave_id == "1A" else "queued",
        }

    master = {
        "phase": "4D",
        "generated_at": NOW,
        "schema_version": "1.0",
        "description": "Tier 1 execution manifest for 342 ready assets. "
                       "Only execution_readiness=ready assets appear. "
                       "No deferred, no blocked-security.",
        "rules": {
            "P4D-001": "Every asset in an execution batch has execution_readiness=ready",
            "P4D-002": "No deferred asset appears in any execution manifest",
            "P4D-003": "No blocked-security asset appears in implementation",
            "P4D-004": "Every executing asset has target_home and target_path",
            "P4D-005": "Every executing asset has acceptance_test_ref and acceptance_test_owner",
            "P4D-006": "Completed assets must record parity_result and regression_result",
            "P4D-007": "Commits may only touch assets in the active batch manifest",
            "P4D-008": "Destination paths must match constitutionally assigned suite",
        },
        "execution_order": [
            "wave-1A: Forge core logic (forge-valuation, forge-statistics, forge-regression, forge-calibration)",
            "wave-1B: Canon/Shared support (canon-sync, canon-etl, canon-observability, os-shared, os-admin)",
            "wave-1C: Atlas spatial layer (atlas-gis)",
            "wave-1D: UI + workflow (forge-ui, dais-workflow, dais-levy, dais-pilt, dossier-documents)",
        ],
        "totals": {
            "ready_assets": len(ready_assets),
            "waves": wave_summaries,
            "by_batch": {b: len(assets) for b, assets in sorted(by_batch.items())},
            "batch_sum_check": sum(len(a) for a in by_batch.values()),
        },
    }

    master_path = ROOT / "phase4d.execution.manifest.json"
    master_path.write_text(
        json.dumps(master, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Master manifest: {master_path}")

    # Generate Wave 1A batch files
    wave1a_batches = ["forge-valuation", "forge-statistics", "forge-regression", "forge-calibration"]
    for batch_name in wave1a_batches:
        assets = by_batch.get(batch_name, [])
        if not assets:
            continue

        batch_manifest = {
            "phase": "4D",
            "wave": "1A",
            "batch": batch_name,
            "generated_at": NOW,
            "execution_status": "planned",
            "total_assets": len(assets),
            "by_source_repo": {},
            "by_suite": {},
            "assets": [],
        }

        repo_counts: dict[str, int] = {}
        suite_counts: dict[str, int] = {}
        for a in assets:
            entry = build_batch_asset(a)
            batch_manifest["assets"].append(entry)
            r = a["source_repo"]
            s = a["owner_suite"]
            repo_counts[r] = repo_counts.get(r, 0) + 1
            suite_counts[s] = suite_counts.get(s, 0) + 1

        batch_manifest["by_source_repo"] = dict(sorted(repo_counts.items()))
        batch_manifest["by_suite"] = dict(sorted(suite_counts.items()))

        batch_path = ROOT / f"phase4d.wave1a.{batch_name}.json"
        batch_path.write_text(
            json.dumps(batch_manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"Batch manifest: {batch_path} ({len(assets)} assets)")

    # Summary
    print(f"\n=== Phase 4D Execution Plan ===")
    print(f"Total ready assets: {len(ready_assets)}")
    for wave_id, summary in sorted(wave_summaries.items()):
        print(f"  {wave_id}: {summary['label']} — {summary['total_assets']} assets ({summary['execution_status']})")
        for b, c in sorted(summary["batches"].items()):
            print(f"    {b}: {c}")

    print(f"\nWave 1A batch files generated:")
    for batch_name in wave1a_batches:
        count = len(by_batch.get(batch_name, []))
        if count:
            print(f"  phase4d.wave1a.{batch_name}.json: {count} assets")


if __name__ == "__main__":
    main()
