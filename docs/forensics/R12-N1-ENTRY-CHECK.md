# R12-N1 Entry-Check Record — LocalOps/Muse/Pilot → core

*Outcome of the narrow R12-N1 lock-release. Entry checks run FIRST (per ratification). Result:
**ALREADY LANDED — do not merge.** No code moved. Recovery lock returns to FULL ACTIVE.*

## Verdict: **N1 = ALREADY LANDED in `main` (and `main` is more evolved). DISPOSITION → ignore (verify-complete).**

Merging the `wo-localops-008` stack would **regress** the live local-agent. The branch is an
older recut **ancestor** of what is already in `main`.

## Entry-check results (the 5 mandated checks)

| # | Check | Result |
|---|---|---|
| 1 | **Verify not already landed** (recut-aware) | ❌ **It IS already landed.** `main`'s `os-platform/core/pilot/local-agent` = **113 files** vs branch **107**; `main` last-touched **2026-06-12** vs branch **2026-06-11**. **STOP.** |
| 2 | **Content diff vs current `main`** (2-dot, not branch status) | `main` is a **superset + more evolved**: it has `localOpsEngine.{ts,js}`, `localOpsTraceBridge.{ts,js}`, `exemptionAdvisor.{ts,js}` that the branch **lacks** (they appear as deletions going main→branch). Branch-only files = **62, all stale `os-platform/development/testing-suite/e2e/E2ETest*.cs`** that `main` already removed — *not* LocalOps value. |
| 3 | **Exclude non-shell AI internals** | Moot (no merge). Note: the stack also touched `.terrafusion/skills` (37), `frontend/apps` (24), `brain/packs` (9) — i.e. it was **never a clean shell-only slice** anyway. |
| 4 | **Owner-sensitive fenced** | phone-redaction (`redact.{ts,js}` + `local-agent-event-redaction.test.mjs`) is **entangled inside the 008 stack**, not cleanly separable — confirming the fence concern; another reason a bulk-merge was unsafe. |
| 5 | **Land only the shell-facing spine** | **N/A — nothing to land.** |

## Spillover noted
The stack diff touched `package.json`, `pnpm-lock.yaml`, `.env.example` (config/dependency
surfaces). Not schema (F14), but enough config/lockfile spillover that a bulk-merge would
have violated entry-check #3's spirit.

## Divergence evidence
`origin/main...wo-localops-008` = **22 ahead / 147 behind**, merge-base `20eda5470` (2026-06-07).
`main` has advanced 147 commits past the base and absorbed (and evolved past) the LocalOps work.

## What this means (process)
- The **entry-check discipline prevented a regression on execution move #1.** This vindicates
  the recut-aware rule (Lane 3 / Loop 5), the Ratification gate (HR-9), and the "merged-flag-
  is-unreliable" finding: a closed-unmerged branch's work was fully landed via recut and then
  surpassed in `main`.
- **High-probability implication for the rest of the needle set:** N2 (canon/governance),
  N3 (Atlas), N5 (workbench), N6 (county-studio) are all **MERGE-CANDIDATE** and likely
  **also already-landed via recut**. The same content-presence entry check MUST run on each
  before any release. Do not assume any MERGE-CANDIDATE needle carries unlanded value.

## Disposition change
- **N1: salvage-now → IGNORE (already-landed / verify-complete).** No salvage; no merge.
- Optional residual: none worth pursuing — the only branch-only files are stale e2e tests main deliberately dropped.

## Lock status
- The narrow R12-N1 release is **consumed** (it produced verification, not a merge).
- **Recovery lock returns to FULL ACTIVE.** No general unlock occurred; no other needle is released.

## Recommended next step
Per the ratified order, **reassess before N2**. Recommendation: run the **same content-presence
entry check on N2 (canon/governance) and the other MERGE-CANDIDATE needles** as a batch —
because N1 just demonstrated the recut/already-landed rate may be high. Likely outcome: much
of the MERGE-CANDIDATE pool is already in `main`, which would sharply narrow the real salvage
work to the **PORT-ONLY legacy** Tier-1 engines (behind the schema gate) — the opposite of
where "looks important" intuition pointed.
