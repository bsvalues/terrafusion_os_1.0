Dev Adapter Runbook — 2026-03-23

Purpose
- Quick runbook for enabling and testing the developer audit adapters added in branch `feature/pilot-phases-plan`.

Files of interest
- `os-platform/core/pilot/trace/devAuditAdapter.mjs` — file-backed adapter (JSONL + payload store).
- `os-platform/core/pilot/trace/devSqliteAdapter.cjs` — optional sqlite adapter (requires `sqlite3`).
- `os-platform/core/pilot/trace/tools/emit-dev-traces.js` — helper script to emit example traces.
- `os-platform/core/pilot/trace/tests/dev-audit.test.mjs` — unit test validating file persistence.
- `os-platform/core/pilot/trace/TraceService.js` — emits to dev adapter when `TF_DEV_AUDIT=1`.

Environment switches
- `TF_DEV_AUDIT=1` — enable best-effort dev persistence (non-fatal).
- `TF_DEV_AUDIT_STORE=file|sqlite` — choose store implementation (default: `file`).
- `TF_DEV_AUDIT_DB` — optional sqlite DB path (e.g. `./dev-audit/dev-audit.db`).

Local quickstart (PowerShell)
```pwsh
# file-backed adapter (no deps)
$env:TF_DEV_AUDIT='1'
$env:TF_DEV_AUDIT_STORE='file'
node os-platform/core/pilot/trace/tools/emit-dev-traces.js

# run unit test (verifies dev-audit files)
$env:TF_DEV_AUDIT='1'
node --test os-platform/core/pilot/trace/tests/dev-audit.test.mjs
```

Enable sqlite-backed adapter (optional)
```pwsh
# install dev dependency once
pnpm add -D sqlite3
# or
npm install --save-dev sqlite3

$env:TF_DEV_AUDIT='1'
$env:TF_DEV_AUDIT_STORE='sqlite'
$env:TF_DEV_AUDIT_DB='./dev-audit/dev-audit.db'
node --test os-platform/core/pilot/trace/tests/dev-audit.test.mjs
```

Troubleshooting
- If `sqlite3` not installed or failing, the adapter falls back to noop; verify logs and check `dev-audit/` for file artifacts instead.
- If emitter produces no files, confirm `TF_DEV_AUDIT` is present in the same shell/process where Node runs.
- If pre-commit hooks block commits during testing, run tests locally and push with CI gate fixes planned in follow-ups (do not disable hooks in long-term).

CI notes and recommendations
- If you want CI to run `dev-audit` tests, add `sqlite3` to devDependencies and ensure the CI runner has a writable workspace for `./dev-audit` and the sqlite DB file.
- Ensure `TF_DEV_AUDIT` is set only in non-production CI lanes. Prefer a gated `dev-audit` test job that runs only on feature branches.

Safety
- Dev adapters are intentionally best-effort and non-fatal. They do not change production persistence.
- Payloads may contain sensitive data in dev runs; store artifacts in secure developer machines only and do not upload test artifact files to public locations.

Next steps
- Wire CI job if you want reproducible sqlite-backed runs.
- Add small README snippet to the PR describing enablement steps.

— end runbook
