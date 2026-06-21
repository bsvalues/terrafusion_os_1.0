# WO-LOCALOPS-005 — Read-Only Diagnostics

- **Risk:** R2 · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** read-only diagnostic tools at the pilot layer; reuse `os-platform/core/pilot/local-agent/status.ts` (runtime status snapshot) and `TraceStore.healthy()` patterns where they fit
- **Goal:** Diagnostics callable from the future LocalOps UI: service health, active AI profile/provider, redacted config summary (WO-001 `redact.mjs`), local KB status (WO-004), AI provider health (WO-002), and a safe recent-error summary IF an existing safe log-access pattern is found (otherwise documented gap). Every diagnostic is read-only and emits `localops.tool.diagnostic.started/completed` (WO-003).

## Files likely touched
- `os-platform/core/pilot/localops/diagnostics/diagnostics.mjs` (new) — registry of read-only checks
- `os-platform/core/pilot/localops/__tests__/diagnostics.test.mjs` (new)
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `os-platform/core/pilot/localops/**`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] No diagnostic mutates anything (no writes, no shell exec) — enforced by test asserting the registry exposes no mutating verbs
- [ ] Under `localops`, any shell-execution request → `localops.policy.refused` with safe-path explanation
- [ ] Config summary passes through WO-001 redaction (test: a fake secret never appears in output)
- [ ] Database connectivity/migration status included ONLY if an existing read-only pattern exists (backend `/health` endpoint via HTTP is acceptable; new backend code is not in scope) — else recorded as documented gap
- [ ] Tests green

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-005`
- diagnostics unit tests green

## Rollback
- Delete `diagnostics/` subtree.

## Stop conditions
- a diagnostic requires new backend C# endpoints → defer that diagnostic, note the gap (backend is forbidden in this WO)
- log access would expose PII/secrets with no safe existing pattern → omit + document

## Non-goals
- No remediation/repair actions, no shell agent, no backend changes, no UI (WO-006 renders these).

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-005",
  "task": "Read-only LocalOps diagnostics: health, profile/provider, redacted config, KB status, provider health; refusals for shell/mutation",
  "risk": "R2",
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
    "os-platform/core/trace/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "tools/registry/terrapilot.tools.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-005"
  ]
}
```
