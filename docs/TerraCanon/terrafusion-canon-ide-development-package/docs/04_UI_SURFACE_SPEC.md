# os-canon UI Surface Specification

## Surface type

```txt
Target ID: os-canon
Surface Type: OS Feature
Sizing: Near-full-stage
Owner: OS Core
Launch: activateModule("os-canon")
Forbidden: full-page route that loses Dock or Top Bar
```

## Layout

```txt
┌────────────────────────────────────────────────────────────────────────┐
│ TerraFusion OS Top Bar                                                 │
├────────────────────────────────────────────────────────────────────────┤
│ Dock │ Canon Workbench                                                 │
│      ├───────────────┬───────────────────────────────┬────────────────┤
│      │ Repo/Canon    │ Plan / Editor / Diff / Gates  │ Agent/Trace    │
│      │ Rules/Paths   │ Terminal / Test Output        │ Risk/Approval  │
│      └───────────────┴───────────────────────────────┴────────────────┘
└────────────────────────────────────────────────────────────────────────┘
```

## Required panels

### CanonTaskComposer

Captures intent, desired scope, risk tolerance, and surface mode.

### CanonRulePanel

Shows relevant Canon rules, source references, allowed paths, forbidden paths, and required gates.

### CanonPlanPanel

Shows bounded plan before any edit.

### CanonDiffPanel

Shows Git diff plus semantic Canon risk:

```txt
File changed
Rule touched
Risk level
Required gate
Reviewer requirement
```

### CanonGatePanel

Runs and displays required gates.

### CanonTracePanel

Shows evidence bundle, trace hash, approvals, commands, files read/changed.

### CanonAgentStack

Shows Explorer, Planner, Implementer, Reviewer, Governor, Fixer, Git Agent.

### CanonApprovalPanel

Blocks progression when risk or command policy requires approval.

## UI behavior rules

- No file edit until Canon context is loaded.
- No apply until plan is approved when risk is Medium or higher.
- No commit until required gates pass or an explicit exception is recorded.
- No PR until evidence bundle exists.
- No standalone runtime mutations from desktop surface.
