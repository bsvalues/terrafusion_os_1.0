# WO-BRAIN-007 - Agent Role And Stop-Gate Matrix

**Program:** Brain Operator System

**Goal:** `GOAL-BRAIN-OPERATOR-001`

**Loop:** `LOOP-BRAIN-OPERATOR-001`

**Base:** `158f00642cc6fb2e70468757b683387433cd492a`

## Verdict

DEFINED BUT DISTRIBUTED. TerraFusion has enforceable role and stop-gate doctrine across root
`AGENTS.md`, domain packs, worktree policy, stop-wall registers, and Codex operator documents. Roles
are capabilities under the one-Brain operator; they are not independent queue owners and do not
self-authorize work.

## Role Matrix

| Role capability | May do | Must not do | Mandatory stop |
|-----------------|--------|-------------|----------------|
| Portfolio selector | Rank dependency-cleared registered lanes using live evidence | Invent WOs or enter a protected lane to stay busy | Empty/blocked backlog, strategic tie, or canon unable to select |
| Discovery / Architect | Read, classify ownership, risk, dependencies, and canon | Build, mutate, or resolve canon conflicts | Write required, protected data, or conflicting authority |
| Graph / Drift analyst | Measure blast radius, drift, and coverage | Fix findings or change ownership | Repair or policy decision required |
| Implementation / Builder | Make the smallest explicitly authorized patch | Re-architect, cross lanes, or add unrelated fixes | Scope, risk, package, runtime, or authority expansion |
| Scope / Evidence reviewer | Verify diff, proof, non-changes, and completion | Expand scope or manufacture evidence | Evidence contradiction or out-of-scope remediation |
| QA / Validation | Run authorized gates and classify results | Propose features or hide failures | Out-of-scope failed gate or protected environment dependency |
| Docs / Governance | Update evidence, ADRs, registers, and runbooks in scope | Grant new authority or silently change canon | Constitutional, ownership, or policy decision |
| PR / Review / CI operator | Push, open PR, monitor, update, and remediate in scope | Bypass branch protection or repair unrelated failures | Branch strategy conflict, missing merge authority, or scope expansion |
| Stop-gate classifier | Classify routine recovery versus SW-01..SW-10 | Cross or downgrade a wall | Any true wall requiring owner authority |

## Self-Initiation Rule

Only the active Codex/portfolio operator may select and start the next registered, dependency-cleared,
same-or-lower-risk WO under an active goal and loop. Functional roles may execute assigned portions
of that WO, but they do not own a separate queue, create a new goal, or infer authority from memory.

## Authority Precedence

1. Constitution and root `AGENTS.md` human approval triggers.
2. Brain/Cortex goal, loop, WO, risk, and proof contract.
3. Domain-pack allowed and forbidden writes.
4. Nearest directory-local `AGENTS.md`.
5. Explicit WO and owner-granted authority, including bounded merge modes.
6. Operator role procedure.

An operator packet can carry explicit authority already granted by the owner. It cannot override a
higher source, expand its file surface, or convert silence into permission.

## Stop-Gate Matrix

| Trigger | Class | Operator action |
|---------|-------|-----------------|
| Constitutional/canon change or unresolved conflict | Root approval / SW-05 | Stop with both sources and exact decision needed |
| Destructive cleanup, branch deletion, reset, or force action | Root approval / destructive action | Stop unless exact action and target are authorized |
| Product or runtime behavior change | Root approval / SW-09 | Stop before implementation unless WO explicitly grants it |
| Branch or merge strategy ambiguity | Root approval / SW-07 | Stop; do not infer rebase, force-push, or merge method |
| Production, county, PACS, SQL, secrets, or go-live | SW-01..SW-04 / SW-10 | Stop and preserve values/data from output |
| New external integration | SW-08 | Stop and name the proposed system |
| Failed gate outside WO scope | SW-06 | Stop; do not repair unrelated code |
| In-scope formatting, review, branch-behind, or pending checks | Routine recovery | Fix, update, wait, and continue |
| Merge under an explicit bounded merge mode | Granted authority | Merge only after scope/check/review conditions pass |

## Gaps

- Role names differ between the legacy six-role memory roster and newer operator doctrine.
- Stop types, root approval triggers, and SW-01..SW-10 are spread across multiple documents.
- Some older operator files say every merge needs a fresh owner decision while active bounded merge
  modes prove that authority can be granted for a program or PR in advance.
- Risk-class vocabularies remain inconsistent and are assigned to BRAIN-008 reconciliation.

## Non-Claims

This matrix does not create agents, grant merge/deploy/runtime authority, change branch protection,
or permit suites to own queues. It consolidates current doctrine only.

## Next Work Order

`WO-BRAIN-008 - Autonomous Continuation Rulebook Reconciliation` is dependency-cleared.

STOP_TYPE: `BRAIN_AGENT_ROLE_STOP_GATE_MATRIX_DEFINED`
