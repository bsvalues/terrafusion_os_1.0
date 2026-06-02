# Top 10 Assets for Conference Demo

Ranked by: demo clarity + user value + conference impact + truthfulness + inverse effort = score out of 25.

---

## #1 — PropertyWorkbench + PropertyDossier (Score: 24/25)
- **Source**: Active codebase
- **Location**: `frontend/.../pages/workbench/` + `tabs/PropertyDossier.tsx`
- **Demo**: Atlas Property Dossier
- **Why**: Already built, already wired to real API (DossierController, 1370 lines), already routed. This IS the Atlas dossier. Just add the "Now What?" section and conference polish.
- **Effort**: Polish only
- **Readiness**: GREEN

## #2 — DossierController API (Score: 24/25)
- **Source**: Active codebase
- **Location**: `backend/.../Controllers/DossierController.cs`
- **Demo**: Atlas backend
- **Why**: 1370-line production API with county isolation, notes CRUD, composed parcel dossier. No backend work needed for Atlas dossier.
- **Effort**: None — use as-is
- **Readiness**: GREEN

## #3 — CostForgeModule (Score: 23/25)
- **Source**: Active codebase
- **Location**: `frontend/.../modules/CostForgeModule.tsx`
- **Demo**: Academy Codex — Cost Approach Review
- **Why**: 954 lines, full cost calculator. Direct mapping to Academy codex entry. Passes all human tests.
- **Effort**: Wrap in Academy UI shell
- **Readiness**: GREEN

## #4 — AI Prompts + RAG Knowledge Base (Score: 22/25)
- **Source**: Active codebase
- **Location**: `backend/.../Prompts/` + `QUARANTINE/.../rag/benton-cama/`
- **Demo**: Academy Ask + Codex content
- **Why**: 14 expert-level government AI prompts covering property assessment, BOE appeals, valuation, citizen services. Plus 392 lines of Benton CAMA content for RAG. This is the knowledge backbone.
- **Effort**: Wire prompts to Ask UI + extract RAG from quarantine
- **Readiness**: YELLOW (RAG needs extraction)

## #5 — PropertySearch + AtlasSuiteHome (Score: 22/25)
- **Source**: Active codebase
- **Location**: `frontend/.../PropertySearch.tsx` + `AtlasSuiteHome.tsx`
- **Demo**: Atlas search + navigation
- **Why**: Already live at `/property` and `/atlas`. PropertySearch provides parcel browse/search entry point. AtlasSuiteHome provides GIS module navigation. Just wire to demo route.
- **Effort**: Route aliasing only
- **Readiness**: GREEN

## #6 — AppealForgeModule + TerraPrintModule (Score: 21/25)
- **Source**: Active codebase
- **Location**: `frontend/.../modules/AppealForgeModule.tsx` + `TerraPrintModule.tsx`
- **Demo**: Academy BOE Preparation + Fallback PDFs
- **Why**: 613-line BOE appeal prep + 306-line PDF/print with 6 templates including BOE Appeal Packet. Dual purpose: Academy demo content AND conference fallback material.
- **Effort**: Wrap in Academy shell + generate static PDFs
- **Readiness**: GREEN

## #7 — GptSuiteHome + ATLAS Chat (Score: 21/25)
- **Source**: Active codebase
- **Location**: `frontend/.../GptSuiteHome.tsx` + `components/ai/ATLAS.tsx`
- **Demo**: Academy Ask
- **Why**: GPT Studio infrastructure exists. ATLAS floating orb chat component exists. Rebrand as Academy Ask, wire to prompts, done.
- **Effort**: Rebrand + wire to LLM
- **Readiness**: YELLOW (needs LLM backend wiring)

## #8 — ShellHome + Suite Registry (Score: 21/25)
- **Source**: Active codebase
- **Location**: `frontend/.../ShellHome.tsx` + `config/suiteRegistry.ts`
- **Demo**: TerraFusion OS launcher
- **Why**: macOS Tahoe tile launcher with constitutional suite governance. Already live at `/home`. Shows the OS experience.
- **Effort**: Add Atlas + Academy tiles to registry
- **Readiness**: GREEN

## #9 — terra-forge-rebuild Property 360 (Score: 20/25)
- **Source**: GitHub (bsvalues/terra-forge-rebuild)
- **Demo**: Atlas Dossier enrichment
- **Why**: 84,920 real Benton County parcels, historical assessments (2019-2026), 4 GIS layers. Pre-built "Property 360" view. TerraPilot agentic copilot.
- **Effort**: Extract components, adapt Supabase calls
- **Readiness**: YELLOW (Supabase dependency)

## #10 — TerraAgent NLP-to-SQL + RAG (Score: 20/25)
- **Source**: GitHub (bsvalues/TerraAgent)
- **Demo**: Academy Ask backend
- **Why**: Natural language to SQL query translation + RAG document retrieval. This is exactly the "Ask Academy" feature — already built as a Python service.
- **Effort**: Deploy as sidecar or extract query logic
- **Readiness**: YELLOW (Python stack, needs bridge)

---

## Build Priority Order

1. **Atlas Dossier** — A-001 + A-002 + A-003 + A-004 (all GREEN, polish only)
2. **Academy Shell** — New UI wrapping A-007, A-008, A-009, A-013 (GREEN assets, new wrapper)
3. **Academy Codex entries** — Write 10 entries using A-014, A-015, A-020 as content
4. **Academy Ask** — Wire A-013 + A-014 to LLM backend
5. **County Pulse** — New dashboard using A-021 backend
6. **OS Handoff** — A-018 + A-016 + registry updates
7. **Fallback PDFs** — A-012 templates → static generation
8. **GitHub enrichment** — G-001, G-004 if time allows
