# WO-0009 — Full UI honesty sweep: run honesty contract battery and scanner, record register

- **Risk:** R2 · **Suite:** TerraAtlas · **Agent:** Builder
- **Surface:** TerraAtlas

## Allowed files
- `backend/src/TerraFusion.*/**/*Atlas*`
- `frontend/apps/os-shell/src/**/*Atlas*`
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
- `backend/src/TerraFusion.*/**/*Dais*`
- `backend/src/TerraFusion.*/**/*Dossier*`
- `backend/src/TerraFusion.*/**/*Gpt*`

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0009`

## Stop conditions
- another suite must be changed · shell routing must change · owner unclear
- a forbidden file must be touched · proof cannot be produced

## Acceptance criteria
- [ ] only allowed files touched (`brain review-diff --workorder WO-0009` = PROCEED)
- [ ] required proof passes
- [ ] memory updated (drift/release-gates/ADR as needed)

> REFINE the allowed/forbidden lists before dispatch — these are canon-derived defaults, not final scope.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0009",
  "task": "Full UI honesty sweep: run honesty contract battery and scanner, record register",
  "risk": "R2",
  "suite": "TerraAtlas",
  "allowed_files": [
    "backend/src/TerraFusion.*/**/*Atlas*",
    "frontend/apps/os-shell/src/**/*Atlas*",
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
    "backend/src/TerraFusion.*/**/*Dais*",
    "backend/src/TerraFusion.*/**/*Dossier*",
    "backend/src/TerraFusion.*/**/*Gpt*"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0009"
  ]
}
```
