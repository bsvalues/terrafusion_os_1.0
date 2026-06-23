# WO-0010 — Migrate Dais Dossier draft panels to countyStudyBridge D-012 residual

- **Risk:** R2 · **Suite:** TerraGPT · **Agent:** Builder
- **Surface:** TerraGPT

## Allowed files
- `backend/src/TerraFusion.*/**/*Gpt*`
- `frontend/apps/os-shell/src/**/*Gpt*`
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

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0010`

## Stop conditions
- another suite must be changed · shell routing must change · owner unclear
- a forbidden file must be touched · proof cannot be produced

## Acceptance criteria
- [ ] only allowed files touched (`brain review-diff --workorder WO-0010` = PROCEED)
- [ ] required proof passes
- [ ] memory updated (drift/release-gates/ADR as needed)

> REFINE the allowed/forbidden lists before dispatch — these are canon-derived defaults, not final scope.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0010",
  "task": "Migrate Dais Dossier draft panels to countyStudyBridge D-012 residual",
  "risk": "R2",
  "suite": "TerraGPT",
  "allowed_files": [
    "backend/src/TerraFusion.*/**/*Gpt*",
    "frontend/apps/os-shell/src/**/*Gpt*",
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
    "backend/src/TerraFusion.*/**/*Dossier*"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0010"
  ]
}
```
