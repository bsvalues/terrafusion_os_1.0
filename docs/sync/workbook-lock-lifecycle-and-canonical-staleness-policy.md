# Workbook Lock-Lifecycle and Canonical Staleness Policy

**Slice:** C40-A (docs-only — defines the lifecycle invariants for a
locked Mapping Workbook and the canonical-staleness semantics that
consumers must observe when an operator publishes a new workbook
revision. C40-B will land any code changes the policy requires —
this slice writes the contract, not the code.).
**Lifecycle layer:** cross-cutting. Touches the C6 lock service,
the C36 canonical writer, the C37-B reader, and the C38-B / C39-B
HTTP surface. No new schema, no new endpoint.
**Status:** policy locked; implementation deferred to C40-B.

## Why this slice

C36's idempotent re-write per `(CountyId, ChgOfOwnerId)` answers
"what happens when the same sale is evaluated twice." It does NOT
answer:

1. **What happens when the operator wants to change mappings?**
   The C6 lock service treats `Mapped` as terminal — there's no
   built-in "reopen" surface. The operator's actual flow today is
   to create a brand-new workbook and lock that. Locking that
   discipline is overdue.

2. **What does the canonical landing table look like across two
   live workbooks?** Each canonical row carries
   `SourceWorkbookId`, but the whole table can hold rows from
   multiple workbook lock-versions simultaneously — the C37-B
   reader returns them all when unpinned.

3. **How does a consumer know its comp pool is "fresh"?**
   "Fresh" means evaluated against the operator's
   currently-active mapping rules. Without a definition, every
   consumer rolls its own answer.

4. **When canonical rows go stale, who triggers re-evaluation?**
   Currently nothing. The C37-C tool re-runs C36 manually. There
   is no automatic refresh, no cron, no event.

This slice defines those invariants so consumers (Forge / Studio
/ Dais) and operators have the same mental model.

## Provenance

- **C6 — `SyncMappingWorkbookLockService`.** Owns the
  Draft → Mapped transition. Does NOT define a Mapped → Draft
  reverse. C40-A locks that absence as policy.
- **C7 — `SyncMappingWorkbookReadModel`.** Refuses to load
  non-Mapped workbooks. C40-A inherits without modification.
- **C8-A / C36 — sales qualification transform write-side.** The
  per-sale upsert that produces canonical rows. C40-A defines
  what makes a canonical row "stale" relative to the current
  workbook.
- **C35-A — canonical landing schema policy.** "Idempotent
  re-write per (CountyId, ChgOfOwnerId); audit trail of prior
  decisions lives in AuditLogs, NOT in this table." C40-A
  inherits that contract; staleness is a per-row property of the
  canonical landing, not a separate audit surface.
- **C37-A / C37-B — comp-eligibility filter.** The reader's
  `workbookId` opt-in pin. C40-A formalizes the consumer-side
  semantics of that pin.
- **C39-A / C39-B — paginated comps API.** Surfaces
  `SourceWorkbookId` on every comp row. C40-A locks how clients
  interpret that field.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit.

## Invariants

These are policy locks, not code changes. C40-B may codify them
in tests; nothing in this slice requires schema or service
changes.

### 1. **A Mapped workbook is immutable.**

Once `Status='Mapped'`, the workbook row, its
`SyncMappingColumn` rows, and its `SyncMappingCodeValue` rows
are read-only. C9-B (edit), C11-B (batch-edit), and C32-B
(column terminalization) all already refuse non-Draft
workbooks. C40-A formalizes that refusal as policy:

> The Mapped workbook is the lock-version. To change mappings,
> the operator creates a new workbook.

There is no `unlock` / `reopen` surface in this slice. If a
future slice introduces one, it writes its own policy and
re-evaluates every consumer impact.

### 2. **Mapping revisions are versioned by workbook id.**

Every revision is a new `SyncMappingWorkbook` row with its own
`Id` and its own lock time. The natural identifier for "which
mapping rules produced this decision" is `SourceWorkbookId` on
the canonical landing row.

This means a county can have multiple Mapped workbooks
simultaneously — the prior one(s) plus the current one. They
are all valid, all locked, all readable through the C7 read
model independently.

### 3. **Single canonical row per sale, regardless of workbook
   count.**

Per C35-A: the canonical landing primary key is
`(CountyId, ChgOfOwnerId)`. There is exactly ONE canonical row
per sale, and its `SourceWorkbookId` reflects the **most
recent** C36 run that touched it.

If workbook A evaluated sale `1001` and later workbook B
evaluated sale `1001`, the canonical row's `SourceWorkbookId`
becomes B. Workbook A's decision is overwritten in place.

### 4. **A canonical row is "fresh" iff its `SourceWorkbookId`
   matches the operator-active workbook.**

"Operator-active workbook" means the workbook the operator
currently treats as authoritative for the county. There is no
schema field for this — it's a per-county operator decision.
Consumers MUST be told the active workbook id by their caller
(query param, configuration, or a future C41+ "current
workbook pointer" surface).

A canonical row whose `SourceWorkbookId` differs from the
operator-active workbook is **stale** — its decision was
computed against a prior mapping ruleset.

### 5. **Stale rows are not "wrong" — they're under-evaluated.**

A stale row's decision was correct for its workbook. The risk
is that the operator's new workbook would have produced a
different decision (e.g. previously Excluded → newly Qualified
because the operator added a Mapped code-value, OR previously
Qualified → newly Inconclusive because the operator
re-classified a wac_cd).

Stale rows continue to exist on disk. C36 does not delete
them. Consumers MUST decide:

- **Forge / ratio study consumers:** must filter stale rows
  out (pin to the active workbook).
- **Diagnostic / audit consumers:** may include stale rows
  (omit the pin) and rely on `SourceWorkbookId` to reason
  about provenance.

This is the explicit consumer contract. There is no "automatic
hide stale rows" surface; the consumer's slice picks.

### 6. **C39's `workbookId` query parameter IS the consumer's
   freshness control.**

Per C37-A Hard Guard 7 / C39-A Hard Guard 8: `workbookId` is
opt-in. C40-A formalizes:

- **Omit** `workbookId` → "any Qualified row, regardless of
  workbook." Includes potentially stale rows. Use case:
  audit, diagnostics, ratio-study reconciliation across
  versions.
- **Provide** `workbookId` → "only rows produced by this
  workbook." This is the "fresh" filter. Use case: Forge /
  Studio / Dais comp consumption.

There is no implicit default. Consumers that want fresh data
MUST pass the active workbook id explicitly.

### 7. **Operator runbook: publishing a new mapping revision.**

When the operator wants to revise mappings, the canonical
sequence is:

```
1. Create a new workbook (C4 or via re-run of the C5 draft loader).
2. Edit / batch-edit the new workbook (C9-B / C11-B / C32-B).
3. Lock the new workbook (C10-B).
4. Re-run C36 against the new workbook (via C37-C
   SalesCompProof tool or future automation).
5. Inform consumers of the new active workbook id.
   - Forge / Studio / Dais update their workbookId pin.
   - The prior workbook can be left in place (audit trail) or
     archived (C41+ slice if archival is needed).
```

Step 5 is where C40-A's clarity matters most. Without an
operator-known active workbook id, consumers can't pin
correctly.

### 8. **No automatic re-run of C36 on workbook lock.**

C40-A does NOT introduce automated re-evaluation. The C36
runner remains operator-triggered (via the C37-C tool or any
future scheduled-runner slice). Reasons:

- Re-running C36 reads PACS — that's a real network /
  resource cost we don't want firing on every workbook edit.
- The operator is the authoritative driver of mapping
  revisions; they decide when to commit to the canonical
  refresh.
- Auto-triggering opens the door to half-applied
  refresh states across consumers.

A future slice (C41+) MAY introduce a scheduled re-runner with
its own policy. C40-A explicitly defers that decision.

### 9. **Auditing carries over from C35-A.**

Every C36 upsert stamps `UpdatedBy` + `UpdatedAt`. The audit
trail of "which workbook decided this row at which time"
lives across:

- The canonical row's `SourceWorkbookId` +
  `SourceWorkbookLockedAt` + `UpdatedAt` + `UpdatedBy` (the
  most recent decision).
- `AuditLogs` (FISMA-required; prior decisions land here per
  CLAUDE.md).

C40-A inherits this without modification. There is no new
audit surface in this slice.

### 10. **Cross-county isolation is unchanged.**

A workbook in county A has no relationship to a workbook in
county B. Staleness is a per-county concern — operator A's
workbook revision does not invalidate operator B's canonical
rows. CLAUDE.md sovereign-county isolation applies verbatim.

## Consumer-facing implications

| Consumer | Recommended posture                                                |
|----------|--------------------------------------------------------------------|
| Forge sales-comp panel | Pin to the operator's active workbook. Fail closed (display "no comps available; operator has not refreshed canonical landing for this workbook") if the pinned workbook returns 0 rows. |
| Studio comp explorer | Pin to active workbook by default; provide a UI affordance to "show all (including stale)" for diagnostic users. |
| Dais comp viewer | Pin. Same as Forge. |
| Ratio-study consumer | Pin. Ratio studies cannot mix workbook lock-versions without explicit reconciliation. |
| Audit / compliance reviewer | Omit pin. Read across all workbook versions to reconstruct decision history. |
| C37-C live-PACS proof tool | Already pins via `--workbook-id`. Behavior locked. |

## Forbidden behaviors

C40-A makes the following explicitly out of bounds:

- **Reopening a Mapped workbook.** No service may flip
  Mapped → Draft. If a future slice introduces this, it writes
  its own policy.
- **Mutating a Mapped workbook's columns / code-values.** C9-B
  / C11-B / C32-B already refuse; C40-A locks the refusal as
  policy.
- **Bulk-deleting canonical rows from a prior workbook.** C36
  does not delete; if a future slice introduces a cleanup,
  it's its own policy.
- **Implicit "default to most recent workbook" pinning by the
  C39 endpoint.** Hard Guard 7 of C37-A / C39-A keeps pin
  opt-in. C40-A reaffirms.
- **Per-row "freshness" computation by the API.** The endpoint
  returns rows; the consumer applies the freshness rule via
  the workbook pin. The API does not flag rows as stale.

## C40-B success gates (if implementation lands)

C40-A is docs-only. C40-B is optional and only needed when an
operator-impacting freshness gap surfaces. Possible C40-B
scopes (each requires its own policy slice if pursued):

- **Test-only codification.** Add tests asserting:
  - Edit / batch-edit / column-terminalization services refuse
    a Mapped workbook (already done in their respective test
    suites; C40-B may consolidate them under a "lifecycle
    invariant" test class).
  - C36 idempotent re-run against workbook B overwrites a row
    previously written by workbook A and rotates
    `SourceWorkbookId` accordingly.
  - The C37-B reader's `workbookId` pin filters to the pinned
    workbook only (already covered).
- **Active-workbook pointer surface.** A
  `SyncCountyActiveWorkbook (CountyId PK, ActiveWorkbookId)`
  table that consumers query to discover the active workbook.
  Optional. Out of scope for C40-A.
- **Stale-row diagnostic endpoint.**
  `GET /api/sync/comps/stale?countyId=...&workbookId=...`
  returning canonical rows whose `SourceWorkbookId` differs
  from the supplied `workbookId`. Optional. Out of scope.

## Open questions deferred

- **Active workbook discovery.** No table tracks "the
  operator-current workbook for county X." Today this is
  out-of-band knowledge (the operator's notes / runbook). A
  future slice can add a pointer table; this slice formalizes
  the absence.
- **Stale row purging.** Mapping revisions accumulate stale
  canonical rows. C40-A does not purge. A future slice can
  add a soft-delete + sweep policy if storage / read cost
  becomes a concern at scale.
- **Cross-version comp reconciliation.** Ratio-study consumers
  may want to see "this sale was Qualified under workbook A
  and Excluded under workbook B." Currently they'd need to
  re-run C36 against each workbook independently and
  difference the results out-of-band. A future slice can add
  a per-workbook canonical landing variant if this becomes a
  product requirement.

## Glossary (slice-local)

- **Active workbook** — the workbook the operator currently
  treats as authoritative for a county. Discovered out-of-
  band; no schema field stores it.
- **Stale row** — a canonical row whose `SourceWorkbookId`
  differs from the active workbook. Decision was correct for
  its workbook; under-evaluated relative to the active
  workbook's rules.
- **Fresh row** — `SourceWorkbookId == active workbook id`.
- **Mapping revision** — a new `SyncMappingWorkbook` reflecting
  changed operator decisions. Always a new row, never an
  in-place edit.
- **Lock immutability** — the C6/C40-A invariant that a
  `Status='Mapped'` workbook can never be mutated.
- **Workbook supersession** — when a later C36 run against
  workbook B overwrites a canonical row previously decided by
  workbook A. The row's identity (`(CountyId, ChgOfOwnerId)`)
  is unchanged; its provenance fields rotate.
