# Domain Pack: Trace (TerraTrace)

> Feature ID: `terratrace` · Type: OS feature (audit/trace spine) · **Not a suite.**
> The bridge for cross-lane accountability.

## Mission

Record what happened. TerraTrace owns the append-only activity / evidence trail and is the bridge for
cross-lane accountability — it answers *what happened, when, by whom/what, and why* across every suite.

## Owns

- The append-only unified activity trail (OS-core trace spine).
- Trace event categories (`valuation`, `workflow`, `compliance`, `system`, `navigation`).
- Trace classification levels and retention (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`).
- Correlation-id chains for causal lookups (`pnpm run trace:query --correlation <id>`).

## Does Not Own

- Any suite's business state — Trace records *about* it, it does not own it.
- Valuation, GIS, workflow, or document data (the suites own those).
- Shell routing or window management (**Shell / OS Core**).
- Financial/compliance **audit** semantics reserved for the future TerraAudit office — Trace uses
  `trace` / `activity`, never `audit`, for assessor activity.

## Allowed Writes

- Appending new trace events (the only write shape — append-only).
- Correlation metadata linking causally related events.

## Forbidden Writes

- **Mutating or deleting existing trace records** — the trail is append-only and immutable.
- Turning trace into mutable business state (it must never become the source of truth for a suite fact).
- Using the word `audit` for assessor activity logging (reserved for TerraAudit; use `trace`/`activity`).
- Shell chrome, routing, or z-index.

## Routing Rules

- Every write-lane action in a suite **emits** a TerraTrace event in the correct category; suites do not
  invent their own parallel logs.
- Cross-lane accountability flows through Trace — it is the bridge, not a per-suite ledger.
- Debugging routes through trace lookups: `pnpm run trace:query --correlation <id>`, `--recent`,
  `--type`, `--error-code`, `--component`.
- AI-initiated actions (TerraPilot/TerraGPT) must emit trace events with source grounding where applicable.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast`.
- Evidence that write actions emit trace events (the constitution's "Trace Emission" check; warning-level
  but expected for write paths).
- Append-only integrity: no update/delete paths introduced against the trail.

## Common Failure Patterns

- Reading the latest state *from* trace and treating it as authoritative business state.
- Adding an update/delete path to "fix" a trace record instead of appending a correction event.
- A suite logging to its own side-channel instead of emitting a TerraTrace event.
- Mislabeling categories (e.g. a workflow change logged as `system`).
- Using `audit` terminology for assessor activity.

## Escalation Triggers

Stop and get human approval when a change would:

- Make any part of the trail mutable, or add a delete/redact path.
- Change retention or classification-level semantics (legal / compliance impact).
- Add or rename a trace **category** or classification **level** (constitutional).
- Repurpose trace as a business-state store.

## Non-Goals

- No mutable trace state.
- No suite business logic in the trace spine.
- No `audit`-named assessor logging.
- No shell/routing changes.
- No suite-local brain or queue authority.

## Canon Sources

- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§1.2 OS features; Article IX trace categories & classification; §2.3 / §8 audit-vs-trace disambiguation)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (unified activity trail = TerraTrace, append-only)
- `AGENTS.md` (root — trace:query debugging workflows, correlationId model)
