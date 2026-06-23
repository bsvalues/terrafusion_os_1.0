# WO-0013 — Product gate: ServiceRegistry activation verification (read-only inspection + evidence note)

- **Risk:** R2 (read-only verification; only docs written) · **Suite:** OS kernel / Build · **Agent:** Claude Code
- **Surface:** ServiceRegistry (backend service-discovery/port-allocation layer) — VERIFY, do not change
- **Goal:** Answer honestly: is ServiceRegistry ACTIVE in the running 1.0 posture (registered in DI, consumed, health-checked, tested) or honestly not? Output = evidence artifact with verdict + gap list. NO code changes.

## Files likely touched
- `docs/brain/evidence/WO-0013-serviceregistry-verification.md` (new) — the verdict artifact
- `docs/brain/memory/**` (release-gates row; drift row only if a real gap surfaces)

## Allowed files
- `docs/brain/evidence/**`
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `wiki/**`

## Forbidden files
- ALL code (`backend/**`, `frontend/**`, `os-platform/**`, `scripts/**` except none) — read-only slice

## Acceptance criteria
- [ ] Evidence artifact answers: where ServiceRegistry lives, whether it's DI-registered, who consumes it, whether `GetAvailablePort()`/registration paths execute at startup, test coverage, Consul relationship
- [ ] Verdict is one of: ACTIVE (proof) / PARTIALLY ACTIVE (gap list) / NOT ACTIVE (honest) — no "probably"
- [ ] Any activation gap requiring backend behavior change → recorded as new work order candidate, NOT fixed here (stop condition)
- [ ] `brain review-diff --workorder WO-0013` = PROCEED

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0013`
- `pnpm brain proof --workorder WO-0013`

## Rollback
- Docs-only; revert evidence/memory files.

## Stop conditions
- activation requires backend behavior change (own WO + operator approval)
- a forbidden file must be touched · proof cannot be produced

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0013",
  "task": "Product gate: ServiceRegistry activation verification (read-only inspection + evidence note)",
  "risk": "R2",
  "suite": "OS kernel / Build",
  "allowed_files": [
    "docs/brain/evidence/**",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/**",
    "frontend/**",
    "backend/**",
    "scripts/**",
    "tools/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0013",
    "pnpm brain proof --workorder WO-0013"
  ]
}
```
