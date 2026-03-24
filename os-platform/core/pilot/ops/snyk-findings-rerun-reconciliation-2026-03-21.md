# Snyk Findings Rerun Reconciliation

Date: 2026-03-21
Status: PASS
Owner lane: core pilot ops
Purpose: Reconcile the March 21 governed Snyk reruns with the ratified `71` finding baseline and record the bounded fixes that removed the live reDOS regression and restored the warning count to the ratified ceiling.

## Scope

This reconciliation was intentionally limited to security evidence and scan-contract truth:

- `os-platform/core/pilot/ops/snyk-findings-baseline-2026-03-21.md`
- `os-platform/core/pilot/ops/snyk-findings-baseline-decision-2026-03-21.md`
- `tools/registry/security-scan-runner.mjs`
- `tools/registry/check-snyk-findings.mjs`
- current SARIF artifacts produced by `pnpm run security:scan`

No frontend shell code, no release-gate logic, and no Snyk acceptance rules were changed in this slice.

## Current Rerun Truth

The March 21 governed rerun is now back inside the ratified warning floor after two bounded fixes:

- removing operator-provided regex mode from the two loopback `dev-pilot-runtime.mjs` search sinks
- constraining report-path inputs in `tools/registry/check-skip-ceiling.mjs` and `tools/registry/check-snyk-findings.mjs`

Latest rerun results:

- `pnpm run security:scan` now produces `69` total findings in `snyk-code-report.json`
- severity split: `13 error`, `40 warning`, `16 note`
- `javascript/reDOS` findings remaining in `snyk-code-report.json`: `0`
- accepted error-level false positives still present: `9` `javascript/XSS`, `4` `javascript/PT`

Current ratified baseline truth:

- `os-platform/core/pilot/ops/snyk-findings-baseline-2026-03-21.md` records a sealed baseline of `71` findings
- that baseline is documented as `15 error`, `40 warning`, `16 note`
- `tools/registry/check-snyk-findings.mjs` enforces a `40` warning ceiling and allows only the documented accepted error rules

## Enforcement Result

The current rerun now satisfies the ratified baseline checker.

- `pnpm run security:check` = `PASS`
- warning count is back at the ratified ceiling: `40 / 40`
- the previously live `javascript/reDOS` blocker is cleared

Therefore the truthful statement is:

- the bounded reDOS fix succeeded
- the two over-baseline PT warnings were removed without changing governance policy
- the repo is back to the ratified repo-owned security floor for this lane

## Evidence Handling Rule

For packet reconciliation and any follow-on notes:

- it is accurate to say the current rerun is now `69` total findings with `13 error`, `40 warning`, `16 note`
- it is accurate to say the live `javascript/reDOS` findings are cleared
- it is accurate to say `pnpm run security:check` now passes against the ratified warning ceiling
- it is not accurate to describe the current rerun as a baseline change; the ratified ceiling stayed at `40` and the code was brought back into compliance

## Truth Statement

This repo-governance reconciliation item is closed.

It does not alter the live traffic blockers that keep production traffic on `HOLD`, but it does restore the truthful sealed security posture for the repo-owned Snyk code lane.