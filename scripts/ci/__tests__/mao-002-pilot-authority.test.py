import copy
import datetime as dt
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
        "status": "active",
        "suspension": {"active": False, "reason": None},
        "owner": "William",
        "implementation_operators": ["codex-implementer"],
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


class PilotAuthorityTest(unittest.TestCase):
    def run_gate(self, record, *, pr=2001, sha="a" * 40, files=None):
        with tempfile.TemporaryDirectory() as temp:
            authority = Path(temp) / "authority.json"
            authority.write_text(json.dumps(record), encoding="utf-8")
            env = os.environ.copy()
            env.update(
                {
                    "TF_MAO_002_AUTHORITY_PATH": str(authority),
                    "TF_PR_NUMBER": str(pr),
                    "TF_PR_HEAD_SHA": sha,
                    "TF_REPO": "bsvalues/terrafusion_os_1.0",
                    "TF_MAO_002_CHANGED_FILES_JSON": json.dumps(
                        files or ["docs/pilot-a/result.md"]
                    ),
                }
            )
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
        record["independent_reviewer"] = "codex-implementer"
        result = self.run_gate(record)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("independent_reviewer", result.stdout)

    def test_unregistered_pr_cannot_use_pilot_scope(self):
        result = self.run_gate(active_record(), pr=3000)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("overlaps active pilot scope", result.stdout)

    def test_unregistered_unrelated_pr_remains_mode_a(self):
        result = self.run_gate(
            active_record(), pr=3000, files=["docs/unrelated/result.md"]
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("not a registered pilot PR", result.stdout)


if __name__ == "__main__":
    unittest.main()
