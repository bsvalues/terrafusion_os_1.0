# Active Codebase Findings (VERIFIED)

**Repo:** `terrafusion_os_1.0` @ `origin/main` (verified via `git cat-file`/`ls-files` in the clean worktree)
**Method:** Explore scout proposed assets; **every path below was independently re-verified to exist in `main`.** Unverifiable/approximated scout claims were dropped or flagged.

> ⚠️ "Exists" ≠ "demo-ready." Existence is git-verified. Demo-readiness (renders, has data,
> conference-grade) is NOT yet verified — that requires actually running the app (next phase).

---

## Verified-present infrastructure (the wiring we build on)

| Asset | Path | Role |
|---|---|---|
| Router | `frontend/apps/os-shell/src/Router.tsx` | route table; where new demo routes get added |
| Suite Registry | `frontend/apps/os-shell/src/config/suiteRegistry.ts` | single source of truth for suites |
| Property Workbench | `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx` | parcel-scoped tab hub |
| Property Dossier (tab) | `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx` | dossier inside workbench |

## Verified-present suite homes
- `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx`

## Verified-present suite modules (22, in `frontend/apps/os-shell/src/pages/suites/modules/`)
AppealForgeModule · ChainOfCustodyModule · CompsForgeModule · CostForgeModule · DeepSearchModule ·
DefensePacketsModule · DocumentsModule · EvidenceModule · ForgeExecutionPanel · GISModule ·
GPTAnalyticsModule · GPTBuilderModule · LayerWorksModule · ParcelLensModule · PhotoManagerModule ·
RAGDatasetsModule · ReconciliationModule · TerraExportModule · TerraPrintModule · TerraQueryModule ·
TerraSketchModule · ValueAuditModule
(legacy: `modules/legacy/IncomeForge.archived.tsx`)

## Verified-present County Studio
`frontend/apps/os-shell/src/pages/forge/county-studio/` — **72 files**, entry `CountyStudyPage.tsx`.
NOTE: County Studio is a *county-wide study/adjustment* surface. It is **related to but not the same as**
"County Pulse" (a county vitals dashboard). Do not conflate them in the demo.

## Verified County Pulse asset (Explore MISSED this)
`os-platform/development/tools/TerraFusion-PublicRecords/src/components/CountyPulse.tsx`
→ County Pulse is **not greenfield**; mine this component first before building new.

## Academy — NOT in the live app, but scaffold exists in QUARANTINE
- `QUARANTINE/top-level-dirs/applications/terra-assessor-production/TerraFusionAssessor/components/ai-certification-academy.tsx`
- `QUARANTINE/top-level-dirs/applications/terra-v0demo-production/components/ai-certification-academy.tsx`
→ Reusable Academy scaffold (matches GitHub scout's `TerraFusionV0Demo` find). Needs review/lift, not from-scratch.

---

## Corrections to the Explore scout's report
- `TerraQuery Module.tsx` (with a space) — **wrong**; real is `TerraQueryModule.tsx`.
- "Atlas Dossier LIVE / demo-ready" and "County Pulse = County Studio" — **unverified claims, not accepted.**
- "~90 assets" headline — treat as a count of *mentions*, not verified demo assets.

## GAPS — must be built or lifted (for the 5 demo items)
1. **Atlas dossier demo** — dossier UI exists, but a conference-safe demo (hardcoded parcel, no backend) does NOT. Build.
2. **County Pulse demo route** — component exists (`CountyPulse.tsx` in tools); needs lifting + a `/atlas/county-pulse/demo` route. Lift + wire.
3. **Academy shell** — not in app; lift from QUARANTINE `ai-certification-academy.tsx`. Lift + adapt.
4. **Academy codex (10 entries)** — content does not exist as structured entries. Build (content = R1 risk).
5. **Ask Academy** — no Academy assistant; Atlas has `SystemGptAtlasPanel` as a pattern. Build from pattern.

## Next recommended action
Decide build order. Lowest-risk highest-impact first = the empty-dossier risk (R2): build a standalone,
backend-free Atlas dossier demo on a hardcoded Benton parcel. Then lift CountyPulse + Academy scaffold.
