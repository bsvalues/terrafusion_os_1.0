import json
import os
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "verify-mao-003-reservations.py"
FIXTURES = Path(__file__).parent / "fixtures" / "mao-003"


class ReservationGateTest(unittest.TestCase):
    def run_fixture(self, name, pr, sha, mutate=None, action="synchronize", previous_body=""):
        values = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
        if mutate:
            mutate(values)
        env = os.environ.copy()
        env.update({
            "TF_MAO_003_OPEN_PRS_JSON": json.dumps(values, separators=(",", ":")),
            "TF_MAO_003_NOW": "2026-07-14T15:00:00Z",
            "TF_PR_NUMBER": str(pr),
            "TF_PR_HEAD_SHA": sha,
            "TF_REPO": "bsvalues/terrafusion_os_1.0",
            "TF_PR_EVENT_ACTION": action,
            "TF_PR_PREVIOUS_BODY": previous_body,
        })
        return subprocess.run([sys.executable, str(SCRIPT)], cwd=ROOT, env=env, capture_output=True, text=True, check=False)

    def test_first_reservation_passes(self):
        result = self.run_fixture("first-reservation.json", 2001, "a" * 40)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WO-MAO-TEST-A/PR #2001", result.stdout)

    def test_intentional_overlap_identifies_both_owners(self):
        result = self.run_fixture("intentional-overlap.json", 2002, "b" * 40)
        self.assertNotEqual(result.returncode, 0)
        for value in ["WO-MAO-TEST-A", "PR #2001", "WO-MAO-TEST-B", "PR #2002", "bsvalues/terrafusion_os_1.0", "docs/pilot/shared/b.md"]:
            self.assertIn(value, result.stdout)

    def test_passes_after_explicit_release(self):
        result = self.run_fixture("released-reservation.json", 2002, "b" * 40)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_passes_after_reciprocal_handoff(self):
        result = self.run_fixture("reciprocal-handoff.json", 2002, "b" * 40)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_one_sided_handoff_fails_closed(self):
        def break_handoff(values):
            body = values[1]["body"]
            values[1]["body"] = body.replace(',"handoff_from":"RES-A","handoff_from_pr":2001,"handoff_from_head_sha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"', "")
        result = self.run_fixture("reciprocal-handoff.json", 2002, "b" * 40, break_handoff)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("reciprocal handoff", result.stdout)

    def test_exact_source_cannot_handoff_broader_subtree(self):
        def broaden_target(values):
            values[0]["body"] = values[0]["body"].replace('"value":"docs/pilot/shared","scope":"subtree"', '"value":"docs/pilot/shared/b.md","scope":"exact"')
            values[1]["body"] = values[1]["body"].replace('"scope":"exact"', '"scope":"subtree"')
        result = self.run_fixture("reciprocal-handoff.json", 2002, "b" * 40, broaden_target)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("reciprocal handoff", result.stdout)

    def test_stale_reservation_still_blocks(self):
        def make_stale(values):
            values[0]["body"] = values[0]["body"].replace("2026-07-14T12:00:00Z", "2026-07-01T12:00:00Z")
        result = self.run_fixture("intentional-overlap.json", 2002, "b" * 40, make_stale)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("collision between", result.stdout)

    def test_renewal_recovers_stale_state_without_releasing(self):
        def renew(values):
            values[0]["body"] = values[0]["body"].replace('"reserved_at":"2026-07-14T12:00:00Z"', '"reserved_at":"2026-07-01T12:00:00Z","renewed_at":"2026-07-14T14:00:00Z"')
        result = self.run_fixture("first-reservation.json", 2001, "a" * 40, renew)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("stale=true", result.stdout)

    def test_unregistered_pr_cannot_cross_active_reservation(self):
        def add_unregistered(values):
            values.append({"number": 2003, "repository": "bsvalues/terrafusion_os_1.0", "head_sha": "c" * 40, "body": "", "changed_files": ["docs/pilot/shared/c.md"]})
        result = self.run_fixture("first-reservation.json", 2003, "c" * 40, add_unregistered)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unregistered PR #2003", result.stdout)

    def test_exact_head_drift_fails(self):
        result = self.run_fixture("first-reservation.json", 2001, "d" * 40)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("workflow head", result.stdout)

    def test_rename_previous_path_must_also_be_reserved(self):
        def add_previous_name(values):
            values[0]["changed_files"].append("docs/outside/old-name.md")
        result = self.run_fixture("first-reservation.json", 2001, "a" * 40, add_previous_name)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("docs/outside/old-name.md", result.stdout)

    def test_unrelated_pr_does_not_inherit_another_lanes_collision(self):
        def add_unrelated(values):
            values.append({"number": 2003, "repository": "bsvalues/terrafusion_os_1.0", "head_sha": "c" * 40, "body": "", "changed_files": ["docs/unrelated/c.md"]})
        result = self.run_fixture("intentional-overlap.json", 2003, "c" * 40, add_unrelated)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_unrelated_pr_does_not_validate_released_lanes_scope(self):
        def add_unrelated_and_restore_source_files(values):
            values[0]["changed_files"] = ["docs/pilot/shared/a.md"]
            values.append({"number": 2003, "repository": "bsvalues/terrafusion_os_1.0", "head_sha": "c" * 40, "body": "", "changed_files": ["docs/unrelated/c.md"]})
        result = self.run_fixture("released-reservation.json", 2003, "c" * 40, add_unrelated_and_restore_source_files)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_existing_holder_also_fails_while_collision_remains(self):
        def make_lower_pr_later(values):
            values[0]["body"] = values[0]["body"].replace("2026-07-14T12:00:00Z", "2026-07-14T12:01:00Z")
        result = self.run_fixture("intentional-overlap.json", 2001, "a" * 40, make_lower_pr_later, action="synchronize")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("WO-MAO-TEST-A", result.stdout)

    def test_schema_rejects_lowercase_reservation_id(self):
        def lowercase_id(values):
            values[0]["body"] = values[0]["body"].replace('"id":"RES-A"', '"id":"res-a"')
        result = self.run_fixture("first-reservation.json", 2001, "a" * 40, lowercase_id)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("schema pattern", result.stdout)

    def test_reservation_ids_are_unique_across_open_prs(self):
        def duplicate_id(values):
            values[1]["body"] = values[1]["body"].replace('"id":"RES-B"', '"id":"RES-A"')
        result = self.run_fixture("intentional-overlap.json", 2002, "b" * 40, duplicate_id)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("globally unique", result.stdout)

    def test_schema_rejects_invalid_work_order(self):
        def invalid_wo(values):
            values[0]["body"] = values[0]["body"].replace('"work_order":"WO-MAO-TEST-A"', '"work_order":"WO- "')
        result = self.run_fixture("first-reservation.json", 2001, "a" * 40, invalid_wo)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("schema pattern", result.stdout)

    def test_raw_dot_and_empty_path_segments_fail_closed(self):
        for invalid in ["docs/./pilot/shared", "docs//pilot/shared", "docs/../pilot/shared"]:
            with self.subTest(path=invalid):
                def change_path(values, replacement=invalid):
                    values[0]["body"] = values[0]["body"].replace('"value":"docs/pilot/shared"', f'"value":"{replacement}"')
                result = self.run_fixture("first-reservation.json", 2001, "a" * 40, change_path)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("unsafe path segment", result.stdout)

    def test_contract_reservations_collide_exactly(self):
        def convert_to_contract(values):
            for value in values:
                value["changed_files"] = []
                value["body"] = value["body"].replace('"kind":"path"', '"kind":"contract"').replace('"value":"docs/pilot/shared"', '"value":"parcel-read-model"').replace('"value":"docs/pilot/shared/b.md"', '"value":"parcel-read-model"').replace('"scope":"subtree"', '"scope":"exact"')
        result = self.run_fixture("intentional-overlap.json", 2002, "b" * 40, convert_to_contract)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("parcel-read-model", result.stdout)

    def test_environment_reservations_collide_without_granting_access(self):
        def convert_to_environment(values):
            for value in values:
                value["changed_files"] = []
                value["body"] = value["body"].replace('"kind":"path"', '"kind":"environment"').replace('"value":"docs/pilot/shared"', '"value":"shared-validation"').replace('"value":"docs/pilot/shared/b.md"', '"value":"shared-validation"').replace('"scope":"subtree"', '"scope":"exact"')
        result = self.run_fixture("intentional-overlap.json", 2002, "b" * 40, convert_to_environment)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("shared-validation", result.stdout)


if __name__ == "__main__":
    unittest.main()
