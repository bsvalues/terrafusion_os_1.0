# TerraFusion Agent Skills Pack

The skills in `.terrafusion/skills/` encode repeatable operating discipline.

## Required skills

- `using-canon`
- `truth-gate`
- `writing-bounded-plans`
- `executing-bounded-plans`
- `using-worktrees`
- `requesting-canon-review`
- `sealing-evidence`
- `finishing-a-terrafusion-branch`

## Invocation rule

Every engineering task should start with:

```txt
Use using-canon and truth-gate. Do not edit files until Canon context, scope, allowed paths, forbidden paths, and gates are established.
```

## Anti-expansion rule

Agents must explicitly list:

- what will be changed
- what will not be changed
- what is deferred
- what would require a new task
