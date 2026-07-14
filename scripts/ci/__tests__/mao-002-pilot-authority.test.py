import copy
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "verify-mao-002-pilot-authority.py"
POLICY = ROOT / ".governance" / "mao-002-pilot-merge-authority.json"


def bootstrap_record(policy_path: Path):
    future = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=2)).isoformat()
    return {
        "schema_version": 1,
        "authority_id": "OWNER-MAO-002-PILOT-BOOTSTRAP-001",
        "program": "PROGRAM-MAO-001",
        "work_order": "WO-MAO-002",
        "merge_mode": "B",
        "status": "active",
        "owner": "William",
        "operator_identity": "codex-portfolio-operator",
        "assurance_identity": "claude-assurance",
        "repositories": ["bsvalues/terrafusion_os_1.0"],
        "risk_ceiling": "R2",
        "allowed_path_prefixes": ["docs/"],
        "max_merged_prs": 2,
        "expires_at": future,
        "suspension": {"active": False, "reason": None},
        "policy_sha256": hashlib.sha256(policy_path.read_bytes()).hexdigest(),
    }


def execution_record(bootstrap_raw: str):
    return {
        "schema_version": 1,
        "authority_id": "OWNER-MAO-002-PILOT-BOOTSTRAP-001",
        "program": "PROGRAM-MAO-001",
        "work_order": "WO-MAO-002",
        "operator_identity": "codex-portfolio-operator",
        "revision": 1,
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "bootstrap_sha256": hashlib.sha256(bootstrap_raw.encode("utf-8")).hexdigest(),
        "implementation_operators": ["codex-lane-a", "codex-lane-b"],
        "independent_reviewer": "claude-assurance",
        "post_merge_assurance_evidence": "docs/brain/evidence/WO-MAO-002-assurance.md",
        "suspension": {"active": False, "reason": None},
        "pilot_prs": [
            {
                "slot": "lane-a",
                "repository": "bsvalues/terrafusion_os_1.0",
                "number": 2001,
                "head_sha": "a" * 40,
                "risk_class": "R1",
                "reservation_id": "MAO-002-LANE-A",
                "allowed_paths": ["docs/pilot-a/**"],
            },
            {
                "slot": "lane-b",
                "repository": "bsvalues/terrafusion_os_1.0",
                "number": 2002,
                "head_sha": "b" * 40,
                "risk_class": "R1",
                "reservation_id": "MAO-002-LANE-B",
                "allowed_paths": ["docs/pilot-b/**"],
            },
        ],
    }


class PilotAuthorityTest(unittest.TestCase):
    def run_gate(
        self,
        *,
        bootstrap=True,
        execution=True,
        mutate_bootstrap=None,
        mutate_execution=None,
        pr=2001,
        sha="a" * 40,
        files=None,
        head_ref="codex/mao-002-lane-a",
        labels=None,
    ):
        with tempfile.TemporaryDirectory() as temp:
            policy = Path(temp) / "policy.json"
            policy.write_bytes(POLICY.read_bytes())
            bootstrap_value = bootstrap_record(policy)
            if mutate_bootstrap:
                mutate_bootstrap(bootstrap_value)
            bootstrap_raw = json.dumps(bootstrap_value, separators=(",", ":"))
            execution_value = execution_record(bootstrap_raw)
            if mutate_execution:
                mutate_execution(execution_value)

            env = os.environ.copy()
            env.pop("TF_MAO_002_BOOTSTRAP_JSON", None)
            env.pop("TF_MAO_002_EXECUTION_JSON", None)
            env.update(
                {
                    "TF_MAO_002_POLICY_PATH": str(policy),
                    "TF_PR_NUMBER": str(pr),
                    "TF_PR_HEAD_SHA": sha,
                    "TF_PR_HEAD_REF": head_ref,
                    "TF_PR_LABELS_JSON": json.dumps(labels or []),
                    "TF_REPO": "bsvalues/terrafusion_os_1.0",
                    "TF_MAO_002_CHANGED_FILES_JSON": json.dumps(
                        files or ["docs/pilot-a/result.md"]
                    ),
                }
            )
            if bootstrap:
                env["TF_MAO_002_BOOTSTRAP_JSON"] = bootstrap_raw
            if execution:
                env["TF_MAO_002_EXECUTION_JSON"] = json.dumps(
                    execution_value, separators=(",", ":")
                )
            return subprocess.run(
                [sys.executable, str(SCRIPT)],
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )

    def test_matching_registered_pr_passes(self):
        result = self.run_gate()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("operator execution revision 1", result.stdout)

    def test_operator_can_refresh_head_without_changing_bootstrap(self):
        def refresh(record):
            record["revision"] = 2
            record["pilot_prs"][0]["head_sha"] = "c" * 40

        result = self.run_gate(mutate_execution=refresh, sha="c" * 40)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("revision 2", result.stdout)

    def test_operator_can_register_new_pr_without_changing_bootstrap(self):
        def refresh(record):
            record["revision"] = 2
            record["pilot_prs"][0]["number"] = 2101

        result = self.run_gate(mutate_execution=refresh, pr=2101)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_pilot_branch_fails_without_split_variables(self):
        result = self.run_gate(bootstrap=False, execution=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not registered", result.stdout)

    def test_nonpilot_pr_passes_without_split_variables(self):
        result = self.run_gate(
            bootstrap=False, execution=False, head_ref="codex/unrelated"
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("checked-in inactive policy", result.stdout)

    def test_bootstrap_and_execution_must_be_present_together(self):
        for bootstrap, execution in ((True, False), (False, True)):
            with self.subTest(bootstrap=bootstrap, execution=execution):
                result = self.run_gate(bootstrap=bootstrap, execution=execution)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("must be present together", result.stdout)

    def test_head_sha_mismatch_fails(self):
        result = self.run_gate(sha="c" * 40)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("head SHA mismatch", result.stdout)

    def test_owner_bootstrap_suspension_fails_closed(self):
        def suspend(record):
            record["status"] = "suspended"
            record["suspension"] = {"active": True, "reason": "owner suspension"}

        result = self.run_gate(mutate_bootstrap=suspend)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owner bootstrap is suspended", result.stdout)

    def test_expired_owner_bootstrap_fails_closed(self):
        def expire(record):
            record["expires_at"] = (
                dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=1)
            ).isoformat()

        result = self.run_gate(mutate_bootstrap=expire)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owner bootstrap is expired", result.stdout)

    def test_operator_execution_suspension_fails_closed(self):
        def suspend(record):
            record["suspension"] = {"active": True, "reason": "scope incident"}

        result = self.run_gate(mutate_execution=suspend)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("operator execution is suspended", result.stdout)

    def test_scope_drift_fails(self):
        result = self.run_gate(files=["backend/Program.cs"])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("scope drift", result.stdout)

    def test_owner_bootstrap_cannot_contain_execution_state(self):
        def add_execution_state(record):
            record["pilot_prs"] = []

        result = self.run_gate(mutate_bootstrap=add_execution_state)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("contains operator execution fields", result.stdout)

    def test_execution_cannot_expand_owner_envelope(self):
        def add_owner_state(record):
            record["risk_ceiling"] = "R5"

        result = self.run_gate(mutate_execution=add_owner_state)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("contains owner envelope fields", result.stdout)

    def test_reviewer_must_equal_bootstrap_assurance_identity(self):
        def change_reviewer(record):
            record["independent_reviewer"] = "codex-lane-a"

        result = self.run_gate(mutate_execution=change_reviewer)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("independent_reviewer", result.stdout)

    def test_owner_is_immutable(self):
        result = self.run_gate(
            mutate_bootstrap=lambda record: record.update(owner="not-william")
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owner bootstrap owner", result.stdout)

    def test_two_implementation_operators_are_required(self):
        result = self.run_gate(
            mutate_execution=lambda record: record.update(implementation_operators=[])
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly 2 unique identities", result.stdout)

    def test_operator_identity_whitespace_cannot_fake_uniqueness(self):
        def duplicate(record):
            record["implementation_operators"] = ["codex-lane-a", " codex-lane-a "]

        result = self.run_gate(mutate_execution=duplicate)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly 2 unique identities", result.stdout)

    def test_bootstrap_must_bind_to_checked_in_policy(self):
        result = self.run_gate(
            mutate_bootstrap=lambda record: record.update(policy_sha256="0" * 64)
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("policy_sha256", result.stdout)

    def test_execution_must_bind_to_exact_bootstrap(self):
        def break_binding(record):
            record["bootstrap_sha256"] = "0" * 64

        result = self.run_gate(mutate_execution=break_binding)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("bootstrap_sha256", result.stdout)

    def test_bootstrap_repository_cannot_exceed_policy(self):
        def expand(record):
            record["repositories"] = ["bsvalues/another-repo"]

        result = self.run_gate(mutate_bootstrap=expand)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("repository exceeds", result.stdout)

    def test_execution_risk_cannot_exceed_bootstrap(self):
        def expand(record):
            record["pilot_prs"][0]["risk_class"] = "R3"

        result = self.run_gate(mutate_execution=expand)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("risk_class exceeds", result.stdout)

    def test_execution_path_cannot_exceed_bootstrap(self):
        def expand(record):
            record["pilot_prs"][0]["allowed_paths"] = ["backend/**"]

        result = self.run_gate(mutate_execution=expand)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("allowed path exceeds", result.stdout)

    def test_reservation_id_is_required(self):
        def remove(record):
            del record["pilot_prs"][0]["reservation_id"]

        result = self.run_gate(mutate_execution=remove)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("reservation_id", result.stdout)

    def test_obvious_pilot_path_overlap_fails(self):
        def overlap(record):
            record["pilot_prs"][1]["allowed_paths"] = ["docs/pilot-a/subtree/**"]

        result = self.run_gate(mutate_execution=overlap)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("path reservations overlap", result.stdout)

    def test_similarly_named_sibling_paths_do_not_overlap(self):
        def siblings(record):
            record["pilot_prs"][1]["allowed_paths"] = ["docs/pilot-a-other/**"]

        result = self.run_gate(mutate_execution=siblings)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_unregistered_pr_cannot_use_pilot_scope(self):
        result = self.run_gate(pr=3000, head_ref="codex/unrelated")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("overlaps active pilot scope", result.stdout)

    def test_registered_pr_rename_source_must_be_in_scope(self):
        result = self.run_gate(
            files=[
                {
                    "filename": "docs/pilot-a/result.md",
                    "previous_filename": "backend/Program.cs",
                }
            ]
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("scope drift", result.stdout)
        self.assertIn("backend/Program.cs", result.stdout)

    def test_unregistered_pr_rename_source_overlap_fails(self):
        result = self.run_gate(
            pr=3000,
            head_ref="codex/unrelated",
            files=[
                {
                    "filename": "docs/unrelated/result.md",
                    "previous_filename": "docs/pilot-a/result.md",
                }
            ],
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("overlaps active pilot scope", result.stdout)

    def test_unregistered_unrelated_pr_remains_mode_a(self):
        result = self.run_gate(
            pr=3000,
            files=["docs/unrelated/result.md"],
            head_ref="codex/unrelated",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("not a registered pilot PR", result.stdout)


if __name__ == "__main__":
    unittest.main()
