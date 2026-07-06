# WO-WB-PROV-008 — Slice Provenance Evidence Rollup

**Program:** WORKBENCH-PER-SLICE-STORE-PROVENANCE
**Status:** COMPLETE — Workbench honesty badges made slice-aware (parcel-shell → rendered-slice provenance)
**Category:** Documentation (evidence rollup; no code change in this WO)
**Owner:** Claude Code (frontend provenance lane; non-colliding with Codex Backend OE)

**Authorization:** Operator authorized WORKBENCH-PER-SLICE-STORE-PROVENANCE with the allowed write set
`frontend/apps/os-shell/src/stores/**`, `.../pages/workbench/tabs/**`, `.../__tests__/workbench/**`,
`docs/audit/workbench-readiness/**`. Root `AGENTS.md` permits writes outside its default core lane
(`os-platform/core/**`, `tools/registry/**`, …) **with explicit authorization**, which the operator granted for this
program. No governance-surface files were touched.

---

## 1. What this program did

Workbench honesty-badge coverage was 9/9, but three tabs (Clerk/Treasury/Audit) drove their badge from **coarse
parcel-shell** state: in `propertyStore.selectParcel`, `activeParcelLoading`/`activeParcelError` clear when `getParcel`
resolves — *before* the eager related-data bundle (the slice each tab actually renders) resolves. So those badges could
read `live` during the window where the shell was up but the rendered slice had not loaded (or had silently failed). This
program made those badges **slice-aware** and fixed a related **stale-parcel** gap on Dossier, using only frontend
store/tab/test changes over the **existing** fetch.

## 2. Before → after (per tab)

| Tab | Before predicate | After predicate | WO |
|-----|-----------------|-----------------|----|
| **Clerk** | `activeParcel?.parcelId === parcelId && !activeParcelLoading && !activeParcelError` | `activeParcel?.parcelId === parcelId && relatedDataStatus === 'loaded'` | PROV-003 |
| **Treasury** | (same parcel-shell predicate) | (same slice-aware predicate) | PROV-004 |
| **Audit** | (same parcel-shell predicate) | (same slice-aware predicate) | PROV-005 |
| **Dossier** | `dossierDetails.data ? 'live' : 'unavailable'` | `dossierDetails.data?.parcelId === parcelId ? 'live' : 'unavailable'` | PROV-007 |
| **Pilot** | `!toolsLoading && !toolsError` | unchanged — **verified already correct** | PROV-006 |

The badge now reads `live` only once the *slice the tab renders* has actually loaded for the current parcel.

## 3. Store change (PROV-002)

Added a frontend-only `relatedDataStatus: 'idle' | 'loading' | 'loaded' | 'error'` to `propertyStore`, tracking the
lifecycle of the **existing** eager related-data `Promise.all` in `selectParcel` (no new fetch/API; not persisted — the
`partialize` config still stores only `recentParcels`). Because that bundle is all-or-nothing (one `Promise.all`; `.then`
sets all slices, `.catch` clears all), `relatedDataStatus === 'loaded'` is per-slice-accurate for the three C-tabs.

During review a **stale-completion race** was fixed: the bundle continuations previously guarded on `parcelId` only, so a
re-select/refresh of the *same* parcel let a stale in-flight bundle overwrite the newer load's status/slices (or a stale
rejection clear a newer success). Added a module-level monotonic `selectParcelSeq`; each `selectParcel` captures its own
`requestSeq` and all four continuations bail unless still the latest request. (`activeParcelLoadingParcelId` is retained —
it is still read by `PropertyWorkbench.tsx` for target-parcel loading UI.)

## 4. PROV-006 finding (Pilot — no change)

Pilot's badge is driven by `!toolsLoading && !toolsError` over `listPilotTools`, which loads the **tool registry** for the
`muse` mode — parcel-**independent**. Navigating parcels does not restage Pilot's tool list, so there is no parcel-shell
or stale-parcel gap. The existing `PropertyPilot.honesty.contract.test.tsx` already covers idle → unavailable, loaded →
live, and successful-empty → live. **No component or test change was warranted** (no manufactured churn).

## 5. PRs / merge commits

| WO | Scope | PR | Squash commit |
|----|-------|----|---------------|
| PROV-001 | Design / scope audit (docs) | #1213 | `5510128e` |
| PROV-002 + PROV-003 | `relatedDataStatus` store flag + store test + Clerk consumer | #1214 | `382400c8` |
| PROV-004 + PROV-005 | Treasury + Audit slice-aware wiring | #1217 | `824b0ffd` |
| PROV-007 | Dossier parcel-identity guard | #1216 | `c697a68c` |
| PROV-006 | Pilot — verified compliant (no change) | — | (documented here) |
| PROV-008 | This rollup | (this PR) | (this doc) |

## 6. Files changed (across the program)

Store: `stores/propertyStore.ts` (+ `relatedDataStatus`, request-sequence guards),
`stores/__tests__/propertyStore.relatedDataStatus.test.ts` (new).
Tabs: `PropertyClerk.tsx`, `PropertyTreasury.tsx`, `PropertyAudit.tsx` (slice-aware predicate),
`PropertyDossier.tsx` (parcel-identity guard).
Tests: the four tabs' `*.honesty.contract.test.tsx` (drive `relatedDataStatus` / stale-parcel case).

## 7. Correctness lessons (from adversarial CI review)

1. **Parcel-shell ≠ slice load.** `activeParcelLoading` clears before the related bundle resolves; a slice-rendering
   badge must key on the slice's load, not the shell.
2. **Guard async completions by request identity, not parcelId.** Re-selecting the same parcel races two bundles; only a
   per-request token prevents a stale completion clobbering the newer load (codex, PROV-002).
3. **"Already correct" needs verification, not assumption.** Dossier looked slice-aware but wasn't parcel-keyed
   (`useDossierDetails` clears only on null) — caught in design review, fixed at the component level (codex).
4. **Keep test type unions imported, not redeclared,** so they can't drift from the store's state machine (copilot).
5. **Record authorization on out-of-lane writes.** `AGENTS.md` limits the default write lane; frontend PRs must cite the
   operator's program authorization + carve-out (codex P1).
6. **Don't manufacture churn.** Pilot was genuinely compliant; PROV-006 is a documented finding, not an empty change.

## 8. Non-goals (unchanged, out of scope)

No backend/tool integration (0/117 **G1** remains a separate Codex/backend/TerraPilot lane); no tool-registry promotion;
no route/window-adapter (**G2**) change; no API/service implementation; no package/build/CI; no deploy/migration; no
PACS/county data. The `useDossierDetails` hook (`hooks/**`) was not modified — its stale-data behavior is guarded at the
component level instead. True per-*individual*-slice granularity was not pursued: the store loads the related bundle
atomically, so a bundle-level flag is already per-slice-accurate, and splitting the `Promise.all` would change
data-loading behavior for no honesty gain.
