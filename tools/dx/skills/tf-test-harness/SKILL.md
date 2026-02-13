---
id: tf-test-harness
name: Test Orchestration Harness
version: 1.0.0
ownerLane: dev
riskLevel: read
triggers:
  - pre-pr
  - manual
  - evidence-pack
inputs:
  - test-scope
  - test-filter
outputs:
  - test-results
  - coverage-report
dependencies: []
tags: [testing, quality, ci, coverage, orchestration, government]
---

# Test Orchestration Harness

Comprehensive testing architecture for TerraFusion OS. Orchestrates 716+ tests across backend (.NET), frontend (React), DX spine (Node), and AI systems.

## Test Architecture

```
Test Pyramid
├── Unit Tests (fastest)
│   ├── Backend: xUnit + Moq
│   ├── Frontend: Jest + React Testing Library
│   └── DX Spine: Node test runner
├── Integration Tests
│   ├── Backend: EF Core InMemory + WebApplicationFactory
│   ├── Frontend: Playwright component tests
│   └── API: Supertest + contract validation
├── E2E Tests (slowest)
│   ├── Playwright: Full browser automation
│   └── Government workflow scenarios
└── Governance Tests
    ├── Spine Smoke: 101 infrastructure tests
    ├── Contract Drift: Golden snapshot validation
    └── Compliance: FISMA-HIGH control verification
```

## Test Locations

| Suite | Location | Runner | Count |
|-------|----------|--------|-------|
| Backend Unit | `backend/TerraFusion.API.Tests/` | `dotnet test` | ~200 |
| Frontend Unit | `frontend/tests/` | `npm test` | ~150 |
| E2E | `frontend/tests/e2e/` | `npx playwright test` | ~50 |
| Testing Suite | `os-platform/development/testing-suite/` | Mixed | 716 |
| Spine Smoke | `tools/dx/spine-smoke.mjs` | `node --test` | 101 |
| Contract Drift | `tools/dx/contract-drift.mjs` | `node` | 13 contracts |
| Security | `tools/dx/security-validation.test.mjs` | `node --test` | ~50 |
| TDC Unit | `tools/tdc/src/__tests__/` | `jest` | ~30 |

## Commands

```bash
# Run all tests
npm run test:all

# Backend tests
cd backend && dotnet test

# Frontend tests
cd frontend && npm test

# DX Spine tests
npm run test:dx-spine

# Governance tests
npm run governance:check

# E2E tests
cd frontend && npm run test:e2e

# Test with coverage
cd backend && dotnet test --collect:"XPlat Code Coverage"
cd frontend && npm run test:coverage
```

## Coverage Thresholds

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | 97% | ~91.9% |
| Branch Coverage | 90% | TBD |
| Function Coverage | 95% | TBD |
| Pass Rate | 100% | 91.9% |

## Government Testing Requirements

### FISMA-HIGH Test Requirements
- All security controls must have corresponding tests
- Authentication and authorization must be tested at every endpoint
- Audit logging must be verified for all data access
- Session management must be tested for timeout and invalidation
- Input validation must be fuzz-tested for all user-facing endpoints

### Compliance Test Tags
```csharp
// Backend: Tag tests with compliance requirements
[Trait("Compliance", "FISMA-HIGH")]
[Trait("Control", "AC-2")]
public async Task AccountManagement_EnforcesRoleBasedAccess() { }

[Trait("Compliance", "AU-2")]
public async Task AuditService_LogsAllDataAccess() { }
```

```typescript
// Frontend: Tag tests with accessibility requirements
describe('[WCAG 2.1 AA] Property Assessment Form', () => {
  it('1.3.1 - form inputs have associated labels', () => { });
  it('2.4.7 - focus is visible on all interactive elements', () => { });
});
```

## Integration with Evidence Pack

Test results feed directly into the Evidence Pack:
```json
{
  "testResults": {
    "total": 716,
    "passed": 658,
    "failed": 0,
    "skipped": 58,
    "passRate": 91.9
  },
  "coverage": {
    "line": 97.2,
    "branch": 94.1,
    "function": 98.5,
    "statement": 97.0,
    "meetsThreshold": true
  }
}
```

## Self-Healing Tests

TerraFusion uses AI-powered self-healing test architecture:
- Flaky tests are automatically retried with exponential backoff
- Test data fixtures are regenerated when schemas change
- Component snapshot tests auto-update on intentional changes
- E2E selectors are resilient using data-testid attributes
