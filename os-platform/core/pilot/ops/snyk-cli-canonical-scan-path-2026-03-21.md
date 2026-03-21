# Snyk CLI Canonical Scan Path

Date: 2026-03-21
Status: ACTIVE
Owner lane: core pilot ops
Purpose: truth-lock Snyk scanning on the CLI path instead of editor-profile extensions

## Canonical Rule

Repo-standard local scan command:

- `pnpm run security:scan`

This command is the canonical Snyk path for this repo.

The VS Code extension is optional convenience only. It is not the release-closure authority because extension availability drifts across editor profiles and hosts.

## Local Capability Semantics

`pnpm run security:scan` must tell the truth about local capability.

- If `snyk` is on `PATH` and authenticated, the command runs `snyk code test` and writes `snyk-code-report.json`.
- If `snyk` is missing from `PATH`, the command records `CAPABILITY UNAVAILABLE` and does not pretend a scan ran.
- If `snyk` is installed but not authenticated, the command records `CAPABILITY UNAVAILABLE` and instructs the operator to run `snyk auth` or provide `SNYK_TOKEN`.

This keeps local release work truthful without pretending the extension or the CLI is always present.

## CI Enforcement Semantics

CI must use the same repo contract instead of duplicating raw Snyk commands inline.

- CI installs the Snyk CLI.
- CI provides `SNYK_TOKEN`.
- CI runs `npm run security:scan`.
- CI sets `SNYK_FAIL_ON_FINDINGS=1` so findings fail the scan in the enforced lane.

This makes workstation drift non-authoritative and keeps enforcement on the same path used locally.

## Operator Notes

- Preferred install posture: machine-wide or per-user CLI install on `PATH`
- Preferred auth posture: one explicit auth for the intended governing account
- Optional UX: install the Snyk extension in both VS Code and Insiders only if inline editor feedback is still wanted

## Governance Limitation

The repo instruction file under `.github/instructions/` remains outside the current writable governance scope.

Until that scope is explicitly opened, this document and the `security:scan` runner are the authoritative repo-owned truth for the CLI-first path.