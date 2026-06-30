# TerraFusion Goal/Loop Program Playbook

**Version:** 1.0  
**Date:** 2026-06-30  
**Authority:** TerraFusion Brain / WO-WOE-010  
**Classification:** Operator Doctrine — command-layer binding

---

## Purpose

This playbook binds the Work Order Program Playbook Register to explicit `/goal` and `/loop`
operating commands. It is the command-level layer on top of WO-WOE-009.

**Before this playbook:** The operator nominates one WO at a time from the register.  
**After this playbook:** The operator states a program intent (`/goal`) and the execution mode
(`/loop`), and the Brain selects the next unblocked WO from the correct program file.

---

## The Four Primitives

| Primitive | Owns | Does not own |
|-----------|------|--------------|
| `/goal` | Program intent, desired outcome, success condition | File mutation, merge authority |
| `/loop` | Repeated execution inside an approved risk boundary | Scope expansion, authority walls |
| `WO` | The governed execution packet: allowed systems, blocked systems, steps, evidence | Competing queue, autonomous self-continuation |
| `evidence` | Proof that completion criteria were met | Future authorization by implication |

---

## Command Model

```text
/goal <program>
  ↓
selects program from PROGRAM_PLAYBOOK_REGISTER
  ↓
/loop <mode>
  ↓
executes next unblocked WO node from that program
  ↓
WO packet (sovereignty boundary, allowed/blocked, steps, evidence)
  ↓
validation + evidence
  ↓
PR / merge / stop gate
  ↓
loop continues only if same-risk and no authority wall
```

---

## Output Format

Every `/goal` + `/loop` cycle ends with a structured result block:

```
RESULT:        [COMPLETED | BLOCKED | STOP_GATE | EVIDENCE_ONLY]
GOAL:          <declared program intent>
LOOP_MODE:     <once | program | evidence | merge-watch | discovery | recovery>
ACTIVE_PROGRAM: <program name>
ACTIVE_WO:     <WO ID being executed>
NEXT_WO:       <next unblocked WO in program, or NONE>
BLOCKERS:      <list of blocking dependencies or NONE>
EVIDENCE:      <PR URL, doc path, or validation output>
STOP_TYPE:     [NONE | AUTHORITY_WALL | FAILED_GATE | CANONICAL_CONFLICT | BLOCKER]
```

---

## File Map

| File | Purpose |
|------|---------|
| `GOAL_LOOP_PLAYBOOK.md` (this file) | Top-level doctrine and command model |
| `goal-loop/GOAL_COMMANDS.md` | `/goal` command definitions and program mappings |
| `goal-loop/LOOP_MODES.md` | `/loop` mode definitions, continuation rules, stop triggers |
| `goal-loop/STOP_WALLS.md` | Exhaustive list of authority walls and their scope |
| `goal-loop/COMMAND_TO_PROGRAM_MAP.md` | Current-state map: command → program → next WO → blockers |
| `goal-loop/README.md` | WO-WOE-006 doctrine foundation (do not modify) |

---

## Current State (2026-06-30)

| PR | WO | Status |
|----|----|--------|
| #1112 | WO-CONFIG-BENTON-001 | auto-merge queued — blocks WO-DEPLOY-BENTON-003B |
| #1114 | WO-WOE-009 | auto-merge queued — this playbook builds on it |
| #1115 | WO-DATA-BENTON-DUPE-001 | auto-merge queued — investigation closed |

**After #1112 merges:**  
`/goal benton-demo` + `/loop program` → next legal WO = WO-DEPLOY-BENTON-003B (preflight only, no deploy auth).

**WO-DATA-BENTON-DUPE-001B** (DELETE 30 rows) requires explicit operator data-mutation authorization before execution. It is a stop wall.

---

## Non-Goals

This playbook does not:

- implement a CLI or runner
- execute any WO autonomously without operator acknowledgement of stop walls
- grant merge, deployment, or data-mutation authority
- modify runtime code, appsettings, or Azure settings
- connect to PACS or county production systems
