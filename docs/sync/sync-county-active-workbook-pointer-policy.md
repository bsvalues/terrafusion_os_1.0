# Sync County Active-Workbook Pointer Policy

**Slice:** C41-A (docs-only — defines the schema, semantics, and
hard guards for a per-county pointer that names which Mapped
workbook is currently authoritative. C41-B will land the EF
entity + migration + SET / GET service. This slice writes the
contract, not the code.).
**Lifecycle layer:** sync metadata. Sits beside the
`SyncMappingWorkbooks` table, not inside it. No new schema on
existing tables; no new column on canonical landing.
**Status:** policy locked; implementation deferred to C41-B.

## Why this slice

C40-A locked the workbook lifecycle: Mapped is immutable,
revisions are versioned by workbook id, freshness is determined
by `SourceWorkbookId == active workbook for the county`. C40-A
also flagged the open question:

> **Active workbook discovery.** No table tracks "the
> operator-current workbook for county X." Today this is
> out-of-band knowledge (the operator's notes / runbook). A
> future slice can add a pointer table; this slice formalizes
> the absence.

C41-A fills that gap.

Per the locked sequence:

```
C40-A ✓ workbook lock-lifecycle + canonical staleness policy
C40-B ✓ supersession invariant tests
C41-A   active-workbook pointer table policy           ← THIS SLICE
C41-B   pointer entity + migration + SET / GET service
```

After C41-B, consumers (Forge / Studio / Dais / future Workbench
UI) can discover the active workbook id by querying TerraFusion
directly instead of relying on the operator's hand-off notes.

## Provenance

- **C2 — `SyncMappingWorkbook` schema.** The natural FK target
  for the pointer.
- **C6 — `SyncMappingWorkbookLockService`.** Defines what
  "Mapped" means — the only state a pointer is allowed to
  reference.
- **C40-A — workbook lock-lifecycle and canonical staleness
  policy.** Defines "active workbook" as a per-county operator
  decision. C41-A makes that decision queryable.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit
  invariant.

## Purpose

Define a per-county pointer that names the Mapped workbook the
operator currently treats as authoritative. The pointer is:

1. **Optional** — counties without a pointer continue to work
   exactly as today (consumers pass `workbookId` explicitly).
2. **Singleton per county** — exactly one row per
   `CountyId`; PK = `CountyId`.
3. **Strictly metadata** — setting / reading the pointer does
   NOT trigger C36 re-runs, does NOT mutate canonical landing
   rows, does NOT touch any workbook row.
4. **Auditable** — every SET writes through
   `AuditableEntityInterceptor`; the audit trail of pointer
   changes lives in `AuditLogs` per CLAUDE.md.

## Schema (proposed C41-B EF entity)

```csharp
namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Slice C41-A pointer surface: names the Mapped workbook the
/// operator currently treats as authoritative for a county.
/// Singleton per county; PK = CountyId. Strictly metadata —
/// SET / GET do not trigger any C36 / canonical / PACS work.
/// </summary>
public sealed class SyncCountyActiveWorkbook
{
    // Identity
    public Guid CountyId { get; set; }              // PK

    // Pointer
    public Guid ActiveWorkbookId { get; set; }      // FK → SyncMappingWorkbooks.Id
    public DateTime SetAt { get; set; }             // when this pointer was set
    public string SetBy { get; set; } = "";         // operator id
    public string? SetReason { get; set; }          // optional human note

    // Audit (FISMA-HIGH; AuditableEntityInterceptor auto-populates)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string?  CreatedBy { get; set; }
    public string?  UpdatedBy { get; set; }
}
```

Notes on field choices:

- **`SetAt` vs `UpdatedAt`.** `UpdatedAt` is generic FISMA audit;
  `SetAt` is the **business** timestamp ("when did the operator
  promote this workbook"). Distinct because the row may also be
  touched by audit-only updates (e.g. operator metadata
  refresh) that wouldn't change `SetAt`.
- **`SetBy` vs `UpdatedBy`.** Same distinction. `SetBy` records
  the operator who promoted; `UpdatedBy` is the most recent
  toucher.
- **`SetReason` is nullable.** Not every operator will leave a
  note; the field exists for future UI affordances and audit
  review.

### EF configuration constraints (C41-B-implements)

```csharp
builder.HasKey(e => e.CountyId);                     // PK = CountyId
builder.Property(e => e.SetBy).HasMaxLength(200);
builder.Property(e => e.SetReason).HasMaxLength(1000);
builder.HasOne<SyncMappingWorkbook>()
       .WithMany()
       .HasForeignKey(e => e.ActiveWorkbookId)
       .OnDelete(DeleteBehavior.Restrict);           // see Hard Guard 8
```

The FK is `Restrict` (not `Cascade`): a workbook that is the
target of an active pointer cannot be deleted out from under it.

## Hard guards

These guards lock the contract for C41-B. C41-B may not relax
them.

### 1. **Singleton per county.**

PK is `CountyId` alone. There is exactly one pointer per
county at any time. Setting a new pointer overwrites the
prior `ActiveWorkbookId` in place; the prior workbook id is
NOT preserved on this row. The audit trail of past pointers
lives in `AuditLogs` (FISMA-required), NOT in this table.

### 2. **Target must be a Mapped workbook in the same county.**

The pointer cannot reference:
- A `Draft` workbook.
- An `Archived` / `Approved` / non-`Mapped` status (if such
  states are introduced later).
- A workbook in a different county.

C41-B's SET service validates both invariants before
inserting / updating the row. Failure surfaces as
`InvalidOperationException` with the same message shape used
by C6 / C7 / C36.

### 3. **SET is idempotent.**

Setting the pointer to the same `ActiveWorkbookId` it already
holds is a no-op for the audit trail (no new `AuditLogs` row,
no `UpdatedAt` bump). The service detects same-value writes
and short-circuits before any state change.

This protects against accidental "click-twice" UX bugs and
operator scripts that re-apply the pointer on every cron tick.

### 4. **SET does NOT trigger C36.**

Per C40-A Invariant 8 (no automatic re-run of C36 on workbook
lock). C41-A inherits: setting the pointer is metadata only.
If the operator wants the canonical landing rows refreshed,
they run the C37-C tool (or a future scheduled-runner slice)
explicitly.

### 5. **GET is read-only.**

Reading the pointer never mutates anything. No
`UpdatedAt` bump on read, no audit log entry, no operational
side effect. The GET service is `AsNoTracking` against the
DbContext.

### 6. **County isolation.**

Per CLAUDE.md sovereign-county invariant: every SET / GET
takes a `countyId` parameter and operates only on that
county's row. Cross-county callers fail closed with the same
"not found" semantics other sync surfaces use.

### 7. **No PII.**

The row carries pointer metadata only — no grantor, no
grantee, no parcel data, no PACS rows. This is a metadata
surface, not a comp surface.

### 8. **Pointed-to workbook can't be deleted.**

The EF config uses `OnDelete(DeleteBehavior.Restrict)`.
Attempting to delete a `SyncMappingWorkbook` that is the
target of an active pointer fails at the database constraint
level. To delete a pointed-to workbook, the operator MUST
first either:

- SET the pointer to a different workbook, OR
- Delete the pointer row (C41-B's optional `Clear` operation;
  see below).

### 9. **No pointer is a valid state.**

A county MAY have no pointer row at all. That state
represents "the operator hasn't promoted any workbook yet"
and is the starting condition for new-county onboarding.
Consumers MUST handle this case (treat as "no active
workbook" — their downstream UX decides whether to show
"unconfigured" or default to the unpinned C39 endpoint).

### 10. **The pointer is advisory, not enforcing.**

C41-A does not change the C39 endpoint's behavior. The C39
endpoint still accepts an explicit `workbookId` query param
and uses it verbatim. The pointer is just a discovery surface
for clients that don't want to track active workbook ids
themselves. A consumer that ignores the pointer and passes a
stale workbook id continues to receive that stale workbook's
view — by design (consumer's responsibility per C40-A).

### 11. **Auditable per FISMA.**

Every SET / Clear runs through
`AuditableEntityInterceptor`. Full audit trail of "who
pointed to what when" lives in `AuditLogs` (FISMA-required,
per CLAUDE.md), NOT in this table.

## Service surface (proposed C41-B)

```csharp
namespace TerraFusion.Sync.Workbench.Mapping;

public interface ISyncCountyActiveWorkbookService
{
    /// <summary>
    /// Read the active workbook id for a county. Returns
    /// <c>null</c> when the county has no pointer row at all
    /// (Hard Guard 9 valid state).
    /// </summary>
    Task<SyncCountyActiveWorkbookSnapshot?> GetAsync(
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Promote a Mapped workbook to active for a county.
    /// Idempotent (Hard Guard 3): re-setting the same workbook
    /// is a no-op. Validates the workbook is Mapped + same
    /// county before any state change.
    /// </summary>
    Task<SyncCountyActiveWorkbookSnapshot> SetAsync(
        Guid countyId,
        Guid workbookId,
        string operatorId,
        string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Optional: clear the pointer (county returns to "no
    /// active workbook" state). Required if the operator wants
    /// to delete a pointed-to workbook (Hard Guard 8).
    /// </summary>
    Task ClearAsync(
        Guid countyId,
        string operatorId,
        CancellationToken cancellationToken = default);
}

public sealed record SyncCountyActiveWorkbookSnapshot(
    Guid     CountyId,
    Guid     ActiveWorkbookId,
    DateTime SetAt,
    string   SetBy,
    string?  SetReason);
```

`SyncCountyActiveWorkbookSnapshot` is the read-side projection
— DTO-shaped, no audit fields surfaced (those live in
`AuditLogs`).

## HTTP surface (optional in C41-B)

C41-B MAY (but does not have to) expose:

```
GET /api/sync/active-workbook?countyId={guid}
   → 200 OK { activeWorkbookId, setAt, setBy, setReason }
   → 404 Not Found  (county has no pointer; Hard Guard 9 state)
   → 401 / 403 / 400 per the C38-A endpoint contract pattern.

PUT /api/sync/active-workbook?countyId={guid}&workbookId={guid}
[body: { reason?: string }]
   → 200 OK { ...snapshot }
   → 400 if workbook is not Mapped or wrong county
   → 401 / 403 per the C38-A endpoint contract pattern.

DELETE /api/sync/active-workbook?countyId={guid}
   → 204 No Content
   → 404 if no pointer exists
   → 401 / 403 per the C38-A endpoint contract pattern.
```

If C41-B exposes the HTTP surface, it inherits all C38-A Hard
Guards (auth, county isolation server-side, no PII, audit at
consumer level only) and uses the same `[Authorize]` +
`countyId` claim pattern as `GET /api/sync/comps/eligible`.

C41-B may defer the HTTP surface to a separate slice if the
service-only surface is enough for the immediate consumer
(e.g. SalesCompProof CLI tool, future scheduled runner). The
schema migration MUST land regardless.

## C41-B success gates

C41-B is accepted only when ALL of:

1. `SyncCountyActiveWorkbook` entity shipped at the path above.
2. EF Core configuration registered in `TerraFusionDbContext`
   per the existing pattern; migration generated and applied
   to live Postgres.
3. `ISyncCountyActiveWorkbookService` + implementation shipped
   with the GET / SET / Clear methods.
4. DI registration in `Program.cs`.
5. Tests landed:
   - SET against a Mapped workbook in the same county → row
     persisted with all fields.
   - SET against a Draft workbook → throws
     `InvalidOperationException`.
   - SET against a Mapped workbook in a different county →
     throws.
   - SET twice with the same workbook → second call is a no-op
     (Hard Guard 3).
   - GET against a county with no pointer → returns `null`
     (Hard Guard 9).
   - GET / SET both county-isolated.
   - SET / Clear / GET are read-only against
     `CanonicalSaleQualifications` (pre/post snapshot).
   - SET / Clear stamp `AuditableEntityInterceptor` audit
     fields.
   - FK Restrict: deleting a pointed-to workbook surfaces an
     EF / DB constraint violation.
6. Full Sync regression green
   (`FullyQualifiedName~Tests.Sync.` baseline 763 / 763 + new
   tests).
7. R2Wave44 SyncController regression preserved (12 / 12).
8. SyncControllerCompsEligibleTests preserved (29 / 29) — the
   pointer is additive; the C39 endpoint's behavior is
   unchanged.

## Forbidden semantics (no scope creep)

C41 is a **per-county pointer**. It is NOT:

- a per-user workbook setting (no `UserId`).
- a per-tax-year workbook (no `TaxYear` slot).
- a per-lane workbook (sales / land / improvement). The
  pointer is whole-county; per-lane pointers are a future
  slice if needed.
- a workbook publishing pipeline. SET is one transaction;
  there is no draft/staging/promotion workflow on the
  pointer itself.
- a re-evaluation trigger. SET does not invoke C36.
- a workbook archival surface. Past workbooks are preserved
  on the `SyncMappingWorkbooks` table; this slice does not
  archive or soft-delete them.
- a comp-pool consumer surface. The pointer is metadata for
  consumers; the actual comp pool still flows through C39's
  endpoint.

If a future slice wants any of those, it writes its own
policy doc and references this one as input.

## What this slice does NOT change

- Does not modify `SyncMappingWorkbook` schema or its
  lifecycle.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B reader.
- Does not modify `CanonicalSaleQualifications`.
- Does not modify `AuditLogs` schema; it just writes through
  the existing interceptor.
- Does not modify the C39 paginated endpoint.
- Does not modify PACS.
- Does not introduce a new operator-facing UI.

## Consumer integration pattern (post-C41-B)

A consumer (Forge / Studio / Dais / SalesCompProof CLI / future
Workbench UI) that wants the active comp pool follows this
sequence:

```
1. ptr = ActiveWorkbookService.GetAsync(countyId)
   if ptr is null: handle "no active workbook" state
2. Call GET /api/sync/comps/eligible?countyId=X&workbookId=ptr.ActiveWorkbookId
   (with pagination if needed)
3. Bind the resulting PagedCompEligibleSalesDto
```

The pointer service replaces the operator's hand-off note as
the discovery surface. The C39 endpoint continues to be the
read surface.

## Open questions deferred to C41-B / later

- **HTTP surface vs service-only.** C41-B may defer the HTTP
  surface to a separate slice (call it C41-C) if no immediate
  HTTP consumer demands it. The migration + entity + service
  MUST land in C41-B; the controller surface is optional in
  this slice.
- **OnDelete behavior.** This policy specifies `Restrict`. If
  a future archival slice wants `SetNull` (the workbook is
  archived but the pointer should clear automatically), that's
  its policy decision — out of scope here.
- **Per-lane future-proofing.** This slice locks the pointer
  as whole-county. If sales / land / improvement lanes ever
  want independent active workbooks, that's a separate slice
  with its own schema (likely a `SyncCountyActiveLaneWorkbook`
  table; the singleton pointer here is NOT modified
  retroactively).
- **Migration ordering.** The migration adds a new table; no
  existing data to backfill. No PACS read, no canonical row
  read. C41-B's migration is purely additive.

## Glossary (slice-local)

- **Active workbook** — the Mapped workbook the operator
  currently treats as authoritative for a county. Discovered
  via the pointer table after C41-B.
- **Pointer row** — a row in `SyncCountyActiveWorkbook`. PK is
  `CountyId`; payload is `ActiveWorkbookId` plus business +
  audit metadata.
- **Promote** — operator action of SET-ing the pointer to a
  particular workbook id.
- **Clear** — operator action of removing the pointer row;
  county returns to "no active workbook" state.
- **No-pointer state** — Hard Guard 9: a county with no row in
  `SyncCountyActiveWorkbook`. Valid; consumer's choice how to
  handle.
- **Advisory pointer** — Hard Guard 10: the pointer informs
  consumers but does not enforce their pin. Consumers that
  ignore the pointer continue to work, just without
  freshness benefits.
