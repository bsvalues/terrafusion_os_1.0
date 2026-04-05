# TerraForge — Suite-Forge

**Constitutional Suite: forge (Article I)**
**Layer tag:** Suite-Forge
**Architecture:** Layer 3 — Domain router + cross-parcel operational workspace

> "Does NOT host parcel execution — that lives in the Property Workbench."
> — `ForgeSuiteHome.tsx` file header

---

## What TerraForge Is (from ForgeSuiteHome.tsx)

TerraForge is the **county-wide valuation suite** — a cross-parcel operational workspace for appraisers. It is not a parcel detail surface.

**Primary modules (standalone launch):**
- **CostForge** — Benton County Cost Approach, replacement cost, depreciation, RCNLD
- **Statistics Studio** — Ratio studies, COD/PRD/PRB, IAAO statistical diagnostics
- **Batch Cost Runs** — County-wide cost model runs with strata, neighborhood, and class filters

**Secondary modules (workbench-routed):**
- CompsForge, Income Valuation, Comparable Sales, Reconciliation, Governed Run, Value Audit, Cost Manual
- Regression Studio, TerraGAMA, Coefficient Preview (queued)
- Appeals → routes through TerraDais

**Suite layout (from ForgeSuiteHome.tsx):**
1. KPI Hero Band — 5 large monospaced county-wide metrics
2. Header — Suite identity (no back arrow — suite IS the home)
3. Primary tools — 3 large hero cards
4. Secondary tools — compact grid of specialist modules
5. Operational Queue — recent parcel activity

---

## What Already Exists (from CC4_FORGE_SERVICE_INVENTORY.md)

**Two live data paths:**

| Path | File | Status |
|---|---|---|
| A: Client-side cost engine | `os-shell/src/services/forgeService.ts` (774 lines) | **Real** — deterministic, PACS matrix data. Lineage: BCBSCOSTApp → TerraBuild → CostForge → TerraForge |
| B: Backend REST API | `os-shell/src/hooks/useCostForgeAPI.ts` (357 lines) | **Real** — JWT, correlationId, 12 `/api/costforge/*` endpoints |
| C: Pilot API | `pages/workbench/tabs/PropertyForge.tsx` (394 lines) | **Real** — RBAC Gate 5b, tool invocation |

**Real suite modules using Path A (6 modules, 3,458 lines):**
`CostForgeModule`, `IncomeForgeModule`, `CompsForgeModule`, `AppealForgeModule`, `ValueAuditModule`, `ReconciliationModule`

**Real components using Path B (2 components, 2,135 lines):**
`EnhancedCostCalculator`, `CostForgeIntegrationPanel`

**83 pages** already implemented in `os-shell/src/pages/forge/` across:
statistics, mass-appraisal, sales, regression, valuation, property, comparison, calibration, tax, charts, anatomy, sketch, parcel, cost, scenarios, market, hazard, economic, quality, income, batch, avm

---

## This Standalone App's Job

The standalone `frontend/apps/terraforge/` app is the **dedicated suite shell** that surfaces TerraForge outside of os-shell. It must present the same county-wide suite workspace that `ForgeSuiteHome.tsx` defines — not a tabbed-page placeholder.

**The current shell is a skeleton that does not represent this architecture.**
TerraForge Assembly review will define the replacement before more suite expansion continues.

---

## Sealed slices

| Slice | Status |
|---|---|
| Phase 2.1 TerraLevy — levy rate lookup + bill calculator | ✅ Sealed `3f8536895` |

## Frozen

Phase 2.2, 2.3, 2.4 — frozen pending TerraForge Assembly review and owner task card approval.

---

## Authoritative sources

| Document | What it defines |
|---|---|
| `os-shell/src/pages/suites/ForgeSuiteHome.tsx` | Constitutional suite layout and module inventory |
| `docs/CC4_FORGE_SERVICE_INVENTORY.md` | Full service audit — real vs mock, data paths, consumers |
| `docs/evidence/cc/forge-cutover.md` | Cost approach engine architecture, localStorage elimination |
| Master plan — Suite-Forge component inventory | Layer ownership, existing files, what to mine |
