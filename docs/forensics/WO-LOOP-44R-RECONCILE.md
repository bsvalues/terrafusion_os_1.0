# WO-LOOP-44R — Reconcile Loop 44 Vessel Scaffold with Existing `terrafusion-os`

> **Corrects WO-LOOP-44.** The sovereign receiving repo **already exists** as
> `github.com/bsvalues/terrafusion-os`. WO-LOOP-44 wrongly framed the work as *creating* a new
> `TerraFusionOS` repo — a naming error (it treated the Loop 42/43 destination *label* as a repo to
> create). The corrected task is **reconcile**, not create. **No repo creation. No runtime import.
> No WO-CORE-1 release.** Decision-layer + (at most) a narrow docs/governance-only patch.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)
**Supersedes framing of:** `terrafusionos-vessel/` staged scaffold (now a *candidate*, not a transplant payload)

---

## 1. Corrected repo-identity map (authoritative)
| Repo | Role | Runtime? |
|---|---|---|
| **`bsvalues/terrafusion-os`** | **sovereign receiving vessel** — already exists; runtime-empty by design, populated only via Work Orders with approved governance/tooling/contract artifacts | not yet a runnable replacement |
| `bsvalues/terrafusion_os_1.0` | **old runtime archive / mine** (this repo) — the migration *source* spine | yes (legacy runtime) |
| `bsvalues/TerraFusion-Platform` | **reference mine** | reference only |

**Rule:** never say "TerraFusionOS" as if it were a repo to be created. The repo is `terrafusion-os`.
`terrafusion_os_1.0` remains the archive/mine and is **not** deprecated by this work.

## 2. Corrected lock model
```text
Lock A (execution release):  CLOSED — WO-CORE-1 not released
Lock B (receiving repo):     SATISFIED (repo exists as bsvalues/terrafusion-os)
                             — content parity PENDING VERIFICATION (see §4 access note)
Execution:                   BLOCKED — Lock A remains closed; Lock B no longer the blocker
```

## 3. Goal
Determine whether the staged vessel scaffold under `docs/forensics/terrafusionos-vessel/`
**duplicates**, is **superseded by**, or should **patch** the existing `terrafusion-os` governance
root. Then either record Loop 44 as **superseded/no-op** (existing repo already adequate) or propose
a **narrow docs/governance-only patch** for the genuine gaps.

## 4. Access constraint (why this WO is a procedure, not a completed diff here)
This session's GitHub scope is **`bsvalues/terrafusion_os_1.0` only**. A read of
`bsvalues/terrafusion-os` returns: *"Access denied: repository is not configured for this session."*
The `list_repos`/`add_repo` scope-expansion tools are **not available** here. Therefore the actual
file comparison must be executed by **the owner** or **an agent/session scoped to `terrafusion-os`**.
This document supplies the exact comparison so that execution is mechanical.

> To let *this* assistant do the reconciliation directly, add `bsvalues/terrafusion-os` to the
> session scope (or run a session there). Otherwise follow §6 manually.

## 5. Rules (binding)
- Do **not** create a new repo (no `TerraFusionOS`, no fork, no second vessel).
- Do **not** release WO-CORE-1. Do **not** import runtime code.
- Do **not** create `backend/`, `frontend/`, `os-platform/`, or any package/build/CI files in `terrafusion-os`.
- Compare staged Loop 44 scaffold ↔ current `terrafusion-os` root.
- If `terrafusion-os` already has an equivalent governance file → record staged file **superseded/no-op**.
- If a genuine gap exists → propose a **narrow docs/governance-only** patch (one Work Order, reviewable diff).
- Then run `terrafusion-os`'s normal validation gates.

## 6. File-by-file reconciliation checklist
For each staged artifact, locate the counterpart in `terrafusion-os` and mark the outcome.
**Outcome codes:** `DUP` = already present & equivalent (no-op) · `SUP` = existing repo's version is
authoritative, drop staged · `GAP` = absent/weaker in repo → candidate narrow patch · `CONFLICT` =
present but materially divergent → escalate (do not auto-overwrite).

| # | Staged file (`terrafusionos-vessel/…`) | Expected counterpart in `terrafusion-os` | Outcome |
|---|---|---|---|
| 1 | `README.md` | `README.md` (root governance README) | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 2 | `AGENTS.md` | `AGENTS.md` | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 3 | `canon/INTAKE_RULES.md` | `canon/INTAKE_RULES.md` (or equivalent canon intake doc) | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 4 | `operations/evidence/MIGRATION_PROVENANCE_LEDGER.md` | provenance/evidence ledger | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 5 | `operations/work-orders/WO-CORE-1-PLACEHOLDER.md` | WO-CORE-1 record/placeholder | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 6 | `operations/work-orders/WO-LOOP-45-READINESS-GATE.md` | readiness-gate WO | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 7 | `operations/runbooks/RECEIVING_VESSEL_RUNBOOK.md` | receiving/intake runbook | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 8 | `docs/decisions/DECISION-LOOP-44-RECEIVING-VESSEL.md` | decisions/ADR set | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 9 | `docs/decisions/BRANCH_PROTECTION_TODO.md` | branch-protection config/decision | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 10 | `docs/forensics/FULL-AGENT-HANDOFF.md` (pointer) | continuity-handoff reference | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 11 | `tools/validators/validate-receiving-vessel.sh` | vessel/structure validator | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |
| 12 | reserved-lane READMEs (`brain/`, `operations/playbooks/`, `security/`) | reserved-lane guards | ☐ DUP ☐ SUP ☐ GAP ☐ CONFLICT |

**Negative checks on `terrafusion-os` (must remain true):** no `backend/`, no `frontend/`, no
`os-platform/`, no `package.json`/`pnpm-workspace.yaml`/`*.sln` introduced by this reconciliation.

## 7. Decision rule (outcome of the pass)
- **All rows DUP/SUP →** Loop 44 is recorded **superseded/no-op**; staged scaffold kept only as an
  evidence artifact in this archive. No patch to `terrafusion-os`.
- **Any GAP rows →** assemble them into a single **narrow docs/governance-only patch WO** against
  `terrafusion-os` (reviewable diff, no runtime). Nothing else moves.
- **Any CONFLICT rows →** stop and surface to owner; do not overwrite existing sovereign governance.

## 8. Exit → next
After reconciliation: proceed to **`WO-LOOP-45` — WO-CORE-1 Readiness Gate** (evaluate `terrafusion-os`
readiness to receive WO-CORE-1). **Only after WO-LOOP-45 passes** should opening **Lock A**
(WO-CORE-1 execution release) be discussed. This WO does not open Lock A.

## 9. What this WO is / isn't
- **Is:** a correction of repo identity + a mechanical reconciliation procedure against an existing repo.
- **Isn't:** repo creation, runtime import, a patch applied here (this repo can't read `terrafusion-os`),
  or any lock release.
