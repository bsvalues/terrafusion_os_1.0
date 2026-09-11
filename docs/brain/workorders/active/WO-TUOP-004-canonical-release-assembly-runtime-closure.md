# WO-TUOP-004 — Canonical Release Assembly + Runtime Dependency Closure

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WO-TUOP-003` |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589 + owner review 2026-09-11 (sequencing + closure directives) |
| Repository | `bsvalues/terrafusion_os_1.0` |
| Risk | R4 — lab build/assembly/launch; no production, no protected data |
| Terminal condition | `CANONICAL_RELEASE_ASSEMBLY_ESTABLISHED_WITH_ZERO_UNKNOWN_CLOSURE_AND_NATIVE_HOST_RELEASE_PROOF` |

## Objective

Settle the native-host authority question through actual build/package/release evidence, produce the
canonical TerraFusion release assembly, and produce the **Runtime Dependency Closure Matrix**. The
repository does not currently prove API + UI bundle + native host are produced together as one
installable product; this WO closes that gap. **WO-TUOP-002 (auth repair) is blocked on this WO** —
auth gets tested and repaired inside the assembled product, not in whatever runtime happens to
answer first.

## Part A — Native-host release proof

WPF `native-shell/Terrafusion.Shell` is the surviving candidate, NOT an assumption:
1. Build it from exact main (`dotnet publish` net8.0-windows) — or establish it cannot be the host.
2. Package or stage it with `./publish` (API) + `native-shell/ui/dist` (UI bundle) as ONE assembly.
3. Launch the assembly on HERMES; prove the host renders the API-served bundle and reports exact
   release identity in-product.
4. If the candidate fails release-proof: record the evidence, classify it, and surface the host
   question — do not silently substitute a browser tab and call it the product.

## Part B — Runtime Dependency Closure Matrix (MANDATORY GATE)

Before "canonical release assembly established" may be recorded, every runtime dependency discovered
in **current source** and confirmed against the **real launched assembly** gets exactly one
classification:

| Classification | Meaning |
| --- | --- |
| `REQUIRED_CORE` | TerraFusion cannot truthfully launch without it; row carries live-launch evidence |
| `REQUIRED_WHEN_ENABLED` | Required only when that capability/profile is enabled |
| `EXTERNAL_BOUNDARY` | Lives outside the main runtime; its state must be known |
| `OPTIONAL` | Enhancement; absence does not break the core product |
| `SUPERSEDED` | Old implementation; must not launch |
| `QUARANTINED/HISTORICAL` | Discovery evidence only |
| `UNKNOWN` | **Assembly cannot pass while any UNKNOWN remains** |

Evidence file: `docs/brain/evidence/WO-TUOP-004-runtime-dependency-closure.md`.

**Discipline:** classify from active-consumer evidence, not from mentions. A platform.json port
declaration does not establish necessity. Worked example (already source-verified 2026-09-11):
`Program.cs` comments Redis "Optional - graceful degradation" with NoOp fallback; its only real
consumers are TerraFusion.AI swarm/monitoring/caching services → classify Redis
`OPTIONAL/UNKNOWN until active-consumer evidence establishes necessity` — NOT core because
platform.json declares a port.

**Seeded first-pass rows (minimum; discovery expands, never shrinks):**

- **Release/host:** canonical native host · OS UI bundle (`native-shell/ui/dist`) · exact release SHA/manifest
- **Core runtime:** TerraFusion API · configuration/environment contract (`platform.json`/env) · ServiceRegistry + ModuleSeedService · migrations/schema state · DB provider/binding (SQLite/Npgsql, connection-string driven)
- **Hosted services (11 registered in Program.cs — classify each):** `StartupOrchestrationService` · `ModuleLoaderService` · `DatabaseInitializationHostedService` · `ArcGisSyncService` · `AICoordinationSupervisorService` · `UnifiedOrchestrationService` · `GovernmentComplianceService` · `PluginHotReloadService` · `QuantumMetricsBackgroundService` · `EliteEndpointValidationService` · `EliteSignalHandlingService`
- **Identity:** authentication · session · RBAC · county identity · tenant/stamp resolution · trust mode (`PUBLIC`/`COUNTY_PROVIDED`/`CONNECTED`)
- **Application plumbing:** SignalR + hubs where actually consumed (8 mapped: OSCore, Enhancement, QuantumMetrics, GPT, Notebook, Analytics, Workflow, Collaboration) · module loading · write-lane enforcement
- **Persistent state:** TerraFusion DB · document/evidence storage · durable storage GPT/Dossier/Pilot require · cache only where actually required
- **Data plane:** TerraFusion Sync · quarantine/reconciliation · provenance/freshness · Edge status (HERMES: simulated/lawful lab sources; CONNECTED production: Edge stays county-local)
- **OS services:** TerraPilot execution path (policy/tool gated) · TerraTrace (append-only spine)
- **AI:** GPT/RAG runtime + whichever inference provider is actually enabled (profile-dependent; statewide canon: Core requires no GPU and no single mandatory provider)
- **Product/support:** five UI layers · five suites · Workbench · Counties HUB / Home Scene · TerraCanon
- **Operations:** logging · health · monitoring · backup/restore · restart/recovery · upgrade/rollback

## Validation

- [ ] Native host release-proven (or its failure recorded with evidence and surfaced)
- [ ] Assembly reproducible: same revision → same `ui/dist` + publish manifest hashes
- [ ] Closure matrix complete: zero UNKNOWN; every REQUIRED_CORE has live-launch evidence; no SUPERSEDED component launches
- [ ] Exact release identity surfaced in-product and verified against the recorded revision
- [ ] Required checks green; independent review; exact-head merge

## Stop conditions

Genuine walls only: new infrastructure authority (SW-01), protected data/credentials (SW-03), Benton
production (SW-04). A failed host build is evidence to record and classify, not a wall — unless no
lawful path to any host remains, which would itself be the finding.

## Continuation

On protected merge: WO-TUOP-002 (auth inside the assembled product) unblocks; then Layer 1 → Layer 5
journeys run against the assembly. The morning loop picks this up automatically.
