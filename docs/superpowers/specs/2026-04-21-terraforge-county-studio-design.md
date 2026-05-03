# TerraForge County Studio — Design Spec

**Date:** 2026-04-21
**Authors:** bsvalues (co-founder) + TerraFusion Elite Engineering Agent
**Status:** APPROVED — ready for implementation

---

## Product Thesis

TerraForge County Studio is a **segment-first countywide valuation workspace** for defining cohorts, testing adjustment scenarios, and seeing statistical and geographic impact in one linked environment.

- **Forge** owns analytical meaning and adjustment artifacts.
- **Atlas** renders live spatial projections and owns durable GIS outputs.
- **Dais** and **Dossier** receive downstream review and evidence outputs.
- **AI explains but does not decide.**

This is not a GIS app. Not a stats lab. Not an AI cockpit. It is the machine that takes countywide property valuation work — historically available only to PhD-level institutions with specialized tools — and makes it executable by county staff without sacrificing rigor or auditability.

---

## The Canonical Workflow (the one workflow that matters)

```
Open/Create Study
  → Load baseline segment set
  → Inspect segment table (metrics, stability, exceptions)
  → Select cohort (visual lasso OR rule-based OR hybrid)
  → Create scenario (adjustment type + magnitude + rationale)
  → Preview live impact (stats delta + map delta on Atlas Live View)
  → Decide: discard / save scenario / promote to AdjustmentSet / create ExceptionSet / publish to Atlas
```

If this loop is clean, the product is real. Everything else is support.

---

## Architecture

### Two Co-Present Surfaces

**County Studio** (Monitor 1, Forge authority)
- Owns the Study session lifecycle
- Owns cohorts, scenarios, adjustment sets, exception sets
- Segment table is the center of the UI — no map inside it
- Broadcasts live projections to Atlas Live View via SignalR

**Atlas Live View** (Monitor 2, Atlas authority)
- Renders spatial truth (map, geometry, overlays)
- Receives live projection events from Studio (metric overlays, scenario deltas, warnings)
- Returns selection intent to Studio (lasso geometry, parcel clicks, neighborhood selection)
- Never writes valuation state — sends intent only

### The Study Session Hub

Both surfaces subscribe to the same `StudyId` via a new `CountyStudyHub` (SignalR).
Pattern follows existing `CollaborationHub` in `TerraFusion.API/Hubs/`.

```
CountyStudyHub
  Groups: "Study_{StudyId}"
  Owner: county-studio
  Subscriber: atlas-live-view
```

### Sync State

Both windows show a visible sync state badge:
- **LIVE** — all channels active, co-present
- **STAGED** — commit channel paused
- **SNAPSHOT** — Atlas showing pinned projection, not live
- **DISCONNECTED** — Atlas not open or network dropped

---

## The Five Architecture Contracts

### Contract 1: Authority

| Owner | Authoritative For |
|---|---|
| County Studio (Forge) | Study state, cohorts, scenarios, adjustment sets, exception sets, all statistical metrics, warnings, provenance |
| Atlas Live View (Atlas) | Map rendering, spatial selection intent, viewport state, live overlay rendering, published GIS artifacts |

**The write-lane law:** Atlas can only emit *selection intent*. All consequential writes flow through Forge services. Atlas never writes valuation state. Forge never writes durable GIS artifacts directly.

### Contract 2: Session

| Tier | Contents | Storage |
|---|---|---|
| **Persistent** | CountyStudySession, Cohort (on commit), Scenario (on save), AdjustmentSet, ExceptionSet, PublishedSpatialArtifact | TerraFusionDbContext (EF Core) |
| **Ephemeral** | Hover/focus state, active metric, temporary overlay projections, scenario parameter edits pre-save, map viewport, warnings (computed) | SignalR hub in-memory + Zustand |
| **Staged** | Cohort draft pre-confirm, lasso geometry pre-name, candidate boundary pre-publish | Staged channel — requires one confirm dialog |
| **Committed** | Named cohort, saved scenario, promoted adjustment set, published spatial artifact | DB after explicit user confirmation |

### Contract 3: Event Channels

**A — Presence** (instant, bidirectional)
- `presence:segment-hover` `{ studyId, segmentId }`
- `presence:segment-select` `{ studyId, segmentId }`
- `presence:parcel-focus` `{ studyId, parcelId, source }`
- `presence:viewport-sync` `{ studyId, bbox, zoom }` — *linked mode only*

**B — Projection** (instant, Forge → Atlas only)
- `projection:metric-overlay` `{ studyId, metricKey, values[], styleHints }`
- `projection:scenario-delta` `{ studyId, scenarioId, deltas[], cohortBbox }` — debounced 250ms
- `projection:edge-warnings` `{ studyId, warnings[{ boundaryId, severity }] }`
- `projection:cohort-shade` `{ studyId, cohortId, parcelIds[], style }`
- `projection:compare-overlay` `{ studyId, compareTarget, overlayData }`
- `projection:clear` `{ studyId, layerIds[]? }`

**C — Selection** (staged, Atlas → Forge only)
- `selection:drawn-geometry` `{ studyId, geometry: GeoJSON, parcelCount, areaEstimate }`
- `selection:parcel-ids` `{ studyId, parcelIds[], source: 'click'|'lasso'|'box' }`
- `selection:neighborhood-ids` `{ studyId, neighborhoodIds[] }`
- `selection:geography-candidate` `{ studyId, geometry: GeoJSON, candidateName, notes }`

**D — Commit** (confirm-required, Forge writes only)
- `commit:create-cohort` `{ studyId, name, selectionType, definition, parcelIds?, geometry? }`
- `commit:save-scenario` `{ studyId, cohortId, adjustmentType, parameters, rationale }`
- `commit:promote-adjustment` `{ studyId, scenarioId, effectiveScope, approvedBy? }`
- `commit:publish-to-atlas` `{ studyId, scenarioId, geometry, artifactType, publishedBy }`
- `commit:create-exception-set` `{ studyId, scenarioId, reasonCode, parcelIds }`

### Contract 4: Persistence

**New entities — added to TerraFusionDbContext:**

All entities follow TerraFusion FISMA pattern: `Guid` PK, `CountyId` isolation, `CreatedAt/By` + `UpdatedAt/By` audit fields, registered in `TerraFusionDbContext`.

```csharp
CountyStudySession   // StudyId, CountyId, TaxYear, StudyType, BaselineVersion, ActiveSegmentSetId, Status
SegmentSet           // SegmentSetId, StudyId, Name, SourceType, Version, IsBaseline, DerivedFrom
Segment              // SegmentId, SegmentSetId, Name, SegmentType, RuleDefinition(JSON), GeographyRef,
                     //   ParcelCount, MedianRatio, COD, PRD, StabilityScore, RiskScore, ExceptionCount
Cohort               // CohortId, StudyId, Name, SelectionType, Definition(JSON), ParcelCount, IsHybrid
Scenario             // ScenarioId, StudyId, CohortId, AdjustmentType, Parameters(JSON), Rationale, Status
AdjustmentSet        // AdjustmentSetId, StudyId, ScenarioId, EffectiveScope, ApprovalState, RollbackToken, PublishedAt
ExceptionSet         // ExceptionSetId, StudyId, SourceScenarioId, ReasonCode, ParcelIds(JSON), ParcelCount, Destination, Status
PublishedSpatialArtifact  // ArtifactId, StudyId, SourceScenarioId, AtlasLayerId, ArtifactType, Version, PublishedBy
                          // Lives in TerraFusion.Core/Entities/ — Atlas-scoped, CountyId-isolated
```

Note: `SegmentSet` and `Segment` are stored (not computed on the fly) because `StabilityScore`, `RiskScore`, and `ExceptionCount` are computed analytics results that must persist for compare-to-baseline and provenance. They are computed when a segment set is created or refreshed.

**Never persisted (no table, ever):**
Hover state · map viewport · temporary overlay paint · transient selection pre-cohort · scenario keystrokes pre-save · active metric selection · computed warnings

### Contract 5: Module

| Module | Role | Authority | Window | Hub Role |
|---|---|---|---|---|
| `county-studio` | Primary analytical workspace | Forge | Monitor 1 | SESSION OWNER |
| `atlas-live-view` | Study-aware spatial surface | Atlas | Monitor 2 | SESSION SUBSCRIBER |

- Studio creates the `StudyId` and opens `CountyStudyHub` group
- Atlas opens independently via `desktopStore.openModule('atlas-live-view', { studyId })` and subscribes
- Studio does not know if Atlas is open — it broadcasts regardless
- Both register in `moduleRegistryStore` via plugin manifests
- `atlas-live-view` reuses GeoForge v2 Mapbox GL JS infrastructure
- New Zustand stores: `countyStudioStore`, `atlasLiveStore`

---

## Object Model

### First-Class Entities

```
CountyStudySession
  ├── SegmentSet (reference — existing or new)
  ├── Cohort[] (committed cohorts)
  └── Scenario[]
        ├── AdjustmentSet (promoted from Scenario)
        └── ExceptionSet (created from Scenario)

PublishedSpatialArtifact (Atlas-owned, sourced from Scenario)
```

### Governance States

**Scenario:** `Draft → Saved → Reviewed → Approved → Promoted | Rejected | Archived`

**AdjustmentSet:** `Proposed → ReadyForApproval → Approved → Published → RolledBack`

**SpatialArtifact (Atlas):** `Preview → Candidate → Published → Superseded`

---

## UI Layout

### County Studio (no map)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TerraForge County Studio │ Benton County · 2026 Ratio Study · March     │
│                          │ Baseline · 14 segments    ● ATLAS DISCONNECTED│
│                          │                           [↗ Open Atlas Live] │
├──────────────┬─────────────────────────────────────┬────────────────────┤
│ LEFT RAIL    │  SECTION TABS                       │  RIGHT RAIL        │
│ Studies      │  Overview│Ratio Study│Neighborhoods  │  Inspector         │
│ Segment Sets │  Adjustments│Exceptions│Compliance   │  (selected object) │
│ Cohorts      ├─────────────────────────────────────┤  Scenario          │
│ Scenarios    │  SEGMENT TABLE (center)             │  Worksheet         │
│ Snapshots    │  Segment│Parcels│Ratio│COD│Stability │                    │
│              │  ─────────────────────────────────  │  Warnings          │
│              │  rows, sortable, color-coded metrics │                    │
│              │  one row selected → right rail loads │  AI Explain        │
│              ├─────────────────────────────────────┤                    │
│              │  BOTTOM DECK                        │  Publish Actions   │
│              │  Distribution│Before/After│Warnings  │                    │
└──────────────┴─────────────────────────────────────┴────────────────────┘
```

### Atlas Live View (map only, no analytics)

```
┌─────────────────────────────────────────────────────────────┐
│ Atlas Live View │ Study: Benton 2026 Ratio  ● LIVE          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    MAPBOX MAP (full surface)                │
│                    - active metric overlay                  │
│                    - scenario delta paint                   │
│                    - cohort shading                         │
│                    - edge warning markers                   │
│                                                             │
│  [Lasso Tool]  [Click-Select]  [Pin Overlay]  [Publish →]  │
│                                                             │
│  Active Overlay: Scenario Delta — +4% West Richland R1     │
└─────────────────────────────────────────────────────────────┘
```

---

## V1 Scope

### In scope

**Core workflow:**
- Create/open study with county, tax year, study type, baseline scope
- Load and display baseline segment set
- Inspect segment table (metrics, stability, exceptions, compare-to-baseline)
- Linked Atlas Live View on monitor 2 (co-present session)
- Visual + rule-based cohort creation (lasso, polygon, neighborhood click, hybrid rules)
- Scenario creation (type, magnitude, rationale)
- Live preview of stats + map deltas (debounced 250ms)
- Save scenario
- Promote to AdjustmentSet
- Create ExceptionSet
- Publish neighborhood candidate to Atlas as PublishedSpatialArtifact
- AI explain: segment instability, metric meaning, scenario impact, warnings
- Basic provenance log

**Minimum warnings:**
- Low sample warning (n < 30 near boundary)
- Segment instability warning (stability score < 60)
- Edge/spillover warning
- Heterogeneity warning
- Publish readiness check (COD > 20, PRD out of range, etc.)

**Minimum compare:**
- Baseline vs active scenario
- Current vs previous snapshot

### Explicitly out of scope (V1)

- Full parcel workflow inside the Studio
- Full GIS editing suite
- Universal AI assistant everywhere
- Deep model-construction environment
- Too many compare modes
- Automatic "recommended adjustments"
- Direct workflow orchestration inside the Studio
- Full evidence packet builder
- Deep multi-user collaborative editing

---

## Build Sequence (phases)

### Phase 1 — Workflow Spine (backend + studio)
Study → Segment table → CountyStudyHub → Cohort creation → Scenario preview

### Phase 2 — Controlled Outputs
AdjustmentSet promotion · ExceptionSet creation · Atlas publish for candidate geographies · Provenance log · Atlas Live View module

### Phase 3 — Governance Hardening
Approval states · Permissions · Rollback · Publish readiness checks

### Phase 4 — Smart Assistance
AI explain layer · Warning summarization · Cohort quality guidance · Scenario risk summary

---

## Success Criteria

A county user can:
1. Open a countywide study
2. See which segments are weak or unstable
3. Select a meaningful cohort visually or by rule
4. Test an adjustment without fear
5. Immediately see numerical and map consequences
6. Create exception sets from the result
7. Promote a real adjustment artifact cleanly
8. Publish only intentional spatial artifacts
9. Explain what they changed and why

If they can do that, this is not bullshit anymore.

---

## Technical Context

**Frontend:** React 18.3 + TypeScript 5.3, Vite, Zustand, TanStack Query v5, shadcn/ui, Mapbox GL JS
**Backend:** .NET 8, EF Core 8, SignalR 8, PostgreSQL
**Hub pattern:** Follows `CollaborationHub` in `TerraFusion.API/Hubs/`
**Entity pattern:** FISMA audit fields, Guid PK, CountyId isolation — follows all existing entities
**Module pattern:** Plugin manifest + `moduleRegistryStore` — follows `gis-core`, `costforge-ai`
**Map infrastructure:** GeoForge v2 Mapbox GL JS — `atlas-live-view` reuses this
**Module location:** `frontend/apps/os-shell/src/pages/forge/county-studio/` and `frontend/apps/os-shell/src/pages/forge/atlas-live/`
**Hub location:** `backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs`
**Entities location:** `backend/src/TerraFusion.Core/Entities/` (Core) + `TerraFusion.Data/TerraFusionDbContext.cs`
