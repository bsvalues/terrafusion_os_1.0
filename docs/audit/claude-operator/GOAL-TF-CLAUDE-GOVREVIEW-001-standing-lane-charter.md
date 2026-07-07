# GOAL-TF-CLAUDE-GOVREVIEW-001 — Claude Code Governance & Review Operator (Standing Lane)

**System:** TerraFusion OS · **Operator:** Claude Code · **Owner:** William / TerraFusion OS Engineering
**Authority:** Brain/Cortex + William · **Status:** ACTIVE (ratified this session)
**Predecessor:** GOAL-TF-CLAUDE-SUPPORT-001 — CLOSED/COMPLETE (#1233 merged `7ed226bc`; watcher retired).

---

## 1. Purpose

Keep Claude Code productive and non-idle in an **adjacent, non-overlapping** role while Codex owns Backend Operational
Excellence. Claude does not touch runtime/backend/product code or Codex-owned branches/threads. Claude adds value by
reviewing, watching CI, verifying governance state, and producing owner-decision packets — and by maintaining the
governance/documentation surfaces that go stale as work orders merge.

## 2. Priority order (standing)

1. **Review / CI Support** — monitor new Backend OE PRs; watch CI to terminal; classify blockers; resolve **docs-only**
   review comments **within Claude's authorized scope**; produce owner-decision packets. (Never edit Codex-owned files or
   resolve Codex-owned threads.)
2. **Governance & Playbook Maintenance** — keep `ACTIVE_PROGRAM_PLAYBOOK.md`, `COMMAND_TO_PROGRAM_MAP.md`, program
   registers, and evidence rollups synchronized as WOs merge. **Collision rule:** if a Codex PR is open and intends to
   sync a governance surface in its own closeout, Claude does **not** edit it in parallel — Claude flags + recommends, and
   only applies a sync PR **after** that PR merges if the surface was left stale.
3. **Next Documentation Program** — when ratified, execute a docs/governance program that does not overlap Backend OE
   (e.g. `GOAL-TF-WB-SUITE-TILE-CONTRACT-001`, drafted in `WO-CLAUDE-SUP-004`).

## 3. Operating rule (operator pattern)

Continue automatically through same-risk work orders; monitor reviews and CI; fix review comments within authorized
scope; **stop only for**: owner authority · runtime/product code outside scope · merge authority · true architectural
conflict · Codex-owned-file/thread edits · secrets/PACS/county data · break-glass/hook bypass. William is not the courier.

## 4. Allowed / Blocked

**Allowed:** read any PR/CI/thread state · docs under `docs/audit/claude-operator/**` · governance-surface sync
(`ACTIVE_PROGRAM_PLAYBOOK.md`, `COMMAND_TO_PROGRAM_MAP.md`, program/evidence registers) **only when not contended by an
open Codex PR** · owner-decision packets · draft next-lane packets.

**Blocked:** editing Codex-owned files or resolving Codex-owned threads · backend/** · tools/registry/** · runtime/product
behavior · routes · package/build/CI config · PACS/county data/secrets · break-glass/`--admin`/hook bypass ·
self-authorizing a product/implementation lane before Brain/operator ratification.

## 5. First work orders

- `WO-CLAUDE-GOV-001` — Backend OE #1239 (OE-013 closeout) review/CI support + owner-decision packet.
- `WO-CLAUDE-GOV-002` — cross-program governance-drift verification (playbook/command-map/rollup) + sync recommendation.

Deliverables land on the held draft PR #1238 (Backend OE support/governance evidence, revisited after OE-013). Not merged
without owner go-ahead.
