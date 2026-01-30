# Canonical .NET Testing Governance

> **Checkpoint:** `ci-governance-v1` (January 2026)

This document defines the canonical approach to .NET testing in TerraFusion OS CI.

## Canonical Test Command

All .NET tests run through this command:

```bash
dotnet test TerraFusion.sln -c Release -v:minimal --nologo
```

This is enforced in CI via the reusable workflow.

## Reusable Workflow Contract

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/dotnet-test.yml` | Canonical test execution (reusable) |
| `.github/workflows/ci.yml` | Orchestration + drift guards |
| `.github/workflows/ci-verified.yml` | PR failure comments + hints |

**Rule:** All workflows that run .NET tests MUST call `dotnet-test.yml`. Direct `dotnet test` calls are forbidden.

## Drift Guards

### 1. dotnet-test Drift Guard (`drift_guard` job)

- **Location:** `.github/workflows/ci.yml`
- **Enforces:**
  - No direct `dotnet test` calls in workflows (except `dotnet-test.yml`)
  - Required workflows must call `dotnet-test.yml`

### 2. Hint Drift Guard (`hint_drift_guard` job)

- **Location:** `.github/workflows/ci.yml`
- **Enforces:**
  - No inline `contains(drift|guard)` heuristics in `ci-verified.yml`
  - Must reference `TerraFusion.CiHints.csproj` (positive guard)

## Single-Source Locations

| What | Where |
|------|-------|
| Test execution logic | `.github/workflows/dotnet-test.yml` |
| PR hint logic | `backend/tools/TerraFusion.CiHints/CiFailureHint.cs` |
| Hint unit tests | `backend/tests/TerraFusion.Unit.Tests/CI/CiSummaryHintTests.cs` |
| Guard definitions | `.github/workflows/ci.yml` (jobs: `drift_guard`, `hint_drift_guard`) |

## How to Change

1. **Test behavior:** Edit `dotnet-test.yml` inputs/steps
2. **PR hints:** Edit `CiFailureHint.Decide()` + add tests
3. **Guard rules:** Edit guard steps in `ci.yml`

**Never:**
- Add `dotnet test` calls to workflows
- Add `contains('drift')` or `contains('guard')` to YAML
- Rename `TerraFusion.CiHints` without updating guards

## Validation

```bash
# Run all .NET tests
dotnet test backend/TerraFusion.sln -c Release -v:minimal --nologo

# Run hint tests only
dotnet test backend/tests/TerraFusion.Unit.Tests -c Release --filter "CiSummaryHintTests"

# Local guard checks
grep -rn "dotnet test" .github/workflows/ --include="*.yml" | grep -v "dotnet-test.yml"
grep -nEi "contains\([^)]*(drift|guard)" .github/workflows/ci-verified.yml
```
