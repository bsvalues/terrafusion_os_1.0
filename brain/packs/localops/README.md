# Domain Pack: LocalOps

> LocalOps is **TerraPilot inside the shell** — an OS feature, **not** a standalone app.
> Implementation: `os-platform/core/pilot/local-agent/` (CLI: `cli.ts`).

## Mission

Provide a county-boundary-safe AI operator. LocalOps is the local-first embodiment of TerraPilot that
keeps AI operation possible when external AI is unavailable or prohibited — without ever crossing the
governance lines that protect citizen data and production systems.

## Owns

- LocalOps AI operator doctrine and the local-agent governance surface.
- Local-first adapter registry (e.g. Claude / OpenAI / Ollama adapters) and controlled command execution.
- Read-only diagnostic / doctor-mode behavior (`doctorMode`, `controlCenter`).
- Source-grounded, trace-emitting operator responses inside the shell.

## Does Not Own

- Property records or valuation data — AI may **never** mutate these.
- Any suite's write lane (Forge / Atlas / Dais / Dossier).
- Shell chrome, routing, or window management (**Shell / OS Core**) — LocalOps runs *inside* the shell.
- The trace store (**TerraTrace**) — it emits to it.
- Autonomous production repair authority.

## Allowed Writes

- Local diagnostic output, doctor-mode reports, and operator session state (local-first).
- Trace events for operator actions (append-only, via TerraTrace).
- Mutations **only** after explicit human approval, and **only** through approved TerraPilot tools /
  service APIs carrying their risk classification.

## Forbidden Writes

- **Property record or valuation mutation by AI** — categorically forbidden.
- Any suite-owned record by a path other than an approved, human-approved TerraPilot tool.
- **Silent cloud fallback** — no quietly routing to external AI when local is unavailable/prohibited.
- **Unrestricted shell** — no arbitrary command execution outside the controlled command registry.
- **Autonomous production repair** — no self-directed changes to production.
- Shell chrome, routing, or z-index.

## Routing Rules

- LocalOps **v1 is local-first, read-only diagnostic, source-grounded, trace-emitting, and
  human-approved before any mutation.**
- Mutations route through TerraPilot tools; write_high / irreversible re-confirm mode + intent and are
  human-gated.
- When external AI is unavailable or prohibited, LocalOps stays local — it does **not** silently fall
  back to the cloud. The boundary is explicit and county-safe.
- Diagnostics emit TerraTrace events; findings cite their grounding source.
- LocalOps surfaces inside the shell (TerraPilot), never as a separate window/app.

## Required Proof

- `pnpm run type-check`.
- `node --test os-platform/core/tests/phase83-tools.test.mjs` (core tool tests — required gate).
- `pnpm canon` / `pnpm canon:gatefast`.
- Local-agent tests under `os-platform/core/pilot/local-agent/*.test.mjs`.
- Evidence of: no silent cloud fallback, no unrestricted shell, human approval before any mutation,
  trace emission, and source grounding.

## Common Failure Patterns

- Adding a cloud fallback that triggers without explicit operator/county consent.
- Widening the command registry into an unrestricted shell.
- An AI path that mutates a property/valuation record.
- A "self-heal" routine that changes production without human approval.
- Diagnostics that act (mutate) instead of reporting in v1.
- Missing trace emission or missing source grounding.

## Escalation Triggers

Stop and get human approval when a change would:

- Add or change any **mutation** capability (v1 is read-only diagnostic).
- Add or alter a **cloud fallback** path.
- Expand the controlled command registry's reach.
- Introduce any autonomous (non-human-approved) action.
- Touch property/valuation data from an AI path.

## Non-Goals (explicit — these are deferred)

- **Do not implement LocalOps yet** beyond this doctrine pack.
- Do not change TerraPilot UI.
- Do not build path-routing commands (WO-BRAIN-0014).
- No per-suite queues.
- No autonomous suite agents.
- No production behavior changes.

## Canon Sources

- `docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md` (TerraPilot modes, tool allowlists, risk classes, PII sanitization, trace logging)
- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§1.2 TerraPilot/TerraTrace as OS features; Article VII modes)
- `AGENTS.md` (root — Core Governance Surface; allowed scope `os-platform/core/pilot/**`)
- Implementation: `os-platform/core/pilot/local-agent/` (`cli.ts`, `adapterRegistry.ts`, `commandRegistry.ts`, `doctorMode.ts`, `controlCenter.ts`)
- Planning envelope (WO-LOCALOPS-000): `docs/localops/` (doctrine, work-order plan, Benton runbooks/profile/IT-questions, acceptance test)
