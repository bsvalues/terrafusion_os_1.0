# WO-OPS-CP-003 - Add Manual Report Review Index

## RESULT

Implemented as a static/manual review-index contract only.

## OBJECTIVE

Add a manual review-index contract to the TerraFusion Operations Control Panel so the operator can record how accepted CP-002 monitor reports were reviewed, dispositioned, linked to evidence, linked to proposed Work Orders, and finally handled.

This Work Order does not add ingestion, implementation wiring, runtime behavior, or automation behavior.

## AUTHORITY_BOUNDARY

The Operations Control Panel remains a read-only cockpit / prepare console / findings viewer. It is not a TerraFusion Brain, Cortex, autonomous queue, runtime agent, scheduler, ingestion service, or mutation path.

This WO does not authorize:

- live report discovery
- report ingestion
- file reads from HTML
- fetch/API calls
- command execution
- automation activation
- runtime wiring
- queue mutation
- canon promotion
- Brain/Cortex authority changes

## AUTHORIZED_PATHS

- `ops/control-panel/review-index.spec.json`
- `ops/control-panel/examples/review-index.example.json`
- `ops/control-panel/README.md`
- `ops/packets/WO-OPS-CP-003.md`

## FILES_CREATED

- `ops/control-panel/review-index.spec.json`
- `ops/control-panel/examples/review-index.example.json`
- `ops/packets/WO-OPS-CP-003.md`

## FILES_MODIFIED

- `ops/control-panel/README.md`

## RUNTIME_CODE_CHANGED

No.

## AUTOMATION_BEHAVIOR_CHANGED

No.

## CONTROL_PANEL_BEHAVIOR_CHANGED

No runtime behavior changed. The static documentation and JSON contract define a manual review ledger shape, but the HTML page does not read reports, fetch APIs, execute commands, activate automations, or update state.

## REVIEW_INDEX_CONTRACT_SUMMARY

The review-index contract defines:

- review ledger identity
- review record structure
- manual review statuses
- manual dispositions
- approved Control Panel lane IDs
- severity/classification values aligned with CP-002
- evidence linkage rules
- Work Order linkage rules
- rejection/blocking rules
- final handling values

Approved lane IDs:

- `daily-pulse`
- `open-work-orders`
- `governance-drift`
- `ai-sidecar`
- `ci-azure-health`
- `gap-risk-register`

Approved severities:

- `P0`
- `P1`
- `P2`
- `Deferred`
- `Needs Decision`
- `Info`

## REJECTION_RULES

A review record must reject or block a report or finding if it:

- lacks `reportId` or `monitorId`
- lacks evidence for `P0` or `P1` claims
- attempts to activate automations
- asks the Control Panel to execute commands
- asks the HTML page to fetch/read local files
- mutates repo state
- changes queue truth
- promotes canon
- claims runtime authority
- creates a second Brain/Cortex or autonomous queue
- contains secrets, credentials, PACS data, county SQL data, owner-sensitive data, appeals evidence, exemptions evidence, valuation evidence, or protected data

## VALIDATION_RUN

Safe validation run:

- JSON parse validation for touched JSON files: passed
- `git diff --check`: passed
- scoped path review: passed
- fetch/local file-read/command-execution API scan: passed

Broad runtime builds are intentionally out of scope for this static/manual review-index contract unless local policy requires them.

## EVIDENCE

Evidence to attach at closeout:

- JSON validation output: touched JSON files parsed successfully
- `git diff --check` output: no whitespace errors
- scoped file list: changes are limited to authorized CP-003 files
- HTML fetch/local file reads added: no
- command execution APIs added: no
- automation definitions or runtime wiring changed: no

## OPEN_RISKS

- The review index is static/manual. It does not provide a rendered review-index UI.
- Human review remains required to maintain review state and disposition.
- Future display or ingestion behavior must be authorized by a separate Work Order and preserve the prepare-only boundary.

## NEXT_RECOMMENDED_WO

`WO-OPS-CP-004 - Add Static Manual Review Index View`

Scope should remain static display only unless a later human-approved Work Order explicitly authorizes controlled ingestion or execution wiring.
