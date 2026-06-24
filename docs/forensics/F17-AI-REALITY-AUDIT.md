# F17 — AI Reality Audit

*Forensic lane (under recovery lock). Inventory of every AI-branded surface, claim vs
runtime, classified REAL / LATENT / MOCKED / FICTION.* Confidence: **high**.

## Classification rubric
- **REAL** — wired into live runtime AND produces genuine functional output.
- **LATENT** — real implementation, wired, but dormant / needs an external dependency (e.g. Ollama, Azure key).
- **MOCKED** — returns canned/hardcoded/stub responses (e.g. "lane unavailable", synthetic metrics).
- **FICTION** — claimed in docs/UI/endpoints with NO real implementation behind it.

## Counts (≈28 surfaces inventoried)
| Class | Count | Build on it? |
|---|---|---|
| REAL | 3 | ✅ yes |
| LATENT | ~5 | ✅ yes (after activating the dependency) |
| MOCKED | ~12 | ❌ no |
| FICTION | ~8 | ❌ no |

*(Minor: the subagent's exec-summary said REAL 2/LATENT 3; its own detail tables list 3 REAL
and ~5 LATENT — using the detail tables. Exact tally is non-material to the salvage split.)*

## REAL (genuine output)
| Surface | Path | Reality |
|---|---|---|
| `AICommandService` | `TerraFusion.AI/Services/AICommandService.cs:27` | reads real `AIAgents` table; counts are real (0 if unseeded); **not** wired to a live swarm |
| `AIEngineService` | `TerraFusion.AI/Services/AIEngineService.cs` | statistical analysis over real `PropertyAssessments` (not LLM) |
| `AzureOpenAIService` | `TerraFusion.Core/Services/AI/AzureOpenAIService.cs` | real Azure OpenAI HTTP client; REAL **iff** `AzureOpenAI:ApiKey`/`Endpoint` configured, else fails gracefully |

## LATENT (real, dormant — needs a dependency)
| Surface | Path | Needs |
|---|---|---|
| `MuseService` + `PilotController /explain` | `TerraFusion.AI/Services/MuseService.cs`, `Controllers/PilotController.cs` | a working `IMuseLlmClient` (Ollama running); no default HTTP impl found |
| `GPTController /explain` | `Controllers/GPTController.cs` | ~15 optional services; degrades if absent |
| `HybridConsciousnessManager`, `ConsciousnessEngineStub` | `Consciousness/Services/*` | session-backed; quantum lane always off |
| `GPTStudio` (frontend) | `components/gpt/GPTStudio.tsx` | wizard UI; backend call path unconfirmed |

## MOCKED (canned/hardcoded — do not build on)
`QuantumConsciousnessOrchestrator` (ActiveQuantumAgents=0), `MillionAgentService`
(InitializedAgents=0, Success=false), `ConsciousnessService` ("Unavailable"),
`AILayerMeshOrchestrator` (Success=false), `AISwarmOrchestrator` ("UNAVAILABLE"),
`CostForgeAIService` (synthetic metrics, hardcoded `_quantumFactor=949`),
`UltimateEliteMonitoringService`, `PredictiveImpactService`, `EliteAIDashboard`
(UI-only; **honestly discloses** "AI actions require a governed backend/Pilot path"). Each
Consciousness stub logs "governed … lane unavailable; compatibility surface only".

## FICTION (claimed, no implementation)
- `EnterpriseAIAgentCoordinator` — **"50,000+ AI agents across 39 counties"**: 39-county list
  hardcoded; no agent registry; 30s timer over an empty dict. `EnterpriseAIAgentCoordinator.cs:13`.
- `AIAgentMonitoringDashboard` — **honestly discloses** "no governed agent inventory… counts intentionally suppressed".
- `QuantumNav` / `AISwarmDashboard` — empty state, no real fetch.
- **"1,008 agents" / "50,000 agents"** — the live-code constants are gone/quarantined; both
  numbers now live only in **QUARANTINE artifacts** (`AI_SWARM_TRANSCENDENT_VALIDATION.json`,
  `Phase34_…Report.json`), not executed.

## Honesty nuance (important, positive)
Several MOCKED/FICTION **frontend** surfaces now **explicitly disclose** they are not backed by
a governed runtime (suppressed counts, "requires governed backend"). That is good-faith
honesty (aligns with the ui-honesty discipline) — they are *non-functional*, not *deceptive*.
The remaining deception risk is in **docs/canon/older endpoints**, not these UI surfaces.

## Binding rule (F17)
**No AI-touched branch may receive a final salvage recommendation until the underlying AI
surface is reality-classified here.** Mapping for R11:
- Branch depends on **REAL/LATENT** surface (Muse/Pilot/LocalOps, AzureOpenAI, AICommand/AIEngine, GPT) → **salvage-eligible** (subject to R11's other fences).
- Branch depends on **MOCKED/FICTION** surface (consciousness/quantum/million-agent/50k, CostForge metrics, elite-dashboard) → **archaeology** (do not build on); honesty-correction branches are the exception (they *remove* the fiction → salvage-eligible as truth work).

## Net
The AI estate is **mostly MOCKED/FICTION**, but a **thin REAL/LATENT spine exists**
(DB-grounded stats + a wireable local/Azure LLM explain path). This matches and sharpens
Lanes 6/7: the swarm/consciousness narrative is not real; the salvageable AI is small,
grounded, and honest.
