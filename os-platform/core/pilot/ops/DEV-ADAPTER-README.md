Dev Adapter Quick README

Purpose
- Brief instructions for developers: what the dev audit adapters do and how to enable them locally.

What this is
- Developer-only helpers that persist TerraTrace events/payloads to local stores for review and test evidence.
- Not for production. They are best-effort, non-fatal adapters used during feature development and review.

Quick enable (PowerShell)
```pwsh
$env:TF_DEV_AUDIT='1'
$env:TF_DEV_AUDIT_STORE='file'  # or 'sqlite'
node os-platform/core/pilot/trace/tools/emit-dev-traces.js
```

Enable sqlite (optional)
```pwsh
# install locally once
pnpm add -D sqlite3
# then run
$env:TF_DEV_AUDIT='1'
$env:TF_DEV_AUDIT_STORE='sqlite'
$env:TF_DEV_AUDIT_DB='./dev-audit/dev-audit.db'
node --test os-platform/core/pilot/trace/tests/dev-audit.test.mjs
```

Where to read more
- Full runbook: `os-platform/core/pilot/ops/dev-adapter-runbook-2026-03-23.md`

Safety
- These artifacts may contain PII in dev runs. Keep `./dev-audit` local and do not commit generated files.

If you want this workflow to run in CI
- See `.github/workflows/sqlite-dev-adapter-test.yml` for the CI job that runs the sqlite-backed test on PRs and pushes to main/develop.

Contact
- Add questions to PR #703 or ping the author in the PR discussion.
