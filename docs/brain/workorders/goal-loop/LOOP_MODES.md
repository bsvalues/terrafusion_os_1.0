# /loop Mode Definitions

**Authority:** WO-WOE-010  
**Classification:** Operator Doctrine

---

## What /loop Does

`/loop` owns repeated execution inside an approved risk boundary. It selects the next unblocked WO
from the active program and runs it. It continues only if the next WO is same-risk and no authority
wall is crossed.

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

Continue through same-risk WOs in the active program until a terminal condition is reached.

**Continues while:**
- next WO is in the same program
- next WO risk class is equal to or lower than the current WO, or the active goal/loop packet
  explicitly authorizes the higher risk
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
2. The next WO is in the same active program (or explicitly cross-program and approved)
3. The next WO's risk class is not higher than the current WO, or the active goal/loop packet
   explicitly authorizes the higher risk
4. The next WO has no unresolved dependencies (no pending-merge PRs that the next WO requires)
5. The next WO does not cross an authority wall
6. No conflicting canon between the current and next WO's sovereignty boundaries

If any item is uncertain, downgrade to `/loop once` or `/loop stop`.

---

## Risk Class Reference

| Class | Examples |
|-------|---------|
| R0 — Read-only | Discovery and evidence collection with no repository writes |
| R1 — Docs/operator truth | Markdown, evidence, schemas, registers, playbooks |
| R2 — Local developer tooling | Local bootstrap and dev-only tooling without product behavior |
| R3 — CI/governance/tooling | Hooks, pipeline gates, policy configuration, branch hygiene |
| R4 — Runtime/application | Backend, frontend, or OS-platform observable behavior |
| R5 — Production/protected authority | Deploy, release, secrets, PACS, county SQL/data, security |

`/loop program` may continue through same or lower risk. A higher-risk node continues only when the
active goal/loop packet explicitly grants that risk and no ungranted wall remains. These are WOE
execution classes; `brain/router/path-router.yaml` uses a separate legacy R0-R3 path-floor profile.
