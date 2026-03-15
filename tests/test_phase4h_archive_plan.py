# tests/test_phase4h_archive_plan.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pytest


RETIREMENT_PATH = Path(
    os.environ.get("TF_RETIREMENT_MANIFEST_PATH", "phase4g.retirement.manifest.json")
)
ARCHIVE_PLAN_PATH = Path(
    os.environ.get("TF_ARCHIVE_PLAN_PATH", "phase4h.archive-plan.json")
)

EXPECTED_REPOS = {
    "BCBSLevy": 76,
    "Bsbcintelligentvalues": 110,
    "TerraFusionPilt": 15,
    "TerraFusionTheory": 137,
    "TerraMiner": 78,
    "terra-forge-rebuild": 101,
}
EXPECTED_TOTAL = 517


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Required file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_assets(path: Path, key: str) -> List[Dict[str, Any]]:
    data = _load_json(path)
    if isinstance(data, dict) and isinstance(data.get(key), list):
        return data[key]
    raise ValueError(f"{path} must contain a '{key}' list")


@pytest.fixture(scope="module")
def retirement_assets() -> List[Dict[str, Any]]:
    return _load_assets(RETIREMENT_PATH, "assets")


@pytest.fixture(scope="module")
def archive_repos() -> List[Dict[str, Any]]:
    return _load_assets(ARCHIVE_PLAN_PATH, "repos")


def test_archive_plan_covers_exact_expected_repos(archive_repos: List[Dict[str, Any]]) -> None:
    actual = {repo["source_repo"] for repo in archive_repos}
    assert actual == set(EXPECTED_REPOS.keys())


def test_archive_plan_counts_match_expected(archive_repos: List[Dict[str, Any]]) -> None:
    mismatches = []
    for repo in archive_repos:
        expected = EXPECTED_REPOS[repo["source_repo"]]
        if repo["total_assets"] != expected:
            mismatches.append(
                {
                    "source_repo": repo["source_repo"],
                    "expected": expected,
                    "actual": repo["total_assets"],
                }
            )
    assert mismatches == []


def test_archive_plan_total_matches_retirement_manifest(
    archive_repos: List[Dict[str, Any]],
    retirement_assets: List[Dict[str, Any]],
) -> None:
    assert sum(repo["total_assets"] for repo in archive_repos) == EXPECTED_TOTAL
    assert len(retirement_assets) == EXPECTED_TOTAL


def test_all_repos_are_fully_ready_and_eligible(archive_repos: List[Dict[str, Any]]) -> None:
    offenders = []
    for repo in archive_repos:
        if not (
            repo["ready_assets"] == repo["total_assets"]
            and repo["eligible_assets"] == repo["total_assets"]
            and repo["archive_eligibility"] == "eligible"
        ):
            offenders.append(repo["source_repo"])
    assert offenders == []


def test_archive_plan_requires_zero_runtime_consumers(archive_repos: List[Dict[str, Any]]) -> None:
    offenders = [
        {
            "source_repo": repo["source_repo"],
            "runtime_consumers_remaining": repo["runtime_consumers_remaining"],
        }
        for repo in archive_repos
        if repo["runtime_consumers_remaining"] != 0
    ]
    assert offenders == []


def test_snapshot_and_rollback_tags_required(archive_repos: List[Dict[str, Any]]) -> None:
    offenders = [
        {
            "source_repo": repo["source_repo"],
            "snapshot_tag": repo.get("snapshot_tag"),
            "rollback_tag": repo.get("rollback_tag"),
        }
        for repo in archive_repos
        if not repo.get("snapshot_tag") or not repo.get("rollback_tag")
    ]
    assert offenders == []


def test_archive_wave_values_are_unique_and_contiguous(archive_repos: List[Dict[str, Any]]) -> None:
    waves = sorted(repo["archive_wave"] for repo in archive_repos)
    assert waves == list(range(1, len(EXPECTED_REPOS) + 1))


def test_archive_status_is_plan_only_for_now(archive_repos: List[Dict[str, Any]]) -> None:
    valid = {"planned"}
    offenders = [
        {
            "source_repo": repo["source_repo"],
            "archive_status": repo["archive_status"],
        }
        for repo in archive_repos
        if repo["archive_status"] not in valid
    ]
    assert offenders == []


def test_no_repo_can_be_approved_without_full_readiness(archive_repos: List[Dict[str, Any]]) -> None:
    offenders = []
    for repo in archive_repos:
        if repo["archive_status"] in {"approved", "executed"}:
            if not (
                repo["ready_assets"] == repo["total_assets"]
                and repo["eligible_assets"] == repo["total_assets"]
                and repo["runtime_consumers_remaining"] == 0
                and repo.get("snapshot_tag")
                and repo.get("rollback_tag")
            ):
                offenders.append(repo["source_repo"])
    assert offenders == []


def test_every_retirement_asset_maps_to_a_planned_repo(
    retirement_assets: List[Dict[str, Any]],
    archive_repos: List[Dict[str, Any]],
) -> None:
    planned = {repo["source_repo"] for repo in archive_repos}
    offenders = [
        asset["asset_id"]
        for asset in retirement_assets
        if asset.get("source_repo") not in planned
    ]
    assert offenders == []
