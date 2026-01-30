# CI/CD Gates (v1)

These gates turn the spec into enforcement.

## Gate 1 — Naming Lint
- Fail CI if any `Tara*` appears in suite/module names or docs.

## Gate 2 — Workbench Extension Compliance
- Each suite contribution must implement the WorkbenchContribution interface.
- Validate that every tab slug is canonical and route matches `/property/:parcelId/<slug>`.

## Gate 3 — Write-Lane Assertions
- Validate tools declare `writesTo` lanes and that lanes exist in the write-lane matrix.
- Fail if a tool writes outside its suite owner lane.

## Gate 4 — TerraTrace Immutability
- Unit test: tool execution emits invoke + result (no in-place update).
- Contract test: Activity feed uses trace projection only.

## Gate 5 — Risk Policy Enforcement
- Unit test: write_high/irreversible require confirmation + reason code.
- Unit test: supervisor required for irreversible unless policy override explicitly defined.

## Gate 6 — PII Sanitization
- Unit test: SSNs/phones/emails do not appear in trace event payloads.
- Audit test: payloads stored by reference with classification.

(Implementation snippets belong in repo CI workflows; this document defines required gates.)
