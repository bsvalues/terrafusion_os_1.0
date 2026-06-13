# PulseHome Data Contract (design-only)

Status: **typed contract, not yet wired.** No UI, no network calls, no
`StageZeroState` changes. This document and
`frontend/apps/os-shell/src/contracts/pulseHome.ts` define the data shape a
future live "County Nerve Center" Home must satisfy so the cinematic prototype
(`docs/prototypes/terrafusion_home_county_nerve_center.html`) can become
production **without inventing county data**.

## Why this exists

The Home prototype is truthful only if every claim it shows is real and
attributed. `StageZeroState` is proof-sealed for data honesty; a live Home can
only ship once its data flows through contracts that make fabrication
structurally impossible. This is that contract.

## The honesty invariants (enforced by types)

1. **No live datum without a source.** `PulseRead<T>` can be `live` only when it
   carries both `data` and a `PulseSourceAttribution`.
2. **No count outside a live read.** Numbers live on `PulseEvidenceItem`, which
   only exists inside a `live` read with a source. Priority actions reference
   evidence by id — they never inline fabricated counts.
3. **`unavailable` carries a reason, never data.** There is no field to smuggle a
   placeholder value through.
4. **`loading` ≠ `unavailable`.** Absent/stale data must never render as live.
5. **County-scoped.** Every brief, event, and evidence item is scoped to one
   `countyId` + `rollYear`.

## Surface ↔ contract map

| Prototype section        | Contract type            | Read wrapper                         |
| ------------------------ | ------------------------ | ------------------------------------ |
| Morning Brief hero       | `PulseHomeBrief`         | `PulseRead<PulseHomeBrief>`          |
| Operational Pulse        | `PulseCondition[]`       | inside `PulseHomeBrief.conditions`   |
| Today's Action Path      | `PulsePriorityAction[]`  | inside `PulseHomeBrief.priorityActions` |
| What Changed Overnight   | `PulseActivityEvent[]`   | `PulseRead<PulseActivityEvent[]>`    |
| Evidence Behind Today    | `PulseEvidenceSummary`   | `PulseRead<PulseEvidenceSummary>`    |
| (per-datum provenance)   | `PulseSourceAttribution` | required on every live read/event/item |
| (any missing region)     | `PulseUnavailable`       | explicit "–" / reason in the UI      |

`PulseHomeSnapshot` bundles the three independent reads so the Home can show
**real partial availability** (e.g. live brief + unavailable evidence) without
faking the missing parts.

## Read result model

```ts
type PulseRead<T> =
  | { state: 'live'; data: T; source: PulseSourceAttribution }
  | { state: 'unavailable'; reason: string }
  | { state: 'loading' };
```

Constructors (`pulseLive`, `pulseUnavailable`, `pulseLoading`) are the only
sanctioned way to build a read. Guards (`isPulseLive`, …) and
`pulseDataOrNull` force callers to handle the gap rather than default to a
fabricated value.

## What is intentionally NOT in scope here

- No read layer / hooks / services. Wiring to governed backends (TerraForge
  ratio study, TerraDais queues, TerraTrace audit, notice/certification
  services) is a later WO.
- No UI. The prototype stays a design reference; production Home stays
  `StageZeroState` until a read layer satisfies this contract.
- No Academy launcher and no `StageZeroState` edits.

## Suggested next steps (future WOs)

1. **Read layer (MVP — landed):** `getPulseHomeSnapshot(countyId, rollYear)` in
   `frontend/apps/os-shell/src/services/pulse/pulseHomeService.ts` returns a
   `PulseHomeSnapshot`. It is unavailable-safe and dependency-injected: with no
   readers supplied, every region is an explicit `pulseUnavailable(...)` gap
   (nothing fabricated). Region readers (TerraForge ratio study, TerraDais
   queues, TerraTrace audit, notice/certification services) can be supplied one
   at a time to enable real partial availability. A throwing reader maps to
   `unavailable`. Mirror the `useTodaysWork` `throwOnError` + read-state pattern
   when wiring real readers.
2. **Honesty contract test:** add a source-inspection sweep (W-series style)
   asserting the wired readers have no sample/fixture fallback.
3. **Live Home behind a flag:** render the prototype layout from a
   `PulseHomeSnapshot`, showing live-with-source or explicit "–", and only
   promote to `/` once contract-complete.

## First real Pulse source (landed): Certification

`services/pulse/providers/certificationPulseProvider.ts` →
`readCertificationBrief(ctx, deps?)` is the first authoritative provider. It
reads the governed TerraDais certification source
(`daisService.getCertificationStatus` → `/api/dais/cert/status`) and maps it to
a `PulseCondition` + optional `PulsePriorityAction` + `PulseSourceAttribution`,
returned as a `readBrief`-compatible `PulseRead<PulseHomeBrief>`.

- Condition level is derived from the source status: `overdue` → critical,
  `at-risk` → attention, incomplete → watching, 100% → stable.
- The priority action's `why` is derived from real parcel counts; no evidence
  is fabricated (the evidence region stays empty until wired).
- Source throws or empty → `pulseUnavailable(...)` with a reason.
- Proven end-to-end: injected into `getPulseHomeSnapshot`, the certification
  brief goes live (with source) while activity + evidence remain explicit gaps.

This is the proof that the stack is real: governed source → provider →
`PulseRead<PulseHomeBrief>` → snapshot. Remaining domains (appeals, exemptions,
notices, valuation) follow the same provider shape, one at a time.

## Truth-layer protection (landed)

- **Pulse Honesty Guard** (`__tests__/governance/pulseHonestyGuard.contract.test.ts`):
  governance test that statically inspects every file under
  `services/pulse/providers/` (discovered dynamically — new providers are
  auto-guarded). A provider fails CI if it contains sample/demo/fixture/mock
  tokens, a fabricated `confidence`, a default `count: 0`, lacks a
  `pulseUnavailable(` gap path, or returns `pulseLive` from a catch/failure
  path. This makes "fallback disguised as live" a build failure.
- **Appeals provider** (`services/pulse/providers/appealsPulseProvider.ts`):
  second real provider, same canonical shape. Reads `getAllAppeals`
  (`/api/dais/appeals`); empty list is a legitimate live "zero open" stable
  state; throw → unavailable.
- **Aggregator** (`services/pulse/pulseFunctionSummary.ts`):
  `summarizePulseFunctions` + `projectAvailability` produce the per-function
  availability view (Certification: Watching · Appeals: Stable · Exemptions:
  Unavailable · Notices: Loading). Each function is independently
  live/unavailable/loading — one function's truth is never borrowed to cover
  another's gap. Tested for real partial availability across cert + appeals +
  an unwired gap, and for a throwing provider isolated as unavailable.
