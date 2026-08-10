# TerraFusion LocalOps

## Current Atlas configuration/auth boundary

TerraFusion can prove its intended Atlas configuration and authentication boundary without opening a
database or Redis connection:

```powershell
pnpm run localops:atlas-boundary
```

The command reads the committed production connection templates, primary runtime resolver, and
authentication registration, then reports the pinned approved Atlas endpoint, ports,
database/principal, and credential-reference names. It never reads credential values or produces a
resolved connection string. Source drift, disconnected resolver/authentication wiring, and missing
sources fail closed. The entrypoint has no subprocess, network, database, Redis, or migration client.

## Current repeatable Hermes lifecycle

Routine local proof no longer requires manually starting and stopping an SSH tunnel:

```powershell
pnpm run localops:hermes
```

The command owns one loopback-only SSH forward to the configured `hermes` alias, verifies the
Ollama health endpoint and `llama3.2:3b`, runs the existing read-only LocalOps proof, then terminates
the exact SSH child and verifies that its listener was released. It refuses a pre-existing listener
because that process is not owned by the lifecycle. Health, model, provider, interruption, or cleanup
failure returns a single non-success JSON result and a nonzero exit code.

Optional operator settings are `LOCALOPS_HERMES_TUNNEL_PORT`,
`LOCALOPS_HERMES_HEALTH_TIMEOUT_MS`, `LOCALOPS_OLLAMA_PROOF_TIMEOUT_MS`, and
`LOCALOPS_HERMES_CLEANUP_TIMEOUT_MS`. The SSH alias, model, and synthetic proof prompt are fixed to
the approved Hermes boundary. External calls, web, shell, and mutation remain explicitly disabled.

> **Work Order:** WO-LOCALOPS-000 — LocalOps Planning Envelope
> **Status:** ACTIVE. This directory preserves the original planning envelope and documents the
> incrementally delivered LocalOps runtime work orders.
> **Governance:** TerraFusion Brain/Cortex. One Brain, many packs. See root [`AGENTS.md`](../../AGENTS.md).

## What this is

This directory began as the **governed planning envelope** for **TerraPilot LocalOps Mode** and now
contains both that historical plan and the runbooks/evidence for implemented LocalOps work orders.
LocalOps is a local, county-boundary-safe AI operator that runs **inside the TerraFusion shell** so
the OS can help a Benton County operator when external AI tools are unavailable, blocked, or
prohibited.

The WO-LOCALOPS-000 documents remain planning artifacts. Sections that name a subsequently delivered
work order describe current implementation only where their linked code and evidence exist.

## Documents

| File | Purpose |
|------|---------|
| [`LOCALOPS_DOCTRINE.md`](LOCALOPS_DOCTRINE.md) | The non-negotiable rules. What LocalOps is, is not, and must never do. The constitution for this lane. |
| [`LOCALOPS_WORKORDER_PLAN.md`](LOCALOPS_WORKORDER_PLAN.md) | Decomposition into WO-LOCALOPS-001…008, each with goal / allowed / forbidden / risk class / acceptance / proof / stop condition / non-goals. |
| [`BENTON_SERVER_RUNBOOK.md`](BENTON_SERVER_RUNBOOK.md) | Hardened operator-facing survival runbook for Benton County server scenarios (read-only diagnose → human-approved act). R0 is wired to shipped LocalOps diagnostics; R1–R7 are operator-performed in v1. |
| [`BENTON_AI_PROFILE.md`](BENTON_AI_PROFILE.md) | The documented shape of the Benton AI profile (providers, boundaries, grounding, trace) that WO-LOCALOPS-001 will turn into a config contract. |
| [`BENTON_IT_QUESTIONS.md`](BENTON_IT_QUESTIONS.md) | Questions to answer with Benton County IT/security before any implementation begins. De-risks the whole sequence. |
| [`LOCALOPS_ACCEPTANCE_TEST.md`](LOCALOPS_ACCEPTANCE_TEST.md) | The v1 acceptance criteria and the proof scenarios every LocalOps WO must pass. |

## Doctrine in one breath

LocalOps v1 is **local-first, source-grounded, trace-emitting, read-only diagnostic, and
human-approved before any mutation.** No silent cloud fallback. No unrestricted shell. No autonomous
production repair. No property-record or valuation mutation by AI.

## Where this routes in the Brain

- Domain pack: [`brain/packs/localops/README.md`](../../brain/packs/localops/README.md)
- Acts through TerraPilot tools per [`brain/packs/gpt/README.md`](../../brain/packs/gpt/README.md)
- Emits to the trail per [`brain/packs/trace/README.md`](../../brain/packs/trace/README.md)
- Renders inside the shell per [`brain/packs/shell/README.md`](../../brain/packs/shell/README.md)
- Path routing: [`brain/router/path-router.yaml`](../../brain/router/path-router.yaml)
  (`docs/localops/**` is registered as an `R0` planning-docs route)

## In-shell LocalOps UI (WO-LOCALOPS-006)

`frontend/apps/os-shell/src/components/localops/LocalOpsPanel.tsx` is the in-shell TerraPilot LocalOps
surface — **shell chrome** (a fixed side panel like `CompanionPanel`), not a standalone app and not a
routable window. It is **presentational**: it renders a typed `LocalOpsViewModel` (profile + boundary
flags, provider-status card, read-only diagnostics, structured refusal card, source references /
honest no-source, trace events) across six sections — Ask, Explain, Diagnose, Runbook, Sources, Trace.
It holds only local UI state, performs **no** API calls, mutation, shell execution, or autonomous
actions, uses design tokens only (`hsl(var(--tf-*))`, leak-guard tested) and the shell z-index
authority (`Z.companionPanel`, never hardcoded).

## Mount + registration (WO-LOCALOPS-006.1)

LocalOps is now **mounted** in the live shell and **registered** as a governed OS feature:

- `frontend/apps/os-shell/src/components/localops/LocalOpsSurface.tsx` is the shell-chrome container
  that mounts `LocalOpsPanel` into `Desktop.tsx` and renders a right-edge pull-tab. Visibility and the
  view model live in `frontend/apps/os-shell/src/stores/localOpsStore.ts` (open/close/toggle/setData),
  mirroring the companion store. It is fixed shell chrome — **not** a routable window.
- `localops` is registered in `OS_FEATURES` (`suiteRegistry.ts`) **without a `route` or `homeMeta`**, so
  it stays out of the launcher, desktop icons, standalone-home derivation, and the React Router — there
  is **no Router / full-page escape**. `os-localops` is registered in the module registry, object-placement
  contract, and module-activation maps so the shell anti-drift contract sees a consistent feature.
- The os-localops window home (`pages/LocalOpsHome.tsx`) is a truthful redirect to the side panel, not a
  duplicate full-page surface.

## Live diagnostic adapter

The live engine→view-model adapter is now wired as an operator-triggered, read-only product journey:

- The in-shell Diagnose section sends one fixed synthetic diagnostic question through the existing
  authenticated LocalOps product endpoint. It does not accept free-form input.
- The request reuses the LocalOps engine, local KB, trace bridge, LocalOps provider, and Ollama adapter;
  it remains fixed to the explicitly configured Hermes SSH-tunnel boundary.
- Successful responses populate the existing `LocalOpsViewModel` with the local diagnostics, verified
  sources, trace events, and a source-grounded insight. The browser rejects an unsafe or malformed view
  model rather than rendering it.
- Provider, tunnel, runtime, or network failure produces a visible refusal and no insight. There is no
  cloud fallback, shell access, filesystem access, database access, or mutation path.
- The store retains its honest `disabled` default until the operator explicitly runs the diagnostic.

## Diagnostic-linked runbook guidance

The in-shell **Runbook** section now consumes the same authenticated LocalOps product endpoint as the
live diagnostic adapter. An operator can request one fixed synthetic guidance question; there is no
free-form prompt and no parallel provider or diagnostic path.

- A successful response must be grounded exclusively in
  [`BENTON_SERVER_RUNBOOK.md`](BENTON_SERVER_RUNBOOK.md). If that canonical source is absent, the
  journey fails closed and displays no guidance.
- Before inference, the journey retrieves only the bounded `R0 — Is LocalOps itself available?`
  section so the diagnostic, human-approved action, and escalation rule are all present in the
  model evidence context.
- The local model explains the documented R0 procedure and how to interpret the latest diagnostic
  cards, identifies the read-only diagnostic, proposes the human-performed next step, and states when
  to escalate. Current status remains the responsibility of the diagnostic cards; the model cannot
  claim it, execute, apply, restart, write, or mutate anything.
- Provider, tunnel, runtime, network, malformed-response, and missing-source failures remain visible
  refusals with no silent fallback. The default store state remains disabled until an operator makes
  the explicit request.

## Source-grounded Explain journey

The in-shell **Explain** section now sends one fixed synthetic question through the same authenticated
LocalOps product endpoint and established LocalOps provider/Ollama adapter path. It does not accept
free-form prompts or create a parallel AI implementation.

- Before inference, retrieval is restricted to the `2. What LocalOps IS` section of
  [`LOCALOPS_DOCTRINE.md`](LOCALOPS_DOCTRINE.md). Mixed, missing, or mismatched sources fail closed and
  no explanation is shown.
- The explanation describes the documented local-first, source-grounded, trace-emitting, read-only
  boundary. It cannot inspect county records, claim current system status, execute actions, access a
  shell, or mutate files or databases.
- Provider, tunnel, runtime, network, and malformed-response failures produce a visible refusal with
  no external-provider fallback. The default store state remains disabled until the operator makes
  the explicit request.

## LocalOps trace events (WO-LOCALOPS-003)

LocalOps emits an append-only, **TerraTrace-compatible** event stream via
`os-platform/core/pilot/local-agent/localOpsTrace.ts` (`createLocalOpsTrace`). Events carry the
load-bearing trace fields (`type`, `correlationId`, `schemaVersion`, `summary`, redacted `data`) so a
future bridge can map them 1:1 onto the canonical Postgres trace store — but v1 does **not** write to
that store (it needs DB + county context). Sinks are pluggable; the **default is a safe no-op**, and a
JSONL sink reuses the existing append-only, auto-redacting `.terrafusion/agent-events.jsonl` log.

Canonical event types: `localops.ai.requested`, `localops.ai.responded`,
`localops.provider.status_checked`, `localops.policy.refused`, `localops.approval.required`,
`localops.rag.retrieved`, `localops.tool.diagnostic.started`, `localops.tool.diagnostic.completed`.

Every payload is redacted before it leaves the module; sink failures never break the operator path; no
mutable business state (append-only). RAG/diagnostic event helpers exist as the **contract** only —
their producers land in WO-LOCALOPS-004/005.

## Local KB / source-grounded retrieval (WO-LOCALOPS-004)

`os-platform/core/pilot/local-agent/localOpsKb.ts` (`createLocalOpsKb`) is a minimal, **local-only**
markdown retrieval interface — no vector store, no embeddings, no external/web search, no cloud. It
returns **source references** (`sourceFile`, `heading`, redacted `snippet`, `score`, `matchReason`),
not answers.

- **County-data safe by construction:** only roots under the `docs/` allowlist are scanned. A
  configured `AI_LOCAL_KB_PATH`/`AI_RUNBOOK_PATH` outside the allowlist (or escaping the repo) is
  **excluded and reported** — there is no path that indexes county production documents.
- **Honest grounding:** when `AI_REQUIRE_SOURCES=true` and nothing matches, `grounded:false` and
  `canAnswer:false` — the caller must not produce an unsupported confident answer.
- Emits `localops.rag.retrieved` through the WO-003 trace adapter when one is supplied (optional;
  retrieval works with no sink).
- `status()` reports roots, excluded roots, file count, and the require-sources flag.

Retrieval consumers (e.g. an answer surface) are **not** built here — this is the interface + grounding
contract only.

## Read-only diagnostics (WO-LOCALOPS-005)

`os-platform/core/pilot/local-agent/localOpsDiagnostics.ts` (`createLocalOpsDiagnostics`) exposes a
**fixed allowlist of read-only diagnostics** built on the prior seams:

- `ai.profile` — active profile/provider (redacted)
- `config.summary` — redacted AI profile configuration
- `provider.status` — provider readiness (a non-ready provider is `warn`, not `error`)
- `kb.status` — local KB health (roots, excluded roots, file count)
- `health.summary` — **(WO-AI-CONSOLIDATION-003)** SystemGPT-style read-only health roll-up: applies
  Herald threshold rules to the local signals above to produce an overall `ok`/`warn`/`error` + warnings.
  Local-only (no network, no .NET call, no swarm); swarm-dependent advisory (`systemgpt.forecast`,
  `swarm.health`) is shown **unavailable**, never inferred — see
  [`../ai-consolidation/AI_ESTATE_INVENTORY.md`](../ai-consolidation/AI_ESTATE_INVENTORY.md).

Every result is `readonly: true` — diagnostics **observe only**: no mutation, no shell, no service
restart, no DB write, no migration, no network I/O. `request(name)` is the gated entry point: any name
outside the allowlist, or that names a mutating/operational action (`restart`, `migrate`, `write`,
`shell`, `exec`, …), is **refused** with a structured, redaction-safe `DiagnosticRefusal`
(`UNSAFE_DIAGNOSTIC` vs `UNKNOWN_DIAGNOSTIC`). Runs emit `localops.tool.diagnostic.started/.completed`
and refusals emit `localops.policy.refused` through the optional trace adapter.

App/service-health, DB-connectivity, and log-summary diagnostics are **deferred** — there is no existing
safe read-only seam to reuse, so they are not guessed.

## Existing seams (context, not commitment)

A governance-controlled local agent already exists at `os-platform/core/pilot/local-agent/`
(`modelGateway`, `policy`, `redact`, `proof`, `eventLog`, `doctorMode`, `controlCenter`, and
`ollamaAdapter`/`openaiAdapter`/`claudeAdapter`). The implementation work orders should **reuse and
harden these seams**, not invent parallel ones. This planning envelope deliberately does **not** touch
that code.
