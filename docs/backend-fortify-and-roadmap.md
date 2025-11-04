## Fortify TerraFlow (Backend) — Recommendations & Implementation Roadmap

Objective
- Strengthen TerraFlow (the AI orchestration & experiments path) with services and patterns that enable reproducible research, safe rollouts, and efficient observability.

Concrete backend additions
1. Experiment Manager microservice (`TerraFusion.Experiments`)
   - Responsibilities: persist manifests, validate dataset/model pointers, schedule runs, coordinate with `TerraFusion.Consciousness` to spawn agents, and archive telemetry pointers.
   - API endpoints: POST /api/experiments, GET /api/experiments/{id}, POST /api/experiments/{id}/start, POST /api/experiments/{id}/cancel
   - DB: `Experiments` table with JSON manifest column, status, owner, createdAt.

2. Sandbox Runner
   - Lightweight runtime for running experiments against synthetic or redacted county data. Runs in a dedicated namespace and sends telemetry to test Prometheus/ClickHouse stacks.

3. Replay Engine
   - Given an experiment manifest + seed + commit, re-run deterministically in sandbox and produce a diff report vs original run.

4. Model & Dataset Registry Enhancements
   - Model signatures (hash), provenance metadata, tags, and automatic vulnerability checks.
   - Dataset snapshots with checksum and sample manifest.

5. Resource Accounting & Costing
   - Per-experiment resource usage counters (CPU seconds, memory GB-hours) stored in `ExperimentUsage` table. Integrate with billing/cost dashboards.

6. Simulation Harness
   - Offline simulator that can simulate N agents on fewer resources for behavior testing and stress tests.

Roadmap & milestones (90-day plan)
 - Week 0–2: Scaffolding & Safety
   - Create `TerraFusion.Experiments` project, DB migrations, and register health checks.
   - Add Experiment manifest schema and unit tests for validation.
   - Implement GitHub Action to flag PRs that change orchestrator code without `AI-SWARM` label.

 - Week 3–6: MVP run path
   - Implement POST /api/experiments and a simple scheduler that calls a `RunExperiment` handler which delegates to `AICommandService`.
   - Build a lightweight Sandbox Runner and start mapping telemetry ingestion to ClickHouse.
   - Add initial SignalR hub `/hubs/experiments` to publish ExperimentUpdate events.

 - Week 7–12: Replay, Registry, and Observability
   - Add Replay Engine endpoints and UI hooks.
   - Enhance Model and Dataset registry with versioning and metadata.
   - Complete Prometheus + Grafana dashboards and hook alerting for canary thresholds.

 - Week 13–90: Hardening
   - Canary automation, rollbacks, Vault integration, cost accounting, and enterprise QA.

Acceptance criteria (initial)
- Experiment manifest persisted and retrievable.
- Scheduler can kick a sandbox run and push ExperimentUpdate events to `/hubs/experiments`.
- Telemetry for sandbox runs ingested into ClickHouse and visible in Grafana.

Developer notes & repo mapping
- Add new project under `backend/TerraFusion.Experiments/`.
- Migrations: `TerraFusion.Data` should get new migrations; follow existing patterns (DbContext, Configurations folder).
- Register new health checks in `Program.cs` and add to `/health` endpoint.

Quick dev verification commands

```powershell
# Build new project
dotnet build TerraFusion.sln

# Run API locally
dotnet run --project backend/TerraFusion.Experiments --urls "http://localhost:5010"

# Apply migrations (development)
dotnet ef database update --project TerraFusion.Data --startup-project backend/TerraFusion.API
```

Notes
- Keep experiment runner and scheduling lightweight initially: orchestration commands should be idempotent and record output to an artifacts store (S3/MinIO).
- All experiment actions must create AuditLog entries.
