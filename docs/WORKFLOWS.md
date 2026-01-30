# Golden Workflow (Harness)

## Purpose
- Validate the contract-level spine across cost, valuation, and defense packet outputs with deterministic fixtures.

## Inputs
- `applications/terraforge-suite/harness/fixtures/golden_workflow/input_set.json`
- Contains `parcels`, `sales`, `costFactors`, and `model`.

## Step A: Cost Kernel (`terraforge.kernel.cost`)
- Input: `subject`, `tables`
- Output: cost result with `replacementCost`, `depreciation`, `rcnld`
- Audit: `audit_event.json` contract

## Step B: Valuation Kernel (`terraforge.kernel.valuation`)
- Input: `subject`, `costBreakdown`, `model`
- Output: `valuation_result.json` contract
- Audit: `audit_event.json` contract

## Step C: Defense Studio (stub)
- Input: `valuationResult`, `sale`
- Output: summary/status packet + audit event

## AuditEvent guarantees
- Fields: `eventId`, `timestamp` (RFC3339), `actor`, `action`, `resourceId`, `module`, `hash`
- Must validate against `applications/terraforge-suite/contracts/schemas/audit_event.json`

## Add a new module to the workflow
- Add module entry to `applications/terraforge-suite/registry.json` (manifest + executable).
- Implement ModuleRunner invocation in `applications/terraforge-suite/harness/src/run-golden-workflow.ts`.
- Add/adjust schemas under `applications/terraforge-suite/contracts/schemas`.
- Update fixtures under `applications/terraforge-suite/harness/fixtures`.

## Run modes
- Steel (default): ModuleRunner invokes registered modules.
- Stub: `TEST_MODE=stub` routes cost/valuation to stub implementations.

## What "GREEN" means
- All schema validations pass.
- Determinism check matches the expected total value.
- Audit log length is 3.
- Final log line: `All Systems GREEN`.
