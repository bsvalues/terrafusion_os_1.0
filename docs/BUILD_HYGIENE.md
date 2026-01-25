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

## PR Hint Single-Source System

PR failure comments include contextual hints (e.g., "drift guard" rerun instructions).
This logic is **single-sourced** in a tested helper, not inline YAML heuristics.

### Where It Lives

| Component | Path |
|-----------|------|
| Helper | `backend/tools/TerraFusion.CiHints/CiFailureHint.cs` |
| CLI tool | `backend/tools/TerraFusion.CiHints/Program.cs` |
| Unit tests | `backend/tests/TerraFusion.Unit.Tests/CI/CiSummaryHintTests.cs` |
| Workflow invocation | `.github/workflows/ci-verified.yml` (calls `dotnet run --project ... CiHints.csproj`) |

### What the Guard Enforces

The `hint_drift_guard` job in `.github/workflows/ci.yml` runs two checks:

1. **Negative guard**: Fails if `ci-verified.yml` contains inline `contains(drift|guard)` patterns.
2. **Positive guard**: Fails if `ci-verified.yml` stops referencing `TerraFusion.CiHints.csproj`.

### How to Update Safely

1. Edit `CiFailureHint.Decide()` in the helper.
2. Add/update tests in `CiSummaryHintTests.cs`.
3. Run `dotnet test TerraFusion.sln -c Release -v:minimal --nologo`.
4. Never add `contains('drift')` or `contains('guard')` patterns to YAML.

### How to Validate

```bash
# Run hint logic tests
dotnet test backend/tests/TerraFusion.Unit.Tests -c Release --filter "CiSummaryHintTests"

# Verify guards pass locally
grep -nEi "contains\([^)]*(drift|guard)" .github/workflows/ci-verified.yml && echo "FAIL" || echo "PASS"
grep -q "TerraFusion\.CiHints\.csproj" .github/workflows/ci-verified.yml && echo "PASS" || echo "FAIL"
```
