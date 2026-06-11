# WO-AI-DISCOVERY-002 — Unified AI Reconciliation Matrix

> **Goal:** TF-AI-OPS-001. **Status:** DISCOVERY SYNTHESIS — read-only. No disposition is executed here;
> this is the single reconciled view that Brain-selected consolidation work orders draw from.
> **Authorization:** TF-AI-OPS-001 directive (explicit, per `AGENTS.md`).
> **Folds in:** [`AI_ESTATE_INVENTORY.md`](AI_ESTATE_INVENTORY.md) (in-repo subsystems),
> [`DISCOVERY_001A_REPO_QUARANTINE.md`](DISCOVERY_001A_REPO_QUARANTINE.md) (quarantine/archive),
> [`DISCOVERY_001B_GITHUB_ESTATE.md`](DISCOVERY_001B_GITHUB_ESTATE.md) (GitHub estate), plus the slices
> landed this goal (engine 001, trace bridge 002, health 003, canon 004a).

## One-sentence truth

**Across the in-repo tree, the quarantine, and 130 GitHub repos, exactly one AI path is local +
governed + runtime-proven — the LocalOps/TerraPilot operator path — and everything else is island,
demo, cloud-only, unverified, or out of reach; consolidation = keep pulling proven-local pieces onto
that one path and quarantine the rest.**

## Five-gate matrix (operator value · local · wired/governed · Pilot+Trace+approval · proven)

| Subsystem | Location | Operator value | Local | Wired+governed | Pilot/Trace/approval | Proven | Verdict |
|---|---|---|---|---|---|---|---|
| **LocalOps spine** (engine, provider, KB, diagnostics, trace, **TerraTrace bridge**, **health.summary**) | `os-platform/core/pilot/local-agent/**` | **High** | ✅ | ✅ | ✅ (001/002/003 landed) | ✅ offline harnesses | **USABLE — the path** |
| MuseService (local-Ollama default) | `backend/...AI/Services/MuseService.cs` | High (latent) | ✅ | ✅ | ⚠️ AuditLogs not Trace | ✅ tests | **adopt → next backend slice** |
| AICommandService / GPT cost+orchestration | `backend/...AI/Services` | Low-Mod | ✅ | ✅ | ⚠️ AuditLogs | ✅ | **adopt → trace-unify (.NET seam)** |
| SystemGPT advisory (health pattern) | `backend/...AI/Services/SystemGpt*` | Mod | ✅ logic | ✅ | ❌ dead `:9000` bridge | ⚠️ | **read-only pattern adopted in 003; bridge stays out** |
| Cloud LLM/embeddings (OpenAI/Azure/Claude/Gemini) | backend + `.ai/core/AIModelHub.ts` (**hardcoded endpoints**) | Zero on isolated server | ❌ | ✅ | ⚠️ | ⚠️ | **NON-LOCAL** + endpoint debt (`.ai/`) |
| Quantum/Million-agent/AISwarm/Mesh (.NET) | `backend/.../Consciousness` | Zero | ⚠️ no-op | registered | ❌ | ❌ "lane unavailable" | **VAPOR** |
| elite-dashboard (`agentCount:1008`) / DevOpsController `1008_agents_ready` / MissingServiceStubs | os-platform root + `backend/**` | Zero (fabricated) | n/a | side server | ❌ | ❌ | **VAPOR — 004b (deferred, approval-gated)** |
| os-platform `ai-systems` (supreme-commander, ai-swarm 157/898) | `os-platform/ai-systems/**` | Zero now | ❌ Redis/TF/OpenAI | ❌ island | ❌ | ❌ stub tests | **ISLAND** |
| `costforge-ai-workspace` (quarantine) | `QUARANTINE/.../costforge-ai-workspace` | Mod-High data layer | ⚠️ AI cloud-only, no local fallback | ❌ | ❌ | ❌ | **candidate (data layer only); AI non-local** |
| `consciousness-isolated-workspace` (quarantine) | `QUARANTINE/...` | Unknown | ⚠️ DB + port `\|\|3004` | ❌ | ❌ | ❌ unverified | **needs truth-gate** |
| RAGPanel / workspace-explorer / ai-workspace-companion | `QUARANTINE/...` + `tools/ai-workspace-companion` (live, superseding) | Low-Mod | partial | ❌ | ❌ | ❌ | **conditional / live-supersedes** |
| GitHub estate (130 repos) | `github.com/bsvalues/*` | mostly Zero (re-rolls) | unknown | ❌ | ❌ | ❌ | **SPRAWL — quarantine; few unverified candidates** |

## Highest-value follow-ups (Brain-select)

1. **Backend trace-unify** (Muse/AICommand/Pilot-explain → TerraTrace) — the .NET half of WO-002; needs
   lane expansion + dotnet (CI-only proof). Out-of-container.
2. **WO-AI-CONSOLIDATION-004b** (fabricated status surfaces) — **deferred at approval gate**: targets are
   `backend/**` + os-platform-root, out of allowed lanes, product-behavior change. Needs human approval.
3. **Verify the GitHub candidates** (`terrafusion-ai-platform` family, `PACS-DataBridge`, `TerraAgent`,
   `terragroq`) in a broader-scoped session — 001b could not read their files.

## Open blockers / gaps (honest)

- **WO-AI-DISCOVERY-001c (external drives `D:`/`E:`)** — **BLOCKED: impossible from this cloud
   container** (no drives mounted). Must run where the drives are. Folded here so the discovery set is
   not silently incomplete.
- **GitHub file-level verification** — blocked by session repo scope (`terrafusion_os_1.0` only).
- **`.ai/` endpoint debt** — hardcoded Anthropic/OpenAI/Gemini/Azure endpoints; not cleared.
- **.NET surfaces** — unprovable in this container (no dotnet); any backend slice is CI-only proof.

## Done-definition status (TF-AI-OPS-001)

| Done-definition item | State |
|---|---|
| Single canonical on-server AI path (LocalOps/TerraPilot) | ✅ established + extended (001/002/003) |
| Muse/diagnostics/sources/trace unified where intended, truthful where not | ✅ on the LocalOps path; ⚠️ .NET trace-unify pending |
| Fabricated AI status removed or marked unavailable | ⚠️ canon corrected (004a); **runtime surfaces pending 004b** |
| Full AI estate inventory with verdicts | ✅ in-repo + quarantine + GitHub; ⚠️ drives pending (001c) |
| Discovery: repo quarantine + GitHub + drives | ✅ 001a, ✅ 001b, ❌ 001c (blocked) |
| Consolidation plan pulling usable-local onto the path | ✅ (CONSOLIDATION_WORKORDER_PLAN + this matrix) |
| Final runtime proof on merged main | ⏳ WO-AI-CONSOLIDATION-007 (pending the above) |

Discovery is **complete except 001c** (true blocker: drives not present). The reconciliation is stable
enough to drive the remaining execution slices.
