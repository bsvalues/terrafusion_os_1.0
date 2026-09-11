# WO-TUOP-004 — Canonical Release Assembly + Runtime Dependency Closure

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WO-TUOP-003_AND_WO-TUOP-005` (owner rev-5: dispatches only when BOTH are protected-main complete — the assembled product must launch via the contract-consumed launcher 005 repairs) |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589 + owner review 2026-09-11 (sequencing + closure directives) |
| Repository | `bsvalues/terrafusion_os_1.0` |
| Risk | R4 — lab build/assembly/launch; no production, no protected data |
| Terminal condition | `TERRAFUSION_LAUNCH_BOUNDARY_COMPLETE: canonical release assembly established, closure matrix across all seven domains with no aggregate PASS / no UNKNOWN / no superseded component running / every REQUIRED_CORE live-proven in the exact assembled revision, native host release-proven. This completes the DEFINITION of what TerraFusion is when launched — product completion follows when the five layers and applications are actually operated. |

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

**The closure matrix is structured as SEVEN DOMAINS, each decomposed into individual rows
(owner refinement, 2026-09-11). Discovery expands the rows; it never shrinks them.**

**HARD RULE — NO AGGREGATE ROWS.** There is no row called "five suites" or "Layer 5". An aggregate
PASS is how the estate historically claimed "TerraForge = PASS because `/forge` opened" while
CostForge/CompsForge/SalesForge did nothing. Every claimed component gets its own row, its own
classification, its own evidence.

```text
1. RELEASE ASSEMBLY        host · API · UI bundle · release identity · package/install
2. RUNTIME FOUNDATION      config · ServiceRegistry · ModuleRegistry · DB · migrations ·
                           hosted services · realtime/hubs
3. SECURITY + IDENTITY     auth/session · JWT/passkeys · secrets/keys · TLS/certs · RBAC ·
                           county identity · entitlement/policy/profile state
4. DATA FOUNDATION         TerraFusion DB · county catalog · provenance/trust · Sync ·
                           quarantine/reconciliation · Edge posture · durable artifact/document stores
5. TERRAFUSION PRODUCT     L1 OS Shell · L2 Home Scene · Counties HUB · L3 five suite homes ·
                           L4 Workbench · L5 real applications
6. CROSS-CUTTING OS        TerraPilot · TerraTrace · TerraCanon · enabled AI/GPT/RAG runtime
7. OPERABILITY             health · logs · monitoring · restart · persistence · backup/restore ·
                           upgrade · rollback
```

**Domain 5 decomposes to individual rows (minimum):**

```text
OS Shell · Home Scene · Counties HUB
TerraForge suite home · TerraAtlas suite home · TerraDais suite home · TerraDossier suite home · TerraGPT suite home
Property Workbench: Summary · Forge contribution · Atlas contribution · Dais contribution ·
                    Dossier contribution · Pilot contribution
TerraPilot · TerraTrace · TerraCanon
Layer 5 (one row per application actually claimed in V1): CostForge · CompsForge · SalesForge ·
IncomeForge · ParcelLens · LayerWorks · TerraLevy · … (claim list comes from the product's own
registry/manifest, not from this WO's imagination — an application not claimed in V1 is out of scope,
and claiming one that doesn't work is the defect)
```

**Domain 2 hosted-service rows (11 registered in Program.cs — classify each individually):**
`StartupOrchestrationService` · `ModuleLoaderService` · `DatabaseInitializationHostedService` ·
`ArcGisSyncService` · `AICoordinationSupervisorService` · `UnifiedOrchestrationService` ·
`GovernmentComplianceService` · `PluginHotReloadService` · `QuantumMetricsBackgroundService` ·
`EliteEndpointValidationService` · `EliteSignalHandlingService`.
**Realtime rows:** SignalR registration + each consumed hub individually (8 mapped: OSCore,
Enhancement, QuantumMetrics, GPT, Notebook, Analytics, Workflow, Collaboration) — a mapped hub with
no consumer is classified, not silently counted core.

**Domain 3 SECURITY / TRUST MATERIAL (explicit group — owner refinement; identity alone is not
enough). Source-verified rows from `backend/src/TerraFusion.Security/SecurityConfig.cs`:**

```text
JWT signing/key material (SecretKey: "Resolved from configuration or key vault. Do NOT store the
actual secret here in production.")
token issuer/audience (Issuer=TerraFusion, Audience=TerraFusionServices)
passkey/WebAuthn configuration
CORS policy (AllowedOrigins)
HTTPS/TLS posture (RequireHttps default true)
certificate/key material
rate-limit policy (RateLimitSettings)
session duration/timeout (MaxSessionDurationMinutes=480, IdleTimeoutMinutes=30)
county-isolation security policy
secret/configuration source
SignalR authenticated-token path
```

Each row gets REQUIRED_CORE / REQUIRED_WHEN_ENABLED / environment-specific classification.
**Known drift to reconcile (do NOT fix by guessing):** `SecurityConfig.cs` `CorsSettings.AllowedOrigins`
defaults to `http(s)://localhost:3000` and `http(s)://localhost:5000` while `platform.json` lists
3000/5000 as deprecated ports and the canonical API default is 5046 (`TF_API_PORT`). 004/005 must
determine the active deployment origins from real deployment evidence and reconcile — in the same
lane as the launcher/configuration drift (WO-TUOP-005 scope).

**Domain 3/6 ENTITLEMENT / CAPABILITY ACTIVATION (explicit group — owner refinement):**

```text
role claims · county policy · license/entitlement · feature/profile flags · tool allowlists ·
module availability state
```

Source anchor: the Pilot contract `frontend/apps/os-shell/src/contracts/pilot.ts` carries
`enabledBy?: { license?: string; policyFlag?: string }` alongside required claims. The product must
be able to answer **"why is this tool present or absent?"** and distinguish: not implemented ·
implemented but disabled by policy · implemented but license unavailable · implemented but wrong
role · broken · intentionally unavailable. **Without this group the closure could discover a
policy-disabled module and mistakenly rebuild it — the exact failure mode this mission exists to
end.**

**Mention ≠ dependency (inviolate).** Platform-contract mentions, estate-wide code searches, and
historical documents do not establish runtime necessity. Verified worked examples: `BlobServiceClient`
hits are QUARANTINE BS_PACS material, not proof Azure Blob is a current runtime dependency;
`AddQuartz` surfaced only in an old Harris PACS completion document, not the active API runtime;
Redis is "Optional - graceful degradation" in Program.cs with only TerraFusion.AI consumers →
OPTIONAL/UNKNOWN pending necessity evidence despite platform.json declaring its port.

## Validation

- [ ] Native host release-proven (or its failure recorded with evidence and surfaced)
- [ ] Assembly reproducible: same revision → same `ui/dist` + publish manifest hashes
- [ ] Closure matrix complete: **no aggregate PASS, no UNKNOWN, no superseded component running; every REQUIRED_CORE component live-proven inside the exact assembled revision**
- [ ] Exact release identity surfaced in-product and verified against the recorded revision
- [ ] Required checks green; independent review; exact-head merge

## Stop conditions

Genuine walls only: new infrastructure authority (SW-01), protected data/credentials (SW-03), Benton
production (SW-04). A failed host build is evidence to record and classify, not a wall — unless no
lawful path to any host remains, which would itself be the finding.

## Continuation

On protected merge: WO-TUOP-002 (auth inside the assembled product) unblocks; then Layer 1 → Layer 5
journeys run against the assembly. The morning loop picks this up automatically.
