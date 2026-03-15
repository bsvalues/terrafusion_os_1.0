"""
Phase 4L: Remaining Feeder Extraction Tests
Validates parity assessment for 8 core feeder repos.
"""
import json
import os
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture(scope="module")
def assessment():
    with open(os.path.join(REPO_ROOT, "phase4l.feeder-assessment.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def repos(assessment):
    return {r["name"]: r for r in assessment["repos"]}

EXPECTED_REPOS = {
    "BSIncomeValuation", "GeospatialAnalyzerBS", "PropertyTaxAI", "BCBSGISPRO",
    "TerraFlow", "TerraPILT", "TerraGama", "CountyDataSync-1"
}

class TestPhase4LDocument:
    def test_phase_is_4l(self, assessment):
        assert assessment["phase"] == "4L"

    def test_phase_complete(self, assessment):
        assert assessment["phase_status"] == "complete"

    def test_eight_repos_assessed(self, assessment):
        assert len(assessment["repos"]) == 8

    def test_correct_repo_names(self, repos):
        assert set(repos.keys()) == EXPECTED_REPOS

class TestParityVerification:
    def test_all_repos_have_disposition(self, repos):
        for name, repo in repos.items():
            assert repo["disposition"] != "", f"{name} must have a disposition"

    def test_all_repos_archive_eligible(self, repos):
        for name, repo in repos.items():
            assert "archive" in repo["disposition"], f"{name} must be archive-eligible"

    def test_all_repos_have_canonical_parity(self, repos):
        for name, repo in repos.items():
            if name != "TerraGama":  # empty repo
                assert len(repo["canonical_parity"]) > 0, f"{name} must have parity evidence"

    def test_terragama_is_empty(self, repos):
        assert repos["TerraGama"]["significant_files"] == 0
        assert repos["TerraGama"]["disposition"] == "empty-archive-immediately"

    def test_no_repos_need_extraction(self, assessment):
        assert assessment["summary"]["unique_capabilities_needing_extraction"] == 0

class TestRepoDetails:
    def test_bsincome_parity_full(self, repos):
        parity = repos["BSIncomeValuation"]["canonical_parity"]
        assert "FULL" in parity["income_approach"]

    def test_geospatial_parity(self, repos):
        parity = repos["GeospatialAnalyzerBS"]["canonical_parity"]
        assert "FULL" in parity["gis_mapping"]

    def test_propertytax_parity(self, repos):
        parity = repos["PropertyTaxAI"]["canonical_parity"]
        assert "FULL" in parity["tax_calculation"]

    def test_bcbsgispro_parity(self, repos):
        parity = repos["BCBSGISPRO"]["canonical_parity"]
        assert "FULL" in parity["gis"]

    def test_terraflow_parity(self, repos):
        parity = repos["TerraFlow"]["canonical_parity"]
        assert "FULL" in parity["sync"]

    def test_terrapilt_parity(self, repos):
        parity = repos["TerraPILT"]["canonical_parity"]
        assert "FULL" in parity["pilt_calculator"]

    def test_terragama_parity(self, repos):
        parity = repos["TerraGama"]["canonical_parity"]
        assert "FULL" in parity["gama_cama"]

    def test_countydatasync_parity(self, repos):
        parity = repos["CountyDataSync-1"]["canonical_parity"]
        assert "FULL" in parity["etl"]

class TestArchiveWaves:
    def test_all_repos_have_wave_numbers(self, repos):
        for name, repo in repos.items():
            assert "archive_wave" in repo, f"{name} must have archive_wave"

    def test_wave_numbers_contiguous(self, assessment):
        waves = sorted(r["archive_wave"] for r in assessment["repos"])
        assert waves == list(range(1, 9))

    def test_no_duplicate_waves(self, assessment):
        waves = [r["archive_wave"] for r in assessment["repos"]]
        assert len(waves) == len(set(waves))

class TestSummary:
    def test_summary_total_8(self, assessment):
        assert assessment["summary"]["total_repos"] == 8

    def test_summary_parity_verified_7(self, assessment):
        assert assessment["summary"]["parity_verified"] == 7

    def test_summary_empty_repos_1(self, assessment):
        assert assessment["summary"]["empty_repos"] == 1

    def test_summary_all_archive_eligible(self, assessment):
        assert assessment["summary"]["archive_eligible"] == 8
