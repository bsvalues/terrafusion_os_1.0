#!/usr/bin/env python3
"""Fail-closed MAO-002 pilot merge-authority interlock.

The check is dormant until the canonical authority record is activated. Once active, it binds the
two registered pilot PRs to exact head SHAs and allowed path sets. It does not grant merge authority;
it mechanically verifies predicates of the already-recorded owner grant.
"""

from __future__ import annotations

import datetime as dt
import fnmatch
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path


AUTHORITY_PATH = Path(
    os.environ.get(
        "TF_MAO_002_AUTHORITY_PATH",
        ".governance/mao-002-pilot-merge-authority.json",
    )
)
ACTIVATION_ENV = "TF_MAO_002_AUTHORITY_JSON"


def fail(message: str) -> None:
    print(f"MAO-002 pilot authority: FAIL - {message}")
    raise SystemExit(1)


def load_json(path: Path) -> dict:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"{path} must contain a JSON object")
    return value


def policy_sha256(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        fail(f"cannot hash {path}: {exc}")


def load_effective_record() -> tuple[dict, str]:
    policy = load_json(AUTHORITY_PATH)
    validate_record(policy)
    if policy.get("status") != "inactive":
        fail("checked-in pilot policy must remain inactive")

    raw = os.environ.get(ACTIVATION_ENV, "").strip()
    if not raw:
        return policy, f"checked-in inactive policy sha256={policy_sha256(AUTHORITY_PATH)}"
    try:
        record = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"{ACTIVATION_ENV} is not valid JSON: {exc}")
    if not isinstance(record, dict):
        fail(f"{ACTIVATION_ENV} must contain a JSON object")
    validate_record(record)
    expected_policy_sha = policy_sha256(AUTHORITY_PATH)
    if record.get("policy_sha256") != expected_policy_sha:
        fail(
            "activation policy_sha256 does not match the checked-in inactive policy: "
            f"registered={record.get('policy_sha256')} live={expected_policy_sha}"
        )
    activation_sha = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return (
        record,
        "GitHub Actions repository variable "
        f"activation_sha256={activation_sha} policy_sha256={expected_policy_sha}",
    )


def validate_record(record: dict) -> None:
    if record.get("schema_version") != 1:
        fail("schema_version must be 1")
    if record.get("program") != "PROGRAM-MAO-001":
        fail("program must be PROGRAM-MAO-001")
    if record.get("work_order") != "WO-MAO-002":
        fail("work_order must be WO-MAO-002")
    if record.get("merge_mode") != "B":
        fail("merge_mode must be B")
    if record.get("activation_source") != "github-actions-repository-variable":
        fail("activation_source must be github-actions-repository-variable")
    if record.get("activation_variable") != "MAO_002_PILOT_AUTHORITY_JSON":
        fail("activation_variable must be MAO_002_PILOT_AUTHORITY_JSON")
    if record.get("pilot_label") != "mao-002-pilot":
        fail("pilot_label must remain mao-002-pilot")
    if record.get("pilot_branch_glob") != "codex/mao-002-*":
        fail("pilot_branch_glob must remain codex/mao-002-*")
    if record.get("owner") != "William":
        fail("owner must remain William")
    if record.get("required_implementation_operator_count") != 2:
        fail("required_implementation_operator_count must remain exactly 2")
    if record.get("disallowed_reviewers") != ["William"]:
        fail("disallowed_reviewers must remain exactly [William]")
    if record.get("status") not in {"inactive", "active", "suspended", "expired"}:
        fail("status must be inactive, active, suspended, or expired")
    if record.get("max_merged_prs") != 2:
        fail("max_merged_prs must remain exactly 2")

    slots = record.get("pilot_prs")
    if not isinstance(slots, list) or len(slots) != 2:
        fail("pilot_prs must contain exactly two slots")
    if {slot.get("slot") for slot in slots if isinstance(slot, dict)} != {
        "lane-a",
        "lane-b",
    }:
        fail("pilot slots must be lane-a and lane-b")

    if record.get("status") == "inactive":
        return

    numbers = []
    for slot in slots:
        number = slot.get("number")
        sha = slot.get("head_sha")
        paths = slot.get("allowed_paths")
        if not isinstance(number, int) or number <= 0:
            fail("active pilot slots require positive integer PR numbers")
        if not isinstance(sha, str) or len(sha) != 40:
            fail(f"PR #{number} requires an exact 40-character final head SHA")
        if not isinstance(paths, list) or not paths or not all(
            isinstance(path, str) and path for path in paths
        ):
            fail(f"PR #{number} requires a non-empty allowed_paths list")
        if not isinstance(slot.get("repository"), str) or not slot.get("repository"):
            fail(f"PR #{number} requires an exact repository")
        numbers.append(number)
    if len(set(numbers)) != 2:
        fail("active pilot PR numbers must be unique")

    reviewer = record.get("independent_reviewer")
    operators = record.get("implementation_operators")
    if not isinstance(reviewer, str) or not reviewer.strip():
        fail("active authority requires a named independent_reviewer")
    required_operator_count = record["required_implementation_operator_count"]
    if (
        not isinstance(operators, list)
        or len(operators) != required_operator_count
        or not all(isinstance(operator, str) and operator.strip() for operator in operators)
        or len({operator.casefold() for operator in operators}) != required_operator_count
    ):
        fail(f"implementation_operators must contain exactly {required_operator_count} unique identities")
    disallowed_reviewers = {
        *(identity.casefold() for identity in record["disallowed_reviewers"]),
        *(op.casefold() for op in operators),
    }
    if reviewer.casefold() in disallowed_reviewers:
        fail("independent_reviewer must differ from owner and implementation operators")
    if not record.get("post_merge_assurance_evidence"):
        fail("active authority requires a post_merge_assurance_evidence path")

    expires_at = record.get("expires_at")
    if not isinstance(expires_at, str) or not expires_at:
        fail("active authority requires expires_at")
    try:
        expiration = dt.datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    except ValueError:
        fail("expires_at must be an ISO-8601 timestamp")
    now = dt.datetime.now(dt.timezone.utc)
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=dt.timezone.utc)
    if record.get("status") == "active" and expiration <= now:
        fail("pilot authority is expired")
    if record.get("status") == "expired" and expiration > now:
        fail("expired authority must have an expires_at value in the past")


def changed_files(repo: str, pr_number: int) -> list[str]:
    fixture = os.environ.get("TF_MAO_002_CHANGED_FILES_JSON")
    if fixture is not None:
        value = json.loads(fixture)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            fail("TF_MAO_002_CHANGED_FILES_JSON must be a JSON string array")
        return value

    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        fail("GH_TOKEN/GITHUB_TOKEN is required to inspect registered pilot PR scope")

    files: list[str] = []
    page = 1
    while True:
        url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files?per_page=100&page={page}"
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                batch = json.load(response)
        except Exception as exc:  # network/API failure must fail closed for a registered pilot PR
            fail(f"cannot inspect PR #{pr_number} files: {exc}")
        if not isinstance(batch, list):
            fail(f"unexpected GitHub files response for PR #{pr_number}")
        files.extend(item.get("filename") for item in batch if item.get("filename"))
        if len(batch) < 100:
            break
        page += 1
    return files


def main() -> None:
    record, source = load_effective_record()

    pr_text = os.environ.get("TF_PR_NUMBER", "").strip()
    head_sha = os.environ.get("TF_PR_HEAD_SHA", "").strip()
    head_ref = os.environ.get("TF_PR_HEAD_REF", "").strip()
    repo = os.environ.get("TF_REPO", "").strip()
    if not pr_text:
        print(f"MAO-002 pilot authority: PASS - non-PR event ({source})")
        return
    try:
        pr_number = int(pr_text)
    except ValueError:
        fail("TF_PR_NUMBER must be an integer")

    labels_raw = os.environ.get("TF_PR_LABELS_JSON", "[]")
    try:
        labels = json.loads(labels_raw)
    except json.JSONDecodeError as exc:
        fail(f"TF_PR_LABELS_JSON is not valid JSON: {exc}")
    if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
        fail("TF_PR_LABELS_JSON must contain a JSON string array")
    is_pilot_candidate = record["pilot_label"] in labels or fnmatch.fnmatchcase(
        head_ref, record["pilot_branch_glob"]
    )

    slot = next(
        (item for item in record["pilot_prs"] if item.get("number") == pr_number),
        None,
    )
    if slot is None:
        if is_pilot_candidate:
            fail(
                f"pilot candidate PR #{pr_number} ({head_ref or 'no head ref'}) is not registered "
                f"in an active exact-SHA manifest"
            )
        if record.get("status") in {"active", "suspended", "expired"}:
            files = changed_files(repo, pr_number)
            pilot_patterns = [
                pattern
                for item in record["pilot_prs"]
                for pattern in (item.get("allowed_paths") or [])
            ]
            overlap = [
                path
                for path in files
                if any(fnmatch.fnmatchcase(path, pattern) for pattern in pilot_patterns)
            ]
            if overlap:
                fail(
                    f"unregistered PR #{pr_number} overlaps active pilot scope: "
                    + ", ".join(sorted(overlap))
                )
        print(
            f"MAO-002 pilot authority: PASS - PR #{pr_number} is not a registered pilot PR "
            f"({source})"
        )
        return

    if not is_pilot_candidate:
        fail(f"registered pilot PR #{pr_number} lacks the required pilot label or branch identity")
    if record.get("status") != "active":
        fail(f"registered pilot PR #{pr_number} has authority status {record.get('status')}")
    if (record.get("suspension") or {}).get("active"):
        fail(
            f"registered pilot authority is suspended: "
            f"{(record.get('suspension') or {}).get('reason') or 'no reason recorded'}"
        )
    if repo != slot.get("repository"):
        fail(f"repository mismatch for PR #{pr_number}: registered={slot.get('repository')} live={repo}")
    if head_sha != slot.get("head_sha"):
        fail(f"final SHA mismatch for PR #{pr_number}: registered={slot.get('head_sha')} live={head_sha}")

    files = changed_files(repo, pr_number)
    if not files:
        fail(f"registered pilot PR #{pr_number} has no changed files")
    outside = [
        path
        for path in files
        if not any(fnmatch.fnmatchcase(path, pattern) for pattern in slot["allowed_paths"])
    ]
    if outside:
        fail(
            f"scope drift for PR #{pr_number}; outside allowed paths: " + ", ".join(sorted(outside))
        )

    print(
        f"MAO-002 pilot authority: PASS - PR #{pr_number} head {head_sha} "
        f"matches registered scope ({len(files)} files; {source})"
    )


if __name__ == "__main__":
    main()
