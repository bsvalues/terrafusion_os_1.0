# WO-MAO-000 Doctrine Conflict Audit Proof

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Work Order:** `WO-MAO-000 - Doctrine Conflict Audit`
**Base SHA:** `63f959e07240e0159ce101cd4d76e814788aac44`
**Mode:** Read-only source and history audit; no repository mutation was authorized or performed by
WO-MAO-000.
**Completion:** `PASS`
**FILE_LINE_CITATIONS_COMPLETE:** `YES`
**TRUE_AUTHORITY_WALL:** `NONE`

## Sources Reviewed

The line references in this proof are immutable references to the base SHA above.

- `AGENTS.md`
- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`
- `docs/branching/BRANCH_AND_WORKTREE_POLICY.md`
- `docs/agents/AGENT_WORKTREE_ISOLATION.md`
- `docs/brain/workorders/GOAL_LOOP_AUTONOMY_RULES.md`
- `docs/brain/workorders/NEXT_ACTION_MATRIX.md`
- `docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md`
- `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md`
- `docs/brain/workorders/playbooks/MERGE_AUTHORITY_MODEL.md`
- `docs/brain/workorders/goal-loop/GOAL_CONTRACT.md`
- `docs/brain/workorders/goal-loop/README.md`
- `docs/brain/workorders/STOP_WALL_REGISTER.md`
- `docs/brain/workorders/programs/work-order-engine.md`
- `docs/brain/workorders/goal-loop/NEXT_WO_SELECTION_RULE.md`
- `brain/packs/README.md`
- merged pull-request metadata for PRs `#1256` through `#1272` where listed below

## Full Contradiction Matrix

| ID | File:line | Exact controlling text | Authority level at audit | Current mechanical effect | Intended operating model | Conflict classification | Proposed disposition |
|----|-----------|------------------------|--------------------------|---------------------------|--------------------------|-------------------------|----------------------|
| F01 | `AGENTS.md:17-24` | `### Authority hierarchy (higher wins on conflict)`<br>`1. **TerraFusion Constitution** — docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md (TF-052)`<br>`2. **Brain / Cortex** — OS-level queue, sequencing, work orders, risk, proof, review-diff, commit-plan`<br>`3. **Domain knowledge packs** — brain/packs/**`<br>`4. **Directory-local AGENTS.md files** — nearest-scope overrides`<br>`5. **Existing implementation patterns**`<br>`6. **Agent judgment**` | Root agent governance | Omits ratified owner decisions, active program/WO authority, playbooks, and enforcement drift; also lets local files appear to override without a no-broadening rule. | One explicit hierarchy that resolves all active governance sources and constrains local rules. | Incomplete authority hierarchy | `SUPERSEDE` |
| F02 | `AGENTS.md:36-40` | `### Human approval triggers (always stop and ask)`<br>`3. Product behavior change` | Root agent governance | Every behavior change can be interpreted as a fresh founder stop even when an active WO already authorizes it. | Stop only when behavior exceeds active recorded authority. | False authority wall | `NARROW` |
| F03 | `AGENTS.md:36-41` | `### Human approval triggers (always stop and ask)`<br>`4. Branch / merge strategy` | Root agent governance | Routine branch creation, branch update, review repair, and already-authorized merge can be routed to the owner. | Routine operations execute under recorded branch/merge authority; only new strategy or missing authority stops. | False authority wall | `NARROW` |
| F04 | `AGENTS.md:50-57` | `The shared/main working tree is for human-controlled sync only.`<br>`PR is the sync boundary. Agents open draft PRs; humans merge.` | Root worktree governance | Mechanically serializes promotion and merge through the human even when later operator authority is recorded. | Preserve shared-checkout isolation while allowing bounded operator promotion/merge under explicit authority and required gates. | Direct doctrine conflict | `SUPERSEDE` |
| F05 | `docs/branching/BRANCH_AND_WORKTREE_POLICY.md:9-16,23-30` | `\| main \| Production-ready trunk \| N/A \| Human only \|`<br>`\| claude/<work-order> \| Claude Code agent work \| Agent \| Human via PR \|`<br>`\| codex/<work-order> \| Codex agent work \| Agent \| Human via PR \|`<br>`The main repo checkout is reserved for human use and human-controlled merge operations.`<br>`Agents open draft PRs. Humans promote to ready-for-review.`<br>`Agents do not merge their own PRs unless explicitly told to.` | Branch/worktree policy | Treats human merge as the only normal path and does not express persistent bounded grants. | Human merge remains default; recorded exact-scope Mode B/C grants permit operator merge without weakening PR isolation. | Direct doctrine conflict | `SUPERSEDE` |
| F06 | `docs/agents/AGENT_WORKTREE_ISOLATION.md:28-45` | `Completed worktrees are removed after merge, with human approval.`<br>`No deleting branches, tags, worktrees, or stashes without human approval.`<br>`Agents open draft PRs; humans promote to ready-for-review.`<br>`Agents do not merge their own PRs unless explicitly told to.` | Worktree isolation policy | Even an exact failed current-WO worktree with a zero-unique branch requires another founder touch. | Keep destructive operations protected while allowing an exact, recorded, zero-unique failed-worktree repair procedure. | Over-broad recovery wall | `NARROW` |
| F07 | `docs/brain/workorders/GOAL_LOOP_AUTONOMY_RULES.md:33-42` | `The operator proceeds to the next WO automatically when every condition is true:`<br>`its risk class is equal to or lower than the WO just completed`<br>`If all hold -> execute. Do not narrate a decision to the human. Do the work.` | Goal/Loop continuation doctrine | Numeric risk comparison can authorize or block continuation without checking the active grant's systems, files, and actions. | Continue only when the complete active authority tuple covers risk, systems, files, actions, dependencies, and stop walls. | Incomplete authority predicate | `SUPERSEDE` |
| F08 | `docs/brain/workorders/NEXT_ACTION_MATRIX.md:44-57`; `docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md:57-66` | Matrix: `Risk classes (low → high):`<br>`R0  read-only discovery / evidence (no writes)`<br>`R1  docs / registry / playbook authoring`<br>`R2  scoped code change with tests, no runtime/behavior expansion`<br>`R3  runtime behavior change (SW-09) — requires authorization`<br>`R4  deploy / data mutation / secrets / go-live (SW-01..SW-04, SW-10) — always a wall`<br>Data model: `R0` = `Read-only discovery`; `R1` = `Documentation or operator-truth patch`; `R2` = `Local developer tooling`; `R3` = `CI/governance/tooling`; `R4` = `Runtime/application behavior`; `R5` = `Production/security/protected-data authority`. | Competing active risk doctrine | The same WO can receive different risk and stop behavior depending on which document is read. | One canonical `R0`-`R5` model; risk is a required authority dimension, not authority by itself. | Canon vocabulary conflict | `SUPERSEDE` |
| F09 | `docs/brain/workorders/NEXT_ACTION_MATRIX.md:20-36` | `Evaluate top-to-bottom; first matching row wins.`<br>Row 1: `Active WO's next step crosses a stop wall (SW-01..SW-10)` → `STOP`.<br>Row 12: `No unblocked WO remains (or next crosses a wall) in a regular program under /loop program (within-program scope)` → `STOP`.<br>Row 13: `Active program is portfolio-operator AND its current lane walls or exhausts` → `PORTFOLIO RECONCILE`. | Ordered continuation matrix | First-match stop behavior can win before the portfolio operator reaches its reconciliation row. | Portfolio-operator reconciliation must be evaluated before generic within-program exhaustion. | Unreachable continuation path | `SUPERSEDE` |
| F10 | `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md:1-42`; `docs/brain/workorders/playbooks/MERGE_AUTHORITY_MODEL.md:1-63` | Operator model: `Codex does not merge unless explicit owner authorization exists for that PR.`<br>Playbook model: `Mode B - Pre-authorized Merge When Green` and `Mode C - Auto-Merge Armed` for docs/governance loops. | Two peer merge-policy documents | Operators can choose incompatible defaults and eligible scopes. | One canonical Mode A/B/C model; copies point to it instead of redefining it. | Duplicate controlling policy | `SUPERSEDE` |
| F11 | `docs/brain/workorders/goal-loop/GOAL_CONTRACT.md:16-31` | `Every /goal packet must define:`<br>`- goal id,`<br>`- program slug,`<br>`- mission,`<br>`- success condition,`<br>`- allowed risk classes,`<br>`- allowed systems and file surfaces,`<br>`- blocked systems and file surfaces,`<br>`- authority model,`<br>`- validation baseline,`<br>`- merge policy,`<br>`- continuation policy,`<br>`- stop conditions.` | Goal contract | Prior authority can be treated as session-local, perpetual, or applicable to an unintended PR. | Reusable authority records state effective point, terminal condition, revocation, exact PR/class, evidence, and rollback. | Incomplete persistence contract | `CLARIFY` |
| F12 | `brain/packs/README.md:17-39` | `One TerraFusion Brain.`<br>`Many suite/domain packs.`<br>`No competing brains.`<br>`No distributed queue authority.`<br>`No suite-local autonomous governance.`<br>`There is exactly one TerraFusion Brain / Cortex. It is the single OS-level authority for:`<br>`- queue`<br>`- sequencing`<br>`- work orders`<br>`- risk classification`<br>`- proof`<br>`- review-diff`<br>`- commit-plan` | Brain/domain-pack doctrine | Correctly centralizes governance but can be practiced as one worker because worker concurrency is unstated. | One governance authority may dispatch many isolated workers; workers never gain competing queue authority. | Ambiguous execution topology | `CLARIFY` |
| F13 | `brain/packs/README.md:37-50` | `Suites and domains **do not** get their own brains. They get **domain knowledge packs** (the files in this directory) that provide **local knowledge only**: what the domain owns, what it must never touch, where work routes, what proof is required, and when a human must approve.`<br>The hierarchy then lists `Domain knowledge packs — this directory (brain/packs/**)` and `Directory-local AGENTS.md files — nearest-scope overrides for a path`; no committed exact cross-repo path register is cited. | Domain routing doctrine | Repo name or suite identity can be mistaken for canonical path identity during cross-repo dispatch. | Cross-repo allocation fails closed until committed path canon exists; verified in-repo mappings remain usable. | Missing path-canon guard | `NARROW` |
| F14 | `docs/brain/workorders/goal-loop/README.md:48-58` | `A Goal + Loop may consume query output only after confirming:`<br>`- the registry source is known;`<br>`- the scoring policy source is known;`<br>`- the authority risk class is explicit;`<br>`- the recommended WO has no hard exclusions;`<br>`- dependencies are satisfied or waived in evidence;`<br>`- the recommended WO's allowed systems match the current chain;`<br>`- stop conditions are compatible with the current operator authority.`<br>`If any item is uncertain, the loop must downgrade to discovery or stop with a classified blocker.` | Goal/Loop preflight doctrine | Any unknown can trigger immediate escalation instead of bounded source lookup. | Perform canon lookup and read-only live inspection first; stop only on material residual uncertainty. | Premature stop rule | `NARROW` |
| F15 | `docs/brain/workorders/STOP_WALL_REGISTER.md:13-16,76-78` | `A **stop wall** is an authority boundary the operator (/loop) must not cross without explicit operator authorization.`<br>`Reaching a stop wall is correct behavior, not a failure — the operator surfaces the wall with evidence and waits.`<br>`SW-07 — Branch / merge strategy conflict`<br>`Blocked: force-push to a shared branch, rebase rewriting commits already in review, merge-method ambiguity, branch deletion other WOs may depend on.` | Stop-wall doctrine | Routine conflicts and approved in-scope repair can be labeled authority walls even when the method is already recorded. | A wall requires presently unresolved new authority; recoverable in-scope failures and approved repair remain operator work. | Over-broad wall interpretation | `CLARIFY` |
| F16 | `docs/brain/workorders/programs/work-order-engine.md:96-98`; `docs/brain/workorders/goal-loop/NEXT_WO_SELECTION_RULE.md:15-20` | WOE: `The WO Engine is read-only by default. It discovers, queries, scores, and reports. It does not initiate code changes, deployments, or data mutations.` The supersession note says the human decides at `walls, risk-class increases, ALL-LANES-PARKED, merge-authority gaps, or canon conflicts`.<br>Selection rule: `If the loop is complete, produce a next-lane recommendation from evidence.` and `Stop only if no approved loop remains or a stop gate appears.` | WOE and next-WO doctrine | Stale final-call/next-lane language can recreate founder routing or allow selection without complete authority. | Live queue plus recorded authority selects dependency-cleared work; cross-program selection remains portfolio-operator-only. | Stale routing semantics | `SUPERSEDE` |

**Conflict count:** 16
**Unmapped findings:** 0
**Disposition vocabulary:** `KEEP`, `CLARIFY`, `NARROW`, `SUPERSEDE`, `RETIRE`.

## Rules To Keep

- One TerraFusion Brain remains the sole queue, sequencing, Work Order, risk, proof, review-diff, and
  commit-plan authority.
- Domain packs provide knowledge and restrictions, not competing governance.
- One mutable worktree, branch, Work Order, and PR per worker lane.
- PRs, strict up-to-date checks, required status checks, administrator enforcement, conversation
  resolution, and immutable protected history remain mandatory.
- Production, credentials, secrets, PACS, county SQL, county data, protected security policy, and
  irreversible operations remain true authority walls unless an exact active owner grant applies.
- Failed gates outside the active WO remain stop conditions; gates are never weakened to preserve flow.

## Operator-Merge Analysis

### Current rules at the audited base

- Root and branch policies said humans merge.
- The operator merge model required explicit owner authorization for the PR.
- A second playbook described Mode B/C for bounded low-risk programs.
- Live branch protection required zero approving human reviews, so mechanical enforcement did not
  distinguish a human merge from an operator merge.

### Proposed enablement

Ratify a single Mode A/B/C model, but do not activate operator merge in MAO-001. The first activation
is limited to the two exact MAO-002 pilot PRs after their dispatches, scopes, reservations,
independent reviewer, final head SHAs, expiry, and machine authority record are registered.

### Automatic suspension triggers

- unauthorized scope or material scope expansion;
- reservation collision;
- required-gate bypass or misclassification;
- protected production, credential, county-data, PACS, destructive, or security boundary access;
- false evidence or rollback claims.

### Rollback and restoration

Suspend the affected grant, contain or revert through a normal protected PR, verify the resulting
`origin/main`, record incident/root-cause evidence, correct and prove the control, and restore only
through explicit owner ratification.

## Historical Baseline

This denominator uses GitHub `createdAt` as PR-open time and `mergedAt` as merge time. It does not
claim dispatch/start time. GitHub PR metadata does not contain the chat/session authority exchanges
needed to reconstruct founder touches, reasons, or true-vs-false-wall classification reliably; those
fields therefore remain `UNKNOWN` as required.

| WO / support slice | PR | PR opened (UTC) | Merged (UTC) | PR cycle | Founder touches | Touch reason | Wall classification |
|--------------------|----|-----------------|--------------|----------|-----------------|--------------|---------------------|
| `WO-BRAIN-009` | #1272 | 2026-07-12 12:29:50 | 2026-07-12 12:31:59 | 2.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-008` | #1270 | 2026-07-12 03:47:51 | 2026-07-12 03:50:12 | 2.4 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-005` post-merge remediation | #1268 | 2026-07-12 01:58:32 | 2026-07-12 02:17:34 | 19.0 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-007` | #1267 | 2026-07-12 01:30:15 | 2026-07-12 01:32:48 | 2.6 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-006` | #1266 | 2026-07-12 01:11:04 | 2026-07-12 01:13:16 | 2.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-005` | #1265 | 2026-07-12 00:39:55 | 2026-07-12 00:41:53 | 2.0 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-004` | #1264 | 2026-07-11 13:58:11 | 2026-07-11 14:00:16 | 2.1 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-003` | #1263 | 2026-07-11 13:32:46 | 2026-07-11 13:34:50 | 2.1 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-BRAIN-002` | #1262 | 2026-07-11 13:12:37 | 2026-07-11 13:14:47 | 2.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-PORTFOLIO-001` | #1261 | 2026-07-11 12:56:25 | 2026-07-11 12:58:38 | 2.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-CI-FASTGATE-003` | #1260 | 2026-07-11 08:17:36 | 2026-07-11 09:34:20 | 76.7 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-DEVEX-HOOKS-006` Atlas retirement | #1259 | 2026-07-11 06:15:09 | 2026-07-11 06:17:45 | 2.6 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-DEVEX-HOOKS-006` closeout reconciliation | #1258 | 2026-07-11 06:09:08 | 2026-07-11 06:11:12 | 2.1 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-CI-FASTGATE-003` shard follow-up | #1257 | 2026-07-11 06:03:48 | 2026-07-11 07:31:59 | 88.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |
| `WO-DEVEX-HOOKS-006` authority constraint | #1256 | 2026-07-11 06:02:35 | 2026-07-11 06:04:45 | 2.2 min | UNKNOWN | UNKNOWN - not represented in PR metadata | UNKNOWN |

**Baseline PRs reviewed:** 15
**Median PR-open-to-merge cycle:** 2.2 minutes
**Baseline founder touches:** `UNKNOWN`
**Baseline data gaps:** dispatch/start timestamps, chat/session authority exchanges, founder-touch
counts, touch reasons, and true/false-wall classifications are not reconstructable from GitHub PR
metadata alone.

## Completion Result

```text
RESULT: PASS
WORK_ORDER: WO-MAO-000
SOURCES_REVIEWED: 15 governance/canon surfaces plus 15 merged-PR records
CONFLICTS_FOUND: 16
FILE_LINE_CITATIONS_COMPLETE: YES
FALSE_WALL_RULES: F02,F03,F04,F05,F06,F09,F14,F15,F16
RULES_TO_KEEP: one Brain; isolated worktrees; PR/check enforcement; protected boundaries; fail-closed gates
RULES_TO_CLARIFY: F11,F12,F15
RULES_TO_NARROW: F02,F03,F06,F13,F14
RULES_TO_SUPERSEDE: F01,F04,F05,F07,F08,F09,F10,F16
RULES_TO_RETIRE: duplicate controlling merge-policy semantics in F10
OPERATOR_MERGE_CURRENT_RULES: human-only root/branch prose plus conflicting explicit-grant and Mode B/C documents
OPERATOR_MERGE_PROPOSED_ENABLEMENT: ratified but inactive until exact MAO-002 pilot registration and mechanical gate
OPERATOR_MERGE_SUSPENSION_TRIGGERS: unauthorized scope; reservation collision; gate bypass; protected boundary; false evidence
BASELINE_WOS_REVIEWED: 15 merged PR/WO slices
BASELINE_MEDIAN_CYCLE_TIME: 2.2 minutes from PR open to merge
BASELINE_FOUNDER_TOUCHES: UNKNOWN
BASELINE_DATA_GAPS: dispatch times and owner-intervention history are not represented in PR metadata
PROPOSED_WO_MAO_001_INPUT: reconcile all 16 findings, persist authority, stage operator merge, add mechanical pilot interlock
TRUE_AUTHORITY_WALL: NONE
```
