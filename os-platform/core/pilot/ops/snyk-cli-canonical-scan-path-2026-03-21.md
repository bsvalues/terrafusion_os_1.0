# Snyk CLI Canonical Scan Path

Date: 2026-03-21
Status: ACTIVE
Owner lane: core pilot ops
Purpose: truth-lock Snyk scanning on the CLI path instead of editor-profile extensions

## Canonical Rule

Repo-standard local scan command:

- `pnpm run security:scan`

This command is the canonical Snyk path for this repo.

Default governed targets:

- `tools/registry`
- `os-platform/core/pilot`
- `os-platform/core/types`

Optional frontend scan targets:

- `frontend/apps/os-shell` via `pnpm run security:scan:frontend`
- governed core plus `frontend/apps/os-shell` via `pnpm run security:scan:first-party`

Default IaC targets when `SNYK_SCAN_MODE=iac`:

- `charts`

The VS Code extension is optional convenience only. It is not the release-closure authority because extension availability drifts across editor profiles and hosts.

## Local Capability Semantics

`pnpm run security:scan` must tell the truth about local capability.

- If `snyk` is on `PATH` and authenticated, the command runs `snyk code test` and writes `snyk-code-report.json`.
- If no explicit target list is supplied, the command scans the governed core targets above instead of attempting an unbounded full-repo crawl.
- If a frontend shell slice needs first-party coverage, the repo-owned runner can scan `frontend/apps/os-shell` explicitly without redefining the default governed-core baseline.
- If `snyk` is missing from `PATH`, the command records `CAPABILITY UNAVAILABLE` and does not pretend a scan ran.
- If `snyk` is installed but not authenticated, the command records `CAPABILITY UNAVAILABLE` and instructs the operator to run `snyk auth` or provide `SNYK_TOKEN`.
- If a target scan exceeds the configured timeout, the command fails truthfully instead of hanging indefinitely.
- In IaC mode, `snyk` exit code `3` is treated as a truthful skip for optional targets with no supported IaC files detected.

Frontend shell scans remain opt-in so the ratified `pnpm run security:scan` baseline and `pnpm run security:check` ceiling stay anchored to the governed core lane.

This keeps local release work truthful without pretending the extension or the CLI is always present.

## CI Enforcement Semantics

CI must use the same repo contract instead of duplicating raw Snyk commands inline.

- CI installs the Snyk CLI.
- CI provides `SNYK_TOKEN`.
- CI runs `npm run security:scan`.
- CI sets `SNYK_FAIL_ON_FINDINGS=1` so findings fail the scan in the enforced lane.
- CI may switch modes with `SNYK_SCAN_MODE=iac` and explicit `SNYK_IAC_TARGETS` when a workflow is scanning Kubernetes or Helm surfaces.

This makes workstation drift non-authoritative and keeps enforcement on the same path used locally.

## Operator Notes

- Preferred install posture: machine-wide or per-user CLI install on `PATH`
- Preferred auth posture: one explicit auth for the intended governing account
- Optional UX: install the Snyk extension in both VS Code and Insiders only if inline editor feedback is still wanted

## Governance Limitation

The repo instruction file under `.github/instructions/` remains outside the current writable governance scope.

Until that scope is explicitly opened, this document and the `security:scan` runner are the authoritative repo-owned truth for the CLI-first path.