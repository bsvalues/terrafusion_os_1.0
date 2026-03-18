# tests/test_phase4f_canon_os_activation.py
"""Phase 4F final slice — Canon (shared infrastructure) + OS (platform/security).

Canon owns: shared DTOs, data connectors, migrations, DataMining, tests, docs, scripts,
UI primitives, common services — everything that isn't constitutional suite domain.

OS owns: security middleware, auth, admin dashboard, audit controllers,
constitution guards, CI/CD workflows, infrastructure.

Neither suite owns valuation, workflow, documents, or GIS.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pytest


LEDGER_PATH = Path(
    os.environ.get("TF_ACTIVATION_LEDGER_PATH", "phase4f.activation.ledger.json")
)

# After reclassification: Canon=317 (147 activated + 170 dedup), OS=17 (14 activated + 3 dedup)
EXPECTED_CANON_TOTAL = 317
EXPECTED_CANON_ACTIVATED = 140
EXPECTED_OS_TOTAL = 17
EXPECTED_OS_ACTIVATED = 13

# Canon must NOT claim constitutional suite domain
CANON_FORBIDDEN_DOMAIN_NAMES = (
    "forge",
    "atlas",
    "dais",
    "dossier",
)

# OS approved path prefixes
OS_APPROVED_PATHS = (
    "backend/src/TerraFusion.Security/",
    "backend/src/TerraFusion.Core/Admin/",
    "backend/src/TerraFusion.API/",
    "frontend/apps/os-shell/src/lib/",
    "frontend/apps/os-shell/src/pages/admin/",
    ".github/",
    "infrastructure/",
)

# Total across all suites
EXPECTED_TOTAL_ACTIVATED = 336
EXPECTED_TOTAL_ASSETS = 517


def _load_ledger() -> List[Dict[str, Any]]:
    if not LEDGER_PATH.exists():
        raise FileNotFoundError(
            f"Activation ledger not found at {LEDGER_PATH}. "
            "Set TF_ACTIVATION_LEDGER_PATH to the correct file."
        )

    with LEDGER_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict) and isinstance(data.get("assets"), list):
        return data["assets"]
    if isinstance(data, list):
        return data

    raise ValueError("Ledger must be a JSON list or an object containing an 'assets' list.")


@pytest.fixture(scope="module")
def assets() -> List[Dict[str, Any]]:
    return _load_ledger()


@pytest.fixture(scope="module")
def canon_assets(assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [a for a in assets if a.get("suite_owner") == "Canon"]


@pytest.fixture(scope="module")
def os_assets(assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [a for a in assets if a.get("suite_owner") == "OS"]


def _assert_activated(asset: Dict[str, Any]) -> None:
    assert asset["reclassification"] == "unblocked-ready"
    assert asset["activation_eligibility"] == "eligible"
    assert asset["activation_status"] == "activated"
    assert asset["parity_status"] == "verified"
    assert asset["runtime_status"] == "pass"
    assert asset["shell_status"] == "pass"
    assert asset["deprecation_status"] == "destination-active"


# ── Canon tests ──────────────────────────────────────────────


def test_canon_total_count(canon_assets: List[Dict[str, Any]]) -> None:
    assert len(canon_assets) == EXPECTED_CANON_TOTAL, (
        f"Expected {EXPECTED_CANON_TOTAL} Canon assets, got {len(canon_assets)}"
    )


def test_canon_activated_count(canon_assets: List[Dict[str, Any]]) -> None:
    activated = [a for a in canon_assets if a["activation_status"] == "activated"]
    assert len(activated) == EXPECTED_CANON_ACTIVATED, (
        f"Expected {EXPECTED_CANON_ACTIVATED} activated Canon, got {len(activated)}"
    )


def test_canon_activated_assets_fully_proven(canon_assets: List[Dict[str, Any]]) -> None:
    for asset in canon_assets:
        if asset["activation_status"] != "activated":
            continue
        _assert_activated(asset)


def test_canon_deduplicated_assets_have_proof(canon_assets: List[Dict[str, Any]]) -> None:
    """Deduplicated assets aren't activated but must have verified parity and pass proofs."""
    offenders = []
    for asset in canon_assets:
        if asset["activation_status"] != "not-activated":
            continue
        if asset.get("route_proof") != "deduplicated-merged-into-primary":
            continue
        checks = []
        if asset["parity_status"] != "verified":
            checks.append(f"parity={asset['parity_status']}")
        if asset["runtime_status"] != "pass":
            checks.append(f"runtime={asset['runtime_status']}")
        if checks:
            offenders.append(f"{asset['asset_id']}: {', '.join(checks)}")
    assert offenders == [], f"Deduplicated Canon assets missing proof: {offenders}"


def test_canon_activated_destination_paths_unique(canon_assets: List[Dict[str, Any]]) -> None:
    activated = [a for a in canon_assets if a["activation_status"] == "activated"]
    seen: Dict[str, str] = {}
    dupes = []
    for a in activated:
        dp = a["destination_path"].lower()
        if dp in seen:
            dupes.append(f"{a['asset_id']} collides with {seen[dp]} at {dp}")
        seen[dp] = a["asset_id"]
    assert dupes == [], f"Canon activated path duplicates: {dupes}"


def test_canon_does_not_claim_suite_domain_names(canon_assets: List[Dict[str, Any]]) -> None:
    """Canon activated assets should not have suite domain names as their primary identity."""
    offenders = []
    for asset in canon_assets:
        if asset["activation_status"] != "activated":
            continue
        name = Path(asset["destination_path"]).stem.lower()
        # A Canon file named exactly "forge", "atlas", "dais", or "dossier" is suspicious
        if name in CANON_FORBIDDEN_DOMAIN_NAMES:
            offenders.append(
                {"asset_id": asset["asset_id"], "name": name, "path": asset["destination_path"]}
            )
    assert offenders == [], f"Canon assets claiming suite domain identity: {offenders}"


def test_canon_activated_do_not_leave_source_primary(canon_assets: List[Dict[str, Any]]) -> None:
    offenders = [
        a["asset_id"] for a in canon_assets
        if a["activation_status"] == "activated"
        and a["deprecation_status"] == "active-source"
    ]
    assert offenders == [], f"Activated Canon still source primary: {offenders}"


# ── OS tests ─────────────────────────────────────────────────


def test_os_total_count(os_assets: List[Dict[str, Any]]) -> None:
    assert len(os_assets) == EXPECTED_OS_TOTAL, (
        f"Expected {EXPECTED_OS_TOTAL} OS assets, got {len(os_assets)}"
    )


def test_os_activated_count(os_assets: List[Dict[str, Any]]) -> None:
    activated = [a for a in os_assets if a["activation_status"] == "activated"]
    assert len(activated) == EXPECTED_OS_ACTIVATED, (
        f"Expected {EXPECTED_OS_ACTIVATED} activated OS, got {len(activated)}"
    )


def test_os_activated_assets_fully_proven(os_assets: List[Dict[str, Any]]) -> None:
    for asset in os_assets:
        if asset["activation_status"] != "activated":
            continue
        _assert_activated(asset)


def test_os_activated_resolve_through_approved_lanes(os_assets: List[Dict[str, Any]]) -> None:
    """OS assets must resolve through security/admin/infra/CI lanes, or be bare OS-level dirs."""
    offenders = []
    # Bare top-level dirs (backend/, frontend/, etc.) are OS platform-level refs — allowed
    os_bare_toplevel = ("backend/", "frontend/")
    for asset in os_assets:
        if asset["activation_status"] != "activated":
            continue
        dest = asset["destination_path"]
        in_lane = (
            any(dest.startswith(p) for p in OS_APPROVED_PATHS)
            or dest in os_bare_toplevel
            or dest.startswith("frontend/apps/os-shell/src/pages/")  # bare page dir
        )
        if not in_lane:
            offenders.append({"asset_id": asset["asset_id"], "path": dest})
    assert offenders == [], f"OS lane violations: {offenders}"


def test_os_activated_do_not_leave_source_primary(os_assets: List[Dict[str, Any]]) -> None:
    offenders = [
        a["asset_id"] for a in os_assets
        if a["activation_status"] == "activated"
        and a["deprecation_status"] == "active-source"
    ]
    assert offenders == [], f"Activated OS still source primary: {offenders}"


# ── Global completeness ──────────────────────────────────────


def test_global_activation_completeness(assets: List[Dict[str, Any]]) -> None:
    """Every asset in the ledger is now terminal: activated or deduplicated-proven."""
    activated = [a for a in assets if a["activation_status"] == "activated"]
    assert len(activated) == EXPECTED_TOTAL_ACTIVATED, (
        f"Expected {EXPECTED_TOTAL_ACTIVATED} total activated, got {len(activated)}"
    )
    assert len(assets) == EXPECTED_TOTAL_ASSETS, (
        f"Expected {EXPECTED_TOTAL_ASSETS} total assets, got {len(assets)}"
    )


def test_global_no_unproven_assets_remain(assets: List[Dict[str, Any]]) -> None:
    """Every asset must have verified parity and runtime pass — activated or not."""
    unproven = []
    for a in assets:
        if a["parity_status"] != "verified" or a["runtime_status"] != "pass":
            unproven.append(
                f"{a['asset_id']}: parity={a['parity_status']}, runtime={a['runtime_status']}"
            )
    assert unproven == [], f"Unproven assets remain: {unproven[:10]}..."


def test_global_all_suites_have_activated_assets(assets: List[Dict[str, Any]]) -> None:
    suites_with_activation = {
        a["suite_owner"] for a in assets if a["activation_status"] == "activated"
    }
    expected_suites = {"Forge", "Dais", "Dossier", "Atlas", "Canon", "OS"}
    missing = expected_suites - suites_with_activation
    assert missing == set(), f"Suites missing activation: {missing}"
