# WO-MAO-001 - Governance Reconciliation and Operator-Merge Ratification

- **Program:** `PROGRAM-MAO-001`
- **Goal:** `GOAL-MAO-001`
- **Loop:** `LOOP-MAO-001`
- **Risk:** R5 - owner-ratified constitutional/governance amendment, bounded by
  `OWNER-MAO-001-R5-GOVERNANCE-AMENDMENT`
- **Status:** in progress

## Objective

Convert the 16 source-cited WO-MAO-000 findings into one governance reconciliation, ratify the true
authority-wall doctrine, and define bounded revocable operator merge without enabling portfolio-wide
merge authority.

## Allowed files

- `AGENTS.md`
- `CANON_INDEX.md`
- `.governance/main.protection.json`
- `.governance/owner-decisions.json`
- `.governance/mao-002-pilot-merge-authority.json`
- `.github/workflows/core-governance-gates.yml` (pilot gate wiring only)
- `brain/packs/README.md`
- `docs/adr/**`
- `docs/agents/**`
- `docs/branching/**`
- `docs/brain/evidence/WO-MAO-000-proof.md`
- `docs/brain/workorders/**`
- `docs/governance/CI_GOVERNANCE_INDEX.md`
- `scripts/ci/verify-agents-doc-against-protection-canon.sh`
- `scripts/ci/verify-branch-protection-against-canon.sh`
- `scripts/ci/verify-mao-002-pilot-authority.py`
- `scripts/ci/__tests__/governance-canon-scripts.test.sh`
- `scripts/ci/__tests__/mao-002-pilot-authority.test.py`

## Forbidden files

- `.github/workflows/**` except `core-governance-gates.yml` pilot gate wiring
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
- `corepack pnpm run type-check`

## Stop conditions

- constitutional change beyond the audited reconciliation;
- unresolved equal-authority conflict after ADR-EXEC-001;
- runtime, CI, production, credential, security-exception, PACS, or county-data scope;
- destructive or irreversible action.

## Acceptance criteria

- [ ] all 16 audit findings map to an amendment or no-change disposition;
- [ ] the full WO-MAO-000 audit is persisted at `docs/brain/evidence/WO-MAO-000-proof.md`;
- [ ] the root hierarchy is replaced, not supplemented, and directory-local rules cannot broaden it;
- [ ] the exact bounded R5 owner decision is recorded without granting general R5 authority;
- [ ] one canonical `R0` through `R5` vocabulary remains;
- [ ] portfolio reconciliation is reachable in `NEXT_ACTION_MATRIX.md`;
- [ ] operator merge is bounded, revocable, and not portfolio-wide;
- [ ] operator merge remains inactive until the two MAO-002 PRs and their final SHAs are registered;
- [ ] `governed-spine` mechanically fails a registered pilot PR on suspension, SHA mismatch, or scope drift;
- [ ] the branch-protection canon and drift verifier cover every invariant claimed by `AGENTS.md`;
- [ ] machine scope review confirms all changed files are allowed; any unrelated global baseline
      failure is recorded without weakening or bypassing the gate;
- [ ] required validation and PR checks pass.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-MAO-001",
  "task": "Governance Reconciliation and Operator-Merge Ratification",
    "risk": "R5",
  "suite": "OS_CORE",
  "allowed_files": [
    "AGENTS.md",
    "CANON_INDEX.md",
    ".governance/main.protection.json",
    ".governance/owner-decisions.json",
    ".governance/mao-002-pilot-merge-authority.json",
    ".github/workflows/core-governance-gates.yml",
    "brain/packs/README.md",
    "docs/adr/**",
    "docs/agents/**",
    "docs/branching/**",
    "docs/brain/evidence/WO-MAO-000-proof.md",
    "docs/brain/workorders/**",
    "docs/governance/CI_GOVERNANCE_INDEX.md",
    "scripts/ci/verify-agents-doc-against-protection-canon.sh",
    "scripts/ci/verify-branch-protection-against-canon.sh",
    "scripts/ci/verify-mao-002-pilot-authority.py",
    "scripts/ci/__tests__/governance-canon-scripts.test.sh",
    "scripts/ci/__tests__/mao-002-pilot-authority.test.py"
  ],
  "forbidden_patterns": [
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
    "node --test os-platform/core/tests/phase83-tools.test.mjs",
    "corepack pnpm run type-check"
  ]
}
```
