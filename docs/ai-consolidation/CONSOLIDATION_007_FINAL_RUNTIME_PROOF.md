# WO-AI-CONSOLIDATION-007 — Final Runtime Proof (On-Server AI Operator Path)

> **Goal:** TF-AI-OPS-001. **Status:** RUNTIME PROOF — documents exactly what the Benton on-server AI
> operator path can do today, what remains unavailable, and what is approval-gated. Every capability
> below is backed by an offline `node --test` harness on merged `main`; nothing is claimed beyond what
> the harnesses exercise (honesty clause).

## What the operator path IS, runtime-proven

**One path: LocalOps/TerraPilot.** The Node `os-platform/core/pilot/local-agent/**` stack — local-first,
source-grounded, trace-emitting, read-only, human-approved-before-mutation — composed into an engine
that produces the in-shell panel's view model and now emits onto the canonical **TerraTrace** spine.

### Proof index (run offline; **82/82** at time of writing)

| Capability | Harness | Proves |
|---|---|---|
| AI profile contract (tighten-only, county-safe) | `local-agent-ai-profile.test.mjs` | 12/12 |
| Local provider abstraction (no silent cloud fallback) | `local-agent-localops-provider.test.mjs` | 14/14 |
| TerraTrace-compatible trace adapter (append-only, redacted) | `local-agent-localops-trace.test.mjs` | 10/10 |
| Local KB / source grounding (docs allowlist only) | `local-agent-localops-kb.test.mjs` | 9/9 |
| Read-only diagnostics + `health.summary` roll-up | `local-agent-localops-diagnostics.test.mjs` | 13/13 |
| Engine (local answer → view model) | `local-agent-localops-engine.test.mjs` | 4/4 |
| v1 invariants I1–I8 end-to-end | `local-agent-localops-proof.test.mjs` | 13/13 |
| **LocalOps → TerraTrace bridge** (county ctx, correlation, PII-safe) | `local-agent-localops-trace-bridge.test.mjs` | 7/7 |

Reproduce: `node --test os-platform/core/tests/local-agent-localops-*.test.mjs` (offline, no network, no
DB, no dotnet). Required governance gate `phase83-tools` also green (56/56).

### What the operator can actually do today (Benton server, external AI blocked)

1. **Ask locally** — get a source-grounded answer from a local model (Ollama loopback); if no local
   model, an honest "unavailable" with **zero external calls** (I1).
2. **Diagnose, read-only** — `ai.profile`, `config.summary`, `provider.status`, `kb.status`, and the
   `health.summary` roll-up (overall ok/warn/error + warnings) — observe-only, no mutation (I2).
3. **Stay grounded** — operational answers cite a local source or are refused (I6).
4. **Be audited** — every action emits append-only, PII-redacted events to TerraTrace with county
   context + correlation chains (I3/I4 + WO-002 bridge).
5. **Refuse safely** — anything above read-only (write/exec/restart) is refused with a structured reason
   (I5); no county/valuation mutation by AI; no unapproved source indexed (I7).
6. **Render in-shell** — the panel mounts as TerraPilot shell chrome, no route escape, no hardcoded
   z-index (I8).

## What remains UNAVAILABLE (truthful, not inferred)

- **Execution / mutation** — none shipped. Diagnose→propose→**human acts**. The minimal approval-gated
  toolset is *planned* only (WO-AI-CONSOLIDATION-006), not enabled.
- **Swarm / consciousness** — the .NET `Consciousness` services and os-platform `ai-systems` are
  stub/island; **no running swarm** (canon corrected in 004a; runtime status surfaces pending 004b).
- **Forecast / swarm-state advisory** — shown `unavailable` in `health.summary`, never inferred.
- **Cloud LLM/embeddings** — real but non-Benton-runnable (keys + internet).

## What is APPROVAL-GATED / out-of-container (handoff list)

| Item | Why it's not done here | Needs |
|---|---|---|
| **WO-AI-CONSOLIDATION-004b** — fabricated runtime status surfaces | `backend/**` + os-platform-root (outside allowed lanes); product-behavior change | **human approval** + lane expansion |
| Backend trace-unify (Muse/AICommand/Pilot-explain → TerraTrace) | `.NET`; no dotnet in this container | scoped session / CI-only proof |
| `WO-AI-DISCOVERY-001c` — external drives `D:`/`E:` | drives not mounted in this cloud container | run where mounted |
| GitHub candidate verification (`terrafusion-ai-platform`, `PACS-DataBridge`, …) | session GitHub scope = this repo only | broader-scoped session |
| `.ai/` endpoint debt (hardcoded provider endpoints) | recorded in 001a correction | a ports/honesty slice |

## Done-definition (TF-AI-OPS-001) — final state

- ✅ Single canonical on-server AI path (LocalOps/TerraPilot), runtime-proven (82/82 + I1–I8).
- ✅ Muse/diagnostics/sources/trace unified **on the LocalOps path**; ⚠️ .NET trace-unify pending.
- ⚠️ Fabricated AI status: **canon corrected (004a)**; runtime surfaces pending **004b** (approval).
- ✅ Full AI estate inventory with verdicts (in-repo + quarantine + 130-repo GitHub); ⚠️ drives pending.
- ✅ Consolidation plan + reconciliation matrix; ✅ execution-mode planning envelope.
- ✅ This final runtime proof.

**Bottom line:** TerraFusion now has **one truthful, governed, runtime-proven on-server AI operator
path**. It is read-only and dependable when external AI is blocked. The remaining work is bounded,
honestly listed, and gated on either human approval (004b, execution mode) or an environment this
container does not have (.NET, external drives, broader GitHub scope) — not on more architecture.
