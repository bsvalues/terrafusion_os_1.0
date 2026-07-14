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
| [`.governance/mao-002-pilot-merge-authority.json`](../../.governance/mao-002-pilot-merge-authority.json) | Inactive MAO-002 ceiling and split owner/operator state contract |
| [`verify-mao-002-pilot-authority.py`](../../scripts/ci/verify-mao-002-pilot-authority.py) | Split-envelope exact-PR/SHA/scope/reservation interlock inside required `governed-spine` |

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

The pilot check is part of the already-required `governed-spine` context; it is not advisory. The
checked-in policy remains inactive and defines the maximum grant. `MAO_002_PILOT_BOOTSTRAP_JSON`
contains the one-time owner envelope: operator and assurance identities, repository/path/risk ceilings,
maximum two merges, expiry, and suspension. `MAO_002_PILOT_EXECUTION_JSON` contains Codex-maintained
PR numbers, exact current heads, disjoint path scopes, reservation IDs, implementation operators,
assurance evidence, and revision. The execution record binds to the exact bootstrap digest; the
bootstrap binds to the checked-in policy digest.

For a registered pilot PR, the required check fails closed on:

- either split variable missing, malformed, suspended, expired, or digest-mismatched;
- bootstrap-policy SHA mismatch;
- current-head mismatch after a review fix or branch update;
- repository mismatch;
- scope or risk outside the owner envelope, including either side of a renamed path;
- missing or obviously overlapping pilot reservations;
- missing or malformed suspension state;
- missing implementation operators, duplicate normalized operator identities, or a normalized reviewer
  identity matching William or either operator;
- operator fields in the owner envelope, owner fields in execution state, or anything other than two
  unique PR slots.

The exact two-slot execution record and owner expiry prevent grant reuse. Review-fix or branch-update
SHAs require a Codex execution-state revision and required-check rerun, not owner action or a branch
commit. MAO-001A rejects obvious overlap inside the two pilot slots; portfolio-wide mechanical
reservation enforcement remains MAO-003 scope.

### Non-self-referential activation sequence

1. The owner authorizes the pilot envelope once in ordinary decision form. Codex serializes it into
   `MAO_002_PILOT_BOOTSTRAP_JSON`; William does not supply PR numbers, SHAs, dates, or JSON.
2. Codex selects two eligible disjoint WOs, creates their worktrees/PRs, and publishes exact mutable
   state in `MAO_002_PILOT_EXECUTION_JSON` with the bootstrap digest.
3. The pilot PRs use `codex/mao-002-*` branches and the `mao-002-pilot` label. `governed-spine`
   validates both records, current GitHub heads, both sides of renames, and envelope ceilings.
4. After every remediation or branch update, Codex increments the execution revision, refreshes the
   current SHA, updates the variable, and reruns the required job. The owner envelope is unchanged.
5. Claude assurance posts exact-head verdicts directly. Codex consumes them and records the assurance
   evidence path in execution state.
6. A suspension trigger sets operator execution suspension immediately; owner-envelope suspension or
   restoration remains a true authority action. No force operation or direct `main` write is used.

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
