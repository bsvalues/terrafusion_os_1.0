# Stop Wall Register (Canonical)


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
**Version:** 2.0
**Date:** 2026-07-01
**Authority:** WO-WOE-011
**Classification:** Operator Doctrine — canonical authority-wall list
**Supersedes:** `goal-loop/STOP_WALLS.md` (WO-WOE-010, SW-01..SW-09). See §Reconciliation.

---

## Purpose

A **stop wall** is a presently unresolved authority boundary that requires new owner authority.
**Reaching a stop wall is correct behavior, not a failure** — the operator surfaces the wall with
evidence and waits. Work already covered by a recorded authority grant is not a wall; authorized,
unblocked work continues automatically (see
[GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md)).

**The human is the authority wall, not the dispatcher.** The operator does not ask "what next?" for
authorized unblocked work; it only stops when new authority is required.

---

## The Ten Walls

| Wall | Name | Trigger |
|------|------|---------|
| **SW-01** | Deployment / cloud resource / public reachability | Create/modify cloud resources, deploy, or make a surface publicly reachable |
| **SW-02** | Data mutation / delete / cleanup / migration | Any write/update/delete/truncate/reload/migration or destructive cleanup beyond an exact recorded authorization |
| **SW-03** | Secrets / credentials | Read, write, rotate, or inject secrets, keys, JWT/HMAC signers, DB passwords, Key Vault |
| **SW-04** | Production launch / county go-live / public release | Promote to production, enable a county, widen public release |
| **SW-05** | Conflicting canon / unclear authority | Two authoritative docs contradict and cannot be resolved by reading them |
| **SW-06** | Failed gate outside current WO scope | A CI/test/gate failure not caused by, and not fixable within, the current WO |
| **SW-07** | Branch / merge strategy conflict | Correct branch target / merge method / rebase cannot be determined from evidence |
| **SW-08** | New external service integration | Wiring a new external system not in the current WO's allowed-systems list |
| **SW-09** | Runtime behavior expansion | Alter observable API behavior, response contracts, or startup outside the current WO |
| **SW-10** | Security / auth policy change | Change auth, authorization, RBAC, CORS posture, or security policy |

---

## Wall Details

### SW-01 — Deployment / cloud resource / public reachability
Blocked: Azure App Service create/deploy/config, container push to a live registry, DNS/routing
cutover, making a route publicly reachable, provisioning any cloud resource.
Reached → `STOP_TYPE: AUTHORITY_WALL`, `WALL: SW-01`. Name the resource + program.

### SW-02 — Data mutation / delete / cleanup / migration
Blocked: DELETE/UPDATE/UPSERT/TRUNCATE against any `canonical_tf.*` or county data, DB reload/ETL
re-run, schema migration beyond a migration the active WO explicitly authorizes, PACS writes.
Reached → `WALL: SW-02`. State the exact mutation, table, estimated row count, reversibility.
**Standing example:** WO-DATA-BENTON-DUPE-001B (delete 30 rows) is parked here.

### SW-03 — Secrets / credentials
Blocked: writing secrets to files/PRs/logs, rotating/regenerating credentials, injecting secrets
into App Service / Key Vault, committing `.env` or `appsettings.*.local.json` with real values.
Reached → `WALL: SW-03`. **Never** include credential values in output.

### SW-04 — Production launch / county go-live / public release
Blocked: promoting a demo to production, enabling a county for real use, widening a public release
beyond an authorized demo scope.
Reached → `WALL: SW-04`. Distinguish from SW-01 (SW-01 = provisioning/deploy plumbing; SW-04 = the
go-live decision itself).

### SW-05 — Conflicting canon / unclear authority
Blocked: proceeding when two authoritative documents (Constitution, CLAUDE.md, AI_CANON_MAP_V1,
domain pack, active WO) contradict and reading them does not resolve it.
Reached → `STOP_TYPE: CANONICAL_CONFLICT`. Cite both sources and the exact contradiction; do not
pick a resolution autonomously.

### SW-06 — Failed gate outside current WO scope
Blocked: a CI check / test / gate failure not caused by the current WO's changes and not fixable
within its sovereignty boundary.
Reached → `STOP_TYPE: FAILED_GATE`. Identify the failing check, last passing commit, whether it
predates this WO. (In-scope failures caused by this WO are `/loop recovery` work, not a wall.)

### SW-07 — Branch / merge strategy conflict
Blocked: force-push to a shared branch, rebase rewriting commits already in review, merge-method
ambiguity, branch deletion other WOs may depend on.
Reached → `WALL: SW-07`. Describe the conflict and the candidate resolutions.

### SW-08 — New external service integration
Blocked: wiring a new API/DB/service-bus/storage account not in the current WO's allowed list.
Reached → `WALL: SW-08`. Name the proposed integration and its program.

### SW-09 — Runtime behavior expansion
Blocked: new API endpoint not in the current WO, changing an existing response shape, modifying
startup sequence, adding/removing health checks — anything that expands observable runtime behavior.
Reached → `WALL: SW-09`. Propose a new WO scope covering the change.

### SW-10 — Security / auth policy change
Blocked: changing authentication, authorization, RBAC, CORS allow-lists, rate-limiting posture, or
any security policy.
Reached → `WALL: SW-10`. Name the policy and the intended change; wait for authorization.

---

## What Is NOT a Stop Wall (the loop proceeds through these)

- Pre-commit lint / prettier failures → fix and re-commit
- Stale `index.lock` → remove and retry
- Non-fast-forward push → rebase/update-branch and push
- CI status pending → wait, then check
- Missing evidence doc for a completed WO → write it in the current loop slice
- **Unresolved bot review threads blocking `required_conversation_resolution`** → resolve in-scope
  bot/review threads (GraphQL `resolveReviewThread`) and let auto-merge fire
- Branch BEHIND main with auto-merge queued → `gh pr update-branch` and continue
- Failed tests caused by the current WO → repair within scope and rerun
- Routine merge conflicts resolvable without product or governance judgment → update and validate
- Failed current-WO worktree recovery covered by an exact approved procedure → repair and continue
- Implementation choices inside an authorized Work Order → choose, validate, and record
- Product behavior explicitly authorized by the active Work Order → implement within scope
- Next-WO selection from the active registered Goal/Loop → select and continue

---

## Reconciliation with WO-WOE-010 STOP_WALLS.md

WO-WOE-010's `goal-loop/STOP_WALLS.md` used a 9-wall list with a different SW-04..SW-09 mapping.
This register (v2.0) is canonical. Old → new mapping:

| WOE-010 (old) | WOE-011 (this register) |
|---------------|-------------------------|
| SW-01 Production deployment | Split: **SW-01** (deploy/cloud/reachability) + **SW-04** (production launch/go-live) |
| SW-02 County data mutation | **SW-02** (unchanged) |
| SW-03 Secrets | **SW-03** (unchanged) |
| SW-04 Branch/merge conflict | **SW-07** |
| SW-05 Conflicting canon | **SW-05** (unchanged) |
| SW-06 Failed validation outside scope | **SW-06** (unchanged) |
| SW-07 Runtime behavior expansion | **SW-09** |
| SW-08 New external service integration | **SW-08** (unchanged) |
| SW-09 Owner decision required | Folded into **SW-05** (unclear authority) / surfaced as `OPERATOR_ACTION_REQUIRED` |
| — (new) | **SW-10** Security / auth policy change |

`goal-loop/STOP_WALLS.md` carries a header pointer to this register and is retained for history.

---

## Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-01 | Canonical 10-wall register; reconciled WOE-010 numbering | WO-WOE-011 |
