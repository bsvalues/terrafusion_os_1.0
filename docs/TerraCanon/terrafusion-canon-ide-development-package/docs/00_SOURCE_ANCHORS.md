# Source Anchors Used by This Package

This package is grounded in the current TerraFusion architecture corpus and modern agent-IDE baselines.

## TerraFusion architecture anchors

- **Launch / Surface Contract:** `Desktop: Canon → os-canon → OS Feature → Near-full-stage → OS Core`; OS features must not navigate away from the shell or lose Dock/Top Bar.
- **AINGL:** SystemGPT, AuditGPT, ExplainGPT, Plan/Apply, AI NoteBook, Adaptive UX, multi-agent governance, diagnostics, patch/PR generation, evidence tracking.
- **Suite Constitution:** single-write-owner matrix, TerraTrace as OS audit spine, TerraGPT actions routed through approved TerraPilot tools, automated enforcement via hooks/CI/SEAL.
- **Platform Separation:** OS platform services live under `os-platform`; TerraFusionIDE is a tool/workbench surface, not the constitutional authority.
- **Shell Integrity Recovery:** wiring-first recovery; register OS features as lazy modules and launch with `activateModule(id)` rather than route navigation.
- **v4.2 Execution Discipline:** Truth Gate first, no repo-wide crusades, no hidden rebuilds, preserve shell/workbench contract, visible honesty for mock/stub behavior.

## Competitor baseline anchors

- Codex-class parity requires local/worktree/cloud task modes, isolated worktrees, built-in Git diff review, staging/revert, commit/push/PR flow, and integrated terminal.
- Claude Code-class parity requires hooks, subagents, skills, MCP/connectors, permissioned tools, sessions, and codebase command execution.

## TerraFusion differentiator

Codex and Claude Code optimize coding. Canon/IDE must optimize **governed completion**:

```txt
Intent → Canon Context → Bounded Plan → Risk → Approval → Worktree → Diff → Gates → Evidence → Trace → Commit/PR
```
