#!/usr/bin/env python3
"""
TerraFusion SpecLock Index Validator

Validates docs/spec-lock/INDEX.json against:
  - required fields + minimal schema rules (no external deps required)
  - file existence: spec_path must exist
  - glob existence: each test_paths entry must match >= 1 file
  - uniqueness: lock ids must be unique

Optional:
  - If jsonschema is installed, performs full JSON Schema validation using:
      docs/spec-lock/index.schema.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


INDEX_JSON_DEFAULT = Path("docs/spec-lock/INDEX.json")
SCHEMA_JSON_DEFAULT = Path("docs/spec-lock/index.schema.json")

RE_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RE_SPECVER = re.compile(r"^v\d+\.\d+\.\d+$")
RE_LOCK_ID = re.compile(r"^tf\.[a-z0-9_]+\.[a-z0-9_]+$")
RE_TAG = re.compile(r"^[a-z0-9_\-]+$")

ALLOWED_STATUS = {"active", "deprecated", "draft"}
ALLOWED_SURFACE = {"api", "ui", "events", "metrics", "alerts", "dashboards", "mixed"}


@dataclass
class Finding:
    level: str  # "ERROR" | "WARN"
    message: str


def _load_json(path: Path) -> Dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to parse JSON at {path}: {e}") from e


def _try_jsonschema_validate(doc: Dict[str, Any], schema_path: Path) -> List[Finding]:
    findings: List[Finding] = []
    try:
        import jsonschema  # type: ignore

        schema = _load_json(schema_path)
        try:
            jsonschema.validate(instance=doc, schema=schema)  # type: ignore
        except Exception as e:
            findings.append(Finding("ERROR", f"JSON Schema validation failed: {e}"))
    except ModuleNotFoundError:
        findings.append(Finding("WARN", "python 'jsonschema' not installed; skipping full schema validation."))
    except FileNotFoundError:
        findings.append(Finding("WARN", f"Schema file missing at {schema_path}; skipping full schema validation."))
    except Exception as e:
        findings.append(Finding("WARN", f"Unexpected schema validation issue: {e}"))
    return findings


def _require(cond: bool, msg: str, findings: List[Finding]) -> None:
    if not cond:
        findings.append(Finding("ERROR", msg))


def _warn(cond: bool, msg: str, findings: List[Finding]) -> None:
    if not cond:
        findings.append(Finding("WARN", msg))


def _as_list(v: Any) -> Optional[List[Any]]:
    return v if isinstance(v, list) else None


def _as_str(v: Any) -> Optional[str]:
    return v if isinstance(v, str) else None


def _match_glob_any(root: Path, pattern: str) -> List[Path]:
    # Use pathlib glob which supports ** patterns in Python 3.11+.
    # Normalize to forward slashes for patterns.
    p = pattern.replace("\\", "/")
    try:
        return [x for x in root.glob(p) if x.is_file()]
    except Exception:
        # If glob fails (rare), fall back to empty.
        return []


def validate_index(index_path: Path, schema_path: Path) -> Tuple[List[Finding], Dict[str, Any]]:
    findings: List[Finding] = []
    root = Path(".").resolve()

    # Load
    try:
        doc = _load_json(index_path)
    except FileNotFoundError:
        return [Finding("ERROR", f"SpecLock index missing: {index_path}")], {}
    except Exception as e:
        return [Finding("ERROR", str(e))], {}

    # Optional full schema validation
    findings.extend(_try_jsonschema_validate(doc, schema_path))

    # Minimal required top-level structure
    _require(isinstance(doc, dict), "INDEX.json must be a JSON object.", findings)
    if not isinstance(doc, dict):
        return findings, {}

    version = doc.get("version")
    updated = doc.get("updated")
    locks = doc.get("locks")

    _require(_as_str(version) is not None and len(version) > 0, "Top-level 'version' is required.", findings)
    _require(_as_str(updated) is not None and RE_DATE.match(updated or "") is not None,
             "Top-level 'updated' must be YYYY-MM-DD.", findings)
    _require(_as_list(locks) is not None, "Top-level 'locks' must be an array.", findings)

    if not isinstance(locks, list):
        return findings, doc

    # Per-lock checks
    seen_ids: set[str] = set()
    for i, lock in enumerate(locks):
        prefix = f"locks[{i}]"
        if not isinstance(lock, dict):
            findings.append(Finding("ERROR", f"{prefix} must be an object."))
            continue

        lid = _as_str(lock.get("id"))
        _require(lid is not None and RE_LOCK_ID.match(lid) is not None,
                 f"{prefix}.id must match 'tf.<surface>.<slug>' using [a-z0-9_].", findings)
        if lid:
            _require(lid not in seen_ids, f"Duplicate lock id: {lid}", findings)
            seen_ids.add(lid)

        surface = _as_str(lock.get("surface"))
        _require(surface is not None and surface in ALLOWED_SURFACE,
                 f"{prefix}.surface must be one of {sorted(ALLOWED_SURFACE)}", findings)

        status = _as_str(lock.get("status"))
        _require(status is not None and status in ALLOWED_STATUS,
                 f"{prefix}.status must be one of {sorted(ALLOWED_STATUS)}", findings)

        for key in ["project", "name", "owner"]:
            v = _as_str(lock.get(key))
            _require(v is not None and len(v.strip()) > 0, f"{prefix}.{key} is required.", findings)

        spec_version = _as_str(lock.get("spec_version"))
        _require(spec_version is not None and RE_SPECVER.match(spec_version) is not None,
                 f"{prefix}.spec_version must match vX.Y.Z", findings)

        created = _as_str(lock.get("created"))
        updated2 = _as_str(lock.get("updated"))
        _require(created is not None and RE_DATE.match(created or "") is not None,
                 f"{prefix}.created must be YYYY-MM-DD", findings)
        _require(updated2 is not None and RE_DATE.match(updated2 or "") is not None,
                 f"{prefix}.updated must be YYYY-MM-DD", findings)

        notes = lock.get("notes")
        _require(isinstance(notes, str), f"{prefix}.notes must be a string (can be empty).", findings)

        # Paths: spec_path must exist
        spec_path = _as_str(lock.get("spec_path"))
        _require(spec_path is not None and len(spec_path.strip()) > 0,
                 f"{prefix}.spec_path is required.", findings)
        if spec_path:
            sp = root / spec_path
            _require(sp.exists() and sp.is_file(), f"{prefix}.spec_path does not exist: {spec_path}", findings)

        # test_paths: must be array with >=1 and each glob must match >=1 file
        test_paths = _as_list(lock.get("test_paths"))
        _require(test_paths is not None and len(test_paths) >= 1,
                 f"{prefix}.test_paths must be a non-empty array of globs.", findings)
        if isinstance(test_paths, list):
            for j, pat in enumerate(test_paths):
                if not isinstance(pat, str) or not pat.strip():
                    findings.append(Finding("ERROR", f"{prefix}.test_paths[{j}] must be a non-empty string."))
                    continue
                matches = _match_glob_any(root, pat)
                _require(len(matches) >= 1,
                         f"{prefix}.test_paths[{j}] glob matched 0 files: {pat}", findings)

        # artifact_paths: warn if any missing (not fatal)
        artifact_paths = _as_list(lock.get("artifact_paths"))
        _require(artifact_paths is not None, f"{prefix}.artifact_paths must be an array (can be empty).", findings)
        if isinstance(artifact_paths, list):
            for j, ap in enumerate(artifact_paths):
                if not isinstance(ap, str) or not ap.strip():
                    findings.append(Finding("ERROR", f"{prefix}.artifact_paths[{j}] must be a non-empty string."))
                    continue
                # For globs with **, check if any match; for direct paths, check existence
                if "**" in ap or "*" in ap:
                    matches = _match_glob_any(root, ap)
                    _warn(len(matches) >= 1, f"{prefix}.artifact_paths[{j}] glob matched 0 files (warn): {ap}", findings)
                else:
                    p = root / ap
                    _warn(p.exists(), f"{prefix}.artifact_paths[{j}] missing (warn): {ap}", findings)

        # ci_tags: must be array of safe tags (warn on empties)
        ci_tags = _as_list(lock.get("ci_tags"))
        _require(ci_tags is not None, f"{prefix}.ci_tags must be an array (can be empty).", findings)
        if isinstance(ci_tags, list):
            for j, tag in enumerate(ci_tags):
                if not isinstance(tag, str) or not tag.strip():
                    findings.append(Finding("WARN", f"{prefix}.ci_tags[{j}] empty/invalid tag (warn)."))
                    continue
                _require(RE_TAG.match(tag) is not None, f"{prefix}.ci_tags[{j}] invalid tag: {tag}", findings)

    return findings, doc


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock Index Validator (Python)")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    parser = argparse.ArgumentParser(description="Validate TerraFusion SpecLock Index")
    parser.add_argument("--index", default=str(INDEX_JSON_DEFAULT), help="Path to INDEX.json")
    parser.add_argument("--schema", default=str(SCHEMA_JSON_DEFAULT), help="Path to index.schema.json")
    parser.add_argument("--strict", action="store_true", help="Treat WARN as ERROR")
    args = parser.parse_args()

    index_path = Path(args.index)
    schema_path = Path(args.schema)

    print(f"ℹ️  Index: {index_path}")
    print(f"ℹ️  Schema: {schema_path}")
    print("")

    findings, doc = validate_index(index_path, schema_path)

    errors = [f for f in findings if f.level == "ERROR"]
    warns = [f for f in findings if f.level == "WARN"]

    for f in findings:
        symbol = "❌" if f.level == "ERROR" else "⚠️ "
        print(f"{symbol} {f.level}: {f.message}")

    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  Validation Summary")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    locks_count = len(doc.get("locks", [])) if doc else 0
    print(f"Locks validated: {locks_count}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warns)}")
    print("")

    if errors:
        print(f"❌ SpecLock index validation FAILED ({len(errors)} errors, {len(warns)} warnings).")
        return 2

    if warns and args.strict:
        print(f"❌ SpecLock index validation FAILED (strict mode: {len(warns)} warnings).")
        return 3

    print(f"✅ SpecLock index validation PASSED ({len(warns)} warnings).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
