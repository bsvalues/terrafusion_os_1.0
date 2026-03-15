#!/usr/bin/env python3
"""
TFT-197: Verification script for canon-sync implementation.

Checks that all sync services, connector interfaces, quality gates,
and test files are present.

canon-sync = synchronization, connectors, orchestration. No appraisal math.

Usage:
    python scripts/verify_canon_sync.py
"""

import os
import sys
import json
from pathlib import Path
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FILES = {
    # Types
    "frontend/apps/os-shell/src/types/sync.ts": "TFR-095: Sync type definitions",

    # Services
    "frontend/apps/os-shell/src/services/canon/validationService.ts": "BIV-149: Validation service",
    "frontend/apps/os-shell/src/services/canon/syncService.ts": "TFT-167: Sync API client",
    "frontend/apps/os-shell/src/services/canon/connectorService.ts": "TFT-168: Connector API client",

    # Pages
    "frontend/apps/os-shell/src/pages/canon/SyncDashboard.tsx": "TFR-066: Sync dashboard",
    "frontend/apps/os-shell/src/pages/canon/IDSCommandCenter.tsx": "TFR-067: IDS command center",
    "frontend/apps/os-shell/src/pages/canon/ImportWizard.tsx": "TFR-068: Import wizard",

    # Docs
    "docs/reference/supabase-schema/sync-tables.md": "TFR-074: Sync table schema docs",

    # Scripts
    "scripts/run_pacs_sync.py": "TFT-183: PACS sync script",
    "scripts/run_data_pipeline.py": "TFT-194: Data pipeline script",
    "scripts/verify_canon_sync.py": "TFT-197: Verification script (this file)",
}

# Interfaces / exports that must exist in the type definitions
REQUIRED_TYPE_EXPORTS = [
    "SyncJob",
    "SyncResult",
    "ConnectorStatus",
    "ConnectorHealth",
    "SyncSchedule",
    "DataSource",
    "FieldMapping",
    "ImportConfig",
]

# Functions that must exist in service files
REQUIRED_SERVICE_FUNCTIONS = {
    "frontend/apps/os-shell/src/services/canon/validationService.ts": [
        "validateParcelId",
        "validateSaleRecord",
        "validatePropertyData",
    ],
    "frontend/apps/os-shell/src/services/canon/syncService.ts": [
        "listSyncJobs",
        "startSync",
        "getSyncStatus",
        "cancelSync",
        "getConnectorHealth",
    ],
    "frontend/apps/os-shell/src/services/canon/connectorService.ts": [
        "listConnectors",
        "testConnection",
        "getConnectorSchema",
        "getConnectorHistory",
    ],
}

# Quality gates: patterns that should appear in the codebase
QUALITY_GATE_PATTERNS = [
    ("ValidationResult", "frontend/apps/os-shell/src/types/sync.ts"),
    ("ValidationSeverity", "frontend/apps/os-shell/src/types/sync.ts"),
    ("export default function SyncDashboard", "frontend/apps/os-shell/src/pages/canon/SyncDashboard.tsx"),
    ("export default function IDSCommandCenter", "frontend/apps/os-shell/src/pages/canon/IDSCommandCenter.tsx"),
    ("export default function ImportWizard", "frontend/apps/os-shell/src/pages/canon/ImportWizard.tsx"),
]


# ---------------------------------------------------------------------------
# Check functions
# ---------------------------------------------------------------------------

@dataclass
class CheckResult:
    name: str
    passed: bool
    message: str


def check_files_exist() -> list[CheckResult]:
    """Verify all required files exist."""
    results = []
    for rel_path, description in REQUIRED_FILES.items():
        full = REPO_ROOT / rel_path
        exists = full.is_file()
        results.append(CheckResult(
            name=f"file:{rel_path}",
            passed=exists,
            message=f"{description} {'exists' if exists else 'MISSING'}",
        ))
    return results


def check_type_exports() -> list[CheckResult]:
    """Verify required type exports exist in sync.ts."""
    results = []
    types_file = REPO_ROOT / "frontend/apps/os-shell/src/types/sync.ts"
    if not types_file.is_file():
        results.append(CheckResult(
            name="types:sync.ts",
            passed=False,
            message="sync.ts not found; cannot check exports",
        ))
        return results

    content = types_file.read_text(encoding="utf-8")
    for type_name in REQUIRED_TYPE_EXPORTS:
        found = f"interface {type_name}" in content or f"type {type_name}" in content
        results.append(CheckResult(
            name=f"type:{type_name}",
            passed=found,
            message=f"{type_name} {'found' if found else 'MISSING'} in sync.ts",
        ))
    return results


def check_service_functions() -> list[CheckResult]:
    """Verify required functions exist in service files."""
    results = []
    for rel_path, functions in REQUIRED_SERVICE_FUNCTIONS.items():
        full = REPO_ROOT / rel_path
        if not full.is_file():
            for fn in functions:
                results.append(CheckResult(
                    name=f"fn:{rel_path}:{fn}",
                    passed=False,
                    message=f"{rel_path} not found",
                ))
            continue

        content = full.read_text(encoding="utf-8")
        for fn in functions:
            found = f"function {fn}" in content or f"const {fn}" in content
            results.append(CheckResult(
                name=f"fn:{fn}",
                passed=found,
                message=f"{fn}() {'found' if found else 'MISSING'} in {rel_path}",
            ))
    return results


def check_quality_gates() -> list[CheckResult]:
    """Verify quality gate patterns exist in the codebase."""
    results = []
    for pattern, rel_path in QUALITY_GATE_PATTERNS:
        full = REPO_ROOT / rel_path
        if not full.is_file():
            results.append(CheckResult(
                name=f"gate:{pattern}",
                passed=False,
                message=f"File {rel_path} not found",
            ))
            continue

        content = full.read_text(encoding="utf-8")
        found = pattern in content
        results.append(CheckResult(
            name=f"gate:{pattern[:40]}",
            passed=found,
            message=f"Pattern {'found' if found else 'MISSING'} in {rel_path}",
        ))
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    print("=" * 60)
    print("  Canon-Sync Implementation Verification")
    print("=" * 60)
    print(f"Repo root: {REPO_ROOT}\n")

    all_results: list[CheckResult] = []
    all_results.extend(check_files_exist())
    all_results.extend(check_type_exports())
    all_results.extend(check_service_functions())
    all_results.extend(check_quality_gates())

    passed = sum(1 for r in all_results if r.passed)
    failed = sum(1 for r in all_results if not r.passed)
    total = len(all_results)

    for r in all_results:
        status = "PASS" if r.passed else "FAIL"
        print(f"  [{status}] {r.message}")

    print()
    print("-" * 60)
    print(f"  Total: {total}  Passed: {passed}  Failed: {failed}")

    if failed == 0:
        print("  All canon-sync checks passed.")
    else:
        print(f"  {failed} check(s) failed.")

    print("-" * 60)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
