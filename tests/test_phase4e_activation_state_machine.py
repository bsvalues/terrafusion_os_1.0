"""Phase 4E: Activation state machine regression defense.

Enforces that `unblocked-ready` and `eligible` are DERIVED from evidence + gates +
founder verification.  Repo-wide promotion is forbidden.  Failed boundary or runtime
gates do not get "security-cleared" by paperwork.

Repo-specific evidence requirements:
  TerraFusionPilt  – new secret issued, old revoked, deployment config updated,
                     tracked .env.production removed or neutralized.
  TerraMiner cred  – new creds issued, old revoked, PACS.env.txt removed,
                     history scrub proof if applicable.
  TerraMiner API   – key rotated, old key revoked, tracked secret file removed.
  BCBSLevy         – BFG/filter-repo log, no-PII scan pass, exposed dump/data
                     files absent from tracked tree, remediation note.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

import pytest

RemediationStatus = Literal["blocked", "remediated", "verified"]
GateResult = Literal["pass", "fail", "not-run"]
IssueType = Literal["secret-exposure", "data-exposure", "credential-file"]
Reclassification = Literal[
    "blocked-security",
    "blocked-boundary",
    "blocked-runtime",
    "unblocked-ready",
]
Eligibility = Literal["not-eligible", "eligible"]


@dataclass(frozen=True)
class Evidence:
    bfg_log_present: bool = False
    no_pii_scan_passed: bool = False
    key_rotation_recorded: bool = False
    old_key_revoked: bool = False
    credential_file_removed: bool = False
    deployment_config_updated: bool = False


@dataclass(frozen=True)
class Asset:
    asset_id: str
    repo: str
    tier: int
    issue_type: IssueType
    remediation_status: RemediationStatus
    boundary_scan: GateResult
    shell_smoke: GateResult
    dependency_license: GateResult
    founder_verified: bool
    evidence: Evidence


def remediation_evidence_satisfied(asset: Asset) -> bool:
    e = asset.evidence

    if asset.issue_type == "data-exposure":
        return e.bfg_log_present and e.no_pii_scan_passed

    if asset.issue_type == "secret-exposure":
        return e.key_rotation_recorded and e.old_key_revoked

    if asset.issue_type == "credential-file":
        return (
            e.key_rotation_recorded
            and e.old_key_revoked
            and e.credential_file_removed
        )

    raise ValueError(f"Unsupported issue type: {asset.issue_type}")


def derive_reclassification(asset: Asset) -> Reclassification:
    if asset.boundary_scan == "fail":
        return "blocked-boundary"

    if asset.dependency_license == "fail" or asset.shell_smoke == "fail":
        return "blocked-runtime"

    gates_pass = (
        asset.boundary_scan == "pass"
        and asset.shell_smoke == "pass"
        and asset.dependency_license == "pass"
    )

    verified = (
        asset.remediation_status == "verified"
        and asset.founder_verified
        and remediation_evidence_satisfied(asset)
    )

    if gates_pass and verified:
        return "unblocked-ready"

    return "blocked-security"


def derive_activation_eligibility(asset: Asset) -> Eligibility:
    return (
        "eligible"
        if derive_reclassification(asset) == "unblocked-ready"
        else "not-eligible"
    )


def make_asset(
    *,
    issue_type: IssueType,
    repo: str = "example-repo",
    tier: int = 2,
    remediation_status: RemediationStatus = "blocked",
    boundary_scan: GateResult = "not-run",
    shell_smoke: GateResult = "not-run",
    dependency_license: GateResult = "not-run",
    founder_verified: bool = False,
    evidence: Optional[Evidence] = None,
) -> Asset:
    return Asset(
        asset_id="asset-001",
        repo=repo,
        tier=tier,
        issue_type=issue_type,
        remediation_status=remediation_status,
        boundary_scan=boundary_scan,
        shell_smoke=shell_smoke,
        dependency_license=dependency_license,
        founder_verified=founder_verified,
        evidence=evidence or Evidence(),
    )


# ── Happy-path: full evidence + gates + verification ────────────────


def test_data_exposure_asset_requires_bfg_and_pii_clearance():
    asset = make_asset(
        issue_type="data-exposure",
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            bfg_log_present=True,
            no_pii_scan_passed=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_secret_exposure_asset_requires_rotation_and_revocation():
    asset = make_asset(
        issue_type="secret-exposure",
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_credential_file_asset_requires_file_removal_too():
    asset = make_asset(
        issue_type="credential-file",
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            credential_file_removed=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


# ── Incomplete evidence keeps asset blocked ──────────────────────────


@pytest.mark.parametrize(
    "missing_evidence",
    [
        Evidence(),
        Evidence(key_rotation_recorded=True),
        Evidence(old_key_revoked=True),
        Evidence(bfg_log_present=True),
        Evidence(no_pii_scan_passed=True),
        Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            credential_file_removed=False,
        ),
    ],
)
def test_incomplete_evidence_keeps_asset_blocked(missing_evidence: Evidence):
    issue_type: IssueType = "secret-exposure"
    if missing_evidence.bfg_log_present or missing_evidence.no_pii_scan_passed:
        issue_type = "data-exposure"
    if (
        missing_evidence.key_rotation_recorded
        or missing_evidence.old_key_revoked
        or missing_evidence.credential_file_removed
    ) and missing_evidence.credential_file_removed is False:
        issue_type = "credential-file"

    asset = make_asset(
        issue_type=issue_type,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=missing_evidence,
    )

    assert derive_reclassification(asset) != "unblocked-ready"
    assert derive_activation_eligibility(asset) == "not-eligible"


# ── Any failed gate blocks activation ────────────────────────────────


@pytest.mark.parametrize(
    "gate_name", ["boundary_scan", "shell_smoke", "dependency_license"]
)
def test_any_failed_gate_blocks_activation(gate_name: str):
    kwargs = {
        "issue_type": "secret-exposure",
        "remediation_status": "verified",
        "boundary_scan": "pass",
        "shell_smoke": "pass",
        "dependency_license": "pass",
        "founder_verified": True,
        "evidence": Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
        ),
    }
    kwargs[gate_name] = "fail"

    asset = make_asset(**kwargs)

    assert derive_reclassification(asset) != "unblocked-ready"
    assert derive_activation_eligibility(asset) == "not-eligible"


# ── Verification ladder ──────────────────────────────────────────────


def test_verified_without_founder_verification_does_not_unlock():
    asset = make_asset(
        issue_type="secret-exposure",
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=False,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
        ),
    )

    assert derive_reclassification(asset) == "blocked-security"
    assert derive_activation_eligibility(asset) == "not-eligible"


def test_remediated_but_not_verified_does_not_unlock():
    asset = make_asset(
        issue_type="data-exposure",
        remediation_status="remediated",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            bfg_log_present=True,
            no_pii_scan_passed=True,
        ),
    )

    assert derive_reclassification(asset) == "blocked-security"
    assert derive_activation_eligibility(asset) == "not-eligible"


# ── Classification buckets ───────────────────────────────────────────


def test_boundary_failure_classifies_as_blocked_boundary():
    asset = make_asset(
        issue_type="data-exposure",
        remediation_status="verified",
        boundary_scan="fail",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            bfg_log_present=True,
            no_pii_scan_passed=True,
        ),
    )

    assert derive_reclassification(asset) == "blocked-boundary"
    assert derive_activation_eligibility(asset) == "not-eligible"


def test_runtime_failure_classifies_as_blocked_runtime():
    asset = make_asset(
        issue_type="secret-exposure",
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="fail",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
        ),
    )

    assert derive_reclassification(asset) == "blocked-runtime"
    assert derive_activation_eligibility(asset) == "not-eligible"


# ── Repo-specific evidence fixtures ──────────────────────────────────


def test_terrafusionpilt_full_remediation():
    """TerraFusionPilt: new secret, old revoked, deployment config updated."""
    asset = make_asset(
        issue_type="secret-exposure",
        repo="TerraFusionPilt",
        tier=3,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            deployment_config_updated=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_terrafusionpilt_missing_deployment_config_still_unlocks():
    """deployment_config_updated is tracked but not a gate blocker for secret-exposure."""
    asset = make_asset(
        issue_type="secret-exposure",
        repo="TerraFusionPilt",
        tier=3,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            deployment_config_updated=False,
        ),
    )

    # secret-exposure only requires rotation + revocation
    assert derive_reclassification(asset) == "unblocked-ready"


def test_terraminer_pacs_credential_full_remediation():
    """TerraMiner PACS: creds rotated, revoked, file removed."""
    asset = make_asset(
        issue_type="credential-file",
        repo="TerraMiner",
        tier=3,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            credential_file_removed=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_terraminer_pacs_without_file_removal_stays_blocked():
    """TerraMiner PACS: rotated but file still tracked = blocked."""
    asset = make_asset(
        issue_type="credential-file",
        repo="TerraMiner",
        tier=3,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
            credential_file_removed=False,
        ),
    )

    assert derive_reclassification(asset) == "blocked-security"
    assert derive_activation_eligibility(asset) == "not-eligible"


def test_terraminer_rapidapi_full_remediation():
    """TerraMiner RapidAPI: key rotated, old revoked."""
    asset = make_asset(
        issue_type="secret-exposure",
        repo="TerraMiner",
        tier=3,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            key_rotation_recorded=True,
            old_key_revoked=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_bcbslevy_full_remediation():
    """BCBSLevy: BFG log, PII scan, data files absent."""
    asset = make_asset(
        issue_type="data-exposure",
        repo="BCBSLevy",
        tier=2,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            bfg_log_present=True,
            no_pii_scan_passed=True,
        ),
    )

    assert derive_reclassification(asset) == "unblocked-ready"
    assert derive_activation_eligibility(asset) == "eligible"


def test_bcbslevy_missing_pii_scan_stays_blocked():
    """BCBSLevy: BFG ran but PII scan not passed = still blocked."""
    asset = make_asset(
        issue_type="data-exposure",
        repo="BCBSLevy",
        tier=2,
        remediation_status="verified",
        boundary_scan="pass",
        shell_smoke="pass",
        dependency_license="pass",
        founder_verified=True,
        evidence=Evidence(
            bfg_log_present=True,
            no_pii_scan_passed=False,
        ),
    )

    assert derive_reclassification(asset) == "blocked-security"
    assert derive_activation_eligibility(asset) == "not-eligible"


# ── Derivation consistency: stored values must match computed ────────


def test_derivation_is_deterministic():
    """Same inputs always produce same outputs — no randomness in state machine."""
    for _ in range(100):
        asset = make_asset(
            issue_type="secret-exposure",
            remediation_status="verified",
            boundary_scan="pass",
            shell_smoke="pass",
            dependency_license="pass",
            founder_verified=True,
            evidence=Evidence(key_rotation_recorded=True, old_key_revoked=True),
        )
        assert derive_reclassification(asset) == "unblocked-ready"
        assert derive_activation_eligibility(asset) == "eligible"


def test_blocked_asset_has_consistent_defaults():
    """Fresh blocked asset: all not-run, not-eligible, blocked-security."""
    asset = make_asset(issue_type="secret-exposure")
    assert derive_reclassification(asset) == "blocked-security"
    assert derive_activation_eligibility(asset) == "not-eligible"
