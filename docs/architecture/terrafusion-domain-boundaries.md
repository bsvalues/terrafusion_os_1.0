# TerraFusion Architecture — Domain Boundaries

**Slice:** SCOPE-2 (docs-only — extends SCOPE-1's Sync↔TerraFlow↔Forge
boundary correction to the full TerraFusion product surface map.
One paragraph of ownership per domain, one cross-reference to its
handoff doc, one explicit list of forbidden ownership leaks. Prevents
the same drift SCOPE-1 corrected from recurring elsewhere — Forge
drifting into ratio-study workflow, Dais drifting into valuation,
TerraAtlas drifting into mapping workbook ownership.).
**Lifecycle layer:** Architecture-wide product boundary policy.
Cross-cuts every TerraFusion domain.
**Status:** policy locked; no code in this slice; no domain bring-up.
**Authoritative cross-reference:** `docs/sync/sync-boundary-policy.md`
(SCOPE-1) for the Sync detail.

## Why this slice

SCOPE-1 corrected the boundary that drifted between TerraFusion Sync
and the products downstream of it. That correction is necessary but
not sufficient — there are six other product surfaces in the
TerraFusion stack and the same kind of drift can happen between any
two of them.

This document writes down, for every domain:

1. **What it is** — one paragraph of identity.
2. **What it owns** — bullet list of legitimate responsibilities.
3. **What it does NOT own** — bullet list of forbidden ownership leaks.
4. **Where its handoff contracts live** — pointer to per-pair docs.

The bias throughout: **boundaries protect the operator's evidence
chain**. Every TerraFusion product produces or consumes work that
ultimately defends an assessor's number against appeal. Confused
boundaries produce confused evidence.

## Stack diagram

```text
                   Legacy DBs / PACS / CAMA / Excel / SQL
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ TerraFusion Sync  │   bridge: ingest, profile, map,
                          │   (the bridge)    │   canonicalize, prove, diagnose
                          └─────────┬─────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ TerraFusion       │   single source of truth:
                          │  canonical DB     │   canonical landing tables +
                          │                   │   provenance + audit
                          └─────────┬─────────┘
                                    │
        ┌─────────────┬─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Forge  │  │ TerraFlow│  │   Dais   │  │ Dossier  │  │TerraAtlas│
   │valuation│  │ workflow │  │ assessor │  │  appeal/ │  │   GIS    │
   │ + comps │  │  engine  │  │ task UX  │  │ evidence │  │  (ArcGIS)│
   └─────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
        │             │             │             │             │
        └─────────────┴─────────────┴─────────────┴─────────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ Workbench/Studio  │   shell + operator UX
                          │  (the storefront) │   for the products above
                          └───────────────────┘
```

Two non-obvious things this picture asserts:

- **TerraFlow is not above the products.** TerraFlow is a peer
  alongside Forge / Dais / Dossier / Atlas. It is a workflow product,
  not a meta-orchestrator that owns them.
- **Workbench / Studio is the shell.** It is where operators actually
  interact with everything else. It is not a product itself; it is
  where products are presented.

---

## 1. TerraFusion Sync

**What it is.**
The legacy-to-canonical bridge. Sync reads FROM the operator's
legacy CAMA/PACS database (Harris PACS 9.0 in Benton; per-county
dialects as additional counties onboard) and any supporting
operator-side artifacts (Excel exports, dashboard SQL, dictionary
tables). It profiles those sources, maps them via a Mapping
Workbook, runs source-to-canonical transforms, writes canonical
landing rows with provenance INTO TerraFusion DB, and exposes
read-only proof and diagnostic surfaces. ProVal and Ascend appear
only as historical conversion-provenance footnotes (prior systems
that shaped today's PACS data semantics); they are not active
runtime sources. Tyler Vision is NOT in scope and never was. The
destination is always TerraFusion DB; PACS is never a destination.
Sync is the bridge troll, not the mayor.

**Owns.**
- Source connection records (credentials, endpoints, scopes for
  legacy systems).
- Source profiling (schema discovery, row counts, sample harvesting).
- Source schema atlas (durable record of legacy table / column /
  type / cardinality).
- Dictionary / codebook discovery (`hood_cd`, `i_attr_id`,
  `imprv_det_type_cd`, etc.).
- Mapping Workbook data model (Draft → Mapped lifecycle, lock
  semantics, per-column mapping rows).
- Source-to-canonical transforms (e.g. `SalesQualificationCanonicalRunner`).
- Canonical landing tables (e.g. `CanonicalSaleQualifications`).
- Provenance (`SourceWorkbookId`, `SourceWorkbookLockedAt`, audit stamps).
- Idempotent reruns + supersession.
- Active workbook pointer (`SyncCountyActiveWorkbook`) and the
  C42 resolver (explicit > pointer > fail-closed).
- Stale-row diagnostics (per-row, per-group, summary).
- Read-only proof endpoints / CLI tools (admin/diagnostic surfaces).

**Does NOT own.**
- Comp selection UX, scoring, ranking, or consumer-facing comp APIs
  (→ Forge).
- Valuation logic of any kind (→ Forge).
- Ratio-study workflow (→ Forge / Dossier).
- Workflow definitions, runs, tasks, approvals, routing, state
  transitions (→ TerraFlow).
- Operator-facing dashboards or task surfaces (→ Workbench / Studio
  hosting Dais).
- Appeal / public-records evidence packet compilation (→ Dossier).
- GIS / parcel geometry / spatial joins (→ TerraAtlas).

**Handoff contracts.**
- `docs/sync/sync-boundary-policy.md` (SCOPE-1, authoritative scope)
- `docs/terraflow/sync-handoff.md` (SCOPE-1)
- `docs/forge/sync-comp-eligibility-handoff.md` (SCOPE-1)

---

## 2. TerraFlow

**What it is.**
The AI-native workflow engine and MVP product surface for TerraFusion
workflows. TerraFlow defines workflows (review mapping workbook,
approve property-use mappings, route assessor exception, remediate
stale canonical rows, sign off on a comp set), executes them with
mixed human + AI steps, persists run state, routes tasks, captures
approvals, and exposes its own UI/API for operators to drive workflow.
TerraFlow is **not** a Sync console. It is **not** a dashboard wrapper
around any single domain. It is its own product.

**Owns.**
- Workflow definitions (typed workflow templates with steps, branches,
  AI-assisted steps, human-input steps, approvals).
- Workflow runs (instantiated workflows, persisted state, history).
- Human task queues (per-operator, per-county, per-priority).
- AI-assisted workflow steps (LLM-in-the-loop, agent-in-the-loop).
- Approvals and sign-offs (single-operator, supervisor, multi-party).
- Routing and reassignment.
- State transitions and side effects.
- TerraFlow's own UI/API.
- Workflow audit narrative (the human-readable story across a run).
- Notifications driven by workflow state (email, in-app, calendar).

**Does NOT own.**
- Canonical data shapes or transforms (→ Sync).
- Valuation math, comp scoring, ratio statistics (→ Forge).
- Appeal-grade evidence compilation (→ Dossier).
- GIS visualization or geometry queries (→ TerraAtlas).
- Direct mutation of canonical rows (TerraFlow MUST go through the
  domain that owns the data — Sync for canonical landing rows; Forge
  for valuation outputs; etc.).
- Operator dashboards that aren't workflow-driven (→ Workbench /
  Studio + Dais).

**Handoff contracts.**
- `docs/terraflow/sync-handoff.md` (SCOPE-1)
- (Future: `docs/terraflow/forge-handoff.md`,
  `docs/terraflow/dais-handoff.md` when those domains stand up.)

---

## 3. Workbench / Studio

**What it is.**
The operator-facing shell. Workbench / Studio is the OS-shell window
through which an assessor or supervisor actually interacts with
TerraFusion. It hosts product surfaces (Forge views, Dais task lists,
TerraFlow workflow UIs, Atlas maps) inside a unified shell with
shared chrome, navigation, identity, county context, theming, and
keyboard model. Workbench is the dual-screen office model frozen in
the window contract; Studio is its rendering surface.

**Owns.**
- The OS-shell window contract (dock, sidebar, route table, frame
  semantics, multi-window coordination).
- Shared identity / county-context / theming.
- Shell-level chrome (top bar, status bar, notification tray).
- Module manifest + hosting of product UIs as windows.
- Operator preferences and layouts.
- Diagnostic / admin surfaces that don't belong to any single product.
- Cross-product navigation.

**Does NOT own.**
- Workflow definitions or runs (→ TerraFlow).
- Valuation or comp logic (→ Forge).
- Canonical data ingestion (→ Sync).
- Appeal evidence packets (→ Dossier).
- GIS rendering primitives (→ TerraAtlas — though Studio embeds
  Atlas-rendered views).
- Business logic of any kind. The shell is presentation +
  composition + identity, not behavior.

**Handoff contracts.**
- (Future: per-product hosting contracts when each product stands up
  its UI.)

---

## 4. Forge

**What it is.**
The valuation, comps, and ratio-study product. Forge consumes
canonical Sync data (sales, valuation, improvement, land), applies
the Benton Method (PRD/PRB cycles, percent-of-BIV feature
contributions, decile equity loops, market-calibrated cost
adjustments), produces valuation outputs, supports the appraiser in
selecting comps for a subject parcel, and generates ratio-study
artifacts. Forge is where the assessor's number actually gets made.

**Owns.**
- Comp pool construction (selection, scoring, ranking, weighting).
- Subject-to-comp similarity (location, neighborhood, improvement
  type, size, age, condition, time-of-sale).
- Per-county comp-rule overlays.
- Cost-approach math, market-approach math, income-approach math.
- The Benton Method implementation.
- Depreciation curves, calibration runs.
- Valuation outputs (PRD, PRB, decile equity tables, narrative inputs).
- Ratio-study workflow (sample selection, IAAO statistics,
  stratification, narrative output).
- Forge's own consumer-facing comp / valuation API.
- Forge's own cache + auth + pagination contracts (MAY mirror
  Sync's C45 pattern; Forge-defined).

**Does NOT own.**
- Canonical sale qualification, valuation, improvement, or land
  landing tables (→ Sync emits; Forge consumes).
- Workflow definitions (→ TerraFlow). If a Forge action needs a
  human approval step, that step lives in TerraFlow and calls Forge
  after approval.
- Operator UI shell (→ Workbench / Studio).
- GIS geometry queries (→ TerraAtlas).
- Appeal packet compilation (→ Dossier — Forge produces inputs;
  Dossier compiles).
- Task assignment / queues (→ Dais / TerraFlow).

**Handoff contracts.**
- `docs/forge/sync-comp-eligibility-handoff.md` (SCOPE-1)
- (Future: `docs/forge/terraflow-handoff.md`,
  `docs/forge/atlas-handoff.md`,
  `docs/forge/dossier-handoff.md`.)

---

## 5. Dais

**What it is.**
The assessor task and review surface. Dais is where an individual
assessor sees their work for the day: parcels needing review, comp
sets pending sign-off, exceptions, mapping decisions awaiting
operator input, calendar of upcoming valuation deadlines. Dais is the
assessor's desk. Forge produces the outputs; TerraFlow drives the
workflow; Sync feeds the data; Dais presents the day's work.

**Owns.**
- Per-assessor task lists (the operator-facing presentation of work
  TerraFlow has assigned).
- Per-parcel review surfaces (subject overview with comps, valuation,
  GIS, history).
- Operator notes and per-task scratchpad.
- Per-operator filters, saved views, sort orders.
- Day-level / week-level operator dashboards.
- Review sign-off UX (the button the assessor clicks; TerraFlow
  records the approval).

**Does NOT own.**
- Workflow definitions or routing logic (→ TerraFlow). Dais surfaces
  what TerraFlow has assigned; it does not decide assignment.
- Valuation or comp math (→ Forge). Dais surfaces Forge outputs.
- Canonical data (→ Sync).
- Appeal packets (→ Dossier).
- The shell / window chrome (→ Workbench / Studio). Dais runs
  inside Studio.

**Handoff contracts.**
- (Future: `docs/dais/terraflow-handoff.md`,
  `docs/dais/forge-handoff.md`.)

---

## 6. Dossier

**What it is.**
The appeal and public-records evidence packet product. Dossier
compiles defensible evidence packets for property-tax appeal,
disclosure requests, and public-records inquiries. A Dossier packet
is the artifact an assessor hands to a hearing officer or a citizen
that says "here is the parcel, here are the comps used, here is the
valuation math, here is the GIS context, here is the provenance
chain back to the source data."

**Owns.**
- Packet compilation logic (which Forge outputs, which Atlas views,
  which Sync provenance fields, which TerraFlow approvals end up in
  the packet).
- Packet templates (appeal, disclosure, public-records request,
  internal review).
- Packet rendering (PDF, HTML, archival formats).
- Packet versioning and immutable archival.
- Packet access control (who can request, who can view, who can
  redact).
- Packet audit trail (every packet generated is itself an auditable
  artifact).

**Does NOT own.**
- Valuation math, comp scoring (→ Forge — Dossier embeds outputs).
- Canonical data (→ Sync — Dossier surfaces provenance, doesn't
  produce it).
- Workflow (→ TerraFlow — packet generation MAY be a TerraFlow step,
  but workflow ownership stays in TerraFlow).
- Operator UX shell (→ Workbench / Studio).
- GIS rendering (→ TerraAtlas — Dossier embeds Atlas-rendered views).

**Handoff contracts.**
- (Future: `docs/dossier/forge-handoff.md`,
  `docs/dossier/atlas-handoff.md`,
  `docs/dossier/sync-handoff.md`.)

---

## 7. TerraAtlas

**What it is.**
The GIS surface. TerraAtlas provides parcel geometry, spatial joins,
basemaps, identify endpoints, neighborhood overlays, and any
map-driven UX that other TerraFusion products embed. Per the
operator's strategic lean, **TerraAtlas integrates with ArcGIS via
the official ArcGIS REST API** rather than rolling a homemade
shapefile parser. The interface stays narrow (`GetParcelGeometry`,
`IdentifyAt`, `QueryFeatures`, basemap proxy) so a fallback
provider could be slotted later if a county runs an open stack.

**Owns.**
- ArcGIS REST API client (feature services, geometry server, identify
  endpoints, tile services).
- Parcel geometry retrieval and caching.
- Spatial query primitives (point-in-polygon, nearest-N, within-radius).
- Map rendering primitives (basemap composition, layer ordering,
  symbology).
- Neighborhood / district / overlay surface management.
- GIS authentication and tenancy (per-county ArcGIS credentials,
  scope enforcement).
- The narrow `IGisService` interface that other TerraFusion products
  consume.

**Does NOT own.**
- Tabular property data (→ Sync canonical landing tables).
- Comp scoring or valuation (→ Forge).
- Workflow (→ TerraFlow).
- Appeal packets (→ Dossier — Atlas provides views; Dossier compiles).
- Task UX (→ Dais).
- The shell (→ Workbench / Studio).
- Custom shapefile parsing or geometry math reimplementation. If
  ArcGIS already does it, Atlas calls ArcGIS.

**Handoff contracts.**
- (Future: `docs/atlas/forge-handoff.md`,
  `docs/atlas/dossier-handoff.md`,
  `docs/atlas/dais-handoff.md`.)

---

## 8. Cross-domain handoff rules

These rules apply to every pair of domains above. If a slice violates
one of them, the slice is out of scope until reframed.

### 8.1 Direction of data flow

```text
Legacy → Sync → canonical DB → { Forge, Dais, Dossier, Atlas, TerraFlow }
                                          ↓
                                Workbench / Studio (shell)
```

- Sync emits to canonical tables. Other domains read.
- No domain other than Sync writes to canonical landing tables.
- Forge writes to Forge-owned tables (valuation outputs); other
  domains read those.
- Dossier writes to Dossier-owned tables (packets); other domains
  read those.
- TerraFlow writes to TerraFlow-owned tables (workflow runs, task
  state); other domains read those.

### 8.2 Direction of workflow

- TerraFlow is the only domain that defines and executes workflows.
- Other domains MAY emit events that TerraFlow subscribes to (e.g.
  Sync emits "workbook locked"; Forge emits "valuation calibrated";
  Dossier emits "packet generated"). The contract for each event is
  per-domain.
- Other domains MAY expose APIs that TerraFlow calls (e.g.
  TerraFlow calls `PUT /api/sync/active-workbook` after a
  rotation-approval workflow completes). The API stays domain-owned;
  TerraFlow is the caller, not the implementer.
- No domain other than TerraFlow defines workflow templates,
  persists run state, or routes tasks.

### 8.3 Direction of UX

- Workbench / Studio is the only shell.
- Other domains MAY provide window-renderable UIs (Forge windows,
  Dais task list, TerraFlow workflow runner, Atlas maps).
- Each product's UI lives in its own module, registered via the
  Workbench window contract.
- No product defines its own shell chrome, identity model, or
  cross-product navigation.

### 8.4 Direction of evidence

- The provenance chain is **canonical row → Forge output → Dossier
  packet**. Sync stamps `SourceWorkbookId` and
  `SourceWorkbookLockedAt`; Forge surfaces those plus its own
  calibration version; Dossier compiles both into the packet's
  audit appendix.
- Every appeal-grade artifact MUST trace back to a Sync canonical
  row via provenance.
- No domain MAY launder provenance (drop fields, anonymize,
  re-stamp). Provenance is append-only across the chain.

### 8.5 Direction of authentication / authorization

- Identity originates in the Workbench / Studio shell (operator login,
  county-context selection).
- Every product API enforces server-side `CountyId` from the
  authenticated principal — never from a request body.
- Cross-product calls carry the principal forward (no
  domain-internal "system user" that bypasses county isolation).
- Sovereign-county isolation is global and non-negotiable.

### 8.6 Direction of audit

- Every entity in every domain inherits the FISMA-HIGH
  `AuditableEntityInterceptor` pattern: `CreatedAt`, `CreatedBy`,
  `UpdatedAt`, `UpdatedBy` auto-populated, immutable from outside.
- Every cross-domain event is itself auditable.
- TerraFlow's run history is the human-readable audit narrative;
  per-domain audit stamps are the mechanical chain.

---

## 9. Forbidden ownership leaks (binding rule list)

This is the explicit "X must not implement Y" list. Every entry below
was either observed during the C-series drift, anticipated from
adjacent product ambitions, or named explicitly in user direction. A
slice that proposes any of these is rejected on boundary grounds and
opened in the correct domain instead.

| # | Forbidden | Correct owner | Why |
|---|---|---|---|
| 1 | Sync implements comp selection / scoring / ranking | Forge | Sync emits canonical rows; Forge decides what they are worth. |
| 2 | Sync implements workflow / approvals / task routing | TerraFlow | Sync owns the data mechanism; TerraFlow owns the human-and-AI process layer. |
| 3 | Sync implements operator dashboards (beyond admin / diagnostic) | Workbench / Studio + Dais | Sync produces; Studio presents; Dais routes per-operator. |
| 4 | Sync implements GIS / parcel geometry queries | TerraAtlas | Spatial concerns are an entire product surface, not a Sync side hustle. |
| 5 | Sync implements appeal-packet compilation | Dossier | Provenance flows out of Sync; packets are compiled in Dossier. |
| 6 | TerraFlow becomes a Sync admin console | Workbench / Studio | TerraFlow is a workflow product, not a UI wrapper around any single domain. |
| 7 | TerraFlow implements valuation math, comp scoring, ratio-study statistics | Forge | TerraFlow orchestrates Forge calls; it does not reimplement Forge. |
| 8 | TerraFlow writes directly to canonical landing tables | Sync | Workflow may trigger Sync APIs; it does not bypass them. |
| 9 | Forge defines workflow templates or owns task routing | TerraFlow | Forge produces outputs; TerraFlow routes the human work that consumes them. |
| 10 | Forge implements canonical ingestion or transforms | Sync | Forge consumes canonical data; it does not produce it. |
| 11 | Forge compiles appeal-grade packets | Dossier | Forge contributes outputs to packets; Dossier owns packet integrity. |
| 12 | Forge implements its own shell or cross-product navigation | Workbench / Studio | Forge is a product, not a shell. |
| 13 | Dais defines workflows or assigns work | TerraFlow | Dais presents what TerraFlow assigns; assignment logic is TerraFlow's. |
| 14 | Dais implements valuation, comps, or ratio statistics | Forge | Dais surfaces Forge outputs. |
| 15 | Dais owns GIS rendering primitives | TerraAtlas | Dais embeds Atlas views. |
| 16 | Dossier reimplements valuation, comp scoring, or ratio math | Forge | Dossier compiles Forge outputs verbatim with provenance; does not recompute. |
| 17 | Dossier defines workflows | TerraFlow | Packet generation may be a TerraFlow step; the template is TerraFlow's. |
| 18 | Dossier owns operator task queues | Dais / TerraFlow | Dossier is artifact-centric, not operator-centric. |
| 19 | TerraAtlas implements tabular property logic | Sync / Forge | Atlas is the spatial surface, not a duplicate property store. |
| 20 | TerraAtlas rolls a custom shapefile parser or geometry engine | ArcGIS REST API | Operator lean: meet counties where they are; ArcGIS is the integration target. |
| 21 | TerraAtlas owns workflow or appeal logic | TerraFlow / Dossier | Atlas provides views; other domains compile and route. |
| 22 | Workbench / Studio implements business logic of any kind | The owning product | The shell composes; it does not compute. |
| 23 | Any domain bypasses sovereign-county isolation | All | County isolation is global, server-side, principal-derived, non-negotiable. |
| 24 | Any domain modifies FISMA audit fields directly | All | `AuditableEntityInterceptor` is the only writer. |
| 25 | Any domain launders provenance across handoffs | All | Provenance is append-only; downstream products surface it, never strip it. |

---

## Acceptance for SCOPE-2

- `docs/architecture/terrafusion-domain-boundaries.md` exists and
  codifies the seven-domain map plus cross-domain rules and the
  forbidden-leak list.
- No code is modified anywhere.
- No domain bring-up code is written (TerraFlow, Forge, Dais,
  Dossier, Atlas all remain at their current implementation level —
  this slice does not advance any of them).
- Regression baseline preserved by construction.
- Future slices in any domain MUST cite this doc when proposing new
  ownership; ambiguous slices are biased out of the larger domain.

## Non-goals

- **No domain bring-up.** TerraFlow engine, Forge product surface,
  Dais task UI, Dossier packet pipeline, TerraAtlas ArcGIS adapter
  all remain unbuilt or partially-built; SCOPE-2 does not advance
  any of them.
- **No deprecation.** Every existing surface (including the C35–C47
  Sync proof endpoints reclassified by SCOPE-1) stays callable.
- **No rename / move / refactor.** Documentation only.
- **No tests.** Documentation only.

## Open questions (deferred to per-domain bring-up slices)

- **Cross-domain event bus design.** Sync emits "workbook locked";
  Forge emits "calibration complete"; TerraFlow subscribes. Whether
  this is in-process pub/sub, a durable event log, or polling is
  not decided here.
- **Forge's read access to canonical tables.** Direct EF Core
  (same DB) vs. dedicated Forge read API. Tradeoff between
  separation-of-concerns and coupling.
- **TerraFlow's persistence model.** Same DB / separate schema vs.
  separate DB. Auditability of workflow runs.
- **Studio module manifest evolution.** How new product UIs
  register; whether windows can host workflow steps mid-run.
- **TerraAtlas fallback provider.** Whether the narrow `IGisService`
  interface ever gets a non-ArcGIS implementation, and what county
  trigger would justify it.

These are bring-up concerns and get resolved in the slice that opens
each domain, not here.
