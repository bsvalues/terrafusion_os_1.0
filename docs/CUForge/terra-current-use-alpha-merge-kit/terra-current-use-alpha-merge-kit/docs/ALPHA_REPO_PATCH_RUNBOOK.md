# Current Use Alpha Repo Patch Runbook

## Step 1 — Create Branch

```bash
git checkout -b feat/current-use-alpha
```

## Step 2 — Add Frontend Core

Copy the phase1 frontend module.

Run:

```bash
pnpm exec tsc --noEmit
```

Fix imports only.

## Step 3 — Add Backend Core

Copy backend module.

Run:

```bash
dotnet build
```

Fix namespace and DI issues only.

## Step 4 — Add Tests

Add rollback hardening tests.

Run:

```bash
dotnet test --filter CurrentUse
pnpm test -- current-use
```

## Step 5 — Add Policy + Trace

Wire policy and trace panels/endpoints.

## Step 6 — Add Security + Observability

Wire RBAC and diagnostics.

## Step 7 — Demo

Run the demo validation script.

## Rule

No expansion slices until this branch is green.
