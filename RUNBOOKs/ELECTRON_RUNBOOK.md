# Electron Runbook — TerraFusion OS

Purpose: Provide concise operator steps to run, supervise, and troubleshoot the TerraFusion Electron app used to render the canonical TerraFusion UI. This document assumes a Windows host and PowerShell (pwsh.exe).

Location of key files

- Electron app root: `terrafusion-cos/`
- Canonical UI entry: `terrafusion-cos/ui/index.html`
- Main logs: `terrafusion-cos/logs/electron-main.log`
- Rotated logs: `terrafusion-cos/logs/electron-main.<timestamp>.log(.gz)`
- stderr/gpu logs: `terrafusion-cos/logs/electron-stderr.log`
- PID file: `terrafusion-electron.pid` (written into repo root)
- Playwright CI artifact: `terrafusion-cos/logs/artifacts/renderer-screenshot.png`

Quick commands (PowerShell)

- Start supervisor (recommended for production test runs):
  pwsh -File .\scripts\supervise-electron.ps1

- Start Electron directly (development):
  cd terrafusion-cos
  npx electron .

- Stop Electron (by PID):
  Get-Process -Id (Get-Content .\terrafusion-electron.pid) | Stop-Process -Force

- View latest main log (tail-like):
  Get-Content terrafusion-cos\logs\electron-main.log -Tail 200 -Wait

- Rotate main log manually (safe):
  $ts = (Get-Date -Format yyyyMMddHHmmss); Move-Item terrafusion-cos\logs\electron-main.log terrafusion-cos\logs\electron-main.$ts.log

- Inspect rotated files and sizes:
  Get-ChildItem terrafusion-cos\logs\electron-main.*.log | Sort-Object LastWriteTime -Descending | Select-Object Name,Length

CI artifact verification (smoke test)

- CI uploads these artifacts on successful smoke runs:
  - `terrafusion-cos/logs/artifacts/renderer-screenshot.png`
  - `terrafusion-cos/logs/electron-main.log`

- To run smoke locally:
  cd terrafusion-cos/frontend_engine
  npm ci
  npm run build
  npx playwright install --with-deps
  npm run e2e:smoke

- After run, check artifacts directory: `terrafusion-cos/logs/artifacts/`

Common failure modes & remediation

- Symptom: Large historical main log with repeated "UNCAUGHT_EXCEPTION Error: EPIPE" entries
  - Cause: Early writes to stdout/stderr when pipes closed by supervisor/container. Fix: ensure main log guards are present (they are in current main.js). For cleanup: rotate the large log as above and inspect last few MB for root cause.
  - Command: Move-Item terrafusion-cos\logs\electron-main.log terrafusion-cos\logs\electron-main.`<ts>`.log

- Symptom: GPU process crash entries in electron-stderr.log (exit_code=-1073740791)
  - Cause: GPU driver instability or headless environment. Workarounds:
    - Run CI capture via Playwright (headless Chromium) which is isolated from GPU crashes.
    - In-host: try disabling hardware acceleration by launching Electron with --disable-gpu (edit npm start or supervisor if needed).

- Symptom: No screenshot produced by in-app capture
  - Cause: GPU crash or Electron capture issues. Check the following in order:
    - `terrafusion-cos/logs/artifacts/` for `renderer-screenshot.png`
    - `terrafusion-cos/logs/` for `renderer-snapshot.html` or `renderer.pdf` (fallbacks)
    - `electron-main.log` for did-finish-load capture attempts
  - Remediation: Use Playwright smoke to capture a reliable screenshot.

- Symptom: Stale PID file preventing startup
  - Command to clear stale PID and start fresh:
    if (Test-Path .\terrafusion-electron.pid) { Remove-Item .\terrafusion-electron.pid }
    Start Electron or supervisor again.

Log rotation policy

- App rotates main log when >10MB, keeps last 5 rotated logs, and attempts to gzip rotated files.

- Manual rotation and pruning can be performed as shown above.

If you need to gather artifacts for support

1. Copy the latest main log and the most recent rotated log (if present).
2. Copy `terrafusion-cos/logs/artifacts/renderer-screenshot.png` (or `renderer-snapshot.html`, `renderer.pdf`)
3. Provide `electron-stderr.log` if GPU crashes are present.

Contact

- For developer/maintainer assistance, open an issue with the artifacts above in the internal repo and tag the engineering-oncall team.

Notes

- The app loads the canonical UI at `terrafusion-cos/ui/index.html` by default. Embedded brand server behavior is gated behind `TF_USE_EMBEDDED_BRAND` environment variable.
- Supervisor script is conservative: it performs up to 5 restarts (configurable) with a sleep window between restarts to avoid rapid crash loops.
