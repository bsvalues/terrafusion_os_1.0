# tests/test_phase4f_dais_activation.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pytest


LEDGER_PATH = Path(
    os.environ.get("TF_ACTIVATION_LEDGER_PATH", "phase4f.activation.ledger.json")
)

CORE_DAIS_EXPECTED_OWNERS = {
    "AppealsWorkflow": "Dais",
    "WorkflowComponents": "Dais",
    "RollReadiness": "Dais",
    "DefensePacket": "Dais",
    "FieldStudio": "Dais",
    "AuditTrailPage": "Dais",
    "AuditTab": "Dais",
    "daisService": "Dais",
    "fieldStore": "Dais",
}

REQUIRED_PRIOR_DEPENDENCIES = {
    "dossierService": "Dossier",
}

# Approved shell paths for Dais — no rogue top-level launch points
APPROVED_DAIS_SHELL_PATHS = [
    "frontend/apps/os-shell/src/pages/dais/",
    "frontend/apps/os-shell/src/components/dais/",
    "frontend/apps/os-shell/src/services/",
    "frontend/apps/os-shell/src/hooks/",
    "frontend/apps/os-shell/src/stores/",
    "frontend/apps/os-shell/src/types/",
    "backend/src/TerraFusion.",
]


def _load_ledger() -> List[Dict[str, Any]]:
    if not LEDGER_PATH.exists():
        raise FileNotFoundError(
            f"Activation ledger not found at {LEDGER_PATH}. "
            "Set TF_ACTIVATION_LEDGER_PATH to the correct file."
        )

    with LEDGER_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        if "assets" in data and isinstance(data["assets"], list):
            return data["assets"]
        raise ValueError("Ledger JSON object must contain an 'assets' list.")

    if isinstance(data, list):
        return data

    raise ValueError("Ledger must be a JSON list or an object containing an 'assets' list.")


@pytest.fixture(scope="module")
def assets() -> List[Dict[str, Any]]:
    return _load_ledger()


@pytest.fixture(scope="module")
def asset_index(assets: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    index: Dict[str, Dict[str, Any]] = {}

    for asset in assets:
        destination_path = asset.get("destination_path", "")
        name = Path(destination_path).stem or destination_path.split("/")[-1]
        if name:
            index[name] = asset

    return index


def _assert_activated(asset: Dict[str, Any]) -> None:
    assert asset["reclassification"] == "unblocked-ready"
    assert asset["activation_eligibility"] == "eligible"
    assert asset["activation_status"] == "activated"
    assert asset["parity_status"] == "verified"
    assert asset["runtime_status"] == "pass"
    assert asset["shell_status"] == "pass"
    assert asset["deprecation_status"] == "destination-active"


def test_core_dais_assets_exist_in_ledger(asset_index: Dict[str, Dict[str, Any]]) -> None:
    missing = sorted(
        name for name in CORE_DAIS_EXPECTED_OWNERS if name not in asset_index
    )
    assert missing == [], f"Missing core Dais ledger entries: {missing}"


def test_core_dais_assets_have_correct_suite_owner(
    asset_index: Dict[str, Dict[str, Any]]
) -> None:
    mismatches = []

    for name, expected_owner in CORE_DAIS_EXPECTED_OWNERS.items():
        actual_owner = asset_index[name]["suite_owner"]
        if actual_owner != expected_owner:
            mismatches.append(
                {"asset": name, "expected_owner": expected_owner, "actual_owner": actual_owner}
            )

    assert mismatches == [], f"Core Dais owner mismatches: {mismatches}"


def test_required_prior_dependencies_are_already_active(
    asset_index: Dict[str, Dict[str, Any]]
) -> None:
    for name, expected_owner in REQUIRED_PRIOR_DEPENDENCIES.items():
        assert name in asset_index, f"Required dependency missing from ledger: {name}"
        asset = asset_index[name]
        assert asset["suite_owner"] == expected_owner
        _assert_activated(asset)


@pytest.mark.parametrize("asset_name", sorted(CORE_DAIS_EXPECTED_OWNERS.keys()))
def test_core_dais_assets_are_fully_activated_after_slice(
    asset_name: str,
    asset_index: Dict[str, Dict[str, Any]],
) -> None:
    asset = asset_index[asset_name]
    _assert_activated(asset)


def test_activated_dais_assets_do_not_leave_source_primary(
    assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in assets:
        if asset.get("suite_owner") != "Dais":
            continue
        if asset.get("activation_status") != "activated":
            continue
        if asset.get("deprecation_status") == "active-source":
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": asset.get("destination_path"),
                    "deprecation_status": asset.get("deprecation_status"),
                }
            )

    assert offenders == [], f"Activated Dais assets still leaving source primary: {offenders}"


def test_activated_dais_assets_remain_in_dais_lane(
    assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in assets:
        if asset.get("suite_owner") != "Dais":
            continue
        if asset.get("activation_status") != "activated":
            continue

        destination_path = str(asset.get("destination_path", ""))
        if "/dossier/" in destination_path.lower() or "PdfConnector" in destination_path:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": destination_path,
                    "reason": "document ownership drift",
                }
            )

    assert offenders == [], f"Dais activation drifted into document ownership: {offenders}"


def test_defense_packet_depends_on_activated_dossier_service(
    asset_index: Dict[str, Dict[str, Any]]
) -> None:
    defense_packet = asset_index["DefensePacket"]
    dossier_service = asset_index["dossierService"]

    _assert_activated(defense_packet)
    _assert_activated(dossier_service)

    assert defense_packet["suite_owner"] == "Dais"
    assert dossier_service["suite_owner"] == "Dossier"


def test_no_dais_asset_creates_rogue_shell_launch_point(
    assets: List[Dict[str, Any]]
) -> None:
    """No activated Dais asset may create a new top-level launch point
    outside the existing suite/workbench path."""
    offenders = []

    for asset in assets:
        if asset.get("suite_owner") != "Dais":
            continue
        if asset.get("activation_status") != "activated":
            continue

        dest = str(asset.get("destination_path", ""))
        in_approved = any(dest.startswith(p) for p in APPROVED_DAIS_SHELL_PATHS)
        if not in_approved:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": dest,
                    "reason": "outside approved Dais shell paths",
                }
            )

    assert offenders == [], f"Dais assets creating rogue launch points: {offenders}"
