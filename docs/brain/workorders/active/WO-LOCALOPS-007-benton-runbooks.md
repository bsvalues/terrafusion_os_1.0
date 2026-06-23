# WO-LOCALOPS-007 — Benton Runbooks

- **Risk:** R1 (docs only) · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** docs/localops/** operator documentation; these same files are WO-004 KB content, so writing them completes the local answer corpus
- **Goal:** Practical, operator-focused runbooks assuming external AI is unavailable and TerraFusion must explain itself.

## Files likely touched
- `docs/localops/BENTON_SERVER_RUNBOOK.md` (new) — start/stop services, ports-by-env, health checks, where logs live, common failures + safe responses
- `docs/localops/BENTON_AI_PROFILE.md` (update from WO-001) — full profile/flag reference + how to point AI_BASE_URL at the county-approved local model host
- `docs/localops/LOCALOPS_ACCEPTANCE_TEST.md` (new) — step-by-step human-runnable proof script (precursor to WO-008 evidence)
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] Runbook steps reference real commands/paths from this repo (no aspirational tooling)
- [ ] Acceptance test is executable by a non-developer operator: numbered steps, expected output per step
- [ ] No secrets, no real credentials, no internal hostnames beyond placeholders
- [ ] WO-004 KB retrieval returns these files for obvious operator questions (spot-check recorded in log)

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-007`

## Rollback
- Docs-only; revert files.

## Stop conditions
- runbook accuracy requires running infrastructure that is down → document the gap honestly, do not invent output

## Non-goals
- No code. No screenshots requiring production systems.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-007",
  "task": "Benton LocalOps runbooks: server runbook, AI profile reference, human-runnable acceptance test",
  "risk": "R1",
  "suite": "OS / TerraPilot",
  "allowed_files": [
    "docs/localops/**",
    "docs/brain/memory/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/ai-systems/ai-systems/ai-swarm/**",
    "frontend/**",
    "backend/**",
    "os-platform/core/trace/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-007"
  ]
}
```
