# WO-0118 — Control Plane Activation: Read-Only Pulse

- **Risk:** R2 (new script + GHA workflow; zero mutation to product code) · **Suite:** OS governance / Build · **Agent:** Claude Code / Codex
- **Surface:** `scripts/brain/brain-pulse.mjs` + `.github/workflows/brain-pulse.yml`
- **Authorized by:** Human operator verbal approval 2026-06-23 — "Authorize a read-only Control Plane Activation WO"
- **Goal:** Turn the manual Brain CLI + markdown-only governance loop into a scheduled, observable pulse. A scheduled job runs read-only status checks and produces a single report. Nothing executes without operator approval.

## Precision on mutation scope

**The IMPLEMENTATION creates four governance/tooling files** (listed below). That is a repo mutation.

**The PULSE MECHANISM is read-only**: after those files are committed, every run of the pulse (locally or via GHA schedule) produces zero staged changes, zero commits, zero PRs, zero queue mutations, zero canon changes.

The correct close statement is:
> WO-0118 creates a read-only scheduled pulse/reporting loop. The implementation modifies four governance/tooling files. After those files are committed, the pulse mechanism itself does not mutate any repo state.

## Separation of concerns (non-negotiable)

```
monitoring ≠ deciding
deciding   ≠ executing
executing  ≠ merging
```

The pulse is monitoring only. It may observe, report, and recommend. It may NOT execute, mutate, open PRs, create WOs, or promote canon.

## Files allowed

```
scripts/brain/brain-pulse.mjs          (new — read-only pulse collector)
.github/workflows/brain-pulse.yml      (new — scheduled GHA workflow)
ops/packets/WO-0118-CONTROL-PLANE-PULSE.md          (new — operations packet)
docs/brain/workorders/active/WO-0118-control-plane-activation-read-only-pulse.md  (this file)
```

## Forbidden files

- ALL product code (`backend/**`, `frontend/**`, `os-platform/**`, `marketplace/**`)
- ALL canon files (`docs/brain/canon/**`) — read-only access only
- ALL work order files except this one
- `.github/AGENT_ENTRYPOINT.md`
- Any file not in the allowed list above

## What the pulse checks (read-only)

| Check | Source | Method |
|-------|--------|--------|
| Git dirty state | `git status --porcelain` | subprocess |
| Current branch + last commit | `git log --oneline -1` | subprocess |
| Brain status | `brain.mjs status` | subprocess |
| Open P0/P1 drift rows | `brain.mjs drift` | subprocess, filtered |
| Release gates (first 35 lines) | `brain.mjs gates` | subprocess, truncated |
| Open WO count + list | `docs/brain/workorders/active/` | `readdirSync` |
| Control panel lane statuses | `ops/control-panel/control-panel.spec.json` | JSON read |
| Next queued action | `docs/brain/canon/next-queue.json` | JSON read |

## What the pulse outputs

| Output | Destination | Mutation? |
|--------|-------------|-----------|
| Markdown report | stdout | No |
| `pulse-latest.md` | `.terrafusion/context/pulse-latest.md` | Context file only — not canon |
| Workflow artifact | GitHub Actions run artifacts | No repo mutation |
| Step summary | GitHub Actions step summary | No repo mutation |

## Scheduling

- **GHA schedule:** `cron: '0 16 * * 1-5'` (weekdays 9 AM PT / 16:00 UTC)
- **Manual trigger:** `workflow_dispatch`
- **Local trigger:** `node scripts/brain/brain-pulse.mjs`

## Acceptance criteria

- [ ] `node scripts/brain/brain-pulse.mjs` runs without error and prints a markdown report
- [ ] Report contains all 8 check sections
- [ ] No git changes are staged or committed by the pulse
- [ ] `.github/workflows/brain-pulse.yml` is valid YAML and passes `actions/checkout`
- [ ] Workflow permissions are `contents: read` only — no write permissions
- [ ] `brain review-diff --workorder WO-0118` = PROCEED
- [ ] `brain check` remains green after changes

## Rollback

Docs-only + two new files. Revert by deleting:
- `scripts/brain/brain-pulse.mjs`
- `.github/workflows/brain-pulse.yml`
- `ops/packets/WO-0118-CONTROL-PLANE-PULSE.md`

## Stop conditions

- Any check requires reading production secrets or credentials → STOP, escalate
- GHA workflow requires `write` permissions to function → STOP, redesign
- The pulse begins creating WOs, pushing commits, or opening PRs → STOP, this is a scope violation

## Pre-existing Brain check failures (baseline — NOT introduced by WO-0118)

These failures existed before this WO was created. WO-0118 must not worsen them, but is not responsible for fixing them:

| Gate | Failure | Pre-existing cause |
|------|---------|-------------------|
| `write-lanes` | 6 violations in `terrapilot.tools.json` (treasury/clerk reserved tools) | Forward-staged tools recorded in `canon/reserved-staging.json`; exempted via `scripts/spec-gates/reserved-staging-exception.mjs` (ADR-0014). Gate red by design until activation. |
| `hardcoded-ports` | 5 hits in `.claude/settings.local.json` (localhost:5000 in Bash permission strings) | Pre-existing local dev permissions; `.claude/settings.local.json` is local-only config. |

**Correct close language:** "WO-0118 introduced no new gate regressions. Pre-existing failures remain as documented above."

Do not write "brain check passed" if it did not fully pass.

## Evidence required to close

- Log tail of `node scripts/brain/brain-pulse.mjs` confirming all 8 sections populated
- `git status --porcelain` after pulse run showing zero staged changes (new untracked files are the 4 intended implementation files only)
- `pnpm brain check` output confirming same 2 pre-existing failures; no new failures
- GHA workflow YAML linted or first successful run artifact showing artifact uploaded

## Human decisions deferred (not in this WO)

- Whether to activate any of the 7 paused control panel automations (Daily Pulse, WO Tracker, etc.)
- Whether the pulse report should be posted as a GitHub issue comment (requires `issues: write` — not granted here)
- Whether `brain drift`, `brain release`, or additional commands should be added to future pulse iterations
- Scheduling cadence adjustments

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0118",
  "task": "Control Plane Activation: Read-Only Pulse",
  "risk": "R2",
  "suite": "OS governance / Build",
  "allowed_files": [
    "scripts/brain/brain-pulse.mjs",
    ".github/workflows/brain-pulse.yml",
    "ops/packets/WO-0118-CONTROL-PLANE-PULSE.md",
    "docs/brain/workorders/active/WO-0118-control-plane-activation-read-only-pulse.md"
  ],
  "forbidden_patterns": [
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "marketplace/**",
    "docs/brain/canon/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/brain/workorders/active/WO-0001*",
    "docs/brain/workorders/active/WO-0002*",
    "docs/brain/workorders/active/WO-0003*",
    "docs/brain/workorders/active/WO-0004*",
    "docs/brain/workorders/active/WO-0005*",
    "docs/brain/workorders/active/WO-0006*",
    "docs/brain/workorders/active/WO-0007*",
    "docs/brain/workorders/active/WO-0008*",
    "docs/brain/workorders/active/WO-0009*",
    "docs/brain/workorders/active/WO-0010*",
    "docs/brain/workorders/active/WO-0011*",
    "docs/brain/workorders/active/WO-0012*",
    "docs/brain/workorders/active/WO-0013*",
    "docs/brain/workorders/active/WO-LOCALOPS*"
  ]
}
```
