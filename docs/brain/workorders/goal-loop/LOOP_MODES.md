# /loop Mode Definitions


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
**Authority:** WO-WOE-010  
**Classification:** Operator Doctrine

---

## What /loop Does

`/loop` owns repeated execution inside an approved authority boundary. It selects the next unblocked
WO from the active program and runs it. It continues only if the next WO's risk, systems, files, and
actions are already authorized and no unresolved authority wall is crossed.

`/loop` never expands scope beyond the active WO. It stops and reports when a wall is reached.

---

## Command Grammar

```
/loop once
/loop program
/loop evidence
/loop merge-watch
/loop discovery
/loop recovery
/loop stop
```

---

## Mode Definitions

### /loop once

Run the next unblocked WO in the active program. Stop after that WO completes (or blocks) and emit
a full result block.

**Use when:** you want one governed step with full visibility before deciding to continue.  
**Stops after:** first WO completes, blocks, or hits a wall.  
**Output:** result block with next WO named but not executed.

---

### /loop program

Continue through authorized WOs in the active program until a terminal condition is reached.

**Continues while:**
- next WO is in the same program
- next WO remains within the risk ceiling and systems recorded by the active Goal, Loop, and WO chain
- no authority wall is in the next WO's sovereignty boundary
- all dependencies of the next WO are satisfied (merged PRs, completed WOs)
- no failed validation gate in the active chain

**Stops at:**
- authority wall (deployment, data mutation, secrets, new external service)
- failed validation gate
- merge wall without an applicable preauthorized merge mode
- PR requiring a human merge decision when merge authority is not already granted
- dependency not yet satisfied (e.g., PR not merged)
- conflicting canon between programs
- scope expansion outside program boundary

**Use when:** the operator wants autonomous progress through a defined program slice without stopping
at every step.

> **Scope (WO-BRAIN-008):** `/loop program` on a **regular** program is **within-program** — it stops at
> that program's wall as listed above and does **not** silently jump to another program. Cross-program
> **park-and-advance** happens **only** when the active program is the **portfolio-operator** program.
> See [CONTINUATION_RULEBOOK.md](../CONTINUATION_RULEBOOK.md) §2.

---

### /loop evidence

Do not start new implementation. Only collect missing evidence for current completed or open WOs.

**Does:**
- reads existing docs, PRs, branch state
- writes evidence docs
- verifies completion criteria for open WOs
- surfaces which WOs are missing evidence

**Does not:**
- start new implementation
- modify runtime code
- open new PRs (except evidence-only docs PRs)
- execute WOs that are QUEUED but not started

**Use when:** you want to audit the current evidence state across a program without advancing implementation.

---

### /loop merge-watch

Monitor queued PRs in the active program. Resolve in-scope review threads and check failures that
are within the current WO's sovereignty. Stop at any human authority wall.

**Does:**
- checks CI status on open PRs
- resolves lint/format/doc failures that are in-scope
- surfaces blocking review threads for human resolution
- re-pushes if a non-authority fix was applied

**Does not:**
- resolve review comments that require architectural decisions
- merge PRs without auto-merge already enabled
- bypass branch protection
- change CI pipeline configuration

**Use when:** PRs are queued with auto-merge but CI needs minor repairs.  
**Typical usage:** `after PR push → /loop merge-watch → merge under applicable authority → continue`

---

### /loop discovery

Read-only inventory and classification only. No writes. No implementation.

**Does:**
- reads files, branches, PRs, registry state
- classifies gaps, blockers, missing evidence
- maps dependency chains
- surfaces next recommended WOs with rationale

**Does not:**
- write files (except optional discovery output doc if operator requests it)
- open PRs
- execute WOs
- modify any state

**Use when:** starting a new context window and need to orient; or auditing a program before committing
to a loop mode.

---

### /loop recovery

Only repair validation or merge issues for the active WO. No scope expansion.

**Does:**
- re-runs failing validation within current WO scope
- fixes merge conflicts caused by unrelated upstream changes
- re-stages and re-commits a failed pre-commit hook fix
- re-pushes after a force-push-safe rebase

**Does not:**
- expand the WO scope
- take on a new WO
- modify files outside the current WO's allowed systems

**Use when:** the active WO is blocked by a mechanical merge or validation issue that is clearly
within scope.

---

### /loop stop

Halt the current loop and emit a full result block with the stop reason.

**Always valid.** The operator can issue `/loop stop` at any time.

---

## Continuation Rules

A loop may continue to the next WO only when ALL of the following are true:

1. The current WO has a COMPLETED result with evidence
2. The next WO is in the same active program; cross-program advancement is selected only while the
   active loop is the portfolio-operator program
3. The next WO's risk class, systems, files, and actions are already authorized
4. The next WO has no unresolved dependencies (no pending-merge PRs that the next WO requires)
5. The next WO does not cross an authority wall
6. No conflicting canon between the current and next WO's sovereignty boundaries

If an item is unknown, perform bounded read-only source and live-state discovery first. Downgrade to
`/loop once` or `/loop stop` only if a material authority uncertainty remains.

---

## Risk Class Reference

| Class | Examples |
|-------|---------|
| R0 — Read-only | Discovery and evidence collection from non-protected local sources; never PACS, county SQL, or protected county data |
| R1 — Docs/registry | Markdown, evidence docs, WO register updates |
| R2 — Local developer tooling | Read-only scripts, local bootstrap, dev-only examples |
| R3 — CI/governance/tooling | Pipeline gates, hooks, policy config, branch hygiene |
| R4 — Runtime/application behavior | Backend, frontend, and OS-platform behavior changes |
| R5 — Production/security/protected data | Release, deployment, secrets, PACS, county SQL, county data |

`/loop program` may continue through any class explicitly granted by the active authority record. It
must stop before an ungranted risk, system, file, or action boundary. PACS, county SQL, protected
county data, R4, and R5 are never inferred, including for read-only work.
