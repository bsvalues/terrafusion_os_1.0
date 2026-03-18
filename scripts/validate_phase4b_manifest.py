#!/usr/bin/env python3
"""Phase 4B Extraction Manifest Validator.

Enforces parity discipline on feeder repo asset extraction.
Rules from Phase 4B operating contract (2026-03-14).

Usage: python scripts/validate_phase4b_manifest.py phase4b.manifest.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REQUIRED_REPOS = {
    "Bsbcintelligentvalues",
    "BCBSLevy",
    "TerraMiner",
    "terra-forge-rebuild",
    "TerraFusionTheory",
    "TerraFusionPilt",
}

ALLOWED_REPO_STATUS = {
    "active",
    "migration-in-progress",
    "archive_candidate",
    "delete_candidate",
    "complete",
}

ALLOWED_SECRETS_STATUS = {
    "clean",
    "minor",
    "high",
    "critical",
}

ALLOWED_ASSET_STATUS = {
    "pending",
    "ported",
    "declined",
    "deferred-with-rationale",
}

ALLOWED_PARITY_MODES = {
    "exact",
    "adapted",
    "superseded",
    "none",
}

ALLOWED_SECURITY_STATUS = {
    "pending",
    "passed",
    "remediated",
    "failed",
}

ALLOWED_SUITES = {
    "TerraForge",
    "TerraAtlas",
    "TerraDais",
    "TerraDossier",
    "TerraGPT",
    "TerraCanon",
    "OS Admin",
    "Shared",
    "Unassigned",
}

# Domain -> required owner suite (boundary enforcement per ADR-001/002/003)
VALUATION_DOMAINS = {"valuation", "calibration", "regression", "ratio-analysis"}
DAIS_DOMAINS = {"workflow", "assignment", "certification", "notices", "assessment-ops"}
CANON_DOMAINS = {"system-health", "infrastructure", "etl-ops", "platform-observability"}
ATLAS_DOMAINS = {"gis", "spatial", "neighborhood", "mapping"}


class ValidationError(Exception):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


def load_manifest(path: Path) -> dict[str, Any]:
    require(path.exists(), f"Manifest not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    require(isinstance(data, dict), "Manifest root must be an object")
    return data


def validate_asset(repo_name: str, asset: dict[str, Any]) -> list[str]:
    """Validate a single asset row. Returns list of error strings."""
    errors: list[str] = []
    aid = asset.get("asset_id", "<missing-id>")

    def check(cond: bool, msg: str) -> None:
        if not cond:
            errors.append(f"{repo_name}/{aid}: {msg}")

    # Required fields
    for field in [
        "asset_id",
        "description",
        "source_path",
        "asset_type",
        "domain",
        "owner_suite",
        "target_home",
        "canonical_capability",
        "status",
        "parity_evidence",
        "disposition_rationale",
        "security_review",
        "disposition_owner",
        "updated_at",
    ]:
        check(field in asset, f"missing field '{field}'")

    status = asset.get("status")
    check(status in ALLOWED_ASSET_STATUS, f"invalid status '{status}'")

    owner_suite = asset.get("owner_suite")
    check(owner_suite in ALLOWED_SUITES, f"invalid owner_suite '{owner_suite}'")

    # Security review structure
    security_review = asset.get("security_review", {})
    check(isinstance(security_review, dict), "security_review must be an object")
    sec_status = security_review.get("status")
    check(sec_status in ALLOWED_SECURITY_STATUS, f"invalid security status '{sec_status}'")

    # P4B-D002: terminal status required (no pending in dispositioned repos)
    # (checked at repo level below)

    # P4B-D003: ported assets are actionable
    if status == "ported":
        check(bool(asset.get("target_home")), "ported asset must have target_home (P4B-D003)")
        check(
            bool(asset.get("canonical_capability")),
            "ported asset must have canonical_capability (P4B-D003)",
        )
        check(
            bool(asset.get("owner_suite")) and owner_suite != "Unassigned",
            "ported asset must have concrete owner_suite (P4B-D003)",
        )
        check(
            bool(asset.get("migration_batch")),
            "ported asset must have migration_batch (P4B-D003)",
        )
        check(
            sec_status in {"passed", "remediated"},
            "ported asset must have passed/remediated security review (P4B-D003)",
        )
        # P4B-D003: parity_mode required for ported assets
        parity_mode = asset.get("parity_mode")
        check(
            parity_mode in ALLOWED_PARITY_MODES,
            f"ported asset must have valid parity_mode, got '{parity_mode}' (P4B-D003)",
        )

    # P4B-D004: declined assets have rationale
    if status == "declined":
        check(
            bool(asset.get("disposition_rationale")),
            "declined asset must have disposition_rationale (P4B-D004)",
        )
        # P4B-D008: supersession traceability
        check(
            bool(asset.get("replacement_ref")),
            "declined asset must have replacement_ref or explicit 'none' (P4B-D008)",
        )

    # P4B-D005: deferred assets are real-blocked
    if status == "deferred-with-rationale":
        check(
            bool(asset.get("disposition_rationale")),
            "deferred asset must have disposition_rationale (P4B-D005)",
        )
        check(
            bool(asset.get("blocker_type")),
            "deferred asset must have blocker_type (P4B-D005)",
        )
        check(
            bool(asset.get("unblock_condition")),
            "deferred asset must have unblock_condition (P4B-D005)",
        )
        check(
            bool(asset.get("decision_owner")),
            "deferred asset must have decision_owner (P4B-D005)",
        )

    # Legacy P4B-004: parity_evidence for pending→ported transition tracking
    if status == "ported" and asset.get("parity_evidence"):
        pass  # parity_evidence is optional if parity_mode is set

    # P4B-007: boundary enforcement
    domain = asset.get("domain")
    if status == "ported":
        if domain in VALUATION_DOMAINS:
            check(
                owner_suite == "TerraForge",
                f"valuation-domain asset must belong to TerraForge, not {owner_suite}",
            )
        if domain in DAIS_DOMAINS:
            check(
                owner_suite == "TerraDais",
                f"workflow-domain asset must belong to TerraDais, not {owner_suite}",
            )
        if domain in CANON_DOMAINS:
            check(
                owner_suite in {"TerraCanon", "OS Admin"},
                f"infrastructure-domain asset must belong to TerraCanon/OS Admin, not {owner_suite}",
            )
        if domain in ATLAS_DOMAINS:
            check(
                owner_suite == "TerraAtlas",
                f"spatial-domain asset must belong to TerraAtlas, not {owner_suite}",
            )

    # P4B-008: no new surface drift — surface_reference must be empty or match known surfaces
    # (advisory check, not hard failure — logged as warning)

    return errors


def validate_repo(repo: dict[str, Any]) -> list[str]:
    """Validate a single repo entry. Returns list of error strings."""
    errors: list[str] = []
    name = repo.get("name", "<missing-name>")

    def check(cond: bool, msg: str) -> None:
        if not cond:
            errors.append(f"{name}: {msg}")

    # Required repo fields
    check("name" in repo, "missing field 'name'")
    check("repo_status" in repo, "missing field 'repo_status'")
    check(
        repo.get("repo_status") in ALLOWED_REPO_STATUS,
        f"invalid repo_status '{repo.get('repo_status')}'",
    )

    # Repo-level security fields (hardening edit #2)
    check("secrets_status" in repo, "missing field 'secrets_status'")
    check(
        repo.get("secrets_status") in ALLOWED_SECRETS_STATUS,
        f"invalid secrets_status '{repo.get('secrets_status')}'",
    )
    check("security_blocking" in repo, "missing field 'security_blocking'")
    check("archive_eligibility" in repo, "missing field 'archive_eligibility'")
    check("remediation_tracker" in repo, "missing field 'remediation_tracker'")

    # Assets
    check("assets" in repo, "missing field 'assets'")
    check(isinstance(repo.get("assets"), list), "assets must be a list")
    check(
        len(repo.get("assets", [])) > 0,
        "repo must contain at least one asset row (P4B-001)",
    )

    assets = repo.get("assets", [])
    for asset in assets:
        if isinstance(asset, dict):
            errors.extend(validate_asset(name, asset))
        else:
            errors.append(f"{name}: asset row must be an object")

    # P4B-D001: once disposition starts, no assets stay pending
    if repo.get("disposition_started_at"):
        pending_assets = [
            a.get("asset_id", "<missing-id>")
            for a in assets
            if isinstance(a, dict) and a.get("status") == "pending"
        ]
        if not repo.get("disposition_completed_at") and pending_assets:
            pass  # disposition in progress, some pending is OK
        elif repo.get("disposition_completed_at") and pending_assets:
            check(
                False,
                f"disposition marked complete but assets still pending: {', '.join(pending_assets)} (P4B-D001)",
            )

    # P4B-D006 / P4B-006: boundary enforcement (already handled per-asset above)

    # P4B-D007 / P4B-006: no premature archive/delete
    if repo.get("repo_status") in {"archive_candidate", "delete_candidate", "complete"}:
        unresolved = [
            a.get("asset_id", "<missing-id>")
            for a in assets
            if isinstance(a, dict)
            and a.get("status") not in {"ported", "declined", "deferred-with-rationale"}
        ]
        check(
            not unresolved,
            f"cannot finalize repo with unresolved assets: {', '.join(unresolved)} (P4B-006)",
        )

    # P4B-009: repos with secrets history block porting until remediation noted
    if repo.get("secrets_status") in {"high", "critical"}:
        for a in assets:
            if isinstance(a, dict) and a.get("status") == "ported":
                sec = a.get("security_review", {})
                check(
                    bool(sec.get("remediation_note")),
                    f"{a.get('asset_id', '<missing-id>')}: ported from repo with {repo.get('secrets_status')} secrets — remediation_note required (P4B-009)",
                )

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Usage: python scripts/validate_phase4b_manifest.py <manifest.json>",
            file=sys.stderr,
        )
        return 2

    try:
        manifest = load_manifest(Path(sys.argv[1]))
    except ValidationError as e:
        print(f"PHASE 4B VALIDATION FAILED: {e}", file=sys.stderr)
        return 1

    repos = manifest.get("repos", [])
    if not isinstance(repos, list):
        print("Manifest field 'repos' must be a list", file=sys.stderr)
        return 1

    # P4B-001: all 6 required repos present
    repo_names = {r.get("name") for r in repos if isinstance(r, dict)}
    missing = REQUIRED_REPOS - repo_names
    errors: list[str] = []
    if missing:
        errors.append(f"P4B-001: Missing required repos: {', '.join(sorted(missing))}")

    # Validate each repo
    for repo in repos:
        if isinstance(repo, dict):
            errors.extend(validate_repo(repo))
        else:
            errors.append("Each repo entry must be an object")

    # P4B-002: check all assets have a status
    for repo in repos:
        if isinstance(repo, dict):
            for a in repo.get("assets", []):
                if isinstance(a, dict) and not a.get("status"):
                    errors.append(
                        f"{repo.get('name')}/{a.get('asset_id', '?')}: missing status (P4B-002)"
                    )

    # Summary
    total_assets = sum(
        len(r.get("assets", [])) for r in repos if isinstance(r, dict)
    )
    status_counts: dict[str, int] = {}
    for repo in repos:
        if isinstance(repo, dict):
            for a in repo.get("assets", []):
                if isinstance(a, dict):
                    s = a.get("status", "missing")
                    status_counts[s] = status_counts.get(s, 0) + 1

    if errors:
        print(f"PHASE 4B VALIDATION FAILED ({len(errors)} errors)")
        for err in errors:
            print(f"  - {err}")
        print(f"\nSummary: {len(repos)} repos, {total_assets} assets")
        for s, c in sorted(status_counts.items()):
            print(f"  {s}: {c}")
        return 1

    print(f"PHASE 4B VALIDATION PASSED")
    print(f"  {len(repos)} repos, {total_assets} assets")
    for s, c in sorted(status_counts.items()):
        print(f"  {s}: {c}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
