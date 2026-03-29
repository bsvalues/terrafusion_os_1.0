# Next Codex Phase Program

**Date**: 2026-03-29  
**Purpose**: define the next Codex-only phases that keep converting control-plane ambiguity into execution-ready Copilot work without touching runtime code  
**Lane rule**:
- Codex stays in docs/control-plane artifacts only
- Copilot remains the only coding lane
- sub-agents are allowed for Codex planning discovery and for Copilot execution only inside a selected runtime card

## Companion Board

- [2026-03-29-codex-phase-board.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-codex-phase-board.md)

## Authority Stack

1. [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)
2. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
3. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
4. [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
5. [2026-03-28-hold-card-unlock-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hold-card-unlock-ledger.md)
6. [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)

## Program Goal

Move the control plane from:

- a valid runtime card queue

to:

- a continuously replenished, execution-ready Copilot queue with minimal discovery burden during runtime work

A Codex phase is successful only if it does at least one of these:

1. promotes a `HOLD-CARD` into a bounded execution card
2. reduces ambiguity for a currently clear card
3. prevents stale or duplicate control-plane drift from reopening closed work

## Multi-Agent Model

One parent Codex phase owns the objective. Sub-agents may split only by document output, not by runtime surface. Every sub-agent result must reconcile back into the canonical packet chain before the phase is considered complete.

## Planning Tracks

### Track A - Hold Unlocking

Goal:
- turn `HOLD-CARD`s into exact-file runtime cards where possible

### Track B - Execution Operations

Goal:
- make clear cards faster and safer for Copilot to execute

### Track C - Canon Hygiene

Goal:
- stop stale docs, duplicate paths, alias drift, and no-card confusion from reintroducing execution noise

## Phase Queue

| Phase | Track | Purpose | Exact Deliverables | Depends On | Unlocks Or Improves |
| --- | --- | --- | --- | --- | --- |
| `CP-51` Pilot/Trace file-proof seal | Track A | unlock `45C` | exact Trace host file proof; updated `45C` scope; unlock-ledger promotion entry; collision entry for `45C` | current unlock ledger | possible promotion of `45C` |
| `CP-52` Forge renderer inventory seal | Track A | unlock `46B` and `46C` | exact renderer file inventory for `Statistics Studio`, `Batch Cost Runs`, `Coefficient Preview`, `Cost Manual`, `Value Audit Log`; exact `Regression Studio` host proof; split recommendation for `46B` | current atlas and unlock ledger | promotion path for Forge renderer cards |
| `CP-53` Atlas/Dossier proof seal | Track A | unlock `47B` and `49B` | exact renderer file proof for `Geo Equity` and `Appraisal GIS`; exact Workbench Dossier tab host proof; collision updates for promoted cards | current atlas and unlock ledger | promotion path for Atlas renderer truth and Dossier workbench proof |
| `CP-54` Governance/Admin host proof seal | Track A | unlock `50A`, `50B`, `50C`, and `50D` | exact host file proof for `Governance Dashboard`, `Monitoring`, `Admin Dashboard`, and `User Admin`; bounded scope notes; promotion recommendations | `CP-51` to `CP-53` stable preferred | promotion path for governance/admin hold cards |
| `CP-55` Shell hot-surface seal | Track A | unlock `45D` and `50E` | exact StageZero proof-seal write set; explicit separation of shell-proof work from launcher-dialect work; hot-file window rules | current collision matrix plus human hot-file clearance | possible shell-card promotion later |
| `CP-56` Parent/sub-agent split packs | Track B | harden clear cards for multi-agent execution | parent/sub-agent split maps for `44A`, `44B`, `45A`, `45B`, `46A`, `47A`, `48A`, `49A` | current collision matrix and scoreboard | safer multi-agent Copilot execution |
| `CP-57` Evidence and handoff packetization | Track B | reduce runtime ambiguity during execution | screenshot target list; evidence checklist; closeout template; stronger paste-ready prompts for clear cards | `CP-56` preferred | faster Copilot handoffs |
| `CP-58` Execution rhythm board | Track B | stabilize ongoing execution operations | stale-card closure rules; promotion rules; pack rollover protocol; board update rules beyond the current scoreboard | `CP-57` preferred | less queue drift during execution |
| `CP-59` No-card canon seal | Track C | freeze queued breadth and reserved surfaces out of runtime work | no-card canon ledger; packet guardrail refresh; queued/reference suppression notes | current atlas | fewer false execution tasks |
| `CP-60` Control-plane link and alias hygiene | Track C | remove duplicate paths and vocabulary drift | canonical-path audit; alias cleanup; duplicate suppression; packet/index normalization | `CP-59` preferred | less authority drift |
| `CP-61` Ownership boundary seal | Track C | reinforce suite/workbench/OS ownership rules | ownership note pack for suite homes, workbench-only surfaces, and OS-owned features | `CP-59` preferred | fewer boundary leaks during coding |
| `CP-62` Copilot readiness seal | Cross-track | final prep review before scaling execution volume | consolidated readiness summary; next-ready pack list; open blockers list; what remains docs-only | `CP-51` through `CP-61` | confident Copilot scaling without ad hoc discovery |

## Recommended Order

### Immediate parallel Codex work

These can run now:

1. `CP-51`
2. `CP-52`
3. `CP-53`

### Second pack

Run after the first pack stabilizes:

1. `CP-56`
2. `CP-59`
3. `CP-54`

### Third pack

Run after the second pack:

1. `CP-57`
2. `CP-60`
3. `CP-61`

Status:

- completed on 2026-03-29
- outputs landed as:
  - [2026-03-29-cp-57-evidence-and-handoff-packetization.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-57-evidence-and-handoff-packetization.md)
  - [2026-03-29-cp-60-control-plane-link-alias-hygiene.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-60-control-plane-link-alias-hygiene.md)
  - [2026-03-29-cp-61-ownership-boundary-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-61-ownership-boundary-seal.md)

### Final pack

1. `CP-58`
2. `CP-55`
3. `CP-62`

Status:

- completed on 2026-03-29
- outputs landed as:
  - [2026-03-29-cp-58-execution-rhythm-board.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-58-execution-rhythm-board.md)
  - [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md)
  - [2026-03-29-cp-62-copilot-readiness-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-62-copilot-readiness-seal.md)

## Stop Rules

1. Do not let a Codex phase spill into runtime files.
2. Do not promote a hold card until it has an exact file list and a collision entry.
3. Do not open execution work for `NO-CARD` surfaces.
4. If two Codex phases change the same control-plane artifact, merge them under one parent phase rather than racing them in parallel.
