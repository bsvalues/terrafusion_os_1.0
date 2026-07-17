# WO-PORTFOLIO-006 - Shell Routing Contract Reconciliation Evidence

## Selection Evidence

- Portfolio reconciliation found no unprotected admitted successor after `WO-BACKEND-014`.
- Stale PR #1076 carried 128 unique commits and an unsafe 687-file diff, so it was not merged,
  rebased, or cherry-picked.
- Current main already contains its reviewed atomicity and route-remediation outcomes. PR #1076 was
  closed as superseded after provider-neutral lookup, anonymous revoke, and Workbench state-shape
  fixes were verified live.
- The full deployment-truth gate exposed one remaining bounded defect: E3 prohibited every
  `activateModule` call even though shell canon assigns standalone module activation to the shell.

## Canonical Contract

- Parcel-scoped suite work routes through Property Workbench.
- Unscoped Workbench launches are not certified for tab preservation: Property Search currently
  drops the `openTab` query when a parcel is selected.
- Standalone county-wide or system modules remain shell-owned and use module activation.
- The implementation already conforms. This Work Order corrects only the stale static assertion.

## Validation Evidence

- TDD red proof: focused E3 failed because the test prohibited shell-owned standalone activation.
- Focused E3 after reconciliation: 1 passed, 0 failed.
- Full deployment-truth gate: 70 passed, 0 failed.
- Review remediation removed the false unscoped-tab certification after direct inspection of
  `PropertySearch.openParcel`; product behavior remains unchanged and the gap is explicit.
- Core TypeScript type-check: PASS.
- Phase83 core tool gate: 56 passed, 0 failed.
- Frozen pnpm bootstrap: PASS; `package.json` and `pnpm-lock.yaml` hashes remained unchanged and no
  tracked bootstrap residue was created.
- Exact-file Prettier check: PASS.
- `git diff --check`: PASS.
- Registry JSON parse and `wo-query --json`: PASS; WO-PORTFOLIO-006 is terminal and no stale
  candidate is returned.
- Remote checks and review-thread closure are required before protected merge.

## Non-Claims

- No shell, Workbench, frontend, backend, runtime, or tools-sync behavior changed.
- No deployment, workflow, package, lockfile, schema, migration, or environment changed.
- No secret, county, PACS, SQL, live service, or production resource was accessed.
- This packet does not claim that an unscoped Workbench launch preserves its requested tab after
  parcel selection.
