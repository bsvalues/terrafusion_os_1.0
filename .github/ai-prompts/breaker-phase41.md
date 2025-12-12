# Breaker Prompt: Phase 41 - Runbook Execution Engine

**Goal**: Find bugs, security holes, race conditions, or design flaws in the Runbook Execution Engine before it ships.

---

## Scope

Phase 41 introduces:
1. `RunbookExecution` / `RunbookStepExecution` - Execution state tracking
2. `IRunbookExecutor` - Core execution interface
3. `IRunbookActionProvider` - Action abstraction
4. `InMemoryRunbookExecutionStore` - State persistence
5. Approval workflow for steps requiring human sign-off

---

## EXECUTION SPEC LOCK v1.0.0 Constraints

### Execution Status Flow
```
Pending → Running → Completed
                 → Failed
                 → Cancelled
                 → PartiallyCompleted
```

### Step Status Flow
```
Pending → AwaitingApproval → InProgress → Completed
                                       → Failed
                                       → Skipped
```

### Safety Rules
- `RequiresHumanApproval = true` → MUST NOT auto-execute
- `SafetyLevel = HighRisk/CriticalRisk` → MUST require approval
- `DryRun = true` → NO real actions executed
- Execution MUST NOT modify underlying `RunbookPlan` or `IncidentSummary`

---

## Attack Vectors to Explore

### 1. Authorization Bypass
- Can an unapproved step be executed via direct API call?
- Can approval be granted by unauthorized user/system?
- What if `ApprovedBy` is empty string vs null vs whitespace?
- Can approval timestamp be backdated?

### 2. State Machine Violations
- Can a step transition directly from Pending → Completed (skipping InProgress)?
- Can a Failed step be re-executed without explicit reset?
- Can a Cancelled execution be resumed?
- What happens if two concurrent requests try to execute the same step?

### 3. Race Conditions
- Two operators approve the same step simultaneously
- Execution starts while approval is being processed
- Cancellation arrives mid-step execution
- Multiple executions of the same plan concurrently

### 4. Resource Exhaustion
- What if a plan has 10,000 steps?
- What if execution store grows unbounded?
- Memory pressure from many concurrent executions?
- What if `StepTimeout` is set to 0 or very long duration?

### 5. Action Provider Exploits
- What if action provider throws unhandled exception?
- What if action provider hangs indefinitely?
- What if action provider returns contradictory results (Success=true but ErrorMessage set)?
- Can malicious action provider corrupt execution state?

### 6. Audit Trail Integrity
- Can audit entries be modified after creation?
- What if timestamps are inconsistent (EndTime < StartTime)?
- Are all state transitions logged?
- What happens to audit trail if execution is deleted?

### 7. DryRun Bypass
- Can DryRun mode be disabled mid-execution?
- Does DryRun still create audit entries?
- Can a step marked as executed in DryRun be re-executed in real mode?

### 8. Plan/Incident Immutability
- Can execution modify the source RunbookPlan?
- Can execution modify the IncidentSummary severity?
- What if plan changes while execution is in progress?

---

## Test Scenarios to Add

```csharp
// 1. Unauthorized execution attempt
[Fact]
public async Task ExecuteStep_WithoutApproval_ThrowsUnauthorized()

// 2. Concurrent approval race
[Fact]
public async Task ApproveStep_ConcurrentCalls_OnlyOneSucceeds()

// 3. State machine violation
[Fact]
public async Task ExecuteStep_AlreadyCompleted_ThrowsInvalidState()

// 4. Cancellation mid-execution
[Fact]
public async Task ExecuteStep_Cancelled_TransitionsCorrectly()

// 5. Action provider failure
[Fact]
public async Task ExecuteStep_ProviderThrows_MarksStepFailed()

// 6. DryRun enforcement
[Fact]
public async Task ExecuteStep_DryRun_DoesNotCallProvider()

// 7. Plan immutability
[Fact]
public async Task Execute_DoesNotModifySourcePlan()

// 8. Timeout enforcement
[Fact]
public async Task ExecuteStep_ExceedsTimeout_MarksStepFailed()
```

---

## Key Files to Review

| File | Focus |
|------|-------|
| `RunbookExecutor.cs` | State machine transitions - any bypass paths? |
| `RunbookExecutor.cs` | Approval validation - complete coverage? |
| `RunbookExecutor.cs` | Concurrency handling - thread safety? |
| `InMemoryRunbookExecutionStore.cs` | Data integrity - race conditions? |
| `RunbookExecutionModels.cs` | Immutability - can records be mutated? |

---

## Questions for Breaker Agent

1. **Is there any code path where a HighRisk step can execute without approval?**
2. **What happens if `GetExecutionAsync` is called with a non-existent ID?**
3. **Can execution state be corrupted by concurrent operations?**
4. **Are all status transitions validated before applying?**
5. **Is there a test for executing against a stale/modified plan?**

---

## Definition of Done (for Breaker)

- [ ] At least 3 authorization bypass attempts documented
- [ ] At least 2 race condition scenarios tested
- [ ] State machine transitions fully validated
- [ ] DryRun enforcement verified
- [ ] Audit trail integrity confirmed
- [ ] Plan/Incident immutability verified

**Report any approval bypass as CRITICAL.**
**Report any state corruption as CRITICAL.**
