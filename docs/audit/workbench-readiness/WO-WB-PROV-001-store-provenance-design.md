# WO-WB-PROV-001 — Store Provenance Design / Scope Audit

**Program:** WORKBENCH-PER-SLICE-STORE-PROVENANCE
**Status:** COMPLETE — design + scope audit; no code change in this WO
**Category:** Documentation (design)
**Owner:** Claude Code (frontend provenance lane; non-colliding with Codex Backend OE)

**Authorization:** Operator authorized the WORKBENCH-PER-SLICE-STORE-PROVENANCE program with the allowed write set
`frontend/apps/os-shell/src/stores/**`, `frontend/apps/os-shell/src/pages/workbench/tabs/**`,
`frontend/apps/os-shell/src/__tests__/workbench/**`, and `docs/audit/workbench-readiness/**`. Writing under
`docs/audit/**` (outside root `AGENTS.md`'s default core write lane) proceeds under that explicit authorization.

---

## 1. Problem statement

Workbench honesty-badge coverage is 9/9 (WORKBENCH-HONESTY-INSTRUMENTATION). But three tabs (Clerk, Treasury, Audit)
drive their badge from **coarse parcel-shell** state — `activeParcel?.parcelId === parcelId && !activeParcelLoading &&
!activeParcelError`. In `propertyStore.selectParcel`, `activeParcelLoading` clears when the **parcel shell**
(`getParcel`) resolves, which is *before* the eager related-data bundle (`getTaxStatements` / `getRecordingHistory` /
`getAuditTrail` / …) resolves. So those three badges can read `live` during the window where the parcel shell is up but
the slice the tab actually renders has not loaded yet (or was cleared after a related-data failure). This WO designs a
**slice-aware** provenance signal that closes that window, using frontend-store-only state over the existing fetch.

## 2. How the store loads related data (verified in `propertyStore.ts`)

`selectParcel(parcelId)`:
1. sets `activeParcelLoading: true`, resets related data to `EMPTY_RELATED_DATA`;
2. `await getParcel(parcelId)` → on success sets `activeParcel`, `activeParcelLoading: false` (**shell done here**);
3. **then** fires one eager `Promise.all([...getAssessments, getDocuments, getAppeals, getTaxStatements,
   getRecordingHistory, getAuditTrail, getRecentOperations])`:
   - `.then(...)` sets **all seven** related slices at once;
   - `.catch(...)` resets **all seven** related slices to `[]` (no error flag is recorded).

**Key property: the related bundle is all-or-nothing.** Every displayed slice (`taxStatements`, `recordings`,
`auditTrail`) becomes available (or is cleared) at the same instant. Therefore a single **bundle-level** status field is
per-slice-accurate for the C-tabs — no need to split the `Promise.all` or add per-slice fetches. The store today exposes
**no** related-bundle loading/loaded/error flag (only `activeParcelLoading`/`activeParcelError`, which describe the
shell).

## 3. Per-tab audit

| Tab | Current badge predicate | Rendered data slice | Provenance class | Proposed predicate | Risk | WO |
|-----|------------------------|---------------------|------------------|--------------------|------|----|
| **Clerk** | `activeParcel?.parcelId === parcelId && !parcelLoading && !parcelError` | `recordings` (store slice) | parcel-shell-aware → slice-aware possible | `activeParcel?.parcelId === parcelId && relatedDataStatus === 'loaded'` | low | PROV-003 |
| **Treasury** | same parcel-shell predicate | `taxStatements` (store slice) | parcel-shell-aware → slice-aware possible | same slice-aware predicate | low | PROV-004 |
| **Audit** | same parcel-shell predicate | `auditTrail` (store slice) | parcel-shell-aware → slice-aware possible | same slice-aware predicate | low | PROV-005 |
| **Pilot** | `!toolsLoading && !toolsError` | Pilot tool list (`listPilotTools` on mount) | **already tool-list-aware** (not parcel-shell) | unchanged | none | PROV-006 (align/verify) |
| **Dossier** | `dossierDetails.data ? 'live' : 'unavailable'` | `useDossierDetails(parcelId)` detail | detail-slice-aware but **NOT parcel-keyed** | add component-level parcel-identity guard | med | PROV-007 |

Pilot is **already** driven by the exact slice it renders (the tool list), not by parcel-shell state — PROV-006 is
verification + test/doc alignment only (no manufactured churn).

Dossier's badge is keyed to `dossierDetails.data`, which is the detail slice — but it is **not parcel-keyed**:
`useDossierDetails` only clears `data` when `parcelId` becomes null, not when it *changes* (see
`frontend/apps/os-shell/src/hooks/useDossierDetails.ts`). After navigating from parcel A (details loaded) to parcel B,
A's `data` stays non-null while B is fetching, so the badge would read `live` for stale A details. The `useDossierDetails`
hook lives in `hooks/**` (outside this program's allowed write set), so **PROV-007 fixes this at the component level**
(`PropertyDossier.tsx`) by gating the badge on the loaded detail actually belonging to the current `parcelId` — the same
parcel-identity discipline the C-tabs use. This makes PROV-007 a real (small) component change, not verify-only.

Dossier's post-invocation `WorkbenchSourceBadge source='live'` badges (appeal packet / equalization / audit bundle) are
correlationId-gated — they render only after a successful governed tool response — and remain honest; out of scope here.

## 4. Proposed store change (PROV-002)

Add one bundle-level field to `PropertyState`, frontend-only, over the **existing** `Promise.all` — no new fetch, no new
data loading, no API-shape change, no persistence:

```
relatedDataStatus: 'idle' | 'loading' | 'loaded' | 'error'
```

Transitions in `selectParcel` (and `clearParcel`):
- `selectParcel` start / not-found (404) / shell error / `clearParcel` → `'idle'`;
- immediately before the eager `Promise.all` fires → `'loading'`;
- bundle `.then` (guarded by the existing `activeParcel?.parcelId` staleness check) → `'loaded'`;
- bundle `.catch` (same guard) → `'error'`.

Expose it via the existing selector pattern (`usePropertyStore((s) => s.relatedDataStatus)`). Because the bundle is
all-or-nothing, `relatedDataStatus === 'loaded'` is a truthful "the rendered slice is available" signal for all three
C-tabs.

## 5. Implementation order

1. **PROV-002** — add `relatedDataStatus` to the store (+ store-level tests) **together with its first consumer,
   PROV-003 (Clerk)**, so the field ships with a reader (a store field with zero consumers would be dead code and
   fail review). Return blocks emitted for both WOs.
2. **PROV-004** — Treasury wired to `relatedDataStatus` + contract test.
3. **PROV-005** — Audit wired to `relatedDataStatus` + contract test.
4. **PROV-006** — Pilot: verify already tool-list-aware; add/adjust a contract assertion only if it strengthens the
   contract; otherwise docs-only confirmation.
5. **PROV-007** — Dossier: add a component-level parcel-identity guard so the badge does not read `live` for a
   previous parcel's stale detail (the `useDossierDetails` hook is out of scope); update the Dossier honesty test.
6. **PROV-008** — evidence rollup.

## 6. Stop-wall check (none tripped)

- Does NOT require backend/API changes — the fetch is unchanged; only its lifecycle is recorded in the frontend store.
- Does NOT require tool-registry, route, window-adapter, or service changes.
- Tests use the existing mocked store/provider pattern — no live services.
- No overlap with Codex Backend OE files.
- Source of truth is proven from `propertyStore.ts` (the all-or-nothing bundle) — unambiguous.
- The new predicate is **strictly more truthful** than today's (it waits for the rendered slice's bundle to load), so no
  badge becomes less honest.

## 7. Non-goals (unchanged, out of scope)

No backend/tool integration (0/117 G1 remains a separate Codex/backend/TerraPilot lane); no tool promotion; no
route/window-adapter (G2) change; no API/service implementation; no package/build/CI; no deploy/migration; no
PACS/county data. True per-*individual*-slice granularity (independent per-slice load/error) is intentionally NOT pursued
because the store loads the bundle atomically — a bundle-level flag is already per-slice-accurate, and splitting the
`Promise.all` would change data-loading behavior for no honesty gain.
