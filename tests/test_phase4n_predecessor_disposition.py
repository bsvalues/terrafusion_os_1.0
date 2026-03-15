"""
Phase 4N: Predecessor/Showcase Disposition Tests
Validates archive/delete/keep decisions for ~22 repos.
"""
import json
import os
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture(scope="module")
def disposition():
    with open(os.path.join(REPO_ROOT, "phase4n.predecessor-disposition.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def repos(disposition):
    return {r["name"]: r for r in disposition["repos"]}

class TestPhase4NDocument:
    def test_phase_is_4n(self, disposition):
        assert disposition["phase"] == "4N"

    def test_phase_complete(self, disposition):
        assert disposition["phase_status"] == "complete"

    def test_twenty_two_repos(self, disposition):
        assert len(disposition["repos"]) == 22

class TestDispositions:
    def test_every_repo_has_disposition(self, repos):
        valid = {"delete", "archive", "keep-as-reference"}
        for name, repo in repos.items():
            assert repo["disposition"] in valid, f"{name} must have valid disposition"

    def test_every_repo_has_rationale(self, repos):
        for name, repo in repos.items():
            assert len(repo["rationale"]) > 10, f"{name} must have rationale"

    def test_every_repo_has_classification(self, repos):
        valid = {"predecessor", "showcase"}
        for name, repo in repos.items():
            assert repo["classification"] in valid, f"{name} must be predecessor or showcase"

class TestDeleteDecisions:
    """Empty/near-empty repos should be deleted."""
    def test_empty_repos_deleted(self, repos):
        empty_repos = ["TerraFusion_OS", "TerraFusion", "TerraFusion_DevOps_Championship", "BCBSLegislativePulse", "TerraDBAssist"]
        for name in empty_repos:
            assert repos[name]["disposition"] == "delete", f"Empty repo {name} should be deleted"

    def test_delete_count(self, disposition):
        assert disposition["summary"]["dispositions"]["delete"] == 5

class TestArchiveDecisions:
    def test_archive_count(self, disposition):
        assert disposition["summary"]["dispositions"]["archive"] == 16

    def test_predecessor_repos_archived(self, repos):
        predecessors_to_archive = [
            "terrafusion-os", "TerraFusion_Master_Workspace", "BCBSDesktop",
            "shock_and_awe", "TerraFusion_Record", "TerraBuild",
            "terrafusion_enterprise", "TerraFusion_PlayGround", "BCBSPermit",
            "TerraFusion_BentonCounty", "kid-safeguard-ai"
        ]
        for name in predecessors_to_archive:
            assert repos[name]["disposition"] == "archive", f"{name} should be archived"

class TestKeepDecisions:
    def test_keep_count(self, disposition):
        assert disposition["summary"]["dispositions"]["keep_as_reference"] == 1

    def test_website_kept(self, repos):
        assert repos["terrafusion-website"]["disposition"] == "keep-as-reference"

class TestSecurityConcerns:
    def test_security_concerns_documented(self, disposition):
        assert len(disposition["summary"]["security_concerns"]) >= 2

    def test_bcbspermit_security_noted(self, repos):
        assert "security_note" in repos["BCBSPermit"]

    def test_benton_county_security_noted(self, repos):
        assert "security_note" in repos["TerraFusion_BentonCounty"]

class TestSummary:
    def test_total_22(self, disposition):
        assert disposition["summary"]["total_repos"] == 22

    def test_empty_repos_count(self, disposition):
        assert disposition["summary"]["empty_repos"] == 5

    def test_disposition_sum_equals_total(self, disposition):
        d = disposition["summary"]["dispositions"]
        total = d["delete"] + d["archive"] + d["keep_as_reference"]
        assert total == 22
