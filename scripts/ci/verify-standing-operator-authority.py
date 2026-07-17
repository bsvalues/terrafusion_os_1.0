#!/usr/bin/env python3
"""Validate and classify TerraFusion standing operator authority.

The standing grant covers delivery mechanics only. It never creates program scope or
protected-resource authority. The classifier is deliberately deterministic so routine
merge readiness cannot be mislabeled as an owner decision.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = Path(
    os.environ.get(
        "TF_STANDING_OPERATOR_POLICY_PATH",
        ROOT / ".governance" / "standing-operator-authority.json",
    )
)
DECISIONS_PATH = Path(
    os.environ.get(
        "TF_OWNER_DECISIONS_PATH",
        ROOT / ".governance" / "owner-decisions.json",
    )
)

DOC_CONTRACTS = {
    "AGENTS.md": [
        "OWNER-TF-STANDING-OPERATOR-AUTHORITY",
        "MERGE_AUTH_REQUIRED` is valid only when no applicable standing or",
    ],
    "docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md": [
        "OPERATOR-MERGE AUTHORITY IS RATIFIED AND ACTIVE FOR ALREADY-AUTHORIZED DELIVERY",
        ".governance/standing-operator-authority.json",
    ],
    "docs/brain/workorders/goal-loop/STOP_TYPE_CLASSIFIER.md": [
        "MERGE_AND_CONTINUE",
        "MERGE_AUTH_REQUIRED` may not be emitted merely because an eligible PR is ready to merge",
    ],
    "docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md": [
        "THE GENERAL MODE B DOCTRINE AND STANDING DELIVERY GRANT ARE ACTIVE",
        "No per-WO or per-PR owner approval is required",
    ],
}

ELIGIBLE_RESULT = "MERGE_AND_CONTINUE"
OWNER_RESULT = "BLOCKED_OWNER_DECISION"


def fail(message: str) -> None:
    print(f"Standing operator authority: FAIL - {message}")
    raise SystemExit(1)


def load_object(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"{path} must contain a JSON object")
    return value


def classify(context: dict[str, bool], policy: dict[str, Any]) -> str:
    """Return the operator action without turning routine remediation into owner work."""

    if context.get("true_authority_wall", False):
        return OWNER_RESULT
    if not context.get("program_authorized", False):
        return OWNER_RESULT
    if not context.get("scope_within_authority", False):
        return OWNER_RESULT
    if not context.get("work_order_dependency_cleared", False):
        return "WAIT_DEPENDENCY"
    if not context.get("pr_open_non_draft", False):
        return "PR_REMEDIATION"
    if not context.get("exact_head_assured", False):
        return "REVALIDATE_EXACT_HEAD"
    if not context.get("required_checks_complete", False):
        return "CHECK_WATCH"
    if not context.get("checks_green", False):
        return "VALIDATION_REMEDIATION"
    if not context.get("unresolved_threads_zero", False):
        return "REVIEW_REMEDIATION"
    if not context.get("merge_state_permits", False):
        return "BRANCH_REMEDIATION"
    if not context.get("reservations_clear", False):
        return "RESERVATION_REMEDIATION"
    if policy.get("status") != "active":
        return "MERGE_AUTH_REQUIRED"
    return ELIGIBLE_RESULT


def validate_policy(policy: dict[str, Any]) -> None:
    expected = {
        "schema_version": 1,
        "id": "OWNER-TF-STANDING-OPERATOR-AUTHORITY",
        "status": "active",
        "operator": "codex-portfolio-operator",
        "merge_mode": "B-standing-authorized-work-order",
        "eligible_result": ELIGIBLE_RESULT,
        "merge_auth_required_only_when": "no applicable standing or bounded merge authority exists",
    }
    for key, value in expected.items():
        if policy.get(key) != value:
            fail(f"policy {key} must remain {value!r}")

    required_conditions = {
        "program_authorized",
        "work_order_dependency_cleared",
        "scope_within_authority",
        "pr_open_non_draft",
        "exact_head_assured",
        "required_checks_complete",
        "checks_green",
        "unresolved_threads_zero",
        "merge_state_permits",
        "reservations_clear",
        "no_true_authority_wall",
    }
    if set(policy.get("eligible_when", [])) != required_conditions:
        fail("policy eligible_when does not match the fail-closed merge contract")
    if len(policy.get("true_authority_walls", [])) != 10:
        fail("policy must retain exactly ten true authority wall classes")
    if len(policy.get("routine_operator_actions", [])) < 13:
        fail("policy must retain the complete delivery lifecycle")
    if not policy.get("suspension_triggers") or not policy.get("explicitly_denied"):
        fail("policy must remain revocable and preserve explicit denials")


def validate_decision(policy: dict[str, Any], register: dict[str, Any]) -> None:
    decisions = register.get("decisions")
    if not isinstance(decisions, list):
        fail("owner decision register requires a decisions array")
    matches = [item for item in decisions if item.get("id") == policy["id"]]
    if len(matches) != 1:
        fail("owner decision register must contain exactly one standing authority decision")
    decision = matches[0]
    expected = {
        "status": "active",
        "authority_class": policy["authority_class"],
        "merge_mode": policy["merge_mode"],
        "policy": ".governance/standing-operator-authority.json",
        "scope_source": "active ratified program and dependency-cleared Work Order",
    }
    for key, value in expected.items():
        if decision.get(key) != value:
            fail(f"owner decision {key} must remain {value!r}")
    if decision.get("explicitly_denied") != policy.get("explicitly_denied"):
        fail("owner decision and policy explicit denials must match")
    if decision.get("revocation_triggers") != policy.get("suspension_triggers"):
        fail("owner decision revocation triggers must match policy suspension triggers")


def validate_classifier(policy: dict[str, Any]) -> None:
    ready = {
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
    if classify(ready, policy) != ELIGIBLE_RESULT:
        fail("eligible authorized work must classify MERGE_AND_CONTINUE")
    for key, expected in {
        "work_order_dependency_cleared": "WAIT_DEPENDENCY",
        "exact_head_assured": "REVALIDATE_EXACT_HEAD",
        "required_checks_complete": "CHECK_WATCH",
        "checks_green": "VALIDATION_REMEDIATION",
        "unresolved_threads_zero": "REVIEW_REMEDIATION",
        "merge_state_permits": "BRANCH_REMEDIATION",
        "reservations_clear": "RESERVATION_REMEDIATION",
    }.items():
        context = dict(ready)
        context[key] = False
        if classify(context, policy) != expected:
            fail(f"{key}=false must classify {expected}")
    for key in ("program_authorized", "scope_within_authority"):
        context = dict(ready)
        context[key] = False
        if classify(context, policy) != OWNER_RESULT:
            fail(f"{key}=false must classify {OWNER_RESULT}")
    context = dict(ready)
    context["true_authority_wall"] = True
    if classify(context, policy) != OWNER_RESULT:
        fail("a true authority wall must classify BLOCKED_OWNER_DECISION")


def validate_docs() -> None:
    for relative_path, required_snippets in DOC_CONTRACTS.items():
        path = ROOT / relative_path
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            fail(f"cannot read controlling document {path}: {exc}")
        for snippet in required_snippets:
            if snippet not in text:
                fail(f"{relative_path} is missing standing-authority contract: {snippet}")


def main() -> None:
    policy = load_object(POLICY_PATH)
    register = load_object(DECISIONS_PATH)
    validate_policy(policy)
    validate_decision(policy, register)
    validate_classifier(policy)
    validate_docs()
    print(
        "Standing operator authority: PASS - active, fail-closed, "
        "and eligible work classifies MERGE_AND_CONTINUE"
    )


if __name__ == "__main__":
    main()
