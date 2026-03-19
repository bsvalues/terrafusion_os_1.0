# Wave 4 Persistence Ledger — GPT/RAG Backend Truth Gate

Generated: 2026-03-18

## Truth-Gate Findings

### Root Cause

`TerraFusion.AI` references `TerraFusion.Data`. Adding a reverse reference would create a circular
dependency (`Data → AI → Data`). This is why GPT/RAG DbSet properties were commented out.

### Entity Location Split

| Entity | Namespace | Assembly | Can Data reference? |
|--------|-----------|----------|---------------------|
| GPTConfiguration | TerraFusion.Core.Entities | TerraFusion.Core | ✅ YES |
| GPTConversation | TerraFusion.Core.Entities | TerraFusion.Core | ✅ YES |
| GPTMessage | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| RAGDataset | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| RAGDocument | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| RAGEmbedding | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| GPTUsageMetric | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| GPTAudit | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |
| GPTMarketplaceInstall | TerraFusion.AI.Entities | TerraFusion.AI | ❌ circular dep |

### EF Model State

EF migration snapshot has ZERO GPT/RAG entities. `context.Set<T>()` for any of these
throws `InvalidOperationException` at runtime — all GPT/RAG database access is currently broken.

---

## Full Ledger

| Area | File | Current Backing | Needed? | Action | Notes |
|------|------|-----------------|---------|--------|-------|
| GPT config | TerraFusion.Data/TerraFusionDbContext.cs | commented DbSet | yes | UNCOMMENT DbSet | Entity in Core ✅ |
| GPT config | TerraFusion.Data/Configurations/ | .disabled | yes | ACTIVATE config | Split from disabled file |
| GPT conversations | TerraFusion.Data/TerraFusionDbContext.cs | commented DbSet | yes | UNCOMMENT DbSet | Entity in Core ✅ |
| GPT conversations | TerraFusion.Data/Configurations/ | .disabled | yes | ACTIVATE config | Split from disabled file |
| GPT messages | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| RAG datasets | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| RAG documents | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| RAG embeddings | TerraFusion.AI/Repositories/InMemoryRAGEmbeddingRepository.cs | in-memory (broken at runtime) | yes | HOOK + keep cosine similarity | Embedding search stays C#, storage to DB |
| GPT usage metrics | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| GPT audit | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| GPT marketplace installs | TerraFusion.AI/Entities/GPTConfiguration.cs | never registered | yes | HOOK via static delegate | Entity in AI — use extension hook |
| Dais — Appeal | AppealService.cs + DaisController.cs | real EF (Appeals DbSet) | n/a | LEAVE | Already sealed in Wave 4 pre-work |
| Dais — Exemption | ExemptionService.cs + DaisController.cs | real EF (Exemptions DbSet) | n/a | LEAVE | Already sealed |
| Dais — Certification | CertificationService.cs + DaisController.cs | real EF (CertificationSteps DbSet) | n/a | LEAVE | Already sealed |
| Dais — Notice | NoticeService.cs + DaisController.cs | real EF (Notices DbSet) | n/a | LEAVE | Already sealed |
| Dais — Queue | QueueService.cs + DaisController.cs | real EF (QueueItems DbSet) | n/a | LEAVE | Already sealed |

## In-Memory Inventory Findings

| Location | Pattern | Verdict |
|----------|---------|---------|
| Program.cs:499 | AddScoped<IRAGEmbeddingRepository, InMemoryRAGEmbeddingRepository> | BROKEN at runtime (entity not in model) |
| InMemoryRAGEmbeddingRepository | Uses EF context.Set<RAGEmbedding>() — cosine similarity in C# | Fix: activate entity via hook |
| ProductionPACSDataEngine.cs | new List<TrainingDataset>() | Not a governed GPT/RAG path — LEAVE |
| MarketplaceEngine.cs | ConcurrentDictionary for modules/reviews | Not GPT/RAG path — LEAVE |
| SystemGptGuardrailService.cs | ConcurrentDictionary<CountyId, GuardrailDecision> _lastDecisions | Runtime cache, not persistence — LEAVE |
| SystemGptAtlasAnomalyStore.cs | ConcurrentDictionary<Guid, anomaly> | Runtime telemetry buffer — LEAVE |
| GPTBudgetAlertService.cs | TODO: email service | Not persistence — LEAVE |

## Fix Architecture

### Tier 1: Core entities (immediate, no structural change)
- Uncomment `DbSet<GPTConfiguration>` and `DbSet<GPTConversation>` in TerraFusionDbContext
- Create `GptCoreEntityConfigurations.cs` in TerraFusion.Data
- Apply in OnModelCreating

### Tier 2: AI-only entities (via OnModelCreatingExtensions hook)
- Add `public static Action<ModelBuilder>? OnModelCreatingExtensions` to TerraFusionDbContext
- Create `GptAiEntityConfigurations.cs` in TerraFusion.AI with static `Apply(ModelBuilder mb)`
- Wire in Program.cs: `TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply`

### Migration
- One migration covering all 9 entity tables (7 new + GPTConfigurations + GPTConversations)

## Dais Confirmation

All 5 Dais persistence paths (Appeal, Exemption, Certification, Notice, Queue) use real EF DbSets
and real services. No in-memory stubs found. Dais is **sealed** — no Wave 4 work required.

## Write-Lane Confirmation

- `GPTConfigurationService` has no imports from Dais/Forge/Dossier namespaces
- `RAGService` has no imports from Dais/Forge/Dossier namespaces
- `GPTOrchestrationService` has no imports from Dais/Forge/Dossier namespaces
- TerraGPT write operations: conversation history, usage metrics, config CRUD — GPT domain only ✅

## Definition of Done

- [ ] GPTConfigurations DbSet active, migration created
- [ ] GPTConversations DbSet active, migration created
- [ ] All 7 AI entity types registered via OnModelCreatingExtensions hook
- [ ] EF migration snapshot includes all 9 entity tables
- [ ] Wave4PersistenceRegistrationTests green
- [ ] Wave4PersistenceRoundTripTests green (GPTConfiguration + GPTConversation)
- [ ] Wave4IsolationTests green (CountyId isolation + lane guards)
- [ ] Existing 2,794 backend tests still green
