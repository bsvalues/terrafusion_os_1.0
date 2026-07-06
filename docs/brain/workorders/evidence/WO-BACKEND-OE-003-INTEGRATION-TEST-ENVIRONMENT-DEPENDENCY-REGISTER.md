# WO-BACKEND-OE-003 - Integration Test Environment Dependency Register

| Field | Value |
|-------|-------|
| Work Order | `WO-BACKEND-OE-003` |
| Program | Backend Operational Excellence |
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Mode | Evidence/register documentation |
| Base | `origin/main` at `2788f9d0256472dc476426cb5065acdeba5f9833` |
| Runtime code changed | No |
| Backend code changed | No |
| Docker/Testcontainers executed | No |
| Secrets/county/PACS/live DB touched | No |

## Objective

Classify the Docker/Testcontainers dependency that blocked the full backend solution test pass during
the Backend Operational Excellence baseline.

This packet separates integration-environment prerequisites from backend warning debt, unit-test
health, and backend runtime defects.

## Baseline Evidence

From `WO-BACKEND-OE-001` and `WO-BACKEND-OE-002`:

- `dotnet build backend/TerraFusion.sln` (Windows equivalent: `backend\TerraFusion.sln`): PASS,
  `0 Warning(s)`, `0 Error(s)`.
- `dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj`: PASS, 3471 passed.
- `dotnet test backend/TerraFusion.sln --no-build`: 2244 passed, 29 failed, 4 skipped.
- The 29 full-solution failures were classified as Docker/Testcontainers SQL Server dependency
  failures in Sync/Atlas integration tests, not build warnings.
- API test execution had a separate transient Windows file-lock blocker on
  `MvcTestingAppManifest.json`; that is not warning debt and is not the Docker/Testcontainers lane.

## Affected Test Lane

| Area | Evidence | Classification |
|------|----------|----------------|
| Integration test project | `backend/tests/TerraFusion.Integration.Tests/TerraFusion.Integration.Tests.csproj` references `Testcontainers`, `Testcontainers.PostgreSql`, and `Testcontainers.MsSql` | Docker/Testcontainers-capable integration lane |
| SQL Server fixture | `backend/tests/TerraFusion.Integration.Tests/Sync/Fixtures/SqlServerFixture.cs` uses `Testcontainers.MsSql` and `MsSqlBuilder` | Requires Docker and SQL Server-compatible container |
| SQL Server image | `SqlServerFixture` uses `mcr.microsoft.com/azure-sql-edge:latest` | Requires container image availability and Docker runtime |
| Sync metadata tests | `Sync/SqlServerMetadataReaderIntegrationTests.cs` is tagged `Category=DockerRequired` | Docker-required integration slice |
| Atlas deep-profile reader tests | `Sync/Atlas/SqlServerDeepProfileReaderIntegrationTests.cs` is tagged `Category=DockerRequired` | Docker-required integration slice |
| Atlas orchestrator tests | `Sync/Atlas/DeepProfileOrchestratorIntegrationTests.cs` is tagged `Category=DockerRequired` | Docker-required integration slice |
| PostgreSQL infrastructure tests | `PostgresContainerTests.cs` uses `DockerRequiredFact` and skips when Docker is unavailable | Docker-required infra validation with skip guard |
| Vector query tests | `VectorQueryIntegrationTests.cs` uses a pgvector Testcontainer and `DockerRequiredFact` | Docker-required vector integration slice |
| Test documentation | `backend/tests/README.md` identifies integration tests as containerized and requiring Docker runtime | Existing doc already treats this lane as opt-in/containerized |

## Dependency Classification

| Question | Answer |
|----------|--------|
| Which tests require Docker/Testcontainers? | Sync/Atlas SQL Server fixture tests, PostgreSQL container tests, and vector query container tests. |
| Which projects are affected? | `backend/tests/TerraFusion.Integration.Tests/TerraFusion.Integration.Tests.csproj`. |
| Is SQL Server container required? | Yes. Sync/Atlas SQL Server tests use `SqlServerFixture`, `Testcontainers.MsSql`, and `mcr.microsoft.com/azure-sql-edge:latest`. |
| Are secrets required? | No evidence found. The fixture creates local synthetic container databases. |
| Is PACS access required? | No evidence found in the inspected Testcontainers lane. |
| Is county data required? | No evidence found. The inspected tests use seeded/synthetic container state. |
| Are live services required? | No evidence found. The dependency is local Docker/Testcontainers runtime and image availability. |
| Is this a backend build defect? | No. Canonical backend build is zero-warning and zero-error. |
| Is this warning debt? | No. The full solution blocker is environmental/test-lane dependency, not compiler warning debt. |
| Is this a release-gate concern? | Yes, but only for the integration-test lane. Release readiness must either require a Docker-capable integration lane or document a segmented gate. |

## Verdict

The Docker/Testcontainers failure class is a **documented prerequisite and segmented integration lane
candidate**.

It is not currently classified as:

- warning debt,
- canonical backend build failure,
- unit test failure,
- backend runtime defect,
- production readiness proof,
- or authorization to weaken/exclude tests.

It remains a release-discipline concern because backend release gates need an explicit rule for when
the containerized integration lane must run and what a pass/fail means.

## Recommended Lane Treatment

| Option | Verdict | Rationale |
|--------|---------|-----------|
| Documented prerequisite | Yes | Integration tests require Docker runtime and Testcontainers image access. |
| Segmented CI lane | Recommended follow-up | Containerized integration tests should be separate from canonical build/unit lanes. |
| Local-only integration lane | Possible, but not enough for release readiness | Useful for developer proof, but release gates need explicit CI or operator evidence. |
| Repair target | Not in this WO | No backend defect is proven by Docker/Testcontainers unavailability alone. |
| Release-gate blocker | Conditional | Blocks claims of full backend integration-test readiness, not zero-warning build readiness. |

## Release-Gate Implication

Backend release readiness should eventually include a containerized integration-test gate with one of
these policy-backed outcomes:

- Docker/Testcontainers-capable CI lane runs and passes.
- Operator-run local integration evidence is accepted for a non-production release candidate.
- The lane is explicitly deferred with a release-blocker label and no production-readiness claim.

Until that policy exists, the backend can claim:

- build: PASS,
- warnings: 0,
- unit baseline: PASS,
- full integration lane: not release-proven.

## Explicit Non-Claims

This packet does not claim:

- full backend solution test pass,
- production readiness,
- Docker/Testcontainers repair,
- CI lane wiring,
- test exclusion authority,
- runtime/backend behavior change,
- or health/readiness/security/migration release proof.

## Validation

Planned validation for this evidence packet:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Confirm changed files are docs/governance/evidence only.
- Confirm no backend/runtime/tools implementation files changed.

## Next Recommended Work Order

`WO-BACKEND-OE-004 - Health and Readiness Semantics Proof`

Reason:

- The Docker/Testcontainers lane is now classified as an integration-environment prerequisite.
- Canonical build warning debt is closed at zero warnings.
- The next highest-value Backend OE gap is to make health/readiness endpoint semantics explicit and
  release-gate usable.

## Stop Type

`BACKEND_INTEGRATION_DEPENDENCY_REGISTER_READY_FOR_PR`
