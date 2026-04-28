# TerraFusion Local Agent Cockpit

Single-window Electron cockpit for the local-agent daemon.

## What's here (Slice M)

- `main.js` — Electron main process. Creates the cockpit `BrowserWindow` with
  `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and
  loads the renderer via `loadFile()` (file://). No remote URL.
- `preload.js` — Exposes a single namespace `window.terrafusion` to the
  renderer via `contextBridge`. Slice M surface is read-only:
  `version()`, `platform()`.
- `renderer/` — Static cockpit shell. CSP locks it down to `'self'` only and
  `connect-src 'none'`.
- `package.json` — Local manifest. `electron` is **not** listed yet.

## What's intentionally NOT here

- `pnpm add electron` has not been run. The `start` script intentionally
  fails. Installing the runtime dep is a separate founder decision (Slice N).
- Daemon wiring is deferred (Slice O). The cockpit shows static info only.
- No remote `<script src>` / `<link href>`. CSP forbids it.

## Founder-safe invariants asserted by tests

`os-platform/core/tests/local-agent-cockpit-skeleton.test.mjs` reads these
files and fails the suite if any of these regress:

- main.js sets `nodeIntegration: false` and `contextIsolation: true`.
- main.js calls `win.loadFile(...)` and never `win.loadURL('http...`).
- preload.js exposes exactly one namespace (`terrafusion`) via `contextBridge`.
- renderer/index.html includes a Content-Security-Policy meta with
  `connect-src 'none'` and no remote `script` / `link` references.
