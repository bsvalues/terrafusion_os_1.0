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

## Existing seams (context, not commitment)

A governance-controlled local agent already exists at `os-platform/core/pilot/local-agent/`
(`modelGateway`, `policy`, `redact`, `proof`, `eventLog`, `doctorMode`, `controlCenter`, and
`ollamaAdapter`/`openaiAdapter`/`claudeAdapter`). The implementation work orders should **reuse and
harden these seams**, not invent parallel ones. This planning envelope deliberately does **not** touch
that code.
