# SpecLock: RAG Query Citations Contract

> Session: `20251217_075319Z_ai-lab_rag-query-citations-contract`
> Status: **FROZEN**

---

## Scope

```
ops/ai/rag/query.py      # Primary changes
ops/ai/rag/test_query.py # New test file
```

---

## Public API / Component Contracts

### CLI Commands / Flags

| Command | Flag | Type | Default | Description |
|:--------|:-----|:-----|:--------|:------------|
| `tf ai query` | `--json` | bool | false | Output structured JSON response |
| `tf ai query` | `--top-k` | int | 5 | Number of context chunks to retrieve |
| `tf ai query` | `<query>` | string | required | The question to answer |

### Response Schema (JSON mode)

```json
{
  "success": true,
  "answer": "string",
  "citations": [
    {
      "source": "path/to/file.md",
      "chunk_index": 0,
      "score": 0.85,
      "snippet": "first 200 chars of chunk..."
    }
  ],
  "metadata": {
    "query": "original query",
    "latency_ms": 1234,
    "model": "llama3.2:3b",
    "embed_model": "nomic-embed-text",
    "chunks_retrieved": 5,
    "collection": "terrafusion_docs"
  },
  "error": null
}
```

### Error Response Schema

```json
{
  "success": false,
  "answer": null,
  "citations": [],
  "metadata": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Error Model

| Code | Message | When |
|:-----|:--------|:-----|
| `INVALID_QUERY` | Query is empty or exceeds 4096 characters | Empty string or >4KB query |
| `NO_RESULTS` | No relevant documents found | ChromaDB returns 0 matches |
| `CONTEXT_INSUFFICIENT` | Retrieved context does not answer query | LLM indicates insufficient context |
| `MODEL_UNAVAILABLE` | Embedding or chat model not available | Ollama unreachable or model missing |
| `INDEX_UNAVAILABLE` | ChromaDB collection not found | Collection doesn't exist |
| `INTERNAL_ERROR` | Unexpected error: {details} | Catch-all for unhandled exceptions |

---

## Input Validation Rules

| Rule | Threshold | Action |
|:-----|:----------|:-------|
| Empty query | `len(query.strip()) == 0` | Return `INVALID_QUERY` |
| Max length | `len(query) > 4096` | Return `INVALID_QUERY` |
| Injection patterns | N/A | Log warning, proceed (prompt handles) |

---

## Telemetry Contracts

### Metrics (stdout in JSON mode)

| Field | Type | Description |
|:------|:-----|:------------|
| `latency_ms` | int | Total query-to-response time |
| `chunks_retrieved` | int | Number of context chunks used |

### Log Events

| Event | Level | Fields | When |
|:------|:------|:-------|:-----|
| `rag_query_start` | INFO | query, top_k | Query received |
| `rag_query_complete` | INFO | latency_ms, chunks | Query completed |
| `rag_query_error` | ERROR | error_code, message | Any error |

---

## Backward Compat Rules

- **Breaking changes**: NONE
- Default behavior (no `--json` flag) remains identical to current
- Existing prompt template unchanged
- Existing CLI positional args unchanged

---

## Non-goals

- Streaming responses (future)
- Query caching (future)
- Multi-collection search (future)
- Authentication/authorization (localhost-only)
- Persistent query logging to database

---

## Frozen At

**Status**: FROZEN

**Frozen At**: 2025-12-17T07:54:00Z

**Frozen By**: GitHub Copilot (Builder Agent)

---

### Freeze Checklist

- [x] All API surfaces documented
- [x] Error cases enumerated
- [x] Telemetry contracts defined
- [x] Breaking changes assessed
- [x] Non-goals documented
