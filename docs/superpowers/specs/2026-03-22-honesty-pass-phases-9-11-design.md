# TerraFusion OS — Honesty Pass + Phases 9–11 Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Prerequisite:** Phase 8 sealed (`d1422241f`), Persistent Shell Chrome sealed (`0cd3f05ee` + `4631919b2`)

---

## Goal

Eliminate unsupported data claims from all mounted workbench surfaces, then progressively wire each suite to real backend data and full operational controls. Three depth rounds (A → B → C) run across four streams, with shared disclosure infrastructure built once before any parallel work begins.

---

## Architecture

### Operating Model: Hub-and-Spoke + Parallel Streams

```
Program Control Plane
├── Lead Coordinator Agent (main branch)
│   ├── enforces scope containment
│   ├── sequences rounds A → B → C
│   ├── owns merge order and regression gates
│   └── writes release evidence updates
│
├── Stream 0: Shared Infra / Contract Sync (sync, runs first)
│   ├── WorkbenchSourceBadge component
│   ├── useSourceDisclosure() hook
│   ├── honesty contract test pattern
│   └── gate before any parallel stream opens
│
├── Stream 1: Dais   (rounds A, B, C)
├── Stream 2: Forge  (rounds A, B, C)
├── Stream 3: Atlas  (rounds A, B, C)
└── Stream 4: Summary (round A only)
```

### Worktree Map

```bash
git worktree add ../tf-honesty-shared  -b plan/honesty-shared
git worktree add ../tf-honesty-dais    -b honesty/dais
git worktree add ../tf-honesty-forge   -b honesty/forge
git worktree add ../tf-honesty-atlas   -b honesty/atlas
git worktree add ../tf-honesty-summary -b honesty/summary

git worktree add ../tf-phase9-dais     -b phase9/dais-core
git worktree add ../tf-phase10-forge   -b phase10/forge-core
git worktree add ../tf-phase11-atlas   -b phase11/atlas-core
```

### Subagent Breakdown (per stream)

Each stream gets four subagents in sequence:

1. **Claim Mapper** — inventory every displayed claim; map each to a returned field or mark unsupported
2. **Patch Agent** — remove unsupported claims; add disclosure badge / request-returned phrasing; bounded to one surface slice at a time
3. **Test Agent** — add/update contract regression; assert old wording absent; assert new disclosure present; assert real tool/hook invocation path
4. **Evidence Agent** — write dated ops note; thread closure into release packet; record proof wall outputs

---

## Shared Infra — Stream 0

### `WorkbenchSourceBadge`

Inline pill rendered in each tab's card header. Four states:

| State | Condition | Display |
|-------|-----------|---------|
| `live` | FreshData.source is `'live'` or `'polled'` and isStale is false | "Live" (green) |
| `partial` | Some fields come from live data, others from fixture/fallback | "Partial — N of M fields live" (yellow) |
| `fallback` | FreshData.source is `'fallback'` — backend returned nothing, fixture used | "Demo data" (amber) |
| `unavailable` | data is null or FreshData.source is `'unavailable'` | "Unavailable" (muted) |

`partial` is used when a tab renders a mix of live-fetched fields and hardcoded fixture fields within the same card. The Patch Agent must explicitly declare per-tab which state applies at the time of the honesty pass. If all fields are fixture, use `fallback`. `partial` is only correct when at least one field is live-fetched via a real hook or tool call.

```tsx
<WorkbenchSourceBadge source="fallback" />
<WorkbenchSourceBadge source="live" />
<WorkbenchSourceBadge source="partial" liveFields={3} totalFields={8} />
<WorkbenchSourceBadge source="unavailable" />
```

### `useSourceDisclosure(data: FreshData<unknown> | null)`

Reads the existing `FreshData<T>` envelope and returns badge props:

```ts
type DisclosureResult = {
  source: 'live' | 'partial' | 'fallback' | 'unavailable';
  label: string;        // human-readable: "Live", "Demo data", "Partial — N of M fields live", "Unavailable"
  variant: 'success' | 'warning' | 'muted' | 'default';
  // variant maps to design-system badge severity, not source state 1:1:
  // live → 'success', partial → 'warning', fallback → 'warning', unavailable → 'muted'
};
```

Falls back to `{ source: 'unavailable', label: 'Unavailable', variant: 'muted' }` when data is null.

### Honesty Contract Test Pattern

Each tab that receives a honesty pass gets its **own new contract test file**:

```
src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx
src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx
```

These are separate from the existing `forgeSuiteSourceHonesty.contract.test.tsx` (which tests the suite-home route, not workbench tabs). Each contract test must assert:
- `WorkbenchSourceBadge` renders with the correct state for that tab
- Any text strings that were identified as unsupported claims are **absent** from the rendered output
- The tab does not render numerical values sourced from fixtures without a disclosure label
- Where a tool or hook is invoked, the test asserts the invocation path is exercised (mock the hook, assert it was called)

Stream 0 delivers a template test shell that each stream's Test Agent fills in.

---

## Depth Rounds

### Round A — Honesty Pass

**Scope:** Remove unsupported claims and add source disclosure to all four workbench tabs.

**Surfaces:**
- `PropertyDais.tsx` — Queue Statistics card (highest-priority; reconfirm at stream open)
- `PropertyForge.tsx` — Reconciliation and final indicated value cards
- `PropertyAtlas.tsx` — FEMA flood zone and aerial imagery claims
- `PropertySummary.tsx` — Assessment values and last sale price freshness

**Round A Merge Order:**
1. `honesty-shared` (gate — must pass before any stream begins)
2. `honesty/dais`
3. `honesty/forge`
4. `honesty/atlas`
5. `honesty/summary`

**Per-Tab Success Criteria — a tab passes only when:**
- Unsupported claims are removed or narrowed to request-returned wording
- `WorkbenchSourceBadge` renders with the correct declared state for that tab (`live`, `partial`, `fallback`, or `unavailable` — Claim Mapper declares which)
- A new `PropertyX.honesty.contract.test.tsx` file exists with all assertions above passing
- Old overclaim language strings are asserted absent in the contract test
- Fixture/demo data values are not presented as authoritative numbers without disclosure
- Ops evidence note is written
- Proof wall is green (see below)

**Proof Wall (per stream):**

```bash
# Run targeted tab contract test
pnpm --dir frontend exec vitest run src/__tests__/workbench/PropertyX.honesty.contract.test.tsx

# TypeScript gate
pnpm run type-check

# Phase 8 tools regression — confirms shared FreshData/hook infrastructure
# is undamaged by the honesty pass changes. Required for all streams
# because WorkbenchSourceBadge consumes FreshData which Phase 8 sealed.
node --test os-platform/core/tests/phase83-tools.test.mjs
```

**Round A Gate (after all five merges):**
- TypeScript: 0 errors
- Vitest: 0 failures, skip ceiling ≤ 222
- Snyk ceiling: ≤ 71 findings
- Pre-commit gate: PASS
- `phase83-tools.test.mjs`: PASS
- Phase seal commit on main: `seal(cp28): round-a honesty pass complete`

---

### Round B — Live Data Wiring

Opens only after Round A gate passes. Three parallel streams only (Summary is Round A only).

**Round B Merge Order:**
1. `phase9/dais-core`
2. `phase10/forge-core`
3. `phase11/atlas-core`
4. Mainline integration gate (fires once, after all three are merged)

**Phase 9 — TerraDais Operational Core (`phase9/dais-core`)**

Scope:
- Queue management surfaces
- Appeals workflow surfaces
- Real Dais operational data surfaces

Tests first:
- Hook/service contract tests
- Stale/fallback/unavailable state tests
- Action-path tests for supervisor controls
- Request/response rendering tests
- Accessibility checks for operational actions

**Phase 10 — TerraForge Analytical Core (`phase10/forge-core`)**

Scope:
- Real valuation engine integration
- Regression studio data surfaces
- Cost approach surfaces

Tests first:
- Valuation service contract tests
- Model/result rendering tests
- Edge-case numerical tests
- Stale/live source disclosure checks
- Route-level regression tests

**Phase 11 — TerraAtlas Operational Depth (`phase11/atlas-core`)**

Scope:
- Map layers
- Parcel geometry
- Spatial query surfaces

Tests first:
- Layer toggle state tests
- Geometry/render contract tests
- Spatial query result tests
- Source disclosure tests
- Performance-safe interaction tests

**Round B Stream Seal Criteria (each stream independently):**
- TypeScript: 0 errors
- Vitest: 0 failures, skip ceiling ≤ 222
- All new hook/service contract tests passing
- Source disclosure (`WorkbenchSourceBadge`) updated to reflect actual live state
- Ops evidence note written

**Round B Mainline Integration Gate (after all three merges):**
- TypeScript: 0 errors
- Vitest: 0 failures, skip ceiling ≤ 222
- Snyk ceiling: ≤ 71 findings
- Pre-commit gate: PASS
- `phase83-tools.test.mjs`: PASS
- Phase seal commit on main: `seal(cp29): round-b live data wiring complete`

---

### Round C — Full Operational Core

Same three streams, still parallel. May add new surfaces and controls.

**Round C Merge Order:**
1. `phase9/dais-core` (continued on same branch or new branch `phase9/dais-ops`)
2. `phase10/forge-core` (or `phase10/forge-ops`)
3. `phase11/atlas-core` (or `phase11/atlas-ops`)
4. Mainline integration gate

**Dais Round C Scope:**
- Supervisor dashboards
- Queue reassignment / workload operations
- Appeals execution controls
- Operational audit breadcrumbs

**Forge Round C Scope:**
- Analyst workbench depth
- Model comparison / regression studio expansion
- Cost approach workflows
- Valuation review surfaces

**Atlas Round C Scope:**
- Map execution tooling
- Parcel/depth overlays
- Spatial filter/query authoring
- GIS workflow continuity with shell persistence

Tests first (all streams):
- End-to-end interaction tests for new surfaces
- Regression guards around route ownership and shell containment
- Deeper data-integrity and accessibility checks
- Release evidence updates per stream

**Round C Mainline Integration Gate (after all three merges):**
- TypeScript: 0 errors
- Vitest: 0 failures, skip ceiling ≤ 222
- Snyk ceiling: ≤ 71 findings
- Pre-commit gate: PASS
- `phase83-tools.test.mjs`: PASS
- All new surface interactions covered by test
- Phase seal commit on main: `seal(cp30): round-c full operational core complete`

---

## Execution Rhythm (per stream, every time)

```
1. Reconfirm strongest bounded slice
2. Write direct regression first (TDD)
3. Patch only that slice
4. Run targeted proof wall
5. Write ops evidence note
6. Merge only after mainline stays green
```

---

## Constitutional Invariants (Do Not Break)

- TypeScript: 0 errors
- Vitest: 0 failures, skip ceiling ≤ 222
- UI token ratchet: 770 ≤ 812
- Snyk ceiling: ≤ 71 findings
- Pre-commit gate: PASS
- AISwarmDashboard: deprecated not deleted

---

## Commit Convention

- One seal commit per completed stream (not omnibus)
- Evidence notes in `os-platform/core/pilot/ops/`
- Phase seal format: `seal(cpN): <stream> <round> complete`

---

## Immediate Next Move

1. Open Stream 0 / `honesty-shared` worktree
2. Build `WorkbenchSourceBadge` with all four states
3. Build `useSourceDisclosure()` with defined return shape
4. Write contract test template shell
5. Pass type-check + vitest
6. Gate: merge `honesty-shared` to main
7. Open all four honesty streams in parallel, Dais first in merge priority

**First bounded target after shared infra:** `PropertyDais.tsx` → Queue Statistics card (Claim Mapper reconfirms ranking at stream open; assume strongest unsupported claim until disproven).
