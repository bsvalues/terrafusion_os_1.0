# WO-CLAUDE-GOV-002 — Cross-Program Governance-Drift Verification

**Goal:** GOAL-TF-CLAUDE-GOVREVIEW-001 — Governance & Review Operator
**WO:** WO-CLAUDE-GOV-002 — Governance-drift verification + sync recommendation
**Category:** Governance (read-only verification; sync deferred to avoid Codex collision)
**Operator:** Claude Code

**Authorization:** Read-only verification of governance surfaces. No edit while the Codex closeout (#1239) is open.
Observed 2026-07-07 against `origin/main`.

---

## 1. Verified drift (first-hand, exact evidence)

| Surface | Current (origin/main) | Correct after OE closeout | Verdict |
|---------|-----------------------|---------------------------|:-------:|
| `programs/ACTIVE_PROGRAM_PLAYBOOK.md` (~L146-148) | Backend OE `Status: ACTIVE`, `Next executable WO: WO-BACKEND-OE-003` | `CLOSED` (program complete through OE-013) | ❌ stale |
| `goal-loop/COMMAND_TO_PROGRAM_MAP.md` (~L113-123) | `OE-003 = NEXT`; `OE-012 = QUEUED`; `OE-013 = QUEUED` (OE-001-S COMPLETE, OE-002/PLAYBOOK-REFRESH CLOSED) | OE-003…013 all COMPLETE/CLOSED; no `NEXT` in a closed program | ❌ stale |
| `evidence/WO-WORKBENCH-011-EVIDENCE-ROLLUP.md` (~L99-104) | `NEXT_RECOMMENDED_PROGRAM: P5 - TerraPilot Tool Maturity`, `WO-TERRAPILOT-P2` | (reference — this is the correct registered next lane) | ✅ authoritative |

**Consequence of the drift:** `/goal backend-excellence` and `/program-next` route operators to `WO-BACKEND-OE-003`, work
already merged (OE-012 merged `7ed226bc`; OE-013 closing in #1239). This is a **live restart hazard**, not a cosmetic nit —
which is why codex raised it P2 on #1239.

## 2. Independent confirmation of both #1239 codex P2 threads

Both codex threads on #1239 are **correct**. Claude read the exact lines cited and reproduces the finding above. Claude
adds one cross-check codex did not: the Workbench next lane is authoritatively `P5 TerraPilot / WO-TERRAPILOT-P2`
(WORKBENCH-011), so #1239's "route back to Property Workbench" rec is not just a restart risk but contradicts the
already-recorded next lane.

## 3. Ownership + collision rule

- **Codex owns the fix now.** codex's own thread says to sync the command surfaces "in the same closeout" (#1239). So the
  playbook + command-map edits belong to #1239. Claude does **not** edit them in parallel — that would collide with the
  Codex PR.
- **Deferred Claude sync (if needed).** After #1239 merges, Claude re-verifies the three surfaces. If the closeout synced
  them: this WO closes as "verified fixed by #1239." If they are still stale: Claude opens a docs-only governance-sync PR
  (`GOAL-TF-CLAUDE-GOVREVIEW-001`, allowed surface) to set Backend OE → CLOSED and update the command map — the standing
  Governance & Playbook Maintenance duty.
- **Next-lane selection stays with the Brain.** Claude records the registered next lane (P5 TerraPilot) as evidence but
  does not self-route or self-start it.

## 4. Return

RESULT: COMPLETE (verification) · DRIFT_CONFIRMED: yes (2 stale command surfaces) · CODEX_THREADS_1239: both confirmed
correct · CLAUDE_EDIT_NOW: none (collision-avoidance) · DEFERRED_ACTION: post-#1239 re-verify → govsync PR only if still
stale · STOP_TYPE: none.
