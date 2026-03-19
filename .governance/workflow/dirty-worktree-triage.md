# Dirty Worktree Triage (CP-TRIAGE-1)

Date: 2026-03-19  
Branch: `post-r3/w5f-registry-edge-cleanup`

## Purpose

Classify all current dirty and untracked paths into explicit lanes so no mixed-scope commit is produced.

## Snapshot (Pre-Classification)

Observed from `git status --short` during triage execution:

- `M .governance/workflow/plan.md`
- `M .governance/workflow/progress.md` (after Phase A reconciliation edits)
- `M .gitignore`
- `?? docs/superpowers/plans/2026-03-18-phase5-workbench-completeness.md`
- `?? docs/superpowers/plans/2026-03-18-phase9b-10-11-explain-hitl-sovereign.md`
- `?? .claude/agents/`
- `?? .claude/settings.json`
- `?? .claude/settings.local.json`
- `?? backend/tests/TerraFusion.Integration.Tests/TestResults/`
- `?? backend/tests/TerraFusion.Tests.Unit/TestResults/`
- `?? backend/tests/TerraFusion.Unit.SmokeTests/TestResults/`
- `?? backend/tests/TerraFusion.Unit.Tests/TestResults/`

## Lane Classification

| Lane | Paths | Classification | Writer allowed | Notes |
|------|-------|----------------|----------------|-------|
| `WF-A` | `.governance/workflow/plan.md`, `.governance/workflow/progress.md` | Active governance reconciliation | Yes (docs lane only) | Tracks CP-W9-A and this triage closure |
| `WF-C` | `docs/superpowers/plans/2026-03-18-phase5-workbench-completeness.md`, `docs/superpowers/plans/2026-03-18-phase9b-10-11-explain-hitl-sovereign.md` | Docs plan artifacts | Conditional | Keep separate from product execution |
| `GIT-1` | `.gitignore` | Repo hygiene/config drift | Conditional | Treat as dedicated lane; do not silently bundle |
| `DAIS-1` | none dirty | Closed | No active writer lane | Previously dirty Dais lane absorbed by `862e8de61` |
| `PILOT-BE-1` | none dirty | Closed | No active writer lane | Previously dirty backend Pilot lane absorbed by `862e8de61` |
| `LOCAL-1` | `.claude/**`, `backend/tests/**/TestResults/` | Local artifacts | No product writer | Never batch with governance/product code |

## Decisions

1. Dais and backend Pilot are not active dirty lanes anymore and are treated as closed unless new drift appears.
2. Current actionable work is governance-only (`WF-A`) plus optional handling of docs/hygiene artifacts (`WF-C`, `GIT-1`, `LOCAL-1`).
3. `LOCAL-1` remains excluded from any merge-bound product or governance commit.

## Proof Commands

```powershell
git status --short
rg -n "WF-A|WF-C|GIT-1|DAIS-1|PILOT-BE-1|LOCAL-1" .governance/workflow/dirty-worktree-triage.md
```

## Closure

Checkpoint: `CP-TRIAGE-1` (docs/evidence-only closure)
