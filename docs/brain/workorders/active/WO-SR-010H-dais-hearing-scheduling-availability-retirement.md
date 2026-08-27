# WO-SR-010H - Dais Hearing Scheduling Availability Retirement

| Field | Value |
| --- | --- |
| Status | COMPLETE - PR #1473 merged as protected main `6291e58b11626ad04bdc89e736be89b2a574261c` |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded user/runtime surface retirement |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `acf4abc5959f468c6a43a00b09cead5d55679795` |
| Dependency | `WO-SR-010F` protected-main verified |
| Terminal condition | `DAIS_UNSUPPORTED_HEARING_SCHEDULING_NOT_OFFERED` |

## Objective

Stop offering the unsupported `schedule_boe_hearing` write after the sovereign endpoint was
truthfully retired. Remove the PropertyDais submission path and the governed Pilot capability,
office exposure, real handler, and maturity claim while preserving appeal hearing reads.

## Exact scope

1. `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
2. `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx`
3. `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx`
4. `os-platform/core/pilot/handlers.real.ts`
5. `os-platform/core/pilot/handlers.real.js`
6. `os-platform/core/pilot/office-registry.ts`
7. `os-platform/core/pilot/capability-map.md`
8. `os-platform/core/tests/dais-hearing-scheduling-unavailable.test.mjs`
9. `os-platform/core/tests/phase83-tools.test.mjs`
10. `tools/registry/terrapilot.tools.json`
11. `tools/registry/tool-maturity.json`
12. this Work Order

## Required proof

- PropertyDais renders no hearing-scheduling card, confirmation control, or submission button;
- mounting PropertyDais does not invoke the retired tool;
- the canonical manifest, maturity registry, and Assessor allowlist do not offer the tool;
- real-handler registration excludes the tool and generated JavaScript matches TypeScript;
- appeal hearing read data and the separate read-only hearing panel remain unchanged;
- focused tests, type-check, generated-source check, governance gates, protected checks, resolved
  findings, exact-head merge, and protected-main verification pass.

## Boundaries

This child removes only the unsupported scheduling offer. It does not alter hearing read fields,
`Appeal.HearingDate`, persistence, authorization, custody, Dais contracts/runtime selection, PACS
fields, database/schema/migrations, county data, production, deployment, Azure, secrets, topology,
or CI/release engineering.
