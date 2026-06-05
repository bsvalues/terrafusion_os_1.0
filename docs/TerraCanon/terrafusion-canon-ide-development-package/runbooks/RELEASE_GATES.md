# Release Gates

## P0 release gate

Canon/IDE may be called MVP only when:

- os-canon shell compliance passes.
- Canon Runtime can query rules by task/path.
- Agent task state machine blocks illegal transitions.
- Hooks block forbidden edits/commands.
- Worktree manager isolates a task.
- Gate runner executes required gates.
- Evidence bundle is generated and sealed.
- Git/PR summary is prepared.
- Standalone cannot mutate production county runtime state.

## P1 release gate

- UI panels wired to live runtime.
- CLI supports query/plan/gates/trace.
- Semantic diff explains Canon risk.
- Command outputs are redacted.
- Manual approval records are persisted.

## P2 release gate

- Canon Desktop shell.
- Connector trust tiers.
- Optional MCP adapters.
- Remote/cloud execution, if approved.
