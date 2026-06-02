# Source Map

**Created**: 2026-06-02
**Purpose**: Canonical index of all source locations inspected and their access status.

---

## Source Status

| Source | Status | Asset Count | Access From Phone |
|--------|--------|-------------|-------------------|
| Active Codebase | COMPLETE | 40 assets found | Yes |
| GitHub (bsvalues) | COMPLETE | 31 repos analyzed, 10 high-value | Yes |
| Quarantine Folder | PARTIAL (via codebase scout) | 8 assets noted | Yes (in-repo) |
| External Hard Drives | NOT STARTED | Unknown | No |
| NotebookLM | NOT STARTED | Unknown | No |
| ChatGPT Exports | NOT STARTED | Unknown | No |
| Old Code Workspaces | NOT STARTED | Unknown | No |

---

## Active Codebase Map

```
terrafusion_os_1.0/
├── frontend/apps/os-shell/src/
│   ├── pages/
│   │   ├── PropertySearch.tsx          ← ATLAS search (A-004)
│   │   ├── workbench/
│   │   │   ├── PropertyWorkbench.tsx   ← ATLAS dossier shell (A-001)
│   │   │   └── tabs/
│   │   │       ├── PropertyDossier.tsx ← ATLAS dossier content (A-002)
│   │   │       ├── PropertyAtlas.tsx   ← ATLAS map view (A-019)
│   │   │       ├── PropertySummary.tsx ← ATLAS summary card
│   │   │       ├── PropertyForge.tsx   ← Valuation tools
│   │   │       └── PropertyPilot.tsx   ← OS agentic tasks
│   │   ├── suites/
│   │   │   ├── AtlasSuiteHome.tsx      ← ATLAS GIS hub (A-005)
│   │   │   ├── DossierSuiteHome.tsx    ← ATLAS document hub
│   │   │   ├── ForgeSuiteHome.tsx      ← ACADEMY valuation hub (A-006)
│   │   │   └── GptSuiteHome.tsx        ← ACADEMY Ask shell (A-013)
│   │   └── suites/modules/
│   │       ├── CostForgeModule.tsx     ← ACADEMY cost approach (A-007)
│   │       ├── AppealForgeModule.tsx   ← ACADEMY BOE prep (A-008)
│   │       ├── IncomeForgeModule.tsx   ← ACADEMY income analysis (A-009)
│   │       ├── CompsForgeModule.tsx    ← ACADEMY sales comparison (A-010)
│   │       ├── ReconciliationModule.tsx← ACADEMY reconciliation (A-011)
│   │       ├── TerraPrintModule.tsx    ← ATLAS PDF/fallback (A-012)
│   │       └── GISModule.tsx           ← ATLAS parcel viewer
│   ├── shell/home/ShellHome.tsx        ← OS launcher (A-018)
│   ├── components/ai/ATLAS.tsx         ← ACADEMY Ask chat UI
│   └── config/suiteRegistry.ts         ← OS suite governance
│
├── backend/src/
│   ├── TerraFusion.API/Controllers/
│   │   └── DossierController.cs        ← ATLAS dossier API (A-003)
│   ├── TerraFusion.AI/
│   │   ├── Prompts/ (14 prompts)       ← ACADEMY Ask content (A-014)
│   │   ├── Services/
│   │   │   ├── CostForgeService.cs     ← Cost approach backend
│   │   │   ├── PropertyValuationService.cs ← Valuation backend (A-022)
│   │   │   └── AnalyticsReportingService.cs ← County Pulse backend (A-021)
│   │   └── Seeds/BentonCostMatrixSeeder.cs ← Data seeder
│   └── TerraFusion.Core/Entities/
│       └── Property.cs                 ← Property entity
│
├── data/cost-matrices/                 ← Cost data (A-020)
│
└── QUARANTINE/
    ├── rag/benton-cama/                ← ACADEMY RAG content (A-015)
    ├── agents/BOEArguer.ts             ← OS agent (A-016)
    ├── terra-agent/mcp-server/tools/   ← OS MCP tools (A-017)
    └── handoffs/                       ← OS handoff templates
```

---

## GitHub Repos Map (Top 10)

| Repo | Key Asset | Demo Target | Stack Match |
|------|-----------|-------------|-------------|
| terra-forge-rebuild | Property 360, 84K parcels | Atlas | TS/React (Supabase) |
| Valuator-Pro-Studio | CostForge, CompVault, IncomeVault | Academy | TS (Supabase optional) |
| mass-valuation-showcase | Market calibration, defense packet | Atlas+Academy | TS/React (MySQL) |
| TerraAgent | NLP-to-SQL, RAG chat | Academy Ask | Python/Flask |
| BCBSCOSTApp | Cost matrices, building costs | Academy | TS/React |
| BCBSGISPRO | Multi-provider GIS, Claude | Atlas | TS (Claude) |
| PropertyTaxAI | Appeals workflow, public portal | Academy+Atlas | TS/React |
| BCBSLevy | Levy calc, Claude forecasting | Academy+Atlas | Python/Flask |
| BSIncomeValuation | Income AI agents | Academy | TS/React |
| terrafusion-brand-vault | Design tokens, brand config | All | TS |

---

## Pending Sources (Desktop Required)

### External Hard Drives
- Search for: old TerraFusion prototypes, demo recordings, presentation decks, Benton County data exports
- Priority: Medium (may contain polished demo assets)

### NotebookLM
- Search for: property assessment training content, county pulse analysis notebooks, codex drafts
- Priority: High (likely contains Academy-grade educational content)

### ChatGPT Exports
- Search for: conversation threads about assessment methodology, demo planning, feature designs
- Priority: Low (reference only, cannot deploy directly)

### Old Code Workspaces
- Search for: abandoned prototypes, 70%-done features, demo mockups
- Priority: Medium (may contain UI prototypes)
