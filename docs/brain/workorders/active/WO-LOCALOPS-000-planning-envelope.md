# WO-LOCALOPS-000 — LocalOps Planning Envelope (TF-LOCALOPS-001 chain head)

- **Risk:** R1 (docs only) · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** docs/localops/** — doctrine, work-order plan, IT questions, implementation log
- **Goal:** TerraFusion must assist the operator inside a locked-down Benton County server when external AI (ChatGPT/Claude/Copilot/OpenAI/Anthropic/web) is unavailable or prohibited. This WO defines canonical scope, boundaries, and done-definition for the chain; no feature code.

## Files likely touched
- `docs/localops/LOCALOPS_DOCTRINE.md` (new) — profiles (cloud-dev / hybrid-approved / localops / disabled), hard boundaries, refusal doctrine
- `docs/localops/LOCALOPS_WORKORDER_PLAN.md` (new) — chain map WO-LOCALOPS-001..008 → paths → proofs
- `docs/localops/BENTON_IT_QUESTIONS.md` (new) — questions for county IT (allowed ports, model hosting, docs location, audit expectations)
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (new) — running log, appended by every chain WO

## Allowed files
- `docs/localops/**`
- `docs/brain/memory/**`
- `docs/brain/canon/**`

## Forbidden files
- everything else (docs-only slice); base forbidden list below

## Acceptance criteria
- [ ] Doctrine states: no silent cloud fallback · no unrestricted shell · no AI mutation without human approval gate · in-shell only (no standalone app) · TerraTrace-compatible events required
- [ ] Hard non-goals recorded verbatim: no autonomous production repair, no automatic migrations, no property/valuation mutation by AI, no county document indexing without approval rules, no model marketplace, no agent swarm, no self-healing production writes
- [ ] Work-order plan maps each chain WO to real repo paths (grounded in 2026-06-09 recon: pilot runtime `os-platform/core/pilot/dev-pilot-runtime.mjs`, trace `packages/os-core/src/services/trace/TerraTraceService.ts`, frozen `os-platform/core/trace/TraceStore.ts`, shell registry `frontend/apps/os-shell/src/config/` + `orchestration/moduleActivation.ts`)
- [ ] `brain review-diff --workorder WO-LOCALOPS-000` = PROCEED

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-000`

## Rollback
- `git rm docs/localops/*` — pure docs, zero runtime surface.

## Stop conditions
- any code change appears necessary → stop, it belongs to a later WO
- conflict with TF-052 / AGENT_ENTRYPOINT that cannot be reconciled → operator

## Non-goals
- No implementation. No config flags. No UI. Docs only.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-000",
  "task": "LocalOps planning envelope: doctrine, work-order plan, Benton IT questions (docs only)",
  "risk": "R1",
  "suite": "OS / TerraPilot",
  "allowed_files": [
    "docs/localops/**",
    "docs/brain/memory/**",
    "docs/brain/canon/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/ai-systems/ai-systems/ai-swarm/**",
    "frontend/**",
    "backend/**",
    "os-platform/core/trace/TraceStore.ts",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-000"
  ]
}
```
