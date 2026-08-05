# WO-SR-008I - Forge Canonical Consumer Completion

## Status

`COMPLETE - AUTHORITY CONSUMED`

## Program

Five-Suite Federated Repository Buildout

## Goal, loop, risk, and authority

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Risk: `R4` bounded non-production runtime adoption
- Exact base: `bf5c66fe335cdd0b4d738671975ff8ff67261948`
- Authority: `OWNER-SR-008I-R4-FORGE-CONSUMER-COMPLETION-20260804`
- Decision artifact: Issue #1406

## Human and product outcome

Prove one authenticated, county-scoped, non-production Forge cost-consumer path from explicit
parcel/year assertions through the unchanged E1 schedule projection and the locally staged canonical
Forge valuation kernel. The path preserves decimal truth, identity, authorization, trace, provenance,
and fail-closed behavior. Stage 3 may run it only in default-disabled Shadow mode and must return the
existing DB-backed Forge response unchanged.

This Work Order does not claim a complete live parcel journey or authorize a live response switch.

## Staged sequence

1. **Stage 1 - Pure boundary assembly.** Create the pure consumer projection, exact decimal/double
   edge, deterministic fact hash, response validation, and focused synthetic proof.
2. **Stage 2 - Host, trace, and county-scoped consumer.** Harden the process host and implement the
   authenticated, permission-checked, county-scoped consumer over synthetic/in-memory dependencies.
3. **Stage 3 - Reversible shadow adoption.** Add `Disabled` and `Shadow` modes, keep `Disabled` as
   code default, invoke only after existing county/permission checks, and preserve the legacy response.
4. **Terminal closeout.** Bind all merged heads and evidence, mark the authority completed/consumed,
   and return to portfolio reconciliation.

Each stage starts only after its predecessor is verified on `origin/main`. The authority covers
routine branch, commit, PR, review remediation, exact-head assurance, eligible Mode B merge, and
post-merge verification without another owner relay.

## Completion ledger

| Step | Exact reviewed head | Merge |
| --- | --- | --- |
| Authority activation - PR #1407 | `d6d770e09f89937d48318ce3e82141223e3f51b0` | `29cafdb0312f95f1c7c11cc4405499e9d6819382` |
| Stage 1 - PR #1408 | `335ee2ea7a2b8cb0b0a1314f2a5544cc3eec6aa5` | `164c05c82f4151add89eb802bdac03e7cb68a982` |
| Stage 2 - PR #1409 | `8ae80087ef4eea81cc1f7980122b56c40dce20fb` | `a441783706f726eb00bac3e08de88656eb2ad9cf` |
| Stage 3 - PR #1410 | `40c21bc4a5ada9db1d8c53c0eef20d2fb9a7d4e7` | `37a3e469cfb63273d39c6706837ad5ea0b1b7690` |

All four PRs merged with required checks satisfied. Stage assurance passed at each exact
implementation head, substantive review threads were resolved before merge, and the bounded R4
authority is completed and consumed by this closeout.

## Exact scope

The canonical exact product and governance file allowlists are the `authorized_files` array for this
decision in `.governance/owner-decisions.json`. No file outside that list may change.

The completed E1 files are deliberately absent from the allowlist and must remain unchanged.

## Invariants

- E1 remains the sole schedule-resolution source and is not modified.
- Checked decimal arithmetic remains authoritative before the kernel DTO edge.
- Decimal-to-double conversion must round-trip exactly or fail closed.
- No quality, condition, location, land-schedule, obsolescence, or arbitrary modifier is invented.
- Caller authentication, permission, county, parcel, year, and correlation identity fail closed.
- Process input and output are bounded; cancellation and timeout remain distinct typed failures.
- Raw process output and protected parcel content are never logged.
- Locally staged manifest and binary provenance are verified before execution.
- The existing DB-backed response remains authoritative in both `Disabled` and `Shadow` modes.
- Validation is synthetic/in-memory only and is not live county or production proof.

## Validation

- focused pure projection tests;
- focused client, host, consumer, controller, and boundary tests for their respective stages;
- backend Release build with 0 warnings and 0 errors;
- Work Order query and planner tests;
- exact changed-path, blocked-path, package/lockfile, secret, and diff checks;
- remote required checks, zero unresolved substantive threads, and exact-head assurance.

## Rollback

Default mode is `Disabled`. Revert stage PRs in reverse order. No data, schema, deployment,
credential, external artifact, or production state is created by this Work Order.

## Stop walls

Stop only for a required out-of-scope file; E1/hash change; new valuation methodology; schema or
persistence mutation; live county/PACS/SQL, credential, secret, deployment, or production access;
standalone Forge or cost-kernel change; frontend or canonical response switch; OS network sandbox;
gate bypass; force push; destructive cleanup; or conflicting authority.

## Terminal condition

`FORGE_CANONICAL_CONSUMER_SHADOW_ADOPTION_PROVEN_NO_LIVE_CUTOVER`

Satisfied. The Five-Suite program returns to portfolio reconciliation; no successor implementation,
live cutover, protected-resource, deployment, or production authority follows from this closeout.
