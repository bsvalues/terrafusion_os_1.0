# WO-WB-P16-001 — Parcel→Workbench Launch-Contract Current-State Audit

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-001 — Current-State Audit
**Category:** Documentation (read-only audit)
**Operator:** Claude Code · ratified tests-only follow-up (post-#1236 NLR record)

**Authorization:** Operator-ratified Phase-16 lane. **MODE: tests-only / shallow mocks / no product behavior change.**
Allowed writes: `frontend/apps/os-shell/src/__tests__/**`, `docs/audit/workbench-readiness/**`; read-only elsewhere
(Router.tsx, pages/workbench, SuiteModuleGrid product code). Backend / tool-registry / route-behavior / package / CI
out of scope.

---

## 1. Purpose

Establish the exact current state of the Phase-16 launch-contract test before re-authoring it, so the re-author is a
faithful restoration + a single behavior-truth correction, not an invention.

## 2. What exists on `origin/main` today

**Test file** — `frontend/apps/os-shell/src/__tests__/shell/launchSurfaceContractParcelWorkbench.contract.test.tsx`:
a 36-line **skipped stub**. Its top-of-file note (dated 2026-04-25) records that the original test imported the real
`SuiteModuleGrid`, whose transitive graph
(`orchestration/moduleActivation` → `config/moduleComponents` → `desktopStore` + `moduleLoaderStore` +
`notificationStore` + telemetry) crashed the vitest worker (`Worker exited unexpectedly`, tinypool). The stub is
`describe.skip(...)` with one intentionally-empty `it`.

**Product under test** — `frontend/apps/os-shell/src/components/suites/SuiteModuleGrid.tsx`, `handleLaunch(mod)`
(verified on `origin/main`):

| Condition | Behavior |
|-----------|----------|
| `launchMode === 'workbench'` && no `workbenchTab` | `return;` (silent guard, no navigation) |
| `launchMode === 'workbench'` && active parcel | `navigate('/property/${parcelId}/${mod.workbenchTab}')` |
| `launchMode === 'workbench'` && no active parcel | `navigate('/property?openTab=${mod.workbenchTab}')` |
| `launchMode === 'standalone'` | `activateModule(mod.moduleId ?? mod.id, { source: 'system' })` |

`SuiteModuleDef` type (source of truth for fixtures): `id`, `label`, `icon: LucideIcon`, `description`,
`launchMode: 'workbench' \| 'standalone'`, optional `workbenchTab: WorkbenchTabSlug`, optional `moduleId` (defaults to
`id`), optional `priority` / `telemetryLabel` / `truthState`.

## 3. What the original test asserted (recovered from commit `9cc1a1977`, 321 lines / 8 tests)

Mocks present: `react-router-dom` (`useNavigate → mockNavigate`), `lucide-react` (Proxy icon), `stores/propertyStore`
(selector over `mockActiveParcel`). **The `orchestration/moduleActivation` module was NOT mocked** — that omission is the
crash vector (§WO-WB-P16-002). Tests: Forge/Atlas/Dossier → `/property/:parcelId/:tab` containing the parcel id;
re-entry same URL; structural URL proof; broken module → no navigation; **standalone → asserted
`navigate('/statistics-studio')` etc.**; no-parcel → `/property?openTab=forge`.

## 4. The one staleness the re-author must correct

The original test 7 asserts standalone tiles call `navigate('/:moduleId')`. Since **WO-SUITE-ROUTING-001**, standalone
launch calls `activateModule(mod.moduleId ?? mod.id, { source: 'system' })` instead (the bare navigate had no registered
route and silently no-op'd). A verbatim restore would assert behavior the product no longer has and **fail**. The
re-author updates test 7 to the shipped behavior. This is a **test-truth correction, not a product change** — no product
file is edited in this lane.

## 5. Conclusion

The re-author is: restore tests 1–6 + the no-parcel bonus faithfully, ADD the missing `moduleActivation` shallow mock,
ADAPT test 7 to `activateModule`, and remove `describe.skip`. Product behavior is unchanged and unobserved by this lane.
