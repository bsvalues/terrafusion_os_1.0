# Build Hygiene

To prevent warning regressions while keeping production builds flexible, test projects
are treated as warnings-as-errors only.

## Tests-Only Warning Gate

`backend/tests/Directory.Build.props` enforces:

```
TreatWarningsAsErrors=true
```

This applies to projects under `backend/tests/` and fails test runs if any new warnings
are introduced in test code.

## Local Validation

Run from repo root:

```
dotnet test TerraFusion.sln -c Release -v:minimal /nologo
```

This is the same command used in CI for the backend test gate.
