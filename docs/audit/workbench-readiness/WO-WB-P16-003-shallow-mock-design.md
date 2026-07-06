# WO-WB-P16-003 — Shallow-Mock Design

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-003 — Shallow-Mock Design
**Category:** Documentation (design)
**Operator:** Claude Code · ratified tests-only follow-up

**Authorization:** Operator-ratified Phase-16 lane (tests-only / shallow mocks / no product behavior change). Allowed
writes: `frontend/apps/os-shell/src/__tests__/**`, `docs/audit/workbench-readiness/**`.

---

## 1. Purpose

Specify the exact mock surface for the re-authored test so it renders the **real** `SuiteModuleGrid` while excluding the
heavy graphs that crashed the worker — nothing more.

## 2. Mock surface (four boundaries, all shallow)

| Boundary | Mock | Why |
|----------|------|-----|
| `../../orchestration/moduleActivation` | `{ activateModule: vi.fn() }` via `vi.hoisted` | **The fix.** Removes the crash-inducing transitive graph from evaluation; lets the test assert the standalone call shape. |
| `react-router-dom` | spread actual, override `useNavigate → mockNavigate` | Capture navigation targets without a real router; `MemoryRouter` still wraps the tree. |
| `lucide-react` | Proxy returning a stub `<span data-slot="icon">` | Icons are irrelevant to the launch contract; avoids pulling real SVG components. |
| `../../stores/propertyStore` | `usePropertyStore(selector)` over `{ activeParcel: mockActiveParcel }` | Drives the parcel/no-parcel branch deterministically. Already present in the original test. |

Everything else — `SuiteModuleGrid` itself, `contracts/workbench` types — is imported **real**. The component under test
is not mocked.

## 3. `vi.hoisted` requirement

`vi.mock` factories are hoisted above imports, so the `activateModule` spy must be created in a hoisted block to be
referenceable both inside the factory and inside test assertions:

```ts
const { mockActivateModule } = vi.hoisted(() => ({ mockActivateModule: vi.fn() }));
vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: mockActivateModule,
  default: mockActivateModule,
}));
```

`default` is included defensively so the mock satisfies both named and default import styles; the product uses the named
import.

## 4. Assertion contract (what each mock enables)

- **Workbench + parcel:** `expect(mockNavigate).toHaveBeenCalledWith('/property/<parcelId>/<tab>')` — asserted via
  substring/regex on the single navigate call, and `expect(mockActivateModule).not.toHaveBeenCalled()`.
- **Workbench + no parcel:** navigate contains `/property` and `openTab=<tab>`.
- **Standalone:** `expect(mockActivateModule).toHaveBeenCalledWith('<moduleId>', { source: 'system' })` and
  `expect(mockNavigate).not.toHaveBeenCalled()`.
- **Broken (no `workbenchTab`):** neither spy called.

## 5. Non-goals

No mocking of the component under test; no deep-rendering of activated modules; no change to any product file; no new
route or registry entry. The mock set is the minimum that both (a) prevents the worker crash and (b) lets the real
`SuiteModuleGrid` branch logic be observed directly.
