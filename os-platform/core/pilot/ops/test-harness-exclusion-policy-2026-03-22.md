# Test Harness Exclusion Policy — 2026-03-22

**Classification**: Quality Lane — Harness Governance
**Sealed at**: cp31-zero-excludes-seal (`0e5a6202f`)

---

## Rule: No Exclusion Without Root-Cause Proof

A test may not be added to `vitest.config.ts → exclude` unless the commit message
or an ops note names the **specific missing capability or fixture** that prevents it
from running in the standard suite.

"Flaky", "timing issue", "environment-specific", and "real-hosting env" are not
root causes. They are fog. The fog must be lifted before the exclusion is filed.

---

## The Two Cave Goblins (Lessons Learned)

### workbenchRealHosting.gate.test.tsx

| | |
|---|---|
| **Filed as** | "real-hosting env / act() timing" |
| **Actual cause** | `WorkbenchSourceBadge` was added to `components/workbench` barrel in Round A honesty pass. The barrel mock in this test file did not include it. Vitest strict-mock threw on any render that imported `PropertyAtlas` or `PropertyDais`. |
| **Fix** | Add `WorkbenchSourceBadge` stub to `vi.mock('../../components/workbench')` factory. |
| **Time in exile** | ~1 session |

### RiskPolicyGate.irreversible.test.tsx

| | |
|---|---|
| **Filed as** | "act() timing flake under parallel suite load" |
| **Actual cause** | `vi.useFakeTimers()` was called inside two test bodies in `token_expires_and_flow_rejects`. Under full parallel suite load, timer state leaked into adjacent tests before `afterEach` could restore real timers. |
| **Fix** | Move `vi.useFakeTimers()` into `beforeEach` / `afterEach` scoped to the describe block. Add `vi.useRealTimers()` to the top-level `beforeEach` as belt-and-suspenders reset. |
| **Time in exile** | ~1 session |

---

## Barrel Mock Drift Prevention

When a test mocks a whole barrel (e.g., `vi.mock('../../components/workbench', () => ({...}))`),
every named export consumed by any component under test must appear in the factory.

**Preferred pattern** — auto-include via importOriginal (drift-proof by design):

```ts
vi.mock('../../components/workbench', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../components/workbench')>();
  return {
    ...real,
    // override only what needs to differ
    SomeComponent: () => <div data-testid="some-component" />,
  };
});
```

**Acceptable pattern** — manual factory (requires audit after every barrel export addition):

```ts
vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ...,
  InvocationHistory: ...,
  EvidenceSnapshotPanel: ...,
  WorkbenchSourceBadge: ({ source }: any) => (   // ← must include ALL barrel exports
    <span data-testid="workbench-source-badge" data-source={source} />
  ),
}));
```

**Audit trigger**: any time a new export is added to `components/workbench/index.ts`,
grep for `vi.mock.*components/workbench` and add the stub to every manual factory found.

Current barrel exports (`components/workbench/index.ts` as of 2026-03-22):

- `ParcelContextHeader`
- `InvocationHistory`
- `SuiteCompass`
- `ContextRibbon`
- `WorkModeSelector`
- `ActivityFeed`
- `EvidenceSnapshotPanel`
- `ParcelContextBanner`
- `PolicyGuardUI`
- `WorkbenchSourceBadge`  ← added Round A; caused workbenchRealHosting exile

---

## Fake Timer Scoping Policy

`vi.useFakeTimers()` must live in a `beforeEach` / `afterEach` pair at the describe
level that requires fake clocks. It must **never** be called inside a test body.

```ts
// CORRECT — scoped to describe
describe('token_expires_and_flow_rejects', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('...', async () => { /* no useFakeTimers here */ });
});

// WRONG — in test body
it('...', async () => {
  vi.useFakeTimers();   // ← leaks if test throws before afterEach
  // ...
});
```

Files confirmed compliant as of this seal:

| File | Pattern |
|---|---|
| `useAppealsQueue.test.ts` | beforeEach/afterEach ✓ |
| `usePacsStatus.test.ts` | beforeEach/afterEach ✓ |
| `useSwarmLive.test.ts` | beforeEach/afterEach ✓ |
| `useWorkloadSummary.test.ts` | beforeEach/afterEach ✓ |
| `usePilotTraceList.test.tsx` | beforeEach/afterEach ✓ |
| `legacyUiTelemetry.test.ts` | beforeEach/afterEach ✓ |
| `Desktop*.test.tsx` (all) | beforeEach/afterEach ✓ |
| `RiskPolicyGate.irreversible.test.tsx` | **fixed** 2026-03-22 ✓ |

---

## Exclusion Checklist (Required Before Any `exclude` Addition)

- [ ] Root cause named (not just symptom)
- [ ] Evidence that the test passes in isolation documented
- [ ] Specific missing capability or env var named
- [ ] Ops note filed referencing commit hash
- [ ] Revisit date set (or capability-gate condition stated)

If all boxes cannot be checked, the test is not "environment-specific". It is broken.
Fix it.

---

**Gate at seal**: 510 passed | 0 failed | 222 skipped | exclude list: empty
