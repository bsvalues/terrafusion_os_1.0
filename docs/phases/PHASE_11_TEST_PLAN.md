# Phase 11: GPT/RAG Audit & Traceability – TEST PLAN

**Test Philosophy**: Test-First Development with SimulatedEmbeddings
**Coverage Target**: 100% of new code paths, 0 regression on existing tests

---

## Test Categories

### Category 1: RAGChunkDetail Model Tests (Unit)

**File**: `TerraFusion.AI/Tests/GPTServiceTests.cs`

```csharp
[Fact]
public void RAGChunkDetail_NewInstance_HasCorrectDefaults()
{
    var detail = new RAGChunkDetail();
    Assert.Equal(0, detail.ChunkId);
    Assert.Equal(string.Empty, detail.DocumentTitle);
    Assert.Equal(string.Empty, detail.TextSnippet);
    Assert.Equal(0m, detail.Score);
}

[Fact]
public void RAGChunkDetail_SetProperties_RetainsValues()
{
    var detail = new RAGChunkDetail
    {
        ChunkId = 42,
        DocumentTitle = "Benton CAMA Guide",
        TextSnippet = "Property assessment follows RCW 84.40...",
        Score = 0.95m
    };
    
    Assert.Equal(42, detail.ChunkId);
    Assert.Equal("Benton CAMA Guide", detail.DocumentTitle);
    Assert.Contains("RCW 84.40", detail.TextSnippet);
    Assert.Equal(0.95m, detail.Score);
}

[Fact]
public void RAGChunkDetail_TextSnippet_TruncatesLongContent()
{
    var longText = new string('A', 500);
    var detail = new RAGChunkDetail { TextSnippet = longText };
    
    // Implementation should truncate to 200 chars
    Assert.True(detail.TextSnippet.Length <= 200);
}
```

### Category 2: RAGSearchResult Enhancement Tests (Unit)

**File**: `TerraFusion.AI/Tests/GPTServiceTests.cs`

```csharp
[Fact]
public void RAGSearchResult_ChunkDetails_CanBePopulated()
{
    var result = new RAGSearchResult
    {
        Context = "Combined context from chunks",
        DocumentIds = new List<string> { "doc-1", "doc-2" },
        AverageScore = 0.87m,
        ChunksRetrieved = 3,
        ChunkDetails = new List<RAGChunkDetail>
        {
            new() { ChunkId = 1, DocumentTitle = "Doc 1", TextSnippet = "Chunk 1 text", Score = 0.92m },
            new() { ChunkId = 2, DocumentTitle = "Doc 1", TextSnippet = "Chunk 2 text", Score = 0.85m },
            new() { ChunkId = 3, DocumentTitle = "Doc 2", TextSnippet = "Chunk 3 text", Score = 0.84m }
        }
    };
    
    Assert.Equal(3, result.ChunkDetails.Count);
    Assert.Equal(0.92m, result.ChunkDetails[0].Score);
}

[Fact]
public void RAGSearchResult_ChunkDetails_DefaultsToEmptyList()
{
    var result = new RAGSearchResult();
    Assert.NotNull(result.ChunkDetails);
    Assert.Empty(result.ChunkDetails);
}
```

### Category 3: GPTAudit RAGChunkDetails Serialization Tests (Unit)

**File**: `TerraFusion.AI/Tests/GPTServiceTests.cs`

```csharp
[Fact]
public void GPTAudit_RAGChunkDetails_CanSerializeChunkArray()
{
    var chunks = new List<RAGChunkDetail>
    {
        new() { ChunkId = 1, DocumentTitle = "Guide", TextSnippet = "Text...", Score = 0.9m }
    };
    
    var audit = new GPTAudit
    {
        RAGUsed = true,
        RAGChunkDetails = JsonSerializer.Serialize(chunks)
    };
    
    var deserialized = JsonSerializer.Deserialize<List<RAGChunkDetail>>(audit.RAGChunkDetails);
    Assert.Single(deserialized);
    Assert.Equal("Guide", deserialized[0].DocumentTitle);
}

[Fact]
public void GPTAudit_RAGChunkDetails_HandlesNullGracefully()
{
    var audit = new GPTAudit { RAGChunkDetails = null };
    Assert.Null(audit.RAGChunkDetails);
}
```

### Category 4: Trace API Response Tests (Integration)

**File**: `TerraFusion.Integration.Tests/GptSurfaceTests.cs`

```csharp
[Fact]
public void TraceMessageDto_HasRAGChunkDetailsProperty()
{
    var dto = new TraceMessageDto
    {
        Id = 1,
        Role = "assistant",
        Content = "Response with RAG",
        RAGUsed = true,
        RAGChunkDetails = new List<RAGChunkDetailDto>
        {
            new() { ChunkId = 1, DocumentTitle = "Source", TextSnippet = "Relevant text", Score = 0.88m }
        }
    };
    
    Assert.NotNull(dto.RAGChunkDetails);
    Assert.Single(dto.RAGChunkDetails);
}

[Fact]
public void ConversationTraceResponse_IncludesChunkDetails()
{
    var response = new ConversationTraceResponse
    {
        ConversationId = 42,
        Messages = new List<TraceMessageDto>
        {
            new() { Id = 1, Role = "user", RAGUsed = false },
            new() { Id = 2, Role = "assistant", RAGUsed = true, RAGChunkDetails = new List<RAGChunkDetailDto>
            {
                new() { ChunkId = 1, DocumentTitle = "Doc", TextSnippet = "Text", Score = 0.9m }
            }}
        }
    };
    
    Assert.Equal(2, response.Messages.Count);
    Assert.NotNull(response.Messages[1].RAGChunkDetails);
}
```

### Category 5: Frontend Component Tests (Jest/Vitest)

**File**: `frontend/apps/os-shell/src/components/gpt/__tests__/RAGSourcesPanel.test.tsx`

```tsx
describe('RAGSourcesPanel', () => {
  it('renders empty state when no chunks', () => {
    render(<RAGSourcesPanel chunks={[]} />);
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('renders chunk snippets with scores', () => {
    const chunks = [
      { chunkId: 1, documentTitle: 'Guide', textSnippet: 'Important text...', score: 0.92 }
    ];
    render(<RAGSourcesPanel chunks={chunks} />);
    
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(screen.getByText(/Important text/)).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it('expands/collapses document sections', async () => {
    const chunks = [
      { chunkId: 1, documentTitle: 'Doc 1', textSnippet: 'Text 1', score: 0.9 },
      { chunkId: 2, documentTitle: 'Doc 1', textSnippet: 'Text 2', score: 0.85 }
    ];
    render(<RAGSourcesPanel chunks={chunks} />);
    
    const expandButton = screen.getByRole('button', { name: /Doc 1/i });
    await userEvent.click(expandButton);
    
    expect(screen.getByText('Text 1')).toBeVisible();
    expect(screen.getByText('Text 2')).toBeVisible();
  });
});
```

---

## Test Execution Plan

### Phase 11.1: Unit Tests First (TDD)

```bash
# Run existing GPTAudit tests as baseline
cd backend && dotnet test TerraFusion.sln --filter "GPTAudit" --nologo

# Expected: 4/4 pass (existing baseline)
```

### Phase 11.2: Add New Unit Tests

1. Add `RAGChunkDetail` model
2. Write tests for new model
3. Run tests → should fail (TDD red)
4. Implement model
5. Run tests → should pass (TDD green)

### Phase 11.3: Integration Tests

```bash
# Run full GPT/RAG test suite
cd backend && dotnet test TerraFusion.sln --filter "Category=GptRag|GPTAudit" --nologo

# Expected: All pass including new trace tests
```

### Phase 11.4: Frontend Tests

```bash
# Run frontend component tests
cd frontend/apps/os-shell && npm test -- --testPathPattern="RAGSourcesPanel"

# Expected: All pass for new RAGSourcesPanel component
```

---

## Test Data Requirements

### SimulatedEmbeddings Test Data

The `SimulatedEmbeddingService` provides deterministic responses for testing:

```csharp
// Returns consistent vector for same input
var embedding = await embeddingService.GenerateEmbeddingAsync("property assessment");
// Result: [0.1, 0.2, 0.3, 0.4, ...]

// Similarity search returns top-k results with mock chunks
var results = await ragService.GetRelevantContextAsync(datasetId: 1, query: "assessment", topK: 3);
// Result includes ChunkDetails with simulated text snippets
```

### Trace Test Fixtures

```csharp
// Test conversation with RAG-enabled message
var testConversation = new GPTConversation
{
    Id = 1,
    GPTConfigurationId = 1, // RAG-enabled GPT
    CountyId = 1
};

var testMessage = new GPTMessage
{
    Id = 1,
    ConversationId = 1,
    Role = "assistant",
    Content = "Based on Benton County CAMA data...",
    RAGDocumentsUsed = "[\"benton_cama_basics\"]",
    RAGScore = 0.87m
};

var testAudit = new GPTAudit
{
    MessageId = 1,
    ConversationId = 1,
    RAGUsed = true,
    RAGChunkDetails = "[{\"chunkId\":1,\"documentTitle\":\"CAMA Guide\",\"textSnippet\":\"Property assessment...\",\"score\":0.92}]"
};
```

---

## Regression Test Requirements

### Must-Pass Baseline

| Test Suite | Count | Command |
|------------|-------|---------|
| GPTAudit Unit Tests | 4 | `dotnet test --filter "GPTAudit"` |
| GPT/RAG Tests | 41 | `dotnet test --filter "Category=GptRag"` |
| GptRagOptions Tests | 9 | `dotnet test --filter "GptRagOptions"` |
| Herald Startup Tests | 3 | `dotnet test --filter "HeraldStartup"` |

### New Tests Added (Phase 11)

| Test Name | Category | Purpose |
|-----------|----------|---------|
| RAGChunkDetail_NewInstance_HasCorrectDefaults | Unit | Model defaults |
| RAGChunkDetail_SetProperties_RetainsValues | Unit | Property retention |
| RAGChunkDetail_TextSnippet_TruncatesLongContent | Unit | Truncation logic |
| RAGSearchResult_ChunkDetails_CanBePopulated | Unit | Integration with search |
| GPTAudit_RAGChunkDetails_CanSerializeChunkArray | Unit | JSON serialization |
| TraceMessageDto_HasRAGChunkDetailsProperty | Integration | API response shape |
| ConversationTraceResponse_IncludesChunkDetails | Integration | Full trace response |
| RAGSourcesPanel renders chunk snippets | Frontend | UI rendering |

---

## Success Metrics

- [ ] 4/4 existing GPTAudit tests pass
- [ ] 8+ new Phase 11 tests pass
- [ ] 0 regressions in GPT/RAG suite
- [ ] Frontend RAGSourcesPanel tests pass
- [ ] CI gpt-rag workflow validates trace scenario

---

**Test Philosophy**: No code without a test. Audit trail = Championship compliance.
