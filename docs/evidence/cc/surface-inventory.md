# CC Lane Evidence: Frontend Surface Inventory (CC-R1-00)

**Lane:** CC
**Date:** 2026-03-07
**Scope:** Classification of all frontend surfaces by R1 readiness status.

---

## R1 Active Surface (Workbench Tabs)

These are the three tabs rendered inside the R1 workbench. Forge and Atlas use the
governed pilot path. Dossier uses a real county-scoped backend service path.

| Surface | File | Data Source | Status |
|---------|------|-------------|--------|
| ForgeExecutionPanel | `pages/workbench/tabs/ForgeExecutionPanel.tsx` | `runGovernedValuation()` -> `pilotApi.invokePilotTool()` -> `POST /pilot/invoke` | **REAL** |
| PropertyDossier | `pages/workbench/tabs/PropertyDossier.tsx` | `useDossierDetails()` -> `dossierService.getDetails()` -> `GET /api/dossier/parcels/{id}/details` | **REAL** |
| PropertyAtlas | `pages/workbench/tabs/PropertyAtlas.tsx` | `invokeTool({ toolId: 'query_parcel_layers' })` -> `POST /pilot/invoke` | **REAL** (SVG labeled schematic) |

### Approved R1 Proof Set

The release-proof tool set is defined by the execution plan and CP proof harness, not
by whichever governed tools happen to be visible from a given screen.

| Tool | R1 proof status | CC-relevant UI support |
|------|-----------------|------------------------|
| `run_valuation_model` | **Included** | ForgeExecutionPanel |
| `explain_value_change` | **Included** | Governed result and evidence surfaces |
| `search_trace_by_correlation` | **Included** | Correlation-aware evidence and trace surfaces |
| `summarize_levy_rate_components` | **Included** | TerraDais levy result surfaces |
| `summarize_parcel_casefile` | **Included** | PropertyDossier and dossier evidence surfaces |

The following governed tools are real but are **not** in the approved 5-tool R1 proof
set: `add_dossier_note`, `query_parcel_layers`.

---

## R1 Active Surface (Suite Pages)

Suite home pages accessible via standalone routes. These use real backend APIs where available.

| Surface | File | Data Source | Status |
|---------|------|-------------|--------|
| TerraDais — Levy Module | `pages/suites/DaisSuiteHome.tsx` | `levyService.calculateLevyRate()` -> `POST /api/levy/calculate` | **REAL** |
| TerraDais — PILT Module | `pages/suites/DaisSuiteHome.tsx` | `piltService.getPiltStatus()` -> `GET /api/pilt/status` (501) | **DEFERRED** — explicit notice shown |
| TerraDais — Certification | `pages/suites/DaisSuiteHome.tsx` | Hardcoded `CERT_MILESTONES` | **REFERENCE DATA** — layout preview |
| TerraDais — Appeals (BOE) | `pages/suites/DaisSuiteHome.tsx` | Hardcoded `BOE_APPEALS` | **REFERENCE DATA** — layout preview |
| TerraDais — Permits | `pages/suites/DaisSuiteHome.tsx` | Local state only | **REFERENCE DATA** — layout preview |
| TerraDais — Calendar | `pages/suites/DaisSuiteHome.tsx` | Hardcoded milestone dates | **REFERENCE DATA** — layout preview |

---

## Post-R1 Suite Modules (Legacy — Not in R1 Active Surface)

These modules exist under `pages/suites/modules/` and use deprecated client-side calculation functions. They are NOT rendered in the R1 workbench tabs. They are accessible only through the old suite page navigation and are classified as post-R1.

| Module | File | Deprecated Function Used | Status |
|--------|------|--------------------------|--------|
| CostForgeModule | `pages/suites/modules/CostForgeModule.tsx` | `calculateCost()` (line 112) | **POST-R1** — uses deprecated client-side calc |
| IncomeForgeModule | `pages/suites/modules/IncomeForgeModule.tsx` | `calculateIncome()`, `extractCapRate()` | **POST-R1** — uses deprecated client-side calc |
| ReconciliationModule | `pages/suites/modules/ReconciliationModule.tsx` | `runReconciliation()` | **POST-R1** — uses deprecated client-side calc |
| AppealForgeModule | `pages/suites/modules/AppealForgeModule.tsx` | `saveAppeal()`, `loadAppeals()` (tombstoned) | **POST-R1** — uses tombstoned localStorage stubs |
| ValueAuditModule | `pages/suites/modules/ValueAuditModule.tsx` | `appendAuditEntry()`, `loadAuditEntries()` (tombstoned) | **POST-R1** — uses tombstoned localStorage stubs |

All deprecated functions in `forgeService.ts` are annotated with `@deprecated Use runGovernedValuation() for production flows`.

---

## Service Layer Classification

| Service | File | Fallback Data | Status |
|---------|------|---------------|--------|
| forgeService.ts | `services/forgeService.ts` | localStorage removed (tombstoned), calc functions @deprecated | **CLEAN** — `runGovernedValuation()` is production path |
| dossierService.ts | `services/dossierService.ts` | Fallback removed in CC-14 | **CLEAN** — all methods call real backend |
| atlasService.ts | `services/atlasService.ts` | Fallback removed in CC-13 | **CLEAN** — all methods call real backend |
| piltService.ts | `services/piltService.ts` | No fallback — errors propagate | **CLEAN** — calls real backend (501 deferred) |
| levyService.ts | `services/levyService.ts` | No fallback — errors propagate | **CLEAN** — calls real backend |

---

## Design/Prototype Components (Not Production)

| Component | File | Status |
|-----------|------|--------|
| TerraForgeCostAI | `design/TerraForgeCostAI.tsx` | Design prototype — `generateMockData()` for demo only |
| TerraFlowEngine | `design/TerraFlowEngine.tsx` | Design prototype — mock WebSocket for demo |
| TerraFlowDesignEngine | `design/TerraFlowDesignEngine.tsx` | Design prototype — mock WebSocket for demo |
| CostForgeAIModule | `design/CostForgeAIModule.tsx` | Design prototype — `calculateCostPerSF` helper |

These are in the `design/` directory and are not rendered in any production route.

---

**Verified by:** Claude Code (CC lane agent)
