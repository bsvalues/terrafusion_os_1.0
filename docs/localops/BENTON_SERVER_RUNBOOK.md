# Benton County Server Runbook (LocalOps)

> **Status:** HARDENED OPERATOR RUNBOOK (WO-LOCALOPS-007). Operator-grade and honest about
> coverage: exactly one entry (**R0**) is wired to LocalOps's shipped read-only diagnostics
> (WO-LOCALOPS-005). Every server-infrastructure entry (**R1–R7**) is an **operator-performed**
> read-only check — LocalOps surfaces the guidance and the proposed step but, in v1, has **no
> executable diagnostic seam** for it (those seams are deferred; see WO-005 non-goals). This doc does
> not make any entry executable.
> **Doctrine:** read-only diagnose → **propose** step → **human approves** → human (or a future,
> separately-approved tool) acts. LocalOps v1 never executes a remediation itself.

## How to read a runbook entry

Each entry has the same shape:

- **Symptom** — what the operator observes.
- **Diagnostic source** — one of:
  - _LocalOps read-only diagnostic (shipped)_ — a fixed-allowlist diagnostic from WO-005
    (`ai.profile`, `config.summary`, `provider.status`, `kb.status`). LocalOps runs it, emits a
    trace event, and cites the result.
  - _Operator-performed read-only check (no LocalOps seam in v1)_ — the operator runs the read-only
    inspection (port/process/log/status). LocalOps surfaces the proposed step but cannot run the
    check itself yet.
- **Read-only diagnostic** — what may be inspected (logs, status, config). No mutation.
- **What LocalOps surfaces** — a grounded finding (cites the log/status/diagnostic it read) + the
  proposed step. LocalOps proposes; it does not run R1–R7 checks in v1.
- **Human-approved action** — what a human decides to do. NOT auto-executed in v1.
- **Escalation** — when to stop and call a person.

Every entry, when surfaced, cites its grounding source and (for shipped diagnostics) emits a
TerraTrace event via the WO-003 adapter. None may mutate state, restart services, or run arbitrary
shell. Operational answers without a grounding source must be withheld (`AI_REQUIRE_SOURCES`).

## Benton service map (read-only reference)

Ports the operator inspects (never reassigns from LocalOps):

| Service | Port | Notes |
|---------|------|-------|
| Frontend (shell) | 3000 | Vite/Electron UI |
| API (Kernel) | 5000 | TerraFusion.API |
| Gateway (Shell) | 3002 | Ocelot reverse proxy |
| Consciousness (AI swarm) | 3004 | **do-not-modify** production swarm |
| PostgreSQL | 5432 | secrets-adjacent — human-only |
| Redis | 6379 | cache |
| Consul | 8500 | service discovery |

---

## R0 — Is LocalOps itself available? (LocalOps-automatable)

- **Symptom:** Operator opens the LocalOps panel and the provider card shows `disabled`,
  `unavailable`, or `misconfigured`; answers are refused for lack of a provider.
- **Diagnostic source:** _LocalOps read-only diagnostic (shipped)._
- **Read-only diagnostic:** `ai.profile` (active profile/provider, redacted), `config.summary`
  (redacted AI configuration), `provider.status` (provider readiness — a non-ready provider is
  `warn`, not `error`), `kb.status` (local KB roots, excluded roots, file count).
- **What LocalOps surfaces:** "Active profile `<profile>`; provider `<provider>` status `<status>`
  (read at HH:MM); KB has `<n>` files under the docs allowlist." Each run emits
  `localops.tool.diagnostic.started` / `.completed`; refusals emit `localops.policy.refused`. With a
  `local-only` profile and no reachable local model, the finding is "local AI unavailable" and
  **zero** external calls are made (invariant I1).
- **Human-approved action:** operator reviews the AI profile config (`AI_*` flags) and local-model
  reachability out-of-band; LocalOps only reports, it does not change config.
- **Escalation:** `config.summary` shows an unexpected non-local provider or external-calls enabled
  on a locked-down Benton box → stop; profile/secret changes are a human-approval trigger.

## R1 — TerraFusion API (Kernel, :5000) not responding

- **Symptom:** Frontend shows backend disconnected; `/api` calls time out.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator checks process/port status for :5000; last N lines of the API
  log; health-endpoint reachability (read-only GET).
- **What LocalOps surfaces:** the documented checklist and the proposed restart step, citing the
  runbook entry — it does not run the check or the restart.
- **Human-approved action:** operator restarts the API service via the normal, approved mechanism.
- **Escalation:** repeated crashes, or a log line showing a data/secret error → stop, escalate to
  engineering.

## R2 — Port conflict on a TerraFusion service

- **Symptom:** A service fails to bind (5000 / 3002 / 3004 / 3000).
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator inspects which PID holds the port and the service's configured
  vs actual port (see service map above).
- **What LocalOps surfaces:** the documented port-reassignment / stop-conflicting-process step,
  grounded in this entry. LocalOps never reassigns a port itself.
- **Human-approved action:** human resolves the conflict.
- **Escalation:** the conflicting process is unknown/critical → stop, escalate.

## R3 — Database connectivity (PostgreSQL :5432) failing

- **Symptom:** API logs DB connection errors; migrations or queries fail.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator checks whether :5432 is reachable; the connection-string
  **shape** only (never print secrets); DB container/service status.
- **What LocalOps surfaces:** the documented connectivity checklist, citing this entry; any
  connection string is reported by shape with the secret redacted.
- **Human-approved action:** human checks DB service / network / credentials out-of-band.
- **Escalation:** credentials appear wrong/expired → stop; this touches secrets (human-approval
  trigger), never auto-handled.

## R4 — Disk pressure on the server

- **Symptom:** Writes failing; logs warn low disk.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator inspects filesystem usage and the largest log/artifact
  directories (read-only `du`-style inspection).
- **What LocalOps surfaces:** the documented log-rotation/cleanup step, grounded in this entry —
  never a deletion.
- **Human-approved action:** human performs cleanup per policy.
- **Escalation:** data directories (not logs) are the cause → stop, escalate before any deletion.

## R5 — TLS / certificate expiry

- **Symptom:** Browser/clients report cert errors.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator reads the certificate validity window and which service presents
  it (read-only).
- **What LocalOps surfaces:** the documented renewal runbook, citing this entry. LocalOps never reads
  or touches private keys/certs.
- **Human-approved action:** human renews/rotates the cert (secret-adjacent → human only).
- **Escalation:** always human; LocalOps never touches keys/certs.

## R6 — AI swarm / Consciousness (:3004) unhealthy

- **Symptom:** Swarm status degraded; SignalR coordination errors.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator reads the Consciousness health endpoint and recent swarm status
  via the approved status API — **never** modifying the production swarm.
- **What LocalOps surfaces:** the documented status-review step, grounded in this entry. The
  production swarm (1,008 agents) is do-not-modify.
- **Human-approved action:** human follows the swarm runbook.
- **Escalation:** the production swarm itself looks damaged → stop; the swarm is do-not-modify.

## R7 — Harris PACS / sync source unreachable

- **Symptom:** TerraFusion Sync from Harris PACS failing.
- **Diagnostic source:** _Operator-performed read-only check (no LocalOps seam in v1)._
- **Read-only diagnostic:** operator checks reachability/health of the PACS source (read-only) and
  the last successful sync timestamp from TerraFusion's own records.
- **What LocalOps surfaces:** the documented sync-troubleshooting step, grounded in this entry.
  **PACS is the source, never written.**
- **Human-approved action:** human investigates connectivity out-of-band.
- **Escalation:** any sign of write-back pressure to PACS → stop immediately; PACS is
  read-only-source.

---

## Diagnostic coverage in v1 (honest)

| Entry | Scenario | Diagnostic source in v1 |
|-------|----------|-------------------------|
| R0 | LocalOps self-readiness | **LocalOps read-only diagnostic (shipped, WO-005)** |
| R1 | API (Kernel :5000) down | Operator-performed read-only check |
| R2 | Port conflict | Operator-performed read-only check |
| R3 | PostgreSQL :5432 connectivity | Operator-performed read-only check |
| R4 | Disk pressure | Operator-performed read-only check |
| R5 | TLS / cert expiry | Operator-performed read-only check |
| R6 | Consciousness :3004 unhealthy | Operator-performed read-only check |
| R7 | Harris PACS source unreachable | Operator-performed read-only check |

Executable read-only seams for R1–R7 (service-health, DB-connectivity, log-summary) are **deferred**
— there is no safe existing seam to reuse, so they are not guessed. A future, separately-approved
work order may add them; until then these entries are operator-performed and LocalOps only proposes.

## Grounding and trace (where the entries route)

- Read-only diagnostics: `os-platform/core/pilot/local-agent/localOpsDiagnostics.ts`
  (`READONLY_DIAGNOSTICS` = `ai.profile`, `config.summary`, `provider.status`, `kb.status`).
- Source grounding: `os-platform/core/pilot/local-agent/localOpsKb.ts` (docs/ allowlist only).
- Trace events: `os-platform/core/pilot/local-agent/localOpsTrace.ts`
  (`localops.tool.diagnostic.started` / `.completed`, `localops.policy.refused`).
- In-shell surface: the **Runbook** section of
  `frontend/apps/os-shell/src/components/localops/LocalOpsPanel.tsx` points operators here.

## Out of scope for v1 (explicitly)

- Automatic restarts, cleanups, cert rotation, or any execution.
- Any write to property records, valuation, or PACS.
- Any cloud call to "ask for help."
- Any step not grounded in a cited diagnostic.
- Any executable read-only seam for R1–R7 (deferred; operator-performed in v1).
