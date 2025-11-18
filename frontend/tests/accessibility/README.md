# Accessibility Tests (Playwright + axe-core)

Automated WCAG 2.1 AA + Section 508 checks for TerraFusion OS frontend.

## What’s Included
- 11 tests in `a11y.spec.ts` covering:
  - Homepage violations scan (wcag2a/aa/21a/21aa/section508)
  - Critical/serious violations filter
  - Page structure, navigation, forms, color contrast, images
  - Keyboard navigation, ARIA checks, buttons, links
- Playwright configuration (`playwright.config.ts`) auto-starts Vite and sets `baseURL`

## Run in CI (Recommended)
The workflow runs on every push to `main` and on PRs.
- Latest runs: https://github.com/bsvalues/terrafusion_os_1.0/actions/workflows/accessibility.yml?query=branch%3Amain
- Download the artifact `playwright-report` and open `index.html`

## Run Locally
> Note: Running inside the dev container may block Chromium due to missing DBUS. If you hit browserContext/newPage timeouts, run these commands on your host machine instead of inside the container.

```bash
cd frontend
npm ci
npx playwright install --with-deps
npx playwright test tests/accessibility/a11y.spec.ts --reporter=html
npx playwright show-report
```

## Troubleshooting
- Server port conflicts: Vite defaults to `5173`; Playwright waits for the URL in `playwright.config.ts`.
- Headless browser issues in containers: add launch args (`--no-sandbox`, `--disable-dev-shm-usage`) or run on host/CI.
- Ensure Node 20+ and browsers installed: `npx playwright install --with-deps`.

## Files
- `tests/accessibility/a11y.spec.ts` — Main test suite
- `playwright.config.ts` — Web server + baseURL config
- `ACCESSIBILITY_TEST_STATUS.md` (frontend root) — Status & guidance
- README (repo root) — CI badge and how-to-view instructions
