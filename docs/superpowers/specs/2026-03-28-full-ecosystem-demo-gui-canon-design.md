# TerraFusion OS Full-Ecosystem Demo GUI Canon

**Date**: 2026-03-28  
**Status**: Drafted for immediate use  
**Authority**: Founder direction + 2026-03-28 design audit implementation  
**Supersedes as GUI canon**: ad hoc slice-level visual assumptions in Phase 34 and Phase 35 execution plans

---

## Purpose

Define one authoritative GUI and interaction canon for the full TerraFusion OS client demo.

This spec is the source of truth for how visible surfaces are classified, disclosed, hosted, and proven. Runtime wiring, stub elimination, and proof work must follow this canon rather than invent local page-level rules.

---

## Canonical Rules

1. Suite homes are orchestration surfaces, not fake mini-applications.
2. Parcel-scoped work lives inside the Property Workbench unless a surface is explicitly county-wide.
3. Every visible surface declares exactly one truth state: `live`, `queued`, or `unavailable`.
4. `queued` and `unavailable` are intentional UX states, not fallback clutter.
5. No surface may visually imply "live" without runtime proof.
6. Shared disclosure, badge, and shell/window patterns are mandatory across visible surfaces.
7. Demo breadth is allowed, but only with truthful state labeling. Faux-complete UI is prohibited.

---

## Planning Contracts

These contracts are mandatory for planning, audits, and future implementation.

```ts
type SurfaceTruthState = 'live' | 'queued' | 'unavailable';

type SurfaceHostType =
  | 'suite-home'
  | 'workbench-tab'
  | 'standalone-window'
  | 'bounded-workspace';

type DemoReadinessTier = 'must-be-live' | 'may-be-queued' | 'hide';

type ParcelScope = 'parcel' | 'county' | 'system';

type AIRole = 'native-ai' | 'assisted' | 'non-ai';

type LaunchContract = {
  hostType: SurfaceHostType;
  routeOrWindow: string;
  parcelRequired: boolean;
  sourceDisclosureRequired: boolean;
};

type VisualContract = {
  archetype:
    | 'shell-desktop'
    | 'suite-home'
    | 'workbench-tab'
    | 'standalone-module'
    | 'bounded-workspace'
    | 'governance-surface';
  requiresHeader: boolean;
  requiresKPIBand: boolean;
  requiresModuleHierarchy: boolean;
  requiresOperationalContext: boolean;
  requiresTruthDisclosure: boolean;
  emptyStatePolicy: 'intentional' | 'not-applicable';
  loadingStatePolicy: 'skeleton-or-status' | 'not-applicable';
  errorStatePolicy: 'inline-alert' | 'boundary-only';
};
```

No surface opens new implementation work until these fields are filled in the matrix.

---

## Truth State Semantics

### `live`

- Real route or window launch works
- Required backend or service dependency is reachable
- Surface data is runtime-backed for its claimed behavior
- No fixture banner or fake KPI language is present
- Visual disclosure may still note partial dependency limits, but the surface is demo-safe

### `queued`

- Surface is intentionally visible in the client demo
- Surface design is complete enough to communicate purpose and planned host
- Surface must explicitly say what is live now and what remains queued
- No hardcoded analytics or faux production claims are allowed
- Entry points may remain visible if they do not misrepresent readiness

### `unavailable`

- Surface is visible only when the product needs to show the capability gap honestly
- UI must use an intentional unavailable state with an explanation of the missing dependency
- No spinner loops, fake results, or fake activity summaries

---

## Surface Archetypes

### Shell/Desktop

Required:
- Stable desktop chrome and launch grammar
- Truthful icon, launcher, and status signaling
- Window classes that reflect actual host intent
- No icon or launcher that implies a live route when only a queued state exists

### Suite Home

Required:
- Suite identity header
- County or system KPI band when applicable
- Primary versus secondary module hierarchy
- Operational context area such as queue, recent parcels, or work intake
- Source disclosure whenever the KPI band or summary data is not live

Forbidden:
- Pretending to be the execution surface for parcel work
- Launch cards that imply live capability without matching truth state

### Property Workbench

Required:
- Stable visual frame
- Role-aware tab visibility
- Traceable quick actions
- Explicit truth disclosure inside tabs
- Parcel context always present

Forbidden:
- Parcel-scoped tools escaping to standalone hosts without explicit exception
- Tab content silently mixing fake and live data

### Standalone Module

Required:
- Must justify county-wide or system-wide hosting
- Must have a clear live, queued, or unavailable disclosure
- Must use shell-consistent header and operational framing

Forbidden:
- County-wide dashboards with fabricated analytics
- Demo cards that look complete but are actually placeholder shells

### Bounded Workspace

Applies to GPT and Canon.

Required:
- Explicit "live now" versus "planned next" navigation states
- Honest bounded scope language
- No hidden prototype detours

### Governance Surface

Applies to admin, monitoring, trace, pilot, and governance pages exposed in-shell.

Required:
- Same shell canon as product suites
- Same truth-state discipline as product surfaces
- No exemption from disclosure because a page is "internal"

---

## Demo Tranches

### Tranche 1: Visual System

Lock:
- shell desktop archetype
- suite-home archetype
- workbench archetype
- standalone-module archetype
- bounded-workspace archetype
- governance-surface archetype

### Tranche 2: Ecosystem Truth Audit

For every visible surface, classify:
- already aligned
- runtime-real but visually misaligned
- visually present but not truthfully wired
- missing or placeholder and not demo-safe

### Tranche 3: Demo Realization

Priority order:
1. Shell and launch surfaces
2. Suite homes
3. Property Workbench tabs
4. Standalone modules surfaced by suite homes
5. GPT bounded workspace
6. Canon and governance/admin/monitoring pages in the demo path

### Tranche 4: Proof

No demo-visible surface is ready until it passes:
- visual acceptance
- runtime acceptance
- honesty acceptance
- design-system acceptance
- demo-flow acceptance

---

## Acceptance Gates

### Visual Acceptance

- Surface matches its archetype
- Header, KPI, module hierarchy, and disclosure are present where required
- Screenshot evidence exists for demo review

### Runtime Acceptance

- Route or window launch works
- Required service dependency is reachable
- Claimed live data renders without fixture substitution

### Honesty Acceptance

- Surface copy does not overstate readiness
- Badges and disclosures match the actual truth state
- Demo cards do not claim future capabilities as present capabilities

### Design-System Acceptance

- Shared disclosure components are used
- Token discipline does not regress
- New surfaces do not add ad hoc styling patterns that diverge from shell canon

### Demo-Flow Acceptance

- User can move from shell to suite to module to workbench or bounded workspace without misleading dead ends

---

## Relationship To Existing Plans

- [2026-03-27-phase34-copilot-lanes.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-27-phase34-copilot-lanes.md) remains a bounded execution ledger for proven wiring and seals.
- [2026-03-27-phase35-parallel-stub-elimination.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-27-phase35-parallel-stub-elimination.md) remains a bounded execution wave for stub removal and runtime proof.
- Neither document is the top-level GUI canon.
- The surface matrix in [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md) is the master demo inventory.
