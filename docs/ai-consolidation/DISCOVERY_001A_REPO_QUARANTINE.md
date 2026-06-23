# WO-AI-DISCOVERY-001a — Repo Quarantine / Archive / Workspace AI Sweep

> **Goal:** TF-AI-OPS-001. **Status:** DISCOVERY ONLY — read-only inventory. Nothing here authorizes
> recovery, promotion, deletion, or wiring. Disposition decisions belong to the reconciliation matrix
> (WO-AI-DISCOVERY-002) and Brain-selected follow-on work orders.
> **Method:** read-only sweep of `QUARANTINE/**`, live-tree workspace tooling, and AI dot-dirs, followed
> by direct file verification of the load-bearing claims (the WO-000 lesson: recon summaries get
> corrected). Verification notes are inline.

## One-sentence truth

**The quarantine holds a few genuinely substantial AI assets (a cost-intelligence workspace, an
orchestration monorepo, privacy engines) buried in scaffolding and stale duplicates — but the most
operationally valuable item (the workspace companion) already lives, enhanced, in the live tree, and
the substantial quarantine assets carry cloud-dependence or unverified-runtime caveats.**

## Inventory (recon-grade unless marked verified)

| Asset | What it is | Operator value | Local? | Unique vs live tree? | Verdict |
|---|---|---|---|---|---|
| `tools/ai-workspace-companion` (live) | ~3.8 KLOC TS CLI agent: workspace monitoring, health checks, interactive commands + `context-pack-integration.ts` | High | ✅ core; optional cloud via env | **Live supersedes quarantine copy — VERIFIED** (context-pack refs present only in live) | **already-live; reference** |
| `QUARANTINE/.../ai-workspace-companion` | Older copy of the above, pre context-pack | Low (superseded) | ✅ | ❌ stale base of live version | **stale-duplicate** |
| `QUARANTINE/.../costforge-ai-workspace` | 42 MB full-stack (Express+Vite+React+Drizzle/pg): MCP-style agents (cost estimation, conversion, geospatial, compliance), Benton cost-matrix ingestion | Moderate-High (data/cost tooling), **AI layer cloud-only** | ⚠️ **VERIFIED: `@anthropic-ai/sdk` + `openai` deps, NO local-model fallback found** — AI fails the local gate as-is; app also needs Postgres | Yes — distinct cost-intelligence product | **candidate-with-caveat** (local value is the data/cost layer, not the AI layer) |
| `QUARANTINE/.../consciousness-isolated-workspace` | Monorepo (server/client/shared), claimed 344-LOC orchestrator + monitoring/quantum scripts | Unknown-Moderate | ⚠️ needs DB; **VERIFIED: hardcoded port fallback `\|\| 3004`** (violates port rules) | Same family as the quarantined ai-swarm | **needs deeper truth-gate** — "real orchestration" claim is recon-grade; spot-check could not confirm the orchestrator file at the cited path; treat as suspected in-memory synthetic until proven |
| `QUARANTINE/.../RAGPanel` | Python privacy engines: differential privacy (Laplace mechanism verified in recon), federated learning, homomorphic-encryption scaffolding | Moderate (county-data compliance) | ⚠️ Python + numpy/scipy; no deps manifest | Yes — no equivalent in live tree | **conditional candidate** |
| `QUARANTINE/.../workspace-explorer` | Node CLI/TUI monorepo navigator | Moderate (operator DX) | ✅ | Yes | **conditional candidate** |
| `QUARANTINE/.../AI_AGENT_CHECKPOINTS` / `AI_AGENT_DEVELOPMENT_ENVIRONMENT` / `AI_MONITORING` | Validation templates, training-protocol docs, Sept-2025 status JSON | Zero | — | duplicates/docs | **stale/vapor** |
| `QUARANTINE/agents/terrafusion-phd-systems-agent`, `ai-agent-framework` | Empty/stub agent scaffolds | Zero | — | ❌ | **vapor** |
| `QUARANTINE/.../SDK` | Single validation TS (incl. a hardcoded "50,000 agents" check — same fabricated-count family as the 1,008 debt) | Low | ✅ | guidance only | **archive-reference** |
| `.ai/` | 72 MD docs, claude-flow + MCP patterns | Moderate (agent guidance) | ✅ docs | unique guidance | **island (docs)** |
| `backend/ai-swarm/` | Live-tree dir of agent/coordinator subdirs, no root manifest | Unknown | ⚠️ | likely duplicate of os-platform ai-systems | **needs scan** (flagged for 002 reconciliation) |
| `QUARANTINE/.../workspace-optimization`, `workspaces`, `consciousness` | Unswept subtrees | Unknown | — | — | **needs scan** (recorded as discovery debt) |

## Verified corrections to the raw sweep

1. The sweep rated `costforge-ai-workspace` "Very High / local-runnable." File verification shows its AI
   layer depends on cloud SDKs **with no local-model fallback** — under the five-gate doctrine the AI
   portion is **non-local**; only the cost-data tooling is a local candidate.
2. The sweep called `consciousness-isolated-workspace` "functional orchestration." The orchestrator file
   could not be confirmed at the cited path during verification, and the server carries a hardcoded
   port fallback. Claim downgraded to **unverified**; same skepticism applied to the ai-swarm family in
   WO-000 applies here.
3. `ai-workspace-companion` live-supersedes-quarantine is **confirmed** — the quarantine copy is a stale
   base, not lost capability.
4. The sweep produced promote/delete recommendations; those are **out of discovery's mandate** and are
   recorded here only as inputs to WO-AI-DISCOVERY-002 reconciliation — no disposition is decided by
   this document.

## Security note

No hardcoded API **keys** found in the swept assets; cloud API access is key-gated via env vars
(`OPENAI_API_KEY` etc.).

> **Correction (post-review, P2):** an earlier version of this note claimed "no hardcoded endpoints."
> That was wrong. `.ai/core/AIModelHub.ts` **hardcodes provider endpoints** — Anthropic (`:166`),
> OpenAI (`:191`), Gemini (`:216`), Azure OpenAI (`:266`); only the local Ollama endpoint (`:241`) is
> env-gated (`TF_OLLAMA_PORT`). So `.ai/` carries real **endpoint debt**, and the reconciliation matrix
> (WO-AI-DISCOVERY-002) must NOT treat this area as cleared. The hardcoded-port and fabricated-count
> instances elsewhere remain honesty/ports debt, not key exposure.

## Authorization (governance trail)

Per repo `AGENTS.md`, work outside the Core Governance Surface "requires explicit authorization." These
`docs/ai-consolidation/**` discovery artifacts are explicitly authorized by the **TF-AI-OPS-001** goal
directive, which mandates the AI estate inventory and consolidation plan. This note records that
linkage so the artifacts are authorized, not guardrail-violating.

## Discovery debt (carried into 002)

- Unswept: `QUARANTINE/.../workspace-optimization`, `workspaces`, `consciousness`; `backend/ai-swarm/`.
- Unverified: consciousness-isolated-workspace runtime reality; RAGPanel dependency closure.

## Next in sequence

**WO-AI-DISCOVERY-001b** — GitHub `bsvalues` AI estate sweep (read-only). Then 001c (external drives
`D:`/`E:` — **not possible from this container**; must run where the drives are mounted), then the
WO-AI-DISCOVERY-002 reconciliation matrix.
