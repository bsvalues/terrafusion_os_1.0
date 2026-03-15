#!/usr/bin/env python3
"""Phase 4F Activation Ledger Validator.

Gates P4F-001 through P4F-007 plus derived-activation enforcement.
"""

import json
import os
import sys

LEDGER = "phase4f.activation.ledger.json"

VALID_WAVES = {"1A", "1B", "1C", "1D", "4E"}
VALID_SUITES = {"Forge", "Dais", "Dossier", "Atlas", "Canon", "OS"}
VALID_ISSUE_FAMILIES = {"none", "secret-exposure", "data-exposure", "credential-file"}
VALID_ACTIVATION = {"not-activated", "activated"}
VALID_PARITY = {"unverified", "verified"}
VALID_RUNTIME = {"not-checked", "pass", "fail"}
VALID_SHELL = {"not-checked", "pass", "fail"}
VALID_DEPRECATION = {"active-source", "destination-active", "source-retired"}
VALID_CONSUMER = {"not-checked", "migrated", "source-still-referenced"}

REQUIRED_FIELDS = [
    "asset_id", "wave", "source_repo", "source_path",
    "destination_repo", "destination_path", "suite_owner",
    "issue_family", "reclassification", "activation_eligibility",
    "activation_status", "parity_status", "runtime_status",
    "shell_status", "deprecation_status", "consumer_status", "route_proof",
]

# Suite → allowed destination path prefixes
SUITE_LANES = {
    "Forge": [
        "backend/src/TerraFusion.AI/",
        "backend/src/TerraFusion.Core/",
        "backend/src/TerraFusion.API/Controllers/",
        "frontend/apps/os-shell/src/pages/forge/",
        "frontend/apps/os-shell/src/components/forge/",
        "frontend/apps/os-shell/src/services/forge",
        "frontend/apps/os-shell/src/hooks/",
        "frontend/apps/os-shell/src/types/",
    ],
    "Dais": [
        "backend/src/TerraFusion.AI/",
        "backend/src/TerraFusion.Core/",
        "backend/src/TerraFusion.API/Controllers/",
        "frontend/apps/os-shell/src/pages/dais/",
        "frontend/apps/os-shell/src/components/dais/",
        "frontend/apps/os-shell/src/services/",
    ],
    "Dossier": [
        "backend/src/TerraFusion.Core/Documents/",
        "backend/src/TerraFusion.AI/Narratives/",
        "backend/src/TerraFusion.AI/Notices/",
        "backend/src/TerraFusion.AI/Agents/Document",
        "frontend/apps/os-shell/src/pages/dossier/",
        "frontend/apps/os-shell/src/components/dossier/",
        "frontend/apps/os-shell/src/services/suites/dossier",
    ],
    "Atlas": [
        "backend/src/TerraFusion.Core/",
        "backend/src/TerraFusion.API/",
        "frontend/apps/os-shell/src/pages/atlas/",
        "frontend/apps/os-shell/src/components/atlas/",
        "frontend/apps/os-shell/src/components/gis/",
        "frontend/apps/os-shell/src/services/gis",
        "frontend/apps/os-shell/src/hooks/",
    ],
    "Canon": [
        "backend/src/TerraFusion.Core/",
        "backend/src/TerraFusion.Data/",
        "backend/src/TerraFusion.API/",
        "backend/src/TerraFusion.DataMining/",
        "backend/src/TerraFusion.DataMining.Tests/",
        "backend/TerraFusion.API.Tests/",
        "frontend/apps/os-shell/src/components/ui/",
        "frontend/apps/os-shell/src/components/common/",
        "frontend/apps/os-shell/src/components/datamining/",
        "frontend/apps/os-shell/src/services/",
        "frontend/apps/os-shell/src/hooks/",
        "frontend/apps/os-shell/src/types/",
        "frontend/apps/os-shell/src/contexts/",
        "docs/",
        "infrastructure/",
        "scripts/",
    ],
    "OS": [
        "backend/src/TerraFusion.API/",
        "backend/src/TerraFusion.Security/",
        "backend/src/TerraFusion.Core/",
        "frontend/apps/os-shell/src/",
        "docs/",
        "scripts/",
    ],
}


def derive_activation_status(asset: dict) -> str:
    """Activation is derived: all three must pass for activated to be valid."""
    if asset.get("activation_status") != "activated":
        return asset.get("activation_status", "not-activated")
    # If claiming activated, parity+runtime+shell must all pass
    parity_ok = asset.get("parity_status") == "verified"
    runtime_ok = asset.get("runtime_status") == "pass"
    shell_ok = asset.get("shell_status") == "pass"
    if parity_ok and runtime_ok and shell_ok:
        return "activated"
    return "INVALID"  # claimed activated but proofs missing


def load_ledger():
    with open(LEDGER) as f:
        return json.load(f)


def rule(name, desc):
    def decorator(fn):
        fn._rule_name = name
        fn._rule_desc = desc
        return fn
    return decorator


@rule("P4F-001", "Unified 511-asset activation ledger")
def check_p4f_001(data):
    assets = data["assets"]
    n = len(assets)
    ids = [a["asset_id"] for a in assets]
    dupes = len(ids) - len(set(ids))

    # Check all required fields present
    missing_fields = []
    for a in assets:
        for f in REQUIRED_FIELDS:
            if f not in a:
                missing_fields.append(f"{a.get('asset_id', '?')}: missing {f}")

    # Check valid enum values
    bad_enums = []
    for a in assets:
        aid = a["asset_id"]
        if a.get("wave") not in VALID_WAVES:
            bad_enums.append(f"{aid}: wave={a.get('wave')}")
        if a.get("suite_owner") not in VALID_SUITES:
            bad_enums.append(f"{aid}: suite={a.get('suite_owner')}")
        if a.get("issue_family") not in VALID_ISSUE_FAMILIES:
            bad_enums.append(f"{aid}: issue={a.get('issue_family')}")
        if a.get("activation_status") not in VALID_ACTIVATION:
            bad_enums.append(f"{aid}: act={a.get('activation_status')}")
        if a.get("parity_status") not in VALID_PARITY:
            bad_enums.append(f"{aid}: parity={a.get('parity_status')}")
        if a.get("runtime_status") not in VALID_RUNTIME:
            bad_enums.append(f"{aid}: runtime={a.get('runtime_status')}")
        if a.get("shell_status") not in VALID_SHELL:
            bad_enums.append(f"{aid}: shell={a.get('shell_status')}")
        if a.get("deprecation_status") not in VALID_DEPRECATION:
            bad_enums.append(f"{aid}: deprec={a.get('deprecation_status')}")
        if a.get("consumer_status") not in VALID_CONSUMER:
            bad_enums.append(f"{aid}: consumer={a.get('consumer_status')}")

    ok = n == 511 and dupes == 0 and not missing_fields and not bad_enums
    detail = f"{n} assets, {dupes} dupes, {len(missing_fields)} missing fields, {len(bad_enums)} bad enums"
    return ok, detail


@rule("P4F-002", "Route and surface integrity")
def check_p4f_002(data):
    """Check activated assets resolve through approved suite lanes."""
    activated = [a for a in data["assets"] if a["activation_status"] == "activated"]
    if not activated:
        return True, "no activated assets yet — vacuously true"

    violations = []
    for a in activated:
        suite = a["suite_owner"]
        dest = a["destination_path"]
        lanes = SUITE_LANES.get(suite, [])
        if not any(dest.startswith(lane) for lane in lanes):
            violations.append(f"{a['asset_id']}: {suite} not in lane for {dest}")

    ok = len(violations) == 0
    detail = f"{len(activated)} activated, {len(violations)} lane violations"
    return ok, detail


@rule("P4F-003", "Source/destination exclusivity")
def check_p4f_003(data):
    """activated implies deprecation_status != active-source."""
    violations = []
    for a in data["assets"]:
        if a["activation_status"] == "activated" and a["deprecation_status"] == "active-source":
            violations.append(a["asset_id"])
    ok = len(violations) == 0
    detail = f"{len(violations)} assets activated but source still active" if violations else "all exclusive"
    return ok, detail


@rule("P4F-004", "Suite ownership integrity")
def check_p4f_004(data):
    """Every asset's destination_path is consistent with its suite_owner."""
    # Soft check: warn on mismatches but don't block non-activated
    warnings = []
    for a in data["assets"]:
        suite = a["suite_owner"]
        dest = a["destination_path"]
        lanes = SUITE_LANES.get(suite, [])
        if lanes and not any(dest.startswith(lane) for lane in lanes):
            warnings.append(f"{a['asset_id']}: {suite} vs {dest}")

    # Only fail on activated assets with mismatches
    activated_mismatches = [
        w for w in warnings
        if any(a["asset_id"] == w.split(":")[0] and a["activation_status"] == "activated"
               for a in data["assets"])
    ]
    ok = len(activated_mismatches) == 0
    detail = f"{len(warnings)} total lane notes, {len(activated_mismatches)} activated mismatches"
    return ok, detail


@rule("P4F-005", "Runtime smoke by domain")
def check_p4f_005(data):
    """Each domain with activated assets needs at least one runtime pass."""
    activated = [a for a in data["assets"] if a["activation_status"] == "activated"]
    if not activated:
        return True, "no activated assets — vacuously true"

    suites_with_activated = set(a["suite_owner"] for a in activated)
    suites_with_runtime = set(
        a["suite_owner"] for a in activated if a["runtime_status"] == "pass"
    )
    missing = suites_with_activated - suites_with_runtime
    ok = len(missing) == 0
    detail = f"domains with activated: {suites_with_activated}, missing runtime: {missing or 'none'}"
    return ok, detail


@rule("P4F-006", "Mixed-wave regression")
def check_p4f_006(data):
    """Activated assets from different waves coexist without conflicts."""
    activated = [a for a in data["assets"] if a["activation_status"] == "activated"]
    if not activated:
        return True, "no activated assets — vacuously true"

    # Check for destination_path collisions
    paths = {}
    collisions = []
    for a in activated:
        p = a["destination_path"]
        if p in paths:
            collisions.append(f"{a['asset_id']} collides with {paths[p]}")
        paths[p] = a["asset_id"]

    # Check for duplicate capabilities (same suite_owner + same filename)
    caps = {}
    dupes = []
    for a in activated:
        fname = os.path.basename(a["destination_path"])
        key = f"{a['suite_owner']}:{fname}"
        if key in caps and caps[key] != a["asset_id"]:
            dupes.append(f"{a['asset_id']} duplicates {caps[key]} ({key})")
        caps[key] = a["asset_id"]

    ok = len(collisions) == 0 and len(dupes) == 0
    waves = set(a["wave"] for a in activated)
    detail = f"waves active: {waves}, {len(collisions)} collisions, {len(dupes)} capability dupes"
    return ok, detail


@rule("P4F-007", "Retirement readiness")
def check_p4f_007(data):
    """No source-retired without activation + parity + runtime proof."""
    violations = []
    for a in data["assets"]:
        if a["deprecation_status"] == "source-retired":
            if a["activation_status"] != "activated":
                violations.append(f"{a['asset_id']}: retired but not activated")
            if a["parity_status"] != "verified":
                violations.append(f"{a['asset_id']}: retired but parity unverified")
            if a["runtime_status"] != "pass":
                violations.append(f"{a['asset_id']}: retired but runtime not pass")
            if a["consumer_status"] != "migrated":
                violations.append(f"{a['asset_id']}: retired but consumers not migrated")
    ok = len(violations) == 0
    detail = f"{len(violations)} premature retirements" if violations else "no premature retirements"
    return ok, detail


@rule("P4F-008", "Derived activation status")
def check_p4f_008(data):
    """activation_status is derived: activated requires parity+runtime+shell all pass."""
    violations = []
    for a in data["assets"]:
        derived = derive_activation_status(a)
        if derived == "INVALID":
            violations.append(
                f"{a['asset_id']}: claims activated but "
                f"parity={a['parity_status']}, runtime={a['runtime_status']}, "
                f"shell={a['shell_status']}"
            )
    ok = len(violations) == 0
    detail = f"{len(violations)} invalid activations" if violations else "all activations properly derived"
    return ok, detail


@rule("P4F-009", "Consumer and route proof for activated assets")
def check_p4f_009(data):
    """Activated assets must have consumer_status=migrated and non-empty route_proof."""
    activated = [a for a in data["assets"] if a["activation_status"] == "activated"]
    if not activated:
        return True, "no activated assets — vacuously true"

    violations = []
    for a in activated:
        if a.get("consumer_status") != "migrated":
            violations.append(f"{a['asset_id']}: consumer_status={a.get('consumer_status')}")
        if not a.get("route_proof"):
            violations.append(f"{a['asset_id']}: empty route_proof")

    ok = len(violations) == 0
    detail = f"{len(violations)} proof gaps" if violations else "all activated assets have proof"
    return ok, detail


def main():
    data = load_ledger()

    print(f"Phase 4F Activation Ledger Validator")
    print(f"Ledger:  {LEDGER}")
    print(f"Assets:  {len(data['assets'])}")
    print("=" * 60)

    rules = [
        check_p4f_001, check_p4f_002, check_p4f_003,
        check_p4f_004, check_p4f_005, check_p4f_006,
        check_p4f_007, check_p4f_008, check_p4f_009,
    ]

    all_pass = True
    for r in rules:
        ok, detail = r(data)
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_pass = False
        print(f"  {r._rule_name} [{status}] {r._rule_desc}")
        print(f"         {detail}")

    print("=" * 60)

    # Summaries
    assets = data["assets"]

    print("\n--- By Wave ---")
    from collections import Counter
    for w in ["1A", "1B", "1C", "1D", "4E"]:
        c = sum(1 for a in assets if a["wave"] == w)
        print(f"  {w}: {c} assets")

    print("\n--- By Suite Owner ---")
    for s in ["Forge", "Dais", "Dossier", "Atlas", "Canon", "OS"]:
        c = sum(1 for a in assets if a["suite_owner"] == s)
        print(f"  {s}: {c} assets")

    print("\n--- By Activation Status ---")
    for s in sorted(VALID_ACTIVATION):
        c = sum(1 for a in assets if a["activation_status"] == s)
        print(f"  {s}: {c} assets")

    print("\n--- By Deprecation Status ---")
    for s in sorted(VALID_DEPRECATION):
        c = sum(1 for a in assets if a["deprecation_status"] == s)
        print(f"  {s}: {c} assets")

    print("\n--- By Parity Status ---")
    for s in sorted(VALID_PARITY):
        c = sum(1 for a in assets if a["parity_status"] == s)
        print(f"  {s}: {c} assets")

    print("=" * 60)
    result = "ALL 9 RULES PASSED" if all_pass else "SOME RULES FAILED"
    print(f"RESULT: {result}")

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
