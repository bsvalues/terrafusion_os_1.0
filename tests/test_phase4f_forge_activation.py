# tests/test_phase4f_forge_activation.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Set

import pytest


LEDGER_PATH = Path(
    os.environ.get("TF_ACTIVATION_LEDGER_PATH", "phase4f.activation.ledger.json")
)

CORE_FORGE_FOUNDATION = {
    "propertyValuationClientService": "Forge",
    "propertyComparisonClientService": "Forge",
    "marketTrendsClientService": "Forge",
    "neighborhoodClientService": "Forge",
    "usePropertyData": "Forge",
    "useMarketData": "Forge",
    "useValuationData": "Forge",
    "ComparisonContext": "Forge",
    "AdvancedComparisonContext": "Forge",
}

PARCEL_SCOPED_FORGE = {
    "PropertyValuationController",
    "PropertyValuationService",
    "SalesComparisonGrid",
    "CostManual",
    "DepreciationCalculator",
    "IncomeApproachPanel",
    "CostApproach",
    "ValuationResultsWidget",
}

CROSS_PARCEL_FORGE = {
    "RatioStudyPanel",
    "RegressionControlPanel",
    "MarketAnalyticsDashboard",
    "MarketCyclePredictor",
    "EconomicIndicators",
    "QualityControlPanel",
    "ModelsList",
    "ModelDetails",
    "ScenarioMode",
}

FORBIDDEN_FOREIGN_OWNERSHIP_PATH_MARKERS = {
    "/dais/",
    "/dossier/",
    "/atlas/",
    "/shell/",
    "/os/",
    "/canon/",
}

FORBIDDEN_FOREIGN_ASSET_NAMES = {
    "daisService",
    "dossierService",
    "PdfConnector",
    "AuditTrailPage",
    "PacketAssembly",
}


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
def asset_index(assets: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    index: Dict[str, Dict[str, Any]] = {}
    for asset in assets:
        destination_path = str(asset.get("destination_path", ""))
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


def _is_parcel_scoped(asset: Dict[str, Any]) -> bool:
    path = str(asset.get("destination_path", "")).lower()
    name = Path(path).stem
    parcel_markers = {
        "property",
        "valuation",
        "comp",
        "cost",
        "income",
        "sales",
        "sketch",
        "anatomy",
        "parcel",
        "depreciation",
    }
    return any(marker in name.lower() for marker in parcel_markers) or "workbench" in path


def _is_cross_parcel(asset: Dict[str, Any]) -> bool:
    path = str(asset.get("destination_path", "")).lower()
    name = Path(path).stem.lower()
    operational_markers = {
        "ratio",
        "calibration",
        "regression",
        "market",
        "scenario",
        "model",
        "retrain",
        "quality",
        "avm",
        "economic",
        "hazard",
        "neighborhood",
    }
    return any(marker in name for marker in operational_markers) or "suite" in path


def test_core_forge_foundation_exists(asset_index: Dict[str, Dict[str, Any]]) -> None:
    missing = sorted(name for name in CORE_FORGE_FOUNDATION if name not in asset_index)
    assert missing == [], f"Missing core Forge foundation assets: {missing}"


def test_core_forge_foundation_owned_by_forge(
    asset_index: Dict[str, Dict[str, Any]]
) -> None:
    mismatches = []
    for name, expected_owner in CORE_FORGE_FOUNDATION.items():
        actual_owner = asset_index[name]["suite_owner"]
        if actual_owner != expected_owner:
            mismatches.append(
                {"asset": name, "expected_owner": expected_owner, "actual_owner": actual_owner}
            )
    assert mismatches == [], f"Forge ownership mismatches: {mismatches}"


@pytest.mark.parametrize("asset_name", sorted(CORE_FORGE_FOUNDATION.keys()))
def test_core_forge_foundation_activated(
    asset_name: str,
    asset_index: Dict[str, Dict[str, Any]],
) -> None:
    _assert_activated(asset_index[asset_name])


@pytest.mark.parametrize("asset_name", sorted(PARCEL_SCOPED_FORGE))
def test_parcel_scoped_forge_assets_activate_into_workbench_lanes(
    asset_name: str,
    asset_index: Dict[str, Dict[str, Any]],
) -> None:
    asset = asset_index[asset_name]
    _assert_activated(asset)

    path = str(asset["destination_path"]).lower()
    assert asset["suite_owner"] == "Forge"
    assert _is_parcel_scoped(asset), f"{asset_name} should classify as parcel-scoped"
    # Parcel-scoped assets live in forge/workbench lanes OR backend services
    assert "workbench" in path or "/forge/" in path or "/valuation/" in path or "backend/" in path


@pytest.mark.parametrize("asset_name", sorted(CROSS_PARCEL_FORGE))
def test_cross_parcel_forge_assets_may_remain_standalone_operational_windows(
    asset_name: str,
    asset_index: Dict[str, Dict[str, Any]],
) -> None:
    asset = asset_index[asset_name]
    _assert_activated(asset)

    assert asset["suite_owner"] == "Forge"
    assert _is_cross_parcel(asset), f"{asset_name} should classify as cross-parcel"


def test_activated_forge_assets_do_not_leave_source_primary(
    assets: List[Dict[str, Any]]
) -> None:
    offenders = []
    for asset in assets:
        if asset.get("suite_owner") != "Forge":
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

    assert offenders == [], f"Activated Forge assets still leaving source primary: {offenders}"


def test_activated_forge_assets_do_not_drift_into_foreign_suite_paths(
    assets: List[Dict[str, Any]]
) -> None:
    offenders = []
    for asset in assets:
        if asset.get("suite_owner") != "Forge":
            continue
        if asset.get("activation_status") != "activated":
            continue

        path = str(asset.get("destination_path", "")).lower()
        name = Path(path).stem

        if any(marker in path for marker in FORBIDDEN_FOREIGN_OWNERSHIP_PATH_MARKERS):
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": path,
                    "reason": "foreign suite path drift",
                }
            )
        if name in FORBIDDEN_FOREIGN_ASSET_NAMES:
            offenders.append(
                {
                    "asset_id": asset.get("asset_id"),
                    "destination_path": path,
                    "reason": "foreign suite ownership drift",
                }
            )

    assert offenders == [], f"Forge slice drifted into foreign ownership: {offenders}"


def test_no_forge_ui_component_claims_backend_math_ownership(
    assets: List[Dict[str, Any]]
) -> None:
    offenders = []
    ui_suffixes = (".tsx", ".ts", ".jsx", ".js")

    for asset in assets:
        if asset.get("suite_owner") != "Forge":
            continue
        if asset.get("activation_status") != "activated":
            continue

        path = str(asset.get("destination_path", ""))
        lower_path = path.lower()

        if lower_path.endswith(ui_suffixes):
            if any(token in lower_path for token in ("/components/", "/pages/", "/contexts/", "/hooks/")):
                # Forge UI assets must be UI/orchestration surfaces, not valuation engines.
                forbidden_name_markers = (
                    "engine",
                    "formula",
                    "calc-core",
                    "pricing-kernel",
                    "valuation-kernel",
                )
                if any(marker in lower_path for marker in forbidden_name_markers):
                    offenders.append(
                        {
                            "asset_id": asset.get("asset_id"),
                            "destination_path": path,
                            "reason": "ui-owns-math suspicion",
                        }
                    )

    assert offenders == [], f"Forge UI naming indicates valuation math drift: {offenders}"


def test_forge_slice_activation_count_matches_domain(
    assets: List[Dict[str, Any]]
) -> None:
    activated_forge = [
        a for a in assets
        if a.get("suite_owner") == "Forge" and a.get("activation_status") == "activated"
    ]
    assert len(activated_forge) == 138, (
        f"Expected 138 activated Forge assets after slice, got {len(activated_forge)}"
    )
