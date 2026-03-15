# tests/test_phase4f_atlas_activation.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pytest


LEDGER_PATH = Path(
    os.environ.get("TF_ACTIVATION_LEDGER_PATH", "phase4f.activation.ledger.json")
)

EXPECTED_ATLAS_COUNT = 30

APPROVED_ATLAS_PATH_MARKERS = (
    "/atlas/",
    "/gis/",
    "/map/",
    "/maps/",
    "/geospatial/",
    "/spatial/",
    "/layers/",
)

FORBIDDEN_FOREIGN_PATH_MARKERS = (
    "/dais/",
    "/dossier/",
    "/forge/",
    "/shell/",
    "/os/",
    "/canon/",
)

FORBIDDEN_FOREIGN_NAME_MARKERS = (
    "dais",
    "workflow",
    "audit",
    "dossier",
    "packet",
    "pdf",
    "forge",
    "valuation",
    "ratio",
    "regression",
    "calibration",
    "comp",
    "cost",
    "income",
    "sales",
    "shell",
    "dock",
    "topbar",
)

ATLAS_OWNERSHIP_MARKERS = (
    "atlas",
    "gis",
    "map",
    "layer",
    "geospatial",
    "spatial",
    "parcelmap",
    "hazard",
    "boundary",
    "zoning",
    "overlay",
    "neighborhood",
    "sentiment",
)


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
def atlas_assets(assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [asset for asset in assets if asset.get("suite_owner") == "Atlas"]


def _assert_activated(asset: Dict[str, Any]) -> None:
    assert asset["reclassification"] == "unblocked-ready"
    assert asset["activation_eligibility"] == "eligible"
    assert asset["activation_status"] == "activated"
    assert asset["parity_status"] == "verified"
    assert asset["runtime_status"] == "pass"
    assert asset["shell_status"] == "pass"
    assert asset["deprecation_status"] == "destination-active"


def _destination_path(asset: Dict[str, Any]) -> str:
    return str(asset.get("destination_path", ""))


def _path_lower(asset: Dict[str, Any]) -> str:
    return _destination_path(asset).lower()


def _name_lower(asset: Dict[str, Any]) -> str:
    path = _destination_path(asset)
    return (Path(path).stem or path.split("/")[-1]).lower()


def test_atlas_domain_count_matches_expected(atlas_assets: List[Dict[str, Any]]) -> None:
    assert len(atlas_assets) == EXPECTED_ATLAS_COUNT, (
        f"Expected {EXPECTED_ATLAS_COUNT} Atlas assets, got {len(atlas_assets)}"
    )


def test_all_atlas_assets_are_activated(atlas_assets: List[Dict[str, Any]]) -> None:
    for asset in atlas_assets:
        _assert_activated(asset)


def test_atlas_destination_paths_are_unique(atlas_assets: List[Dict[str, Any]]) -> None:
    seen: Dict[str, str] = {}
    duplicates: List[Dict[str, str]] = []

    for asset in atlas_assets:
        destination_path = _destination_path(asset)
        asset_id = str(asset.get("asset_id", ""))

        if destination_path in seen:
            duplicates.append(
                {
                    "destination_path": destination_path,
                    "first_asset_id": seen[destination_path],
                    "second_asset_id": asset_id,
                }
            )
        else:
            seen[destination_path] = asset_id

    assert duplicates == [], f"Duplicate Atlas destination paths found: {duplicates}"


def test_atlas_assets_resolve_through_approved_map_lanes(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        path = _path_lower(asset)
        name = _name_lower(asset)
        # Asset is in-lane if its directory path contains an approved marker
        # OR its filename contains an Atlas ownership marker (e.g. GisController, atlasService)
        in_lane = (
            any(marker in path for marker in APPROVED_ATLAS_PATH_MARKERS)
            or any(marker in name for marker in ATLAS_OWNERSHIP_MARKERS)
        )
        if not in_lane:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": asset.get("destination_path"),
                    "reason": "not in approved atlas/gis/map lane",
                }
            )

    assert offenders == [], f"Atlas lane violations found: {offenders}"


def test_atlas_assets_do_not_leave_source_primary(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        if asset.get("deprecation_status") == "active-source":
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": asset.get("destination_path"),
                    "deprecation_status": asset.get("deprecation_status"),
                }
            )

    assert offenders == [], f"Activated Atlas assets still leave source primary: {offenders}"


def test_atlas_assets_do_not_drift_into_foreign_suite_paths(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        path = _path_lower(asset)
        if any(marker in path for marker in FORBIDDEN_FOREIGN_PATH_MARKERS):
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": asset.get("destination_path"),
                    "reason": "foreign suite path drift",
                }
            )

    assert offenders == [], f"Atlas slice drifted into foreign suite paths: {offenders}"


def test_atlas_assets_do_not_claim_foreign_domain_ownership_by_name(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        name = _name_lower(asset)

        if any(marker in name for marker in FORBIDDEN_FOREIGN_NAME_MARKERS):
            if not any(marker in name for marker in ATLAS_OWNERSHIP_MARKERS):
                offenders.append(
                    {
                        "asset_id": asset.get("asset_id"),
                        "destination_path": asset.get("destination_path"),
                        "reason": "foreign ownership naming drift",
                    }
                )

    assert offenders == [], f"Atlas naming suggests foreign ownership drift: {offenders}"


def test_atlas_assets_represent_map_or_spatial_capability(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        path = _path_lower(asset)
        name = _name_lower(asset)
        haystack = f"{path}::{name}"

        if not any(marker in haystack for marker in ATLAS_OWNERSHIP_MARKERS):
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": asset.get("destination_path"),
                    "reason": "atlas asset lacks map/spatial ownership markers",
                }
            )

    assert offenders == [], f"Atlas assets lacking GIS/spatial identity: {offenders}"


def test_atlas_assets_have_no_runtime_or_shell_failures(
    atlas_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in atlas_assets:
        if asset.get("runtime_status") != "pass" or asset.get("shell_status") != "pass":
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "runtime_status": asset.get("runtime_status"),
                    "shell_status": asset.get("shell_status"),
                }
            )

    assert offenders == [], f"Atlas runtime/shell failures found: {offenders}"
