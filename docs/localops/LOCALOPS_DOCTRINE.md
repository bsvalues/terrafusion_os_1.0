# LocalOps Doctrine — TF-LOCALOPS-001

**Status:** Canonical scope for the LocalOps work-order chain (WO-LOCALOPS-000..008).
**Why this exists:** When TerraFusion reaches the real Benton County server/network, external AI tools (ChatGPT, Claude, Copilot, OpenAI/Anthropic APIs, web search, external package feeds) may be blocked or prohibited. TerraFusion must still assist the operator: explain itself, answer from local documentation, and diagnose itself — without any cloud dependency. This is survival infrastructure, not demo AI.

## AI Profiles (config contract — built in WO-LOCALOPS-001)

| Profile | External calls | Web | Shell | Mutation | Trace | Sources |
|---|---|---|---|---|---|---|
| `cloud-dev` | allowed | allowed | gated | gated | required | preferred |
| `hybrid-approved` | allow-listed only | no | no | approval-gated | required | required |
| `localops` | **never** | **never** | **never** | **never** (v1) | **required** | **required** |
| `disabled` | never | never | never | never | n/a | n/a |

Invariants (profile wins over individual flags):
1. Under `localops`, no flag combination can re-enable external calls, web, shell, or mutation. Fail-safe: unknown/absent profile resolves to `disabled`, never `cloud-dev`.
2. **No silent cloud fallback** — if the local provider is down, the answer is an honest error naming the safe path, never a cloud retry.
3. **No unrestricted shell** — read-only diagnostics only; shell execution requests are refused with explanation.
4. **No AI mutation without a human approval gate** — and v1 has no mutation at all; the approval-gate UI is a separate future decision.
5. **TerraTrace-compatible events required** — every AI request/response, RAG retrieval, diagnostic, refusal, and approval-required moment emits a `localops.*` event. If `AI_REQUIRE_TRACE=true` and the trace sink is unavailable, requests are refused (fail-closed).
6. **Source-grounded answers** — when `AI_REQUIRE_SOURCES=true`, answers must cite local sources; if no local source exists, the honest reply is "no local source found."
7. **In-shell only** — LocalOps is TerraPilot inside the TerraFusion shell window contract. No standalone app, no full-page route escape, dock/top bar stay visible.

## Refusal doctrine
A refusal is data, not an exception: `{ refused: true, reason, safePath }`. Every refusal names the safe path (e.g., "switch AI_PROFILE to hybrid-approved with IT sign-off" or "start the approved local model host and set AI_BASE_URL"). Every refusal emits `localops.policy.refused`.

## Hard non-goals (verbatim boundary — none of these in any LocalOps WO)
- autonomous production repair
- unrestricted shell agent
- automatic migrations
- property record mutation by AI
- valuation mutation by AI
- county document indexing without approval rules
- email/calendar/task workspace
- model marketplace
- agent swarm
- self-healing production writes

## Frozen surfaces this chain must not touch
- `os-platform/core/trace/TraceStore.ts` (Phase 7 seal) — trace work is ADAPTER-ONLY via `packages/os-core/src/services/trace/TerraTraceService.ts`
- `.github/AGENT_ENTRYPOINT.md`, `packages/os-core/src/types/index.ts`
- `frontend/apps/os-shell/src/config/generatedModules.ts` (auto-generated; D-010 TOLERATE state)
- Suite write-lanes (Forge/Atlas/Dais/Dossier) — LocalOps lives in the OS/pilot layer

## Governance
Every slice is a Brain work order (`docs/brain/workorders/active/WO-LOCALOPS-*`): execute → `brain review-diff` → `brain proof` → `brain commit-plan` → land path-limited → stop. WO-LOCALOPS-006 (in-shell UI) is R4 and requires explicit architect sign-off at dispatch. Done-definition for the chain = WO-LOCALOPS-008's runtime proof report with real command output.
