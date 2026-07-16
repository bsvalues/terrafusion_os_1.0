# WO-WOE-013 - Program Queue Report Evidence

## Result

WO-WOE-013 implements the report half of the registered "Program Queue UI / Report" node as a
deterministic stdout-only Markdown renderer over `wo-query.mjs`. It intentionally does not add a new
OS Shell route or mix static work-order state into the live Pilot Governance Dashboard.

## Capability

- Reuses the existing query engine and scoring policy.
- Shows provenance, authority ceiling, registry metadata, active registry lane, the next advisory
  candidate, ranked candidates, blocked records, and completed records.
- Escapes Markdown table delimiters and produces deterministic output with no generated timestamp.
- Writes only to stdout and has no output-file or mutation option.
- Labels the output advisory and points operators to `WORK_ORDER_PROGRAM_QUEUE.md` and
  `CONTINUATION_RULEBOOK.md` for live routing.

## Honesty Boundary

The representative registry seed can lag the canonical live queue. WO-WOE-013 exposes that
provenance rather than hiding it. The report does not reconcile registry data, change scoring, grant
authority, inspect GitHub, or assert that an advisory recommendation is executable.

## Scope

Changed paths are limited to the Work Order Engine report tool, focused tests, tool documentation,
this evidence/active packet, and canonical WOE current-state routing documents. No frontend,
backend, OS runtime, CI, deployment, package, lockfile, county, PACS, SQL, secret, or production path
changes.

## Validation Contract

- query and report Node test suites pass;
- the live query JSON command remains valid;
- Markdown report generation exits successfully;
- `git diff --check` passes;
- `wo-query` remains read-only and unchanged;
- the generated report contains the live-routing and non-authority disclosures.

## Validation Results

- `node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-report.test.mjs`:
  PASS, 17 tests.
- `node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs`: PASS, 25 tests.
- `node docs/brain/workorders/tools/wo-query.mjs --json`: PASS.
- `node docs/brain/workorders/tools/wo-report.mjs`: PASS.
- `corepack pnpm run type-check`: PASS.
- `node --test os-platform/core/tests/phase83-tools.test.mjs`: PASS, 56 tests.
- Prettier check across all nine changed files: PASS.
- `git diff --check`: PASS.
- Frozen bootstrap used `corepack pnpm install --frozen-lockfile --ignore-scripts`; `package.json`
  remained `AE1B423C71421A30983D06D8F303E4B556E674F3551CBB226CF1F33AB500C0D6` and
  `pnpm-lock.yaml` remained
  `D23687DD59C77E400D392DC99BB3F12308761377368D686528868C22615489A0`.
- `brain review-diff --workorder WO-WOE-013` confirms all nine changed files are within the exact
  Work Order allowlist. Its aggregate verdict remains blocked by the pre-existing global
  write-lanes baseline: 21 violations in unchanged `tools/registry/terrapilot.tools.json`. WOE-013
  neither modifies nor excludes that debt.

## Closeout

WO-WOE-012 and WO-WOE-014 were already complete. On protected merge, WO-WOE-013 completes the
remaining registered Work Order Engine baseline node. The next route is Portfolio Operator
reconciliation; no product, deployment, or protected-data lane is preselected.

STOP_TYPE: `WOE_013_PROGRAM_QUEUE_REPORT_COMPLETE`
