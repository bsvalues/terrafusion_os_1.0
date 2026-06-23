# WO-AI-DISCOVERY-002 — Unified AI Reconciliation Matrix

> **Goal:** TF-AI-OPS-001. **Status:** DISCOVERY SYNTHESIS — read-only. No disposition is executed here;
> this is the single reconciled view that Brain-selected consolidation work orders draw from.
> **Authorization:** TF-AI-OPS-001 directive (explicit, per `AGENTS.md`).
> **Folds in:** [`AI_ESTATE_INVENTORY.md`](AI_ESTATE_INVENTORY.md) (in-repo subsystems),
> [`DISCOVERY_001A_REPO_QUARANTINE.md`](DISCOVERY_001A_REPO_QUARANTINE.md) (quarantine/archive),
> [`DISCOVERY_001B_GITHUB_ESTATE.md`](DISCOVERY_001B_GITHUB_ESTATE.md) (GitHub estate, **file-verified
> Pass 2**), [`DISCOVERY_001C_EXTERNAL_DRIVES.md`](DISCOVERY_001C_EXTERNAL_DRIVES.md) (D:/E: drives,
> ran locally), plus the slices landed this goal (engine 001, trace bridge 002, health 003, canon 004a,
> **status-surface truthfulness 004b #960**).
> **Amended 2026-06-11 (local session):** the three gaps this matrix originally recorded — 001c drives,
> GitHub file-level verification, 004b deferral — are now closed; amendments below are marked inline.

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
| GitHub estate (130 repos) — **file-verified** | `github.com/bsvalues/*` | mostly Zero (re-rolls); **7 repos have real local-Ollama paths** | per-repo (see 001b Pass 2) | ❌ | ❌ | ❌ | **SPRAWL — quarantine; verified shortlist: NarratorAI Rust svc + ExemptionSeer + NarratorAI plugin (TerraFusionSync), hybrid-LLM PII router, MOCK/OLLAMA provider patterns, PACS-DataBridge classical-ML** |
| External drives D:/E: (AI estate) | local workstation drives | code: near-zero (one Ollama+ChromaDB RAG precedent at `E:\backend`, never populated) | **zero local LLM weights exist anywhere** | ❌ | ❌ | ❌ | **archaeology + vapor; `E:\TerraFusion_Master` = curated cold storage** |
| External drives D:/E: (data corpus) | PACS (51 GB + live MDFs + 2026 repl), ProVal (32 GB), Ascend, appraisal library (11.5 GB), prompt-doctrine corpus (24 GB) | **Very high** — grounding corpus for any future governed local-RAG WO | data, not code | via Sync only | n/a | n/a | **DATA-CORPUS — access via governed Sync lanes, never AI side-channels** |

## Highest-value follow-ups (Brain-select)

1. **Backend trace-unify** (Muse/AICommand/Pilot-explain → TerraTrace) — the .NET half of WO-002; needs
   lane expansion + dotnet (CI-only proof). Out-of-container.
2. ~~**WO-AI-CONSOLIDATION-004b** (fabricated status surfaces) — deferred at approval gate~~ —
   **DONE (#960, operator-approved)**: orphaned `DevOpsController` + elite-dashboard estate quarantined;
   `SwarmIntelligenceService` stub truthful (Agents=0, all swarm-activity claims zeroed incl.
   ProcessingTime); `SwarmStubHonestyTests` guards regression; `command-center.ps1` monitor reports
   truthfully unavailable. **Residual 004c debt found**: hardcoded-1008 constants in
   `AdvancedMonitoringService`, `AIOrchestrationService`, `AISwarm369MonitoringService`,
   `AnalyticsReportingService`, `Codex369AgentIntegrationService` + fabricated random-walk data in
   `RevenueDataService`/stub forecast paths + orphaned `ValuationOptimizationController`.
3. ~~**Verify the GitHub candidates** in a broader-scoped session~~ — **DONE (001b Pass 2,
   file-verified)**: `terrafusion-ai-platform` family = duplicate of main tree; `PACS-DataBridge` =
   real local classical-ML; `TerraAgent` = Ollama-capable; `terragroq` = template-fork vapor. Verified
   adoption shortlist for 005 recorded in 001b.
4. **WO-AI-CONSOLIDATION-005 pilot adoption** — smallest verified candidate (ExemptionSeer or the
   NarratorAI plugin, both `TerraFusionSync`, offline-by-design) onto the LocalOps provider seam.
   Prerequisite discovered by 001c: **no local model weights exist on any operator hardware** — model
   provisioning is an explicit, operator-approved step in the 006 envelope.

## Open blockers / gaps (honest)

- ~~**WO-AI-DISCOVERY-001c (external drives)** — BLOCKED from cloud container~~ — **DONE (#962, ran
   locally)**: zero local LLM weights on either drive; one Ollama+ChromaDB RAG precedent (`E:\backend`,
   never populated); Benton data corpus (PACS/ProVal/Ascend/Library) is the real asset; remaining 001c
   sub-gaps: 375 GB `TerraFusion.vhd` unmounted, large archives unopened, deep nests unwalked.
- ~~**GitHub file-level verification** — blocked by session repo scope~~ — **DONE (001b Pass 2)**.
- **`.ai/` endpoint debt** — hardcoded Anthropic/OpenAI/Gemini/Azure endpoints; not cleared.
- **.NET surfaces in cloud containers** — CI-only proof there; local sessions can run `dotnet test`
   (004b was locally proven).
- **Cockpit local-agent suite RED on main** — `not ok 158 - LocalOps → TerraTrace bridge` since #953
   merged; inherited by every PR; needs its own defect slice.
- **Operator security action (001c)** — plaintext credentials on D:/E: (`PACS.env.txt`,
   `bspass.env.txt`, Gemini key in filename, RapidAPI, Azure IDs) — rotate/relocate.

## Done-definition status (TF-AI-OPS-001)

| Done-definition item | State |
|---|---|
| Single canonical on-server AI path (LocalOps/TerraPilot) | ✅ established + extended (001/002/003) |
| Muse/diagnostics/sources/trace unified where intended, truthful where not | ✅ on the LocalOps path; ⚠️ .NET trace-unify pending |
| Fabricated AI status removed or marked unavailable | ✅ canon (004a) + runtime surfaces (**004b #960**); ⚠️ 004c residuals enumerated |
| Full AI estate inventory with verdicts | ✅ in-repo + quarantine + GitHub (file-verified) + drives |
| Discovery: repo quarantine + GitHub + drives | ✅ 001a, ✅ 001b (Pass 2 verified), ✅ 001c (#962) |
| Consolidation plan pulling usable-local onto the path | ✅ (CONSOLIDATION_WORKORDER_PLAN + this matrix + verified 005 shortlist) |
| Final runtime proof on merged main | ⏳ WO-AI-CONSOLIDATION-007 (pending 005/006 selection) |

**Discovery is COMPLETE** across all three theaters (repo quarantine, GitHub, external drives). The
reconciliation is stable; remaining work is execution: 004c honesty residuals, 005 consolidation,
006 envelope, the Cockpit-on-main defect, and 007 final proof.
