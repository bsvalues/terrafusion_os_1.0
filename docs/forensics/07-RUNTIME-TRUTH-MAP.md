# Runtime Truth Map (Lane 7)

*Deliverable #7.* Status: **complete with cross-check**. Confidence: **high**.
Method: Explore agent traced `Program.cs` boot paths, DI registrations, launcher logic.

## A. LIVE SPINE (wired and bootable)

| Component | Port | Entry / evidence | Status |
|---|---|---|---|
| TerraFusion.API (Kernel) | 5000 | `backend/src/TerraFusion.API/Program.cs` → `MapControllers` + `MapHub` + `app.Run()` | LIVE |
| ~152 API controllers | via :5000 | `backend/src/TerraFusion.API/Controllers/` (152 `.cs`, `[ApiController]`) | LIVE |
| TerraFusion.Gateway (Shell) | 3002 | `backend/TerraFusion.Gateway/Program.cs` (Ocelot + Consul) | LIVE |
| Frontend (React/Vite) | 3000 / built | `frontend/apps/os-shell`, `vite.config.ts:109` → `native-shell/ui/dist` | LIVE |
| SignalR hubs | :5000 | `AddSignalR()`; SystemHub etc. mapped | LIVE |
| MuseService (Ollama LLM) | →:11434 | `MuseService.cs`; reachable via `PilotController POST /explain` | LIVE (latent) |
| Launcher | — | `tools/dev/dev-os.mjs` honors autostart+start contract | LIVE |

## B. DORMANT (registered but returns "unavailable")

- All `backend/src/TerraFusion.Consciousness/Services/*` — `QuantumConsciousnessOrchestrator.cs:15`,
  `ConsciousnessService.cs:153`, `MillionAgentService.cs`, `AILayerMeshOrchestrator.cs:19`,
  `HybridConsciousnessManager.cs:16` → hardcoded **"lane unavailable"**.
- `MultiCountyDataService` — registered, no controller calls it.
- SystemGPT health/forecast — read-only advisory; swarm-action bridge dead.

## C. PRESENT BUT UNREACHABLE (islands / vapor)

| Component | Path | Class |
|---|---|---|
| ai-swarm orchestrator | `os-platform/ai-systems/.../ai-swarm/SwarmOrchestrator.ts` | island (Redis/TF deps, no API wiring) |
| supreme-commander | `os-platform/ai-systems/supreme-commander/` | island |
| elite-dashboard | `os-platform/elite-dashboard-server.js` | **vapor** — `agentCount: 1008 + random*192` |
| GPTController `/explain` | `backend/src/TerraFusion.API/Controllers/GPTController.cs` | vapor — canned per-surface DTOs |

## D. BUILDABLE BUT NOT IN SPINE

`TerraFusion.Experiments`, `TerraFusion.Operations`, `TerraFusion.CurrentUse.Host`,
`CreateAuditLogsTable` (one-off util), `os-platform/core/pilot/local-agent` (proven
locally, no autostart manifest).

## Boot path (cross-checked)
```
Program.cs → CreateCanonicalHostBuilder
  → AddDbContext(TerraFusionContext) → AddControllers() → AddSignalR()
  → AddScoped<MuseService/AICommandService/…>
  → app.MapControllers() → app.MapHub<SystemHub>("/hubs/system") → app.Run()  // :5000
```

## Verdict
The operational spine is **real and distinguishable** from residue. The "AI
consciousness / 1,008-agent swarm" is **not** part of the runtime — it is dormant stubs +
unreachable islands + one fabricated-metric vapor surface.
