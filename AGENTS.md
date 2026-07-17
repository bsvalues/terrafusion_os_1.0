# TerraFusion OS  Agent Operating Rules (Core Governance)

> **PATH CANON NOTE**
> Exact repository/path identity and controlling-document membership begin at root
> `CANON_INDEX.md`. Its `docs/brain/workorders/CANON_INDEX.md` child is a subordinate Work Order
> governance register. A repository name or authoritative-sounding document is not sufficient by
> itself.

## PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## BRAIN GOVERNANCE & DOMAIN KNOWLEDGE PACKS

> **One TerraFusion Brain. Many packs. No competing brains.**

There is exactly **one** TerraFusion Brain / Cortex. It is the single OS-level authority for:
**queue, sequencing, work orders, risk classification, proof, review-diff, and commit-plan.**
Suites do **not** get separate brains and do **not** get a suite-local queue or autonomous
governance. Suites get **domain knowledge packs** (`brain/packs/**`) that provide local knowledge
only: what a domain owns, what it must never touch, where work routes, what proof is required, and
when a human must approve.

### Authority hierarchy (higher wins on conflict)

This is the single active hierarchy. It replaces the six-level recovery-era hierarchy audited in
[`WO-MAO-000`](docs/brain/evidence/WO-MAO-000-proof.md) and is controlled by
[`ADR-EXEC-001`](docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md):

1. **TerraFusion Constitution** — `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (TF-052)
2. **Ratified owner decisions** — active, unexpired, non-revoked entries in the canonical decision
   register `.governance/owner-decisions.json`
3. **Canonical Brain and root operating governance** — queue, sequencing, risk, proof, authority,
   root `AGENTS.md`, and ratified governance ADRs
4. **Active program and Work Order authority** — only within the exact scope, actions, systems, and
   duration granted by levels 1-3
5. **Directory-local `AGENTS.md` restrictions** — subtree restrictions that may narrow but never
   broaden levels 1-4
6. **Active playbooks and runbooks** — procedures that implement, but never redefine, higher authority
7. **Existing implementation patterns**
8. **Agent judgment** — last resort within all higher boundaries

A directory-local `AGENTS.md` may narrow authority inside its subtree. It may not broaden an owner
grant, contradict the Constitution or active root governance, or redefine the queue. Resolve any
conflict through ADR-EXEC-001; "nearest file wins" is not authority to broaden scope.

Mechanical enforcement is not a prose authority tier, but it is an execution interlock. Agents never
bypass branch protection, required checks, or policy configuration because prose claims an action is
allowed. A doctrine/enforcement mismatch is a governance incident: the stricter effective control wins
until an authorized reconciliation lands.

### Rules for agents

- **Before modifying files, read the relevant domain pack** in `brain/packs/` (see
  `brain/packs/README.md` for the domain→path map), then read any nearer `AGENTS.md`.
- **Preserve one-Brain governance.** Do **not** create a second brain or a suite-local queue.
- **Do not create separate suite brains** or suite-local autonomous governance.
- **One Brain does not mean one worker.** Dependency-cleared Work Orders may execute concurrently in
  isolated worktrees when their path, contract, and environment reservations do not conflict.
- Route work through Brain **work orders, review-diff, proof, and commit-plan**.
- Respect each pack's **Forbidden Writes** and **Escalation Triggers**; never write across a
  write-lane boundary you do not own.

### True authority walls (stop only when new authority is required)

A true authority wall is a presently unresolved boundary that requires new owner authority. Stop for:

1. Constitutional decision (changing TF-052 or constitutional canon)
2. Destructive or irreversible action not already covered by an exact approved recovery procedure
3. Product behavior outside the active Work Order or not already explicitly authorized
4. Branch/merge strategy conflict or missing merge authority; routine branch updates and authorized
   merges are not new strategy decisions
5. Production deployment or live county authorization
6. Canon conflict that remains unresolved after applying ADR-EXEC-001 and bounded source inspection
7. Credentials, secrets, protected security policy, PACS, county SQL, or county data

Failed tests, review comments, routine merge-conflict remediation, approved worktree recovery,
in-scope implementation choices, already-authorized product behavior, next-WO selection, and routine
PR/check remediation are not authority walls.

The active standing decision `OWNER-TF-STANDING-OPERATOR-AUTHORITY` grants Codex the complete
delivery lifecycle for every ratified program and dependency-cleared Work Order inside that
program's separately recorded scope. This includes branch/worktree creation, implementation,
validation, commit, push, PR operation, exact-head assurance, review remediation, eligible squash
merge, post-merge verification, closeout, and continuation. It does not create program scope or
protected-resource authority. `MERGE_AUTH_REQUIRED` is valid only when no applicable standing or
bounded merge authority exists.

## WORKTREE ISOLATION (MANDATORY — WO-BRAIN-0021)

**No two agents may operate in the same mutable working tree.**

Each agent must use a dedicated git worktree tied to exactly one work order.
The shared/main working tree is for human-controlled sync only.

- One worktree = one work order = one branch = one PR.
- Before the first write, every agent runs and reports: `pwd`, `git branch --show-current`, `git rev-parse --show-toplevel`, `git status --short`. If toplevel = main repo root and the agent was not explicitly assigned there, **STOP** and create a worktree.
- If foreign staged or unstaged files are present, **STOP** and report.
- No `git reset --hard` / `git clean` / force checkout / broad stash / `git add -A` without human approval.
- PR is the sync boundary. Agents may open draft or ready PRs and must merge when applicable recorded
  authority and all canonical merge conditions apply. The owner merges only when no standing or
  bounded merge authority applies or a true authority wall requires new authority.
- If a recovery plan's assumptions diverge from current repo state, the plan is stale — do not execute it.
- If the shared checkout state is uncertain, **quarantine** it (do not clean/recover).

Full policy: `docs/agents/AGENT_WORKTREE_ISOLATION.md`
Quarantine protocol: `docs/agents/SHARED_WORKTREE_QUARANTINE.md`
Recovery protocol: `docs/agents/SHARED_WORKTREE_RECOVERY.md`
Branch/PR policy: `docs/branching/BRANCH_AND_WORKTREE_POLICY.md`

## CORE GOVERNANCE SURFACE (ALLOWED SCOPE)
Only modify files under:
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** (only for gate wiring)

Anything outside this scope requires explicit authorization.

## DO NOT TOUCH
- **/ARCHIVE/**
- development/tools/championship-dev/ARCHIVE/**
- specialized/** (unless explicitly authorized)
- applications/** (unless explicitly authorized)

## BUILD ARTIFACTS POLICY (ENFORCED)
- `.ts` is the source of truth.
- `.js` files in `os-platform/core/**` are generated and must match their `.ts` source.
- Do not hand-edit generated `.js` files.
- Regen command (manual): `pnpm run build:core-js` then `pnpm run check:generated`.

## REQUIRED GATES (MUST PASS)
- `pnpm run type-check` (core boundary)
- `node --test os-platform/core/tests/phase83-tools.test.mjs`

## BRANCH PROTECTION (CONSTITUTIONAL GATES)

The following status checks are **required** on `main` branch:

| Check | Scope | Enforcement |
|-------|-------|-------------|
| `governed-spine` | Core-governance surface PRs | Required |
| `phase85-tools` | Core-governance surface PRs | Required |
| `phase86-toolrunner` | Core-governance surface PRs | Required |
| `🔒 TerraFusion Seal Gate` | All PRs | Required |
| `🧪 Tier-1 UI Harness Validation` | All PRs | Required |

### Two-Tier Oracle Model

1. **OS Evidence-Plane Oracle** (golden corpus)
   - Enforcement: `oracle-health.yml` + `GOLDEN_CORPUS.lock.json`
   - Scope: Global governance invariants

2. **County Accreditation Oracle** (reference packet lock)
   - Enforcement: `accreditation-oracle-health.yml` + `ACCREDITATION_REFERENCE.lock.json`
   - Scope: County deployment/accreditation invariants

**Runbook:** See `SUSTAINMENT.md` § "Oracle Workflows: Known Pitfalls & Fixes" for cross-OS hardening patterns.

### Branch Protection Settings (GitHub)

The machine-readable canon block below is the sole inline branch-protection settings source. The
normalized repository snapshot is `.governance/main.protection.json`; do not maintain a second YAML
example here.

### Branch Protection Canon (Machine Readable)

```yaml
require_pull_request: true
required_status_checks:
  strict: true
  contexts:
    - governed-spine
    - phase85-tools
    - phase86-toolrunner
    - 🔒 TerraFusion Seal Gate
    - 🧪 Tier-1 UI Harness Validation
required_pull_request_reviews:
  required_approving_review_count: 0
enforce_admins: true
required_conversation_resolution: true
allow_force_pushes: false
allow_deletions: false
```

**Solo Dev Governance:**
- ✅ CI status checks enforce quality (SEAL + gates)
- ✅ PRs enforce evidence trail (no direct pushes)
- ✅ Include administrators (cannot bypass own gates)
- ✅ Approvals = 0 (CI is constitutional review)
- ✅ `--admin` not required for routine merges (enforcement matches this spec)

**Governance Outage Policy:**
> **If SEAL Gate 8 (workflow) or Gate 9 (entrypoint truth) fails, treat as governance outage.**
> **No feature work proceeds until restored.**
>
> This prevents "we'll fix governance later" drift. The gates ARE the constitution.

### Branch Protection Canon (Single Source of Truth)

These are the **enforced invariants** for `main` branch. Any deviation is a governance incident.

| Invariant | Value | Rationale |
|-----------|-------|-----------|
| Required checks | `governed-spine`, `phase85-tools`, `phase86-toolrunner`, `🔒 TerraFusion Seal Gate`, `🧪 Tier-1 UI Harness Validation` | Constitutional review |
| Approving reviews | **0** | Solo dev: CI = approval |
| Require PR | **true** | Evidence trail |
| Require up-to-date | **true** | No merge race conditions |
| Include admins | **true** | Cannot bypass own gates |
| Allow force push | **false** | Immutable history |
| Allow deletion | **false** | Protected branch cannot be deleted |
| Resolve conversations | **true** | Review remediation must be complete |

**Drift Detection (periodic audit):**

If `jq` is not installed, run the raw diff. If it is, prefer the normalized diff.

```bash
# Capture current branch protection JSON
gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection > .tmp/main.protection.current.json

# Verify invariants
jq '.required_pull_request_reviews.required_approving_review_count == 0' .tmp/main.protection.current.json
jq '.enforce_admins.enabled == true' .tmp/main.protection.current.json
jq '.allow_force_pushes.enabled == false' .tmp/main.protection.current.json
jq '.allow_deletions.enabled == false' .tmp/main.protection.current.json
jq '.required_conversation_resolution.enabled == true' .tmp/main.protection.current.json
jq '.required_status_checks.contexts | contains(["governed-spine","phase85-tools","phase86-toolrunner","🔒 TerraFusion Seal Gate","🧪 Tier-1 UI Harness Validation"])' .tmp/main.protection.current.json

# Raw diff (no dependencies)
git diff --no-index .governance/main.protection.json .tmp/main.protection.current.json

# Normalized diff (recommended if jq is available)
jq -S . .governance/main.protection.json > .tmp/main.protection.canon.norm.json
jq -S . .tmp/main.protection.current.json > .tmp/main.protection.current.norm.json
git diff --no-index .tmp/main.protection.canon.norm.json .tmp/main.protection.current.norm.json
```

**Snapshot Update Policy:**
- Only update `.governance/main.protection.json` when governance *intentionally* changes
- Commit with `docs(governance): update branch protection snapshot`
- Link to the PR that authorized the change
- Update "Last verified" date below

**Last verified:** 2026-07-14 ([PR #1273](https://github.com/bsvalues/terrafusion_os_1.0/pull/1273), WO-MAO-001 live API and canon reconciliation)

## TOOL GOVERNANCE RULES
- ToolRegistry must resolve the manifest path canonically (relative to ToolRegistry) and allow env override only:
  - `TERRAFUSION_TOOL_MANIFEST_PATH`
- ToolRegistry logging must be silent unless:
  - `DEBUG_TOOLREGISTRY=1`
## DEBUGGING WORKFLOWS

### Quick Debug: Trace Lookups
When a tool execution fails, grab the `correlationId` from the error response and query the trace chain:

```bash
# Full request trace (causal chain: tool_invoked → tool_completed/tool_failed)
pnpm run trace:query --correlation <correlationId>

# Recent failures
pnpm run trace:query --recent 10 --type tool_failed

# Tool-specific errors
pnpm run trace:query --tool <toolId> --type tool_failed

# Error classification
pnpm run trace:query --error-code EXECUTION_FAILED

# CLI help
pnpm run trace:query --help
```

**Structured error fields:**
- `errorCode`: Error classification (EXECUTION_FAILED, VALIDATION, etc.)
- `component`: Emitting component (ToolRunner, Handler, ToolRegistry)
- `stackTrace`: Full stack trace for handler errors (tool_failed events only)

### Wave 1 Intake Debugging
When Wave 1 intake operations fail (after unfreeze on 2026-02-21), use these patterns:

```bash
# Nomination rejected → grab correlationId from error response
pnpm run trace:query --correlation <correlationId>

# Recent intake failures (last 10)
pnpm run trace:query --recent 10 --error-code REJECTED_PII
pnpm run trace:query --recent 10 --error-code REJECTED_MISSING_EVIDENCE
pnpm run trace:query --recent 10 --error-code REJECTED_LATE

# All rejections for a specific slot
pnpm run trace:query --component IntakeHandler --type nomination_rejected

# Pre-unfreeze dry-run (validates mechanics without touching Zone A)
node scripts/wave1-dryrun.mjs              # All scenarios
node scripts/wave1-dryrun.mjs good         # Happy path
node scripts/wave1-dryrun.mjs pii          # PII rejection
node scripts/wave1-dryrun.mjs late         # Late submission

# Preflight check (run before 2026-02-21 intake begins)
pwsh scripts/wave1-preflight.ps1
```

**Wave 1 Canonical Error Codes:**
- `REJECTED_PII`: SSN/email/phone detected in title
- `REJECTED_MISSING_EVIDENCE`: Evidence field empty or null
- `REJECTED_LATE`: Submitted after 2026-02-21T23:59:59Z (UTC)
- `REJECTED_INVALID_FORMAT`: Title or evidence format invalid
- `REJECTED_SLOT_CAP`: Slot cap (20) exceeded
- `HANDLER_ERROR`: IntakeHandler crash (includes stackTrace)

### UI Error Debugging (Phase 1: correlationId-First UX)
When users encounter errors in the UI, all errors display with correlationId for trace chain lookup.

**Three Error Sources:**

1. **Backend Errors** (from Pilot API)
   - correlationId prefix: `corr-*` (backend-generated)
   - User sees: ErrorDisplay with correlationId + copy button
   - Debug: `pnpm run trace:query --correlation <correlationId>`
   - Example: `corr-abc123-def456` → backend tool execution failure

2. **Network Errors** (fetch failures, timeouts)
   - correlationId prefix: `net-*` (client-generated)
   - User sees: ErrorDisplay with generated correlationId
   - Debug: Check browser DevTools Network tab + correlationId for timing
   - Example: `net-abc123-def456` → API unreachable, DNS failure

3. **React Errors** (component render crashes)
   - correlationId prefix: `ebnd-*` (ErrorBoundary-generated)
   - User sees: ErrorDisplay with correlationId + Reset button
   - Debug: Browser console has full stack trace + correlationId
   - Example: `ebnd-abc123-def456` → component threw during render

**Visual Error Demo:**
```bash
# Launch dev server with error demo page
pnpm --filter terrafusion-frontend run dev

# Navigate to: http://localhost:5173/error-demo
# Shows 5 error scenarios with correlationId display
```

**Common UI Debug Patterns:**
```bash
# User reports correlationId from UI → lookup trace
pnpm run trace:query --correlation <correlationId>

# Filter by error origin
pnpm run trace:query --correlation net-*     # Network errors
pnpm run trace:query --correlation ebnd-*    # React errors
pnpm run trace:query --correlation corr-*    # Backend errors

# Check recent UI errors (last 10)
pnpm run trace:query --recent 10 --component PilotAPI
pnpm run trace:query --recent 10 --component ErrorBoundary
```

**CorrelationId Flow (UI → Backend):**
- User action → Pilot API call → Backend generates `corr-*`
- Backend returns correlationId in response (success or failure)
- UI displays correlationId in ErrorDisplay component
- Dev mode: Shows trace query command hint
- Production: correlationId visible + copyable, trace hint hidden

**Testing Error Flows:**
```bash
# Run UI error tests
pnpm --filter terrafusion-frontend test ErrorDisplay.test
pnpm --filter terrafusion-frontend test pilotapi-error-normalization.test

# Visual verification
# 1. Start dev server: pnpm run dev (from frontend/)
# 2. Navigate to /error-demo
# 3. Verify correlationId visible + copyable
# 4. Dev mode: Expand "Developer Info" to see trace query hint
```

## COMMIT HYGIENE
- Small commits, one logical change per commit.
- Never fix by exclusion unless the exclusion is policy-backed and documented here.
