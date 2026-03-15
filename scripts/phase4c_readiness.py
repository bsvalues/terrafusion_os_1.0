#!/usr/bin/env python3
"""Phase 4C: Execution Readiness Gating.

Reads phase4b.manifest.json, extracts all 511 ported assets, classifies each
into a readiness state, and writes phase4c.readiness.manifest.json.

Readiness tiers (user-mandated):
  Tier 1 (ready):            terra-forge-rebuild, Bsbcintelligentvalues, TerraFusionTheory
  Tier 2 (blocked-security): BCBSLevy (data exposure, history scrub needed)
  Tier 3 (blocked-security): TerraFusionPilt (key NOT ROTATED), TerraMiner (key NOT ROTATED)

No deferred asset enters implementation.
No secrets-blocked asset is activated.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# --- Tier classification ---
TIER_1_REPOS = {"terra-forge-rebuild", "Bsbcintelligentvalues", "TerraFusionTheory"}
TIER_2_REPOS = {"BCBSLevy"}
TIER_3_REPOS = {"TerraFusionPilt", "TerraMiner"}

SECURITY_GATES = {
    "BCBSLevy": {
        "execution_readiness": "blocked-security",
        "readiness_reason": "Repo has HIGH secrets_status: 6 PostgreSQL dumps in backups/, "
                           "real 2025 levy Excel files. Data exposure (not credentials). "
                           "History scrub required before live activation.",
        "activation_gate": "Data exposure remediation recorded and history scrub completed",
    },
    "TerraFusionPilt": {
        "execution_readiness": "blocked-security",
        "readiness_reason": "Repo has HIGH secrets_status: session secret in .env.production. "
                           "Key NOT ROTATED. Service dormant.",
        "activation_gate": "Session secret rotated and rotation evidence recorded",
    },
    "TerraMiner": {
        "execution_readiness": "blocked-security",
        "readiness_reason": "Repo has CRITICAL secrets_status: RapidAPI key exposed, "
                           "PACS.env.txt with server/user creds. Keys NOT ROTATED.",
        "activation_gate": "RapidAPI key rotated (or confirmed lapsed), PACS credentials "
                          "rotated, rotation evidence recorded",
    },
}


def acceptance_test_ref(suite: str, batch: str) -> str:
    """Generate acceptance test reference from suite and batch."""
    return f"test/{suite.lower().replace(' ', '-')}/{batch}/parity-check"


def main():
    p4b_path = Path(__file__).resolve().parent.parent / "phase4b.manifest.json"
    p4c_path = Path(__file__).resolve().parent.parent / "phase4c.readiness.manifest.json"

    print(f"Reading Phase 4B manifest: {p4b_path}")
    manifest = json.loads(p4b_path.read_text(encoding="utf-8"))

    # Extract all ported assets with readiness classification
    readiness_assets = []
    batch_rollup: dict[str, int] = {}
    suite_rollup: dict[str, int] = {}
    readiness_rollup: dict[str, int] = {}
    tier_rollup: dict[str, int] = {}
    repo_rollup: dict[str, dict[str, int]] = {}

    for repo in manifest["repos"]:
        rname = repo["name"]
        repo_rollup[rname] = {"ready": 0, "blocked-security": 0}

        for asset in repo["assets"]:
            if asset.get("status") != "ported":
                continue

            # Determine readiness
            if rname in TIER_1_REPOS:
                tier = 1
                readiness = "ready"
                reason = "Tier 1 repo: clean or minor secrets status, remediation complete"
                gate = "none"
            elif rname in TIER_2_REPOS:
                tier = 2
                sg = SECURITY_GATES[rname]
                readiness = sg["execution_readiness"]
                reason = sg["readiness_reason"]
                gate = sg["activation_gate"]
            elif rname in TIER_3_REPOS:
                tier = 3
                sg = SECURITY_GATES[rname]
                readiness = sg["execution_readiness"]
                reason = sg["readiness_reason"]
                gate = sg["activation_gate"]
            else:
                tier = 0
                readiness = "blocked-dependency"
                reason = f"Unknown repo tier: {rname}"
                gate = "Manual classification required"

            entry = {
                "asset_id": asset["asset_id"],
                "source_repo": rname,
                "description": asset.get("description", ""),
                "owner_suite": asset.get("owner_suite", ""),
                "target_home": asset.get("target_home", ""),
                "migration_batch": asset.get("migration_batch", ""),
                "parity_mode": asset.get("parity_mode", ""),
                "security_review": asset.get("security_review", {}),
                "execution_readiness": readiness,
                "readiness_reason": reason,
                "activation_gate": gate,
                "parity_checkpoint": f"verify-{asset.get('parity_mode', 'adapted')}-parity",
                "acceptance_test_ref": acceptance_test_ref(
                    asset.get("owner_suite", "unknown"),
                    asset.get("migration_batch", "unknown"),
                ),
                "implementation_owner": "founder",
                "implementation_tier": tier,
                "updated_at": NOW,
            }
            readiness_assets.append(entry)

            # Rollups
            b = asset.get("migration_batch", "(empty)")
            s = asset.get("owner_suite", "(empty)")
            batch_rollup[b] = batch_rollup.get(b, 0) + 1
            suite_rollup[s] = suite_rollup.get(s, 0) + 1
            readiness_rollup[readiness] = readiness_rollup.get(readiness, 0) + 1
            tier_rollup[tier] = tier_rollup.get(tier, 0) + 1
            repo_rollup[rname][readiness] = repo_rollup[rname].get(readiness, 0) + 1

    # Build Phase 4C manifest
    p4c_manifest = {
        "phase": "4C",
        "generated_at": NOW,
        "schema_version": "1.0",
        "description": "Execution readiness manifest for 511 ported assets from Phase 4B. "
                       "No deferred asset appears. No secrets-blocked asset is activated.",
        "source": "phase4b.manifest.json",
        "rules": {
            "P4C-001": "All 511 ported assets have execution_readiness classification",
            "P4C-002": "No deferred asset appears in any implementation batch",
            "P4C-003": "Assets from repos with non-rotated keys cannot be marked ready",
            "P4C-004": "Batch rollup reconciles exactly to 511 ported assets",
            "P4C-005": "TerraGPT-blocked assets remain non-executable until charter ADR accepted",
            "P4C-006": "Every ready asset has target_home, migration_batch, parity_mode, acceptance_test_ref",
        },
        "security_gates": {
            "TerraMiner": "CRITICAL: RapidAPI key + PACS creds NOT ROTATED. Blocked.",
            "TerraFusionPilt": "HIGH: Session secret NOT ROTATED. Blocked.",
            "BCBSLevy": "HIGH: Data exposure (PostgreSQL dumps, levy Excel). History scrub needed. Blocked.",
        },
        "adr_registry": {
            "ADR-TBD-5": {
                "scope": "TerraGPT charter",
                "status": "pending-formal-acceptance",
                "affects": "103 deferred assets across 6 repos",
                "note": "Defer decisions are correct. ADR number needs formal registry lock. "
                        "If ADR-TBD-5 is reserved for another scope, renumber TerraGPT to next available.",
            },
        },
        "totals": {
            "ported_assets": len(readiness_assets),
            "by_readiness": dict(sorted(readiness_rollup.items())),
            "by_tier": {f"tier-{k}": v for k, v in sorted(tier_rollup.items())},
            "by_suite": dict(sorted(suite_rollup.items())),
            "by_batch": dict(sorted(batch_rollup.items())),
            "batch_sum_check": sum(batch_rollup.values()),
            "suite_sum_check": sum(suite_rollup.values()),
        },
        "tier_definitions": {
            "tier-1": {
                "label": "Implementation-ready",
                "repos": sorted(TIER_1_REPOS),
                "gate": "none",
                "asset_count": tier_rollup.get(1, 0),
            },
            "tier-2": {
                "label": "Blocked until data exposure remediation",
                "repos": sorted(TIER_2_REPOS),
                "gate": "Data exposure remediation recorded and history scrub completed",
                "asset_count": tier_rollup.get(2, 0),
            },
            "tier-3": {
                "label": "Blocked until key rotation",
                "repos": sorted(TIER_3_REPOS),
                "gate": "Credential rotation completed and evidence recorded",
                "asset_count": tier_rollup.get(3, 0),
            },
        },
        "assets": readiness_assets,
    }

    # Write
    p4c_path.write_text(
        json.dumps(p4c_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # --- Summary ---
    print(f"\n=== Phase 4C Readiness Manifest ===")
    print(f"Total ported assets: {len(readiness_assets)}")
    print(f"Batch sum check: {sum(batch_rollup.values())}")
    print(f"Suite sum check: {sum(suite_rollup.values())}")

    print(f"\nBy readiness state:")
    for r, c in sorted(readiness_rollup.items()):
        print(f"  {r}: {c}")

    print(f"\nBy implementation tier:")
    for t, c in sorted(tier_rollup.items()):
        print(f"  Tier {t}: {c}")

    print(f"\nBy owner suite:")
    for s, c in sorted(suite_rollup.items()):
        print(f"  {s}: {c}")

    print(f"\nBy migration batch (reconciled to {sum(batch_rollup.values())}):")
    for b, c in sorted(batch_rollup.items()):
        print(f"  {b}: {c}")

    print(f"\nBy repo:")
    for rname, counts in sorted(repo_rollup.items()):
        parts = [f"{k}={v}" for k, v in sorted(counts.items()) if v > 0]
        total = sum(counts.values())
        print(f"  {rname}: {total} ({', '.join(parts)})")

    print(f"\nManifest written: {p4c_path}")
    print(f"Run validator: python scripts/validate_phase4c_readiness.py phase4c.readiness.manifest.json")


if __name__ == "__main__":
    main()
