# WO-CLAUDE-QUEUE-001 — Active Lane State Reconciliation

**Goal:** GOAL-TF-CLAUDE-OPERATOR-QUEUE-001 — Claude Code Non-Overlapping Operator Queue
**WO:** WO-CLAUDE-QUEUE-001 — Active Lane State Reconciliation
**Category:** Documentation (read-only reconciliation)
**Operator:** Claude Code · **Owner/authority:** William / TerraFusion OS Engineering

**Authorization:** Operator authorized GOAL-TF-CLAUDE-OPERATOR-QUEUE-001. Allowed writes: `docs/audit/claude-operator/**`,
`docs/audit/workbench-readiness/**`, `frontend/apps/os-shell/src/__tests__/workbench/**` (only if a selected goal needs
tests). Read-only inspection elsewhere. These paths are **outside the default `AGENTS.md` write lane**; this write is
permitted **only** because of the explicit operator authorization above (`AGENTS.md` allows out-of-lane writes with such
authorization). No governance-surface files are touched.

> **Governance (authority routing).** Per root `AGENTS.md` and `brain/packs/README.md`, the Brain/Cortex is the sole
> authority for queue/sequencing/work-orders. This document and its sibling queue register are **non-authoritative
> evidence/selection inputs** to that governed path — not a self-granted autonomous scheduling authority and not a bypass
> of `pnpm brain next`.

---

## 1. Purpose

Establish current cross-agent truth so Claude Code neither collides with Codex nor restarts completed lanes, before
selecting the next lane. Reconciled first-hand from `origin/main`, `gh pr list`, and local worktrees.

## 2. Ownership caveat

All PRs are authored under the shared `bsvalues` / "TerraFusion Copilot" identity, so **author does not distinguish
Codex from Claude**. Ownership is inferred from the WO prefix: `WO-BACKEND-OE-*` = **Codex**; `WO-WB-*` / `WO-CLAUDE-*` =
**Claude**; other prefixes = prior/other lanes.

## 3. Open PRs (reconciled)

| PR | WO / title | Inferred owner | Lane | Claude action |
|----|-----------|----------------|------|---------------|
| #1226 | WO-BACKEND-OE-010 Backend Operational Runbook | **Codex** | Backend OE (ACTIVE) | **do not touch** |
| #1153 | WO-BACKEND-005 Git SHA / build-provenance truth | backend lane | Backend | do not touch |
| #1102 | docs(brain) work order operator doctrine | brain/ops lane | Ops doctrine | not Claude's |
| #1082 | WO-FECF-002 Recovery Classification Register | forensics lane | Forensics | not Claude's |
| #1080 | docs(forensics) Loop 1 recovery evidence register | forensics lane | Forensics | not Claude's |
| #1076 | Fix/projector delete insert atomicity | sync/projector lane | Sync-adjacent | not Claude's |
| #1073 | feat(atlas) MapLibre migration + parcel overlay | atlas lane | Frontend/Atlas | not this queue (separate active lane) |

**No open PR belongs to this session's Claude Workbench work** — all Workbench PRs (#1203–#1225) are merged.

## 4. Lane-state register

| Lane | Owner | State |
|------|-------|-------|
| Backend Operational Excellence | Codex | **ACTIVE / priority** (#1226 open) |
| G1 — 0/117 tool backend integration | Codex / backend / TerraPilot | Not started; **not Claude's lane** |
| Workbench Readiness | Claude | Complete (merged) |
| Workbench Honesty Instrumentation | Claude | Complete — 9/9 tabs |
| Workbench Per-Slice Store Provenance | Claude | Complete (merged) |
| Workbench G2 Window Aliasing (decision) | Claude | Complete (#1221) |
| Workbench G2 Window Aliasing (fix) | Claude | Complete (#1222/#1223/#1225) |
| Sync — synthetic/built-fresh tooling | Claude | Complete + **parked** |
| Sync — lock-packet program | Claude | Complete + **parked** |
| Atlas MapLibre migration | (separate frontend lane) | Active (#1073) — not this queue |
| Forensics / FECF / brain doctrine | (other lanes) | Open PRs — not Claude's queue |

## 5. Claude Code activity check

- **Open PRs owned by this queue's Claude work:** none.
- **Active watchers:** none.
- **Active Claude worktrees for this work:** none. (Three unrelated worktrees exist — `wo-brain-001`,
  `wo-ops-clean-main`, `wo-sales-002b` — belonging to other lanes; not touched.)
- **Housekeeping:** ~14 already-merged `wo/wb-*` remote branches persist (auto-merge did not always `--delete-branch`);
  harmless, cleanup is a candidate lane (see WO-CLAUDE-QUEUE-002).

## 6. Do-not-touch list (this queue)

`backend/**`, `tools/registry/**`, `tools/sync/**`, Codex Backend OE files (`WO-BACKEND-OE-*`), G1 tool integration,
API/service implementation, route architecture, DB/schema/migrations, package/build/CI config, deploy/runtime, PACS,
county SQL/data, secrets, production config. No `--admin` / break-glass / hook bypass.

## 7. Safe Claude lanes (candidates → WO-CLAUDE-QUEUE-002)

Frontend/workbench tests + docs, `docs/audit/**` closeout/maintenance, decision packets for future frontend lanes,
read-only reconciliation, and small merged-branch/DevEx **discovery** (no config writes). Ranked in WO-CLAUDE-QUEUE-002.

**Docs-only. Read-only source inspection. No stop wall.**
