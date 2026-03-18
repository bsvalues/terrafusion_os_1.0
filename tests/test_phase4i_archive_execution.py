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


# ── Wave 3: TerraMiner ───────────────────────────────────────────


def test_wave3_repo_is_terraminer(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 3
    assert executed_waves[2]["source_repo"] == "TerraMiner"
    assert executed_waves[2]["archive_wave"] == 3


def test_wave3_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "terraminer" in wave3["snapshot_tag"].lower()


def test_wave3_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "terraminer" in wave3["rollback_tag"].lower()


def test_wave3_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3["decommission_smoke"] == "pass"


def test_wave3_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3["remaining_source_routes"] == 0


def test_wave3_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3["remaining_source_imports"] == 0


def test_wave3_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3["remaining_source_controllers"] == 0


def test_wave3_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3["archive_status"] == "executed"


def test_wave3_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave3 = executed_waves[2]
    assert wave3.get("rollback_path"), "rollback_path must be documented"


def test_wave3_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave3 = executed_waves[2]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "TerraMiner")
    assert wave3["total_assets"] == plan_repo["total_assets"] == 78


def test_wave3_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave3 = executed_waves[2]
    tm_retirement = [a for a in retirement_assets if a["source_repo"] == "TerraMiner"]
    assert wave3["total_assets"] == len(tm_retirement)
    assert wave3["activated_assets"] + wave3["deduplicated_assets"] == wave3["total_assets"]


def test_wave3_shared_infra_consumers_resolve_to_destination(
    executed_waves: List[Dict[str, Any]],
) -> None:
    """TerraMiner has shared infrastructure assets (Core/Entities, infrastructure/devops).
    Verify no shared infra consumer still resolves to source paths."""
    wave3 = executed_waves[2]
    assert wave3.get("shared_infra_source_consumers", 0) == 0


# ── Wave 4: terra-forge-rebuild ──────────────────────────────────


def test_wave4_repo_is_terra_forge_rebuild(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 4
    assert executed_waves[3]["source_repo"] == "terra-forge-rebuild"
    assert executed_waves[3]["archive_wave"] == 4


def test_wave4_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "terra-forge-rebuild" in wave4["snapshot_tag"]


def test_wave4_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "terra-forge-rebuild" in wave4["rollback_tag"]


def test_wave4_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4["decommission_smoke"] == "pass"


def test_wave4_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4["remaining_source_routes"] == 0


def test_wave4_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4["remaining_source_imports"] == 0


def test_wave4_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4["remaining_source_controllers"] == 0


def test_wave4_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4["archive_status"] == "executed"


def test_wave4_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave4 = executed_waves[3]
    assert wave4.get("rollback_path"), "rollback_path must be documented"


def test_wave4_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave4 = executed_waves[3]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "terra-forge-rebuild")
    assert wave4["total_assets"] == plan_repo["total_assets"] == 101


def test_wave4_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave4 = executed_waves[3]
    tfr_retirement = [a for a in retirement_assets if a["source_repo"] == "terra-forge-rebuild"]
    assert wave4["total_assets"] == len(tfr_retirement)
    assert wave4["activated_assets"] + wave4["deduplicated_assets"] == wave4["total_assets"]


def test_wave4_forge_canon_consumers_resolve_to_destination(
    executed_waves: List[Dict[str, Any]],
) -> None:
    """terra-forge-rebuild is a direct rebuild feeder for Forge/Canon.
    Verify no rebuilt Forge/Canon consumer still resolves to source paths."""
    wave4 = executed_waves[3]
    assert wave4.get("forge_canon_source_consumers", 0) == 0


# ── Wave 5: Bsbcintelligentvalues ────────────────────────────────


def test_wave5_repo_is_bsbcintelligentvalues(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 5
    assert executed_waves[4]["source_repo"] == "Bsbcintelligentvalues"
    assert executed_waves[4]["archive_wave"] == 5


def test_wave5_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "bsbcintelligentvalues" in wave5["snapshot_tag"]


def test_wave5_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "bsbcintelligentvalues" in wave5["rollback_tag"]


def test_wave5_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5["decommission_smoke"] == "pass"


def test_wave5_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5["remaining_source_routes"] == 0


def test_wave5_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5["remaining_source_imports"] == 0


def test_wave5_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5["remaining_source_controllers"] == 0


def test_wave5_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5["archive_status"] == "executed"


def test_wave5_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave5 = executed_waves[4]
    assert wave5.get("rollback_path"), "rollback_path must be documented"


def test_wave5_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave5 = executed_waves[4]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "Bsbcintelligentvalues")
    assert wave5["total_assets"] == plan_repo["total_assets"] == 110


def test_wave5_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave5 = executed_waves[4]
    bsbc_retirement = [a for a in retirement_assets if a["source_repo"] == "Bsbcintelligentvalues"]
    assert wave5["total_assets"] == len(bsbc_retirement)
    assert wave5["activated_assets"] + wave5["deduplicated_assets"] == wave5["total_assets"]


# ── Wave 6: TerraFusionTheory ───────────────────────────────────


def test_wave6_repo_is_terrafusiontheory(executed_waves: List[Dict[str, Any]]) -> None:
    assert len(executed_waves) >= 6
    assert executed_waves[5]["source_repo"] == "TerraFusionTheory"
    assert executed_waves[5]["archive_wave"] == 6


def test_wave6_snapshot_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6.get("snapshot_tag"), "snapshot_tag must be non-empty"
    assert "terrafusiontheory" in wave6["snapshot_tag"]


def test_wave6_rollback_tag_exists(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6.get("rollback_tag"), "rollback_tag must be non-empty"
    assert "terrafusiontheory" in wave6["rollback_tag"]


def test_wave6_decommission_smoke_passed(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6["decommission_smoke"] == "pass"


def test_wave6_no_source_routes_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6["remaining_source_routes"] == 0


def test_wave6_no_source_imports_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6["remaining_source_imports"] == 0


def test_wave6_no_source_controllers_remain(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6["remaining_source_controllers"] == 0


def test_wave6_archive_status_is_executed(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6["archive_status"] == "executed"


def test_wave6_rollback_path_documented(executed_waves: List[Dict[str, Any]]) -> None:
    wave6 = executed_waves[5]
    assert wave6.get("rollback_path"), "rollback_path must be documented"


def test_wave6_asset_count_matches_plan(
    executed_waves: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    wave6 = executed_waves[5]
    plan_repo = next(r for r in archive_repos if r["source_repo"] == "TerraFusionTheory")
    assert wave6["total_assets"] == plan_repo["total_assets"] == 137


def test_wave6_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave6 = executed_waves[5]
    tft_retirement = [a for a in retirement_assets if a["source_repo"] == "TerraFusionTheory"]
    assert wave6["total_assets"] == len(tft_retirement)
    assert wave6["activated_assets"] + wave6["deduplicated_assets"] == wave6["total_assets"]


# ── Cross-wave integrity (all 6 waves complete) ─────────────────


def test_all_six_repos_executed(archive_repos: List[Dict[str, Any]]) -> None:
    for repo in archive_repos:
        assert repo["archive_status"] == "executed", f"{repo['source_repo']} must be executed"


def test_exactly_six_waves_executed(executed_waves: List[Dict[str, Any]]) -> None:
    executed = [w for w in executed_waves if w["archive_status"] == "executed"]
    assert len(executed) == 6, f"Expected 6 executed waves, got {len(executed)}"


def test_executed_repos_match_full_set(
    archive_repos: List[Dict[str, Any]],
) -> None:
    """All 6 repos executed. None remain planned."""
    executed = {r["source_repo"] for r in archive_repos if r["archive_status"] == "executed"}
    assert executed == {
        "BCBSLevy", "TerraFusionPilt", "TerraMiner",
        "terra-forge-rebuild", "Bsbcintelligentvalues", "TerraFusionTheory",
    }


def test_no_repos_remain_planned(archive_repos: List[Dict[str, Any]]) -> None:
    planned = [r["source_repo"] for r in archive_repos if r["archive_status"] == "planned"]
    assert planned == [], f"No repos should remain planned: {planned}"


def test_total_executed_assets_equal_517(executed_waves: List[Dict[str, Any]]) -> None:
    total = sum(w["total_assets"] for w in executed_waves)
    assert total == 517, f"Expected 517 total assets across all waves, got {total}"


def test_all_waves_have_rollback_paths(executed_waves: List[Dict[str, Any]]) -> None:
    missing = [w["source_repo"] for w in executed_waves if not w.get("rollback_path")]
    assert missing == [], f"Missing rollback paths: {missing}"


def test_all_waves_passed_decommission_smoke(executed_waves: List[Dict[str, Any]]) -> None:
    failed = [w["source_repo"] for w in executed_waves if w["decommission_smoke"] != "pass"]
    assert failed == [], f"Failed smoke: {failed}"


def test_wave_order_is_contiguous(executed_waves: List[Dict[str, Any]]) -> None:
    waves = [w["archive_wave"] for w in executed_waves]
    assert waves == [1, 2, 3, 4, 5, 6]
