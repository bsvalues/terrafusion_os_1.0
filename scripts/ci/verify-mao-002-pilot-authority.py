#!/usr/bin/env python3
"""Fail-closed MAO-002 pilot authority and execution-state interlock.

The owner bootstrap envelope is stable for the pilot lifetime. Codex maintains the separate
execution record as PR numbers, exact heads, scopes, reservations, and assurance state change.
"""

from __future__ import annotations

import datetime as dt
import fnmatch
import hashlib
import json
import os
import urllib.request
from pathlib import Path


POLICY_PATH = Path(
    os.environ.get(
        "TF_MAO_002_POLICY_PATH",
        ".governance/mao-002-pilot-merge-authority.json",
    )
)
BOOTSTRAP_ENV = "TF_MAO_002_BOOTSTRAP_JSON"
EXECUTION_ENV = "TF_MAO_002_EXECUTION_JSON"
RISK_ORDER = {f"R{level}": level for level in range(6)}


def fail(message: str) -> None:
    print(f"MAO-002 pilot authority: FAIL - {message}")
    raise SystemExit(1)


def normalize_identity(value: str) -> str:
    return value.strip().casefold()


def load_json(path: Path) -> dict:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"{path} must contain a JSON object")
    return value


def parse_json_env(name: str, raw: str) -> dict:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"{name} is not valid JSON: {exc}")
    if not isinstance(value, dict):
        fail(f"{name} must contain a JSON object")
    return value


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha256(path: Path) -> str:
    try:
        return sha256_bytes(path.read_bytes())
    except OSError as exc:
        fail(f"cannot hash {path}: {exc}")


def validate_suspension(value: object, source: str) -> None:
    if not isinstance(value, dict) or not isinstance(value.get("active"), bool):
        fail(f"{source}.suspension must be an object with a boolean active field")
    reason = value.get("reason")
    if reason is not None and (not isinstance(reason, str) or not reason.strip()):
        fail(f"{source}.suspension.reason must be null or a non-empty string")
    if value["active"] and reason is None:
        fail(f"{source} active suspension requires a reason")


def validate_policy(policy: dict) -> None:
    expected = {
        "schema_version": 2,
        "program": "PROGRAM-MAO-001",
        "work_order": "WO-MAO-002",
        "merge_mode": "B",
        "activation_source": "split-github-actions-repository-variables",
        "bootstrap_variable": "MAO_002_PILOT_BOOTSTRAP_JSON",
        "execution_variable": "MAO_002_PILOT_EXECUTION_JSON",
        "pilot_label": "mao-002-pilot",
        "pilot_branch_glob": "codex/mao-002-*",
        "status": "inactive",
        "owner": "William",
        "operator_identity": "codex-portfolio-operator",
        "assurance_identity": "claude-assurance",
        "required_implementation_operator_count": 2,
        "max_merged_prs": 2,
        "maximum_risk_class": "R2",
        "allowed_repositories": ["bsvalues/terrafusion_os_1.0"],
        "allowed_path_prefixes": ["docs/"],
        "disallowed_reviewers": ["William"],
    }
    for key, value in expected.items():
        if policy.get(key) != value:
            fail(f"checked-in policy {key} must remain {value!r}")
    if not policy.get("owner_envelope_fields") or not policy.get("operator_execution_fields"):
        fail("checked-in policy must declare owner and operator field ownership")
    if not policy.get("suspension_conditions"):
        fail("checked-in policy must declare suspension conditions")


def validate_identity_list(value: object, count: int, source: str) -> list[str]:
    if not isinstance(value, list) or len(value) != count:
        fail(f"{source} must contain exactly {count} unique identities")
    if not all(isinstance(identity, str) and identity.strip() for identity in value):
        fail(f"{source} must contain exactly {count} unique identities")
    normalized = [normalize_identity(identity) for identity in value]
    if len(set(normalized)) != count:
        fail(f"{source} must contain exactly {count} unique identities")
    return normalized


def validate_prefixes(value: object, source: str) -> list[str]:
    if not isinstance(value, list) or not value:
        fail(f"{source} must be a non-empty list")
    prefixes = []
    for prefix in value:
        if (
            not isinstance(prefix, str)
            or not prefix
            or prefix.startswith(("/", "\\"))
            or ".." in Path(prefix).parts
        ):
            fail(f"{source} contains an unsafe path prefix")
        prefixes.append(prefix.replace("\\", "/"))
    return prefixes


def parse_expiration(value: object, source: str) -> dt.datetime:
    if not isinstance(value, str) or not value:
        fail(f"{source} requires expires_at")
    try:
        expiration = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        fail(f"{source}.expires_at must be an ISO-8601 timestamp")
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=dt.timezone.utc)
    return expiration


def validate_bootstrap(bootstrap: dict, policy: dict) -> None:
    forbidden_execution_fields = {
        "revision",
        "updated_at",
        "bootstrap_sha256",
        "implementation_operators",
        "independent_reviewer",
        "post_merge_assurance_evidence",
        "pilot_prs",
    }
    present = sorted(forbidden_execution_fields & bootstrap.keys())
    if present:
        fail("owner bootstrap contains operator execution fields: " + ", ".join(present))
    expected = {
        "schema_version": 1,
        "program": policy["program"],
        "work_order": policy["work_order"],
        "merge_mode": policy["merge_mode"],
        "owner": policy["owner"],
        "operator_identity": policy["operator_identity"],
        "assurance_identity": policy["assurance_identity"],
        "max_merged_prs": policy["max_merged_prs"],
    }
    for key, value in expected.items():
        if bootstrap.get(key) != value:
            fail(f"owner bootstrap {key} must remain {value!r}")
    authority_id = bootstrap.get("authority_id")
    if not isinstance(authority_id, str) or not authority_id.strip():
        fail("owner bootstrap requires authority_id")
    if bootstrap.get("policy_sha256") != file_sha256(POLICY_PATH):
        fail("owner bootstrap policy_sha256 does not match the checked-in policy")
    if bootstrap.get("status") not in {"active", "suspended", "expired"}:
        fail("owner bootstrap status must be active, suspended, or expired")
    validate_suspension(bootstrap.get("suspension"), "owner bootstrap")
    if bootstrap["status"] == "suspended" and not bootstrap["suspension"]["active"]:
        fail("suspended owner bootstrap requires suspension.active=true")
    repositories = bootstrap.get("repositories")
    if not isinstance(repositories, list) or not repositories:
        fail("owner bootstrap requires repositories")
    if any(repository not in policy["allowed_repositories"] for repository in repositories):
        fail("owner bootstrap repository exceeds checked-in policy")
    prefixes = validate_prefixes(bootstrap.get("allowed_path_prefixes"), "owner bootstrap allowed_path_prefixes")
    if any(
        not any(prefix.startswith(ceiling) for ceiling in policy["allowed_path_prefixes"])
        for prefix in prefixes
    ):
        fail("owner bootstrap path prefix exceeds checked-in policy")
    risk = bootstrap.get("risk_ceiling")
    if risk not in RISK_ORDER or RISK_ORDER[risk] > RISK_ORDER[policy["maximum_risk_class"]]:
        fail("owner bootstrap risk_ceiling exceeds checked-in policy")
    expiration = parse_expiration(bootstrap.get("expires_at"), "owner bootstrap")
    now = dt.datetime.now(dt.timezone.utc)
    if bootstrap["status"] == "active" and expiration <= now:
        fail("owner bootstrap is expired")
    if bootstrap["status"] == "expired" and expiration > now:
        fail("expired owner bootstrap must have expires_at in the past")


def static_pattern_prefix(pattern: str) -> str:
    wildcard_positions = [position for token in "*?[" if (position := pattern.find(token)) >= 0]
    return pattern[: min(wildcard_positions)] if wildcard_positions else pattern


def contains_wildcard(pattern: str) -> bool:
    return any(token in pattern for token in "*?[")


def roots_overlap(left: str, right: str) -> bool:
    left = left.rstrip("/")
    right = right.rstrip("/")
    return left == right or left.startswith(right + "/") or right.startswith(left + "/")


def path_is_within_prefix(path: str, prefix: str) -> bool:
    path = path.rstrip("/")
    prefix = prefix.rstrip("/")
    return path == prefix or path.startswith(prefix + "/")


def reservation_patterns_overlap(left: str, right: str) -> bool:
    left = left.rstrip("/")
    right = right.rstrip("/")
    if not contains_wildcard(left) and not contains_wildcard(right):
        return roots_overlap(left, right)

    left_static = static_pattern_prefix(left)
    right_static = static_pattern_prefix(right)
    left_root = left_static.rstrip("/")
    right_root = right_static.rstrip("/")
    if not left_root or not right_root:
        return True
    return (
        roots_overlap(left_root, right_root)
        or (not right_static.endswith("/") and left_root.startswith(right_root))
        or (not left_static.endswith("/") and right_root.startswith(left_root))
    )


def validate_execution(execution: dict, bootstrap: dict, bootstrap_raw: str, policy: dict) -> None:
    forbidden_owner_fields = {
        "status",
        "owner",
        "repositories",
        "risk_ceiling",
        "allowed_path_prefixes",
        "max_merged_prs",
        "expires_at",
        "policy_sha256",
        "merge_mode",
    }
    present = sorted(forbidden_owner_fields & execution.keys())
    if present:
        fail("operator execution contains owner envelope fields: " + ", ".join(present))
    expected = {
        "schema_version": 1,
        "program": policy["program"],
        "work_order": policy["work_order"],
        "authority_id": bootstrap["authority_id"],
        "operator_identity": bootstrap["operator_identity"],
        "independent_reviewer": bootstrap["assurance_identity"],
        "bootstrap_sha256": sha256_bytes(bootstrap_raw.encode("utf-8")),
    }
    for key, value in expected.items():
        if execution.get(key) != value:
            fail(f"operator execution {key} must remain {value!r}")
    if not isinstance(execution.get("revision"), int) or execution["revision"] <= 0:
        fail("operator execution revision must be a positive integer")
    if not isinstance(execution.get("updated_at"), str) or not execution["updated_at"]:
        fail("operator execution requires updated_at")
    validate_suspension(execution.get("suspension"), "operator execution")
    normalized_operators = validate_identity_list(
        execution.get("implementation_operators"),
        policy["required_implementation_operator_count"],
        "implementation_operators",
    )
    reviewer = normalize_identity(execution["independent_reviewer"])
    disallowed = {
        normalize_identity(identity) for identity in policy["disallowed_reviewers"]
    } | set(normalized_operators)
    if reviewer in disallowed:
        fail("independent_reviewer must differ from owner and implementation operators")
    evidence = execution.get("post_merge_assurance_evidence")
    if not isinstance(evidence, str) or not evidence.startswith("docs/"):
        fail("operator execution requires a docs/ post_merge_assurance_evidence path")

    slots = execution.get("pilot_prs")
    if not isinstance(slots, list) or len(slots) != bootstrap["max_merged_prs"]:
        fail("operator execution must contain exactly two pilot PR slots")
    if {slot.get("slot") for slot in slots if isinstance(slot, dict)} != {"lane-a", "lane-b"}:
        fail("operator execution slots must be lane-a and lane-b")

    numbers = []
    roots: list[tuple[str, str]] = []
    for slot in slots:
        number = slot.get("number")
        sha = slot.get("head_sha")
        paths = slot.get("allowed_paths")
        repository = slot.get("repository")
        risk = slot.get("risk_class")
        reservation_id = slot.get("reservation_id")
        if not isinstance(number, int) or number <= 0:
            fail("operator execution pilot slots require positive integer PR numbers")
        if not isinstance(sha, str) or len(sha) != 40 or any(c not in "0123456789abcdef" for c in sha):
            fail(f"PR #{number} requires an exact lowercase 40-character head SHA")
        if repository not in bootstrap["repositories"]:
            fail(f"PR #{number} repository exceeds owner bootstrap")
        if risk not in RISK_ORDER or RISK_ORDER[risk] > RISK_ORDER[bootstrap["risk_ceiling"]]:
            fail(f"PR #{number} risk_class exceeds owner bootstrap")
        if not isinstance(reservation_id, str) or not reservation_id.strip():
            fail(f"PR #{number} requires a reservation_id")
        if not isinstance(paths, list) or not paths or not all(isinstance(path, str) and path for path in paths):
            fail(f"PR #{number} requires a non-empty allowed_paths list")
        for pattern in paths:
            normalized = pattern.replace("\\", "/")
            root = static_pattern_prefix(normalized)
            if not root or ".." in Path(root).parts:
                fail(f"PR #{number} contains an unsafe allowed path pattern")
            if not any(
                path_is_within_prefix(root, prefix)
                for prefix in bootstrap["allowed_path_prefixes"]
            ):
                fail(f"PR #{number} allowed path exceeds owner bootstrap")
            roots.append((slot["slot"], normalized.rstrip("/")))
        numbers.append(number)
    if len(set(numbers)) != len(numbers):
        fail("operator execution pilot PR numbers must be unique")
    for index, (slot, pattern) in enumerate(roots):
        for other_slot, other_pattern in roots[index + 1 :]:
            if slot != other_slot and reservation_patterns_overlap(pattern, other_pattern):
                fail(f"pilot path reservations overlap between {slot} and {other_slot}")


def load_effective_records() -> tuple[dict, dict | None, str]:
    policy = load_json(POLICY_PATH)
    validate_policy(policy)
    bootstrap_raw = os.environ.get(BOOTSTRAP_ENV, "").strip()
    execution_raw = os.environ.get(EXECUTION_ENV, "").strip()
    if not bootstrap_raw and not execution_raw:
        return policy, None, f"checked-in inactive policy sha256={file_sha256(POLICY_PATH)}"
    if not bootstrap_raw or not execution_raw:
        fail("owner bootstrap and operator execution variables must be present together")
    bootstrap = parse_json_env(BOOTSTRAP_ENV, bootstrap_raw)
    execution = parse_json_env(EXECUTION_ENV, execution_raw)
    validate_bootstrap(bootstrap, policy)
    validate_execution(execution, bootstrap, bootstrap_raw, policy)
    source = (
        "split repository variables "
        f"bootstrap_sha256={sha256_bytes(bootstrap_raw.encode('utf-8'))} "
        f"execution_sha256={sha256_bytes(execution_raw.encode('utf-8'))} "
        f"policy_sha256={file_sha256(POLICY_PATH)}"
    )
    return policy, execution, source


def extract_changed_paths(items: list, source: str) -> list[str]:
    paths: list[str] = []
    for item in items:
        if isinstance(item, str):
            paths.append(item)
            continue
        if not isinstance(item, dict) or not isinstance(item.get("filename"), str):
            fail(f"{source} must contain path strings or GitHub file-change objects")
        paths.append(item["filename"])
        previous = item.get("previous_filename")
        if previous is not None:
            if not isinstance(previous, str) or not previous:
                fail(f"{source} previous_filename values must be non-empty strings")
            paths.append(previous)
    return list(dict.fromkeys(paths))


def changed_files(repo: str, pr_number: int) -> list[str]:
    fixture = os.environ.get("TF_MAO_002_CHANGED_FILES_JSON")
    if fixture is not None:
        value = json.loads(fixture)
        if not isinstance(value, list):
            fail("TF_MAO_002_CHANGED_FILES_JSON must be a JSON array")
        return extract_changed_paths(value, "TF_MAO_002_CHANGED_FILES_JSON")
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
        except Exception as exc:
            fail(f"cannot inspect PR #{pr_number} files: {exc}")
        if not isinstance(batch, list):
            fail(f"unexpected GitHub files response for PR #{pr_number}")
        files.extend(extract_changed_paths(batch, f"GitHub files response for PR #{pr_number}"))
        if len(batch) < 100:
            break
        page += 1
    return files


def main() -> None:
    policy, execution, source = load_effective_records()
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
    is_pilot_candidate = policy["pilot_label"] in labels or fnmatch.fnmatchcase(
        head_ref, policy["pilot_branch_glob"]
    )
    slots = execution.get("pilot_prs", []) if execution else []
    slot = next((item for item in slots if item.get("number") == pr_number), None)
    if slot is None:
        if is_pilot_candidate:
            fail(f"pilot candidate PR #{pr_number} is not registered in operator execution state")
        if execution:
            files = changed_files(repo, pr_number)
            pilot_patterns = [pattern for item in slots for pattern in item["allowed_paths"]]
            overlap = [
                path
                for path in files
                if any(fnmatch.fnmatchcase(path, pattern) for pattern in pilot_patterns)
            ]
            if overlap:
                fail(f"unregistered PR #{pr_number} overlaps active pilot scope: " + ", ".join(sorted(overlap)))
        print(f"MAO-002 pilot authority: PASS - PR #{pr_number} is not a registered pilot PR ({source})")
        return
    if not is_pilot_candidate:
        fail(f"registered pilot PR #{pr_number} lacks the required pilot label or branch identity")
    bootstrap = parse_json_env(BOOTSTRAP_ENV, os.environ[BOOTSTRAP_ENV])
    if bootstrap["suspension"]["active"]:
        fail(f"owner bootstrap is suspended: {bootstrap['suspension']['reason']}")
    if bootstrap["status"] != "active":
        fail(f"registered pilot PR #{pr_number} has owner bootstrap status {bootstrap['status']}")
    if execution["suspension"]["active"]:
        fail(f"operator execution is suspended: {execution['suspension']['reason']}")
    if repo != slot["repository"]:
        fail(f"repository mismatch for PR #{pr_number}: registered={slot['repository']} live={repo}")
    if head_sha != slot["head_sha"]:
        fail(f"head SHA mismatch for PR #{pr_number}: registered={slot['head_sha']} live={head_sha}")
    files = changed_files(repo, pr_number)
    if not files:
        fail(f"registered pilot PR #{pr_number} has no changed files")
    outside = [
        path
        for path in files
        if not any(fnmatch.fnmatchcase(path, pattern) for pattern in slot["allowed_paths"])
    ]
    if outside:
        fail(f"scope drift for PR #{pr_number}; outside allowed paths: " + ", ".join(sorted(outside)))
    print(
        f"MAO-002 pilot authority: PASS - PR #{pr_number} head {head_sha} matches "
        f"operator execution revision {execution['revision']} ({len(files)} files; {source})"
    )


if __name__ == "__main__":
    main()
