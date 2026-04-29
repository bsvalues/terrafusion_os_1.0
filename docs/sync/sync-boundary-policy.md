# TerraFusion Sync Boundary Policy

**Slice:** SCOPE-1 (docs-only — corrects the product boundary
that drifted during the C35–C47 proof chain. Defines what
TerraFusion Sync is, what it is not, what already-shipped
artifacts are reclassified as, and what handoff contracts the
downstream consumers (TerraFlow, Forge, Studio/Dais) must rely
on. No code moves in this slice.).
**Lifecycle layer:** Product/architectural boundary policy.
Cross-cuts the entire Sync chain (Kernel APIs,
TerraFusion.Sync.Workbench services, canonical landing tables,
proof tools).
**Status:** policy locked; reclassification of existing artifacts
codified; future-rule enforced.

## Why this slice

During the C-series, comp-eligibility readers, proof endpoints,
stale diagnostics, and a workbook-name enrichment surface were
all built **inside Sync** because Sync was where the canonical
landing rows first existed. That was correct as a proof harness
— the work demonstrated end-to-end that the Mapping Workbook +
canonical landing chain produces real, queryable, county-isolated
data.

It is **incorrect** as a product boundary. TerraFusion Sync is
not a comps product, a workflow engine, a valuation surface, or
an assessor-operations console. It is the legacy-to-canonical
**bridge**.

The cleaner boundary:

```text
Legacy DBs / PACS / CAMA
        ↓
TerraFusion Sync           ← bridge: ingest, profile, map, canonicalize, prove
        ↓
TerraFusion canonical DB   ← single source of truth for downstream products
        ↓
TerraFlow / Forge / Dais / Studio / Dossier
```

The bridge troll is not the mayor. SCOPE-1 writes that down so
no future slice accidentally extends Sync into product territory
again.

## What TerraFusion Sync owns

These are the only product responsibilities Sync legitimately
holds. New work inside Sync MUST fall into one of these
categories or it does not belong here.

1. **Source connection records** — credentials, endpoints, and
   scopes for legacy systems (PACS, CAMA, ProVal, Tyler, etc.).
2. **Source profiling** — schema discovery, row counts, sample
   harvesting, dictionary detection on legacy databases.
3. **Source schema atlas** — durable record of legacy table /
   column / type / cardinality observations.
4. **Dictionary / codebook discovery** — extracting and
   persisting the lookup tables that decode legacy enums
   (`hood_cd`, `i_attr_id`, `imprv_det_type_cd`, etc.).
5. **Mapping Workbook data model** — the Draft → Mapped
   lifecycle, per-column mapping decisions, lock semantics, and
   the storage that backs them. Sync owns the **mechanism**.
6. **Source-to-canonical transforms** — the actual code that
   reads from a Mapped workbook and writes canonical landing
   rows (e.g. `SalesQualificationCanonicalRunner`).
7. **Canonical landing tables** — the authoritative shapes that
   downstream products consume. Examples today:
   `CanonicalSaleQualifications`. Future lanes: valuation,
   improvement, land.
8. **Provenance** — `SourceWorkbookId`, `SourceWorkbookLockedAt`,
   the audit interceptor stamps, and the mechanical traceability
   from a canonical row back to the legacy row that produced it.
9. **Idempotent reruns** — the upsert + supersession discipline
   that lets a transform re-execute against a new workbook
   without poisoning history.
10. **Active workbook pointer** — the per-county `which workbook
    is currently authoritative` record (`SyncCountyActiveWorkbook`)
    plus the explicit-override > pointer > fail-closed resolver.
11. **Stale diagnostics** — read-only detection of canonical
    rows whose `SourceWorkbookId` no longer matches the active
    pointer (per-row, per-group, summary).
12. **Read-only proof endpoints / tools** — surfaces that exist
    to prove the bridge works, not to serve product UX. These
    are explicitly classified below as transitional.

## What TerraFusion Sync does not own

These are downstream-product concerns. They MUST live in
TerraFlow, Forge, Studio, Dais, or Dossier — never in Sync.

- **Comp selection UX.** Picking which canonical sales become
  comps for a subject parcel. Belongs to Forge.
- **Valuation logic.** Cost-approach, market-approach,
  income-approach math; the Benton Method; PRD/PRB cycles.
  Belongs to Forge.
- **Ratio-study workflow.** Sample selection, IAAO statistics,
  stratification, narrative output. Belongs to Forge / Dossier.
- **Assessor review queues.** Per-operator task lists,
  prioritization, SLAs. Belongs to TerraFlow.
- **Public-records packet workflow.** Compiling a defensible
  evidence packet for appeal or disclosure. Belongs to Dossier.
- **Task assignment / approval chains.** Routing work between
  operators, supervisor sign-off, escalations. Belongs to
  TerraFlow.
- **Notifications.** Email, in-app, calendar. Belongs to
  TerraFlow / Studio.
- **Operator-facing dashboards.** Exception: internal proof /
  admin surfaces that exist solely to verify the bridge. Real
  product dashboards belong to Studio / Dais.

## Reclassification of existing C35–C47 artifacts

Every artifact built during the C-series gets a single
classification below. **No artifact is being deleted, moved, or
renamed in this slice** — reclassification is documentation, not
refactor.

### Canonical / provenance (Sync-owned, permanent)

| Artifact | Type | Disposition |
|---|---|---|
| `CanonicalSaleQualifications` table | Canonical landing | Sync-owned. Permanent. |
| `SyncCountyActiveWorkbook` table | Provenance pointer | Sync-owned. Permanent. |
| `SyncMappingWorkbook` (and detail tables) | Mapping data model | Sync-owned. Permanent. |
| `SalesQualificationCanonicalRunner` | Source-to-canonical transform | Sync-owned. Permanent. |
| `SourceWorkbookId` / `SourceWorkbookLockedAt` columns | Provenance | Sync-owned. Permanent. |
| `WorkbookIdResolver` (explicit > pointer > fail-closed) | Provenance resolver | Sync-owned. Permanent. |

### Proof / read surfaces (Sync-owned, transitional)

These exist today to prove the bridge works. They MAY be
consumed by downstream products in the short term, but they are
**not the product API for that domain**. Long-term, the
authoritative consumer-facing API for comps lives in Forge; for
workflow it lives in TerraFlow; for operator ops it lives in
Studio / Dais. Sync's read surfaces remain available as
diagnostic / admin endpoints.

| Artifact | Type | Long-term home |
|---|---|---|
| `GET /api/sync/comps/eligible` | Read-only proof endpoint | Forge owns the consumer-facing comp API. Sync endpoint stays as admin/diagnostic. |
| `GET /api/sync/comps/stale` | Read-only diagnostic | Stays in Sync (diagnostic by nature). |
| `GET /api/sync/comps/stale/summary` | Read-only diagnostic | Stays in Sync. |
| `GET /api/sync/active-workbook` | Read-only pointer | Stays in Sync. |
| `PUT /api/sync/active-workbook` | Pointer mutation | Stays in Sync (pointer is Sync-owned data). |
| `SalesCompProof` CLI | Proof tool | Stays in Sync as proof / regression harness. |
| C45 HTTP caching family (ETag, `If-None-Match`, `Vary`, etc.) | Read-surface infra | Stays in Sync; pattern is reused by downstream owners on their own surfaces. |
| C46 / C47 workbook-name enrichment | Read-surface ergonomics | Stays in Sync as a diagnostic nicety. |

### Handoff to downstream owners

| Concern observed inside Sync | True owner | Handoff contract |
|---|---|---|
| Mapping Workbook **review/edit/lock workflow** (operator UX, prioritization, SLA) | TerraFlow | `docs/terraflow/sync-handoff.md` |
| **Comp selection / scoring / ranking** | Forge | `docs/forge/sync-comp-eligibility-handoff.md` |
| **Stale-row remediation workflow** (who reruns what, when, with what approval) | TerraFlow | `docs/terraflow/sync-handoff.md` |
| **Operator dashboards** beyond admin/diagnostic | Studio / Dais | (out of scope for SCOPE-1; future doc) |

## Future rule (binding on all post-SCOPE-1 slices)

**No new workflow, UX, valuation, ratio-study, task-routing, or
business-product features inside Sync.** Period.

Concretely, the gate for any future Sync slice is:

1. Does this slice add a new **canonical landing table**, a new
   **source-to-canonical transform**, new **provenance**, new
   **stale detection**, or a new **profiling / dictionary /
   atlas** capability? → **Allowed.**
2. Does this slice add a new **read-only proof or admin
   endpoint** that exists to verify the bridge or support
   diagnostics? → **Allowed**, but it MUST be explicitly tagged
   in its policy doc as "proof / admin, not consumer-facing
   product API."
3. Does this slice add operator-facing UX, scoring, ranking,
   approval, notification, valuation math, or workflow routing?
   → **Forbidden in Sync.** It belongs to TerraFlow / Forge /
   Studio / Dais / Dossier. Open the slice there instead.

If a slice is ambiguous, the bias is **out of Sync**. The bridge
troll keeps its scope small on purpose.

## Handoff contracts (cross-references)

The two consumers most affected by SCOPE-1 get their own handoff
docs:

- **`docs/terraflow/sync-handoff.md`** — what TerraFlow can rely
  on from Sync (canonical tables, pointer, stale diagnostics)
  and what TerraFlow owns on top of those (review queues,
  remediation workflow, approvals).
- **`docs/forge/sync-comp-eligibility-handoff.md`** — what Forge
  can rely on from Sync for comp data (canonical sale
  qualifications, eligibility filter rule, freshness signal) and
  what Forge owns on top (selection UX, scoring, ranking,
  consumer-facing comp API).

## Non-goals (deliberate exclusions)

- **No code moves.** SCOPE-1 does not rename, relocate, or
  retire any module, namespace, table, endpoint, or test.
- **No deprecation.** The transitional read surfaces stay
  callable. Downstream products consuming them today continue to
  work.
- **No TerraFlow engine bring-up.** SCOPE-1 documents the
  handoff; standing up the actual workflow engine is a separate
  future slice in `docs/terraflow/`.
- **No Forge bring-up.** Same.
- **No new tests.** Documentation slice. Regression baseline
  must be preserved bit-for-bit.

## Acceptance for SCOPE-1

- `docs/sync/sync-boundary-policy.md` exists and codifies the
  scope above.
- `docs/terraflow/sync-handoff.md` exists and contains the
  consumer-side mirror of this contract.
- `docs/forge/sync-comp-eligibility-handoff.md` exists and
  contains the comp-domain handoff.
- No backend, frontend, migration, transform, or workbook
  artifact is modified.
- Regression baseline (Unit Sync 151/151, Integration Sync
  782/782) is preserved by construction (no code touched).
