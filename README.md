# TerraFusion OS 1.0

**Government property-assessment operating system** — .NET 8 backend, React 18 frontend, AI swarm coordination, FISMA-HIGH compliance.

[![Seal Gate](https://img.shields.io/badge/CI-Seal%20Gate-green?logo=githubactions)](https://github.com/bsvalues/terrafusion_os_1.0/actions)
[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)

---

## What This Is

TerraFusion OS is a **county property-assessment platform** targeting Washington State counties. It provides:

- **.NET 8 API** for property management, authentication, and core services
- **React 18 + Vite** frontend (OS Shell desktop UI)
- **AI swarm coordination** (1,008 agents for property analysis)
- **Constitutional CI** — a Seal Gate that enforces governance on every PR
- **372+ automated tests** covering leak guards, governance invariants, and tooling

### What's Real Today

| Layer | Location | Status |
|-------|----------|--------|
| Backend API (.NET 8) | `backend/` (31 .csproj projects) | Builds, 20+ controllers |
| Frontend (React 18) | `frontend/apps/os-shell/` | Vite dev server, OS Shell UI |
| Governance Core | `os-platform/core/` | 372 tests, Pilot tools, TerraTrace |
| AI Systems | `os-platform/ai-systems/` | Swarm config, 1,008 agent manifest |
| CI Pipeline | `.github/workflows/` (81 workflows) | Seal Gate required on all PRs |
| Dev Tooling | `tools/` (25+ packages) | TDC, token compliance, security |

---

## Quick Start

```bash
# Clone
git clone https://github.com/bsvalues/terrafusion_os_1.0.git
cd terrafusion_os_1.0

# Install (Node.js 20+, pnpm)
pnpm install

# Backend (.NET 8 SDK required)
cd backend
dotnet restore
dotnet build TerraFusion.sln

# Frontend
cd ../frontend/apps/os-shell
pnpm dev
```

### Required Gates (must pass before merge)

```bash
pnpm run type-check                                           # TypeScript boundary
node --test os-platform/core/tests/phase83-tools.test.mjs     # Core tools gate
```

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│                 TerraFusion OS 1.0                  │
├─────────────┬──────────────┬───────────────────────┤
│  Frontend   │   Backend    │   OS Platform          │
│  React 18   │   .NET 8     │   Governance + AI      │
│  Vite 5     │   EF Core    │   372 tests            │
│  OS Shell   │   SignalR     │   Seal Gate CI         │
├─────────────┴──────────────┴───────────────────────┤
│                    CI / CD                          │
│  81 workflows · Seal Gate (required) · Snyk · SAST │
└────────────────────────────────────────────────────┘
```

### Key Directories

```
terrafusion_os_1.0/
├── backend/                    # .NET 8 solution (31 projects)
│   ├── TerraFusion.API/        #   Kernel — port 5000
│   ├── TerraFusion.Core/       #   Domain entities + DTOs
│   ├── TerraFusion.Data/       #   EF Core DbContext (20+ tables)
│   ├── TerraFusion.AI/         #   ML services, CostForge
│   ├── TerraFusion.Gateway/    #   Ocelot gateway — port 3002
│   ├── TerraFusion.Consciousness/ # AI swarm — port 3004
│   └── TerraFusion.Security/   #   Audit, compliance
│
├── frontend/
│   └── apps/os-shell/          # React 18 + TypeScript + Vite
│       ├── src/components/     #   UI components (shadcn/Radix)
│       ├── src/pages/          #   CanonHome, TraceHome
│       └── src/canon/          #   TerraCanon operator panels
│
├── os-platform/
│   ├── core/                   # Governance surface (allowed scope)
│   │   ├── pilot/tools/        #   ops-health-report, trace-feed
│   │   ├── tests/              #   372 leak-guard + governance tests
│   │   ├── types/              #   Shared TypeScript types
│   │   └── governance/         #   Wave ledger, policy docs
│   └── ai-systems/             # AI swarm (1,008 agents — DO NOT MODIFY)
│
├── tools/                      # Dev tooling (25+ packages)
│   ├── tdc/                    #   TerraFusion Dev CLI
│   ├── ui-tokens/              #   Token compliance checker
│   ├── canon/                  #   Canon tooling
│   └── security/               #   Security scanning
│
├── scripts/                    # CI scripts, governance guards
│   ├── repo-shape-guard.mjs    #   Root spine enforcement
│   └── quarantine/             #   Quarantine plan + keep-list
│
├── ops/                        # Operations
│   ├── dev/                    #   Dev lifecycle (tf.ps1)
│   └── forensics/              #   Incident notes
│
└── .github/workflows/          # 81 CI workflows
    └── seal-gate-fast.yml      #   THE required check (Seal Gate)
```

---

## CI: The Seal Gate

Every PR must pass the **Seal Gate** — the sole required status check:

| Gate | What It Checks |
|------|----------------|
| Classify | Determines which gates to run based on changed files |
| Frontend Fast | Tier-1 UI Harness (build + type-check + lint) |
| Backend Fast | .NET build verification (when backend files change) |
| Governance Fast | Repo shape guard, naming governance, quarantine compliance |
| **SEAL** | Aggregates all gates — blocks merge if any fail |

Additional non-blocking checks: Snyk security (594 tests), CodeRabbit review, Sourcery review.

---

## Development Rules

### Allowed Scope (agents can modify)
- `os-platform/core/pilot/**`, `os-platform/core/types/**`
- `tools/registry/**`
- `tsconfig.core.json`, `package.json`
- `.github/workflows/**` (gate wiring only)

### Forbidden Scope (never modify)
- `**/ARCHIVE/**`
- `specialized/**`
- `applications/**`
- `os-platform/ai-systems/ai-systems/ai-swarm/**`

### Port Rules (zero tolerance for hardcoded ports)
```
❌ localhost:3000  →  ✅ localhost:${TF_FRONTEND_PORT:-3102}
❌ localhost:5000  →  ✅ localhost:${TF_API_PORT:-5046}
```

See [AGENTS.md](./AGENTS.md) for full governance rules.

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | .NET 8, EF Core 8, PostgreSQL/SQLite, SignalR 8, Ocelot 22 |
| **Frontend** | React 18.3, TypeScript 5.3, Vite 5, Tailwind CSS, Radix UI, shadcn/ui |
| **AI/ML** | 1,008-agent swarm, ML.NET 3.0, autonomous coordination |
| **CI/CD** | GitHub Actions (81 workflows), Seal Gate, Snyk, pnpm |
| **Infrastructure** | Docker, Consul, Redis, Prometheus, Grafana |

---

## Security & Compliance

- **FISMA-HIGH** compliance target (NIST 800-53)
- **Sovereign County model** — data isolation per county
- **Audit fields** auto-populated on all entities (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
- **PII redaction** in TerraTrace feed (SSN, email, phone patterns)
- **Snyk** scanning on every PR (594 security tests)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [AGENTS.md](./AGENTS.md) | Agent operating rules, governance surface |
| [CLAUDE.md](./CLAUDE.md) | Development guide, architecture patterns |
| [STANDARD.md](./STANDARD.md) | Coding standards |
| [SUSTAINMENT.md](./SUSTAINMENT.md) | Maintenance runbook |
| [SEALED.md](./SEALED.md) | Seal Gate documentation |
- **[Contributing Guide](CONTRIBUTING.md)**: Contribution guidelines

---

## License

Copyright 2025 BS Values. See [LICENSE](./LICENSE).

---

**GitHub**: [bsvalues/terrafusion_os_1.0](https://github.com/bsvalues/terrafusion_os_1.0)

