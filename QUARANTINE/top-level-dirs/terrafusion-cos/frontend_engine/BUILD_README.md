Deterministic frontend build

How to run locally

1. Ensure Node.js (16+) and npm are installed.
2. From `terrafusion-cos/frontend_engine` run:

```powershell
npm install
npm run build
```

This will run webpack with `webpack.prod.js` and emit deterministic artifacts
into `terrafusion-cos/ui/` (the output file will be `bundle.js`).

CI notes

- Use `npm run ci:build` which runs the build silently and is intended for CI.
  Ensure the workspace has sufficient node_modules cache.
- If Playwright or other browser-based tests are used, prefer Playwright's
  bundled browsers in CI to avoid download failures.
