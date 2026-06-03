# GitHub Scout Findings — TerraFusion Intelligence Preview

**Owner scouted:** `bsvalues`
**Date:** 2026-06-03
**Scout session:** phone/desktop, `gh` CLI

## Tooling status

- `gh --version`: 2.89.0 — OK
- `gh auth status`: ✓ Authenticated as `bsvalues` (keyring, ssh, scopes: repo, read:org, gist, admin:public_key) — **NOT BLOCKED**
- `gh repo list bsvalues`: 125 repos returned (all non-archived).
- `gh search code`: **code-search bucket exhausted mid-run** (limit 10/hr, used 10). 7 of 8 term searches completed successfully and returned real file-path evidence; the 8th term ("Board of Equalization" / BOE) hit HTTP 403 rate limit and was **NOT searched** — see Gaps. Core API bucket still healthy (4995/5000), used to verify candidate directory contents.

All findings below are confirmed by actual `gh search code` hits and/or `gh api .../contents` directory listings. Nothing is speculated.

---

## Findings by demo experience

Story legend: **P** = property (Atlas Property Dossier), **Pr** = problem (County Pulse / analytics), **A** = act (Academy / Codex / Ask).

### 1. Atlas Property Dossier  → story P

| Repo | Branch | Path | Asset type | Reuse | Risk | Story |
|------|--------|------|-----------|-------|------|-------|
| terra-forge-rebuild | main | `src/components/dossier/` (DocumentsPanel, PacketAssemblyPanel, NarrativeDraftingPanel, DocumentUploadDialog, CostForgeTraceTab, ParcelAnnotations, RiskScoreBadge) | React dossier UI panels (7 components, dir verified) | **High** | Low — self-contained components; uses `suite-dossier` design tokens | P |
| terra-forge-rebuild | main | `src/components/atlas/` (NeighborhoodValuationHeatmap, NeighborhoodHeatmapLegend, NeighborhoodMarketSparklines) + `src/components/workbench/tabs/AtlasTab.tsx` | GIS/neighborhood-equity heatmap UI (dir verified) | **High** | Low | P |
| terra-forge-rebuild | main | `src/services/suites/atlasService.ts` | Atlas suite service (GIS data layer) | **High** | Med — needs backend `/api/atlas/*` | P |
| terrafusion_os_1.0 | main | `frontend/apps/os-shell/src/components/ai/ATLAS.tsx`; `frontend/ATLAS_IMPLEMENTATION_COMPLETE.md` | ATLAS cognitive engine component + impl doc | Med | Med — "elite safeguards to prevent infinite loops" noted in file (stability caveat) | P/A |
| mass-valuation-showcase | main | `client/src/pages/DefenseStudio.tsx` | "Defense Dossier" compile + PDF download UI | **High** | Low | P |
| terrafusion_os_1.0 | main | `docs/evidence/cc/atlas-cutover.md`, `backend/docs/cx-23/24/25-*dossier*-evidence.md` | API contracts for `/api/atlas/*` and `/api/dossier/parcels/{id}/details` | Med (reference) | Low | P |

### 2. Atlas County Pulse  → story Pr

| Repo | Branch | Path | Asset type | Reuse | Risk | Story |
|------|--------|------|-----------|-------|------|-------|
| terrafusion_os_1.0 | main | `os-platform/development/tools/TerraFusion-PublicRecords/src/components/CountyPulse.tsx` (+ AIInsights, TransparencyDashboard, ShockAndAwe, ProactiveNotifications in same dir — verified) | "Benton County Pulse" real-time county-activity visualization | **High** | Low | Pr |
| terrafusion-infrastructure-platform | main | `modules/infrastructure/development/TerraFusion-PublicRecords/src/components/CountyPulse.tsx` | Duplicate of above (mirror copy) | Med | Low — pick one source of truth | Pr |
| terra-forge-rebuild | main | `src/components/analytics/DefensibilityScoreCard.tsx` (wired to `get_county_vitals()` RPC) | County-vitals analytics card | **High** | Med — depends on Supabase RPC | Pr |

### 3. Academy Codex  → story A

| Repo | Branch | Path | Asset type | Reuse | Risk | Story |
|------|--------|------|-----------|-------|------|-------|
| TerraFusionV0Demo | main | `components/ai-certification-academy.tsx` (25.7 KB, verified) + `app/certification/page.tsx` | "TerraFusion AI Certification Academy" page UI | **High** | Low | A |
| TerraFusion_Master_Workspace | main | `codex/codex-viewer.tsx`, `codex/codex-viewer.html` (+ d.ts in `TerraFusion_Demo_Package/frontend/codex/`) | TerraFusion Codex Viewer (standalone web component) | Med | Med — green-on-black terminal aesthetic, may not match brand | A |
| terrafusion_os_1.0 | main | `backend/CODEX_3_6_9_PROGRESS_UPDATE.md`; `scripts/deploy-codex-369-production.sh`; `scripts/verify-codex-369-deliverables.sh`; `os-platform/development/testing-suite/phase32-codex-live-smoke.mjs` + `phase32-codex-collab-smoke.mjs` | Codex 3-6-9 framework: deploy script, smoke tests, `/api/codex/status` endpoint | Med | Med — framework/branding heavy | A |
| terra-forge-rebuild | main | `docs/phase-80-terrapilot-swarm.md` and phase-81..129 execution plans (authored "by Codex") | Execution-plan docs (narrative content) | Low | Low | A |

### 4. Ask Academy (conversational / NL query)  → story A

| Repo | Branch | Path | Asset type | Reuse | Risk | Story |
|------|--------|------|-----------|-------|------|-------|
| WashingtonForge | main | `lib/pilot/` (tools.ts, executor.ts, context.ts, pii.ts — dir verified) | Agent "pilot" tool framework: SuiteOwner types (os/forge/atlas/dais/dossier), user claims (`parcel:read`, `ratio:run`, `dossier:draft`), PII guard, executor | **High** | Med — needs LLM backend wiring; PII scrubber is a strong reusable | A |
| terrafusion_os_1.0 | main | `docs/evidence/cp/handler-registry.md` (handlers incl. `explain_senior_exemption_impact`) | NL intent handler registry (assessor Q&A intents) | **High** | Low | A/Pr |
| TerraFusion_Master_Workspace | main | `benton_county_production/training/ASSESSOR_TRAINING_GUIDE.md` ("Terra, analyze the impact of removing the senior exemption") | Example NL prompts / training script for assessor assistant | Med | Low | A |
| TerraFusion_PlayGround | main | `config/system-prompts.json` (ratio-study uniformity analysis template: median ratio, COD, PRD) | Ready-made LLM system prompts for assessment analysis | **High** | Low | A/Pr |

### 5. Demo navigation / showcase shell

| Repo | Branch | Path | Asset type | Reuse | Risk | Story |
|------|--------|------|-----------|-------|------|-------|
| mass-valuation-showcase | main | `client/src/pages/` (~30 pages incl. Home, CountyDataDashboard, CountyProgressDashboard, MapExplorer, DefenseStudio, MassAppraisalDashboard, ComponentShowcase) | Full showcase webpage / multi-page demo shell (dir verified) | **High** | Low — purpose-built showcase ("Built with Manus") | nav |
| SHOCK_AND_AWE_public | main | (repo) — Next.js public demo: county selector, "379M× speed" showcase, public data only | Public-facing demo navigation engine | **High** | Low — explicitly "no sensitive data" | nav |
| terrafusion-slco-demo | (default) | (repo) — interactive Salt Lake County demo: ingestion pipeline, valuation workbench, GeoEquity | Interactive county demo | Med | Med — Manus-built, SLCO-scoped | nav |
| terrafusion-website | main | (repo) — Official Website & Landing Page (HTML) | Landing/marketing shell | Med | Low | nav |

---

## Supporting domain assets (cross-cutting, confirmed)

- **Ratio study / IAAO engine**: `mass-valuation-showcase/server/pdfExport.ts` (IAAO ratio study PDF export — verified hit). ADR at `terrafusion_os_1.0/docs/architecture/ADR-001-STATISTICS-STUDIO-PLACEMENT.md` explicitly catalogs working implementations in Bsbcintelligentvalues (COD/PRD/PRB/VIF), mass-valuation-showcase (IAAO + PDF), terra-forge-rebuild (VEI dashboard). **High reuse for Pr/A stories.**
- **Cost approach (CostForge)**: `terrafusion_os_1.0/packages/terrabuild/client/index.html` ("CostForge — Cost Approach | Benton County Assessor"); `TerraFusion-Valuator-Pro-Studio` (Cost/Sales/Income approach phases per README). Med-High reuse.
- **Senior exemption**: `terrafusion_os_1.0/docs/evidence/cp/handler-registry.md` (`explain_senior_exemption_impact`); `BCBSLevy/utils/compliance_utils.py` (`senior_exemption_threshold: 40000`). Confirmed real assessor logic. Med-High reuse for Ask Academy.
- **Sale ratio doctrine**: `terrafusion_os_1.0/backend/src/TerraFusion.Core/Entities/SaleRatioType.cs` (WAC 458-53 DOR ratio study semantics) — authoritative domain entity.

---

## Top candidates (rank order)

1. **terra-forge-rebuild** `main` — `src/components/dossier/` + `src/components/atlas/` + `src/services/suites/atlasService.ts`. Highest-density, brand-tokenized React for BOTH Atlas Property Dossier and Atlas County Pulse analytics. (Story P + Pr)
2. **terrafusion_os_1.0** `main` — `os-platform/development/tools/TerraFusion-PublicRecords/src/components/CountyPulse.tsx` (+ sibling dashboards). Drop-in County Pulse visualization. (Story Pr)
3. **mass-valuation-showcase** `main` — `client/src/pages/` (~30-page showcase shell) + `server/pdfExport.ts` IAAO engine. Demo navigation + ratio-study content. (nav + Pr)
4. **TerraFusionV0Demo** `main` — `components/ai-certification-academy.tsx` (25.7 KB) + `app/certification/page.tsx`. Academy Codex page. (Story A)
5. **WashingtonForge** `main` — `lib/pilot/` (tools/executor/context/pii). Reusable agent + PII framework for Ask Academy. (Story A)

---

## Gaps / blockers

- **BOE term not searched**: "Board of Equalization" / "BOE" `gh search code` hit HTTP 403 (code-search bucket = 10/hr, exhausted). Re-run after reset (~minutes): `gh search code --owner bsvalues "Board of Equalization"` and `gh search code --owner bsvalues BOE`. (Appeal/BOE assets likely exist — `mass-valuation-showcase/client/src/pages/` already shows AppealDefenseBuilder, AppealAnalytics, AppealAuditLog, AppealTemplates, BulkAppealImportPage — confirmed via contents API, so appeals coverage is in fact present even though the BOE keyword search didn't run.)
- **Duplication risk**: County Pulse and Academy components exist in multiple mirror repos (terrafusion_os_1.0, terrafusion-infrastructure-platform, terrafusion-government-platform, plus QUARANTINE copies). Pick a single source of truth per asset before integration; prefer `terrafusion_os_1.0` (active main) or `terra-forge-rebuild` over the Oct-2025 platform-split mirrors.
- **Backend dependencies**: Atlas/Dossier services call `/api/atlas/*` and `/api/dossier/parcels/{id}/details`; DefensibilityScoreCard calls Supabase `get_county_vitals()` RPC. UI is reusable but needs live endpoints for non-mocked demo.
- **Manus-built repos** (legpulse, terrafusion-slco-demo, mass-valuation-showcase) have no default branch listed in some metadata or are externally scaffolded — verify branch/buildability before relying on them live.

## Next recommended action

Wait ~10 min for the code-search bucket to reset, then run the two BOE/appeal searches to close the only un-searched term. In parallel, clone **terra-forge-rebuild** (top candidate) and inspect `src/components/dossier/` + `src/components/atlas/` for the Atlas Property Dossier demo, and lift `CountyPulse.tsx` from `terrafusion_os_1.0` for County Pulse. Decide single-source-of-truth for the duplicated County Pulse / Academy components before integration.
