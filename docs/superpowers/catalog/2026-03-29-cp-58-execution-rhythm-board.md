# CP-58 — Execution Rhythm Board

**Date**: 2026-03-29  
**Phase**: CP-58 — Execution rhythm board  
**Track**: B (Execution Operations)  
**Status**: `COMPLETED`  
**Inherits**: CP-57 evidence and handoff packetization  
**Authored by**: Codex

---

## Purpose

Define the standing operational rules that keep the Copilot execution queue healthy
across multiple sessions, waves, and agents. This board does NOT replace the
[execution scoreboard](2026-03-28-execution-scoreboard.md) — it defines the rhythm that
governs when and how the scoreboard and packet chain are updated.

Without a rhythm board, each session restarts with ad hoc discovery and reopens closed
decisions. With it, any agent picking up the queue can read one document and know exactly
what to issue, what to defer, and what to update.

---

## Authority Chain (read-only inputs to this board)

1. [2026-03-28-execution-scoreboard.md](2026-03-28-execution-scoreboard.md) — live card states
2. [2026-03-29-cp-57-evidence-and-handoff-packetization.md](2026-03-29-cp-57-evidence-and-handoff-packetization.md) — evidence requirements
3. [2026-03-28-hot-file-collision-matrix.md](2026-03-28-hot-file-collision-matrix.md) — file collision rules
4. [2026-03-28-hold-card-unlock-ledger.md](2026-03-28-hold-card-unlock-ledger.md) — hold conditions
5. [2026-03-29-cp-55-shell-hot-surface-seal.md](2026-03-29-cp-55-shell-hot-surface-seal.md) — shell hold posture
6. [2026-03-29-cp-62-copilot-readiness-seal.md](2026-03-29-cp-62-copilot-readiness-seal.md) — final readiness word

---

## Part 1 — Wave Rollover Protocol

A wave rolls over when all cards in that wave have satisfied their stop condition and
their closeout template is linked into the control plane.

### Rollover Checklist

```
Wave N → Wave N+1 rollover gate:
  □ Every Wave N card has: commit SHA, origin SHA, screenshot set, scoreboard update
  □ No Wave N card shows an unresolved spill report
  □ Collision matrix entries for Wave N cards are marked CLOSED or NO-SPILL
  □ Hold-board rows for any promoted hold cards are updated
  □ Only then: Wave N+1 cards transition from BLOCKED-BY-WAVE → READY-NOW
```

**Partial wave completion is NOT a rollover.** If one card in Wave 2 is still open,
Wave 3 cards that depend on that file remain `BLOCKED-BY-WAVE`, even if every other
Wave 2 card is done.

### Current Wave State (2026-03-29)

| Wave | Cards | Status |
|------|-------|--------|
| Wave 0 | `44A`, `44B` | ✅ COMPLETE |
| Wave 1 | `45A` | ✅ COMPLETE |
| Wave 2 Pool A | `45B`, `45C`, `46A`, `47A`, `48A`, `49A` | ✅ COMPLETE |
| Wave 3 Pool B | `46B1`, `46B2`, `46B3`, `46C`, `47B`, `49B`, `50A`, `50C` + `50E` posture | ✅ COMPLETE |
| Hold released | `50E` | ✅ Ready (proof-only card; implementation done at `51c59c0c0`) |
| Architectural hold | `45D` | 🔒 ARCH-RISK-HOLD — separate governance ruling required |

All waves through Wave 3 are closed. No blocked-by-wave cards remain.

---

## Part 2 — Card Promotion Rules

### From `BLOCKED-BY-WAVE` to `READY-NOW`

A card may be promoted to `READY-NOW` when:

1. All cards in its blocking wave are closed with evidence
2. Its hot-file collision window is clean (no other active card in its files)
3. Its allowed file list is exact (not TBD)
4. It does not require a Codex proof-seal document that is not yet written

### From `ON-HOLD` to `READY-NOW`

A hold card may be promoted only when ALL of the following are satisfied:

1. The Codex unlock document for that card exists and names exact allowed files
2. The collision matrix entry for those files is updated
3. No other active card is simultaneously writing those files
4. For `ARCHITECTURAL-RISK-HOLD` cards: an explicit co-founder governance ruling
   in a dated control-plane document — not just a file-list seal

Hold card promotion by file-list alone is **not sufficient** for ARCH-RISK-HOLD cards.

### Promotion Is Reversible

If a promoted card hits a file-spill or collision during execution, it may be
demoted back to `ON-HOLD` without requiring a full governance ruling. The agent
must stop, report the spill, and update the scoreboard to `ON-HOLD (SPILL)`.

---

## Part 3 — Stale Card Closure Rules

A card is stale when its defect no longer exists in the current codebase, not because
it was executed, but because another card fixed it as a side effect. Stale cards must
be closed, not silently dropped.

### Staleness Criteria

A card is stale if ANY of the following is true:

1. Another card's commit introduced the exact change the card required
2. A refactor removed the file in the card's allowed list entirely
3. The readiness ledger row the card was targeting no longer exists or is now accurate
4. A co-founder ruling explicitly retired the card (`NO-OP` or `ALREADY-SATISFIED`)

### Stale Closure Procedure

```
1. Confirm staleness with grep or read_file — do NOT close from memory
2. Update the scoreboard: status → STALE-CLOSED
3. Add a dated entry to the hold ledger or scoreboard notes field:
   "Stale-closed YYYY-MM-DD: [reason]. Evidence: [file + line or commit SHA]."
4. Do NOT issue a runtime card for a stale target
5. Do NOT reopen a stale card from a new Codex session unless a new defect is
   found by fresh file inspection
```

### Known Stale Entries (as of 2026-03-29)

| Card | Status | Stale Reason |
|------|--------|--------------|
| `50B` Monitoring | `NO-OP` | page-level simulation framing already present |
| `50D` User Admin | `ALREADY-SATISFIED` | unconditional `DemoDataBanner` already covers it |
| `50E` Desktop Shell | `READY` (not stale) | implementation done at `51c59c0c0`; needs only proof-verify pass |

---

## Part 4 — Session Start Protocol

At the start of any Copilot execution session, the agent must run this checklist before
issuing any card:

```
□ Read the scoreboard — which cards are READY-NOW?
□ Read the collision matrix — is the target file set clean?
□ Confirm the previous session's wave status — is the rollover gate met?
□ Confirm no in-progress card from a prior session is unfinished (look for
  open branches or unmerged commits earlier than HEAD of feat/r0-surface-honesty)
□ Read the card's allowed file list — is it exact or TBD?
□ Read the card's stop condition — do you know exactly when to stop?
□ Read the evidence requirements from CP-57 — do you know the screenshot target?
□ Only then: issue the card
```

Skipping any checkbox is a queue-drift risk. The most common failure mode is issuing
a card without confirming the previous session's wave is fully closed.

---

## Part 5 — Queue Drift Prevention Rules

Queue drift occurs when execution sessions accumulate unresolved side effects, reopened
stale decisions, or widened scope. These rules prevent it.

### Rule 1 — No card is open in two sessions simultaneously

If a card's branch has uncommitted changes from a prior session, that work must be
committed or discarded before a new session opens the same card again.

### Rule 2 — One parent per card; one card per runtime session

A runtime Copilot session issues exactly one parent card. Sub-agents may split that
card's work by file, but the parent session must close and produce the closeout template
before any new parent card is issued.

### Rule 3 — The closeout template is the receipt

No card transitions to `COMPLETED` without a closeout template (per CP-57) that includes
commit SHA, origin SHA, screenshot reference, and type-check gate result. "I believe it
is done" is not a receipt.

### Rule 4 — Codex docs are write-once per session during execution

When a Copilot execution session is running, the Codex docs lane is frozen. Do not
update the scoreboard, card packet, or phase board mid-execution. Update them only in
the closeout step, after the card's type-check gate passes.

### Rule 5 — Discovery findings expire

If a Copilot session runs a file discovery pass (reads files, explores surfaces) but
does not commit a card as a result, that discovery expires at the end of the session.
Do not carry forward discovery output as "known truth" without re-verifying in the next
session.

### Rule 6 — Hold cards are not queue pressure

The presence of `45D` on the hold board has no bearing on the pace of execution for
clear cards. Do not slow clear-card work to "wait for `45D`." Do not mention `45D`
as a blocker for any card whose allowed files do not overlap `suiteRegistry.ts`.

---

## Part 6 — Board Update Sequence

When a card completes, update in this order:

```
1. execution-scoreboard.md  → status: READY-NOW → COMPLETED-IN-BRANCH
2. hot-file-collision-matrix.md → mark the card's files as CLOSED
3. cp-57-evidence-and-handoff-packetization.md → no update needed (template only)
4. hold-card-unlock-ledger.md → update only if a hold card was promoted
5. copilot-execution-card-packet.md → add new prep artifact link if a new Codex doc landed
```

Do NOT update the phase board or card plan docs for routine card completions. Those
are policy documents. Only update them when a structural ruling changes.

---

## Part 7 — Pack Rollover Protocol

When all cards in a named pack (Wave 2 Pool A, Wave 3 Pool B, etc.) are complete:

1. Declare the pack closed in the scoreboard notes field
2. Identify which cards are now unblocked in the next wave
3. Update those cards' status to `READY-NOW` in the scoreboard
4. Announce the rollover in the next session's opening status summary

A pack is declared closed only when all cards in the pack have:
- `COMPLETED-IN-BRANCH` status in the scoreboard
- a linked commit SHA
- a linked origin SHA
- a linked screenshot reference

"We ran out of cards to issue" is not a pack close. The pack closes when all evidence
is in the control plane.

---

## Part 8 — Current Queue Truth (2026-03-29 snapshot)

### Active / Issuable Now

| Card | Status | Notes |
|------|--------|-------|
| `50E` | `READY` | proof-verify pass only; `StageZeroState.tsx` sole file; SERIAL-CLEAR |

### Readiness Freeze

| Phase | Status | Blocks |
|-------|--------|--------|
| `CP-62` | `COMPLETED` | readiness seal landed; use it as the concise next-ready summary |

### Holds — do not issue

| Card | Hold Type | Required To Open |
|------|-----------|-----------------|
| `45D` | `ARCHITECTURAL-RISK-HOLD` | Explicit co-founder governance ruling authorizing `suiteRegistry.ts` write window |

### No further work needed

All Wave 0–3 execution cards are closed. The execution queue is empty except `50E`.

---

## Part 9 — Handoff Rules For The Readiness Seal

[2026-03-29-cp-62-copilot-readiness-seal.md](2026-03-29-cp-62-copilot-readiness-seal.md) is the final Codex deliverable for the current queue. It:

1. Confirm the full card queue state against all decisions in CP-51 through CP-61
2. Produce a consolidated "next-ready pack list" — which cards may be issued and in
   what order with what parallel classes
3. Name any remaining open blockers explicitly
4. Separate what is docs-only (no Codex action needed) from what needs execution

No additional co-founder authorization was required because the seal is read-only summary work.

---

## Closing Rule

The rhythm board is an operations document, not a governance policy. It does not
override the phase board, the card packets, or co-founder rulings. When this board
conflicts with a co-founder ruling, the co-founder ruling wins.

Update this document only when a structural rule changes — not when a card completes.
A card completing is scoreboard news, not rhythm-board news.
