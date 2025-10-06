# TerraFusion OS — Production Plan (Deterministic Frontend + Electron)

This document describes a minimal, production-grade plan to make Electron deterministically load the canonical TerraFusion UI, add CI smoke tests, harden the Electron process, and create a repeatable build & packaging pipeline.

Prerequisite assumption
- Canonical UI file: `terrafusion-cos/ui/index.html` will be treated as the authoritative artifact that the Electron renderer must load. If you prefer a different file (for example a specific file in `Brand_Assets/`), tell me and I'll switch the plan.

Contract (2–3 bullets)
- Inputs: frontend source in `terrafusion-cos/frontend_engine/` (source files, webpack config), existing built artifact `terrafusion-cos/ui/index.html` (production bundle). Environment: Node 18+ / npm, Windows CI runner.
- Outputs: deterministic, reproducible build that writes to `terrafusion-cos/ui/`; hardened Electron main process that loads the canonical HTML only; Playwright smoke tests and a GitHub Actions workflow that builds and verifies the UI; signed Windows installer artifacts created by `electron-builder`.
- Error modes: build failures, missing assets, headless browser install/download issues. Tests and CI must fail fast and produce readable logs.

File-level change list (minimum first-pass)
- Add `PRODUCTION_PLAN.md` (this file).
- `terrafusion-cos/frontend_engine/package.json`: add `build` and `ci:build` scripts and pins for deterministic build.
- Add `terrafusion-cos/frontend_engine/webpack.prod.js` (production webpack config) that outputs deterministic filenames (no content hashes) into `../../ui/`.
- Add `terrafusion-cos/electron/preload.js`: safe, minimal `contextBridge` API exposing only allowed renderer features.
- Update `terrafusion-cos/electron/main.js`: disable nodeIntegration, enable contextIsolation, load canonical file from `../ui/index.html`, and optionally keep an env-driven local brand server (off by default). Add graceful shutdown and PID write.
- Add `terrafusion-cos/e2e/playwright.config.ts` and `terrafusion-cos/e2e/tests/smoke.spec.ts` to run Playwright bundled browsers and verify key selectors.
- Add `.github/workflows/ci-smoke.yml`: build, run Playwright smoke tests, and upload artifacts/logs on failure.
- Add `build-scripts/` small helpers to: build frontend, start/stop local brand server (if needed), and run Playwright tests locally.
- Add `electron-builder` config under `terrafusion-cos/electron/package.json` (or root package.json) and a `build:win` script that produces an installer artifact.

Quality gates and acceptance criteria
- Build: `npm run ci:build` in `terrafusion-cos/frontend_engine` must exit 0 and produce deterministic output in `terrafusion-cos/ui/`.
- Lint/Typecheck: run the repo's existing linters/typechecks (or add eslint/tsc if missing) — must exit 0.
- Smoke tests: Playwright must start Electron's distribution (or a local static server pointing at `ui/index.html`) and verify the canonical title and 3 critical selectors (header, primary nav, and a unique product badge). Test must pass on both CI and a local dev run.
- Packaging: `npm run build:electron` must produce a signed (or unsigned for initial iteration) Windows installer in `dist/` (or `out/`) and a reproducible checksum.

Edge cases and mitigations
- Missing built UI: fail fast in CI with clear error messages; the workflow will attempt a build step before test.
- Headless browser install/download failures: use Playwright's bundled browser installation in CI (it includes browser binaries). For offline environments, provide a local cache or run tests using the file-system smoke test (`e2e/smoke-local.js`) as fallback.
- Unexpected renderer crashes: capture renderer logs via `preload.js` and `ipcRenderer` channels and upload logs as workflow artifacts.

Security checklist (minimum)
- Disable `nodeIntegration` in the renderer.
- Enable `contextIsolation: true` and use `preload.js` + `contextBridge` to expose only specific APIs.
- Set a strict Content-Security-Policy in the served HTML (CI should build with a CSP header or meta tag injection step).
- Remove any embedded express server by default; if kept it must be guarded by an environment variable and bind only to localhost and a high port, with a `/__health` endpoint.
- Run `npm audit --audit-level=moderate` as part of CI and fail builds on critical vulnerabilities.

Testing strategy
- Unit tests: keep existing test approach; add a tiny test for the `preload.js` shim.
- Integration / e2e: Playwright-based smoke tests that:
  - Build the frontend
  - Start a static server serving `terrafusion-cos/ui/` (or run the built Electron binary pointing to `file://` URL)
  - Launch a headful Playwright browser (bundled) and verify the UI loads and key selectors are present
  - Tear down and upload logs/artifacts on failure

CI pipeline (GitHub Actions outline)
1. Checkout + cache node modules
2. Build frontend (`terrafusion-cos/frontend_engine`)
3. Lint + typecheck
4. Start local static server (or build and install electron app)
5. Run Playwright smoke tests
6. Upload artifacts (UI build, logs, screenshots) if failure

Rollout and packaging notes
- Use `electron-builder` with a stable pinned version. For Windows releases start unsigned artifacts then add code signing using Azure Key Vault or GitHub Secrets (signtool) later.
- Produce NSIS or Squirrel artifacts as appropriate for the target environment and add checksums.

Small staged milestones (recommended)
1. Design doc (this file) — complete.
2. Add deterministic frontend `build` script that emits to `terrafusion-cos/ui/` — implement and verify locally.
3. Harden Electron (`preload.js`, `main.js` changes) and validate local run.
4. Add Playwright smoke tests and a local runner; validate in CI.
5. Add packaging config and produce Windows installer artifacts.

Next steps (I will take now if you confirm):
- Implement the deterministic `build` for `terrafusion-cos/frontend_engine` (add a `webpack.prod.js` and update `package.json` scripts).
- Create `preload.js` and update `main.js` to use `contextIsolation` + `nodeIntegration: false`.
- Add Playwright smoke test scaffold and a minimal GitHub Actions workflow.

If you prefer I can perform these steps incrementally and push each as a separate PR. Tell me which milestone to start with (I recommend "Add deterministic frontend build" first). 

---
Acceptance sign-off criteria (what you should see before merging):
- CI passes on the feature branch with Playwright smoke tests green.
- Electron launches on Windows and loads `terrafusion-cos/ui/index.html` exactly as served by the frontend build.
- No nodeIntegration in renderer and minimal `preload.js` surface area.

Document created: 2025-09-30
