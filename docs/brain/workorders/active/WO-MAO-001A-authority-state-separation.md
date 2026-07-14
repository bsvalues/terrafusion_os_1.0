# WO-MAO-001A - Separate Owner Bootstrap Authority from Operator Execution State

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `b936904b76a1593d12e524434e94872f2e9a78fe`
**Risk:** `R5` bounded governance amendment
**Merge mode:** `A`
**Status:** Active

## Problem

MAO-001 combined stable owner authority and changing pilot execution details in
`MAO_002_PILOT_AUTHORITY_JSON`. That made William responsible for PR numbers, exact heads, scopes,
review identities, expiry serialization, and every remediation refresh. The model was fail-closed but
still made the owner an execution-state operator.

## Objective

Split the contract so the owner grants a bounded pilot envelope once and Codex maintains all changing
execution state inside it. Do not launch MAO-002 in this Work Order.

## Completion Contract

After one owner bootstrap grant:

1. Codex selects two eligible, dependency-cleared, disjoint pilot WOs.
2. Codex creates isolated worktrees, branches, and PRs.
3. Codex records and refreshes PR numbers, exact heads, path scopes, risk classes, reservations,
   implementation operators, and assurance evidence.
4. Claude assurance reviews exact heads and posts verdicts directly.
5. The required gate rejects execution state outside the owner envelope.
6. William does not maintain PR numbers, SHAs, repository variables, JSON, prompts, or routing.

## Authority Records

- Checked-in ceiling: `.governance/mao-002-pilot-merge-authority.json`
- One-time owner envelope: `MAO_002_PILOT_BOOTSTRAP_JSON`
- Codex-maintained state: `MAO_002_PILOT_EXECUTION_JSON`
- Correction authorization: `OWNER-MAO-001A-AUTHORITY-STATE-SEPARATION`

The bootstrap envelope owns operator/assurance identity, repository and path ceilings, risk ceiling,
merge count, expiry, and suspension. It must not contain PR or remediation state. The execution record
owns PRs, current heads, scopes, reservations, revision, operators, and assurance evidence. It cannot
broaden owner fields.

## Authorized Files

- `.governance/owner-decisions.json`
- `.governance/mao-002-pilot-merge-authority.json`
- `.github/workflows/core-governance-gates.yml`
- `scripts/ci/verify-mao-002-pilot-authority.py`
- `scripts/ci/__tests__/mao-002-pilot-authority.test.py`
- the exact MAO authority, program, canon, queue, CI-index, and WO-MAO-001A evidence documents listed
  in the owner decision

## Blocked

- launching or selecting the two MAO-002 pilot WOs;
- setting either live repository variable;
- general operator merge or portfolio-wide R5 authority;
- runtime, backend, frontend, package, lockfile, deployment, county, PACS, SQL, credential, or secret
  changes;
- bypassing required checks or Mode A merge authority for this correction.

## Validation

- `python scripts/ci/__tests__/mao-002-pilot-authority.test.py`
- `python -m py_compile scripts/ci/verify-mao-002-pilot-authority.py`
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `corepack pnpm run type-check`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- required remote checks and zero unresolved review threads

## Routing

`WO-MAO-002` becomes next only after WO-MAO-001A merges. Pilot activation then requires one owner
bootstrap decision. Codex translates that decision into the bootstrap variable and owns all subsequent
execution-state changes.

STOP_TYPE: MAO_AUTHORITY_STATE_SEPARATION_READY_FOR_VALIDATION
