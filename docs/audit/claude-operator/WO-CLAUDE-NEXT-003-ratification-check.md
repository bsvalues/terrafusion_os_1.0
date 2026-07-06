# WO-CLAUDE-NEXT-003 — Ratification Check

**Goal:** GOAL-TF-CLAUDE-NEXT-LANE-RATIFICATION-001
**WO:** WO-CLAUDE-NEXT-003 — Ratification Check
**Category:** Documentation (authority check)
**Depends on:** WO-CLAUDE-NEXT-002

> **Claude Code may not self-ratify.** The Brain/Cortex is the sequencer (`AGENTS.md`, `brain/packs/README.md`).

---

## 1. What counts as "ratified" for a Claude Code lane

A lane is executable by Claude now only if **all** hold:
1. it is at (or authorized off) the **Brain's head** — `brain next` would recommend it (or the operator explicitly
   authorized jumping to it);
2. it is **within Claude's allowed scope** (frontend tests / docs; no backend/registry/route/API/runtime/PACS);
3. it is **non-overlapping** with Codex Backend OE;
4. it does not require owner-only authority (branch/deploy/security/config/hook-bypass).

## 2. Applying the test

| Candidate | Brain head? | Claude scope? | Non-overlap? | Owner-only? | **Ratified for Claude now?** |
|-----------|:-----------:|:-------------:|:-----------:|:-----------:|:----------------------------:|
| [0] ServiceRegistry activation verification | ✅ (head) | ❌ backend | ◑ Codex-adjacent | — | **NO** (not Claude's scope) |
| [1] live-DB Dais migration | ❌ | ❌ DB | — | ✅ DB apply | **NO** |
| [2] dock/top-bar frontend vitest sweep | ❌ ("why not yet") | ✅ | ✅ | ❌ | **NO** — not the Brain head; promoting it = queue override |
| [3] LocalOps WO-000 | ❌ | ❌ backend/AI | — | ✅ architect sign-off | **NO** |
| [4] worktree-isolation hardening | ❌ | ◑ | ✅ | ✅ tooling | **NO** |
| WO-0001 Dais stub-test honesty | ❌ (active, not head) | ✅ | ✅ | ❌ | **NO** — not confirmed at head |

## 3. Result

**No candidate is ratified for Claude Code to execute now.**

- The Brain's **head recommendation** (queue[0], ServiceRegistry) is a **backend** product-gate — outside Claude's
  frontend/docs scope and adjacent to the **active** Codex Backend OE lane (#1233).
- The Claude-appropriate frontend lanes ([2] dock/top-bar vitest sweep; WO-0001 Dais stub-test honesty) are **not** at the
  Brain head ("why not yet"). Executing them now would **override Brain sequencing** — the exact overreach the
  governance correction (GOAL-TF-CLAUDE-OPERATOR-QUEUE-001, codex P1) forbade.

## 4. Consequence

`RATIFICATION_STATUS = NO safe new Claude implementation lane is currently ratified.` → proceed to the **park packet**
(WO-CLAUDE-NEXT-004) and **park** (WO-CLAUDE-NEXT-005). To put Claude to work, the operator must either run `pnpm brain
next` to dispatch the actual next WO, or **explicitly ratify** one of the Claude-appropriate non-head lanes.

**Docs-only. No self-ratification. No stop wall (this is the designed outcome).**
