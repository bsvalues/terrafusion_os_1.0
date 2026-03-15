"""
Phase 4K: Security Gate Completion Tests
Validates security assessment for 3 repos with active security issues.
"""
import json
import os
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture(scope="module")
def security_gates():
    with open(os.path.join(REPO_ROOT, "phase4k.security-gates.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def execution_log():
    with open(os.path.join(REPO_ROOT, "phase4i.execution-log.json")) as f:
        return json.load(f)

class TestSecurityGateDocument:
    def test_phase_is_4k(self, security_gates):
        assert security_gates["phase"] == "4K"

    def test_phase_complete(self, security_gates):
        assert security_gates["phase_status"] == "complete"

    def test_three_repos_assessed(self, security_gates):
        assert len(security_gates["repos"]) == 3

    def test_correct_repos(self, security_gates):
        repo_names = {r["repo"] for r in security_gates["repos"]}
        assert repo_names == {"TerraMiner", "TerraFusionPilt", "BCBSLevy"}

class TestRepoMitigation:
    def test_all_repos_private(self, security_gates):
        for repo in security_gates["repos"]:
            mitigations = " ".join(repo["mitigation_applied"])
            assert "private" in mitigations.lower(), f"{repo['repo']} must be made private"

    def test_all_repos_archived(self, security_gates):
        for repo in security_gates["repos"]:
            mitigations = " ".join(repo["mitigation_applied"])
            assert "archived" in mitigations.lower(), f"{repo['repo']} must be archived"

    def test_all_repos_assets_extracted(self, security_gates):
        for repo in security_gates["repos"]:
            mitigations = " ".join(repo["mitigation_applied"])
            assert "extracted" in mitigations.lower(), f"{repo['repo']} assets must be extracted"

    def test_all_gate_statuses_mitigated(self, security_gates):
        for repo in security_gates["repos"]:
            assert repo["gate_status"] == "mitigated-pending-manual"

    def test_risk_levels_acceptable(self, security_gates):
        for repo in security_gates["repos"]:
            assert repo["risk_level"] in ("LOW", "MEDIUM"), f"{repo['repo']} risk must be LOW or MEDIUM"

class TestCrossReferenceWithArchive:
    """Verify security repos match Phase 4I archive execution."""

    def test_terraminer_archived_in_phase4i(self, execution_log):
        wave3 = [w for w in execution_log["waves"] if w["source_repo"] == "TerraMiner"]
        assert len(wave3) == 1
        assert wave3[0]["archive_status"] == "executed"

    def test_terrafusionpilt_archived_in_phase4i(self, execution_log):
        wave2 = [w for w in execution_log["waves"] if w["source_repo"] == "TerraFusionPilt"]
        assert len(wave2) == 1
        assert wave2[0]["archive_status"] == "executed"

    def test_bcbslevy_archived_in_phase4i(self, execution_log):
        wave1 = [w for w in execution_log["waves"] if w["source_repo"] == "BCBSLevy"]
        assert len(wave1) == 1
        assert wave1[0]["archive_status"] == "executed"

    def test_zero_runtime_consumers_all_three(self, execution_log):
        target_repos = {"TerraMiner", "TerraFusionPilt", "BCBSLevy"}
        for wave in execution_log["waves"]:
            if wave["source_repo"] in target_repos:
                assert wave["remaining_source_routes"] == 0
                assert wave["remaining_source_imports"] == 0

class TestSecuritySummary:
    def test_not_blocking_consolidation(self, security_gates):
        assert security_gates["summary"]["blocking_for_consolidation"] is False

    def test_all_repos_private_in_summary(self, security_gates):
        assert security_gates["summary"]["repos_private"] == 3

    def test_all_repos_archived_in_summary(self, security_gates):
        assert security_gates["summary"]["repos_archived"] == 3

    def test_zero_runtime_consumers(self, security_gates):
        assert security_gates["summary"]["runtime_consumers_remaining"] == 0

class TestBIV178SecurityDeferral:
    def test_biv178_documented(self, security_gates):
        assert security_gates["additional_security_item"]["asset"] == "BIV-178"
        assert security_gates["additional_security_item"]["status"] == "deferred-security"
