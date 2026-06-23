# TerraFusion AI Estate — Honest Inventory (recon-hardened)

> **Work Order:** WO-AI-CONSOLIDATION-000 — AI Estate Consolidation Planning Envelope
> **Status:** PLANNING ONLY. This is an inventory and a plan, not an implementation.
> **Method:** two read-only reconnaissance sweeps (backend/.NET + os-platform/Node), then
> **direct file:line verification** of every load-bearing and damning cell. Subagent summaries were
> treated as evidence, not gospel — two were corrected (see "Recon corrections").

## Single-sentence truth

**TerraFusion AI is partially real but fragmented: one governed local spine works, a handful of
local-default services are adoptable, and most of the "swarm/consciousness" estate is island, stub,
or vapor — so only a subset is locally runnable _and_ governed, and the "1,008 agents in production"
claim is not backed by runnable code.**

## How to read this

Each subsystem is scored against five lenses. The fifth — **operator value** — is the guard against
overrating a technically-real component that does not help a Benton operator alone on the server.

1. **Operator value** — what concrete on-server job it helps with (High / Moderate / Low / Zero).
2. **Local-runnable?** — runs offline/loopback on a county server (no cloud keys, no internet).
3. **Wired into the governed path?** — reachable from a real, governed runtime entrypoint.
4. **Pilot/Trace/approval?** — acts through TerraPilot, emits to TerraTrace, gates mutations.
5. **Runtime-proven?** — actually booted/queried under test, not just "documented/implemented."

Verdict: **usable** / **needs-work** / **island** / **vapor** / **non-local**.

## Per-subsystem matrix

| Subsystem | Location (evidence) | Operator value | Local? | Wired? | Pilot/Trace/approval? | Proven? | Verdict |
|---|---|---|---|---|---|---|---|
| **LocalOps spine** | `os-platform/core/pilot/local-agent/**` (localOps* + policy/redact/eventLog/trace) | **High** — read-only diagnose + grounded answers + audit; the copilot | ✅ ollama loopback; remote gated off | ✅ CLI + in-shell panel | ✅ TerraTrace + policy + read-only + approval | ✅ WO-001…008 (`os-platform/core/tests/local-agent-localops-*.test.mjs`) | **USABLE — the spine** |
| **MuseService** | `backend/src/TerraFusion.AI/Services/MuseService.cs`; default Ollama at `Program.cs:1441`, `MuseLlmOptions.cs:36` (`localhost:11434/v1`) | **High (latent)** — the real local LLM brain | ✅ "data never leaves the building" | ✅ DI + `PilotController`/`GPTController` | ⚠️ AuditLogs, **not** TerraTrace; no approval gate | ✅ `MuseTruthGateTests.cs` (skips when Ollama down) | **USABLE → consolidate** |
| **Explain (Pilot path)** | `PilotController.cs:46` `POST /explain` → MuseService (`MuseService.cs:253` builds `ExplainSource` from statutes) | **Moderate-High** — "explain this" locally, statute-grounded, on the Pilot surface | ✅ via Muse local | ✅ on TerraPilot controller | ⚠️ via Muse (AuditLogs) | ⚠️ endpoint tests exist (`ExplainEndpointTests`) | **USABLE → consolidate** |
| **AICommandService** | `backend/src/TerraFusion.AI/Services/AICommandService.cs` | **Low-Moderate** — commands AIAgent **DB rows** + audit (no live agents) | ✅ DB-local | ✅ DI + controller | ⚠️ AuditLogs spine, not TerraTrace | ✅ integration tests | **USABLE → trace-unify** |
| **GPT config / orchestration / token-cost** | `backend/src/TerraFusion.AI/Services/GPT*Service.cs` | **Low** — cost/token ledger, not survival ops | ✅ local ledger | ✅ `GPTController` | ⚠️ audited, no approval | ✅ tests | **USABLE (governance), low op-value** |
| **SystemGPT advisory** (Atlas/Health/Forecast) | `backend/src/TerraFusion.AI/Services/SystemGpt*.cs`; bridge POSTs to a configured `SwarmControlPlaneUrl` (`SystemGptSwarmBridgeService.cs:177`) with **no in-repo control plane** | **Moderate** — read-only health/forecast _could_ feed diagnostics | ✅ local logic | ✅ controllers | ❌ advisory; swarm-action bridge is dead | ⚠️ bridge mocked in tests | **NEEDS-WORK** |
| **Explain (GPTController path)** | `GPTController.cs:1929` `POST /explain` returns **hardcoded** `ExplainSourceAttributionDto` per surface (`:1995` GPTStudio, `:2020` RAGTrace, `:2045` PropertyCard) | **Low** — canned attributions | ✅ (canned) | ✅ | ❌ | ⚠️ | **VAPOR (canned)** |
| OpenAI/Azure embeddings, claude/openai adapters | `OpenAIEmbeddingService.cs`, `AzureOpenAIService.cs`; `claudeAdapter.ts`/`openaiAdapter.ts` (remote-gated) | **Zero on isolated server** — real but can't run offline | ❌ keys+internet | ✅ | ⚠️ | ⚠️ mocked | **NON-LOCAL (real, not fake)** |
| **supreme-commander** | `os-platform/ai-systems/supreme-commander/` — deps `ioredis`, `openai`, `python-shell` | **Zero now** | ❌ Redis+OpenAI+Python | ❌ island (own server) | ❌ | ❌ no tests | **ISLAND** |
| **ai-swarm** | `os-platform/ai-systems/ai-systems/ai-swarm/SwarmOrchestrator.ts` (2 coord + 8 + 147 = **157**); `QuantumSwarmOrchestrator.ts:169` registers **898** | **Zero now** — neither is "1,008 production"; in-memory object loops | ❌ Redis+TensorFlow | ❌ separate CLI | ❌ | ❌ `expect(true).toBe(true)` stub tests | **ISLAND/needs-work** |
| **Consciousness / Quantum / Million-agent / Mesh (.NET)** | `backend/src/TerraFusion.Consciousness/Services/*` — explicit "lane unavailable" constants (`QuantumConsciousnessOrchestrator.cs:15`, `MillionAgentService.cs`, `AILayerMeshOrchestrator.cs:19`, `ConsciousnessService.cs:15`) | **Zero** — registered stubs returning unavailable/0 | ⚠️ runs (no-op) | ✅ registered (compat surface) | ❌ | ❌ init skipped | **VAPOR** |
| **ExplainGPT models / consciousness-\* / quantum-coordinator** | `ExplainModels.cs` (DTOs); `os-platform/ai-systems/.../consciousness-*`, `ai-agent-quantum-coordinator` (`expect(true)` tests) | **Zero** — DTOs / WebGL demo / scaffold | ❌ | ❌ | ❌ | ❌ | **VAPOR** |
| **elite-dashboard** | `os-platform/elite-dashboard-server.js:26,35` `agentCount: 1008`, `currentQuantumFactor: 1008 + Math.random()*192` | **Zero** — fabricated metrics | n/a | ❌ | ❌ | ❌ | **VAPOR (fake metrics)** |

## The "1,008 agents" honesty debt (verified)

"1,008" is not a runtime count — it is a hardcoded magic number repeated across the estate while the
actual swarm services report "lane unavailable":

- A **status endpoint** asserts it: `backend/Controllers/DevOpsController.cs:84` → `ai_swarm = "1008_agents_ready"`.
- A file literally named **`MissingServiceStubs.cs:64,94`** → `Agents = 1008`, `ActiveAgents = 1008`.
- `EnterpriseAIAgentCoordinator.cs:239` → `AgentCount = 1008, // Fibonacci sequence` (1008 is not Fibonacci).
- `Codex369AgentIntegrationService.cs:51` → `TOTAL_AGENTS = 1008`; `CostForgeAIService.cs:414,477`.
- The **canon** repeats it 5× (`CLAUDE.md:47,83,208,418,499`, incl. "DO NOT MODIFY").

No file boots and counts 1,008 live agents. This claim must be corrected before any external-facing
statement (see the plan's honest-status sweep).

## Consolidation shortlist (pull onto the LocalOps / TerraPilot path)

1. **Connect the two TerraPilots.** The backend `PilotController /explain` already answers locally via
   **MuseService** (Ollama); the os-platform **in-shell LocalOps panel has no live engine**. Wire Muse's
   local path behind the LocalOps provider abstraction so the panel actually answers. _Highest operator value._
2. **Trace unification.** Emit AICommandService / Muse / Pilot-explain activity to **TerraTrace** (one
   append-only spine, not AuditLogs-vs-TerraTrace), and gate any mutation behind the LocalOps approval gate.
3. **SystemGPT read-only health/forecast → LocalOps diagnostics** (read-only only; leave the dead swarm
   bridge out). **Realized by WO-AI-CONSOLIDATION-003:** the `health.summary` LocalOps diagnostic brings
   SystemGPT's read-only Herald health-roll-up pattern onto the Node diagnostics path over local truthful
   signals; the swarm-dependent forecast is shown unavailable, never inferred. (The .NET
   `SystemGptHealthEvaluator` is not called — the diagnostics seam is no-network by invariant.)

## Quarantine list (label non-operational; do **not** wire)

- **Vapor:** Consciousness/Quantum/Million-agent/Mesh (.NET stubs), ExplainGPT DTOs, GPTController canned
  explain, consciousness-\*, quantum-coordinator, elite-dashboard fabricated metrics.
- **Island:** supreme-commander, ai-swarm, QuantumSwarmOrchestrator (Redis/TensorFlow/OpenAI/Python).
- **Non-local:** OpenAI/Azure/embedding/claude paths — real, but mark **non-Benton-runnable**, not fake.
- **Honesty debt:** the "1,008 agents" claim across canon + status surfaces.

## Recon corrections (subagent summaries that file-verification overturned)

- **ExplainGPT is not DTO-only vapor.** A real `PilotController POST /explain` is backed by MuseService
  (local, statute-grounded). The vapor part is the _separate_ `GPTController /explain` canned-attribution path.
- **ai-swarm has two orchestrators** (157 and 898), not a single "157 vs 1,008" gap; neither is runtime-proven.
- **One subagent misattributed a "1,008-agent swarm claim" to WO-LOCALOPS-008.** WO-008 makes no swarm
  claim; it proves the LocalOps invariants I1–I8. Recorded so the error does not enter canon.

> **Verification status:** load-bearing and damning cells are file:line-verified above. Cells marked ⚠️
> ("mocked", "tests exist") are recon-grade and are flagged for confirmation in the first execution slice.
