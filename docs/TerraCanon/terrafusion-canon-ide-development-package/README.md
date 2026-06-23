# TerraFusion Canon/IDE Development Package

**Package version:** 0.1.0  
**Prepared:** 2026-06-05  
**Product thesis:** Canon is the law. IDE is the workbench. Agents are permissioned executors. TerraTrace is proof.

This package turns the TerraFusion Canon/IDE discussion into a copyable development bundle:

- Product and architecture specs
- Canon Runtime API contracts
- Agent Runtime state machine
- engineering write-lane policies
- launch/surface contract policies
- hooks, gates, trace, Git/worktree contracts
- TypeScript skeletons for the shared runtime
- UI component skeletons for `os-canon`
- CLI/desktop boundary specs
- acceptance gates and implementation runbooks
- reusable TerraFusion agent skills

## Use order

1. Read `docs/01_MASTER_DEVELOPMENT_PACKAGE.md`.
2. Run the non-destructive truth gate in `runbooks/TRUTH_GATE.md`.
3. Copy/adapt `config/`, `schemas/`, and `src/os-platform/` into the TerraFusion repo.
4. Implement the first vertical slice in `runbooks/FIRST_VERTICAL_SLICE.md`.
5. Only then build out desktop/standalone UI.

## Design rule

There is **one shared runtime** and multiple surfaces:

```txt
Canon Runtime       = law, rules, gates, trace, risk, policy
os-canon            = in-OS constitutional command center
Canon Desktop       = standalone developer/repair shell
tf canon CLI        = headless/CI/pre-commit surface
TerraFusionIDE      = editor/workbench consuming Canon Runtime
```

Standalone Canon is powerful, but never sovereign. It may modify source code and prepare PRs; it must not mutate production county runtime records or bypass TerraPilot/TerraTrace.

## First proof target

The first vertical slice is:

```txt
Fix os-canon shell launch drift.
```

Acceptance:

1. Load Launch / Surface Contract.
2. Identify `os-canon` as OS Core / OS Feature / near-full-stage / in-shell.
3. Generate bounded plan.
4. Create isolated worktree.
5. Edit only approved files.
6. Show semantic diff + risk.
7. Run type-check + launch surface contract gate.
8. Generate evidence bundle.
9. Seal trace.
10. Prepare commit/PR summary.
```

