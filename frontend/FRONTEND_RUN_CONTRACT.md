# Frontend Run Contract

- Canonical entrypoint: `pwsh ./tools/terra/terra.ps1 run frontend`
- Script used: `frontend/scripts/command-center.ps1`
- App root: `frontend/apps/os-shell`
- Dependency rule: install via the package manager detected by the command-center script (prefers pnpm, falls back to npm)
- Output expectation: dev server on the default Vite port (5173 unless overridden)

Keep all future frontend apps under `frontend/apps/*`; the OS shell namespace is reserved at `frontend/apps/os-shell`.

---

## Optional: Bun Accelerated Development

If you want faster installs and dev server startup:

```bash
bun install
bun run dev
```

Bun is optional and local-only. Node remains the official runtime used in CI.

For full details, see [docs/DEV_ENV_BUN.md](../docs/DEV_ENV_BUN.md).
