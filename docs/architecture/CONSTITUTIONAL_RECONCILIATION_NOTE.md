# TerraFusion OS — Constitutional Reconciliation Note

> **Document D** · Phase 0 Architecture · v1.1
> **Status**: GATE PASSED — Phase 1-3 complete, Phase 4A blessed, Phase 4B authorized
> **Locked decisions respected**: TF-050, TF-051, TF-052, ADR-001, ADR-002, ADR-003
> **Prerequisites**: Document A (v2.0), Document B (v2.0), Document C (v2.0)
> **Last updated**: 2026-03-14 (v1.1 — polyrepo reconciliation addendum)

---

## 1. Purpose

Resolve live implementation drift against locked v3.1 constitutional rules before Phase 1 code begins. This document is short, declarative, and binding. It is not philosophy.

---

## 2. Locked Constitutional Truths

These are non-negotiable. Any code violating them is rejected.

| # | Truth | Source |
|---|-------|--------|
| 1 | Property Workbench = **maximized** Tier-0 OS Surface | TF-050 §3 |
| 2 | Suites = **near-full-stage** domain workspaces | TF-050 §3 |
| 3 | Tab order: Summary → Forge → Atlas → Dais → [future offices] → Dossier → Pilot | TF-052 Art. IV |
| 4 | 5 Constitutional Suites: TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraGPT | TF-052 Art. I §1.1 |
| 5 | 3 OS Features: TerraPilot, TerraTrace, TerraCanon | TF-052 Art. I §1.2 |
| 6 | Write-Lane Matrix: each suite owns exactly one data domain | TF-052 / ADR-0002 |
| 7 | Reserved future offices: TerraClerk, TerraTreasury, TerraAudit, TerraRecorder | TF-052 Art. I §1.3 |
| 8 | Parcel-bound deep tools may live inside Workbench tabs (real UI, not billboards) | TF-050 §5 |
| 9 | TerraTrace = append-only immutable audit spine | ADR-0003 |
| 10 | Forge owns: valuation models, cost/income/comps, CAMA characteristics, calibration | TF-052 Art. III |
| 11 | Atlas owns: GIS layers, parcel boundaries, spatial annotations, neighborhood definitions | TF-052 Art. III |
| 12 | Dais owns: permits, exemptions, appeals, notices, certification, workflow states | TF-052 Art. III |
| 13 | Dossier owns: documents, narratives, evidence, packets, case files | TF-052 Art. III |

---

## 3. Conflicts Observed & Resolved

### Conflict 1: Workbench Sizing

- **Observed**: Recent implementation work proposed Workbench opening as near-full-stage (like suites).
- **Decision**: **Workbench = maximized Tier-0.** Suites = near-full-stage. This is canon per TF-050 §3.
- **Forbidden**: Opening Workbench as a draggable window unless a future ADR changes the launch contract.

### Conflict 2: Deep Tools Inside Workbench

- **Observed**: Debate over whether ComparableSalesPanel (612 lines) and IncomeValuationPanel (555 lines) belong inside Workbench or in standalone apps.
- **Decision**: **Parcel-bound deep tools are constitutional inside Workbench tabs.** TF-050 says Workbench tabs host "real interaction UI." Both panels are parcel-scoped and operate within Forge's write lane.
- **Forbidden**: Embedding cross-parcel tools (ratio studies, batch model runs, regression builder) inside Workbench.

### Conflict 3: Role Visibility

- **Observed**: Plan proposes role-based tab filtering.
- **Decision**: **Visibility = presentation defaults only.** Never ownership. Never canonical tab order mutation. Never reservation drift for future offices. User override always available in settings.
- **Forbidden**: Hard-locking tabs away from any role. Changing tab order per role.

### Conflict 4: Reserved Office Slots

- **Observed**: PropertyClerk.tsx, PropertyTreasury.tsx, PropertyAudit.tsx exist as implemented tabs.
- **Decision**: **These are transitional slot-surfaces**, not constitutional suite claims. They occupy the reserved future-office positions in tab order. When TerraClerk / TerraTreasury / TerraAudit are constitutionally chartered, these tabs become those suites' Workbench views.
- **Forbidden**: Treating these tabs as Assessor-owned suite functionality.

### Conflict 5: Cleanup Disposition Vocabulary

- **Observed**: Prior plans proposed "archive everything" not needed.
- **Decision**: **Use the four-label disposition vocabulary**: `canonical-ui`, `canonical-service`, `future-module`, `retire/archive`. Each surface gets exactly one label. See Document C §Module Registry Disposition for the full assignment.
- **Forbidden**: Archiving something canonical. Keeping something retired.

### Conflict 6: Suite/Repo/Service Overlap

- **Observed**: Multiple external apps (ports 5176, 5178, 4201, 3007, 5183) duplicate constitutional suite functionality. 103+ registered surfaces with massive overlap identified in Document C.
- **Decision**: **Consolidation must track surface → repo → service**, not just UI deletion. Document C v2.0 §Surface → Repo → Service Consolidation Matrix provides the 40-row truth table. Each absorbed app needs its service-layer capabilities verified before the external app retires.
- **Forbidden**: Deleting an external app before confirming its service capabilities exist in the canonical stack.

---

## 4. Consolidation Scope

### GIS / GAMA / CAMA Seams

- Atlas owns GIS artifacts and neighborhood definitions (Write Lane: Atlas).
- Forge owns valuation artifacts and CAMA characteristics (Write Lane: Forge).
- GAMA/CAMA sync is projection truth feeding Workbench — not a reason to blur Atlas/Forge ownership.
- Spatial analysis lives in Atlas. Spatial-derived valuation adjustments (location factors, neighborhood codes) are Atlas projections consumed by Forge models. **Atlas writes spatial data; Forge reads it.**

### Mass Appraisal

- Mass appraisal is a **first-class Forge operational domain**.
- Models, calibration, comps, ratio analysis, qualification workflows all belong in Forge's constitutional mission.
- Statistics Studio (ADR-001) and Regression Studio (ADR-002) are TerraForge standalone suite modules (accepted 2026-03-14).

### Document C Findings Summary

Per Document C v2.0:
- **6 surfaces ready or pending retirement** (2 parity-verified, 4 blocked)
- **16 placeholder surfaces with no backend** (registered UI, no service)
- **7 duplicate overlap clusters** resolved
- **5 binding conflict resolutions** issued
- **11 capabilities with no surface** (high-priority gaps)
- **95+ repos classified**: 1 canonical, 9 feeder, 2 showcase, 5 predecessor, 6 pending

### Document B Findings Summary

Per Document B v2.0:
- **28 schema gaps** identified across 12 sections
- **12 critical gaps** blocking Phase 1 (land segments, comp adjustments, reconciliation weights)
- **11 important gaps** blocking Phase 2-3 (multi-owner, exemptions, permits, appeals, workflow)
- **5 future gaps** for Phase 4+
- **3 type mismatches** requiring migration (bathrooms int→decimal, naming alignment)

---

## 5. Polyrepo Consolidation Rule

No legacy repo or external app may be retired, archived, or deleted until:

1. Its **unique service-layer capabilities** are enumerated in the Document C Consolidation Matrix
2. Each capability has a **verified equivalent** in the canonical stack (`terrafusion_os_1.0` backend or frontend services)
3. The "Service Parity Verified?" column is marked ✅ for every capability row

UI absorption (wrapping a panel, moving a component) does NOT constitute retirement. The backing service, data access, and business logic must also have canonical homes.

> **Binding sentence**: Consolidation is complete only when each capability has one canonical surface, one canonical repo home, and one verified service implementation; UI absorption alone is not sufficient for retirement.

### Polyrepo Reconciliation Addendum (2026-03-14)

Full polyrepo inventory (95+ repos, 32 private) has been enumerated and classified in Document C v2.0 §Repo Classification and §Surface → Repo → Service Consolidation Matrix. The following reinforcing rules apply:

1. **Phase 3 must reconcile surface + repo + service** for every row in the Document C consolidation matrix before any retirement action.
2. **No repo or external app may be retired** without verified parity per the matrix — this includes active private repos that may have overlapping functionality.
3. **Repos classified as "provisional" or "unknown"** remain in that status until manually inspected. Active private repos (e.g., `terra-forge-rebuild`, `TerraFusion-Valuator-Pro-Studio`, `WashingtonForge`) are **NOT assumed canonical** without inspection and parity proof — the current constitutional and consolidation truth centers canonical UI in `terrafusion_os_1.0`.

---

## 6. Open ADRs

### Resolved

| ADR | Question | Resolution | Accepted |
|-----|----------|-----------|----------|
| ADR-001 | Is Statistics Studio a TerraForge module or a new OS workspace? | **TerraForge standalone suite module.** Cross-parcel ratio studies are Forge write-lane (TF-052). Doc A confirms Mass Appraisal Analyst's primary workspace. | 2026-03-14 |
| ADR-002 | Is Regression Studio a TerraForge module or a new OS workspace? | **TerraForge standalone suite module.** MRA/GWR model building is Forge write-lane (TF-052). Doc A confirms Mass Appraisal Analyst's primary workspace. | 2026-03-14 |
| ADR-003 | Is Management Dashboard a TerraDais module or OS workspace? | **TerraDais standalone suite module.** Office-wide workflow/certification is Dais write-lane (TF-052). Doc A confirms Assessor/Deputy primary workspace. Boundary: Dais Management Dashboard = assessor operations (queues, assignments, certification, progress). Infrastructure/system health dashboards belong to TerraCanon / OS Admin (IT Director domain). | 2026-03-14 |

### Still Open

| ADR | Question | Blocks |
|-----|----------|--------|
| ADR-TBD-4 | How does Business Personal Property (account-centric, not parcel-centric) fit the OS model? | Future |
| ADR-TBD-5 | Is `TerraCanon` an OS Feature (per TF-052 §1.2) or an IDE workspace? What infrastructure/system health dashboards does it own vs. Dais? | Phase 4 |

---

## 7. Gate Statement

### Phase 1 is AUTHORIZED to:

- Restructure `PropertyForge.tsx` from 1,035-line monolith into ~200-line sub-tab switcher
- Create `forge/` subdirectory with `ForgeOverview.tsx`, `CostApproach.tsx`, `SalesComparison.tsx`, `IncomeApproach.tsx`
- Wire existing `ComparableSalesPanel` and `IncomeValuationPanel` as sub-tab content (no changes to those components)
- Extract governed AI tools from current `PropertyForge.tsx` into appropriate sub-views
- Use CSS-hidden mounting (not unmount/remount) to preserve panel state across sub-tab switches

### Phase 1 is FORBIDDEN from:

- Changing constitutional suite names or tab order
- Bypassing write-lane ownership
- Renaming suites or creating new suite registrations
- Changing Workbench launch behavior (must stay maximized)
- Modifying `suiteRegistry.ts` governance entries
- Touching any component outside the Forge tab restructuring scope
- Retiring any surface without parity verification per §5

### The Constitutional Sentence

> Property Workbench remains the OS-owned maximized Tier-0 parcel workspace; suites remain near-full-stage domain workspaces; parcel-bound deep tools may be hosted inside Workbench when they do not violate write-lane ownership.

---

## Document Cross-References

| Document | Version | Location | Purpose |
|----------|---------|----------|---------|
| **A — County Work Taxonomy** | v2.0 | `docs/architecture/COUNTY_WORK_TAXONOMY.md` | 12 roles, tab visibility, proof obligations |
| **B — Parcel Case Schema** | v2.0 | `docs/architecture/PARCEL_CASE_SCHEMA.md` | Field-level schema, backend entity mapping, 28 gaps |
| **C — Capability Placement Map** | v2.1 | `docs/architecture/CAPABILITY_PLACEMENT_MAP.md` | 40-row consolidation matrix, repo classification, gap analysis |
| **D — This Document** | v1.1 | `docs/architecture/CONSTITUTIONAL_RECONCILIATION_NOTE.md` | Conflict resolution, gate authorization, ADR tracking |
| **TF-050** | v3.0 | `docs/architecture/PROPERTY_WORKBENCH_SPEC_v3.md` | Workbench specification |
| **TF-051** | v3.0 | `docs/architecture/TERRAPILOT_SPEC_v3.md` | Pilot specification |
| **TF-052** | v1.0 | `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` | Suite constitution |

---

*Government. Transcended.*
