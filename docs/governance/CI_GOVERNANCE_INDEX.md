# TerraFusion CI Governance Index


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
**Version:** 2.0
**Last Updated:** 2026-07-13
**Authority:** `docs/brain/workorders/CANON_INDEX.md`, `.governance/main.protection.json`, and live GitHub branch protection

## Current Required Posture

| Invariant | Canonical value |
|-----------|-----------------|
| Require pull request | `true` |
| Require up-to-date status checks | `true` |
| Required checks | `governed-spine`, `phase85-tools`, `phase86-toolrunner`, `🔒 TerraFusion Seal Gate`, `🧪 Tier-1 UI Harness Validation` |
| Required approving reviews | `0` |
| Include administrators | `true` |
| Conversation resolution | `true` |
| Allow force push | `false` |
| Allow deletion | `false` |

The earlier `v1.4.0-ci-stable` "SEAL only" posture is historical and is not the current branch
protection canon.

## Canonical Files

| File | Purpose |
|------|---------|
| [`.governance/main.protection.json`](../../.governance/main.protection.json) | Normalized machine-readable protection invariants |
| [`AGENTS.md`](../../AGENTS.md) | Human-readable branch-protection and governance-outage doctrine |
| [`core-governance-gates.yml`](../../.github/workflows/core-governance-gates.yml) | Required governed-spine, phase85, and phase86 contexts |
| [`verify-branch-protection-against-canon.sh`](../../scripts/ci/verify-branch-protection-against-canon.sh) | Compares live protection with every claimed canon field |
| [`verify-agents-doc-against-protection-canon.sh`](../../scripts/ci/verify-agents-doc-against-protection-canon.sh) | Detects prose/canon invariant drift |
| [`.governance/mao-002-pilot-merge-authority.json`](../../.governance/mao-002-pilot-merge-authority.json) | Inactive MAO-002 policy and external-activation contract |
| [`verify-mao-002-pilot-authority.py`](../../scripts/ci/verify-mao-002-pilot-authority.py) | Pilot exact-PR/SHA/scope/suspension interlock inside required `governed-spine` |

## API Normalization

GitHub's branch-protection response does not contain a literal `require_pull_request` boolean. The
drift verifier derives it from the presence of `required_pull_request_reviews`. All other values map
directly to their live API fields:

- `required_status_checks.strict`
- `required_status_checks.contexts` and `checks[].context`
- `required_pull_request_reviews.required_approving_review_count`
- `enforce_admins.enabled`
- `required_conversation_resolution.enabled`
- `allow_force_pushes.enabled`
- `allow_deletions.enabled`

No unsupported invariant is claimed as drift-detectable.

## MAO-002 Pilot Interlock

The pilot check is part of the already-required `governed-spine` context; it is not an advisory new
status. The checked-in policy is `inactive` during MAO-001. A later activation uses the visible
GitHub Actions repository variable `MAO_002_PILOT_AUTHORITY_JSON` to register exactly two PRs, exact
final head SHAs, disjoint allowed paths, two implementation operators, a separate read-only reviewer,
post-merge assurance evidence, expiry, and the SHA-256 of the checked-in policy. The external manifest
does not modify `main` or either pilot branch, so exact head binding remains compatible with strict
up-to-date protection.

For a registered pilot PR, the required check fails closed on:

- missing, inactive, suspended, or expired external authority for a pilot branch/label;
- activation-policy SHA mismatch;
- final-SHA mismatch after a review fix or branch update;
- repository mismatch;
- scope outside the registered path set;
- missing implementation operators or a reviewer who is William or either operator;
- an authority record with anything other than two unique PR slots.

The exact two-slot manifest and expiry prevent grant reuse. Review-fix or branch-update SHAs require
an external manifest update and required-check rerun, not a branch commit. Reservation collision
enforcement remains MAO-003 scope and is not claimed by this pilot interlock.

### Non-self-referential activation sequence

1. Create the two pilot PRs on `codex/mao-002-*` branches and apply the `mao-002-pilot` label. The
   inactive policy makes `governed-spine` fail closed at this point.
2. After review remediation settles both final heads, create a full activation manifest containing the
   two exact PR numbers, repositories, head SHAs, path scopes, two unique implementation operators,
   independent reviewer, evidence path, suspension state, and expiry.
3. Set `policy_sha256` to the SHA-256 of the checked-in inactive policy and publish the manifest in the
   visible repository variable `MAO_002_PILOT_AUTHORITY_JSON` under the recorded owner authority.
4. Rerun the failed `governed-spine` jobs. The check logs both the activation-manifest and policy
   digests and validates the unchanged pilot heads. No commit, base update, or force operation is
   created by activation.
5. Any later branch update or review-fix commit invalidates the registered head. Update the external
   manifest and rerun the required job for that new exact SHA.
6. Suspension sets the external manifest status to `suspended`, cancels any queued auto-merge, and
   reruns the required job so the affected pilot checks fail closed.

## Verification

```bash
bash scripts/ci/__tests__/governance-canon-scripts.test.sh
python scripts/ci/__tests__/mao-002-pilot-authority.test.py
bash scripts/ci/verify-agents-doc-against-protection-canon.sh

# Requires repository/token access and compares current live protection.
TF_REPO=bsvalues/terrafusion_os_1.0 \
GH_TOKEN="$GH_TOKEN" \
bash scripts/ci/verify-branch-protection-against-canon.sh
```

Any mismatch is a governance incident. Do not weaken or bypass a required check to preserve flow.
