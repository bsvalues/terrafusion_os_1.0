# WO-BRAIN-001 — Brain Operator Authority / Current Capability Audit

**Program:** P7 — AI / Brain / Operator System
**Date:** 2026-07-01
**Mode:** Read-only (R0). No CLI code change, no new automation, no runtime code, no mutation, no secrets.
**Sources:** `docs/brain/*` (authority/modes/canon) + `scripts/brain/*.mjs` (implementation), source read only.
**Authority Boundary:** SW-02/03/09/10 not crossed. The CLI was NOT executed.

---

## 0. Headline

**Brain (Cortex) is a governance *validator and decision-support* layer — not an autonomous
*sequencer* or *executor*.** Its documented authority is rich (constitutional execution layer); its
implemented capability is a set of deterministic, canon-driven validators. The one capability the
Work Order Engine program aims for — *compute what's next* — is **a config-driven stub** (`brain
next` reads a human-curated JSON queue). The actual cross-program sequencing demonstrated this
session was performed by the **operator doctrine (WOE-011/012/014) executed by the agent**, not by
the Brain CLI.

---

## 1. Documented Authority (Cortex model)

`docs/brain/BRAIN_AUTHORITY.md` + `CORTEX_MODES.md`:

- **Cortex** = "the highest operational authority below the human architect… the constitutional
  execution layer." Human architect is final; agents operate through Cortex-issued work orders;
  every override is recorded.
- **Seven parts:** Canon (law) · Graph (map) · Memory (history) · SEAL (enforcement) · Agents
  (labor) · Trace (evidence) · Release (readiness).
- **Power loop:** Observe → Classify → Decide → Assign → Verify → Record → Learn.
- **Verdicts (not booleans):** Proceed · Proceed-with-constraints · Escalate · Defer · Block · Recover.
- **Modes:** Architect · Surgeon · Sentinel · Release · Memory · Recovery.
- **Risk → approval:** `R0 read-only → proceed · R1 docs/tests → proceed · R2 single-suite code →
  work order · R3 persistence/API → human review + passport · R4 shell/cross-suite → architect
  approval · R5 constitution/sec → manual only`.

This is a complete **authority doctrine**.

---

## 2. Implemented Capability (the CLI — `scripts/brain/*.mjs`)

~18 commands. Classified by what they actually do (source-read, not executed):

### REAL (deterministic computation over real repo state) — 14
- `status` — parses drift-ledger + WO list, counts open P0/P1.
- `ask` / `classify` / `judge` — canon-based routing: `ownerOf`, `canWrite`, `classify`, `riskOf`
  (R0–R5), verdict. **Deterministic rule-lookup, never generation** (proof standard ADR-0003).
- `workorder create` — generates a bounded WO file with embedded machine-policy (allowed/forbidden).
- `today` — ranks open drift by severity.
- `release` — counts gates + open drift → confidence verdict (capped by P0/P1).
- `check` — wraps enforcement scripts (naming-lint, write-lanes, protected-paths, hardcoded-ports,
  reserved-staging, passport).
- `review-diff` — validates a diff against WO allowed/forbidden scope.
- `commit-plan` — isolates in-scope vs unrelated files.
- `proof` — writes an evidence bundle.
- `contradiction` — bounded canon-vs-code check.
- `panic` — recovery: diff + incident skeleton.

### MUTATING — 1
- `defer` — appends to `deferred.md` (the only write command; an anti-expansion valve).

### READ-ONLY prints — `drift`, `gates`, `help`.

### THIN / CONFIG-DRIVEN — the important one
- **`brain next` — CONFIG-DRIVEN STUB (`brain.mjs` ~477-519).** It reads
  `docs/brain/canon/next-queue.json` and returns `queue[0]` (with a P0/P1 override guard). **No
  dependency analysis, no evidence/graph routing, no risk computation** — the queue is
  **human-curated**. On empty queue it prints `UNRESOLVED — edit next-queue.json`. The real engine
  is deferred to Graph (WO-0003), which is not implemented.

### Guards (read-only enforcement, wrap JSON rules)
- `check-protected-paths` (constitution/ARCHIVE/frontend-src ratchet), `check-hardcoded-ports`
  (zero-tolerance :3000/:5000), `check-reserved-staging` (reserved-office controller ratchet),
  `check-agent-passport` (passport schema + WO linkage).

---

## 3. Implemented vs Documented-Only

| Documented authority | Implemented? | Reality |
|----------------------|--------------|---------|
| Classify (layer/suite/risk/verdict) | ✅ REAL | `classify`/`judge` over canon |
| Block unsafe work / enforce contracts | ✅ REAL | `check`/`review-diff`/guards (SEAL mirror) |
| Generate bounded work orders | ✅ REAL | `workorder create` |
| Release readiness judgment | ✅ REAL | `release` |
| Record (ADR/drift/incident) | PARTIAL | `defer` appends; ADRs/incidents are human-written skeletons |
| **Compute what's next (sequencing)** | ❌ **STUB** | `brain next` reads a human-curated queue; no engine |
| Graph-informed routing | ❌ NOT IMPL | deferred to WO-0003 (Graph not ready) |
| Self-update canon | ❌ NO | canon is read-only to Brain; humans edit + commit |
| Execute work | ❌ NO (by design) | Brain is decision-support; agents execute |

**Only mutating command: `defer`.** Everything else is read-only or evidence-writing. Brain **never
guesses** — it returns `UNRESOLVED` when canon doesn't answer (ADR-0003).

---

## 4. Brain Authority vs the Operator Doctrine (WOE-011/012/014)

The operator doctrine built this session is the **sequencing/continuation half** that the Brain CLI
does not implement. They are two expressions of the **same authority model**:

| Cortex (implemented CLI) | WOE operator doctrine (docs + agent-executed) |
|--------------------------|-----------------------------------------------|
| R0–R5 risk → approval | risk-class continuation rule (R0/R1 proceed, R2 WO, R3+ wall) |
| Verdicts: Proceed/Escalate/Defer/Block/Recover | stop walls SW-01..SW-10 + continuation gate |
| Modes: Architect/Surgeon/Sentinel/Release/Memory/Recovery | `/loop` modes (once/program/merge-watch/discovery/evidence/recovery/stop) |
| `brain next` (config-driven) | `/goal` + `/loop program` + Autonomous Continuation Gate (cross-program advance) |
| Human architect is final | Human is the authority wall, not the dispatcher |

**Key reconciliation:** the **"Brain owns sequencing"** doctrine (control-plane memory) is
*aspirational* for the autonomous engine. Today, sequencing intelligence lives in the **operator
doctrine (docs) + the agent executing it** — proven by this session's 7-program autonomous run —
**not** in `brain next`. The Brain CLI supplies the *validation* substrate (classify/judge/check)
that the operator doctrine should call into.

**Recommendation (future WO, code = R2+, authorization):** wire `brain next` to consume the
Program Playbook Register + Wall Ledger + Continuation Gate instead of a hand-curated
`next-queue.json`, so the implemented CLI and the operator doctrine converge. That is a code change
(SW-09-class) — **not this WO**.

---

## 5. Honest Capability Verdict

- Brain is a **real, honest governance validator**: deterministic, canon-grounded, never-guesses,
  SEAL-mirrored enforcement. 14/18 commands do real work.
- Brain is **not** an autonomous next-WO engine: `brain next` is a config-driven stub; the real
  engine is unbuilt (deferred to Graph).
- The **operator doctrine (WOE)** is the current sequencer, executed by the agent — and it is
  **docs, not code**. This is the single largest Brain/operator gap: the sequencing authority is
  documented and agent-executed but not CLI-implemented.
- No fabricated capability found. The docs describe Cortex as an authority *model*; they do not
  falsely claim the autonomous engine exists (the code honestly returns `UNRESOLVED`).

---

## 6. Stop Walls Respected

| Wall | Status |
|------|--------|
| SW-02 mutation | not crossed (read-only; CLI not run) |
| SW-03 secrets | not crossed |
| SW-09 runtime/code | not crossed (no CLI change; `brain next` rewire flagged as future WO) |
| SW-10 auth/security | not crossed |

---

## 7. Evidence Log

- Authority: `docs/brain/BRAIN_AUTHORITY.md`, `docs/brain/CORTEX_MODES.md`
- CLI: `scripts/brain/brain.mjs` (~18 cmds; `next` config-driven at ~477-519), `workorder.mjs`,
  `canon.mjs` (ownerOf/canWrite/classify/judge/riskOf), `brain-pulse.mjs`
- Guards: `check-{protected-paths,hardcoded-ports,reserved-staging,agent-passport}.mjs`
- Canon: `docs/brain/canon/*.json` (read-only to Brain), `next-queue.json` (human-curated)
- Operator doctrine (this session): `PROGRAM_PLAYBOOK_REGISTER`, `GOAL_LOOP_AUTONOMY_RULES`,
  `AUTONOMOUS_CONTINUATION_GATE`, `CROSS_PROGRAM_DEPENDENCY_GRAPH`, `STOP_WALL_REGISTER`
- Proof standard: ADR-0003 (UNRESOLVED over guessing); ADR-0007 (Cortex naming)

---

**WO-BRAIN-001: COMPLETE (read-only).** brain-operator R0 queue exhausted. The one improvement it
surfaces — converging `brain next` with the operator doctrine — is a code change (R2+/SW-09) and a
future authorized WO.
