# Test Plan: RAG Query Citations Contract

> Session: `20251217_075319Z_ai-lab_rag-query-citations-contract`
> Status: **DEFINED**

---

## Success Criteria (Measurable)

| Criterion | Metric | Target | Measurement |
|:----------|:-------|:-------|:------------|
| JSON schema valid | All responses match schema | 100% | pytest jsonschema validation |
| Error codes correct | Each error condition returns right code | 6/6 | Unit tests per error |
| Backward compat | Default mode unchanged | No diff | Compare stdout old vs new |
| Latency overhead | JSON mode vs plain | <50ms | Timing comparison |

### Must Have
- [x] `--json` flag produces valid JSON matching schema
- [x] Empty query returns `INVALID_QUERY` error
- [x] Long query (>4096) returns `INVALID_QUERY` error  
- [x] Missing collection returns `INDEX_UNAVAILABLE` error
- [x] Unreachable Ollama returns `MODEL_UNAVAILABLE` error
- [x] Zero results returns `NO_RESULTS` error
- [x] Citations include source, chunk_index, score, snippet
- [x] Metadata includes latency_ms, model, chunks_retrieved

### Should Have
- [x] Default mode (no --json) output identical to current

### Nice to Have
- [ ] `--top-k` flag works correctly

---

## Tests To Add

### Unit Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| `test_empty_query_returns_error` | test_query.py | Empty string → INVALID_QUERY | ⬜ |
| `test_long_query_returns_error` | test_query.py | >4096 chars → INVALID_QUERY | ⬜ |
| `test_json_schema_valid` | test_query.py | Response matches JSON schema | ⬜ |
| `test_citations_have_required_fields` | test_query.py | source, chunk_index, score, snippet | ⬜ |
| `test_metadata_has_required_fields` | test_query.py | latency_ms, model, chunks_retrieved | ⬜ |
| `test_error_response_schema` | test_query.py | Error responses match schema | ⬜ |

### Integration Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| `test_model_unavailable_error` | test_query.py | Mock Ollama down → MODEL_UNAVAILABLE | ⬜ |
| `test_index_unavailable_error` | test_query.py | Missing collection → INDEX_UNAVAILABLE | ⬜ |
| `test_no_results_error` | test_query.py | Nonsense query → NO_RESULTS | ⬜ |
| `test_successful_query_json` | test_query.py | Valid query → success response | ⬜ |
| `test_backward_compat_default` | test_query.py | No --json → same as before | ⬜ |

---

## Expected Failures (Before Implementation)

| Test | Expected Error | Why |
|:-----|:---------------|:----|
| `test_json_schema_valid` | AttributeError or KeyError | --json flag doesn't exist yet |
| `test_empty_query_returns_error` | No error returned | Validation not implemented |
| `test_citations_have_required_fields` | Missing fields | Citation schema not implemented |

---

## Commands

```bash
# Run tests
cd /home/bsval/dev/terrafusion_os_1.0
python3 -m pytest ops/ai/rag/test_query.py -v

# Run single test
python3 -m pytest ops/ai/rag/test_query.py::test_empty_query_returns_error -v

# Run gate
tf gate
```

---

## Status Legend

- ⬜ Not started
- 🟡 In progress
- ❌ Failing (expected)
- ✅ Passing
- 🟢 Was failing → now passing
