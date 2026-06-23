# WO-LOCALOPS-002 — Local AI Provider Abstraction

- **Risk:** R3 · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** pilot-layer provider interface + local HTTP provider + disabled provider + policy enforcement
- **Goal:** Provider interface with three implementations: `local` (HTTP endpoint from `AI_BASE_URL`+`AI_MODEL` env, e.g. Ollama/llama.cpp-compatible), `disabled` (always refuses with explanation), and a policy wrapper that makes external providers unreachable under `localops`/`disabled` profiles. No silent cloud fallback: if the local provider is down, the answer is an honest error, never a cloud retry.

## Files likely touched
- `os-platform/core/pilot/localops/providers/provider.mjs` (new) — interface: `complete()`, `health()`, `describe()`
- `os-platform/core/pilot/localops/providers/localHttpProvider.mjs` (new) — env-configured endpoint, no hardcoded port
- `os-platform/core/pilot/localops/providers/disabledProvider.mjs` (new)
- `os-platform/core/pilot/localops/providers/policyGate.mjs` (new) — profile-aware factory; refusal objects carry `refused: true` + safe-path explanation
- `os-platform/core/pilot/localops/__tests__/providers.test.mjs` (new) — incl. "localops + cloud provider requested → refusal", "local endpoint down → error, no fallback"
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `os-platform/core/pilot/localops/**`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] Factory consults WO-LOCALOPS-001 profile contract; under `localops` only the local provider class is constructible
- [ ] `health()` returns structured status (reachable, model, latency) without throwing
- [ ] Refusals are data (not exceptions) and include the safe path ("switch profile X / start local model Y")
- [ ] Zero imports from cloud SDKs; zero hardcoded endpoints (`brain check hardcoded-ports` green)
- [ ] Tests green incl. fallback-forbidden test

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-002`
- provider unit tests green (command recorded in implementation log)

## Rollback
- Delete `providers/` subtree; WO-001 module remains standalone-valid.

## Stop conditions
- an existing provider factory already exists in the runtime (recon found enums only, but verify-not-rebuild before coding)
- network access policy in the dev environment blocks even loopback testing → document, stub health, continue
- forbidden file must change

## Non-goals
- No RAG, no UI, no diagnostics, no backend C# provider, no model downloading/marketplace.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-002",
  "task": "Local AI provider abstraction: interface + local HTTP provider + disabled provider + localops policy gate, no cloud fallback",
  "risk": "R3",
  "suite": "OS / TerraPilot",
  "allowed_files": [
    "os-platform/core/pilot/localops/**",
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
    "pnpm brain review-diff --workorder WO-LOCALOPS-002"
  ]
}
```
