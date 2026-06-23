# TerraFusion AI Consolidation — Planning Envelope

> **Work Order:** WO-AI-CONSOLIDATION-000
> **Status:** PLANNING ONLY. Nothing in this directory is implemented. It is an honest inventory of the
> existing AI estate plus a governed plan to consolidate the _usable_ subset onto one on-server path.
> **Governance:** TerraFusion Brain/Cortex. The LocalOps chain (WO-LOCALOPS-001…008 +
> WO-SEC-LOCALOPS-001) is the worked example of "done right" this envelope generalizes from.

## Why this exists

TerraFusion has a large, ambitious AI architecture. Most of it lives in documents, stubs, and repo
islands rather than in the single governed runtime path an operator depends on when alone on the Benton
server. The right question is no longer "should we build more AI?" — it is **"which existing TerraFusion
AI pieces can become a real on-server agent I can actually depend on?"** This envelope answers that
honestly and proposes the bounded slices to act on it.

## One-sentence truth

**TerraFusion AI is partially real but fragmented: one governed local spine (LocalOps) works, a handful
of local-default services are adoptable, and most of the "swarm/consciousness" estate is island, stub,
or vapor — and the "1,008 agents in production" claim is not backed by runnable code.**

## Documents

| File | Purpose |
|------|---------|
| [`AI_ESTATE_INVENTORY.md`](AI_ESTATE_INVENTORY.md) | The honest, file:line-verified per-subsystem matrix — operator value + the four runtime gates + verdict, plus the consolidation shortlist, the quarantine list, and the "1,008 agents" honesty debt. |
| [`CONSOLIDATION_DOCTRINE.md`](CONSOLIDATION_DOCTRINE.md) | The constitution: the five-gate admission test, one-spine/one-trace rules, quarantine taxonomy, and what "done" means for a consolidation slice. |
| [`CONSOLIDATION_WORKORDER_PLAN.md`](CONSOLIDATION_WORKORDER_PLAN.md) | The decomposed execution slices (WO-AI-CONSOLIDATION-001…004b), each with goal / allowed / forbidden / risk / acceptance / proof / stop / non-goals. |

## The verdict in one breath

- **Usable (the spine):** LocalOps / local-agent stack — local, governed, runtime-proven.
- **Usable → consolidate:** MuseService (local Ollama default) and the Pilot `/explain` path it backs.
- **Usable → trace-unify:** AICommandService, GPT cost/orchestration (real + local, but on a second audit
  spine, no approval gate).
- **Needs-work:** SystemGPT advisory (read-only health is real; its swarm-action bridge is dead).
- **Island:** supreme-commander, ai-swarm / QuantumSwarmOrchestrator (Redis/TensorFlow/OpenAI/Python).
- **Vapor:** Consciousness/Quantum/Million-agent/Mesh (.NET stubs), ExplainGPT DTOs + GPTController canned
  explain, consciousness-\*, elite-dashboard fabricated metrics.
- **Non-local:** OpenAI/Azure/embedding/claude paths — real, but not Benton-runnable.

## Honesty clause

This envelope plans; it does not prove. No file here authorizes wiring, swarm revival, cloud calls, or a
runtime-readiness claim. A subsystem becomes operational support only by passing the five admission gates
and being runtime-proven on the governed path — the way the LocalOps chain was. The inventory's ⚠️ cells
are recon-grade and are flagged for confirmation in the first execution slice.
