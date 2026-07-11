# WO-BRAIN-003 - Operator Command Vocabulary Reconciliation

**Program:** Brain Operator System

**Goal:** `GOAL-BRAIN-OPERATOR-001`

**Loop:** `LOOP-BRAIN-OPERATOR-001`

**Base:** `b5b81f9ad9f70728ad81bd73e240fdd1f5215dc2`

## Verdict

PASS WITH RECONCILIATION. TerraFusion has three distinct command classes that were being mixed in
one vocabulary: operator goal/loop directives, read-only routing aliases, and executable repository
commands. Documentation now names those classes and corrects verified stale routes without changing
any executable CLI.

## Canonical Command Classes

| Class | Syntax / source | Purpose | Mutation claim |
|-------|-----------------|---------|----------------|
| Goal selector | `/goal <program>` in `GOAL_COMMANDS.md` | Select program intent and success state | None by itself |
| Loop directive | `/loop <mode>` in `LOOP_MODES.md` | Control bounded continuation behavior | Only through active WO authority |
| Routing/status alias | `/program-*`, `*-status`, `*-next`, `*-stop` in the command map | Query or control operator routing | Status/next are read-only; stop freezes execution |
| Brain CLI | `corepack pnpm brain <verb>` | Deterministic reason/enforce/judge/record commands | Verb-specific; proof/defer may write evidence |
| OS CLI | `corepack pnpm tf ...` | TerraFusion OS command surface | Command-specific |
| Governance scripts | `corepack pnpm canon:*`, `truth:*`, test/proof scripts | Bounded validation/evidence | Script-specific; never implied by `/goal` alone |

## Verified Brain CLI Truth

Root `package.json` defines `brain: node scripts/brain/brain.mjs`. The live read-only command
`corepack pnpm brain --help` succeeded and listed reason, enforcement, judgment, and record verbs,
including `status`, `today`, `next`, `ask`, `classify`, `workorder`, `check`, `review-diff`,
`commit-plan`, `proof`, `release`, and `defer`.

The pack and router guidance that said `pnpm brain` did not exist was stale and is corrected. This
does not change BRAIN-001's separate finding that `brain next` is config-driven rather than a real
portfolio sequencer.

## Routing Corrections

- Benton PR #1112 is merged; the next Benton Demo node is the live-surface 003D authority boundary,
  not a 003B dependency block.
- Work Order Engine is complete through WOE-012/014; WOE-013 remains an R2 UI soft wall.
- Azure/County Runtime is not an unblocked command; its path crosses SW-01 before production work.
- Brain Operator advances to BRAIN-004.

## Deferred Maturity Findings

- `GOAL_LOOP_PLAYBOOK.md` and detailed program sections contain historical current-state snapshots.
  BRAIN-004 and BRAIN-005 will classify goal/loop maturity rather than rewriting all history here.
- Status/control aliases remain in the command map for compatibility, but they are no longer
  described as program goals.
- Executable CLI alias normalization is out of scope; no package script or command implementation
  changed.

## Next Work Order

`WO-BRAIN-004 - Goal Engine Maturity Review` is dependency-cleared and remains read-only evidence
plus docs.

STOP_TYPE: `BRAIN_COMMAND_VOCABULARY_RECONCILED`
