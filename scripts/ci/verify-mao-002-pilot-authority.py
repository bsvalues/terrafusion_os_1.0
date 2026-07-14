#!/usr/bin/env python3
"""Fail-closed MAO-002 pilot merge-authority interlock.

The check is dormant until the canonical authority record is activated. Once active, it binds the
two registered pilot PRs to exact head SHAs and allowed path sets. It does not grant merge authority;
it mechanically verifies predicates of the already-recorded owner grant.
"""

from __future__ import annotations

import datetime as dt
import fnmatch
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


def validate_record(record: dict) -> None:
    if record.get("schema_version") != 1:
        fail("schema_version must be 1")
    if record.get("program") != "PROGRAM-MAO-001":
        fail("program must be PROGRAM-MAO-001")
    if record.get("work_order") != "WO-MAO-002":
        fail("work_order must be WO-MAO-002")
    if record.get("merge_mode") != "B":
        fail("merge_mode must be B")
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

    if record.get("status") != "active":
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
    owner = record.get("owner")
    operators = record.get("implementation_operators")
    if not isinstance(reviewer, str) or not reviewer.strip():
        fail("active authority requires a named independent_reviewer")
    if not isinstance(operators, list) or not all(
        isinstance(operator, str) and operator for operator in operators
    ):
        fail("implementation_operators must be a list of named identities")
    disallowed_reviewers = {str(owner).casefold(), *(op.casefold() for op in operators)}
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
    if expiration <= now:
        fail("pilot authority is expired")


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
    record = load_json(AUTHORITY_PATH)
    validate_record(record)

    pr_text = os.environ.get("TF_PR_NUMBER", "").strip()
    head_sha = os.environ.get("TF_PR_HEAD_SHA", "").strip()
    repo = os.environ.get("TF_REPO", "").strip()
    if not pr_text:
        print("MAO-002 pilot authority: PASS - non-PR event")
        return
    try:
        pr_number = int(pr_text)
    except ValueError:
        fail("TF_PR_NUMBER must be an integer")

    slot = next(
        (item for item in record["pilot_prs"] if item.get("number") == pr_number),
        None,
    )
    if slot is None:
        if record.get("status") in {"active", "suspended"}:
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
        print(f"MAO-002 pilot authority: PASS - PR #{pr_number} is not a registered pilot PR")
        return

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
        f"matches registered scope ({len(files)} files)"
    )


if __name__ == "__main__":
    main()
