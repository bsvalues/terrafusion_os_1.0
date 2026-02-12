# 🤖 Copilot / AI Agent Instructions - Benton County Turn-Key Ops

## System Context

**Project**: TerraFusion Elite Government OS - Benton County Deployment
**Stack**: .NET 8 Backend, React 18 (Vite) Frontend, PostgreSQL 15, Redis 7
**Location**: `counties/benton/` (county cockpit controls everything)
**Repository**: https://github.com/bsvalues/terrafusion_os_1.0

## Architecture Reality

```
/
├── backend/                    # .NET 8 microservices (TerraFusion.API, .Data, .Core)
│   └── Dockerfile             # Multi-stage .NET build
├── frontend/                   # React 18 + Vite PWA
│   └── Dockerfile             # Multi-stage with dev/prod targets
├── counties/benton/           # 🎯 County cockpit (you work here)
│   ├── Makefile               # up/down/migrate/seed/test/backup/restore
│   ├── .env.example           # Safe defaults (copy to .env)
│   ├── docker-compose.county.yml  # Full stack definition
│   ├── benton-county.code-workspace  # VS Code multi-root
│   ├── scripts/
│   │   ├── tests/smoke_benton.sh
│   │   └── sql/verify_surface.sql
│   └── docs/diagrams/*.mmd    # Mermaid ERDs
└── .github/workflows/benton.yml  # CI: build → test → push images
```

## 🎯 Definition of Done

- ✅ `make up` starts backend + frontend + postgres + redis (all healthy)
- ✅ `make migrate` applies EF Core migrations successfully
- ✅ `make seed` populates test data
- ✅ `make test` runs smoke tests (health + status endpoints green)
- ✅ UI accessible at http://localhost:3000
- ✅ API accessible at http://localhost:5000/health
- ✅ CI builds images, runs tests, pushes to GHCR on main branch
- ✅ Production compose file generated with image tags

## 🛠️ Allowed Operations

### Bootstrap County Environment
```bash
cd counties/benton
cp .env.example .env
# Edit .env with real values if needed
make up
```

### Development Loop
```bash
make migrate        # Apply database migrations
make seed          # Seed test data
make test          # Run smoke tests
make logs          # View API logs
make ps            # List running services
```

### Database Operations
```bash
make backup        # Backup to ./backups/benton_TIMESTAMP.sql
make restore       # Restore latest backup
make clean         # Stop and remove volumes
```

### Release Preparation
```bash
make release-compose    # Generate compose.prod.yml with image tags
```

### Documentation
```bash
make viz           # Render Mermaid diagrams to ./_artifacts/
```

## 🚫 Critical Constraints

1. **Never commit secrets**: `.env` is gitignored, only `.env.example` is tracked
2. **County data isolation**: All queries must include `countyCode` parameter
3. **No prod PACS access**: Use PACS Twin (TF-BENTON-PACS-CLONE) only
4. **Port 5000 reserved**: API must listen on 5000, frontend on 3000
5. **Health checks required**: All services must have health endpoints

## 🧪 Testing Strategy

**Smoke Tests** (`make test`):
- Checks `/health` returns 200
- Validates `/api/v1/status?county=benton`
- Runs inside `api` container

**Integration Tests** (when PACS Twin ready):
- Run `verify_surface.sql` against twin
- Validate critical stored procedures exist

## 📋 Common Agent Tasks

### Task 1: Start Fresh Environment
```bash
cd counties/benton
make down && make clean  # Clean slate
cp .env.example .env
make up                  # Start stack
make migrate            # Apply migrations
make seed               # Seed data
make test               # Verify health
```

### Task 2: Investigate Failure
```bash
make ps                                    # Check service status
make logs                                  # Tail API logs
docker compose -f docker-compose.county.yml logs postgres -n 200
docker compose -f docker-compose.county.yml logs frontend -n 200
```

### Task 3: Build & Push Release Images
```bash
cd counties/benton
GIT_TAG=$(git rev-parse --short HEAD)
docker build -t ghcr.io/bsvalues/terrafusion_os_1.0/tf-api:benton-${GIT_TAG} ../../backend
docker build -t ghcr.io/bsvalues/terrafusion_os_1.0/tf-frontend:benton-${GIT_TAG} ../../frontend
docker push ghcr.io/bsvalues/terrafusion_os_1.0/tf-api:benton-${GIT_TAG}
docker push ghcr.io/bsvalues/terrafusion_os_1.0/tf-frontend:benton-${GIT_TAG}
```

### Task 4: Generate Production Deployment
```bash
make release-compose  # Creates compose.prod.yml with image tags
# Review compose.prod.yml - ready for county server deployment
```

## 🔧 Troubleshooting Guide

### Port Already in Use
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### API Won't Start
```bash
make logs  # Check for errors
# Common issues:
# - Database connection string wrong in .env
# - Missing migrations: make migrate
# - Port conflict: make down && make up
```

### Database Migration Failed
```bash
# Check if API container is running
make ps

# Try manual migration
docker compose -f docker-compose.county.yml exec api dotnet ef database update --project TerraFusion.Data

# Nuclear option: recreate database
make clean && make up && make migrate
```

### Frontend Build Errors
```bash
cd ../../frontend
npm install  # Ensure dependencies are fresh
npm run build  # Test build locally
# Then retry: make down && make up
```

## 📊 Performance Targets

- **API Latency**: <10ms P95 for `/health`
- **Startup Time**: API ready within 30 seconds
- **Database**: <100ms query response for property lookups
- **Frontend**: First Contentful Paint <1.5s

## 🔐 Security & Compliance

- **FISMA-High**: All data encrypted at rest and in transit
- **Section 508**: UI meets WCAG 2.2 AA standards
- **Audit Logging**: All data modifications logged with user context
- **Data Masking**: PACS Twin has PII masked (never use prod data)

## 📝 PR Hygiene

When creating PRs, use `.github/pull_request_template.md`:
- Check all verification boxes (build, test, migrate, accessibility)
- Mark risk level (Low/Medium/High)
- Provide rollback plan
- Get security review for Medium/High risk changes

## 🎬 Quick Start for New Agents

```bash
# 1. Clone and navigate
cd counties/benton

# 2. Initialize environment
cp .env.example .env

# 3. Start everything
make up

# 4. Setup database
make migrate
make seed

# 5. Verify
make test

# 6. Check services
curl http://localhost:5000/health  # API
curl http://localhost:3000         # Frontend

# Success! You're running Benton County stack locally.
```

## 🚀 CI/CD Pipeline

**GitHub Actions** (`.github/workflows/benton.yml`):
1. Triggers on push to `main` or PR affecting backend/frontend/counties/benton
2. Starts docker-compose stack with `--build`
3. Waits for `/health` endpoint (120s timeout)
4. Runs `make migrate && make seed && make test`
5. On success (main branch): builds and pushes tagged images to GHCR
6. Artifacts: images with tags `benton-<git-sha>`

## 💡 Agent Success Criteria

After completing work, verify:
- [ ] All services start cleanly (`make up`)
- [ ] Health checks pass (`make test`)
- [ ] No secrets committed (check `.env` is gitignored)
- [ ] Documentation updated if APIs changed
- [ ] Performance targets met (check logs for latency)
- [ ] Accessibility validated if UI changed
- [ ] PR created with proper template filled

---

**Government. Transcended.** 🏛️⚡

You have everything needed to build, test, and deploy Benton County's TerraFusion stack autonomously. Execute with precision and championship excellence.
