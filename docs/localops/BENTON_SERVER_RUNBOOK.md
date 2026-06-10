# Benton County Server Runbook (LocalOps)

> **Status:** PLANNING TEMPLATE. None of these runbooks are wired to executable diagnostics yet.
> They are the source material that WO-LOCALOPS-005 (read-only diagnostics) and WO-LOCALOPS-007
> (runbook hardening) will validate and link.
> **Doctrine:** read-only diagnose → **propose** step → **human approves** → human (or a future,
> separately-approved tool) acts. LocalOps v1 never executes a remediation itself.

## How to read a runbook entry

Each entry has the same shape:

- **Symptom** — what the operator observes.
- **Read-only diagnostic** — what LocalOps may inspect (logs, status, config). No mutation.
- **What LocalOps surfaces** — a grounded finding (cites the log/status it read) + the proposed step.
- **Human-approved action** — what a human decides to do. NOT auto-executed in v1.
- **Escalation** — when to stop and call a person.

Every entry, when implemented, must emit a TerraTrace event and cite its grounding source. None may
mutate state, restart services, or run arbitrary shell.

---

## R1 — TerraFusion API (Kernel, :5000) not responding

- **Symptom:** Frontend shows backend disconnected; `/api` calls time out.
- **Read-only diagnostic:** process/port status for :5000; last N lines of the API log; health endpoint
  reachability (read-only GET).
- **What LocalOps surfaces:** "API process not listening on :5000 (per port check at HH:MM); last log
  line: `<cited>`." Proposes the documented restart step — does not run it.
- **Human-approved action:** operator restarts the API service via the normal, approved mechanism.
- **Escalation:** repeated crashes, or log shows a data/secret error → stop, escalate to engineering.

## R2 — Port conflict on a TerraFusion service

- **Symptom:** A service fails to bind (5000 / 3002 / 3004 / 3000).
- **Read-only diagnostic:** which PID holds the port; the service's configured vs actual port.
- **What LocalOps surfaces:** "Port 3004 held by PID `<n>` (`<process>`); Consciousness expected 3004."
  Proposes the documented port-reassignment or stop-conflicting-process step.
- **Human-approved action:** human resolves the conflict.
- **Escalation:** the conflicting process is unknown/critical → stop, escalate.

## R3 — Database connectivity (PostgreSQL :5432) failing

- **Symptom:** API logs DB connection errors; migrations or queries fail.
- **Read-only diagnostic:** is :5432 reachable; connection-string **shape** (never print secrets); DB
  container/service status.
- **What LocalOps surfaces:** "Cannot reach DB host on :5432 (read-only check); connection string
  references host `<host>` (secret redacted)." Proposes the documented connectivity checklist.
- **Human-approved action:** human checks DB service / network / credentials out-of-band.
- **Escalation:** credentials appear wrong/expired → stop; this touches secrets (human-approval
  trigger), never auto-handled.

## R4 — Disk pressure on the server

- **Symptom:** Writes failing; logs warn low disk.
- **Read-only diagnostic:** filesystem usage; largest log/artifact directories (read-only `du`-style
  inspection).
- **What LocalOps surfaces:** "Filesystem at NN% (read at HH:MM); largest: `<dir>`." Proposes the
  documented log-rotation/cleanup step.
- **Human-approved action:** human performs cleanup per policy.
- **Escalation:** data directories (not logs) are the cause → stop, escalate before any deletion.

## R5 — TLS / certificate expiry

- **Symptom:** Browser/clients report cert errors.
- **Read-only diagnostic:** certificate validity window (read-only); which service presents it.
- **What LocalOps surfaces:** "Cert for `<service>` expired/expiring on `<date>` (read-only check)."
  Proposes the documented renewal runbook.
- **Human-approved action:** human renews/rotates the cert (secret-adjacent → human only).
- **Escalation:** always human; LocalOps never touches keys/certs.

## R6 — AI swarm / Consciousness (:3004) unhealthy

- **Symptom:** Swarm status degraded; SignalR coordination errors.
- **Read-only diagnostic:** Consciousness health endpoint (read-only); recent swarm status via the
  approved status API — **never** modifying the production swarm.
- **What LocalOps surfaces:** "Consciousness reports degraded at HH:MM (cited); N agents inactive."
  Proposes the documented status-review step.
- **Human-approved action:** human follows the swarm runbook.
- **Escalation:** the production swarm itself looks damaged → stop; the swarm is do-not-modify.

## R7 — Harris PACS / sync source unreachable

- **Symptom:** TerraFusion Sync from Harris PACS failing.
- **Read-only diagnostic:** reachability/health of the PACS source (read-only); last successful sync
  timestamp from TerraFusion's own records.
- **What LocalOps surfaces:** "PACS source unreachable (read-only check at HH:MM); last good sync
  `<ts>`." Proposes the documented sync-troubleshooting step.
- **Human-approved action:** human investigates connectivity. **PACS is a source, never written.**
- **Escalation:** any sign of write-back pressure to PACS → stop immediately; PACS is read-only-source.

---

## Out of scope for v1 (explicitly)

- Automatic restarts, cleanups, cert rotation, or any execution.
- Any write to property records, valuation, or PACS.
- Any cloud call to "ask for help."
- Any step not grounded in a cited diagnostic.
