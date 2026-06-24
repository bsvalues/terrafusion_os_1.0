# Canonical Truth Brief

*Deliverable #1. The defensible, evidence-backed statement of what TerraFusion **is
right now** — distinguished from what canon/docs claim and what is residue.*

Confidence: **HIGH** for the live spine and history structure; **MEDIUM** where noted.

---

## 1. What is genuinely true (the trusted reality)

### History & repository structure
- The repo has **three disjoint git histories** (3 unrelated root commits). Current
  `main` descends from root `f2511bb` (2026-05-24). The bulk of historical work
  (580 branches) descends from root `7c26657` ("Initial commit", 2025-08-31). A third
  root `5d16d8f` (2026-06-11) carries 73 branches.
  *Evidence:* `git merge-base` returns empty between `main` and legacy branches;
  `git rev-list --max-parents=0` yields 3 distinct roots. See `evidence/branch-roots.txt`.
- **742 remote branches** exist (`git ls-remote --heads` = 741 + this branch).
- `main` is the only protected branch.

### The live runtime spine (real, bootable)
- **TerraFusion.API (Kernel, :5000)** — boots; ~152 controllers wired via
  `app.MapControllers()`; EF Core `TerraFusionContext`; SignalR hubs; health checks.
  *Evidence:* `backend/src/TerraFusion.API/Program.cs`, `backend/src/TerraFusion.API/Controllers/` (152 `.cs`).
- **TerraFusion.Gateway (Shell, :3002)** — Ocelot reverse proxy + Consul discovery, boots.
- **Frontend** — React 18 + Vite, entry `frontend/apps/os-shell`, builds to
  `native-shell/ui/dist`. *Evidence:* `frontend/vite.config.ts:109`.
- **MuseService** (local Ollama LLM, `:11434`) — wired via DI, reachable from
  `PilotController POST /explain`. Real, latent. *Evidence:* `MuseService.cs`, `PilotController.cs`.
- **Launcher** `tools/dev/dev-os.mjs` — honors the Launcher Constitution: starts only
  apps with `autostart === true` AND a present `start`; missing `start` is a non-fatal skip.

### Data & integration
- Harris PACS 9.0 is the **legacy source** database; TerraFusion Sync converts FROM PACS
  INTO the TerraFusion DB. Tyler Vision is **not** in Benton's stack. *Evidence:* `CLAUDE.md`.

---

## 2. What canon/docs CLAIM that the code CONTRADICTS

| Claim (canon/docs/endpoints) | Reality (code) | Evidence | Severity |
|---|---|---|---|
| "1,008 production AI agents live" | Hardcoded constant in ≥5 files; no agents boot | `MissingServiceStubs.cs:64`, `EnterpriseAIAgentCoordinator.cs:239`, `Codex369AgentIntegrationService.cs:51`, `CostForgeAIService.cs:414` | CRITICAL (honesty debt) |
| "Consciousness / quantum orchestration operational" | All services return **"lane unavailable"** | `TerraFusion.Consciousness/Services/QuantumConsciousnessOrchestrator.cs:15`, `ConsciousnessService.cs:153`, `MillionAgentService.cs`, `AILayerMeshOrchestrator.cs:19` | CRITICAL |
| "FISMA-HIGH compliant" | Posture **target**; 13 open critical gaps (AC-3, AU-2, SC-12, IA-2, AC-4 …) | `docs/security/baseline.md:13-29` | CRITICAL |
| "Audit fields auto-stamped" | `AuditableEntityInterceptor` **not implemented/registered**; `AuditLogs` writes `UserId="System"` | `backend/src/TerraFusion.API/Program.cs` (no registration); baseline AU-2 | CRITICAL |
| "County isolation via EF query filters" | Global query filter **commented out**; relies on per-controller `Where` discipline | baseline AC-4 | HIGH |
| "InMemorySecurityService validated" | Always returns `true` (auth bypass) | baseline AC-3 #7 | CRITICAL |
| "DevelopmentLdapService env-gated" | Registered in **both** Dev and Prod DI | baseline IA-2 #4 | CRITICAL |
| "Sealed / production-ready" (`SEALED.md`) | Seal date `2025-12-13` predates much later work; controls exist but seal is aspirational | `SEALED.md` | MEDIUM (anomaly) |

> The good news: the project's own `docs/security/baseline.md` and
> `docs/ai-consolidation/AI_ESTATE_INVENTORY.md` **already document most of these gaps
> honestly.** The contradiction is between those honest docs and the
> louder marketing claims still present in code comments, status endpoints, and `CLAUDE.md`.

---

## 3. What merely EXISTS (residue / dormant / vapor)

- **AI swarm islands**: `os-platform/ai-systems/.../ai-swarm/SwarmOrchestrator.ts`,
  `supreme-commander/`, `elite-dashboard-server.js` (fabricated `1008 + random` metric).
  Not wired to the API. *Evidence:* `AI_ESTATE_INVENTORY.md`.
- **QUARANTINE/** — **2.3 GB / 161 top-level dirs** of dead copies, scaffolds, and
  near-complete system replicas (`TERRAFUSION_OS_CORE`, `_CLEAN_BUILD_ZONE`, multiple
  property-workbench copies). Correctly isolated; do not restore wholesale.
- **Dual `/explain` endpoints**: `PilotController` (real, Muse-backed) vs `GPTController`
  (hardcoded canned responses) — needs consolidation (tracked WO-AI-CONSOLIDATION-00x).

---

## 4. Honest posture statement

TerraFusion has a **real, bootable kernel + gateway + frontend spine** and real Benton
data conversion. It is **not** the "1,008-agent, FISMA-HIGH-accredited, sealed,
production" system that some surfaces claim. It is a **single live system surrounded by
ghosts**, sitting on top of a **fragmented three-root git history** whose largest lineage
(78% of branches) cannot be merged forward. Recovery is therefore a *salvage-and-port*
problem, not a *merge* problem.
