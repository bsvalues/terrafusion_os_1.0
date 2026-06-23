# WO-OPS-CP-002 - Attach Report Intake Format to Operations Control Panel

## RESULT

Implemented as a static report-intake contract only.

## OBJECTIVE

Extend the TerraFusion Operations Control Panel with an accepted report shape, naming convention, lane mapping, evidence metadata model, severity/status model, rejection rules, and Work Order conversion rules.

This Work Order does not add implementation wiring.

## AUTHORITY_BOUNDARY

The Operations Control Panel remains a read-only cockpit / prepare console / findings viewer. It is not a TerraFusion Brain, Cortex, autonomous queue, runtime agent, scheduler, or mutation path.

This WO does not authorize:

- live execution
- automation activation
- file mutation from HTML
- fetch calls
- runtime wiring
- a new control plane
- canon promotion
- queue truth changes
- Brain/Cortex authority changes

## AUTHORIZED_PATHS

- `ops/control-panel/**`
- `ops/packets/WO-OPS-CP-002.md`

## FILES_CREATED

- `ops/control-panel/report-intake.spec.json`
- `ops/control-panel/examples/report-intake.example.json`
- `ops/control-panel/examples/report-intake.rejected.example.json`
- `ops/packets/WO-OPS-CP-002.md`

## FILES_MODIFIED

- `ops/control-panel/README.md`

## RUNTIME_CODE_CHANGED

No.

## AUTOMATION_BEHAVIOR_CHANGED

No.

## CONTROL_PANEL_BEHAVIOR_CHANGED

No runtime behavior changed. The static documentation and JSON contract define the shape of acceptable report intake, but the HTML page does not read files, fetch APIs, execute commands, or update report state.

## REPORT_CONTRACT_SUMMARY

The report intake contract defines:

- report identity metadata
- approved monitor IDs
- monitor-to-lane mapping
- severity meanings
- report statuses
- required accepted report sections
- finding structure
- evidence metadata structure
- rejection rules
- conversion rules for report-to-Work-Order flow
- recommended report filename convention

Approved monitor IDs:

- `terrafusion-daily-pulse`
- `work-order-and-todo-tracker`
- `governance-drift-monitor`
- `ai-sidecar-governance-monitor`
- `ci-azure-pipeline-health-monitor`
- `project-gap-and-risk-register-monitor`

Approved lanes:

- `daily-pulse`
- `open-work-orders`
- `governance-drift`
- `ai-sidecar`
- `ci-azure-health`
- `gap-risk-register`

## REJECTION_RULES

A report or finding must be rejected if it:

- asks the Control Panel to execute commands
- asks the Control Panel to activate automations
- asks the Control Panel to read local files live
- asks the HTML page to fetch files or APIs
- mutates repo state
- changes queue truth
- promotes canon
- claims runtime authority
- creates a second Brain/Cortex or autonomous queue
- lacks required identity metadata
- lacks evidence for `P0` or `P1` claims
- contains secret, credential, county data, PACS, owner-sensitive, appeals, exemptions, valuation evidence, or protected data content

## VALIDATION_RUN

Safe validation run:

- JSON parse validation for all JSON files touched or created: passed
- `git diff --check`: passed
- scoped path review: passed

Broad runtime builds are intentionally out of scope for this static report-contract WO unless local policy requires them.

## EVIDENCE

Evidence to attach at closeout:

- JSON validation output: all control-panel JSON files parsed successfully
- `git diff --check` output: no whitespace errors
- scoped file list: changes are limited to `ops/control-panel/**` and `ops/packets/WO-OPS-CP-002.md`
- HTML fetch/local file reads added: no
- automation definitions or runtime wiring changed: no

## OPEN_RISKS

- The contract is static. It does not yet provide a rendered report intake view.
- Human review remains required to mark reports reviewed, rejected, or converted to Work Orders.
- Future display wiring must be authorized by a separate Work Order and preserve the prepare-only boundary.

## NEXT_RECOMMENDED_WO

`WO-OPS-CP-003 - Add Static Report Review View to Operations Control Panel`

Scope should remain static display only unless a later human-approved Work Order explicitly authorizes controlled ingestion or execution wiring.
