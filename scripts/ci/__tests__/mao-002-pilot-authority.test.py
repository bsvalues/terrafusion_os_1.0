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


def active_record():
    future = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=2)).isoformat()
    return {
        "schema_version": 1,
        "program": "PROGRAM-MAO-001",
        "work_order": "WO-MAO-002",
        "merge_mode": "B",
        "activation_source": "github-actions-repository-variable",
        "activation_variable": "MAO_002_PILOT_AUTHORITY_JSON",
        "pilot_label": "mao-002-pilot",
        "pilot_branch_glob": "codex/mao-002-*",
        "status": "active",
        "suspension": {"active": False, "reason": None},
        "owner": "William",
        "required_implementation_operator_count": 2,
        "disallowed_reviewers": ["William"],
        "implementation_operators": ["codex-lane-a", "codex-lane-b"],
        "independent_reviewer": "assurance-agent",
        "expires_at": future,
        "max_merged_prs": 2,
        "post_merge_assurance_evidence": "docs/brain/evidence/WO-MAO-002-assurance.md",
        "pilot_prs": [
            {
                "slot": "lane-a",
                "repository": "bsvalues/terrafusion_os_1.0",
                "number": 2001,
                "head_sha": "a" * 40,
                "allowed_paths": ["docs/pilot-a/**"],
            },
            {
                "slot": "lane-b",
                "repository": "bsvalues/terrafusion_os_1.0",
                "number": 2002,
                "head_sha": "b" * 40,
                "allowed_paths": ["docs/pilot-b/**"],
            },
        ],
    }


def inactive_policy():
    record = active_record()
    record["status"] = "inactive"
    record["implementation_operators"] = []
    record["independent_reviewer"] = None
    record["expires_at"] = None
    record["post_merge_assurance_evidence"] = None
    for slot in record["pilot_prs"]:
        slot["number"] = None
        slot["head_sha"] = None
        slot["allowed_paths"] = []
    return record


class PilotAuthorityTest(unittest.TestCase):
    def run_gate(
        self,
        record,
        *,
        pr=2001,
        sha="a" * 40,
        files=None,
        head_ref="codex/mao-002-lane-a",
        labels=None,
    ):
        with tempfile.TemporaryDirectory() as temp:
            authority = Path(temp) / "authority.json"
            authority.write_text(json.dumps(inactive_policy()), encoding="utf-8")
            env = os.environ.copy()
            env.pop("TF_MAO_002_AUTHORITY_JSON", None)
            env.update(
                {
                    "TF_MAO_002_AUTHORITY_PATH": str(authority),
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
            if record is not None:
                activation = copy.deepcopy(record)
                activation.setdefault(
                    "policy_sha256", hashlib.sha256(authority.read_bytes()).hexdigest()
                )
                env["TF_MAO_002_AUTHORITY_JSON"] = json.dumps(activation)
            return subprocess.run(
                [sys.executable, str(SCRIPT)],
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )

    def test_matching_registered_pr_passes(self):
        result = self.run_gate(active_record())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("matches registered scope", result.stdout)

    def test_pilot_branch_fails_while_policy_is_inactive(self):
        result = self.run_gate(None)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not registered", result.stdout)

    def test_nonpilot_pr_passes_while_policy_is_inactive(self):
        result = self.run_gate(None, head_ref="codex/unrelated")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("checked-in inactive policy", result.stdout)

    def test_final_sha_mismatch_fails(self):
        result = self.run_gate(active_record(), sha="c" * 40)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("final SHA mismatch", result.stdout)

    def test_suspension_fails_closed(self):
        record = active_record()
        record["suspension"] = {"active": True, "reason": "scope incident"}
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("suspended", result.stdout)

    def test_scope_drift_fails(self):
        result = self.run_gate(active_record(), files=["backend/Program.cs"])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("scope drift", result.stdout)

    def test_reviewer_must_be_independent(self):
        record = active_record()
        record["independent_reviewer"] = "codex-lane-a"
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("independent_reviewer", result.stdout)

    def test_reviewer_cannot_be_william(self):
        record = active_record()
        record["independent_reviewer"] = "William"
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("independent_reviewer", result.stdout)

    def test_owner_is_immutable(self):
        record = active_record()
        record["owner"] = "not-william"
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owner must remain William", result.stdout)

    def test_two_implementation_operators_are_required(self):
        record = active_record()
        record["implementation_operators"] = []
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly 2 unique identities", result.stdout)

    def test_activation_must_bind_to_checked_in_policy(self):
        record = active_record()
        record["policy_sha256"] = "0" * 64
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("policy_sha256", result.stdout)

    def test_unregistered_pr_cannot_use_pilot_scope(self):
        result = self.run_gate(active_record(), pr=3000, head_ref="codex/unrelated")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("overlaps active pilot scope", result.stdout)

    def test_unregistered_unrelated_pr_remains_mode_a(self):
        result = self.run_gate(
            active_record(),
            pr=3000,
            files=["docs/unrelated/result.md"],
            head_ref="codex/unrelated",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("not a registered pilot PR", result.stdout)


if __name__ == "__main__":
    unittest.main()
