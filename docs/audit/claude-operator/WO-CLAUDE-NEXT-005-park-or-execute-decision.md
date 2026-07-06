# WO-CLAUDE-NEXT-005 — Park or Execute Decision

**Goal:** GOAL-TF-CLAUDE-NEXT-LANE-RATIFICATION-001
**WO:** WO-CLAUDE-NEXT-005 — Execute If Already Ratified, Otherwise Park
**Category:** Documentation (decision)
**Depends on:** WO-CLAUDE-NEXT-003/004

---

## Decision: **PARK** (no execution)

Per WO-CLAUDE-NEXT-003, **no lane is ratified for Claude Code to execute now**:
- The Brain's head recommendation (queue[0], ServiceRegistry) is **backend** — outside Claude's frontend/docs scope and
  adjacent to the **active** Codex Backend OE (#1233).
- No Claude-appropriate lane sits at the Brain head; promoting one would override Brain sequencing.

Therefore the loop's `IF NOT RATIFIED` branch applies:
1. **Do not execute.** No autonomous implementation without ratification.
2. **Owner decision required** — see WO-CLAUDE-NEXT-004 (Options A / B / C).
3. **Park cleanly.**

## What "park" means here

- Claude Code opens **no** implementation PR from this loop (only the docs of this ratification loop itself).
- Claude Code starts **no** Workbench, Sync, backend, or tool lane by default.
- Claude Code holds until the operator selects Option A/B/C, or `pnpm brain next` dispatches a Claude-eligible WO.

## Guardrails re-affirmed

No backend/registry/route/API/runtime/PACS/county work. No `--admin` / break-glass / hook bypass. Brain/Cortex remains the
sequencer; this loop is an evidence/decision input, not authority.

**Parked. No stop wall — this is the designed outcome of a ratification check with no ratified lane.**
