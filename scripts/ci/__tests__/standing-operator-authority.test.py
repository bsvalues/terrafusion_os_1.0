#!/usr/bin/env python3
"""Regression tests for the standing operator authority classifier."""

from __future__ import annotations

import importlib.util
import contextlib
import io
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "verify-standing-operator-authority.py"
SPEC = importlib.util.spec_from_file_location("standing_operator_authority", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def ready_context() -> dict[str, bool]:
    return {
        "program_authorized": True,
        "work_order_dependency_cleared": True,
        "scope_within_authority": True,
        "pr_open_non_draft": True,
        "exact_head_assured": True,
        "required_checks_complete": True,
        "checks_green": True,
        "unresolved_threads_zero": True,
        "merge_state_permits": True,
        "reservations_clear": True,
        "true_authority_wall": False,
    }


class StandingAuthorityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.policy = json.loads(
            (ROOT / ".governance" / "standing-operator-authority.json").read_text(
                encoding="utf-8"
            )
        )

    def test_green_authorized_work_merges_and_continues(self) -> None:
        self.assertEqual(
            MODULE.classify(ready_context(), self.policy),
            "MERGE_AND_CONTINUE",
        )

    def test_pending_checks_are_operator_check_watch(self) -> None:
        context = ready_context()
        context["required_checks_complete"] = False
        self.assertEqual(MODULE.classify(context, self.policy), "CHECK_WATCH")

    def test_review_feedback_is_operator_remediation(self) -> None:
        context = ready_context()
        context["unresolved_threads_zero"] = False
        self.assertEqual(MODULE.classify(context, self.policy), "REVIEW_REMEDIATION")

    def test_true_wall_still_requires_owner(self) -> None:
        context = ready_context()
        context["true_authority_wall"] = True
        self.assertEqual(MODULE.classify(context, self.policy), "BLOCKED_OWNER_DECISION")

    def test_inactive_policy_is_the_only_merge_authority_stop(self) -> None:
        inactive = dict(self.policy)
        inactive["status"] = "revoked"
        self.assertEqual(MODULE.classify(ready_context(), inactive), "MERGE_AUTH_REQUIRED")

    def test_static_policy_and_owner_register_validate(self) -> None:
        MODULE.validate_policy(self.policy)
        register = json.loads(
            (ROOT / ".governance" / "owner-decisions.json").read_text(encoding="utf-8")
        )
        MODULE.validate_decision(self.policy, register)
        MODULE.validate_docs()

    def test_tampered_policy_fails_closed(self) -> None:
        tampered = dict(self.policy)
        tampered["eligible_result"] = "OWNER_DECISION_NEEDED"
        with contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit):
                MODULE.validate_policy(tampered)


if __name__ == "__main__":
    unittest.main()
