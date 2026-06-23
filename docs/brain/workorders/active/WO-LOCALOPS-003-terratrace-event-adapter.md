# WO-LOCALOPS-003 — TerraTrace Event Adapter for LocalOps

- **Risk:** R2 · **Suite:** OS / TerraPilot (trace = bridge lane, append-only) · **Agent:** Claude Code
- **Surface:** ADAPTER ONLY. `os-platform/core/trace/TraceStore.ts` is FROZEN (Phase 7 seal `a7fa3cde7`) — do not touch it. Reuse `packages/os-core/src/services/trace/TerraTraceService.ts` (already has PII sanitization + compliance classification) via a narrow LocalOps adapter.
- **Goal:** Event path for: `localops.ai.requested`, `localops.ai.responded`, `localops.rag.retrieved`, `localops.tool.diagnostic.started`, `localops.tool.diagnostic.completed`, `localops.policy.refused`, `localops.approval.required`. Dev/no-op implementation selectable when no trace backend is wired; events carry correlation id when available; never store secrets (reuse WO-001 redaction).

## Files likely touched
- `os-platform/core/pilot/localops/trace/localOpsTraceAdapter.mjs` (new) — event-type constants + emit() facade
- `os-platform/core/pilot/localops/trace/noopTraceSink.mjs` (new) — dev/no-op with clear TODO referencing wiring slice
- `os-platform/core/pilot/localops/__tests__/trace.test.mjs` (new) — event shape, redaction applied, no-op safety
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `os-platform/core/pilot/localops/**`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] All seven event types defined as constants; payload schema documented in the file header
- [ ] Adapter consumes the existing TerraTraceService event shape (county/actor/event/compliance) — verified against the real interface, not assumed
- [ ] Frozen files untouched: `TraceStore.ts`, `packages/os-core/src/types/index.ts`, `.github/AGENT_ENTRYPOINT.md`
- [ ] `AI_REQUIRE_TRACE=true` + sink unavailable → requests are refused (fail-closed), tested
- [ ] Tests green

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-003`
- trace adapter unit tests green

## Rollback
- Delete `trace/` subtree under localops. No frozen-file risk by construction (forbidden patterns enforce).

## Stop conditions
- adapter cannot be built without modifying TraceStore.ts or types/index.ts → STOP, operator decision (frozen spine)
- TerraTraceService interface differs materially from recon → re-scope before coding

## Non-goals
- No Postgres trace persistence wiring, no trace UI (WO-006 renders, this WO emits), no backend C# audit changes.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-003",
  "task": "TerraTrace-compatible LocalOps event adapter (7 localops.* event types, no-op dev sink, fail-closed under AI_REQUIRE_TRACE)",
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
    "packages/os-core/src/types/index.ts",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "tools/registry/terrapilot.tools.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-003"
  ]
}
```
