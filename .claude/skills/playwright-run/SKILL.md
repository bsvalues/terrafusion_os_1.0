---
name: playwright-run
description: Run Playwright e2e tests in a controlled way, preserve artifacts, and summarize the smallest actionable failure. Pass a file path, test name grep pattern, or leave blank to run the full suite.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(pwd), Bash(ls *), Bash(cat *), Bash(test *), Bash(npx *), Bash(npm *), Bash(pnpm *), Bash(yarn *), Bash(bash .claude/skills/playwright-run/run.sh *)
---

Run Playwright for target: $ARGUMENTS

Rules:
1. Prefer the narrowest target possible — a single spec file or grep pattern beats the full suite.
2. Do not edit app code unless explicitly asked after the run.
3. Inspect the repo first:
   - `frontend/package.json` (confirm `@playwright/test` is present)
   - `frontend/playwright.config.ts` (testDir, webServer, reporter, artifact paths)
   - `frontend/tests/` (available e2e specs)
4. Run the wrapper script from the repo root:
   `bash .claude/skills/playwright-run/run.sh "$ARGUMENTS"`
5. After the run, report exactly:
   - Command that was executed
   - Pass / fail summary (N passed, M failed)
   - Failing test names (if any)
   - First actionable error message + file:line
   - Artifact paths: screenshots, videos, traces in `frontend/playwright-report/`
   - One smallest safe next step

Notes:
- The dev server starts automatically via `webServer` in the config if not already running.
- Config is at `frontend/playwright.config.ts` (testDir: `./tests`, reporter: html + list).
- Artifacts land in `frontend/playwright-report/`.
- `VITE_PORT` defaults to 5173; set it if the preview server is on a different port.
