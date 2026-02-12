# Shock-and-Awe Integration Guide (Shell + APIs)

## UI Shell (no router dependency)

- File: `src/AppShell.tsx` — role-aware tabs for key workbenches.
- File: `src/roles.ts` — role labels/typing. Default role is Levy Clerk.
- Existing workbenches are imported via `src/workbenches/index.ts`.

### Try it

Import and render from your `src/App.tsx` (or main entry):

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './AppShell';

createRoot(document.getElementById('root')!).render(<AppShell />);
```

This keeps existing code intact; swap back anytime.

### Benton Demo Pages (no code changes)

If you want to preview just the Benton flows without altering existing entries:

```pwsh
# Ratio Study demo entry
# point your bundler/preview to: src/mountRatioStudyDemo.tsx

# Levy Forecast demo entry
# point your bundler/preview to: src/mountLevyDemo.tsx
```

## Backend Contracts (OpenAPI stubs)

- `openapi/statistics.yaml` → POST `/api/statistics/iaao/ratio-study`
- `openapi/finance.yaml` → POST `/api/finance/levy/forecast`

These mirror the FE client in `src/services/TerraFusionAPIClient.ts`.

### Environment config

- Copy `.env.local.example` to `.env.local` and set `VITE_API_BASE` to your API Gateway or Prism mock URL.
- You can also override at runtime via `window.__TERRAFUSION_API__ = 'http://localhost:5000'` in DevTools.

### Quick mount (no edits)

- File: `src/mountAppShell.tsx` mounts the shell into `#root` or injects a root div if missing.
- For a quick preview build, point your bundler/preview entry to this file or temporarily import it from your current entry.

## Optional Mocking

If backend endpoints aren’t ready, you can quickly mock with Prism:

```pwsh
# From shock-and-awe root
pwsh scripts/mock-benton.ps1 -StatsPort 5051 -FinancePort 5052
```

Then temporarily point the client to the mock base URLs in code or via env.

### Benton County demo

- OpenAPI examples now include Benton-specific requests and responses.
- Set the client base to the stats mock:

```pwsh
Set-Location .\marketplace\shock-and-awe
Copy-Item .env.local.example .env.local -Force
(Get-Content .env.local) -replace 'http://localhost:5000', 'http://localhost:5051' | Set-Content .env.local
```

- Or set at runtime:

```js
window.__TERRAFUSION_API__ = 'http://localhost:5051';
```

## Consciousness Telemetry

`src/services/ConsciousnessStream.ts` expects `ws://localhost:3004/telemetry`.
If the Consciousness service isn’t running, Ops tab will simply show no events.

## Next Steps

- Wire role-based visibility/feature flags to tenant config.
- Replace placeholders with real Three.js scene and API calls.
- Add audit logging and RBAC guards at action points (export, register, etc.).
