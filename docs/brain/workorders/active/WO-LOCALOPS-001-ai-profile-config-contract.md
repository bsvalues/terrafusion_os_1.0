# WO-LOCALOPS-001 — AI Profile Config Contract

- **Risk:** R2 · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** pilot-layer config module + env template; no UI, no provider calls yet
- **Goal:** One config contract that every later LocalOps WO reads. Profiles: `cloud-dev`, `hybrid-approved`, `localops`, `disabled`. Flags: `AI_EXTERNAL_CALLS`, `AI_ALLOW_WEB`, `AI_ALLOW_SHELL`, `AI_ALLOW_MUTATION`, `AI_REQUIRE_TRACE`, `AI_REQUIRE_SOURCES`. `localops` forces external=false/web=false/shell=false/mutation=false/trace=true/sources=true regardless of individual flag overrides (profile wins; no flag can re-enable external calls under localops).

## Files likely touched
- `os-platform/core/pilot/localops/aiProfile.mjs` (new) — profile parsing, flag resolution, invariant enforcement
- `os-platform/core/pilot/localops/redact.mjs` (new) — secret-redaction helper for config display (keys matching /secret|key|password|token|connection/i → `***`)
- `os-platform/core/pilot/localops/__tests__/aiProfile.test.mjs` (new)
- `.env.template` — append AI_PROFILE block with comments (no values that are secrets)
- `docs/localops/BENTON_AI_PROFILE.md` (new/update)
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `os-platform/core/pilot/localops/**`
- `.env.template`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] Unknown/absent AI_PROFILE resolves to `disabled` (fail-safe, not cloud-dev)
- [ ] Under `localops`, attempting to read an effective `AI_EXTERNAL_CALLS=true` is impossible (test proves override is ignored)
- [ ] No hardcoded ports/URLs — endpoint config deferred to WO-LOCALOPS-002 via env
- [ ] Redaction helper covers connection strings, JWT secrets, API keys; test with .env.template fixture names
- [ ] Tests green; `pnpm brain check` green (hardcoded-ports gate)

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-001`
- `npx vitest run os-platform/core/pilot/localops` (or node --test if .mjs convention demands)

## Rollback
- Delete `os-platform/core/pilot/localops/` + revert `.env.template` hunk. Nothing imports the module until WO-002.

## Stop conditions
- existing config system already provides an equivalent profile contract (verify-not-rebuild — grep first)
- a forbidden file must change · proof cannot be produced

## Non-goals
- No provider implementation, no HTTP calls, no UI, no backend C# changes.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-001",
  "task": "AI profile config contract: cloud-dev/hybrid-approved/localops/disabled + policy flags + redaction helper",
  "risk": "R2",
  "suite": "OS / TerraPilot",
  "allowed_files": [
    "os-platform/core/pilot/localops/**",
    ".env.template",
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
    "os-platform/core/trace/TraceStore.ts",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "tools/registry/terrapilot.tools.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-001"
  ]
}
```
