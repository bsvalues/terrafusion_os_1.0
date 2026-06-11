# TerraFusion LocalOps — Planning Envelope

> **Work Order:** WO-LOCALOPS-000 — LocalOps Planning Envelope
> **Status:** PLANNING ONLY. Nothing in this directory is implemented or runtime-ready.
> **Governance:** TerraFusion Brain/Cortex. One Brain, many packs. See root [`AGENTS.md`](../../AGENTS.md).

## What this is

This directory is the **governed planning envelope** for **TerraPilot LocalOps Mode** — a local,
county-boundary-safe AI operator that runs **inside the TerraFusion shell** so the OS can help a
Benton County operator when external AI tools are unavailable, blocked, or prohibited.

It is **not** demo AI and **not** implementation. It is the plan that future LocalOps implementation
work orders (WO-LOCALOPS-001 … 008) will ride on, written **against actual governance** — the Brain
packs and path router that landed in WO-BRAIN-0013 and WO-BRAIN-0014.

**Read this honestly:** every capability described here is a *target*, not a *current state*. No
provider, RAG, diagnostic, or UI is built by this work order. Where a doc describes behavior, it is
describing what a future, human-approved implementation work order must deliver and prove.

## Documents

| File | Purpose |
|------|---------|
| [`LOCALOPS_DOCTRINE.md`](LOCALOPS_DOCTRINE.md) | The non-negotiable rules. What LocalOps is, is not, and must never do. The constitution for this lane. |
| [`LOCALOPS_WORKORDER_PLAN.md`](LOCALOPS_WORKORDER_PLAN.md) | Decomposition into WO-LOCALOPS-001…008, each with goal / allowed / forbidden / risk class / acceptance / proof / stop condition / non-goals. |
| [`BENTON_SERVER_RUNBOOK.md`](BENTON_SERVER_RUNBOOK.md) | Operator-facing survival runbook templates for Benton County server scenarios (read-only diagnose → human-approved act). |
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

**Still deferred (separately approvable):** the live engine→view-model adapter (mapping WO-001…005 node
outputs onto `LocalOpsViewModel`). The store ships the honest `disabled`-profile default and a `setData`
seam; until an adapter is wired, the panel renders that default and performs **no** API calls, mutation,
or shell execution. Wiring a live adapter crosses the node/browser boundary (needs a backend surface) and
is intentionally left to a future slice to keep 006.1 dependency-free.

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
