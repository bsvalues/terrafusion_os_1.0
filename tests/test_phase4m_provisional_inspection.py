"""
Phase 4M: Provisional/Manual Inspection Tests
Validates capability audit for 5 repos requiring manual inspection.
"""
import json
import os
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture(scope="module")
def inspection():
    with open(os.path.join(REPO_ROOT, "phase4m.provisional-inspection.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def repos(inspection):
    return {r["name"]: r for r in inspection["repos"]}

EXPECTED_REPOS = {
    "TerraFusion-Valuator-Pro-Studio", "WashingtonForge", "MLS_to_TOTAL",
    "TaxI_AI", "terra-magic-wand"
}

class TestPhase4MDocument:
    def test_phase_is_4m(self, inspection):
        assert inspection["phase"] == "4M"

    def test_phase_complete(self, inspection):
        assert inspection["phase_status"] == "complete"

    def test_five_repos_inspected(self, inspection):
        assert len(inspection["repos"]) == 5

    def test_correct_repo_names(self, repos):
        assert set(repos.keys()) == EXPECTED_REPOS

class TestDispositions:
    def test_every_repo_has_disposition(self, repos):
        for name, repo in repos.items():
            assert repo["disposition"] != "", f"{name} must have disposition"

    def test_every_repo_has_action(self, repos):
        for name, repo in repos.items():
            assert repo["action"] != "", f"{name} must have action"

    def test_every_repo_has_unique_value_rating(self, repos):
        valid = {"HIGH", "LOW", "NONE"}
        for name, repo in repos.items():
            assert repo["unique_value"] in valid, f"{name} unique_value must be HIGH/LOW/NONE"

    def test_no_repo_is_mysterious(self, repos):
        """No repo should remain unclassified."""
        for name, repo in repos.items():
            assert repo["disposition"] in ("feeder", "showcase", "delete"), f"{name} must have final disposition"

class TestHighValueRepos:
    def test_washingtonforge_is_high_value(self, repos):
        assert repos["WashingtonForge"]["unique_value"] == "HIGH"

    def test_washingtonforge_is_feeder(self, repos):
        assert repos["WashingtonForge"]["disposition"] == "feeder"

    def test_washingtonforge_has_extraction_target(self, repos):
        assert "Phase 5" in repos["WashingtonForge"]["extraction_target"]

    def test_taxi_ai_is_high_value(self, repos):
        assert repos["TaxI_AI"]["unique_value"] == "HIGH"

    def test_taxi_ai_is_feeder(self, repos):
        assert repos["TaxI_AI"]["disposition"] == "feeder"

    def test_taxi_ai_has_unique_capabilities(self, repos):
        caps = repos["TaxI_AI"]["unique_capabilities"]
        assert len(caps) >= 5, "TaxI_AI should have multiple unique capabilities"

class TestLowValueRepos:
    def test_valuator_pro_studio_low(self, repos):
        assert repos["TerraFusion-Valuator-Pro-Studio"]["unique_value"] == "LOW"

    def test_valuator_pro_studio_archive(self, repos):
        assert repos["TerraFusion-Valuator-Pro-Studio"]["action"] == "archive"

    def test_terra_magic_wand_low(self, repos):
        assert repos["terra-magic-wand"]["unique_value"] == "LOW"

    def test_terra_magic_wand_archive(self, repos):
        assert repos["terra-magic-wand"]["action"] == "archive"

class TestEmptyRepo:
    def test_mls_to_total_empty(self, repos):
        assert repos["MLS_to_TOTAL"]["is_empty"] is True

    def test_mls_to_total_no_value(self, repos):
        assert repos["MLS_to_TOTAL"]["unique_value"] == "NONE"

    def test_mls_to_total_delete(self, repos):
        assert repos["MLS_to_TOTAL"]["action"] == "delete"

class TestSummary:
    def test_summary_total_5(self, inspection):
        assert inspection["summary"]["total_repos"] == 5

    def test_summary_high_value_2(self, inspection):
        assert inspection["summary"]["high_value"] == 2

    def test_summary_low_value_2(self, inspection):
        assert inspection["summary"]["low_value"] == 2

    def test_summary_empty_1(self, inspection):
        assert inspection["summary"]["empty"] == 1
