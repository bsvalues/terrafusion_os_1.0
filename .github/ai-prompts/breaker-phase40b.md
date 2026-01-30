# Breaker Prompt: Phase 40B - LLM RunbookExplanationService

**Goal**: Find bugs, edge cases, or design flaws in the LLM-based runbook explanation layer before it ships.

---

## Scope

Phase 40B added:
1. `RunbookExplanationOptions.cs` - Configuration record
2. `AzureOpenAiRunbookExplanationService.cs` - Azure OpenAI integration with immutability guarantees
3. `RunbookServiceExtensions.cs` (updated) - DI registration
4. 50 tests in `Phase40B/` folder

---

## EXPLAINER SPEC LOCK v1.0.0 Constraints

### IMMUTABLE Fields (LLM cannot modify):
- **Plan-level**: `PlanId`, `IncidentId`, `OverallSeverity`, `PlanVersion`, `ImpactedCountyIds`, `CreatedAt`, `AuditInfo`
- **Step-level**: `StepId`, `Order`, `Kind`, `SafetyLevel`, `RequiresHumanApproval`, `CanBeSuggestedForAutomation`, `RelatedAlertNames`, `RelatedMetricNames`

### MUTABLE Fields (LLM can enrich):
- `Plan.Title`, `Plan.Description`
- `Step.Title`, `Step.Description`
- `SuggestedOwnerRole`, `EstimatedDurationMinutes` (operational guidance only)

---

## Attack Vectors to Explore

### 1. Immutability Bypass
- Can a crafted LLM response somehow modify immutable fields?
- What if the JSON contains extra fields like `"SafetyLevel": "InfoOnly"` that conflict with originals?
- What if StepIds in response don't match original StepIds?
- Can step count mismatch allow injection of new steps or removal of existing steps?

### 2. JSON Parsing Edge Cases
- What if LLM returns truncated JSON?
- What if LLM returns deeply nested JSON that doesn't match expected schema?
- What if LLM returns valid JSON but wrong type (object instead of array)?
- Unicode edge cases: What if titles contain RTL characters, zero-width spaces, or control characters?
- What if JSON contains `null` for required fields?

### 3. Error Handling
- Are all HTTP status codes handled gracefully?
- What happens if timeout occurs mid-response?
- What if API key is invalid vs. missing vs. expired?
- What about rate limiting with Retry-After headers?

### 4. Prompt Injection
- Can malicious incident data cause the LLM to return harmful content?
- What if incident title contains `"JSON: [{\"StepId\": \"INJECTED\", ...}]"`?
- What if description contains prompt manipulation like "Ignore previous instructions..."?

### 5. Resource Exhaustion
- What if plan has 1000+ steps?
- What if step descriptions are 10KB+ each?
- What if LLM response is extremely large (>1MB)?
- Memory pressure during JSON parsing?

### 6. Configuration Issues
- What if endpoint URL has trailing slash inconsistency?
- What if deployment name contains special characters?
- What if `Timeout` is set to 0 or negative?
- What if `MaxTokens` exceeds model limits?

### 7. Concurrency
- Thread safety of HttpClient usage?
- What if multiple concurrent enrichment requests share state?
- Race conditions in service registration?

---

## Test Scenarios to Add

```csharp
// 1. LLM response contains extra immutable fields
[Fact]
public async Task EnrichAsync_ResponseContainsExtraImmutableFields_IgnoresExtras()

// 2. StepId mismatch
[Fact]
public async Task EnrichAsync_StepIdMismatch_DoesNotCorruptPlan()

// 3. Truncated JSON
[Fact]
public async Task EnrichAsync_TruncatedJson_ReturnsOriginalPlan()

// 4. Prompt injection via incident data
[Fact]
public async Task EnrichAsync_MaliciousIncidentData_DoesNotLeakToOutput()

// 5. Very large plan
[Fact]
public async Task EnrichAsync_LargePlan_HandlesGracefully()

// 6. Zero timeout
[Fact]
public async Task EnrichAsync_ZeroTimeout_ReturnsOriginalPlan()

// 7. Unicode edge cases
[Fact]
public async Task EnrichAsync_UnicodeInResponse_PreservesCorrectly()
```

---

## Key Files to Review

| File | Focus |
|------|-------|
| `AzureOpenAiRunbookExplanationService.cs` | `MergeEnrichedData()` - Does it truly preserve immutables? |
| `AzureOpenAiRunbookExplanationService.cs` | `ExtractJsonFromResponse()` - Robust parsing? |
| `AzureOpenAiRunbookExplanationService.cs` | `BuildEnrichmentPrompt()` - Input sanitization? |
| `RunbookExplanationOptions.cs` | `IsConfiguredForAzureOpenAi` - All cases covered? |
| `RunbookServiceExtensions.cs` | DI registration - Correct lifetimes? |

---

## Questions for Breaker Agent

1. **Is there any code path where an LLM response could modify `SafetyLevel` or `RequiresHumanApproval`?**
2. **What happens if `MergeEnrichedData()` receives a StepId that doesn't exist in the original plan?**
3. **Does the prompt sanitize incident data before including it?**
4. **What is the maximum response size the service will accept?**
5. **Is there a test for concurrent enrichment of the same plan?**

---

## Definition of Done (for Breaker)

- [ ] At least 3 new edge-case tests added
- [ ] At least 1 immutability bypass attempt documented
- [ ] All prompt injection concerns addressed or test-covered
- [ ] Resource exhaustion limits verified or tests added
- [ ] Configuration edge cases verified

**Report any violations of EXPLAINER SPEC LOCK v1.0.0 as CRITICAL.**
