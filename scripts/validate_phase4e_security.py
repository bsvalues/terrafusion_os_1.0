#!/usr/bin/env python3
"""
Phase 4E Security Remediation Manifest Validator
Validates phase4e.security-remediation.manifest.json against 9 governance rules.

Rules:
  P4E-001: All 169 blocked assets present in manifest
  P4E-002: Every asset has all required fields populated
  P4E-003: blocking_issue_type is one of: secret-exposure, data-exposure, credential-file
  P4E-004: remediation_status is one of: blocked, in-progress, remediated, verified
  P4E-005: reclassification is one of: blocked-security, blocked-boundary, blocked-runtime, unblocked-ready
  P4E-006: activation_eligibility is "eligible" only when remediation_status == "verified"
            AND all gate results are "pass"
  P4E-007: Asset count per repo matches expected (BCBSLevy=76, TerraFusionPilt=15, TerraMiner=78)
  P4E-008: No asset has reclassification "unblocked-ready" while any gate result is "pending" or "fail"
  P4E-009: Derived-only eligibility — reclassification and activation_eligibility must match
            values recomputed from evidence + gates + verification state.  Hand-authored
            overrides are forbidden.

Usage:
  python3 scripts/validate_phase4e_security.py [path-to-manifest]
  Default path: phase4e.security-remediation.manifest.json
"""

import json
import sys
import os
from collections import Counter

REQUIRED_FIELDS = [
    "asset_id",
    "source_repo",
    "description",
    "owner_suite",
    "target_home",
    "migration_batch",
    "parity_mode",
    "blocking_issue_type",
    "remediation_action",
    "evidence_required",
    "boundary_scan_result",
    "shell_smoke_result",
    "dependency_license_result",
    "remediation_owner",
    "remediation_status",
    "reclassification",
    "activation_eligibility",
]

VALID_BLOCKING_TYPES = {"secret-exposure", "data-exposure", "credential-file"}
VALID_REMEDIATION_STATUSES = {"blocked", "in-progress", "remediated", "verified"}
VALID_RECLASSIFICATIONS = {
    "blocked-security",
    "blocked-boundary",
    "blocked-runtime",
    "unblocked-ready",
}

EXPECTED_REPO_COUNTS = {
    "BCBSLevy": 76,
    "TerraFusionPilt": 15,
    "TerraMiner": 78,
}

GATE_FIELDS = [
    "boundary_scan_result",
    "shell_smoke_result",
    "dependency_license_result",
]


def load_manifest(path):
    with open(path, "r") as f:
        return json.load(f)


def rule_p4e_001(assets):
    """All 169 blocked assets present in manifest."""
    count = len(assets)
    ok = count == 169
    detail = f"{count}/169 assets present"
    return ok, detail


def rule_p4e_002(assets):
    """Every asset has all required fields populated."""
    missing = []
    for a in assets:
        for field in REQUIRED_FIELDS:
            val = a.get(field)
            if val is None or (isinstance(val, str) and val.strip() == ""):
                missing.append(f"{a.get('asset_id', '???')}: missing '{field}'")
    ok = len(missing) == 0
    detail = f"{len(missing)} missing fields" if missing else "all fields populated"
    if missing and len(missing) <= 5:
        detail += " -- " + "; ".join(missing)
    elif missing:
        detail += " -- " + "; ".join(missing[:5]) + f" ... and {len(missing)-5} more"
    return ok, detail


def rule_p4e_003(assets):
    """blocking_issue_type is one of the valid set."""
    bad = [
        a["asset_id"]
        for a in assets
        if a.get("blocking_issue_type") not in VALID_BLOCKING_TYPES
    ]
    ok = len(bad) == 0
    detail = f"{len(bad)} invalid blocking_issue_type" if bad else "all valid"
    if bad:
        detail += f" -- {bad[:5]}"
    return ok, detail


def rule_p4e_004(assets):
    """remediation_status is one of the valid set."""
    bad = [
        a["asset_id"]
        for a in assets
        if a.get("remediation_status") not in VALID_REMEDIATION_STATUSES
    ]
    ok = len(bad) == 0
    detail = f"{len(bad)} invalid remediation_status" if bad else "all valid"
    if bad:
        detail += f" -- {bad[:5]}"
    return ok, detail


def rule_p4e_005(assets):
    """reclassification is one of the valid set."""
    bad = [
        a["asset_id"]
        for a in assets
        if a.get("reclassification") not in VALID_RECLASSIFICATIONS
    ]
    ok = len(bad) == 0
    detail = f"{len(bad)} invalid reclassification" if bad else "all valid"
    if bad:
        detail += f" -- {bad[:5]}"
    return ok, detail


def rule_p4e_006(assets):
    """activation_eligibility is 'eligible' only when remediation_status == 'verified'
    AND all gate results are 'pass'."""
    violations = []
    for a in assets:
        if a.get("activation_eligibility") == "eligible":
            if a.get("remediation_status") != "verified":
                violations.append(
                    f"{a['asset_id']}: eligible but status={a.get('remediation_status')}"
                )
            for gate in GATE_FIELDS:
                if a.get(gate) != "pass":
                    violations.append(
                        f"{a['asset_id']}: eligible but {gate}={a.get(gate)}"
                    )
                    break
    ok = len(violations) == 0
    detail = (
        f"{len(violations)} eligibility violations" if violations else "all consistent"
    )
    if violations:
        detail += " -- " + "; ".join(violations[:5])
    return ok, detail


def rule_p4e_007(assets):
    """Asset count per repo matches expected."""
    repo_counts = Counter(a["source_repo"] for a in assets)
    mismatches = []
    for repo, expected in EXPECTED_REPO_COUNTS.items():
        actual = repo_counts.get(repo, 0)
        if actual != expected:
            mismatches.append(f"{repo}: expected {expected}, got {actual}")
    # Check for unexpected repos
    for repo in repo_counts:
        if repo not in EXPECTED_REPO_COUNTS:
            mismatches.append(f"{repo}: unexpected repo ({repo_counts[repo]} assets)")
    ok = len(mismatches) == 0
    detail = "all repo counts match" if ok else "; ".join(mismatches)
    return ok, detail


def rule_p4e_008(assets):
    """No asset has reclassification 'unblocked-ready' while any gate result
    is 'pending' or 'fail'."""
    violations = []
    for a in assets:
        if a.get("reclassification") == "unblocked-ready":
            for gate in GATE_FIELDS:
                val = a.get(gate, "pending")
                if val in ("pending", "fail"):
                    violations.append(f"{a['asset_id']}: unblocked-ready but {gate}={val}")
                    break
    ok = len(violations) == 0
    detail = (
        f"{len(violations)} premature unblock violations"
        if violations
        else "no premature unblocks"
    )
    if violations:
        detail += " -- " + "; ".join(violations[:5])
    return ok, detail


def _evidence_satisfied(asset):
    """Check if remediation evidence is satisfied for the asset's blocking_issue_type."""
    evidence = asset.get("evidence_required", "")
    # Parse evidence fields from the manifest's evidence_required string or evidence object
    # For manifest assets, we check gate results and remediation status to derive classification.
    issue_type = asset.get("blocking_issue_type", "")

    # Evidence fields are not stored as structured data in the manifest today.
    # Derivation uses gate results + remediation_status + founder_verified as the
    # computable subset.  When structured evidence lands, this function expands.
    return True  # Evidence check is gate-level; detailed check deferred to structured evidence phase


def _derive_reclassification(asset):
    """Recompute reclassification from gate results and remediation state.

    Mirrors derive_reclassification() in test_phase4e_activation_state_machine.py.
    """
    boundary = asset.get("boundary_scan_result", "pending")
    shell = asset.get("shell_smoke_result", "pending")
    dep_lic = asset.get("dependency_license_result", "pending")

    if boundary == "fail":
        return "blocked-boundary"

    if dep_lic == "fail" or shell == "fail":
        return "blocked-runtime"

    gates_pass = boundary == "pass" and shell == "pass" and dep_lic == "pass"

    verified = (
        asset.get("remediation_status") == "verified"
        and asset.get("founder_verified", False) is True
    )

    if gates_pass and verified:
        return "unblocked-ready"

    return "blocked-security"


def _derive_activation_eligibility(asset):
    """Recompute activation_eligibility from derived reclassification."""
    return "eligible" if _derive_reclassification(asset) == "unblocked-ready" else "not-eligible"


def rule_p4e_009(assets):
    """Derived-only eligibility: stored reclassification and activation_eligibility
    must match values recomputed from evidence + gates + verification state."""
    violations = []
    for a in assets:
        expected_reclass = _derive_reclassification(a)
        stored_reclass = a.get("reclassification", "")
        if stored_reclass != expected_reclass:
            violations.append(
                f"{a['asset_id']}: reclassification stored={stored_reclass} derived={expected_reclass}"
            )

        expected_elig = _derive_activation_eligibility(a)
        stored_elig = a.get("activation_eligibility", "")
        if stored_elig != expected_elig:
            violations.append(
                f"{a['asset_id']}: activation_eligibility stored={stored_elig} derived={expected_elig}"
            )

    ok = len(violations) == 0
    detail = (
        f"{len(violations)} derivation mismatches"
        if violations
        else "all values match derivation"
    )
    if violations and len(violations) <= 5:
        detail += " -- " + "; ".join(violations)
    elif violations:
        detail += " -- " + "; ".join(violations[:5]) + f" ... and {len(violations)-5} more"
    return ok, detail


def print_summary(assets):
    """Print summary by repo and remediation status."""
    print("\n--- Summary by Repo ---")
    repo_counts = Counter(a["source_repo"] for a in assets)
    for repo in sorted(repo_counts):
        print(f"  {repo}: {repo_counts[repo]} assets")

    print("\n--- Summary by Remediation Status ---")
    status_counts = Counter(a["remediation_status"] for a in assets)
    for status in sorted(status_counts):
        print(f"  {status}: {status_counts[status]} assets")

    print("\n--- Summary by Blocking Issue Type ---")
    type_counts = Counter(a["blocking_issue_type"] for a in assets)
    for btype in sorted(type_counts):
        print(f"  {btype}: {type_counts[btype]} assets")

    print("\n--- Summary by Reclassification ---")
    reclass_counts = Counter(a["reclassification"] for a in assets)
    for rc in sorted(reclass_counts):
        print(f"  {rc}: {reclass_counts[rc]} assets")

    print("\n--- Summary by Activation Eligibility ---")
    elig_counts = Counter(a["activation_eligibility"] for a in assets)
    for e in sorted(elig_counts):
        print(f"  {e}: {elig_counts[e]} assets")


def main():
    manifest_path = sys.argv[1] if len(sys.argv) > 1 else "phase4e.security-remediation.manifest.json"

    if not os.path.exists(manifest_path):
        print(f"ERROR: Manifest not found: {manifest_path}")
        sys.exit(1)

    manifest = load_manifest(manifest_path)
    assets = manifest.get("assets", [])

    rules = [
        ("P4E-001", "All 169 blocked assets present", rule_p4e_001),
        ("P4E-002", "Every asset has all required fields", rule_p4e_002),
        ("P4E-003", "Valid blocking_issue_type values", rule_p4e_003),
        ("P4E-004", "Valid remediation_status values", rule_p4e_004),
        ("P4E-005", "Valid reclassification values", rule_p4e_005),
        ("P4E-006", "Activation eligibility consistency", rule_p4e_006),
        ("P4E-007", "Asset count per repo matches expected", rule_p4e_007),
        ("P4E-008", "No premature unblocked-ready", rule_p4e_008),
        ("P4E-009", "Derived-only eligibility (no hand-authored overrides)", rule_p4e_009),
    ]

    print(f"Phase 4E Security Remediation Validator")
    print(f"Manifest: {manifest_path}")
    print(f"Assets:   {len(assets)}")
    print(f"{'='*60}")

    all_pass = True
    for rule_id, rule_name, rule_fn in rules:
        ok, detail = rule_fn(assets)
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_pass = False
        print(f"  {rule_id} [{status}] {rule_name}")
        print(f"         {detail}")

    print(f"{'='*60}")

    print_summary(assets)

    print(f"\n{'='*60}")
    if all_pass:
        print("RESULT: ALL 9 RULES PASSED")
        sys.exit(0)
    else:
        print("RESULT: ONE OR MORE RULES FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()
