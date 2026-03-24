# CP-15 Route Readiness Map

Date: 2026-03-19 (updated post-inspection: CP-15 seal run)
Phase: Phase 2 — Runtime Completeness / Shell Contract
Gate: G5 (Runtime Completeness)
Status: PASS — all must-use routes inspected; zero un-disclosed placeholders remain

## Classification Key

- REAL: connects to real service with real data
- SAMPLE-TRANSPARENT: explicit fallback with provenance flag (DemoDataBanner / isSampleData)
- PLACEHOLDER: stub component, coming-soon, hardcoded data without transparency marker
- NOT-ASSESSED: not yet inspected

## Suite Route Survey

### TerraForge (Forge)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/forge` | `ForgeSuiteHome` | REAL | `useCountyStats` hook, `SuiteModuleGrid`, `OperationalQueue` — live data-first |
| `/forge/cost` | `CostManual` + `CostApproach` | SAMPLE-TRANSPARENT | API-first via `getCostSchedule`; sample fallback with DemoDataBanner disclosed |
| `/forge/batch` | `BatchCostRun` | SAMPLE-TRANSPARENT | Live preview/apply endpoints wired; fallback disclosed + TerraTrace emit |
| `/forge/calibration` | `CoefficientPreview` | REAL | Live cost model coefficient comparison via forge sub-route |
| `/forge/regression` | Regression Studio module | REAL | County-wide MRA via standalone module launcher from ForgeHome |
| `/forge/statistics` | Statistics Studio module | REAL | Ratio studies via standalone module launcher from ForgeHome |

### TerraAtlas (Atlas)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/atlas` | `AtlasSuiteHome` | REAL | `useCountyStats` hook, `SuiteModuleGrid`, `OperationalQueue` — live data-first |

### TerraDais (Dais)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/dais` | `DaisSuiteHome` | REAL | `useDaisSuiteStats` hook, `NoticeBatchQueuePanel`, `CertRollPanel`, `ManagementDashboardPanel` — live data-first |
| `/dossier` | `DossierSuiteHome` | REAL | `useCountyStats` hook, `SuiteModuleGrid`, `OperationalQueue` — live data-first |
| `/gpt` | `GptSuiteHome` | REAL | `GPTManagementDashboard`, `RAGDatasetManager` for live views; `useCountyStats` — partially queued features explicitly labeled `queued` in UI |

### OS-Level Routes

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/` | `App` (Desktop Shell) | REAL | Full desktop with windows, taskbar, start menu |
| `/property` | `PropertySearch` | REAL | Native parcel browse/search (TerraPrime replacement) |
| `/pilot` | `PilotHome` | REAL | Governed tool console — filter, preflight, invoke, trace |
| `/trace` | `TraceHome` | REAL | TerraTrace event viewer — immutable audit spine |
| `/canon` | `CanonHome` | REAL | TerraCanon IDE shell — Monaco + AI integration |
| `/marketplace` | `TerraFusionMarketplace` | REAL | Plugin/module marketplace — Admin/SystemAdmin only (CP-14 G4 gate) |
| `/monitoring` | `Monitoring` | REAL | System health monitors |
| `/login` | `LoginPage` | REAL | Auth redirect target |

### Property Workbench (Tier-0 — must-use tab surfaces)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/property/:parcelId` | `PropertyWorkbench` → `PropertySummary` | REAL | BentoGrid with live `propertyStore` + `useWorkbenchTab` — parcelId, address, owner, valuations, assessment history |
| `/property/:parcelId/forge` | `PropertyForge` | REAL | Sub-tab router (overview/cost/sales/income/reconcile); all sub-tabs mounted real; `invokeTool` wired |
| `/property/:parcelId/atlas` | `PropertyAtlas` | REAL | Layer selection + `query_parcel_layers` tool invocation → correlationId UX |
| `/property/:parcelId/dais` | `PropertyDais` | REAL | 20+ governed tool invocations (check_cert_status, exemption, appeal, levy, notice, queue, BOE); all wired |
| `/property/:parcelId/dossier` | `PropertyDossier` | REAL | `useDossierDetails` + `dossierService` + evidence packet assembly + narrative editor |
| `/property/:parcelId/pilot` | `PropertyPilot` | REAL | `listPilotTools` + `filterMuseReadOnlyTools` + `useToolInvocation` + trace |
| `/property/:parcelId/clerk` | `PropertyClerk` | REAL | Clerk governed tools: search_recorded_documents, get_title_chain, record_document, etc. |
| `/property/:parcelId/treasury` | `PropertyTreasury` | REAL | Treasury governed tools: get_tax_statement, record_payment, check_delinquency_status, etc. |
| `/property/:parcelId/audit` | `PropertyAudit` | REAL | Audit governed tools: audit_roll_summary, check_levy_compliance, submit_audit_finding, etc. |

## G5 Proof Evidence

Workbench host integrity gate (G6 test file):
```
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx
```
Result: 15 passed, 0 failed

Baseline proof gate:
```
pnpm run type-check  # exit 0
node --test os-platform/core/tests/phase83-tools.test.mjs  # 56/56 pass
```

## Zero-Placeholder Gate Condition — SATISFIED

No remaining un-disclosed placeholders on any must-use route.
All `queued` items (GPT Studio, GPT Builder, GPT Analytics, GPT Marketplace) are explicitly
labeled `status: 'queued'` in the UI — consumer-visible disclosure; these are NOT placeholders.

SAMPLE-TRANSPARENT routes (CostManual, BatchCostRun) carry DemoDataBanner + `isSampleData` provenance.
No bare coming-soon divs, hardcoded stub JSON, or silent fallback remains on any required route.
