# WO-WB-G2-002 — Window Aliasing Impact Matrix

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-001
**WO:** WO-WB-G2-002 — Aliasing Impact Matrix
**Category:** Documentation (read-only analysis)
**Depends on:** WO-WB-G2-001 (truth audit)

---

## 1. Per-tab impact

For each aliased tab (source of truth: `PropertyWorkbenchWindow.tsx:73-83` component map, `:727-731` initial-tab remap,
`TABS:105-114` labels). The alias is enforced by **two** mechanisms — the `TAB_COMPONENTS` map (tab-switch path) and the
`resolvedInitialTab` remap (launch path) — both of which must be corrected to close G2:

| Aliased tab | Displayed label | Actual rendered component (window) | Lost surface behavior | User-visible risk | Route path has real surface? | Test coverage of the mislabel |
|-------------|-----------------|-----------------------------------|-----------------------|-------------------|------------------------------|-------------------------------|
| **Clerk** | "Clerk" | `PropertyDossier` | TerraClerk recording/title tools (`search_recorded_documents`, `get_title_chain`, `record_document`, `release_lien`, …) + recordings history + Clerk honesty badge | User opens **Clerk**, sees a **Dossier** casefile view; recording/title workflow is unreachable in the window | ✅ yes (`/property/:parcelId/clerk` → `PropertyClerk`) | ❌ none (mislabel uncovered) |
| **Treasury** | "Treasury" | `PropertyDais` | TerraTreasury tax/collection tools (`get_tax_statement`, `record_payment`, `create_installment_plan`, `initiate_tax_sale`, …) + tax history + Treasury honesty badge | User opens **Treasury**, sees the **Dais** equalization surface; tax/collection workflow is unreachable in the window | ✅ yes (`/property/:parcelId/treasury` → `PropertyTreasury`) | ❌ none |
| **Audit** | "Audit" | `PropertyDossier` | TerraAudit financial-compliance/audit-trail tools + audit history + Audit honesty badge | User opens **Audit**, sees a **Dossier** view; audit workflow is unreachable in the window | ✅ yes (`/property/:parcelId/audit` → `PropertyAudit`) | ❌ none |

The other six tabs (Summary/Forge/Atlas/Dais/Dossier/Pilot) render their real components in **both** paths — no divergence.

## 2. Severity classification

**Classification: MISLEADING SURFACE (honesty gap) — but LOW blast radius and TRIVIALLY fixable.**

- It is **not** an "acceptable temporary alias": the real components exist, are honesty-instrumented, and are
  window-compatible (`useWorkbenchTab` dual-source; `WorkbenchTabCtx.Provider` at `:919`). There is no technical reason
  to keep the alias.
- It is **not** a deep "implementation gap": no new component, backend, or route work is required — only the window's
  `TAB_COMPONENTS` map needs to point at the already-existing real components.
- It **is** an **honesty inconsistency**: this repo has invested two programs (Honesty-Instrumentation, Per-Slice-Store-
  Provenance) into making badges truthful; a window that shows Dossier/Dais content under Clerk/Treasury/Audit labels
  directly contradicts that honesty posture for desktop-window users.

## 3. Which surfaces are affected?

| Surface | Affected? | Notes |
|---------|-----------|-------|
| **Route surface** (`/property/:parcelId/*`) | ❌ No | Renders all 9 real components (honest). |
| **App-window surface** (`PropertyWorkbenchWindow`) | ✅ Yes | The desktop-shell adapter mislabels Clerk/Treasury/Audit. |
| **Launch surface** | ✅ Yes (directly) | The window's `resolvedInitialTab` remap (`PropertyWorkbenchWindow.tsx:727-731`) rewrites launch `metadata.tabId` = clerk/audit → dossier and treasury → dais *before first render*. So a deep-link/launch into "Clerk"/"Treasury"/"Audit" opens the aliased tab directly — this is a second alias mechanism beyond the component map. |
| **Workbench operator flow** | ✅ Yes (window only) | Clerk/Treasury/Audit workflows are unreachable when the Workbench is opened as an app-window rather than via route. |

## 4. Exposure question (open, for the decision packet)

Which host path do real users hit today — route, window, or both? This audit proves the *divergence*; it does not measure
*traffic*. The decision packet (WO-WB-G2-003) weighs disposition under both assumptions (window is primary vs route is
primary). Determining live traffic would require runtime/telemetry inspection, which is **out of this docs-only scope**.

**Docs-only. No implementation. No stop wall.**
