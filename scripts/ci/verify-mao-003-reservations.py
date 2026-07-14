#!/usr/bin/env python3
"""Validate MAO worker assignments and reject reservation collisions."""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path, PurePosixPath


POLICY_PATH = Path(os.environ.get("TF_MAO_003_POLICY_PATH", ".governance/mao-reservation-policy.json"))
ASSIGNMENT_SCHEMA_PATH = Path("docs/brain/workorders/schema/worker-assignment.schema.json")
RESERVATION_SCHEMA_PATH = Path("docs/brain/workorders/schema/reservation.schema.json")
OPEN_PRS_ENV = "TF_MAO_003_OPEN_PRS_JSON"
NOW_ENV = "TF_MAO_003_NOW"


def fail(message: str, details: dict | None = None) -> None:
    if os.environ.get("TF_MAO_003_OUTPUT_FORMAT") == "json":
        print(json.dumps({"gate": "MAO-003", "result": "FAIL", "message": message, "details": details or {}}, sort_keys=True))
    else:
        print(f"MAO-003 reservations: FAIL - {message}")
    raise SystemExit(1)


def parse_time(value: object, source: str) -> dt.datetime:
    if not isinstance(value, str) or not value:
        fail(f"{source} requires an ISO-8601 timestamp")
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        fail(f"{source} has an invalid ISO-8601 timestamp")
    if parsed.tzinfo is None:
        fail(f"{source} timestamp requires a timezone")
    return parsed.astimezone(dt.timezone.utc)


def now_utc() -> dt.datetime:
    raw = os.environ.get(NOW_ENV)
    return parse_time(raw, NOW_ENV) if raw else dt.datetime.now(dt.timezone.utc)


def load_policy() -> dict:
    try:
        policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read policy {POLICY_PATH}: {exc}")
    expected = {
        "schema_version": 1,
        "program": "PROGRAM-MAO-001",
        "work_order": "WO-MAO-003",
        "status": "active",
        "registration_mode": "protected-conflict",
        "collision_rule": "any-current-participant-fails",
        "stale_reservations_block": True,
        "fail_closed_on_malformed_manifest": True,
    }
    for key, value in expected.items():
        if policy.get(key) != value:
            fail(f"policy {key} must remain {value!r}")
    if not isinstance(policy.get("stale_after_hours"), int) or policy["stale_after_hours"] < 1:
        fail("policy stale_after_hours must be a positive integer")
    return policy


def load_schema(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read schema {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"schema {path} must be an object")
    return value


def schema_matches(instance: object, schema: dict, source: str, schemas: dict[str, dict]) -> None:
    if "$ref" in schema:
        reference = schema["$ref"]
        target = schemas.get(reference)
        if target is None:
            fail(f"{source} schema reference is unsupported: {reference}")
        schema_matches(instance, target, source, schemas)
        return
    expected_type = schema.get("type")
    type_map = {"object": dict, "array": list, "string": str, "integer": int}
    if expected_type in type_map and (not isinstance(instance, type_map[expected_type]) or (expected_type == "integer" and isinstance(instance, bool))):
        fail(f"{source} must be {expected_type}")
    if "const" in schema and instance != schema["const"]:
        fail(f"{source} must equal {schema['const']!r}")
    if "enum" in schema and instance not in schema["enum"]:
        fail(f"{source} must be one of {schema['enum']!r}")
    if isinstance(instance, str):
        if len(instance) < schema.get("minLength", 0):
            fail(f"{source} is too short")
        if "pattern" in schema and re.fullmatch(schema["pattern"], instance) is None:
            fail(f"{source} does not match schema pattern")
        if schema.get("format") == "date-time":
            parse_time(instance, source)
    if isinstance(instance, int) and not isinstance(instance, bool) and instance < schema.get("minimum", instance):
        fail(f"{source} is below schema minimum")
    if isinstance(instance, list):
        if len(instance) < schema.get("minItems", 0):
            fail(f"{source} has too few items")
        if "items" in schema:
            for index, value in enumerate(instance):
                schema_matches(value, schema["items"], f"{source}[{index}]", schemas)
    if isinstance(instance, dict):
        required = schema.get("required", [])
        missing = [field for field in required if field not in instance]
        if missing:
            fail(f"{source} is missing schema fields: {', '.join(missing)}")
        properties = schema.get("properties", {})
        if schema.get("additionalProperties") is False:
            unknown = sorted(set(instance) - set(properties))
            if unknown:
                fail(f"{source} contains unknown schema fields: {', '.join(unknown)}")
        for field, value in instance.items():
            if field in properties:
                schema_matches(value, properties[field], f"{source}.{field}", schemas)
        for rule in schema.get("allOf", []):
            condition = rule.get("if", {})
            condition_matches = True
            if "required" in condition:
                condition_matches = all(field in instance for field in condition["required"])
            for field, field_schema in condition.get("properties", {}).items():
                if field not in instance:
                    continue
                if "const" in field_schema and instance[field] != field_schema["const"]:
                    condition_matches = False
                if "enum" in field_schema and instance[field] not in field_schema["enum"]:
                    condition_matches = False
            if condition_matches and "then" in rule:
                schema_matches(instance, {"type": "object", **rule["then"]}, source, schemas)


def normalize_identifier(value: object, source: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{source} must be a non-empty string")
    normalized = value.strip().casefold()
    if any(character.isspace() for character in normalized):
        fail(f"{source} cannot contain whitespace")
    return normalized


def normalize_path(value: object, source: str) -> str:
    if not isinstance(value, str) or not value:
        fail(f"{source} must be a non-empty repository-relative path")
    if value.startswith(("/", "\\")) or "\\" in value or any(token in value for token in "*?["):
        fail(f"{source} must be a normalized repository-relative path without globs")
    raw_parts = value.split("/")
    if any(part in {"", ".", ".."} for part in raw_parts):
        fail(f"{source} contains an unsafe path segment")
    path = PurePosixPath(value)
    if any(part in {"", ".", ".."} for part in path.parts):
        fail(f"{source} contains an unsafe path segment")
    return path.as_posix().rstrip("/").casefold()


def extract_assignment(body: object, policy: dict, pr_number: int) -> dict | None:
    if not isinstance(body, str):
        body = ""
    begin = policy["assignment_marker_begin"]
    end = policy["assignment_marker_end"]
    begin_count = body.count(begin)
    end_count = body.count(end)
    if begin_count == 0 and end_count == 0:
        return None
    if begin_count != 1 or end_count != 1 or body.index(begin) >= body.index(end):
        fail(f"PR #{pr_number} has malformed or duplicate assignment markers")
    raw = body.split(begin, 1)[1].split(end, 1)[0].strip()
    if raw.startswith("```json") and raw.endswith("```"):
        raw = raw[7:-3].strip()
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"PR #{pr_number} assignment is not valid JSON: {exc}")
    if not isinstance(value, dict):
        fail(f"PR #{pr_number} assignment must be a JSON object")
    return value


@dataclass(frozen=True)
class Reservation:
    id: str
    kind: str
    value: str
    scope: str
    status: str
    timestamp: dt.datetime
    handoff_to: str | None
    handoff_from: str | None
    handoff_from_pr: int | None
    handoff_from_head_sha: str | None
    assignment_pr: int
    assignment_wo: str
    repository: str
    assignment_state: str

    def stale(self, policy: dict, now: dt.datetime) -> bool:
        return self.status == "active" and now - self.timestamp > dt.timedelta(hours=policy["stale_after_hours"])


@dataclass
class Assignment:
    pr: int
    head_sha: str
    repository: str
    work_order: str
    worker: str
    risk_class: str
    updated_at: dt.datetime
    state: str
    changed_files: list[str]
    reservations: list[Reservation]


def validate_reservation(raw: object, assignment: dict, index: int, policy: dict, now: dt.datetime) -> Reservation:
    source = f"PR #{assignment['pull_request']} reservation[{index}]"
    if not isinstance(raw, dict):
        fail(f"{source} must be an object")
    reservation_id = normalize_identifier(raw.get("id"), f"{source}.id")
    kind = raw.get("kind")
    scope = raw.get("scope")
    status = raw.get("status")
    if kind not in policy["reservation_kinds"]:
        fail(f"{source}.kind is invalid")
    if scope not in policy["path_scopes"]:
        fail(f"{source}.scope is invalid")
    if status not in policy["reservation_states"]:
        fail(f"{source}.status is invalid")
    if kind != "path" and scope != "exact":
        fail(f"{source} contract/environment scope must be exact")
    value = normalize_path(raw.get("value"), f"{source}.value") if kind == "path" else normalize_identifier(raw.get("value"), f"{source}.value")
    timestamp = parse_time(raw.get("renewed_at", raw.get("reserved_at")), source)
    if timestamp > now + dt.timedelta(minutes=5):
        fail(f"{source} timestamp cannot be in the future")
    if status == "released":
        parse_time(raw.get("released_at"), f"{source}.released_at")
        if not isinstance(raw.get("release_reason"), str) or not raw["release_reason"].strip():
            fail(f"{source} released state requires release_reason")
    if status == "handed_off" and not raw.get("handoff_to"):
        fail(f"{source} handed_off state requires handoff_to")
    return Reservation(
        reservation_id, kind, value, scope, status, timestamp,
        normalize_identifier(raw["handoff_to"], f"{source}.handoff_to") if raw.get("handoff_to") else None,
        normalize_identifier(raw["handoff_from"], f"{source}.handoff_from") if raw.get("handoff_from") else None,
        raw.get("handoff_from_pr"), raw.get("handoff_from_head_sha"),
        assignment["pull_request"], assignment["work_order"], assignment["repository"], assignment["_live_state"],
    )


def validate_assignment(raw: dict, live_pr: dict, policy: dict, now: dt.datetime, schemas: dict[str, dict]) -> Assignment:
    pr_number = live_pr["number"]
    schema_matches(raw, schemas["worker-assignment.schema.json"], f"PR #{pr_number} assignment", schemas)
    if raw.get("repository") != policy["repository"] or raw.get("repository") != live_pr["repository"]:
        fail(f"PR #{pr_number} assignment repository does not match live state")
    if raw.get("pull_request") != pr_number:
        fail(f"PR #{pr_number} assignment pull_request does not match live state")
    head_sha = live_pr["head_sha"]
    if raw.get("head_sha") != head_sha:
        fail(f"PR #{pr_number} assignment head_sha does not match live head {head_sha}")
    work_order = raw.get("work_order")
    if not isinstance(work_order, str):
        fail(f"PR #{pr_number} assignment requires a Work Order ID")
    if raw.get("risk_class") not in policy["allowed_risk_classes"]:
        fail(f"PR #{pr_number} risk class exceeds the active MAO-003 policy")
    worker = raw.get("worker")
    if not isinstance(worker, str) or not worker.strip():
        fail(f"PR #{pr_number} assignment requires worker identity")
    updated_at = parse_time(raw.get("updated_at"), f"PR #{pr_number} assignment.updated_at")
    reservations_raw = raw.get("reservations")
    if not isinstance(reservations_raw, list) or not reservations_raw:
        fail(f"PR #{pr_number} assignment requires at least one reservation")
    raw_with_state = {**raw, "_live_state": live_pr.get("state", "open")}
    reservations = [validate_reservation(value, raw_with_state, index, policy, now) for index, value in enumerate(reservations_raw)]
    ids = [reservation.id for reservation in reservations]
    if len(ids) != len(set(ids)):
        fail(f"PR #{pr_number} assignment has duplicate reservation IDs")
    changed_files = [normalize_path(path, f"PR #{pr_number} changed file") for path in live_pr.get("changed_files", [])]
    return Assignment(pr_number, head_sha, raw["repository"], work_order, worker, raw["risk_class"], updated_at, live_pr.get("state", "open"), changed_files, reservations)


def github_json(url: str, token: str) -> object:
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "Authorization": f"Bearer {token}", "X-GitHub-Api-Version": "2022-11-28"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except Exception as exc:
        fail(f"GitHub API request failed for {url}: {exc}")


def fetch_changed_files(repository: str, number: int, token: str) -> list[str]:
    files: list[str] = []
    page = 1
    while True:
        url = f"https://api.github.com/repos/{repository}/pulls/{number}/files?per_page=100&page={page}"
        values = github_json(url, token)
        if not isinstance(values, list):
            fail(f"GitHub files response for PR #{number} must be a list")
        for value in values:
            if isinstance(value, dict) and isinstance(value.get("filename"), str):
                files.append(value["filename"])
                if isinstance(value.get("previous_filename"), str):
                    files.append(value["previous_filename"])
        if len(values) < 100:
            return files
        page += 1


def fetch_pull_request(repository: str, number: int, token: str) -> dict:
    value = github_json(f"https://api.github.com/repos/{repository}/pulls/{number}", token)
    if not isinstance(value, dict):
        fail(f"GitHub pull request response for #{number} must be an object")
    return {
        "number": number,
        "repository": repository,
        "head_sha": value.get("head", {}).get("sha"),
        "body": value.get("body") or "",
        "state": value.get("state"),
        "changed_files": fetch_changed_files(repository, number, token),
    }


def load_open_prs(policy: dict) -> list[dict]:
    fixture = os.environ.get(OPEN_PRS_ENV)
    if fixture:
        try:
            values = json.loads(fixture)
        except json.JSONDecodeError as exc:
            fail(f"{OPEN_PRS_ENV} is invalid JSON: {exc}")
        if not isinstance(values, list):
            fail(f"{OPEN_PRS_ENV} must be a list")
        return values
    repository = os.environ.get("TF_REPO", policy["repository"])
    token = os.environ.get("GH_TOKEN")
    if not token:
        fail("GH_TOKEN is required outside fixture mode")
    result = []
    page = 1
    while True:
        values = github_json(f"https://api.github.com/repos/{repository}/pulls?state=open&per_page=100&page={page}", token)
        if not isinstance(values, list):
            fail("GitHub open pull request response must be a list")
        for value in values:
            number = value.get("number")
            result.append({
                "number": number,
                "repository": repository,
                "head_sha": value.get("head", {}).get("sha"),
                "body": value.get("body") or "",
                "state": value.get("state", "open"),
                "changed_files": fetch_changed_files(repository, number, token),
            })
        if len(values) < 100:
            return result
        page += 1


def path_covers(reservation: Reservation, path: str) -> bool:
    return reservation.kind == "path" and (
        reservation.value == path or (reservation.scope == "subtree" and path.startswith(reservation.value + "/"))
    )


def overlaps(left: Reservation, right: Reservation) -> bool:
    if left.kind != right.kind:
        return False
    if left.kind != "path":
        return left.value == right.value
    return path_covers(left, right.value) or path_covers(right, left.value)


def valid_handoff(source: Reservation, reservations: dict[str, Reservation]) -> bool:
    if source.status != "handed_off" or not source.handoff_to:
        return False
    target = reservations.get(source.handoff_to)
    return bool(
        target and target.status == "active" and target.handoff_from == source.id
        and target.handoff_from_pr == source.assignment_pr
        and target.handoff_from_head_sha is not None
        and source.kind == target.kind and (source.value == target.value or (source.kind == "path" and source.scope == "subtree" and path_covers(source, target.value)))
    )


def blocking(reservation: Reservation, reservations: dict[str, Reservation]) -> bool:
    if reservation.status == "released":
        return False
    if reservation.status == "handed_off":
        if not valid_handoff(reservation, reservations):
            fail(f"reservation {reservation.id} has no valid reciprocal handoff")
        return False
    if reservation.handoff_from:
        source = reservations.get(reservation.handoff_from)
        if not source or not valid_handoff(source, reservations) or source.handoff_to != reservation.id:
            fail(f"reservation {reservation.id} has no valid reciprocal handoff source")
    return True


def main() -> None:
    policy = load_policy()
    now = now_utc()
    current_pr = int(os.environ.get("TF_PR_NUMBER", "0") or "0")
    current_sha = os.environ.get("TF_PR_HEAD_SHA", "")
    live_prs = load_open_prs(policy)
    schemas = {
        "worker-assignment.schema.json": load_schema(ASSIGNMENT_SCHEMA_PATH),
        "reservation.schema.json": load_schema(RESERVATION_SCHEMA_PATH),
    }
    if not os.environ.get(OPEN_PRS_ENV):
        token = os.environ.get("GH_TOKEN", "")
        known_numbers = {value.get("number") for value in live_prs if isinstance(value, dict)}
        source_numbers = set()
        for value in live_prs:
            if not isinstance(value, dict):
                continue
            raw = extract_assignment(value.get("body"), policy, value.get("number", 0))
            if raw:
                for reservation in raw.get("reservations", []):
                    if isinstance(reservation, dict) and isinstance(reservation.get("handoff_from_pr"), int):
                        source_numbers.add(reservation["handoff_from_pr"])
        for number in sorted(source_numbers - known_numbers):
            live_prs.append(fetch_pull_request(policy["repository"], number, token))
    normalized_prs = []
    seen_prs = set()
    for value in live_prs:
        if not isinstance(value, dict) or not isinstance(value.get("number"), int):
            fail("open PR records require integer number")
        if value["number"] in seen_prs:
            fail(f"duplicate open PR record #{value['number']}")
        seen_prs.add(value["number"])
        normalized_prs.append({
            "number": value["number"],
            "repository": value.get("repository", policy["repository"]),
            "head_sha": value.get("head_sha") or value.get("head", {}).get("sha"),
            "body": value.get("body") or "",
            "state": value.get("state", "open"),
            "changed_files": value.get("changed_files", []),
        })
    current = next((value for value in normalized_prs if value["number"] == current_pr), None)
    if current_pr and current is None:
        fail(f"current PR #{current_pr} is absent from open PR state")
    if current and current_sha and current["head_sha"] != current_sha:
        fail(f"current PR #{current_pr} live head does not match workflow head")

    assignments: list[Assignment] = []
    for live_pr in normalized_prs:
        raw = extract_assignment(live_pr["body"], policy, live_pr["number"])
        if raw is not None:
            assignments.append(validate_assignment(raw, live_pr, policy, now, schemas))

    all_reservations = [reservation for assignment in assignments for reservation in assignment.reservations]
    reservation_map = {reservation.id: reservation for reservation in all_reservations}
    if len(reservation_map) != len(all_reservations):
        fail("reservation IDs must be globally unique across open PR assignments")
    for reservation in all_reservations:
        if reservation.status == "handed_off" and not valid_handoff(reservation, reservation_map):
            fail(f"reservation {reservation.id} has no valid reciprocal handoff")
    blocking_reservations = [reservation for reservation in all_reservations if reservation.assignment_state == "open" and blocking(reservation, reservation_map)]

    for assignment in assignments:
        if assignment.state != "open" or assignment.pr != current_pr:
            continue
        active_paths = [reservation for reservation in assignment.reservations if blocking(reservation, reservation_map) and reservation.kind == "path"]
        uncovered = [path for path in assignment.changed_files if not any(path_covers(reservation, path) for reservation in active_paths)]
        if uncovered:
            fail(f"PR #{assignment.pr} ({assignment.work_order}) has changed paths outside active reservations: {', '.join(uncovered)}")

    assignment_heads = {assignment.pr: assignment.head_sha for assignment in assignments}
    for reservation in blocking_reservations:
        if reservation.handoff_from and assignment_heads.get(reservation.handoff_from_pr) != reservation.handoff_from_head_sha:
            fail(f"reservation {reservation.id} handoff source head does not match PR #{reservation.handoff_from_pr}")

    for index, left in enumerate(blocking_reservations):
        for right in blocking_reservations[index + 1:]:
            if left.assignment_pr == right.assignment_pr or not overlaps(left, right):
                continue
            if current_pr not in {left.assignment_pr, right.assignment_pr}:
                continue
            holder, contender = sorted((left, right), key=lambda reservation: (reservation.timestamp, reservation.assignment_pr))
            details = {
                "contender": {"work_order": contender.assignment_wo, "pr": contender.assignment_pr, "repository": contender.repository, "resource": contender.value},
                "holder": {"work_order": holder.assignment_wo, "pr": holder.assignment_pr, "repository": holder.repository, "resource": holder.value},
            }
            fail(
                f"collision between {left.assignment_wo}/PR #{left.assignment_pr} in {left.repository} resource {left.value} and {right.assignment_wo}/PR #{right.assignment_pr} in {right.repository} resource {right.value}; first observed holder is {holder.assignment_wo}/PR #{holder.assignment_pr}",
                details,
            )

    current_assignment = next((assignment for assignment in assignments if assignment.pr == current_pr), None)
    if current and current_assignment is None:
        current_paths = [normalize_path(path, f"PR #{current_pr} changed file") for path in current.get("changed_files", [])]
        conflicts = [reservation for reservation in blocking_reservations if any(path_covers(reservation, path) for path in current_paths)]
        if conflicts:
            holder = min(conflicts, key=lambda reservation: reservation.assignment_pr)
            fail(f"unregistered PR #{current_pr} changed a path reserved by {holder.assignment_wo}/PR #{holder.assignment_pr}: {holder.value}")

    for reservation in sorted(blocking_reservations, key=lambda value: (value.assignment_pr, value.id)):
        stale = " stale=true" if reservation.stale(policy, now) else ""
        print(f"MAO-003 reservation VIEW - {reservation.id} {reservation.assignment_wo}/PR #{reservation.assignment_pr} {reservation.repository} {reservation.kind}:{reservation.value} scope={reservation.scope}{stale}")
    print(f"MAO-003 reservations: PASS - PR #{current_pr or 'local'} has no reservation collision (assignments={len(assignments)}; blocking={len(blocking_reservations)})")


if __name__ == "__main__":
    try:
        main()
    except ValueError as exc:
        fail(str(exc))
