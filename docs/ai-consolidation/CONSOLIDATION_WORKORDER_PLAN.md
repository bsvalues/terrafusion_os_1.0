# AI Consolidation — Work Order Plan

> **Work Order:** WO-AI-CONSOLIDATION-000. **Status:** PLANNING ONLY. Each entry below is a _proposed_
> execution slice; none is approved or implemented by this envelope. Every slice is one branch / one PR,
> built → verified → draft → STOP → human merge, exactly like the LocalOps chain.

## Sequencing

```
000  AI Estate Consolidation Planning Envelope (this docs slice)
  ├─ 004a Honest-status sweep — canon claim correction (docs-only, do first; unblocks honest claims)
  ├─ 001  Muse local-Ollama → LocalOps provider (highest operator value)
  │     └─ 002 Trace unification (AICommandService / Muse / Pilot-explain → TerraTrace)
  │            └─ 003 SystemGPT read-only health/forecast → LocalOps diagnostics
  └─ 004b Status-surface truthfulness (DevOpsController / stubs — code; after 004a)
```

`004a` is docs-only and should land first so no further work is built on a false "1,008 agents" claim.
`001` is the highest-operator-value runtime slice. `002`/`003` build on it. `004b` corrects the fake
status surfaces and is sequenced after `004a` because it changes product behavior.

---

## WO-AI-CONSOLIDATION-001 — Muse local-Ollama behind the LocalOps provider

- **Goal:** Connect the two TerraPilots. The backend `PilotController /explain` already answers locally
  via MuseService (Ollama); the in-shell LocalOps panel has no live engine. Make the panel answer
  locally by routing through a LocalOps-governed provider seam — no silent cloud, source-grounded,
  trace-emitting, read-only.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**`, the in-shell adapter under
  `frontend/apps/os-shell/src/components/localops/**` / its store, tests. A read-only bridge to the
  backend Muse local endpoint **only if** loopback-enforced.
- **Forbidden:** any cloud provider; enabling external calls; bypassing the LocalOps approval/trace
  gates; new dependencies.
- **Risk class:** R2 (runtime wiring + a live provider on the operator path).
- **Acceptance:** with a local model present the panel returns a grounded answer and emits
  `localops.ai.requested/responded`; with no local model it reports unavailable and makes **zero**
  external calls; every answer is read-only.
- **Proof:** a `node --test` harness extending the WO-008 pattern (S1 no-egress, I3 trace, I6 grounding)
  against the live provider; offline.
- **Stop condition:** any path reaches the network on the unavailable case → stop.
- **Non-goals:** no chat memory, no tools-above-read-only, no cloud.

## WO-AI-CONSOLIDATION-002 — Trace unification (one append-only spine)

- **Goal:** Collapse the dual audit reality (AuditLogs vs TerraTrace) for the adopted services. Emit
  AICommandService / Muse / Pilot-explain activity to **TerraTrace** with correlation + redaction, and
  gate any mutation behind the LocalOps approval gate.
- **Allowed paths:** the adopted backend services + the trace layer + tests. No change to unadopted
  subsystems.
- **Forbidden:** dropping existing AuditLogs without an equivalence proof; ungoverned mutation.
- **Risk class:** R2.
- **Acceptance:** each adopted action emits exactly one append-only TerraTrace event; PII is redacted
  (reuses the WO-SEC-LOCALOPS-001-hardened redactor invariants); mutations require confirmation + reason.
- **Proof:** trace-equivalence + PII-safety tests; offline.
- **Stop condition:** a mutation can execute without an approval record → stop.
- **Non-goals:** no new analytics; no schema rewrite.
- **Status — first cut REALIZED (thin seam):** `localOpsTraceBridge.ts` maps all eight `localops.*`
  events 1:1 onto the canonical TerraTrace union (`tool_invoked/completed/failed`,
  `permission_denied`, `approval_requested`) and the engine gained an optional composed `sink`, so the
  governed on-server AI operator path (engine asks, refusals, retrieval, diagnostics) now lands on a
  real `TraceService` with county context + correlation linkage — proven offline
  (`local-agent-localops-trace-bridge.test.mjs`). **Deferred honestly:** the .NET AuditLogs paths
  (AICommandService / Muse HTTP) — outside the agent entrypoint's allowed lanes and not provable in
  this container (no dotnet); they remain a separate, explicitly-approved backend slice.

- **Goal:** Surface the genuinely-real SystemGPT read-only health/forecast outputs as **read-only**
  LocalOps diagnostics, so the operator gets health insight on the governed path. Explicitly exclude the
  dead swarm-action bridge.
- **Allowed paths:** the LocalOps diagnostics seam + a read-only adapter + tests.
- **Forbidden:** wiring the `SwarmControlPlaneUrl` bridge; any swarm-action execution; mutation.
- **Risk class:** R1.
- **Acceptance:** new diagnostics are `readonly:true`, grounded, trace-emitting; the swarm-action bridge
  is not invoked.
- **Proof:** diagnostics tests (readonly + refusal of any action name).
- **Stop condition:** any non-read-only SystemGPT call appears → stop.
- **Non-goals:** no swarm revival; no control plane.

## WO-AI-CONSOLIDATION-004a — Honest-status sweep (canon claims, docs-only)

- **Goal:** Correct the "1,008 agents in production" claim and related over-claims in canon so no
  document asserts an operational swarm that does not run. Mark the swarm/consciousness estate as
  island/stub/vapor per the inventory.
- **Allowed paths:** `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/**` (claim text only).
- **Forbidden:** changing runtime behavior; deleting the subsystems.
- **Risk class:** R0 (docs) — but touches **canon**, so human-approved.
- **Acceptance:** every "1,008 / 1008 / production swarm" claim in canon is either removed or reframed
  as a posture target with the inventory verdict; no new claim exceeds proof.
- **Proof:** `grep` shows no remaining unqualified "1,008 production" assertion; docs review.
- **Stop condition:** a claim cannot be made truthful without a code change → defer that line to 004b.
- **Non-goals:** no code; no marketing rewrite beyond truthfulness.

## WO-AI-CONSOLIDATION-004b — Status-surface truthfulness (code)

- **Goal:** Make runtime status surfaces tell the truth. The fabricated agent counts on live surfaces
  (`DevOpsController.cs:84` `ai_swarm = "1008_agents_ready"`; `MissingServiceStubs.cs`; the
  `elite-dashboard` fake metrics) must report the real state (unavailable / actual count) like the
  consciousness stubs already do.
- **Allowed paths:** the named status surfaces + tests.
- **Forbidden:** inventing a new metric; faking a different number.
- **Risk class:** R2 (product-behavior change to a status surface — human-approved).
- **Acceptance:** status endpoints return the governed "unavailable"/real state, never a hardcoded
  1,008; a test asserts no fabricated count is emitted.
- **Stop condition:** a surface cannot report truthfully without reviving a stub → quarantine it instead.
- **Non-goals:** no swarm implementation; no dashboard redesign.

---

## Cross-cutting rules (every slice above)

- One branch / one PR; build → verify with real commands → draft PR → STOP → human merge.
- Local-first, no silent cloud; read-only default; mutation human-approved; TerraTrace append-only.
- No new dependencies. No claim beyond what the slice runtime-proves.
- Quarantined subsystems stay quarantined unless a slice explicitly, and with approval, brings one
  through all five admission gates.
