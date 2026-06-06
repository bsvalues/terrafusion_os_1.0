# TerraFusion Canon/IDE Master Development Package

## 1. Product decision

Build **Canon Runtime** first. Then expose it through `os-canon`, Canon Desktop, CLI, and TerraFusionIDE.

```txt
Canon Runtime
  Shared law, policy, risk, gates, task state, trace, permissions.

os-canon
  In-shell OS Canon Workbench. Constitutional authority.

TerraFusion Canon Desktop
  Standalone developer/repair shell. Powerful but not sovereign.

tf canon CLI
  Headless/CI/pre-commit automation rail.

TerraFusionIDE
  Editor/diff/terminal workbench consuming Canon Runtime.
```

## 2. Non-negotiable architectural constraints

### OS-first

`os-canon` is an OS Feature and must open inside the shell, near-full-stage, with Dock and Top Bar preserved.

### Shared runtime

Do not create separate Canon engines for OS, desktop, and CLI. Surfaces consume the same runtime.

### Standalone is not sovereign

Standalone Canon can edit source code, manage worktrees, run gates, create commits/PRs, and generate proof. It cannot directly mutate production county records or bypass TerraPilot/TerraTrace.

### Canon is computable

Markdown doctrine is not enough. Agents need machine-readable rules:

```txt
getRulesForPath(path)
getRulesForTask(task)
getAllowedPaths(task)
getForbiddenPaths(task)
scoreDiff(diff)
explainViolation(ruleId)
```

### Agents are permissioned

No agent receives universal filesystem, terminal, Git, and network powers. Permissions are derived from Canon.

### Done requires proof

A task is not complete because an agent says it is complete. Done requires gates, diff, evidence, trace, and review.

## 3. System architecture

```txt
os-platform/
  canon/
    law, query, risk, diff, rule versioning

  agents/
    task state machine, permissions, hooks, tool runner, command policy, worktrees

  gates/
    build/test/contract/write-lane/evidence gates

  trace/
    evidence bundle, redaction, trace seal

  git/
    worktree, diff, stage, commit, PR helpers

frontend/apps/os-shell/src/modules/os-canon/
  in-shell Canon Workbench

apps/canon-desktop/
  standalone developer shell

cli/
  tf canon ...
```

## 4. P0 deliverables

1. `os-canon` shell compliance.
2. Canon Runtime MVP.
3. Engineering write-lane matrix.
4. Agent task state machine.
5. Hook runtime.
6. Tool/command permission model.
7. Worktree manager.
8. Gate runner.
9. Evidence bundle writer.
10. Git/PR integration.
11. os-canon workbench UI.

## 5. First vertical slice

Task: **Fix os-canon shell launch drift.**

The slice must exercise the whole runtime:

```txt
TaskComposer → CanonQuery → Plan → Risk → Approval → Worktree → Apply → Diff → Gates → Evidence → Trace → Commit/PR
```

## 6. Deferral list

Do not build these before the first vertical slice is complete:

- Full VS Code clone
- Multi-model marketplace
- Cloud autonomous execution
- Remote mobile control
- Voice interface
- General computer-use automation
- County production data connectors from standalone
- Plugin marketplace
- Runtime AI decisions for valuation/exemptions/appeals
