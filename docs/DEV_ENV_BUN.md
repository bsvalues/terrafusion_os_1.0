# ⚡ TerraFusion OS – Bun Accelerated Development Guide

## Overview
Bun is an ultra-fast JavaScript runtime and toolkit that offers:
- Lightning-fast `bun install`
- Faster dev server startup
- Faster TypeScript tooling
- Faster test runs in many cases

**Important:**  
Bun is *optional* and *local-only* in the current TerraFusion OS roadmap.  
**Node continues to be the official runtime** for CI/CD and production build pipelines.

This document explains how to safely use Bun during development without altering
the official Node-based workflows.

---

## 1. Install Bun (Local Only)

### macOS / Linux
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows (PowerShell)
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify installation:
```bash
bun --version
```

---

## 2. Use Bun for Faster Frontend Development

Bun can transparently run existing npm scripts.

### Install dependencies
```bash
bun install
```

### Run the dev server (Vite)
```bash
bun run dev
```

### Run frontend tests (Vitest)
```bash
bun run test
```

### Lint
```bash
bun run lint
```

If Bun fails or behaves strangely:
👉 simply fall back to `npm install` and `npm run dev`.

No code changes required.

---

## 3. Repository Scripts (Compatibility)

**No changes to `package.json` are required.**
Bun will run existing scripts defined under `"scripts"`:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

You can keep using:
```bash
npm run dev
```

or

```bash
bun run dev
```

Both work.

---

## 4. bunfig.toml

A configuration file exists at the repo root (`bunfig.toml`):

```toml
# bunfig.toml – TerraFusion OS

[install]
# Respect existing dependencies; avoid peer warnings
peer = "ignore"

[test]
# Reasonable default timeout (ms)
timeout = 60000
concurrency = 4
```

This is optional but recommended for consistent behavior.

---

## 5. VS Code Integration (Optional)

The TerraFusion workspaces include Bun-aware terminal settings:

```jsonc
{
  "terminal.integrated.env.linux": { "TF_BUN_ENABLED": "1" },
  "terminal.integrated.env.osx":   { "TF_BUN_ENABLED": "1" },
  "terminal.integrated.env.windows": { "TF_BUN_ENABLED": "1" }
}
```

If you see `TF_BUN_ENABLED=1` in your terminal env, you're cleared to use Bun commands.

---

## 6. CI/CD Notes

**Do not modify CI or build pipelines yet.**

CI continues running:
- `node` (LTS)
- `npm` or `pnpm` as configured
- Official build scripts

We will evaluate Bun in CI after 2–3 weeks of stable local usage.

---

## 7. Troubleshooting

### Bun behaves differently than npm?
- Fall back to `npm run dev`.
- Document the issue under the `bun-runtime` label.
- Node remains authoritative.

### Tests fail only under Bun?
- Treat the Node result as canonical.
- Bun is best-effort for now.

### Build failures under Bun?
- Temporarily disable Bun usage.
- Notify the engineering team.

### Golden Rule
If Bun ever conflicts with delivery, **Node wins** until we explicitly decide otherwise.

---

## 8. TerraFusion-Specific Commands

### Frontend (OS Shell)
```bash
cd frontend
bun install
bun run dev          # Vite dev server on port 5173
bun run build        # Production build
bun run test         # Vitest
```

### TerraBuild Modernization
```bash
cd terrabuild-modernization
bun install
bun run dev          # Dual-port dev server
```

### TerraFusion IDE
```bash
cd os-platform/development/tools/TerraFusionIDE
bun install
bun run dev          # Monaco-based IDE
```

---

## 9. Summary

This adoption strategy ensures:
- ⚡ Faster local development
- ✅ Zero impact on CI or production
- 🛡️ No disruptions during Phase 30+ engineering
- 🚀 A safe path toward possible future Bun adoption

You can begin using Bun immediately — with **no risk** to TerraFusion OS development flow.

---

## References
- [Bun Documentation](https://bun.sh/docs)
- [Bun vs Node Compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [TerraFusion Frontend Run Contract](../frontend/FRONTEND_RUN_CONTRACT.md)
