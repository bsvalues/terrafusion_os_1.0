# WO-LOCALOPS-004 — Local KB / RAG Interface

- **Risk:** R2 · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** local markdown retrieval service; NO dependency on the external RAG API (`VITE_RAG_API_URL` / RAGPanel expects a service on another host — that is exactly what a locked-down county server may not have)
- **Goal:** Retrieval interface that loads markdown from configured docs paths (`docs/localops/**`, architecture docs, runbooks), returns `{ sourcePath, heading, snippet, matchReason, score }`, and answers honestly ("no local source found") when nothing matches. When `AI_REQUIRE_SOURCES=true`, AI answers without retrieved sources are refused via the WO-003 `localops.policy.refused` event. Minimal lexical matching is acceptable — no vector infra required for v1.

## Files likely touched
- `os-platform/core/pilot/localops/kb/localKb.mjs` (new) — index/load + retrieve
- `os-platform/core/pilot/localops/kb/sources.mjs` (new) — configured doc roots from env (no hardcoded paths beyond repo-relative defaults)
- `os-platform/core/pilot/localops/__tests__/kb.test.mjs` (new) — hit with sources, miss with honest fallback, heading extraction
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `os-platform/core/pilot/localops/**`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] Retrieval returns source references for every snippet (path + heading)
- [ ] Empty/missing doc roots → structured "no local source found", never a fabricated answer
- [ ] Emits `localops.rag.retrieved` through the WO-003 adapter
- [ ] Doc roots configurable; defaults documented in BENTON_AI_PROFILE.md
- [ ] Tests green

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-004`
- KB unit tests green

## Rollback
- Delete `kb/` subtree; adapter and providers unaffected.

## Stop conditions
- a usable LOCAL (in-repo, no external service) retrieval implementation already exists (verify-not-rebuild)
- indexing county documents (not repo docs) is requested → STOP: county document indexing requires approval rules (hard boundary)

## Non-goals
- No vector DB, no embeddings service, no Pinecone, no external RAG API dependency, no county records indexing.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-004",
  "task": "Local KB/RAG interface: markdown retrieval with source references + honest no-source fallback; no external RAG dependency",
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
    "pnpm brain review-diff --workorder WO-LOCALOPS-004"
  ]
}
```
