# TerraFusion OS — Constitutional Reconciliation Note

> **Document D** · Phase 0 Architecture · v1.0  
> **Type**: ADR Precursor (binding until superseded by formal ADR)  
> **Status**: GATE — Phase 1 code may not proceed until this document is accepted  
> **Locked decisions respected**: TF-050, TF-051, TF-052, ADR-0001, ADR-0002, ADR-0003  
> **Last updated**: 2026-03-14

---

## 1. Purpose

Resolve live implementation drift against locked v3.1 constitutional rules before Phase 1 code begins. This is a constitution patch note, not a strategy essay.

---

## 2. Locked Constitutional Truths

These are non-negotiable. Any code that violates them is unconstitutional and must be fixed.

| # | Truth | Source |
|---|-------|--------|
| T1 | Property Workbench is the OS-owned maximized **Tier-0** parcel workspace | TF-050 |
| T2 | Suites open as **near-full-stage** domain workspaces | TF-051 Shell Recovery |
| T3 | Tab order is locked: summary → forge → atlas → dais → clerk → treasury → audit → dossier → pilot | ADR-0001 |
| T4 | Each data domain has exactly **one write owner** | ADR-0002 |
| T5 | TerraTrace is **append-only** and immutable | ADR-0003 |
| T6 | Suite names are constitutional: TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraGPT | TF-052 |
| T7 | Clerk, Treasury, Audit, Recorder are **reserved future office suites** | TF-052 |
| T8 | Write lanes: Forge=valuation, Atlas=GIS, Dais=workflow/admin, Dossier=evidence, TerraTrace=audit | ADR-0002 |
| T9 | PII (SSN, phone, email, names) never appears in TerraTrace payloads | TF-052 §PII |
| T10 | Tool risk levels: write_high requires confirmation+reason; irreversible requires confirmation+reason+supervisor | TF-052 §Permissions |

---

## 3. Conflicts Observed

### 3.1 Workbench Sizing Drift

**Observation**: Some recent code treats Workbench as a resizable suite-like window rather than the maximized Tier-0 surface.

**Decision**: Canon remains. **Workbench = maximized Tier-0**. Suites = near-full-stage. Any suite-like Workbench behavior is drift unless a future ADR explicitly changes the contract.

**Forbidden**: Treating Workbench as a resizable window competing with suite windows for stage space.

### 3.2 Deep Parcel Tools Inside Workbench

**Observation**: Ambiguity about whether complex tools (full comp grid with map, income approach with lease-by-lease input) belong inside Workbench tabs or must be pushed to suite standalone homes.

**Decision**: Parcel-bound deep tools are **explicitly allowed** inside Workbench tabs when they:
- Operate on a single parcel (the Workbench context parcel)
- Do not require cross-parcel data browsing as a primary interaction
- Respect their suite's write lane

This makes full Sales and Income Forge sub-tabs constitutional. The "real UI in Workbench tabs" rule from TF-050 supports this — Workbench tabs must host the real interaction UI, not summary billboards.

**Forbidden**: Cross-parcel operational tools inside Workbench (batch model runs, regression, ratio studies, neighborhood delineation).

### 3.3 Role Visibility Ambiguity

**Observation**: No specification defines which roles see which tabs by default. All 9 tabs show for all users, creating noise.

**Decision**: Role visibility controls are **presentation defaults only**. They:
- Hide tabs that are noise for a role (e.g., Residential Appraiser doesn't need Clerk/Treasury/Audit)
- Never change ownership of data or capabilities
- Never mutate the canonical tab order (hidden tabs keep their constitutional position)
- Never gate access (any user can override defaults to show hidden tabs)
- Are defined in `config/workbenchRoles.ts` (Phase 2)

**Forbidden**: Using role visibility to enforce access control. RBAC is a separate domain (TerraPilot permission model).

### 3.4 Reserved Office Placeholder Confusion

**Observation**: Code implements Clerk, Treasury, and Audit as active Workbench tabs with `enabled: true`. This could be interpreted as constitutional suite claims for those offices.

**Decision**: Current Clerk/Treasury/Audit tabs are **transitional slot-surfaces only**. They:
- Are placeholder tab slots reserved for future office suites
- Are NOT constitutional suite claims
- Should be hidden by default for all assessor roles (Phase 2)
- Will become active when those office suites are built (future roadmap)

**Forbidden**: Building assessor-specific features inside Clerk/Treasury/Audit tabs. Reserving these tabs for assessor functions that don't belong to those future offices.

### 3.5 Cleanup Disposition Ambiguity

**Observation**: Previous cleanup discussions used only "archive" as a disposition, which destroys the distinction between "dead code to delete" and "future capability not yet built."

**Decision**: Four disposition categories (defined in Document C):
- `canonical-ui` — Active UI surface. Keep.
- `canonical-service` — Backend service. Keep.
- `future-module` — Planned, not built. Keep in registry, mark `runnable: false`, unpin.
- `retire/archive` — Absorbed by canonical surface or dead. Remove from launchpad.

**Forbidden**: Disposing of a module as `retire/archive` when it represents a planned future capability. Planned capabilities get `future-module`.

### 3.6 Suite/Repo/Service Overlap

**Observation**: Some modules exist as both a registry entry, a standalone app in a separate repo, and a Workbench-embedded component — three surfaces for one capability.

**Decision**: Consolidation must track **surface + repo + service** truth, not just UI deletion. The consolidation map (Document C) defines the canonical location for each capability. Phase 3 will reconcile:
- Registry entries → match canonical location
- Standalone apps → redirect or absorb into canonical surface
- Workbench components → verify they map to the correct Workbench tab/sub-tab

**Forbidden**: Deleting a registry entry without verifying the underlying service/repo is also handled. Consolidation is not just frontend cleanup.

---

## 4. Consolidation Scope Extension

### 4.1 Polyrepo Ownership Truth

The architecture describes a multi-repo environment. Phase 3 consolidation must include a **surface → repo → service** mapping to ensure:
- Each canonical surface has a clear repo home
- Dead repos are identified (not just dead modules)
- CI/CD pipelines match the consolidated surface list

### 4.2 GIS / GAMA / CAMA Seam Law

- **Atlas** owns GIS artifacts and neighborhood definitions (write lane: Atlas)
- **Forge** owns valuation artifacts and CAMA characteristics (write lane: Forge)
- **GAMA/CAMA sync is projection truth feeding Workbench** — it is not a reason to blur Atlas and Forge ownership
- The data pipeline is: CAMA source → OS Core projection → Workbench display → Suite editing within write lanes
- `terra-gama` is a future Atlas module for geographic market analysis, not a separate ownership domain

### 4.3 Spatial Valuation Placement

Spatial valuation straddles Atlas (GIS data) and Forge (valuation models). The rule:
- Spatial data layers → Atlas write lane
- Spatial analysis that produces valuation artifacts → Forge write lane
- Spatial visualization of Forge results (e.g., model residual maps) → rendered in Atlas standalone, data owned by Forge

### 4.4 Mass Appraisal Placement

Mass appraisal is NOT a side quest. It is Forge's constitutional mission: models, calibration, comps, analysis. The following are first-class Forge operational domains:
- Regression model building (MRA)
- Model calibration and coefficient management
- Ratio study execution
- Statistical qualification
- Outlier detection and review
- Batch valuation production runs

All live in **TerraForge standalone**, not Workbench (cross-parcel by definition). Statistics Studio and Regression Studio are Forge modules pending ADR naming.

---

## 5. Disposition Vocabulary

| Disposition | Definition | Registry Action | Launchpad Action |
|-------------|-----------|----------------|-----------------|
| `canonical-ui` | Active, canonical UI surface | Keep, ensure metadata correct | Visible |
| `canonical-service` | Backend service, no direct UI surface | Keep, mark `pinned: false` | Hidden |
| `future-module` | Planned capability, not yet implemented | Keep, `runnable: false`, `pinned: false` | Hidden |
| `retire/archive` | Absorbed by canonical surface or dead | Mark `intent: "archive"`, `pinned: false` | Hidden |

---

## 6. Gate for Phase 1

After this document is accepted, Phase 1 (Forge sub-tab restructure) may proceed with these constraints:

### Phase 1 MAY:
- Create `forge/` sub-directory with ForgeOverview, CostApproach, SalesComparison, IncomeApproach components
- Refactor PropertyForge.tsx from 1,035-line monolith to ~200-line sub-tab switcher
- Wrap existing ComparableSalesPanel.tsx and IncomeValuationPanel.tsx in sub-tab components
- Use CSS-hidden panel mounting for sub-tab switching (no unmount/remount)

### Phase 1 MAY NOT:
- Change the canonical tab order (ADR-0001)
- Rename any suite (TF-052)
- Create new URL routes for sub-tabs (internal state only)
- Bypass write-lane ownership (ADR-0002)
- Add cross-parcel tools inside Workbench

---

## 7. Open ADRs Still Needed

| ADR | Question | Impact |
|-----|----------|--------|
| ADR-0004 | Is Statistics Studio a TerraForge module or a separate OS workspace? | Determines route: `/forge/statistics` vs. `/statistics` |
| ADR-0005 | Is Regression Studio a TerraForge module or a separate OS workspace? | Determines route: `/forge/regression` vs. `/regression` |
| ADR-0006 | Is Management Dashboard a TerraDais module or an OS workspace? | Determines where county-wide admin views live |
| ADR-0007 | Should Workbench launch behavior change from maximized to configurable? | Only if there's a real use case for non-maximized Workbench |

---

## 8. The Binding Sentence

**Property Workbench remains the OS-owned maximized Tier-0 parcel workspace; suites remain near-full-stage domain workspaces; parcel-bound deep tools may be hosted inside Workbench when they do not violate write-lane ownership.**

---

*This document is the gate for Phase 1. No code before this note is accepted.*
