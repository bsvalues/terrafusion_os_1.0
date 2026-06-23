# WO-0007 — Investigate D-011 whether Workbench Window contract is stale post Surface consolidation

- **Risk:** R0 · **Suite:** UNRESOLVED · **Agent:** Graph/Docs
- **Surface:** UNRESOLVED — owner unclear; ask the architect before building

## Allowed files
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `wiki/**`

## Forbidden files
- `**/ARCHIVE/**`
- `specialized/**`
- `applications/**`
- `os-platform/ai-systems/ai-systems/ai-swarm/**`
- `frontend/src/**`
- `frontend/components/**`
- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`
- `backend/src/TerraFusion.*/**/*Forge*`
- `backend/src/TerraFusion.*/**/*Atlas*`
- `backend/src/TerraFusion.*/**/*Dais*`
- `backend/src/TerraFusion.*/**/*Dossier*`
- `backend/src/TerraFusion.*/**/*Gpt*`

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0007`

## Stop conditions
- another suite must be changed · shell routing must change · owner unclear
- a forbidden file must be touched · proof cannot be produced

## Acceptance criteria
- [ ] only allowed files touched (`brain review-diff --workorder WO-0007` = PROCEED)
- [ ] required proof passes
- [ ] memory updated (drift/release-gates/ADR as needed)

> REFINE the allowed/forbidden lists before dispatch — these are canon-derived defaults, not final scope.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0007",
  "task": "Investigate D-011 whether Workbench Window contract is stale post Surface consolidation",
  "risk": "R0",
  "suite": "UNRESOLVED",
  "allowed_files": [
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/ai-systems/ai-systems/ai-swarm/**",
    "frontend/src/**",
    "frontend/components/**",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "backend/src/TerraFusion.*/**/*Forge*",
    "backend/src/TerraFusion.*/**/*Atlas*",
    "backend/src/TerraFusion.*/**/*Dais*",
    "backend/src/TerraFusion.*/**/*Dossier*",
    "backend/src/TerraFusion.*/**/*Gpt*"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0007"
  ]
}
```
