# WO-WB-003 — Suite Surface Classification

**Program:** PROPERTY-WORKBENCH-READINESS (step 3) · **Owner:** Claude Code · **Mode:** read-only discovery, docs/audit only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `1e10b59a` · **Method:** first-hand reads of each tab component + WO-WB-001/002 discovery, cited `file:line`.
**Builds on:** `WO-WB-001` (current state) + `WO-WB-002` (route/tab matrix).

Classifies each of the 9 parcel-tab suite surfaces by **archetype**, **data source**, **live/stub state**, **honesty-contract coverage**, **window parity**, and **backing-tool sample**. The full tool-maturity census is deferred to WO-WB-004; here surfaces are classified by *how* they source data, not a per-tool census.

---

## 1. Classification dimensions

- **Archetype** — the data-sourcing pattern (see §2 legend).
- **Data source** — the hook / store / API the surface reads, cited.
- **Live/stub** — whether the surface renders wired data or a placeholder (from WO-WB-001 §4).
- **Honesty contract** — whether a `*.honesty.contract.test` gates it (from WO-WB-002 §4).
- **Window parity** — route path renders the real component vs the window adapter aliases it (WO-WB-002 §1).
- **Backing tools (sample)** — representative `toolId`s the surface invokes, with the maturity band where known (WO-WB-004 will do the census).

### Archetype legend

| Code | Archetype | Meaning |
|------|-----------|---------|
| **A** | Store-backed core | reads the parcel store (`DataProvider → snapshot/live/fixtures`) |
| **B** | Hook-backed domain | dedicated domain hooks returning source-tagged data |
| **C** | Governed-tool MWUX | `invokeTool(toolId)` governed-tool console; idle → `unavailable` |
| **D** | Hook + tool hybrid | live hook for primary data + `invokeTool` for AI synthesis |
| **E** | Tool-catalog surface | lists/filters the governed tool registry itself |

---

## 2. Per-surface classification

| Tab | Archetype | Data source (cited) | Live/stub | Honesty contract | Window parity |
|-----|-----------|---------------------|-----------|------------------|---------------|
| Summary | **A** | `usePropertyStore` (`PropertyWorkbench.tsx:172-173`; badge from `propertyData.source`, `PropertySummary.tsx:100-104`) | LIVE | ✅ | ✅ real |
| Forge | **B** | forge hooks `useCostApproach`/`useSalesComparison`/`useIncomeApproach`/`useReconciliation` (`hooks/forge/useForgeValuation`, `PropertyForge.tsx:33`; `ForgeOverview.tsx:78-89`) | LIVE (+ DcfPanel stub) | ✅ | ✅ real |
| Atlas | **B** | `useParcelBoundary`/`useParcelLayers` → live GIS (`PropertyAtlas.tsx:7-12,674-742`) | LIVE | ✅ | ✅ real |
| Dais | **C** | `invokeTool` (`PropertyDais.tsx:33`); e.g. `summarize_levy_rate_components` (`:305`) | LIVE | ✅ | ✅ real |
| Clerk | **C** | `invokeTool` (`PropertyClerk.tsx:18`); e.g. `get_title_chain` (`:144`), `record_document` | LIVE | ❌ | ❌ **window-aliased → Dossier** |
| Treasury | **C** | `invokeTool` (`PropertyTreasury.tsx:19`); e.g. `get_tax_statement` (`:151`), `explain_tax_breakdown` (`:170`) | LIVE | ❌ | ❌ **window-aliased → Dais** |
| Audit | **C** | `invokeTool` (`PropertyAudit.tsx:17`); e.g. `audit_roll_summary` (`:128`), `check_levy_compliance` (`:147`) | LIVE | ❌ | ❌ **window-aliased → Dossier** |
| Dossier | **D** | `useDossierDetails` hook (`PropertyDossier.tsx:39`) + `invokeTool` (`:25`); "UI → hook → real API → correlationId UX" (`:11`) | LIVE | ❌ | ✅ real |
| Pilot | **E** | `listPilotTools('muse')` (`PropertyPilot.tsx:84`) + `filterMuseReadOnlyTools` (`:16`) | LIVE (read-only) | ❌ | ✅ real |

### Notes per surface

- **Summary (A):** the parcel identity/CAMA surface; its badge is `live`/`fallback` from the store's `source`. The workbench-wide "evidence unavailable" blocker (WO-WB-001 §4.1) protects it.
- **Forge (B):** the deepest surface — 5 state sub-tabs, its own year context, and the only source-level stub (`DcfPanel`). Reconciliation has its own honesty contract requiring live cost+sales+income indications.
- **Atlas (B):** the only GIS surface; falls back to an SVG preview when the GIS source is `unavailable`.
- **Dais / Clerk / Treasury / Audit (C):** all four are `invokeTool` governed-tool consoles that render `unavailable` at idle and only show data after an explicit invocation. **Three of the four (Clerk, Treasury, Audit) are window-aliased** — so in the window path they never render their own console. **None of the four has a honesty-contract test** (only Dais does, at the tab level).
- **Dossier (D):** hybrid — live document/detail data via a hook, plus AI synthesis via governed tools, disclosed separately.
- **Pilot (E):** the governed tool catalog itself — lists Muse read-only tools; the only surface whose "data" *is* the registry.

---

## 3. Cross-cutting patterns

1. **Two sourcing families:** (A/B/D) read **domain data** via stores/hooks; (C/E) are **tool-driven** — they invoke or list governed tools. The C surfaces are the ones whose runtime richness depends most directly on tool-maturity promotion.
2. **Idle honesty is uniform:** every surface renders an explicit `unavailable`/`fallback` state at idle and never fabricates — enforced by the honesty tests where present and by the shared "evidence unavailable" blocker everywhere.
3. **Honesty-contract coverage is skewed to A/B:** Summary, Forge, Atlas, Dais have contracts; the tool-heavy Clerk/Treasury/Audit and the hybrid Dossier + catalog Pilot do **not** — the surfaces most dependent on tool output are the least honesty-contract-gated.
4. **Window aliasing concentrates on C:** the 3 aliased tabs (Clerk/Treasury/Audit) are all archetype-C governed-tool consoles — i.e., the window adapter never got their consoles, substituting Dossier/Dais.

---

## 4. Readiness banding (surface-level, qualitative)

| Band | Surfaces | Rationale |
|------|----------|-----------|
| **Closest to ready** | Summary, Atlas, Forge | store/hook-backed, honesty-contracted, real on both entry paths (Forge minus the DcfPanel stub) |
| **UI-ready, tool-gated** | Dais, Dossier, Pilot | real + wired, but richness depends on backing-tool maturity (Dais alone is honesty-contracted) |
| **UI-gap + tool-gated** | Clerk, Treasury, Audit | wired on the route path but **window-aliased** *and* **no honesty contract** — the biggest per-surface gaps |

This banding is qualitative and surface-level; the tool-maturity census (WO-WB-004) will quantify the "tool-gated" dimension, and the Gap Register (WO-WB-005) will consolidate the concrete gaps.

## 5. Unknowns (deferred)

1. The **maturity band of every backing tool** each surface calls (only samples cited here) — WO-WB-004.
2. Whether the **window-aliasing** of Clerk/Treasury/Audit is deliberate (desktop-mode de-scope) or an unfinished port — needs the window adapter's own history/comments; flagged, not assumed.
3. Whether **role visibility** (`useWorkbenchRoles`, `PropertyWorkbench.tsx:219`) hides any of these surfaces for some roles at runtime — a runtime concern beyond static read.

**STOP_TYPE:** `WB_SUITE_CLASSIFICATION_COMPLETE`
