# tests/test_phase4g_retirement_readiness.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Set

import pytest


LEDGER_PATH = Path(
    os.environ.get("TF_ACTIVATION_LEDGER_PATH", "phase4f.activation.ledger.json")
)
RETIREMENT_PATH = Path(
    os.environ.get("TF_RETIREMENT_MANIFEST_PATH", "phase4g.retirement.manifest.json")
)

EXPECTED_TOTAL = 517
EXPECTED_TERMINAL_ACTIVATED = 336
EXPECTED_TERMINAL_DEDUPLICATED = 181


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Required file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_assets(path: Path) -> List[Dict[str, Any]]:
    data = _load_json(path)
    if isinstance(data, dict) and isinstance(data.get("assets"), list):
        return data["assets"]
    if isinstance(data, list):
        return data
    raise ValueError(f"{path} must be a JSON list or an object containing 'assets'")


@pytest.fixture(scope="module")
def ledger_assets() -> List[Dict[str, Any]]:
    return _load_assets(LEDGER_PATH)


@pytest.fixture(scope="module")
def retirement_assets() -> List[Dict[str, Any]]:
    return _load_assets(RETIREMENT_PATH)


@pytest.fixture(scope="module")
def ledger_index(ledger_assets: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {str(asset["asset_id"]): asset for asset in ledger_assets}


@pytest.fixture(scope="module")
def retirement_index(retirement_assets: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {str(asset["asset_id"]): asset for asset in retirement_assets}


def _assert_terminal_in_ledger(asset: Dict[str, Any]) -> None:
    assert asset["reclassification"] == "unblocked-ready"
    assert asset["activation_eligibility"] == "eligible"
    assert asset["parity_status"] == "verified"
    assert asset["runtime_status"] == "pass"
    assert asset["shell_status"] == "pass"
    assert asset["deprecation_status"] == "destination-active"


def test_ledger_count_is_final_and_complete(ledger_assets: List[Dict[str, Any]]) -> None:
    assert len(ledger_assets) == EXPECTED_TOTAL


def test_retirement_manifest_covers_exactly_all_ledger_assets(
    ledger_index: Dict[str, Dict[str, Any]],
    retirement_index: Dict[str, Dict[str, Any]],
) -> None:
    assert set(retirement_index.keys()) == set(ledger_index.keys())


def test_all_ledger_assets_are_terminal(ledger_assets: List[Dict[str, Any]]) -> None:
    for asset in ledger_assets:
        _assert_terminal_in_ledger(asset)


def test_terminal_status_distribution_matches_checkpoint(
    retirement_assets: List[Dict[str, Any]]
) -> None:
    activated = [
        a for a in retirement_assets
        if a.get("terminal_status") == "activated"
    ]
    deduplicated = [
        a for a in retirement_assets
        if a.get("terminal_status") == "deduplicated"
    ]

    assert len(activated) == EXPECTED_TERMINAL_ACTIVATED
    assert len(deduplicated) == EXPECTED_TERMINAL_DEDUPLICATED
    assert len(activated) + len(deduplicated) == EXPECTED_TOTAL


def test_terminal_status_values_are_valid(retirement_assets: List[Dict[str, Any]]) -> None:
    valid = {"activated", "deduplicated"}
    invalid = [
        {
            "asset_id": a.get("asset_id"),
            "terminal_status": a.get("terminal_status"),
        }
        for a in retirement_assets
        if a.get("terminal_status") not in valid
    ]
    assert invalid == []


def test_deduplicated_assets_point_to_canonical_owner(
    retirement_assets: List[Dict[str, Any]],
    ledger_index: Dict[str, Dict[str, Any]],
) -> None:
    offenders = []

    for asset in retirement_assets:
        if asset.get("terminal_status") != "deduplicated":
            continue

        canonical_asset_id = asset.get("canonical_asset_id")
        canonical_destination_path = asset.get("canonical_destination_path")

        if not canonical_asset_id or canonical_asset_id not in ledger_index:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "reason": "missing or invalid canonical_asset_id",
                }
            )
            continue

        canonical = ledger_index[canonical_asset_id]
        expected_path = str(canonical.get("destination_path", ""))

        if canonical_destination_path != expected_path:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "canonical_asset_id": canonical_asset_id,
                    "expected_path": expected_path,
                    "actual_path": canonical_destination_path,
                }
            )

    assert offenders == []


def test_retired_or_ready_requires_zero_source_consumers(
    retirement_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in retirement_assets:
        if asset.get("retirement_status") not in {"ready", "retired"}:
            continue

        if asset.get("remaining_source_consumers") != 0:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "remaining_source_consumers": asset.get("remaining_source_consumers"),
                }
            )

    assert offenders == []


def test_retired_or_ready_requires_decommission_smoke_pass(
    retirement_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in retirement_assets:
        if asset.get("retirement_status") not in {"ready", "retired"}:
            continue

        if asset.get("decommission_smoke") != "pass":
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "decommission_smoke": asset.get("decommission_smoke"),
                }
            )

    assert offenders == []


def test_retired_or_ready_requires_snapshot_and_rollback_tags(
    retirement_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in retirement_assets:
        if asset.get("retirement_status") not in {"ready", "retired"}:
            continue

        if not asset.get("rollback_tag") or not asset.get("source_snapshot_tag"):
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "rollback_tag": asset.get("rollback_tag"),
                    "source_snapshot_tag": asset.get("source_snapshot_tag"),
                }
            )

    assert offenders == []


def test_archive_eligibility_is_derived_not_aspirational(
    retirement_assets: List[Dict[str, Any]]
) -> None:
    offenders = []

    for asset in retirement_assets:
        derived = (
            "eligible"
            if (
                asset.get("retirement_status") in {"ready", "retired"}
                and asset.get("remaining_source_consumers") == 0
                and asset.get("decommission_smoke") == "pass"
                and bool(asset.get("rollback_tag"))
                and bool(asset.get("source_snapshot_tag"))
            )
            else "not-eligible"
        )

        if asset.get("archive_eligibility") != derived:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "expected": derived,
                    "actual": asset.get("archive_eligibility"),
                }
            )

    assert offenders == []


def test_retirement_manifest_preserves_suite_ownership(
    retirement_assets: List[Dict[str, Any]],
    ledger_index: Dict[str, Dict[str, Any]],
) -> None:
    offenders = []

    for asset in retirement_assets:
        ledger_asset = ledger_index[str(asset["asset_id"])]
        if asset.get("suite_owner") != ledger_asset.get("suite_owner"):
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "retirement_owner": asset.get("suite_owner"),
                    "ledger_owner": ledger_asset.get("suite_owner"),
                }
            )

    assert offenders == []
