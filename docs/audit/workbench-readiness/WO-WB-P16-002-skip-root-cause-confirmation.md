# WO-WB-P16-002 — Skip Root-Cause Confirmation

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-002 — Skip Root-Cause Confirmation
**Category:** Documentation (read-only analysis)
**Operator:** Claude Code · ratified tests-only follow-up

**Authorization:** Operator-ratified Phase-16 lane (tests-only / shallow mocks / no product behavior change). Allowed
writes: `frontend/apps/os-shell/src/__tests__/**`, `docs/audit/workbench-readiness/**`.

---

## 1. Purpose

Confirm the precise reason the original Phase-16 test was quarantined, so the re-author fixes the actual cause rather than
working around a symptom.

## 2. The claimed cause (top-of-file skip note)

The 2026-04-25 note states: importing the real `SuiteModuleGrid` transitively pulls
`orchestration/moduleActivation → config/moduleComponents → desktopStore + moduleLoaderStore + notificationStore +
telemetry`, and that graph crashes the vitest worker (`Worker exited unexpectedly`, from tinypool).

## 3. Confirmation via import trace (verified on `origin/main`)

`SuiteModuleGrid.tsx` top-level imports include:

```ts
import { usePropertyStore } from '../../stores/propertyStore';        // MOCKED in original test
import { activateModule } from '../../orchestration/moduleActivation'; // NOT mocked → crash vector
```

`usePropertyStore` was already shallow-mocked in the original test, so it is not the cause. `activateModule` is imported
at **module-evaluation time**; because `orchestration/moduleActivation` was left un-mocked, vitest evaluated the real
module and its entire downstream graph (module component registry + three Zustand stores + telemetry) during test
collection. That eager evaluation — not any runtime call — is what destabilized the worker.

## 4. Why the fix is a single shallow mock

`handleLaunch` only ever calls `activateModule(targetId, { source: 'system' })`. The test never needs the real activation
side effects — it only needs to assert the call shape. Replacing the module with a `vi.fn()` stub via `vi.hoisted` +
`vi.mock('../../orchestration/moduleActivation', ...)` removes the heavy graph from evaluation entirely while preserving
the real `SuiteModuleGrid` (the actual unit under test). This is the minimal, honest fix: mock the crash-inducing
boundary, keep the product component real.

## 5. Conclusion

Root cause **confirmed**: a missing shallow mock for `orchestration/moduleActivation`, evaluated eagerly at import. The
re-author adds exactly that mock (see WO-WB-P16-003) — no product change, no test-behavior compromise.
