# 🌈 TerraFusion PropertyAssessmentGPT — 30-Minute Quickstart

> **TerraFusion OS 1.0 – Genesis Era**  
> _Government. Transcended._

This guide gets you from zero to running PropertyAssessmentGPT queries in under 30 minutes.

---

## 📋 Prerequisites

| Tool | Required Version | Check Command |
|------|------------------|---------------|
| .NET SDK | 8.0+ | `dotnet --version` |
| Node.js | 18+ | `node --version` |
| pnpm | 8+ | `pnpm --version` |
| Make | Any | `make --version` |

**Optional but recommended:**
- `OPENAI_API_KEY` environment variable for real embeddings
- Without it, TerraFusion uses SimulatedEmbeddingService (works great for development!)

---

## 🚀 30-Minute Path

### Step 1: Verify Environment (2 min)

```bash
# Run Herald diagnostics
make doctor
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║  📢 HERALD CONSTELLATION - System Diagnostics               ║
╚══════════════════════════════════════════════════════════════╝

Checking prerequisites:
  ✓ dotnet
  ✓ node
  ✓ pnpm
  ✓ curl

Environment:
  OPENAI_API_KEY: ○ Not set (SimulatedEmbeddings)
```

### Step 2: Start Backend API (5 min)

```bash
# Terminal 1 - Start the API server
make dev-backend
```

Wait until you see:
```
🔨 Forge: Starting backend on port 5000...
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
```

### Step 3: Index RAG Dataset (3 min)

```bash
# Terminal 2 - Index Benton County CAMA data
make gpt-ingest
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║  🌈 ARC CONSTELLATION - RAG Ingestion                       ║
╚══════════════════════════════════════════════════════════════╝
Indexing dataset: benton_cama_basics...
{"status":"ok","indexed":1234}
✅ RAG Ingestion request sent
```

### Step 4: Verify GPT Health (1 min)

```bash
make gpt-health
```

Expected:
```json
{
  "status": "healthy",
  "embeddingProvider": "Simulated",
  "ragDatasets": ["benton_cama_basics"],
  "totalChunks": 1234
}
```

### Step 5: Start Frontend (5 min)

```bash
# Terminal 3 - Start OS Shell
make dev-frontend
```

Open http://localhost:5173 in your browser.

---

## 🧪 Try PropertyAssessmentGPT

### Via API (curl)

```bash
# Ask about property valuation
curl -X POST http://localhost:5000/api/gpt/chat \
  -H "Content-Type: application/json" \
  -d '{"systemGptId": "PropertyAssessmentGPT", "message": "How do I value a residential property in Benton County?"}'
```

### Via OS Shell UI

1. Navigate to http://localhost:5173
2. Open the PropertyAssessmentGPT panel
3. Select a workflow preset (e.g., "Appeal Review")
4. Ask your question

### Example Questions

- "What are the assessment appeal deadlines for Benton County?"
- "Explain the sales comparison approach for rural properties"
- "How do I handle split-use properties under Washington State law?"
- "What factors affect commercial property valuations?"

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gpt/rag/health` | GET | Check RAG service health |
| `/api/gpt/rag/index/{dataset}` | POST | Index a RAG dataset |
| `/api/gpt/system` | GET | List available SystemGPTs |
| `/api/gpt/chat` | POST | Send chat message |
| `/api/gpt/trace` | GET | View conversation trace (audit) |
| `/api/gpt/trace/{traceId}` | GET | Get specific trace |

---

## 🛠️ Make Targets Reference

```bash
# 📢 Herald - Diagnostics
make doctor          # System diagnostics
make gpt-health      # GPT/RAG health check

# 🌈 Arc - RAG Operations
make gpt-ingest      # Index benton_cama_basics dataset
make gpt-system      # List system GPTs
make test-gpt        # Run GPT/RAG tests

# ✨ Radiant - Development
make dev             # Show dev startup instructions
make dev-backend     # Start API (port 5000)
make dev-frontend    # Start OS Shell (port 5173)

# 🔨 Forge - Build Pipeline
make oneclick        # Complete deployment (Gates A-F)
make core            # Build backend + frontend
make validate        # Run all tests
```

---

## 🌟 VS Code Tasks

Press `Ctrl+Shift+P` → "Tasks: Run Task" and select:

| Task | Description |
|------|-------------|
| TerraFusion: Ingest Benton CAMA RAG | Index RAG dataset |
| TerraFusion: GPT/RAG Health Check | Check service health |
| TerraFusion: List System GPTs | Show available GPTs |
| TerraFusion: Run GPT/RAG Tests | Run test suite |
| TerraFusion: Launch Backend (Dev) | Start API server |
| TerraFusion: Launch Frontend (Dev) | Start OS Shell |
| TerraFusion: System Doctor | Run diagnostics |

---

## 🔧 Configuration

### GptRagOptions (appsettings.json)

```json
{
  "GptRag": {
    "UseRealEmbeddings": false,
    "OpenAIApiKey": "${OPENAI_API_KEY}",
    "EmbeddingProvider": "Auto",
    "EmbeddingModel": "text-embedding-ada-002",
    "ChunkSize": 512,
    "ChunkOverlap": 50,
    "TopKResults": 5,
    "SimilarityThreshold": 0.7,
    "RagDatasets": [
      "benton_cama_basics",
      "wa_state_rcw_84",
      "iaao_standards"
    ],
    "EnableTracing": true,
    "EnableAuditLogging": true
  }
}
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `OPENAI_API_KEY` | Real embeddings (optional) | SimulatedEmbeddings |
| `API_URL` | API base URL for make targets | http://localhost:5000 |

---

## 🐛 Troubleshooting

### "API not running" Error

```bash
# Make sure backend is running first
make dev-backend
# Wait for "Now listening on: http://localhost:5000"
# Then run other commands
```

### "No embeddings found"

```bash
# Re-index the dataset
make gpt-ingest
# Verify health
make gpt-health
```

### SimulatedEmbeddings vs Real

- **SimulatedEmbeddings**: Works offline, great for development, deterministic results
- **Real (OpenAI)**: Better semantic matching, requires API key, production-ready

To enable real embeddings:
```bash
export OPENAI_API_KEY="sk-your-key-here"
make dev-backend
```

---

## 📊 Audit & Tracing

PropertyAssessmentGPT automatically logs all interactions for compliance:

```bash
# View all traces
curl http://localhost:5000/api/gpt/trace

# View specific trace
curl http://localhost:5000/api/gpt/trace/{traceId}
```

Trace includes:
- Timestamp
- User query
- RAG context chunks retrieved
- GPT response
- Token usage
- Processing time

---

## 🎯 Next Steps

1. **Explore PropertyAssessmentFlows**: Pre-built workflow presets for common assessor tasks
2. **Add Custom Datasets**: Index your county's specific data via `/api/gpt/rag/index/{dataset}`
3. **Review Architecture**: See `docs/architecture/TF-017_AINative_Governance_Layer.md`
4. **Run Full Pipeline**: `make oneclick` for complete system validation

---

## 🏛️ TerraFusion Constellation Reference

| Constellation | Purpose | Key Features |
|--------------|---------|--------------|
| 📢 **Herald** | Diagnostics & Logging | System health, audit trails |
| 🌈 **Arc** | RAG Pipeline | Embeddings, vector search |
| 🔨 **Forge** | Build & CI/CD | Gates A-F, deployments |
| ✨ **Radiant** | UX & Developer Experience | OS Shell, workflows |
| 🛡️ **Sentinel** | Security & Audit | FISMA compliance, traces |
| 🔮 **Oracle** | Legal Intelligence | RCW 84, IAAO standards |
| 🌍 **Boundless** | GIS Services | PostGIS, parcel mapping |
| 💚 **Guardian** | Health Monitoring | SLA enforcement, alerts |

---

> **"Government. Transcended."**  
> TerraFusion OS 1.0 – Genesis Era  
> Phase 12: OneClick + Developer Experience
