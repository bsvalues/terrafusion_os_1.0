# TerraFusionGPT Suite - Complete Architecture

## Elite Government OS Engineering - AI-Powered Government Operations

**Classification**: Government AI Platform Architecture
**Status**: 🎯 **DESIGN PHASE** - Championship Architecture Ready
**Date**: October 31, 2025
**Version**: TerraFusion OS 1.0 - GPT Suite v1.0

---

## Executive Summary

The **TerraFusionGPT Suite** is a comprehensive, government-compliant AI platform that enables TerraFusion users to:
1. **Use pre-built government GPTs** (property assessment, tax calculation, citizen service, etc.)
2. **Create custom GPTs** with no-code UI
3. **Share GPTs** in a secure marketplace
4. **Fine-tune models** on government data
5. **Integrate RAG** (Retrieval Augmented Generation) with government documents
6. **Track costs** and optimize AI spending
7. **Maintain FISMA-HIGH compliance** with county data isolation

### Core Capabilities

- 🤖 **Pre-built GPTs**: 20+ government-specific GPTs ready to use
- 🎨 **GPT Studio**: No-code UI for creating custom GPTs
- 🏪 **GPT Marketplace**: Discover, install, and share GPTs
- 📚 **RAG Integration**: Connect to county documents, policies, and regulations
- 🔐 **Security & Compliance**: FISMA-HIGH, county data isolation, audit logging
- 💰 **Cost Management**: Track usage, set budgets, optimize spending
- 🔗 **Multi-Provider**: OpenAI, Anthropic, Azure OpenAI, local models
- 🎯 **Fine-Tuning**: Custom model training on government data

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     TerraFusionGPT Suite                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   GPT Studio │  │  Marketplace │  │  Chat UI     │         │
│  │   (Creator)  │  │  (Discovery) │  │  (Usage)     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│  ┌────────────────────────┴─────────────────────────┐          │
│  │          GPT Orchestration Service                │          │
│  │  (Routing, Caching, Cost Tracking)               │          │
│  └────────────┬─────────────┬────────────┬──────────┘          │
│               │             │            │                      │
│  ┌────────────┴──┐  ┌───────┴─────┐  ┌──┴─────────┐           │
│  │  LLM Providers│  │  RAG Engine │  │  Fine-Tune │           │
│  │  Integration  │  │  (Embeddings)│  │  Service   │           │
│  └───────────────┘  └─────────────┘  └────────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │          Database Layer                           │          │
│  │  (GPT Configs, Conversations, Documents)         │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. GPTConfigurations
Stores all GPT definitions (pre-built and custom)

```sql
CREATE TABLE "GPTConfigurations" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "DisplayName" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "IconUrl" VARCHAR(500),
    "Category" VARCHAR(100), -- PropertyAssessment, TaxCalculation, CitizenService, etc.
    "IsSystemGPT" BOOLEAN DEFAULT FALSE, -- Pre-built vs custom
    "IsPublic" BOOLEAN DEFAULT FALSE, -- Marketplace visibility
    "CreatedByUserId" VARCHAR(450),
    "CountyId" INT, -- County ownership (null = system-wide)

    -- GPT Configuration
    "ModelProvider" VARCHAR(50), -- OpenAI, Anthropic, AzureOpenAI, Local
    "ModelName" VARCHAR(100), -- gpt-4o, claude-sonnet-3.5, etc.
    "SystemPrompt" TEXT NOT NULL,
    "Temperature" DECIMAL(3,2) DEFAULT 0.7,
    "MaxTokens" INT DEFAULT 4000,
    "TopP" DECIMAL(3,2) DEFAULT 1.0,
    "FrequencyPenalty" DECIMAL(3,2) DEFAULT 0.0,
    "PresencePenalty" DECIMAL(3,2) DEFAULT 0.0,

    -- RAG Configuration
    "EnableRAG" BOOLEAN DEFAULT FALSE,
    "RAGDatasetId" INT NULL,
    "RAGTopK" INT DEFAULT 5,
    "RAGScoreThreshold" DECIMAL(3,2) DEFAULT 0.7,

    -- Function Calling
    "EnableFunctions" BOOLEAN DEFAULT FALSE,
    "FunctionsJson" JSONB, -- Available functions

    -- Access Control
    "RequiredRole" VARCHAR(100), -- Administrator, Assessor, Citizen, etc.
    "AllowedCounties" JSONB, -- Array of county IDs (null = all)

    -- Usage & Analytics
    "TotalConversations" BIGINT DEFAULT 0,
    "TotalMessages" BIGINT DEFAULT 0,
    "TotalTokensUsed" BIGINT DEFAULT 0,
    "TotalCost" DECIMAL(18,4) DEFAULT 0,
    "AverageRating" DECIMAL(3,2),
    "RatingCount" INT DEFAULT 0,

    -- Marketplace
    "InstallCount" INT DEFAULT 0,
    "IsFeatured" BOOLEAN DEFAULT FALSE,
    "Price" DECIMAL(18,2) DEFAULT 0, -- 0 = free

    -- Status
    "Status" VARCHAR(50) DEFAULT 'Active', -- Active, Archived, UnderReview
    "Version" VARCHAR(20) DEFAULT '1.0',

    -- Audit fields
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(200),
    "UpdatedBy" VARCHAR(200),

    CONSTRAINT "FK_GPTConfigurations_Counties" FOREIGN KEY ("CountyId") REFERENCES "Counties"("Id")
);

CREATE INDEX "IX_GPTConfigurations_Category" ON "GPTConfigurations"("Category");
CREATE INDEX "IX_GPTConfigurations_IsPublic" ON "GPTConfigurations"("IsPublic");
CREATE INDEX "IX_GPTConfigurations_CountyId" ON "GPTConfigurations"("CountyId");
CREATE INDEX "IX_GPTConfigurations_CreatedByUserId" ON "GPTConfigurations"("CreatedByUserId");
CREATE INDEX "IX_GPTConfigurations_Status" ON "GPTConfigurations"("Status");
```

#### 2. GPTConversations
Stores conversation sessions

```sql
CREATE TABLE "GPTConversations" (
    "Id" SERIAL PRIMARY KEY,
    "GPTConfigurationId" INT NOT NULL,
    "UserId" VARCHAR(450) NOT NULL,
    "CountyId" INT NOT NULL,
    "Title" VARCHAR(500),

    -- Conversation metadata
    "TotalMessages" INT DEFAULT 0,
    "TotalTokensUsed" BIGINT DEFAULT 0,
    "TotalCost" DECIMAL(18,4) DEFAULT 0,
    "Duration" INT, -- seconds

    -- Rating & Feedback
    "Rating" INT, -- 1-5 stars
    "Feedback" TEXT,

    -- Status
    "Status" VARCHAR(50) DEFAULT 'Active', -- Active, Archived, Deleted

    -- Audit
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "LastMessageAt" TIMESTAMP,

    CONSTRAINT "FK_GPTConversations_GPTConfigurations" FOREIGN KEY ("GPTConfigurationId") REFERENCES "GPTConfigurations"("Id"),
    CONSTRAINT "FK_GPTConversations_Counties" FOREIGN KEY ("CountyId") REFERENCES "Counties"("Id")
);

CREATE INDEX "IX_GPTConversations_UserId" ON "GPTConversations"("UserId");
CREATE INDEX "IX_GPTConversations_GPTConfigurationId" ON "GPTConversations"("GPTConfigurationId");
CREATE INDEX "IX_GPTConversations_CountyId" ON "GPTConversations"("CountyId");
CREATE INDEX "IX_GPTConversations_CreatedAt" ON "GPTConversations"("CreatedAt" DESC);
```

#### 3. GPTMessages
Stores individual messages

```sql
CREATE TABLE "GPTMessages" (
    "Id" SERIAL PRIMARY KEY,
    "ConversationId" INT NOT NULL,
    "Role" VARCHAR(20) NOT NULL, -- user, assistant, system, function
    "Content" TEXT NOT NULL,

    -- Token usage
    "PromptTokens" INT DEFAULT 0,
    "CompletionTokens" INT DEFAULT 0,
    "TotalTokens" INT DEFAULT 0,
    "Cost" DECIMAL(18,6) DEFAULT 0,

    -- Model info
    "ModelUsed" VARCHAR(100),
    "Provider" VARCHAR(50),

    -- Function calling
    "FunctionName" VARCHAR(200),
    "FunctionArgs" JSONB,
    "FunctionResult" JSONB,

    -- RAG info
    "RAGDocumentsUsed" JSONB, -- Array of document IDs
    "RAGScore" DECIMAL(3,2),

    -- Metadata
    "ResponseTime" INT, -- milliseconds
    "FinishReason" VARCHAR(50), -- stop, length, function_call, etc.

    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_GPTMessages_Conversations" FOREIGN KEY ("ConversationId") REFERENCES "GPTConversations"("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_GPTMessages_ConversationId" ON "GPTMessages"("ConversationId");
CREATE INDEX "IX_GPTMessages_CreatedAt" ON "GPTMessages"("CreatedAt" DESC);
```

#### 4. RAGDatasets
Stores document collections for RAG

```sql
CREATE TABLE "RAGDatasets" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "CountyId" INT,
    "Category" VARCHAR(100), -- Policies, Regulations, PropertyRecords, etc.

    -- Embeddings configuration
    "EmbeddingProvider" VARCHAR(50), -- OpenAI, Sentence-Transformers, etc.
    "EmbeddingModel" VARCHAR(100), -- text-embedding-3-small, etc.
    "VectorDimension" INT DEFAULT 1536,

    -- Statistics
    "DocumentCount" INT DEFAULT 0,
    "TotalChunks" INT DEFAULT 0,
    "LastIndexedAt" TIMESTAMP,

    -- Status
    "Status" VARCHAR(50) DEFAULT 'Active',

    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(200),
    "UpdatedBy" VARCHAR(200),

    CONSTRAINT "FK_RAGDatasets_Counties" FOREIGN KEY ("CountyId") REFERENCES "Counties"("Id")
);

CREATE INDEX "IX_RAGDatasets_CountyId" ON "RAGDatasets"("CountyId");
CREATE INDEX "IX_RAGDatasets_Category" ON "RAGDatasets"("Category");
```

#### 5. RAGDocuments
Individual documents in RAG datasets

```sql
CREATE TABLE "RAGDocuments" (
    "Id" SERIAL PRIMARY KEY,
    "DatasetId" INT NOT NULL,
    "Title" VARCHAR(500) NOT NULL,
    "Content" TEXT NOT NULL,
    "SourceUrl" VARCHAR(1000),
    "DocumentType" VARCHAR(100), -- PDF, Word, HTML, Text, etc.

    -- Metadata
    "Author" VARCHAR(200),
    "PublishedDate" DATE,
    "Tags" JSONB, -- Array of tags
    "Metadata" JSONB, -- Custom metadata

    -- Processing
    "ChunkCount" INT DEFAULT 0,
    "ProcessedAt" TIMESTAMP,
    "IndexedAt" TIMESTAMP,

    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_RAGDocuments_Datasets" FOREIGN KEY ("DatasetId") REFERENCES "RAGDatasets"("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_RAGDocuments_DatasetId" ON "RAGDocuments"("DatasetId");
```

#### 6. RAGEmbeddings
Vector embeddings for semantic search

```sql
CREATE TABLE "RAGEmbeddings" (
    "Id" SERIAL PRIMARY KEY,
    "DocumentId" INT NOT NULL,
    "ChunkIndex" INT NOT NULL,
    "ChunkText" TEXT NOT NULL,
    "Embedding" VECTOR(1536), -- pgvector extension

    -- Metadata
    "TokenCount" INT,
    "StartPosition" INT,
    "EndPosition" INT,

    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_RAGEmbeddings_Documents" FOREIGN KEY ("DocumentId") REFERENCES "RAGDocuments"("Id") ON DELETE CASCADE
);

-- Vector similarity index (requires pgvector extension)
CREATE INDEX "IX_RAGEmbeddings_Embedding" ON "RAGEmbeddings" USING ivfflat ("Embedding" vector_cosine_ops);
CREATE INDEX "IX_RAGEmbeddings_DocumentId" ON "RAGEmbeddings"("DocumentId");
```

#### 7. GPTMarketplaceInstalls
Tracks GPT installations from marketplace

```sql
CREATE TABLE "GPTMarketplaceInstalls" (
    "Id" SERIAL PRIMARY KEY,
    "GPTConfigurationId" INT NOT NULL,
    "UserId" VARCHAR(450) NOT NULL,
    "CountyId" INT NOT NULL,

    -- Install metadata
    "Version" VARCHAR(20),
    "InstallDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "LastUsedAt" TIMESTAMP,
    "UsageCount" INT DEFAULT 0,

    -- Rating
    "Rating" INT, -- 1-5 stars
    "Review" TEXT,

    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_GPTInstalls_Configurations" FOREIGN KEY ("GPTConfigurationId") REFERENCES "GPTConfigurations"("Id"),
    CONSTRAINT "FK_GPTInstalls_Counties" FOREIGN KEY ("CountyId") REFERENCES "Counties"("Id"),
    UNIQUE("GPTConfigurationId", "UserId", "CountyId")
);

CREATE INDEX "IX_GPTInstalls_UserId" ON "GPTMarketplaceInstalls"("UserId");
CREATE INDEX "IX_GPTInstalls_GPTConfigurationId" ON "GPTMarketplaceInstalls"("GPTConfigurationId");
```

#### 8. GPTUsageMetrics
Detailed usage tracking for cost management

```sql
CREATE TABLE "GPTUsageMetrics" (
    "Id" SERIAL PRIMARY KEY,
    "GPTConfigurationId" INT NOT NULL,
    "ConversationId" INT,
    "MessageId" INT,
    "UserId" VARCHAR(450) NOT NULL,
    "CountyId" INT NOT NULL,

    -- Usage details
    "Provider" VARCHAR(50) NOT NULL,
    "ModelName" VARCHAR(100) NOT NULL,
    "PromptTokens" INT DEFAULT 0,
    "CompletionTokens" INT DEFAULT 0,
    "TotalTokens" INT DEFAULT 0,

    -- Cost calculation
    "PromptTokenCost" DECIMAL(18,6) DEFAULT 0,
    "CompletionTokenCost" DECIMAL(18,6) DEFAULT 0,
    "TotalCost" DECIMAL(18,6) DEFAULT 0,

    -- Performance
    "ResponseTime" INT, -- milliseconds
    "Success" BOOLEAN DEFAULT TRUE,
    "ErrorMessage" TEXT,

    "Timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_GPTUsageMetrics_Configurations" FOREIGN KEY ("GPTConfigurationId") REFERENCES "GPTConfigurations"("Id")
);

CREATE INDEX "IX_GPTUsageMetrics_Timestamp" ON "GPTUsageMetrics"("Timestamp" DESC);
CREATE INDEX "IX_GPTUsageMetrics_CountyId" ON "GPTUsageMetrics"("CountyId");
CREATE INDEX "IX_GPTUsageMetrics_UserId" ON "GPTUsageMetrics"("UserId");
CREATE INDEX "IX_GPTUsageMetrics_GPTConfigurationId" ON "GPTUsageMetrics"("GPTConfigurationId");
```

---

## Pre-Built Government GPTs

### Core Government GPTs

#### 1. PropertyAssessmentGPT
**Purpose**: AI assistant for property assessors
**Capabilities**:
- Property valuation guidance
- Comparable sales analysis
- Appeals handling assistance
- Assessment methodology Q&A

**System Prompt**:
```
You are a property assessment expert for government assessors. You help with:
- Property valuation using comparable sales
- Understanding assessment methodologies
- Handling property owner appeals
- Interpreting state regulations

Always cite relevant regulations and ensure accuracy. If unsure, recommend consulting a senior assessor.
```

#### 2. TaxCalculatorGPT
**Purpose**: Tax calculation and levy assistance
**Capabilities**:
- Property tax calculations
- Levy rate explanations
- Exemption eligibility
- Payment plan guidance

#### 3. CitizenServiceGPT
**Purpose**: 24/7 citizen support
**Capabilities**:
- Answer common questions
- Service navigation
- Form assistance
- Appointment scheduling

#### 4. ComplianceAuditorGPT
**Purpose**: FISMA/NIST compliance assistance
**Capabilities**:
- Compliance checklist guidance
- Audit preparation
- Control implementation
- Documentation review

#### 5. CodeEnforcementGPT
**Purpose**: Building code and zoning assistance
**Capabilities**:
- Code interpretation
- Permit requirements
- Violation resolution
- Zoning regulations

#### 6. EmergencyResponseGPT
**Purpose**: Emergency management support
**Capabilities**:
- Disaster response protocols
- Resource allocation
- Communication templates
- Recovery planning

#### 7. HRPolicyGPT
**Purpose**: HR policy and benefits assistance
**Capabilities**:
- Policy interpretation
- Benefits enrollment
- Leave calculations
- Employee handbook Q&A

#### 8. BudgetAnalystGPT
**Purpose**: Financial planning and analysis
**Capabilities**:
- Budget forecasting
- Variance analysis
- Revenue projections
- Cost optimization

#### 9. ProcurementGPT
**Purpose**: Procurement and contracting
**Capabilities**:
- RFP writing assistance
- Vendor evaluation
- Contract review
- Compliance checks

#### 10. DataAnalystGPT
**Purpose**: Data analysis and reporting
**Capabilities**:
- Report generation
- Trend analysis
- Visualization recommendations
- SQL query assistance

---

## Backend Services

### 1. GPT Configuration Service

```csharp
// backend/TerraFusion.AI/Services/GPTConfigurationService.cs

public class GPTConfigurationService : IGPTConfigurationService
{
    public async Task<GPTConfiguration> CreateGPTAsync(CreateGPTRequest request)
    {
        // Validate request
        ValidateGPTRequest(request);

        // Create configuration
        var gpt = new GPTConfiguration
        {
            Name = request.Name,
            DisplayName = request.DisplayName,
            Description = request.Description,
            SystemPrompt = request.SystemPrompt,
            ModelProvider = request.ModelProvider,
            ModelName = request.ModelName,
            Temperature = request.Temperature,
            MaxTokens = request.MaxTokens,
            CreatedByUserId = _currentUser.Id,
            CountyId = _currentUser.CountyId,
            Status = "Active"
        };

        _context.GPTConfigurations.Add(gpt);
        await _context.SaveChangesAsync();

        return gpt;
    }

    public async Task<List<GPTConfiguration>> GetAvailableGPTsAsync(string userId)
    {
        // Get system GPTs + user's custom GPTs + installed marketplace GPTs
        var systemGPTs = await _context.GPTConfigurations
            .Where(g => g.IsSystemGPT && g.Status == "Active")
            .ToListAsync();

        var userGPTs = await _context.GPTConfigurations
            .Where(g => g.CreatedByUserId == userId && g.Status == "Active")
            .ToListAsync();

        var installedGPTs = await GetInstalledMarketplaceGPTsAsync(userId);

        return systemGPTs.Concat(userGPTs).Concat(installedGPTs).ToList();
    }
}
```

### 2. GPT Orchestration Service

```csharp
// backend/TerraFusion.AI/Services/GPTOrchestrationService.cs

public class GPTOrchestrationService : IGPTOrchestrationService
{
    private readonly ILLMProviderFactory _providerFactory;
    private readonly IRAGService _ragService;
    private readonly ICostTrackingService _costTracking;

    public async Task<GPTResponse> SendMessageAsync(
        int conversationId,
        string message,
        GPTConfiguration config)
    {
        // Start timing
        var startTime = DateTime.UtcNow;

        // Get conversation history
        var history = await GetConversationHistoryAsync(conversationId);

        // RAG augmentation if enabled
        if (config.EnableRAG)
        {
            var ragContext = await _ragService.GetRelevantContextAsync(
                message,
                config.RAGDatasetId.Value,
                config.RAGTopK
            );

            // Augment message with RAG context
            message = AugmentWithRAGContext(message, ragContext);
        }

        // Get appropriate LLM provider
        var provider = _providerFactory.GetProvider(config.ModelProvider);

        // Send to LLM
        var response = await provider.SendMessageAsync(new LLMRequest
        {
            Model = config.ModelName,
            SystemPrompt = config.SystemPrompt,
            Messages = history,
            UserMessage = message,
            Temperature = config.Temperature,
            MaxTokens = config.MaxTokens,
            Functions = config.EnableFunctions ? config.FunctionsJson : null
        });

        // Calculate cost
        var cost = _costTracking.CalculateCost(
            config.ModelProvider,
            config.ModelName,
            response.PromptTokens,
            response.CompletionTokens
        );

        // Save message and metrics
        await SaveMessageAsync(conversationId, message, response, cost);

        var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

        return new GPTResponse
        {
            Content = response.Content,
            TotalTokens = response.TotalTokens,
            Cost = cost,
            ResponseTime = (int)responseTime
        };
    }
}
```

### 3. RAG Service

```csharp
// backend/TerraFusion.AI/Services/RAGService.cs

public class RAGService : IRAGService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly IVectorSearchService _vectorSearch;

    public async Task<string> GetRelevantContextAsync(
        string query,
        int datasetId,
        int topK = 5)
    {
        // Generate query embedding
        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(query);

        // Vector similarity search
        var relevantChunks = await _vectorSearch.SearchAsync(
            queryEmbedding,
            datasetId,
            topK
        );

        // Format context
        var context = FormatRAGContext(relevantChunks);

        return context;
    }

    public async Task IndexDocumentAsync(int documentId)
    {
        var document = await _context.RAGDocuments.FindAsync(documentId);

        // Chunk document
        var chunks = ChunkDocument(document.Content);

        // Generate embeddings for each chunk
        foreach (var (chunk, index) in chunks.Select((c, i) => (c, i)))
        {
            var embedding = await _embeddingService.GenerateEmbeddingAsync(chunk);

            var ragEmbedding = new RAGEmbedding
            {
                DocumentId = documentId,
                ChunkIndex = index,
                ChunkText = chunk,
                Embedding = embedding
            };

            _context.RAGEmbeddings.Add(ragEmbedding);
        }

        await _context.SaveChangesAsync();
    }
}
```

---

## Frontend Components

### 1. GPT Studio (Creator UI)

```typescript
// frontend/src/components/GPTStudio/GPTStudio.tsx

export function GPTStudio() {
  return (
    <div className="gpt-studio">
      <h1>Create Your Custom GPT</h1>

      {/* Step 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Input label="GPT Name" />
          <Input label="Display Name" />
          <Textarea label="Description" rows={4} />
          <Select label="Category">
            <option>Property Assessment</option>
            <option>Tax Calculation</option>
            <option>Citizen Service</option>
            {/* ... */}
          </Select>
          <ImageUpload label="Icon" />
        </CardContent>
      </Card>

      {/* Step 2: Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Select label="Provider">
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="azure">Azure OpenAI</option>
          </Select>

          <Select label="Model">
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-sonnet-3.5">Claude Sonnet 3.5</option>
          </Select>

          <Slider
            label="Temperature"
            min={0}
            max={2}
            step={0.1}
            defaultValue={0.7}
          />

          <Input
            label="Max Tokens"
            type="number"
            defaultValue={4000}
          />
        </CardContent>
      </Card>

      {/* Step 3: System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <p className="text-sm text-gray-500">
            Define your GPT's behavior and expertise
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            label="System Prompt"
            rows={10}
            placeholder="You are an expert in..."
          />

          <div className="prompt-templates">
            <h3>Prompt Templates</h3>
            <Button>Property Assessment Template</Button>
            <Button>Customer Service Template</Button>
            <Button>Data Analysis Template</Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: RAG Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base (RAG)</CardTitle>
        </CardHeader>
        <CardContent>
          <Switch label="Enable RAG" />

          <Select label="Dataset">
            <option>County Policies</option>
            <option>State Regulations</option>
            <option>Property Records</option>
          </Select>

          <FileUpload
            label="Upload Documents"
            accept=".pdf,.doc,.docx,.txt"
            multiple
          />

          <Slider
            label="Retrieval Top-K"
            min={1}
            max={20}
            defaultValue={5}
          />
        </CardContent>
      </Card>

      {/* Step 5: Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Function Calling</CardTitle>
        </CardHeader>
        <CardContent>
          <Switch label="Enable Functions" />

          <div className="function-list">
            <Checkbox label="Calculate Property Tax" />
            <Checkbox label="Search Property Records" />
            <Checkbox label="Send Email" />
            <Checkbox label="Create Appointment" />
          </div>

          <Button>Add Custom Function</Button>
        </CardContent>
      </Card>

      {/* Step 6: Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <Select label="Required Role">
            <option>Anyone</option>
            <option>Assessor</option>
            <option>Administrator</option>
          </Select>

          <Switch label="Make Public (Marketplace)" />

          <Input
            label="Price (optional)"
            type="number"
            placeholder="0.00"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="actions">
        <Button variant="outline">Save Draft</Button>
        <Button>Test GPT</Button>
        <Button variant="primary">Publish</Button>
      </div>
    </div>
  );
}
```

### 2. GPT Marketplace

```typescript
// frontend/src/components/GPTMarketplace/GPTMarketplace.tsx

export function GPTMarketplace() {
  return (
    <div className="gpt-marketplace">
      <h1>TerraFusion GPT Marketplace</h1>

      {/* Search & Filters */}
      <div className="search-filters">
        <Input
          type="search"
          placeholder="Search GPTs..."
          icon={<SearchIcon />}
        />

        <Select label="Category">
          <option>All Categories</option>
          <option>Property Assessment</option>
          <option>Tax Calculation</option>
          {/* ... */}
        </Select>

        <Select label="Sort By">
          <option>Most Popular</option>
          <option>Highest Rated</option>
          <option>Recently Added</option>
        </Select>
      </div>

      {/* Featured GPTs */}
      <Section title="Featured GPTs">
        <GPTGrid gpts={featuredGPTs} />
      </Section>

      {/* Categories */}
      <Section title="Browse by Category">
        <CategoryGrid categories={categories} />
      </Section>

      {/* All GPTs */}
      <Section title="All GPTs">
        <GPTGrid gpts={allGPTs} />
      </Section>
    </div>
  );
}

function GPTCard({ gpt }: { gpt: GPTConfiguration }) {
  return (
    <Card className="gpt-card">
      <div className="gpt-icon">
        <img src={gpt.iconUrl} alt={gpt.displayName} />
      </div>

      <CardHeader>
        <CardTitle>{gpt.displayName}</CardTitle>
        <Badge>{gpt.category}</Badge>
      </CardHeader>

      <CardContent>
        <p>{gpt.description}</p>

        <div className="stats">
          <span>⭐ {gpt.averageRating} ({gpt.ratingCount})</span>
          <span>📦 {gpt.installCount} installs</span>
        </div>

        <div className="provider">
          <span>Powered by {gpt.modelProvider}</span>
        </div>
      </CardContent>

      <CardFooter>
        {gpt.price > 0 ? (
          <Button>${gpt.price}/month</Button>
        ) : (
          <Button>Install Free</Button>
        )}

        <Button variant="outline">Preview</Button>
      </CardFooter>
    </Card>
  );
}
```

### 3. GPT Chat UI

```typescript
// frontend/src/components/GPTChat/GPTChat.tsx

export function GPTChat({ gptId }: { gptId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gpt/chat', {
        method: 'POST',
        body: JSON.stringify({
          gptId,
          conversationId: currentConversation.id,
          message: input
        })
      });

      const data = await response.json();

      setMessages([...messages, userMessage, {
        role: 'assistant',
        content: data.content,
        tokens: data.totalTokens,
        cost: data.cost
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gpt-chat">
      <ChatHeader gpt={currentGPT} />

      <ChatMessages messages={messages} loading={loading} />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        placeholder="Type your message..."
      />

      <ChatFooter>
        <span>Tokens: {totalTokens}</span>
        <span>Cost: ${totalCost.toFixed(4)}</span>
      </ChatFooter>
    </div>
  );
}
```

---

## Cost Management

### Token Pricing (Example)

```typescript
const TOKEN_PRICING = {
  openai: {
    'gpt-4o': {
      prompt: 0.000005,      // $5 per 1M tokens
      completion: 0.000015   // $15 per 1M tokens
    },
    'gpt-4-turbo': {
      prompt: 0.00001,
      completion: 0.00003
    }
  },
  anthropic: {
    'claude-sonnet-3.5': {
      prompt: 0.000003,
      completion: 0.000015
    }
  }
};
```

### Cost Tracking Dashboard

- **Real-time cost tracking** per GPT, per user, per county
- **Budget alerts** when approaching limits
- **Usage analytics** to identify cost optimization opportunities
- **Comparative analysis** between models

---

## Next Steps

This architecture is ready for implementation. The next phase would be creating the actual services, controllers, and UI components.

Would you like me to continue with implementation?
