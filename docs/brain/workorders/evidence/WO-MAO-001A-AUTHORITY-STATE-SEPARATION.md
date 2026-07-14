# WO-MAO-001A Authority-State Separation Evidence

**Base:** `b936904b76a1593d12e524434e94872f2e9a78fe`
**Program:** `PROGRAM-MAO-001`
**Status:** Local validation complete; PR pending

## Verdict

The combined `MAO_002_PILOT_AUTHORITY_JSON` contract is superseded. It mixed immutable owner authority
with mutable execution data and therefore kept William in the pilot dispatch loop. The replacement is
a two-record contract enforced by the existing required `governed-spine` context.

## Responsibility Separation

| State | Record | Maintainer | Changes when |
|-------|--------|------------|--------------|
| Checked-in policy ceiling | `.governance/mao-002-pilot-merge-authority.json` | normal Mode A governance PR | policy changes |
| Owner bootstrap envelope | `MAO_002_PILOT_BOOTSTRAP_JSON` | Codex serializes one explicit owner grant | grant, suspension, restoration, or expiry changes |
| Operator execution state | `MAO_002_PILOT_EXECUTION_JSON` | Codex portfolio operator | dispatch, PR creation, head change, remediation, reservation, or assurance update |
| Exact-head verdict | GitHub PR review plus evidence path | Claude assurance | each reviewed head changes |

William supplies authority, not variable syntax. Codex supplies the JSON and keeps execution state
current. A head change invalidates only the execution record; it does not require another owner grant.

## Mechanical Invariants

The verifier now requires:

- both split records or neither;
- bootstrap-to-policy and execution-to-bootstrap SHA-256 binding;
- immutable owner/operator/assurance identities;
- repository, path, risk, merge-count, expiry, and suspension ceilings;
- exactly two unique pilot PR slots;
- exact lowercase 40-character current head SHAs;
- reservation identifiers and no obvious cross-slot path-prefix overlap;
- two unique implementation operators and a separate assurance identity;
- both destination and source paths of renames inside scope;
- no owner fields in execution state and no execution fields in the owner envelope;
- fail-closed behavior for pilot branches while inactive.

## Focused Proof

The focused suite covers initial activation, missing split records, owner and operator suspension,
policy/bootstrap binding, mutable PR and head refresh without bootstrap changes, path/risk/repository
ceilings, identity separation, reservation presence and overlap, rename handling, scope drift, and
unregistered PR overlap.

## Intentional Non-Claims

- This Work Order does not activate MAO-002.
- It does not set live repository variables.
- It does not prove portfolio-wide reservation enforcement; MAO-003 owns that red-team proof.
- It does not grant production, deployment, county, PACS, SQL, credential, secret, or runtime access.
- It does not make operator merge portfolio-wide.

## Validation Results

| Validation | Result |
|------------|--------|
| Frozen bootstrap with manifest/lock hashes before and after | PASS; no tracked mutation |
| `python scripts/ci/__tests__/mao-002-pilot-authority.test.py` | PASS; 29 cases |
| Python compile | PASS |
| Governance canon script tests through Git Bash | PASS |
| AGENTS/protection-canon verification | PASS |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS |
| Prettier on changed JSON, YAML, and Markdown | PASS |
| Workflow YAML parse | PASS |
| `corepack pnpm run type-check` | PASS |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS; 56 tests |
| Live MAO-002 repository variables | NONE; pilot remains inactive |
| `corepack pnpm canon:gatefast` before commit | Expected HOLD on `repo clean`; type-check, phase83, and naming sub-gates PASS |

Remote PR checks and exact-head review remain pending until the branch is published.

STOP_TYPE: MAO_AUTHORITY_STATE_SEPARATION_READY_FOR_PR
