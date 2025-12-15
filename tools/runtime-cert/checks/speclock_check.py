#!/usr/bin/env python3
"""
SpecLock Index Runtime Certification Check
==========================================
Part of TerraFusion go-live acceptance gate.

Validates that docs/spec-lock/INDEX.json is valid and all referenced
spec files exist at their declared paths.

Exit Codes:
  0 - PASS: All spec locks valid
  1 - FAIL: Missing or invalid spec locks
  2 - ERROR: Script execution error

Usage:
  python speclock_check.py [--repo-root PATH]

Environment Variables:
  TERRAFUSION_REPO_ROOT - Repository root (default: auto-detected)
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path


def find_repo_root() -> Path:
    """Find repository root by looking for INDEX.json."""
    current = Path(__file__).resolve().parent

    # Walk up to find docs/spec-lock/INDEX.json
    for _ in range(10):  # Prevent infinite loop
        index_path = current / "docs" / "spec-lock" / "INDEX.json"
        if index_path.exists():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent

    # Fallback: assume we're in tools/runtime-cert/checks/
    return Path(__file__).resolve().parent.parent.parent.parent


def check_speclock_index(repo_root: Path) -> tuple[bool, dict, list[str]]:
    """
    Validates INDEX.json and all referenced spec files.

    Returns:
        (passed: bool, details: dict, errors: list[str])
    """
    errors = []
    warnings = []
    details = {
        "index_path": None,
        "total_locks": 0,
        "validated_locks": 0,
        "missing_specs": [],
        "valid_specs": [],
    }

    # Load INDEX.json
    index_path = repo_root / "docs" / "spec-lock" / "INDEX.json"
    details["index_path"] = str(index_path)

    if not index_path.exists():
        errors.append(f"INDEX.json not found at {index_path}")
        return False, details, errors

    try:
        with open(index_path, "r", encoding="utf-8") as f:
            index = json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"INDEX.json parse error: {e}")
        return False, details, errors

    # Validate structure
    if "locks" not in index:
        errors.append("INDEX.json missing 'locks' array")
        return False, details, errors

    locks = index.get("locks", [])
    details["total_locks"] = len(locks)

    if len(locks) == 0:
        errors.append("INDEX.json has empty 'locks' array")
        return False, details, errors

    # Validate each lock entry
    for lock in locks:
        lock_id = lock.get("id", "<unknown>")

        # Check required fields
        required_fields = ["id", "surface", "status", "spec_version"]
        for field in required_fields:
            if field not in lock:
                errors.append(f"Lock '{lock_id}' missing required field: {field}")

        # Validate spec_path or spec_data_path exists
        spec_path = lock.get("spec_path") or lock.get("spec_data_path")
        if not spec_path:
            errors.append(f"Lock '{lock_id}' has no spec_path or spec_data_path")
            continue

        # Check if spec file exists
        full_spec_path = repo_root / spec_path
        if not full_spec_path.exists():
            errors.append(f"Lock '{lock_id}' spec file missing: {spec_path}")
            details["missing_specs"].append({
                "id": lock_id,
                "spec_path": spec_path,
            })
        else:
            details["valid_specs"].append({
                "id": lock_id,
                "spec_path": spec_path,
                "status": lock.get("status", "unknown"),
            })
            details["validated_locks"] += 1

            # Validate spec file is valid JSON (for .json files)
            if spec_path.endswith(".json"):
                try:
                    with open(full_spec_path, "r", encoding="utf-8") as f:
                        spec_data = json.load(f)

                    # Check for speclock.spec.json expected fields
                    if "speclock.spec.json" in spec_path:
                        if "id" not in spec_data:
                            warnings.append(f"Spec '{lock_id}' missing 'id' field in spec file")
                        elif spec_data.get("id") != lock_id:
                            warnings.append(
                                f"Spec '{lock_id}' ID mismatch: INDEX says '{lock_id}', "
                                f"spec file says '{spec_data.get('id')}'"
                            )
                except json.JSONDecodeError as e:
                    errors.append(f"Lock '{lock_id}' spec file invalid JSON: {e}")

        # Check test_paths exist (warning only)
        for test_path in lock.get("test_paths", []):
            full_test_path = repo_root / test_path
            if not full_test_path.exists():
                warnings.append(f"Lock '{lock_id}' test file missing: {test_path}")

    details["warnings"] = warnings
    passed = len(errors) == 0
    return passed, details, errors


def main():
    parser = argparse.ArgumentParser(description='SpecLock Index Runtime Certification Check')
    parser.add_argument('--repo-root',
                        default=os.environ.get('TERRAFUSION_REPO_ROOT'),
                        help='Repository root path (default: auto-detected)')
    parser.add_argument('--json', action='store_true',
                        help='Output results as JSON')
    parser.add_argument('--strict', action='store_true',
                        help='Treat warnings as errors')

    args = parser.parse_args()

    # Determine repo root
    if args.repo_root:
        repo_root = Path(args.repo_root).resolve()
    else:
        repo_root = find_repo_root()

    print("=" * 60)
    print("TerraFusion SpecLock Index Certification")
    print("=" * 60)
    print(f"Repository: {repo_root}")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("-" * 60)

    passed, details, errors = check_speclock_index(repo_root)

    # In strict mode, warnings become errors
    if args.strict and details.get("warnings"):
        errors.extend(details["warnings"])
        passed = False

    if args.json:
        result = {
            "passed": passed,
            "repo_root": str(repo_root),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "errors": errors,
            "details": details,
        }
        print(json.dumps(result, indent=2))
    else:
        if passed:
            print("✅ SPECLOCK INDEX CERTIFICATION: PASSED")
            print()
            print(f"Total locks: {details['total_locks']}")
            print(f"Validated: {details['validated_locks']}")
            print()
            print("Valid specs:")
            for spec in details.get("valid_specs", []):
                print(f"  ✓ {spec['id']} ({spec['status']})")

            if details.get("warnings"):
                print()
                print("Warnings:")
                for warn in details["warnings"]:
                    print(f"  ⚠ {warn}")
        else:
            print("❌ SPECLOCK INDEX CERTIFICATION: FAILED")
            print()
            print("Errors:")
            for err in errors:
                print(f"  ✗ {err}")

            if details.get("missing_specs"):
                print()
                print("Missing spec files:")
                for spec in details["missing_specs"]:
                    print(f"  - {spec['id']}: {spec['spec_path']}")

    print()
    print("=" * 60)

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: Script execution failed: {e}", file=sys.stderr)
        sys.exit(2)
