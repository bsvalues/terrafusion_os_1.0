# tests/test_phase4i_archive_execution.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pytest


ARCHIVE_PLAN_PATH = Path(
    os.environ.get("TF_ARCHIVE_PLAN_PATH", "phase4h.archive-plan.json")
)
RETIREMENT_PATH = Path(
    os.environ.get("TF_RETIREMENT_MANIFEST_PATH", "phase4g.retirement.manifest.json")
)
EXECUTION_LOG_PATH = Path(
    os.environ.get("TF_EXECUTION_LOG_PATH", "phase4i.execution-log.json")
)


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Required file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def archive_plan() -> Dict[str, Any]:
    return _load_json(ARCHIVE_PLAN_PATH)


@pytest.fixture(scope="module")
def archive_repos(archive_plan: Dict[str, Any]) -> List[Dict[str, Any]]:
    return archive_plan["repos"]


@pytest.fixture(scope="module")
def execution_log() -> Dict[str, Any]:
    return _load_json(EXECUTION_LOG_PATH)


@pytest.fixture(scope="module")
def executed_waves(execution_log: Dict[str, Any]) -> List[Dict[str, Any]]:
    return execution_log.get("waves", [])


@pytest.fixture(scope="module")
def retirement_assets() -> List[Dict[str, Any]]:
    data = _load_json(RETIREMENT_PATH)
    return data["assets"]


# ── Wave 1: BCBSLevy ────────────────────────────────────────────


def test_wave1_repo_is_bcbslevy(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 1
    assert executed_waves[0]["source_repo"] == "BCBSLevy"
    assert executed_waves[0]["archive_wave"] == 1


def test_wave1_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "bcbslevy" in wave1["snapshot_tag"].lower()


def test_wave1_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "bcbslevy" in wave1["rollback_tag"].lower()


def test_wave1_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1["decommission_smoke"] == "pass"


def test_wave1_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1["remaining_source_routes"] == 0


def test_wave1_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1["remaining_source_imports"] == 0


def test_wave1_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1["remaining_source_controllers"] == 0


def test_wave1_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1["archive_status"] == "executed"


def test_wave1_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave1 = executed_waves[0]
    assert wave1.get("rollback_path"), "rollback_path must be documented"


def test_wave1_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave1 = executed_waves[0]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "BCBSLevy")
    assert wave1["total_assets"] == plan_repo["total_assets"] == 76


def test_archive_plan_bcbslevy_status_updated(archive_repos: List[Dict[str, Any]]) -> None:
    bcbs = next(r for r in archive_repos if r["source_repo"] == "BCBSLevy")
    assert bcbs["archive_status"] == "executed"


def test_wave1_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave1 = executed_waves[0]
    bcbs_retirement = [a for a in retirement_assets if a["source_repo"] == "BCBSLevy"]
    assert wave1["total_assets"] == len(bcbs_retirement)
    assert wave1["activated_assets"] + wave1["deduplicated_assets"] == wave1["total_assets"]


# ── Wave 2: TerraFusionPilt ─────────────────────────────────────


def test_wave2_repo_is_terrafusionpilt(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 2
    assert executed_waves[1]["source_repo"] == "TerraFusionPilt"
    assert executed_waves[1]["archive_wave"] == 2


def test_wave2_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "terrafusionpilt" in wave2["snapshot_tag"].lower()


def test_wave2_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "terrafusionpilt" in wave2["rollback_tag"].lower()


def test_wave2_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2["decommission_smoke"] == "pass"


def test_wave2_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2["remaining_source_routes"] == 0


def test_wave2_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2["remaining_source_imports"] == 0


def test_wave2_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2["remaining_source_controllers"] == 0


def test_wave2_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2["archive_status"] == "executed"


def test_wave2_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave2 = executed_waves[1]
    assert wave2.get("rollback_path"), "rollback_path must be documented"


def test_wave2_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave2 = executed_waves[1]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "TerraFusionPilt")
    assert wave2["total_assets"] == plan_repo["total_assets"] == 15


def test_wave2_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave2 = executed_waves[1]
    pilt_retirement = [a for a in retirement_assets if a["source_repo"] == "TerraFusionPilt"]
    assert wave2["total_assets"] == len(pilt_retirement)
    assert wave2["activated_assets"] + wave2["deduplicated_assets"] == wave2["total_assets"]


# ── Cross-wave integrity ────────────────────────────────────────


def test_archive_plan_bcbslevy_remains_executed(archive_repos: List[Dict[str, Any]]) -> None:
    bcbs = next(r for r in archive_repos if r["source_repo"] == "BCBSLevy")
    assert bcbs["archive_status"] == "executed"


def test_archive_plan_terrafusionpilt_status_updated(archive_repos: List[Dict[str, Any]]) -> None:
    pilt = next(r for r in archive_repos if r["source_repo"] == "TerraFusionPilt")
    assert pilt["archive_status"] == "executed"


def test_waves_3_through_6_remain_planned(archive_repos: List[Dict[str, Any]]) -> None:
    must_be_planned = {"TerraMiner", "terra-forge-rebuild", "Bsbcintelligentvalues", "TerraFusionTheory"}
    offenders = [
        r["source_repo"]
        for r in archive_repos
        if r["source_repo"] in must_be_planned and r["archive_status"] != "planned"
    ]
    assert offenders == [], f"Repos should remain planned: {offenders}"


def test_exactly_two_waves_executed(executed_waves: List[Dict[str, Any]]) -> None:
    executed = [w for w in executed_waves if w["archive_status"] == "executed"]
    assert len(executed) == 2, f"Expected 2 executed waves, got {len(executed)}"


def test_only_wave_two_may_advance_after_wave_one_executes(
    archive_repos: List[Dict[str, Any]],
) -> None:
    """Once BCBSLevy is executed, TerraFusionPilt may advance.
    Waves 3-6 must remain planned until Wave 2 is executed."""
    executed = {r["source_repo"] for r in archive_repos if r["archive_status"] == "executed"}
    assert executed == {"BCBSLevy", "TerraFusionPilt"}
