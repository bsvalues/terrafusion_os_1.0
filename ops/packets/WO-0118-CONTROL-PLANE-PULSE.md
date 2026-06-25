# WO-0118 — Control Plane Activation: Read-Only Pulse
**Status:** Draft
**Date:** 2026-06-23
**Owner:** TerraFusion OS Engineering
**Classification:** Operational Governance
**Authorized paths:**
- `scripts/brain/brain-pulse.mjs`
- `.github/workflows/brain-pulse.yml`
- `docs/brain/workorders/active/WO-0118-control-plane-activation-read-only-pulse.md`
- `ops/packets/WO-0118-CONTROL-PLANE-PULSE.md`

---

## Context

The Control-Plane Reality Check (2026-06-23) confirmed:

- Brain/Cortex is a CLI toolbox, not an autonomous operator.
- All 7 control panel automation lanes are `paused` with no implementation behind them.
- No scheduler, daemon, watcher, or queue service exists.
- The "Brain loop" is currently a manual operating pattern.

The system has governance memory but not governance motion. This WO adds the first link in the chain: a read-only scheduled pulse that makes the current state observable without requiring a human to manually run CLI commands.

---

## Precision on mutation scope

**The IMPLEMENTATION creates four governance/tooling files.** That is a repo write.

**The PULSE MECHANISM is read-only.** After those four files are committed, every invocation of the pulse (local or scheduled GHA) produces zero staged changes, zero commits, zero PRs, zero queue mutations, zero canon changes.

Correct close statement:
> WO-0118 creates a read-only scheduled pulse/reporting loop. The implementation modifies four governance/tooling files. After those files are committed, the pulse mechanism itself does not mutate any repo state.

## Objective

Create one scheduled, read-only status mechanism that checks repo and Brain state on a fixed cadence and produces a single report. The implementation files are a governed write. The pulse behavior is not.

```
monitoring ≠ deciding
deciding   ≠ executing
executing  ≠ merging
```

---

## Scope

### This WO does

- Create `scripts/brain/brain-pulse.mjs` — a Node.js script that calls existing Brain CLI commands (`brain status`, `brain drift`, `brain gates`) and git, reads control panel spec and next-queue.json, and formats a markdown report.
- Create `.github/workflows/brain-pulse.yml` — a scheduled GHA workflow (weekdays 9 AM PT + `workflow_dispatch`) that runs the pulse script, saves the report as an artifact, and writes to the GitHub Step Summary.

### This WO does not do

- Edit any product code (`backend/`, `frontend/`, `os-platform/`, `marketplace/`).
- Edit any canon files (`docs/brain/canon/**`).
- Activate any of the 7 paused control panel automation lanes.
- Create work orders or modify queue truth.
- Push commits, open pull requests, or post issue comments.
- Grant write permissions to any GHA workflow.
- Trigger downstream automation.

---

## Deliverables

| Deliverable | Path |
|-------------|------|
| Pulse script | `scripts/brain/brain-pulse.mjs` |
| Scheduled workflow | `.github/workflows/brain-pulse.yml` |
| Brain WO | `docs/brain/workorders/active/WO-0118-control-plane-activation-read-only-pulse.md` |
| Operations packet | `operations/packets/WO-0118-CONTROL-PLANE-PULSE.md` |

---

## What the pulse checks

| Check | How |
|-------|-----|
| Git dirty file count | `git status --porcelain` |
| Current branch + last commit | `git log --oneline -1` |
| Brain status | `brain.mjs status` |
| Open P0/P1 drift rows | `brain.mjs drift` (filtered) |
| Release gates excerpt | `brain.mjs gates` (first 35 lines) |
| Open WO count + list | `readdirSync(docs/brain/workorders/active/)` |
| Control panel lane statuses | `ops/control-panel/control-panel.spec.json` |
| Next queued action | `docs/brain/canon/next-queue.json` |

## What the pulse outputs

| Output | Where | Mutation? |
|--------|-------|-----------|
| Markdown report | stdout | No |
| `pulse-latest.md` | `.terrafusion/context/pulse-latest.md` | Context only |
| Workflow artifact | GHA run → Artifacts → `brain-pulse-NNN` | No repo mutation |
| Step summary | GHA run → Summary tab | No repo mutation |

---

## Authority Boundary

- Workflow permissions: `contents: read` only.
- The pulse observes. Human decides. A separate WO (operator-issued) executes.
- The pulse does not post to issues, create PRs, or trigger other workflows.

---

## Validation Plan

| Check | Method | Pass condition |
|-------|--------|----------------|
| Script runs locally | `node scripts/brain/brain-pulse.mjs` | Exits 0, prints report |
| No staged changes | `git status --porcelain` after pulse run | Zero staged files |
| YAML validity | `yamllint` or GHA parse | No syntax errors |
| Workflow permissions | Inspect `brain-pulse.yml` | Only `contents: read` |
| Brain check | `pnpm brain check` | Still green after changes |
| Diff review | `pnpm brain review-diff --workorder WO-0118` | PROCEED |

---

## Pre-existing Brain check failures (baseline — NOT introduced by WO-0118)

| Gate | Pre-existing failure |
|------|---------------------|
| `write-lanes` | 6 violations in `terrapilot.tools.json` — reserved-suite tools forward-staged per ADR-0014 |
| `hardcoded-ports` | 5 hits in `.claude/settings.local.json` — local dev Bash permissions, pre-existing |

WO-0118 must not worsen these. It is not responsible for fixing them. Close language must say "no new regressions" — not "check passed."

## Evidence Required to Close

- Log tail of `node scripts/brain/brain-pulse.mjs` showing all 8 report sections populated
- `git status --porcelain` after pulse run: zero staged changes (4 intended new untracked files only)
- `pnpm brain check`: same 2 pre-existing failures, no new failures introduced
- GHA workflow YAML valid (no syntax errors)
- First GHA run artifact uploaded OR local run artifact (`pulse-report.md`) reviewed

---

## Human Decisions Deferred

These are explicitly out of scope for WO-0118:

1. Whether to activate any of the 7 paused control panel automation lanes.
2. Whether the pulse report should be posted as a GitHub issue comment (requires `issues: write` — not in this WO).
3. Whether additional Brain commands (`brain release`, `brain next`) should be added to future pulse iterations.
4. Scheduling cadence adjustments (currently weekdays 9 AM PT).
5. Step 2 of the activation plan: human approval gate UI.
6. Step 3: bounded WO execution handoff mechanism.

---

## Next Safe Action (after operator review)

Verify locally:

```bash
node scripts/brain/brain-pulse.mjs
git status --porcelain   # must show no staged changes
pnpm brain check
pnpm brain review-diff --workorder WO-0118
```

If all pass: commit the four files, open PR from `codex/ops-control-panel-seed` to main, merge.

Then: push to GitHub and confirm first GHA workflow run completes with artifact.
