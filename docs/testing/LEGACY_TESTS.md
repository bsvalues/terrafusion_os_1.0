# Legacy Integration Tests

## Overview

TerraFusion OS has several integration test classes that require a running API server to function. These tests are marked with `[Trait("Category", "Legacy")]` and are **excluded from normal CI runs**.

## Affected Test Classes

| Test Class | Location | Count | Reason |
|------------|----------|-------|--------|
| `AIAssistantControllerTests` | `TerraFusion.AI/Tests/` | 21 | Uses `WebApplicationFactory<Program>` which requires full API stack |
| `WorkflowAutomationControllerTests` | `TerraFusion.AI/Tests/` | 12 | Uses `WebApplicationFactory<Program>` which requires full API stack |
| `IntegrationTests` | `TerraFusion.AI/Tests/` | 2 | Requires `IPropertyValuationService` with real implementations |

## How to Run

### Exclude Legacy Tests (Default)
```bash
# Run only unit tests (excludes legacy)
dotnet test --filter "Category!=Legacy"

# This is the default for CI
dotnet test src/TerraFusion.AI/TerraFusion.AI.csproj --filter "Category!=Legacy"
```

### Run Legacy Tests Only
```bash
# Requires running API on localhost:5000
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj &

# Then run legacy tests
dotnet test --filter "Category=Legacy"
```

## Future Work

These tests should be refactored to:
1. Use proper mocking instead of `WebApplicationFactory`
2. Split into true unit tests and explicit E2E tests
3. Move E2E tests to a separate `TerraFusion.E2E.Tests` project

## CI Behavior

- **gpt-rag.yml**: Excludes legacy tests via `--filter "Category!=Legacy"`
- **gate-f-validate-all.sh**: Should use the same filter

---

*Government. Transcended. - Clean tests, confident commits.*
