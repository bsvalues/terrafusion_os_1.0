#!/usr/bin/env python3
"""Converts raw inventory JSON arrays into the hardened Phase 4B manifest schema.

Usage: python scripts/build_manifest_from_inventory.py
  Reads phase4b.manifest.json (scaffold with empty assets arrays)
  Reads scripts/inventory/*.json (raw agent output per repo)
  Writes updated phase4b.manifest.json with populated assets
"""
import json
import sys
from pathlib import Path
from datetime import date

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "phase4b.manifest.json"
INVENTORY_DIR = REPO_ROOT / "scripts" / "inventory"

TODAY = date.today().isoformat()


def transform_asset(raw: dict) -> dict:
    """Transform a raw inventory asset into the hardened manifest schema."""
    return {
        "asset_id": raw.get("asset_id", ""),
        "description": raw.get("description", ""),
        "source_path": raw.get("source_path", ""),
        "asset_type": raw.get("asset_type", ""),
        "domain": raw.get("domain", ""),
        "owner_suite": raw.get("owner_suite", "Unassigned"),
        "target_home": raw.get("target_home", ""),
        "canonical_capability": raw.get("canonical_capability", ""),
        "surface_reference": raw.get("surface_reference", ""),
        "status": "pending",
        "adr_reference": "",
        "parity_evidence": "",
        "disposition_rationale": "",
        "security_review": {
            "status": "pending",
            "remediation_note": ""
        },
        "disposition_owner": "founder",
        "updated_at": TODAY
    }


def main() -> int:
    if not MANIFEST_PATH.exists():
        print(f"Manifest not found: {MANIFEST_PATH}", file=sys.stderr)
        return 1

    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        manifest = json.load(f)

    if not INVENTORY_DIR.exists():
        print(f"Inventory directory not found: {INVENTORY_DIR}", file=sys.stderr)
        print("Create scripts/inventory/ and place per-repo JSON files there.")
        return 1

    updated = 0
    for inv_file in sorted(INVENTORY_DIR.glob("*.json")):
        repo_name = inv_file.stem  # e.g., "terra-forge-rebuild"

        with inv_file.open("r", encoding="utf-8") as f:
            raw_assets = json.load(f)

        if not isinstance(raw_assets, list):
            print(f"Warning: {inv_file.name} is not a JSON array, skipping")
            continue

        # Find matching repo in manifest
        matched = False
        for repo in manifest.get("repos", []):
            if repo.get("name") == repo_name:
                repo["assets"] = [transform_asset(a) for a in raw_assets]
                print(f"  {repo_name}: {len(raw_assets)} assets loaded")
                updated += 1
                matched = True
                break

        if not matched:
            print(f"  Warning: no manifest repo matches '{repo_name}', skipping")

    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nUpdated {updated} repos in {MANIFEST_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
