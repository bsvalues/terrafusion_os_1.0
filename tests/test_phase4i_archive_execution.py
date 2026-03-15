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


def test_remaining_repos_still_planned(archive_repos: List[Dict[str, Any]]) -> None:
    non_bcbs = [r for r in archive_repos if r["source_repo"] != "BCBSLevy"]
    offenders = [
        r["source_repo"]
        for r in non_bcbs
        if r["archive_status"] != "planned"
    ]
    assert offenders == [], f"Repos should remain planned: {offenders}"


def test_no_parallel_execution(executed_waves: List[Dict[str, Any]]) -> None:
    """Only one wave should be executed at a time."""
    executed = [w for w in executed_waves if w["archive_status"] == "executed"]
    assert len(executed) == 1, f"Expected 1 executed wave, got {len(executed)}"


def test_wave1_all_retirement_assets_accounted(
    executed_waves: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    wave1 = executed_waves[0]
    bcbs_retirement = [a for a in retirement_assets if a["source_repo"] == "BCBSLevy"]
    assert wave1["total_assets"] == len(bcbs_retirement)
    assert wave1["activated_assets"] + wave1["deduplicated_assets"] == wave1["total_assets"]
