## TerraFusion Command Portal — AI Coding Agent Guide

### Big Picture
- Backend: Rust + Axum single binary at `backend/src/main.rs` with modular services (`agent_relay.rs`, `federation_relay.rs`, `ai_service.rs`, `workspace_service.rs`, etc.). Heavy WebSocket + JSON APIs. Default port: 8787.
- Frontend: Primary dev/Docker app is Next.js 15 + React 19 in `apps/terrafusion-web/`. There is also a Vite React app in `frontend/` used by root builds.
- Monorepo: Managed via npm workspaces (`apps/*`, `frontend`, `frontend-legacy`, `packages/*`).

### Developer Workflows
- Backend dev: `cd backend && cargo run` (serves on `:8787`).
- Frontend dev (Next): `cd apps/terrafusion-web && npm run dev` (port `5177`).
- Full stack dev: `npm run dev` (runs Next + backend via `concurrently`).
- Build (root): `npm run build` → runs `frontend/` Vite build + `cargo build --release`.
- Tests: `cd backend && cargo test`; `cd apps/terrafusion-web && npm run type-check && npm run test`.
- Docker (local): `docker compose up` using `docker-compose.yml` (binds `8787` and `3000` to localhost). Make targets: `make up`, `make api`. Note: `make web` runs Vite dev in `frontend/` (5173), not the Next app.

### Quick Start
```bash
# Start backend (Rust)
cd backend && cargo run

# In another shell, start frontend (Next)
cd apps/terrafusion-web && npm run dev

# Or run both from repo root
npm run dev

# Docker (Next + API, prod-like)
docker compose up --build
```

### Interfaces & Endpoints (from `backend/src/main.rs`)
- Health: `GET /api/portal/health`, `GET /health`, `GET /health/live`, `GET /health/ready`, `GET /metrics`.
- AI: `POST /api/ai/query` (context-enriched), `POST /api/portal/ask` (adapter to Claude/GPT + MCP).
- WebSockets: `WS /ws` (general streaming), `WS /ws/federation` (federation monitoring).
- IDE APIs: modules (`GET /api/modules/list`, `POST /api/modules/search`, `GET /api/modules/:id`), workspaces (`GET /api/workspaces/list`, `GET /api/workspaces/:id`), files (`POST /api/files/list|read|write`), tasks (`POST /api/tasks/available|run`), terminal (`GET /api/terminal/commands`).
- Auth: `POST /api/auth/login|refresh|logout`, `GET /api/auth/me`, `GET /api/auth/metrics` (JWT-based).

### IDE API Cheatsheet
| Area | Method | Path | Notes |
|---|---|---|---|
| Modules | GET | `/api/modules/list` | Enumerate modules from `REPO_ROOT` |
| Modules | GET | `/api/modules/:id` | Single module metadata |
| Modules | POST | `/api/modules/search` | Body matches `SearchQuery` |
| Workspaces | GET | `/api/workspaces/list` | List workspaces |
| Workspaces | GET | `/api/workspaces/:id` | Workspace details |
| Files | POST | `/api/files/list` | `{ workspace_id, path? }` |
| Files | POST | `/api/files/read` | `{ workspace_id, path }` |
| Files | POST | `/api/files/write` | Path format: `<workspace_id>/<relative_path>` |
| Tasks | POST | `/api/tasks/available` | `{ module_id, module_path? }` |
| Tasks | POST | `/api/tasks/run` | `{ task_id, module_id, module_path? }` |
| Terminal | GET | `/api/terminal/commands` | Supported commands listing |
| WebSocket | WS | `/ws` | General stream; JSON messages |
| Federation | WS | `/ws/federation` | Federation monitoring stream |

### Project Patterns
- Backend state: shared via `Arc<...>` and composed routers in `main.rs`; per-domain services live in `backend/src/*.rs`.
- Real-time and federation: `federation_relay.rs` simulates 7-county mesh; subscribe over `WS /ws/federation`.
- Frontend state: Zustand + React Query; 3D via Three.js in `apps/terrafusion-web`.
- CORS: permissive `CorsLayer::new().allow_*` for dev; tighten for production.

### Gotchas (Observed)
- Next vs Vite: `npm run dev` uses Next.js app in `apps/terrafusion-web` (5177). `npm run build` targets `frontend/` (Vite React 18). Use the right one for your task.
- Makefile `web` target starts Vite (`frontend/`) on 5173; Docker uses Next app. Prefer `npm run dev` for full-stack Next + Rust.
- WebSocket paths: there is no `/ws/agents` route registered; use `/ws` or `/ws/federation`.
- Env: `REPO_ROOT` defaults to a Windows path in `main.rs`; set it explicitly in Linux dev/CI if file-system features depend on it.

### Environment Variables
- Backend: `REPO_ROOT` (absolute repo path; override Windows default), `RUST_LOG=info`, `RUST_BACKTRACE=1`, `PORT=8787` (implicit), `TF_ENVIRONMENT`.
- Frontend (Next): `BACKEND_URL` for Docker builds (see `docker-compose.yml`), `NEXT_TELEMETRY_DISABLED=1`.
- Docker full-stack: see `docker-compose.full-stack.yml` for `DATABASE_URL`, `REDIS_URL`, `WORKSPACE_ROOT`.

### Pointers
- Backend entry: `backend/src/main.rs` (routes + service wiring).
- Key services: `backend/src/agent_relay.rs`, `backend/src/federation_relay.rs`, `backend/src/ai_service.rs`, `backend/src/workspace_service.rs`.
- Frontend (Next): `apps/terrafusion-web/app/`, config in `apps/terrafusion-web/next.config.ts`.
- Docker: `docker-compose.yml` (Next + API), `docker-compose.full-stack.yml` (adds Postgres/Redis for extended scenarios).

### Auth & Local Testing
```bash
# Login (dev sample creds in code)
curl -s http://localhost:8787/api/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"email":"admin@terrafusion.gov","password":"admin123"}' | jq .

# Use token to query profile
TOKEN="$(curl -s http://localhost:8787/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@terrafusion.gov","password":"admin123"}' | jq -r .access_token)"
curl -s http://localhost:8787/api/auth/me -H "Authorization: Bearer $TOKEN" | jq .

# Ask AI with context
curl -s http://localhost:8787/api/ai/query \
	-H 'Content-Type: application/json' \
	-d '{"workspace":"default","query":"List modules"}' | jq .
```

### Federation Monitoring Quick Checks
```bash
curl -s http://localhost:8787/api/federation/dashboard | jq .
curl -s http://localhost:8787/api/federation/counties | jq .
curl -s http://localhost:8787/api/federation/connections | jq .
```

### WebSocket Debugging
```bash
# General stream
npx wscat -c ws://localhost:8787/ws

# Federation monitoring stream
npx wscat -c ws://localhost:8787/ws/federation
```

### Linux Dev Note
- Set `REPO_ROOT` to this repo path to avoid Windows default: `export REPO_ROOT="$PWD/.."` (adjust as needed).