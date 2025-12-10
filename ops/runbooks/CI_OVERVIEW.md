# CI/CD Overview – TerraFusion OS

## Runtime & Toolchain

### Official CI Runtime
- **Node.js**: LTS version (currently 20.x)
- **Package Manager**: npm or pnpm as configured per workspace
- **Build Tool**: Vite for frontend, dotnet CLI for backend

### Build Agents
- GitHub Actions (primary)
- Self-hosted runners for performance-sensitive jobs

---

## Bun & CI

**Current Status: Developer-Only**

- Bun is currently enabled for **local development only**
- GitHub Actions and build agents continue to use:
  - `node` (LTS)
  - `npm` / `pnpm` as configured
- **Do NOT change CI jobs to use Bun** in this phase

### Future Roadmap

When we have 2–3 weeks of smooth local Bun usage, we can:
1. Add a **parallel** "Bun smoke test" job (non-blocking)
2. Compare build times and test reliability
3. Later consider promoting Bun as a primary JS runtime

### Why Wait?

- CI stability is paramount for government deployments
- Node ecosystem compatibility is proven
- Bun is evolving rapidly; we want to adopt on a stable release
- County SLA requirements demand predictable builds

---

## Pipeline Structure

### Frontend Pipeline
```
checkout → bun/npm install → lint → test → build → deploy
```

### Backend Pipeline (.NET)
```
checkout → dotnet restore → build → test → publish → deploy
```

### Integration Pipeline
```
frontend build → backend build → docker compose → e2e tests → teardown
```

---

## References
- [Bun Dev Guide](../docs/DEV_ENV_BUN.md)
- [Frontend Run Contract](../frontend/FRONTEND_RUN_CONTRACT.md)
- [TerraFusion Copilot Instructions](../.github/copilot-instructions.md)
