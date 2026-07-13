# WO-MAO-001 - Governance Reconciliation and Operator-Merge Ratification

- **Program:** `PROGRAM-MAO-001`
- **Goal:** `GOAL-MAO-001`
- **Loop:** `LOOP-MAO-001`
- **Risk:** R3 - governance/tooling policy
- **Status:** in progress

## Objective

Convert the 16 source-cited WO-MAO-000 findings into one governance reconciliation, ratify the true
authority-wall doctrine, and define bounded revocable operator merge without enabling portfolio-wide
merge authority.

## Allowed files

- `AGENTS.md`
- `brain/packs/README.md`
- `docs/adr/**`
- `docs/agents/**`
- `docs/branching/**`
- `docs/brain/workorders/**`

## Forbidden files

- `.github/workflows/**`
- `backend/**`
- `frontend/**`
- `os-platform/**`
- `tools/sync/**`
- `package.json`
- `pnpm-lock.yaml`
- `**/ARCHIVE/**`
- `specialized/**`
- `applications/**`

## Required proof

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `corepack pnpm brain review-diff --workorder WO-MAO-001`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- `corepack pnpm run type-check` when the isolated dependency graph is available

## Stop conditions

- constitutional change beyond the audited reconciliation;
- unresolved equal-authority conflict after ADR-EXEC-001;
- runtime, CI, production, credential, security-exception, PACS, or county-data scope;
- destructive or irreversible action.

## Acceptance criteria

- [ ] all 16 audit findings map to an amendment or no-change disposition;
- [ ] one canonical `R0` through `R5` vocabulary remains;
- [ ] portfolio reconciliation is reachable in `NEXT_ACTION_MATRIX.md`;
- [ ] operator merge is bounded, revocable, and not portfolio-wide;
- [ ] machine scope review confirms all changed files are allowed; any unrelated global baseline
      failure is recorded without weakening or bypassing the gate;
- [ ] required validation and PR checks pass.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-MAO-001",
  "task": "Governance Reconciliation and Operator-Merge Ratification",
  "risk": "R3",
  "suite": "OS_CORE",
  "allowed_files": [
    "AGENTS.md",
    "brain/packs/README.md",
    "docs/adr/**",
    "docs/agents/**",
    "docs/branching/**",
    "docs/brain/workorders/**"
  ],
  "forbidden_patterns": [
    ".github/workflows/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/sync/**",
    "package.json",
    "pnpm-lock.yaml",
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**"
  ],
  "required_proof": [
    "git diff --check",
    "node docs/brain/workorders/tools/wo-query.mjs --json",
    "corepack pnpm brain review-diff --workorder WO-MAO-001",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
