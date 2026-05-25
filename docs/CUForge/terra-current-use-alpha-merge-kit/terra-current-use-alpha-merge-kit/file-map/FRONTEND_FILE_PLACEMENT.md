# Frontend File Placement

## Core

Copy:

```txt
terra-current-use-phase1/src/modules/terra-current-use
```

To:

```txt
src/modules/terra-current-use
```

## Tab Registration

Add:

```txt
terra-current-use-composition-release/frontend/routes/propertyWorkbenchTabRegistration.tsx
```

To your actual Property Workbench tab registry.

## Alpha Panels To Enable

- `CurrentUseWorkbenchTab`
- `CurrentUseTracePanel`
- `CurrentUsePolicyGovernancePanel`
- `CurrentUseDiagnosticsPanel`

## Feature Flags

Copy:

```txt
frontend/config/currentUseFeatureFlags.ts
```

Set:

```ts
coreWorkbench: true
rollbackCalculator: true
notices: true
terraTraceAudit: true
policyGovernance: true
securityRbac: true
observability: true
```

Everything else false.
