# WO-AI-CONSOLIDATION-006 — Governed Local Execution Mode (Planning Envelope)

> **Goal:** TF-AI-OPS-001. **Status:** PLANNING ONLY — no execution tool is built or enabled here.
> This defines the **smallest approval-gated execution toolset** a solo Benton operator actually needs,
> as a forward contract on top of the already-proven read-only LocalOps path.
> **Authorization:** TF-AI-OPS-001 directive (explicit, per `AGENTS.md`).

## Why this exists

LocalOps v1 is **read-only**: diagnose → propose → a human acts. That is correct and proven. But a solo
operator alone on the Benton server eventually needs the OS to *do* a few bounded things — restart a
service, rotate a log, re-run a sync — without hand-typing every command. The danger is obvious: an
ungoverned execution mode is exactly the "unrestricted shell" LocalOps doctrine forbids. This envelope
defines how execution could exist **without** crossing that line: tiny, named, allowlisted, and
**human-approved every time**.

## Non-negotiable boundaries (inherited, not relaxed)

- **No autonomous mutation.** Every execution requires explicit human **confirmation + reason** at call
  time (mirrors `ToolExecutionContext.confirmation`/`reasonCode` and the `localops.approval.required`
  trace event that already exists). `allowMutation` defaults `false`; execution mode does not flip it
  globally — it gates per-tool.
- **No unrestricted shell.** Execution is a **fixed allowlist of named operations**, never arbitrary
  command strings (the read-only diagnostics' `UNSAFE_DIAGNOSTIC` refusal model, inverted into an
  explicit allow with approval).
- **No write-lane violation.** An execution tool may only act in its own lane; cross-lane intent emits a
  governed request, never a direct write (per `AGENTS.md` Write-Lane Matrix).
- **No silent cloud, no county-data mutation by AI, append-only trace.** Every execution emits
  `action_started` + terminal `action_completed`/`action_failed` to **TerraTrace** (via the WO-002
  bridge), PII-redacted, hash-chained.
- **TerraPilot-only.** Execution lives behind the in-shell TerraPilot operator surface — never a
  standalone app, never Muse Mode (Muse is read/explain/draft only).

## The minimal toolset (candidate v1 — each approval-gated, read-bounded blast radius)

| Tool | What it does | Risk class | Approval | Reversible? |
|---|---|---|---|---|
| `service.restart` | restart **one** named TerraFusion service (by allowlisted id) | R3 | confirm + reason | yes (re-restart) |
| `log.rotate` | rotate/compress an allowlisted **log** dir (never data dirs) | R2 | confirm + reason | n/a (additive) |
| `sync.rerun` | re-run an allowlisted **read-from-source** sync job (e.g. PACS→TF; **never** writes back to PACS) | R3 | confirm + reason | yes (idempotent) |
| `cache.clear` | clear an allowlisted cache (Redis namespace / tmp) | R2 | confirm + reason | yes (rebuilds) |
| `health.recheck` | force a re-run of read-only diagnostics (already safe; included for symmetry) | R0 | none (read-only) | n/a |

Explicitly **out of v1**: anything that writes property/valuation records, anything touching secrets/
certs, anything PACS-write, migrations, arbitrary shell, package installs, or deploys. Those stay
human-only.

## Execution contract (the shape every tool must satisfy)

1. **Propose** — LocalOps surfaces the diagnostic finding + the *named* tool it would run (no execution).
2. **Approve** — operator confirms with a reason; `localops.approval.required` is emitted.
3. **Execute** — the allowlisted op runs in its lane; `action_started` → `action_completed/failed` on
   TerraTrace; output redacted.
4. **Verify** — a read-only diagnostic confirms the new state; the trace chain is the evidence.
5. **Refuse-by-default** — any unnamed/unsafe request is refused exactly as the read-only diagnostics
   refuse today.

## Proof bar (for any future execution slice)

Identical to the LocalOps bar: offline `node --test` harness proving (a) an unapproved execution does
**not** run, (b) an approved execution emits the started/terminal TerraTrace pair, (c) an unnamed tool is
refused, (d) no cross-lane write occurs, (e) zero egress. No execution tool ships without this.

## Sequencing note

This is a **plan**, not an enablement. Each tool above would be its own bounded, Brain-selected,
human-approved work order (execution mode is precisely the kind of **product-behavior change** the goal
reserves for human approval). Until then, LocalOps stays read-only and the operator acts by hand on
LocalOps's grounded proposals.
