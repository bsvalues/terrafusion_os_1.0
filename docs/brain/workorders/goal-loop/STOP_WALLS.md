# Stop Walls

**Authority:** WO-WOE-010
**Classification:** Operator Doctrine

> **SUPERSEDED (2026-07-01, WO-WOE-011):** The canonical stop-wall list is now
> [`../STOP_WALL_REGISTER.md`](../STOP_WALL_REGISTER.md) (SW-01..SW-10). This file is retained for
> history; its SW-04..SW-09 numbering was remapped — see the Reconciliation table in the register.
> When they disagree, the register wins.

A stop wall is an authority boundary that a `/loop` must not cross without explicit operator
authorization. Reaching a stop wall is not a failure — it is correct behavior. The Brain surfaces
the wall and waits.

---

## Always Stop For

### SW-01 — Production Deployment Authorization

Any action that pushes, deploys, or promotes code to a production or county-facing environment.

| Blocked | Scope |
|---------|-------|
| Azure App Service deploy (any slot) | P1 / P8 |
| Container image push to production registry | P1 / P8 |
| DNS cutover or routing change | P8 |
| County-facing UI or API enable | P1 |

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-01`. Operator must
issue explicit authorization command referencing WO ID.

---

### SW-02 — County Data Mutation

Any write, update, delete, or truncate against county-owned production or demo data.

| Blocked | Scope |
|---------|-------|
| DELETE duplicate rows from `canonical_tf.tf_parcel` | P2 / WO-DATA-BENTON-DUPE-001B |
| UPDATE or UPSERT in any `canonical_tf.*` table | P2 |
| DB reload or ETL re-run | P2 |
| Schema migration against demo or production DB | P1 / P3 |
| PACS data access (read or write) | P2 / all |

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-02`. Identify the
specific mutation, affected table, row count estimate, and irreversibility assessment.

---

### SW-03 — Secrets and Credential Handling

Any action involving secrets, API keys, connection strings with real credentials, or access tokens.

| Blocked | Scope |
|---------|-------|
| Writing secrets to files, PRs, or logs | All |
| Rotating or regenerating credentials | P8 |
| Injecting secrets into App Service / Key Vault | P8 |
| Committing `.env` or `appsettings.*.local.json` with real values | All |

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-03`. Never include
credential values in stop output.

---

### SW-04 — Branch or Merge Strategy Conflict

A conflict where the correct branch target, merge method, or rebase strategy cannot be determined
from current evidence.

| Blocked | Scope |
|---------|-------|
| Force-push to a shared branch | All |
| Rebase that would rewrite commits already in review | All |
| Merge strategy choice when PR has open review threads | All |
| Branch deletion when other WOs may depend on it | All |

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-04`. Describe the
conflict and the two candidate resolutions.

---

### SW-05 — Conflicting Canon

A contradiction between two authoritative documents (Constitution, Brain authority, domain pack,
local AGENTS.md, active WO) that cannot be resolved by reading the documents.

**Next step when reached:** emit `STOP_TYPE: CANONICAL_CONFLICT`. Cite both sources and the exact
contradiction. Do not choose a resolution autonomously.

---

### SW-06 — Failed Validation Outside Assigned Scope

A CI check, test suite, or gate failure that is not caused by changes in the current WO and cannot
be fixed within the current WO's sovereignty boundary.

**Next step when reached:** emit `STOP_TYPE: FAILED_GATE`. Identify the failing check, the last
passing commit, and whether the failure predates this WO.

---

### SW-07 — Runtime Behavior Expansion

A change that would alter observable API behavior, response contracts, or service startup outside
the current WO definition.

| Blocked | Scope |
|---------|-------|
| New API endpoint not in current WO | All |
| Changing existing API response shape | All |
| Modifying service startup sequence | All |
| Adding or removing health checks | P3 |

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-07`. Propose a
new WO scope that covers the change.

---

### SW-08 — New External Service Integration

Wiring a new external system (API, database, service bus, storage account) not already in the
current WO's allowed-systems list.

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-08`. Name the
proposed integration and the program it should sit in.

---

### SW-09 — Owner Decision Required

A choice where the operator must select between two or more legitimate options and no evidence
exists to prefer one.

**Examples:**
- Option A vs Option C for duplicate row handling (WO-DATA-BENTON-DUPE-001)
- Azure slot strategy choices (WO-AZURE-003)
- Test coverage threshold decisions
- Naming or schema design that affects public interfaces

**Next step when reached:** emit `STOP_TYPE: AUTHORITY_WALL` with wall name `SW-09`. Present the
options table (from the relevant WO or evidence doc) and wait.

---

## Stop Wall Output Template

```
RESULT:        STOP_GATE
GOAL:          <active goal>
LOOP_MODE:     <active loop mode>
ACTIVE_PROGRAM: <program name>
ACTIVE_WO:     <WO ID>
NEXT_WO:       BLOCKED
BLOCKERS:      <wall name: SW-XX — <one-line description>>
EVIDENCE:      <doc path or NONE>
STOP_TYPE:     AUTHORITY_WALL | CANONICAL_CONFLICT | FAILED_GATE
WALL:          SW-XX
WALL_DETAIL:   <what specifically triggered the wall, with evidence>
OPERATOR_ACTION_REQUIRED: <exactly what the operator must do to unblock>
```

---

## What Is NOT a Stop Wall

These are NOT stop walls — the loop may proceed through them:

- Pre-commit hook lint failures (fix and re-commit)
- Prettier formatting failures (fix and re-stage)
- Stale `index.lock` files (remove and retry)
- Non-fast-forward push requiring `--rebase` (rebase and push)
- Markdown spell-check warnings (fix inline)
- CI status pending (wait, then check)
- Missing evidence doc for a completed WO (write the doc in the current loop slice)
