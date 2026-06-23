# AI Consolidation Doctrine

> **Work Order:** WO-AI-CONSOLIDATION-000. **Status:** PLANNING ONLY — the constitution for this lane.
> The problem this doctrine solves: TerraFusion has ambitious AI architecture but the capabilities live
> in documents, stubs, and repo islands rather than in the one governed runtime path an operator will
> actually depend on when alone on the Benton server.

## The thesis

> **The next useful move is not "build more AI." It is: take the few AI pieces that are already real and
> locally runnable, and force them onto one governed on-server execution path — TerraPilot for the
> surface, TerraTrace for the audit spine, the LocalOps doctrine for the guardrails — and quarantine
> everything else honestly.**

A component does not become operational support by existing. It becomes operational support by passing
the admission test below and being runtime-proven on that path.

## The admission test (five gates — all required)

No subsystem joins the governed on-server path until it passes **all five**:

1. **Operator value** — it helps a real Benton-server job (diagnose, explain, recover). A technically-real
   component with Zero operator value is not a consolidation candidate, however well-built.
2. **Local-runnable** — runs offline/loopback on a county server. Cloud-key / internet dependence is an
   automatic fail for the on-server path (the component may still exist, marked **non-local**).
3. **Wired into the governed path** — reachable from a single canonical entrypoint, not a side server or
   an unreferenced island.
4. **TerraPilot / TerraTrace / approval-compliant** — acts through the copilot surface, emits to the
   append-only trace spine, redacts PII, and gates every mutation behind human approval.
5. **Runtime-proven** — booted, health-checked, queried, and observed under the real operating profile —
   not "documented," not "implemented somewhere." Proven the way the LocalOps chain (WO-001…008) was.

## Rules

- **One spine, one trace.** The LocalOps/TerraPilot path is the spine; **TerraTrace** is the single
  append-only audit spine. A second audit ledger (e.g. AuditLogs) is debt to be unified, not a parallel
  truth.
- **Local-first, no silent cloud.** Consolidated AI must answer locally or honestly report unavailable —
  never a silent cloud fallback. (Mirrors LocalOps invariant I1.)
- **Read-only by default; mutation is human-approved.** Diagnose → propose → human approves → act.
  Nothing above read-only executes without confirmation + reason. (Mirrors I2/I5.)
- **Quarantine, don't delete.** Islands, stubs, and cloud-only components are **labeled non-operational**
  and left in place; they are not wired into the governed path until they individually pass the five gates.
- **No claim beyond proof.** No doc, status endpoint, commit, or PR may assert a capability (agent counts,
  "production swarm," compliance) beyond what is runtime-proven at the time of the claim. Existing
  over-claims (the "1,008 agents" magic number) are honesty debt to be corrected, not preserved.
- **No new dependencies for consolidation.** Pulling a real local piece onto the path must not add cloud
  SDKs, Redis, TensorFlow, or external services. If it can't run without them, it is non-local.

## Quarantine taxonomy

| Label | Meaning | Disposition |
|-------|---------|-------------|
| **usable** | passes all five gates (or needs only path-wiring) | consolidation candidate |
| **needs-work** | real + local but missing a gate (e.g. dead control plane) | fix the gate or scope down to its read-only part |
| **island** | real code, off the governed path, hard external deps | quarantine; do not wire |
| **vapor** | stub / DTO-only / canned / demo; no real runtime behavior | quarantine + relabel; correct any claim it backs |
| **non-local** | real but requires cloud keys/internet | mark non-Benton-runnable; never on the on-server path |

## What "done" looks like for a consolidation slice

Identical to the LocalOps bar: a single governed entrypoint runs it locally, it emits TerraTrace events,
it refuses external calls / unapproved mutations, and a runtime proof (e.g. `node --test` harness or an
equivalent) demonstrates the invariants offline. Until that exists, the capability is planned, not proven.
