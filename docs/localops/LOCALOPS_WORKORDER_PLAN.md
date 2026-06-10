# LocalOps Work Order Plan

> **Status:** PLANNING ONLY. This decomposes future implementation; none of it is built.
> **Parent:** WO-LOCALOPS-000 (this envelope). **Doctrine:** [`LOCALOPS_DOCTRINE.md`](LOCALOPS_DOCTRINE.md).

Each work order below is a **separate, human-approved** unit. They are ordered by dependency. A later
WO must not start until its dependencies have landed and the human has approved proceeding. Risk
classes use the LocalOps/TerraPilot scale (R0–R3 ≈ read_only / write_low / write_high / irreversible).

## Sequencing

```
001 AI Profile Config Contract        (R0 — schema/docs)
   └─ 002 Local Provider Abstraction   (R1 — local, reversible)
        └─ 003 TerraTrace Event Adapter (R1)
             ├─ 004 Local KB/RAG Interface (R1, approval-gated indexing)
             └─ 005 Read-Only Diagnostics   (R0/R1)
                  └─ 006 In-Shell LocalOps UI (R1)
                       └─ 007 Benton Runbooks Hardening (R1)
                            └─ 008 Runtime Proof Harness (R0 — verifies all above)
```

LocalOps v1 = 001→008 with **only read_only operator-facing behavior**. Any mutation tool is a
post-v1, separately-chartered work order.

---

## WO-LOCALOPS-001 — AI Profile Config Contract

- **Goal:** Define the machine-readable contract for a county AI profile (providers, boundaries,
  grounding sources, trace requirements) as a typed schema + example, grounded in
  [`BENTON_AI_PROFILE.md`](BENTON_AI_PROFILE.md). No provider calls — just the contract.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**` (config/schema only), `docs/localops/**`,
  test files alongside.
- **Forbidden:** provider network calls; reading county data; UI; package/dependency changes;
  anything outside the local-agent config seam.
- **Risk class:** R0 (schema + docs; no runtime side effects).
- **Acceptance:** profile schema exists with explicit `egress: local-only` default; invalid profiles
  (e.g. cloud egress without an approval flag) are rejected by validation; Benton example profile
  validates.
- **Proof:** `pnpm run type-check`; `node --test` on the new schema validation tests; `pnpm canon:gatefast`.
- **Stop condition:** schema cannot express "local-only, no silent fallback" as the default → stop and
  revise doctrine with a human.
- **Non-goals:** no provider implementation, no UI, no RAG.

## WO-LOCALOPS-002 — Local Provider Abstraction

- **Goal:** A provider abstraction that prefers a **local** model (e.g. Ollama) and **refuses** to
  fall back to cloud unless the profile explicitly and auditably permits it. Reuse/harden the existing
  `modelGateway` / `adapterRegistry` / `ollamaAdapter` seams.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**`, test files, `docs/localops/**`.
- **Forbidden:** any default or implicit cloud egress; storing secrets; UI; new top-level deps without
  separate approval.
- **Risk class:** R1 (local, reversible; no county-scoped writes).
- **Acceptance:** with a local-only profile and no local model available, the gateway returns a clear
  "local AI unavailable" result and emits a trace event — it does **not** call any external endpoint
  (proven by a no-network test). Cloud path is reachable **only** with an explicit profile flag.
- **Proof:** `pnpm run type-check`; offline unit test asserting zero external calls on fallback;
  `pnpm canon:gatefast`.
- **Stop condition:** any code path can reach the cloud without an explicit profile flag → stop.
- **Non-goals:** no diagnostics, no RAG, no UI.

## WO-LOCALOPS-003 — TerraTrace Event Adapter

- **Goal:** Adapt LocalOps actions to emit append-only TerraTrace events with PII sanitized per the
  TerraPilot spec (§4). Reuse the existing `eventLog` / `redact` seams.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**`, test files, `docs/localops/**`.
- **Forbidden:** writing business state; mutating prior events; logging raw PII; UI.
- **Risk class:** R1.
- **Acceptance:** every LocalOps action emits one append-only event; SSN/phone/email never appear in
  payloads (proven by redaction tests); events carry a correlationId queryable via `trace:query`.
- **Proof:** `pnpm run type-check`; redaction/PII unit tests; `node --test os-platform/core/tests/phase83-tools.test.mjs`.
- **Stop condition:** any path writes raw PII or mutates an existing event → stop.
- **Non-goals:** no new trace store; trace remains OS-core owned.

## WO-LOCALOPS-004 — Local KB/RAG Interface

- **Goal:** Define and implement the **interface** for a local knowledge base over **approved**
  sources only (runbooks, public docs), with explicit indexing approval rules. Reuse `docsIndex` /
  `docTruth` seams.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**`, test files, `docs/localops/**`.
- **Forbidden:** indexing county documents or PII without documented approval rules; cloud embedding
  services under a local-only profile; UI.
- **Risk class:** R1 (with an **approval gate** on what may be indexed).
- **Acceptance:** indexing refuses any source not on the approved-sources list; every retrieval result
  carries a source citation; no county/PII source is indexable without an explicit approval record.
- **Proof:** `pnpm run type-check`; unit tests for approval-gate refusal + citation presence; `pnpm canon:gatefast`.
- **Stop condition:** indexing can ingest an unapproved/county source silently → stop.
- **Non-goals:** no cloud RAG; no auto-ingestion; no UI.

## WO-LOCALOPS-005 — Read-Only Diagnostics

- **Goal:** Read-only diagnostic checks (service status, port/health, config sanity, log summarize)
  that **observe and explain only**. Reuse `doctorMode` / `status` / `controlCenter` seams.
- **Allowed paths:** `os-platform/core/pilot/local-agent/**`, test files, `docs/localops/**`.
- **Forbidden:** any mutation; restarting services; editing config; arbitrary shell; cloud egress.
- **Risk class:** R0 (read-only) for checks; any proposed remediation is **R2+ and deferred** to a
  separate post-v1 WO.
- **Acceptance:** each diagnostic returns a grounded finding (cites the log/status it read), proposes
  the runbook step (does **not** execute it), and emits a trace event; a mutation attempt is rejected
  by design.
- **Proof:** `pnpm run type-check`; unit tests asserting diagnostics perform no writes; `pnpm canon:gatefast`.
- **Stop condition:** a diagnostic mutates anything → stop.
- **Non-goals:** no remediation execution, no UI.

## WO-LOCALOPS-006 — TerraPilot In-Shell LocalOps UI

- **Goal:** Surface LocalOps **inside the TerraFusion shell** as a TerraPilot mode panel (read-only
  findings + proposed runbook steps + approval affordance for future mutation tools).
- **Allowed paths:** `frontend/apps/os-shell/**` (LocalOps panel only), test files, `docs/localops/**`.
- **Forbidden:** standalone app/window; route escape; hardcoded z-index; suite business logic in the
  shell; auto-executing any action.
- **Risk class:** R1 (shell UI; honor shell pack — see `brain/packs/shell/README.md`).
- **Acceptance:** LocalOps opens inside the shell (not a separate window); read-only findings render
  with citations; mutation actions (when later added) require explicit confirmation + reason; no
  hardcoded z-index; Tier-1 UI harness passes.
- **Proof:** `pnpm run type-check`; `pnpm canon:gatefast`; Tier-1 UI Harness; shell-contract checks.
- **Stop condition:** the panel opens outside the shell or auto-acts → stop.
- **Non-goals:** no new top-level surface; no TerraPilot doctrine change.

## WO-LOCALOPS-007 — Benton Runbooks Hardening

- **Goal:** Turn [`BENTON_SERVER_RUNBOOK.md`](BENTON_SERVER_RUNBOOK.md) templates into validated,
  diagnostic-linked runbooks the read-only diagnostics can cite and propose.
- **Allowed paths:** `docs/localops/**`, `os-platform/core/pilot/local-agent/**` (runbook wiring only),
  test files.
- **Forbidden:** runbooks that auto-execute; any step that mutates without human approval; cloud calls.
- **Risk class:** R1.
- **Acceptance:** each runbook entry maps a symptom → read-only diagnostic → proposed (not executed)
  action → escalation; every entry is grounded and trace-emitting; no entry executes automatically.
- **Proof:** `pnpm run type-check`; runbook-validation tests; `pnpm exec prettier --check docs/localops/**`.
- **Stop condition:** any runbook step executes without human approval → stop.
- **Non-goals:** no autonomous remediation.

## WO-LOCALOPS-008 — Runtime Proof Harness

- **Goal:** An automated harness that proves the v1 invariants end-to-end: no silent cloud fallback,
  diagnostics don't mutate, trace is emitted + PII-safe, human-approval gate enforced, source grounding
  present, county boundary respected. Implements the scenarios in
  [`LOCALOPS_ACCEPTANCE_TEST.md`](LOCALOPS_ACCEPTANCE_TEST.md).
- **Allowed paths:** `os-platform/core/pilot/local-agent/**` (tests/harness), `docs/localops/**`,
  optionally a **non-runtime** `package.json` test script (separately approved).
- **Forbidden:** changing product behavior to make tests pass; network calls in tests; claiming
  compliance/accreditation.
- **Risk class:** R0 (verification only).
- **Acceptance:** harness runs offline, fails loudly if any §3 prohibition is violated, and is wired
  into the existing test surface (`node --test` / canon gates).
- **Proof:** the harness itself, run offline; `node --test os-platform/core/tests/...`; `pnpm canon:gatefast`.
- **Stop condition:** a prohibition can be violated without the harness failing → the harness is
  incomplete; stop and extend.
- **Non-goals:** no runtime-readiness claim beyond what the harness actually proves.

---

## Cross-cutting rules for every WO above

- Documentation/governance/tooling discipline: reuse the existing `local-agent` seams; do not invent a
  parallel agent or a second brain.
- Each WO routes through the Brain (work order → review-diff → proof → commit-plan) and the path router
  (`brain/router/path-router.yaml`) — `os-platform/core/pilot/**` is `R3` core-governance surface, so
  these WOs are high-scrutiny by default.
- Human-approval triggers from root `AGENTS.md` apply: constitutional change, destructive op, product
  behavior change, branch/merge strategy, production deploy, conflicting canon, credentials/secrets.
- Honesty: no WO may claim runtime readiness, compliance, or accreditation it has not proven.
