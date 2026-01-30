# Reviewer Prompt: Phase 40B - LLM RunbookExplanationService

**Goal**: Provide final quality assurance review for Phase 40B before production.

---

## Phase 40B Summary

| Component | Description |
|-----------|-------------|
| `RunbookExplanationOptions.cs` | Configuration record with Azure OpenAI settings |
| `AzureOpenAiRunbookExplanationService.cs` | LLM-based runbook step enrichment |
| `RunbookServiceExtensions.cs` | Updated DI registration |
| Test Coverage | 50 tests across 3 test classes |

---

## EXPLAINER SPEC LOCK v1.0.0 Checklist

### Verify IMMUTABLE Field Protection

| Field | Location | Protection Required |
|-------|----------|---------------------|
| `PlanId` | Plan | ✅ MUST NOT be modified |
| `IncidentId` | Plan | ✅ MUST NOT be modified |
| `OverallSeverity` | Plan | ✅ MUST NOT be modified |
| `PlanVersion` | Plan | ✅ MUST NOT be modified |
| `ImpactedCountyIds` | Plan | ✅ MUST NOT be modified |
| `CreatedAt` | Plan | ✅ MUST NOT be modified |
| `AuditInfo` | Plan | ✅ MUST NOT be modified |
| `StepId` | Step | ✅ MUST NOT be modified |
| `Order` | Step | ✅ MUST NOT be modified |
| `Kind` | Step | ✅ MUST NOT be modified |
| `SafetyLevel` | Step | ✅ MUST NOT be modified |
| `RequiresHumanApproval` | Step | ✅ MUST NOT be modified |
| `CanBeSuggestedForAutomation` | Step | ✅ MUST NOT be modified |
| `RelatedAlertNames` | Step | ✅ MUST NOT be modified |
| `RelatedMetricNames` | Step | ✅ MUST NOT be modified |

**Review Question**: Does `MergeEnrichedData()` use `with` expressions to preserve all immutable fields?

### Verify MUTABLE Fields

| Field | Can LLM Modify? |
|-------|-----------------|
| `Plan.Title` | ✅ Yes |
| `Plan.Description` | ✅ Yes |
| `Step.Title` | ✅ Yes |
| `Step.Description` | ✅ Yes |
| `SuggestedOwnerRole` | ✅ Yes (operational guidance) |
| `EstimatedDurationMinutes` | ✅ Yes (operational guidance) |

---

## Error Handling Review

### Graceful Degradation Requirements

| Scenario | Expected Behavior | Test Coverage |
|----------|-------------------|---------------|
| Service disabled | Return original plan | ✅ |
| API key missing | Return original plan | ✅ |
| Endpoint missing | Return original plan | ✅ |
| HTTP 401 Unauthorized | Return original plan | ✅ |
| HTTP 403 Forbidden | Return original plan | ✅ |
| HTTP 404 Not Found | Return original plan | ✅ |
| HTTP 429 Rate Limited | Return original plan | ✅ |
| HTTP 500 Server Error | Return original plan | ✅ |
| HTTP 502 Bad Gateway | Return original plan | ✅ |
| HTTP 503 Service Unavailable | Return original plan | ✅ |
| Malformed JSON | Return original plan | ✅ |
| Network exception | Return original plan | ✅ |
| Timeout (TaskCanceledException) | Return original plan | ✅ |
| OperationCanceledException | Return original plan | ✅ |

**CRITICAL**: The service MUST NEVER throw exceptions to callers. All errors must return the original plan.

---

## Code Quality Checklist

### `AzureOpenAiRunbookExplanationService.cs`

- [ ] Uses `IHttpClientFactory` pattern (or injected `HttpClient`)
- [ ] Logs at appropriate levels (Debug, Information, Warning, Error)
- [ ] No secrets logged
- [ ] Async all the way (no `.Result` or `.Wait()`)
- [ ] Cancellation token propagated
- [ ] Timeout enforced via `HttpClient.Timeout`

### `RunbookExplanationOptions.cs`

- [ ] `IsConfiguredForAzureOpenAi` checks all required fields
- [ ] Default values are reasonable (MaxTokens=2000, Temperature=0.3, Timeout=30s)
- [ ] No mutable collections exposed

### `RunbookServiceExtensions.cs`

- [ ] Correct service lifetime (Scoped or Singleton as appropriate)
- [ ] Options bound from configuration
- [ ] Environment variable fallbacks work correctly

---

## Test Coverage Review

### `RunbookExplainerImmutabilityTests.cs`

| Test Category | Count | Status |
|---------------|-------|--------|
| Plan-level immutability | 7 tests | Verify |
| Step-level immutability | 9 tests | Verify |
| Enrichment validation | 2 tests | Verify |

### `RunbookExplainerErrorHandlingTests.cs`

| Test Category | Count | Status |
|---------------|-------|--------|
| Service disabled/unconfigured | 3 tests | Verify |
| HTTP error responses | 8 tests | Verify |
| Malformed responses | 4 tests | Verify |
| Network/timeout errors | 3 tests | Verify |
| Edge cases | 2 tests | Verify |

### `AzureOpenAiExplainerTests.cs`

| Test Category | Count | Status |
|---------------|-------|--------|
| Successful enrichment | 3 tests | Verify |
| Prompt content | 2 tests | Verify |
| Response parsing | 2 tests | Verify |
| Configuration | 5 tests | Verify |
| Concurrency | 1 test | Verify |

**Total Expected**: 50 tests

---

## Security Review Points

1. **Credential Handling**: API key from config/env, not hardcoded
2. **Input Sanitization**: Incident data included in prompts - any XSS/injection risks?
3. **Output Validation**: JSON parsed safely, no deserialization of untrusted types
4. **Logging**: No secrets or sensitive data logged
5. **TLS**: HTTPS enforced for Azure OpenAI endpoint

---

## Integration Points

### Configuration Keys

```json
{
  "RunbookExplanation": {
    "Enabled": true,
    "AzureOpenAiEndpoint": "https://xxx.openai.azure.com/",
    "AzureOpenAiDeploymentName": "gpt-4o",
    "AzureOpenAiApiKey": "${AZURE_OPENAI_API_KEY}",
    "MaxTokens": 2000,
    "Temperature": 0.3,
    "Timeout": "00:00:30"
  }
}
```

### Environment Variable Fallbacks

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_KEY`
- `RUNBOOK_EXPLANATION_ENABLED`

---

## Final Sign-off Checklist

- [ ] All 50 Phase 40B tests pass
- [ ] Combined Phase 40A+40B tests pass (193 total)
- [ ] EXPLAINER SPEC LOCK v1.0.0 immutability verified
- [ ] Graceful degradation on all error paths verified
- [ ] No secrets in logs or code
- [ ] Configuration options documented
- [ ] DI registration correct
- [ ] Code follows TerraFusion patterns

---

## Approval Criteria

| Criteria | Threshold | Status |
|----------|-----------|--------|
| Test Pass Rate | 100% | ⬜ Verify |
| Immutability Tests | All pass | ⬜ Verify |
| Error Handling Tests | All pass | ⬜ Verify |
| Code Review | No CRITICAL issues | ⬜ Verify |

**Phase 40B is APPROVED when all checkboxes are verified.**
