# Codex / Claude Code Parity Matrix

## Required parity features

| Baseline capability | TerraFusion implementation |
|---|---|
| Threads/sessions | Canon Task sessions |
| Worktrees | Canon Worktree Manager |
| Built-in Git diff | CanonDiffPanel + Git Runtime |
| Stage/revert hunks | Git Runtime + UI controls |
| Commit/push/PR | Git Agent with gate/trace blocks |
| Integrated terminal | Command Runner with policy |
| Subagents | Explorer, Planner, Implementer, Reviewer, Governor, Fixer, Git Agent |
| Hooks | Canon Hooks |
| Skills | `.terrafusion/skills/*` |
| MCP/connectors | Connector trust tiers |
| CI usage | `tf canon` CLI |
| Memory | sourced Canon Notebook facts |
| Review | semantic diff + governance review |

## TerraFusion advantage

```txt
Codex: executes code tasks.
Claude Code: coordinates agentic coding.
TerraFusion Canon/IDE: executes, coordinates, governs, proves.
```

## Non-negotiable differentiator

Every applied task must leave:

- bounded plan
- permission record
- diff
- gate results
- approvals
- evidence bundle
- trace seal
