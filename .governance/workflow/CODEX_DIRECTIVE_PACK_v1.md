# TerraFusion Codex Directive Pack v1

> **Purpose:** Use Codex as a bounded execution swarm for TerraFusion, not as the decider.

---

* **Date:** 2026-03-18
* **Status:** v1, TerraFusion-specific, documentation-only
* **Scope:** Workflow guidance only; no promotion into `.github/AGENT_ENTRYPOINT.md` in this version

---

## Operating Doctrine

- Codex owns bounded repo labor: mechanical sweeps, audits, proof runs, contract alignment, test reinforcement, and explicit PR review.
- Humans retain scope, governance exceptions, architecture, roadmap, merge judgment, and constitutional product choices.
- Claude Code and Copilot remain the preferred tools for architecture-heavy, backend-risky, or judgment-heavy slices.
- Use local Codex for precise edits and proof commands against the active repo; use cloud/worktree Codex for parallel recon when the work can be decomposed cleanly.

## Mode Rules

### Recon

- Goal: map the subsystem, contracts, drift, and risk without editing code.
- Best for: audits, inventory, changed-file intent maps, route/contract drift checks, backend churn mapping.
- Rule: report confirmed findings and blocked areas; do not invent fixes or broaden scope.

### Execution

- Goal: apply a tightly bounded, already-decided slice and prove it with the requested commands.
- Best for: import cleanup, path cleanup, type alignment, frontend cleanup, test backfills, mechanical refactors.
- Rule: touch only the allowed files, preserve stated non-goals, and stop at the slice boundary.

### Review

- Goal: review a branch or PR against explicit acceptance criteria and non-goals.
- Best for: changed-file intent maps, risk callouts, missing tests, behavioral regressions, and governance drift.
- Rule: findings first, proof second, summary last; no redesign proposals unless they are required to explain a defect.

## Prompt Contract

Every Codex prompt in this pack uses the same operator contract and field order:

1. `Objective`
2. `Allowed files`
3. `Forbidden`
4. `Acceptance criteria`
5. `Proof`
6. `Non-goals`
7. `Output`

If any field is missing, the prompt is incomplete and should be tightened before execution.

## Ready-To-Paste Prompts

### Prompt 1: Recon — Shell Contract, Route Surface, and Test Drift Audit

```text
Objective:
Map drift between OS shell route surfaces, workbench host contracts, and current test coverage. Read-only audit only.

Allowed files:
- frontend/apps/os-shell/**
- frontend/packages/**
- os-platform/core/pilot/**
- os-platform/core/tests/**
- .governance/workflow/**
- package.json and test config files only if needed to understand routing or test runners

Forbidden:
- backend/**
- specialized/**
- applications/**
- **/ARCHIVE/**
- package changes
- event renames
- any file edits

Acceptance criteria:
- Identify the route-entry surfaces inspected
- Name the governing contracts and host boundaries involved
- Separate confirmed drift from speculation
- Call out missing or stale tests tied to the drift
- Flag scope-blocked areas instead of inferring changes in forbidden surfaces

Proof:
- rg -n "createBrowserRouter|RouteObject|PropertyWorkbench|tool_completed|tool_succeeded" frontend/apps/os-shell frontend/packages os-platform/core
- rg -n "describe\\(|it\\(" frontend/apps/os-shell os-platform/core/tests
- git diff --stat

Non-goals:
- Do not fix the drift
- Do not redesign routing or workbench contracts
- Do not widen into backend implementation work

Output:
1. inspected surfaces
2. governing contracts
3. confirmed drift
4. test gaps
5. blocked areas
6. recommended bounded follow-up slices
```

### Prompt 2: Recon — Backend Vector/RAG Inventory Only

```text
Objective:
Inventory vector, retrieval, and RAG-related backend code paths, migrations, tests, and unstaged risk without changing code.

Allowed files:
- backend/**
- os-platform/core/types/**
- os-platform/core/pilot/**
- .governance/workflow/**
- migration files and test projects related to vector or RAG paths

Forbidden:
- frontend/**
- specialized/**
- applications/**
- **/ARCHIVE/**
- package or dependency changes
- any file edits

Acceptance criteria:
- List the services, controllers, jobs, migrations, and tests inspected
- Identify which paths are active, stubbed, duplicated, or drifted
- Note any unstaged or partially wired risk that could affect future work
- Distinguish confirmed behavior from inferred behavior
- Keep the output inventory-only with no implementation changes

Proof:
- rg -n "vector|embedding|rag|retriev|pgvector|semantic" backend os-platform/core
- git status --short
- git diff --name-only

Non-goals:
- Do not implement endpoints, migrations, or tests
- Do not propose platform-wide architecture changes
- Do not touch frontend consumers

Output:
1. inventory map
2. active vs stubbed paths
3. migration and test coverage status
4. unstaged risk
5. bounded next actions
```

### Prompt 3: Execution — Frontend Mechanical Cleanup After Muse-First Sealing

```text
Objective:
Apply a bounded frontend-only mechanical cleanup after Muse-first sealing, limited to import hygiene, stale path cleanup, dead-code removal, and directly related test maintenance.

Allowed files:
- frontend/apps/os-shell/**
- frontend/packages/**
- related frontend tests only
- .governance/workflow/** if workflow docs need status updates for this slice

Forbidden:
- backend/**
- os-platform/core/**
- specialized/**
- applications/**
- **/ARCHIVE/**
- package changes
- new feature work
- UI redesign

Acceptance criteria:
- Remove only confirmed dead code, stale imports, or path drift inside the allowed surface
- Preserve Muse-first filtering and existing write-lane restrictions
- Keep behavior unchanged outside the cleanup target
- Update or add only the tests needed to keep the cleaned slice covered
- Leave a concise changed-file inventory with rationale for each file

Proof:
- pnpm run type-check
- npx vitest run <listed frontend tests>
- git diff --stat

Non-goals:
- Do not expand into backend fixes or contract redesign
- Do not introduce new flows, components, or package dependencies
- Do not use cleanup as a pretext for refactoring unrelated files

Output:
1. changed files
2. cleanup actions taken
3. rationale
4. risks
5. exact proof results
```

### Prompt 4: Execution — Trace Normalization and Test Reinforcement

```text
Objective:
Seal a bounded frontend-only trace-normalization slice so the API boundary normalizes tool_completed to tool_succeeded and the affected workbench surface remains covered by tests.

Allowed files:
- frontend/apps/os-shell/src/api/pilotApi.ts
- frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx
- related frontend tests only
- .governance/workflow/** if this slice requires workflow status updates

Forbidden:
- backend/**
- os-platform/core/**
- migrations
- package changes
- runtime-wide event renames outside the allowed files
- any write-capable flow expansion

Acceptance criteria:
- tool_completed is normalized to tool_succeeded at the frontend API boundary
- Muse-first filtering remains intact
- No write-capable flows are exposed
- Tests cover the normalization path and the affected surface behavior
- The change stays inside the named files plus related tests

Proof:
- pnpm run type-check
- npx vitest run <listed trace-normalization tests>
- git diff --stat

Non-goals:
- Do not rename backend events
- Do not broaden the change into unrelated pilot API cleanup
- Do not alter workbench capabilities beyond the normalization slice

Output:
1. changed files
2. rationale
3. risks
4. exact proof results
```

### Prompt 5: Execution — Governed Contract and Type Alignment Sweep

```text
Objective:
Perform a governed mechanical sweep for contract, import, and type alignment inside approved governance lanes only.

Allowed files:
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** for gate wiring only
- related tests under os-platform/core/tests/**

Forbidden:
- frontend/**
- backend/**
- specialized/**
- applications/**
- **/ARCHIVE/**
- new tool categories
- schema redesign
- feature additions outside contract alignment

Acceptance criteria:
- Align types and imports to existing contracts without changing intended behavior
- Keep generated JavaScript untouched; `.ts` remains the source of truth
- Preserve manifest-path and silent-logging governance rules
- Update or add only the tests needed to prove the alignment
- Leave no unexplained contract drift in the touched files

Proof:
- pnpm run type-check
- node --test os-platform/core/tests/phase83-tools.test.mjs
- git diff --stat

Non-goals:
- Do not invent new interfaces or governance exceptions
- Do not modify generated `.js` files by hand
- Do not spill into frontend or backend feature work

Output:
1. changed files
2. contracts aligned
3. rationale
4. risks
5. exact proof results
```

### Prompt 6: Review — PR Hardening Against Acceptance Criteria

```text
Objective:
Review this branch or PR against the stated acceptance criteria, proof commands, and non-goals. Focus on regressions, scope creep, missing tests, and governance drift.

Allowed files:
- changed files on the branch or PR
- related tests and workflow docs needed to validate intent
- git diff, status, and test output only

Forbidden:
- blind approval
- architecture rewrites
- speculative redesigns unrelated to a concrete finding
- any file edits unless a follow-up execution slice is explicitly requested

Acceptance criteria:
- Produce findings first, ordered by severity
- Include a changed-file intent map
- Call out missing or weak proof
- Identify violations of stated non-goals or forbidden-scope drift
- State explicitly if no findings were found

Proof:
- git diff --stat
- git diff --name-only
- <run or inspect the proof commands listed in the change request>

Non-goals:
- Do not implement fixes during review
- Do not replace explicit acceptance criteria with personal preference
- Do not treat stylistic differences as findings unless they hide risk

Output:
1. findings
2. changed-file intent map
3. proof status
4. residual risks
5. concise summary
```

## Usage Notes

- Give Codex a foreman-style task frame, not an open-ended brainstorm prompt.
- Decompose mixed frontend, backend, and governance work into separate slices before handing it to Codex.
- If a slice would require roadmap judgment, governance exceptions, or architecture invention, do that work before the Codex handoff.
- Review the diff and proof output yourself before merge; this pack narrows execution, it does not delegate judgment.
