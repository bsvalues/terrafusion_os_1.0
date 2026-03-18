"""
Phase 4J: TerraGPT ADR Closure Tests
Validates ADR-005 registration, 103 deferred asset reclassification, and zero ADR-blocked state.
"""
import json
import os
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Fixtures ──

@pytest.fixture(scope="module")
def adr_005():
    path = os.path.join(REPO_ROOT, "docs", "architecture", "ADR-005-TERRAGPT-CHARTER.md")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@pytest.fixture(scope="module")
def execution_log():
    with open(os.path.join(REPO_ROOT, "phase4j.execution-log.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def manifest():
    with open(os.path.join(REPO_ROOT, "phase4b.manifest.json")) as f:
        return json.load(f)

@pytest.fixture(scope="module")
def all_assets(manifest):
    assets = []
    for repo in manifest["repos"]:
        for asset in repo["assets"]:
            assets.append({**asset, "source_repo": repo["name"]})
    return assets

# ── ADR-005 Existence & Content ──

class TestADR005Document:
    def test_adr_005_file_exists(self):
        path = os.path.join(REPO_ROOT, "docs", "architecture", "ADR-005-TERRAGPT-CHARTER.md")
        assert os.path.exists(path), "ADR-005 file must exist"

    def test_adr_005_status_accepted(self, adr_005):
        assert "**Status:** Accepted" in adr_005

    def test_adr_005_names_terragpt(self, adr_005):
        assert "TerraGPT" in adr_005

    def test_adr_005_defines_write_lane(self, adr_005):
        for domain in ["gpt.configurations", "gpt.rag", "gpt.embeddings", "gpt.metrics", "gpt.conversations", "gpt.agents"]:
            assert domain in adr_005, f"Write-lane domain {domain} must be in ADR-005"

    def test_adr_005_defines_six_modules(self, adr_005):
        for mod in ["gpt-studio", "gpt-marketplace", "gpt-management", "gpt-builder", "gpt-analytics", "gpt-rag"]:
            assert mod in adr_005, f"Module {mod} must be in ADR-005"

    def test_adr_005_constitutional_suite(self, adr_005):
        assert "constitutional suite" in adr_005.lower()

    def test_adr_005_near_full_stage(self, adr_005):
        assert "near-full-stage" in adr_005

# ── Execution Log Validation ──

class TestPhase4JExecutionLog:
    def test_log_phase_is_4j(self, execution_log):
        assert execution_log["phase"] == "4J"

    def test_log_phase_complete(self, execution_log):
        assert execution_log["phase_status"] == "complete"

    def test_log_adr_id(self, execution_log):
        assert execution_log["adr_registered"]["adr_id"] == "ADR-005"

    def test_log_adr_accepted(self, execution_log):
        assert execution_log["adr_registered"]["status"] == "accepted"

    def test_log_total_deferred_input_104(self, execution_log):
        summary = execution_log["reclassification_summary"]
        assert summary["total_deferred_input"] == 104

    def test_log_reclassified_103(self, execution_log):
        summary = execution_log["reclassification_summary"]
        assert summary["reclassified_to_ported"] == 103

    def test_log_security_deferred_1(self, execution_log):
        summary = execution_log["reclassification_summary"]
        assert summary["remaining_deferred_security"] == 1

    def test_log_manifest_after_counts(self, execution_log):
        after = execution_log["manifest_update"]["after"]
        assert after["ported"] == 614
        assert after["declined"] == 306
        assert after["deferred-security"] == 1

    def test_log_success_criteria_all_true(self, execution_log):
        for key, val in execution_log["success_criteria"].items():
            assert val is True, f"Success criterion {key} must be True"

# ── Manifest State Validation ──

class TestManifestPostReclassification:
    def test_total_assets_921(self, all_assets):
        assert len(all_assets) == 921

    def test_ported_count_614(self, all_assets):
        ported = [a for a in all_assets if a["status"] == "ported"]
        assert len(ported) == 614

    def test_declined_count_306(self, all_assets):
        declined = [a for a in all_assets if a["status"] == "declined"]
        assert len(declined) == 306

    def test_deferred_security_count_1(self, all_assets):
        deferred = [a for a in all_assets if a["status"] == "deferred-security"]
        assert len(deferred) == 1

    def test_zero_deferred_with_rationale(self, all_assets):
        old_deferred = [a for a in all_assets if a["status"] == "deferred-with-rationale"]
        assert len(old_deferred) == 0, "No assets should remain in deferred-with-rationale status"

    def test_zero_adr_pending_blockers(self, all_assets):
        adr_blocked = [a for a in all_assets if a.get("blocker_type") == "adr-pending"]
        assert len(adr_blocked) == 0, "No assets should have adr-pending blocker"

    def test_zero_architectural_blockers(self, all_assets):
        arch_blocked = [a for a in all_assets if a.get("blocker_type") == "architectural"]
        assert len(arch_blocked) == 0, "No assets should have architectural blocker"

    def test_all_reclassified_have_adr_reference(self, all_assets):
        gpt_assets = [a for a in all_assets if a.get("adr_reference") == "ADR-005"]
        assert len(gpt_assets) == 103, f"Expected 103 assets with ADR-005 reference, got {len(gpt_assets)}"

    def test_all_reclassified_have_terragpt_owner(self, all_assets):
        gpt_owned = [a for a in all_assets if a.get("adr_reference") == "ADR-005"]
        for asset in gpt_owned:
            assert asset["owner_suite"] == "TerraGPT", f"Asset {asset['asset_id']} must be owned by TerraGPT"

    def test_security_deferred_is_biv_178(self, all_assets):
        deferred = [a for a in all_assets if a["status"] == "deferred-security"]
        assert len(deferred) == 1
        assert deferred[0]["asset_id"] == "BIV-178"

    def test_status_sum_equals_921(self, all_assets):
        from collections import Counter
        counts = Counter(a["status"] for a in all_assets)
        total = sum(counts.values())
        assert total == 921, f"Total assets must be 921, got {total}"
