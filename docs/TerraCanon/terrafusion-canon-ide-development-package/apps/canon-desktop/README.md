# TerraFusion Canon Desktop

Standalone developer/repair shell.

## Purpose

- open local TerraFusion repo
- create isolated task worktrees
- run Canon rules
- edit approved source files
- run gates
- prepare commits/PRs
- generate engineering evidence bundles

## Boundary

Canon Desktop is not TerraFusion OS. It cannot directly mutate production county runtime records.

## Required runtime dependency

Canon Desktop must import and use:

```txt
os-platform/canon
os-platform/agents
os-platform/gates
os-platform/trace
os-platform/git
```

It must not implement independent governance logic.
