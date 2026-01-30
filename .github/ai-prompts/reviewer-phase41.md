# Reviewer Prompt: Phase 41 - Runbook Execution Engine

**Goal**: Provide final quality assurance review for Phase 41 before production.

---

## Phase 41 Summary

| Component | Description |
|-----------|-------------|
| `RunbookExecution` | Tracks execution of a complete runbook plan |
| `RunbookStepExecution` | Per-step execution state with approvals |
| `IRunbookExecutor` | Core execution interface |
| `IRunbookActionProvider` | Abstraction for actual actions |
| `InMemoryRunbookExecutionStore` | State persistence (in-memory for Phase 41) |

---

## EXECUTION SPEC LOCK v1.0.0 Checklist

### Verify Status Transitions

| From | To | Valid? | Test Coverage |
|------|----|--------|---------------|
| Pending | Running | ✅ | Required |
| Running | Completed | ✅ | Required |
| Running | Failed | ✅ | Required |
| Running | Cancelled | ✅ | Required |
| Running | PartiallyCompleted | ✅ | Required |
| Pending | Completed | ❌ INVALID | Required |
| Completed | Running | ❌ INVALID | Required |
| Failed | Running | ❌ INVALID | Required |

### Verify Step Status Transitions

| From | To | Valid? |
|------|----|--------|
| Pending | AwaitingApproval | ✅ |
| AwaitingApproval | InProgress | ✅ (after approval) |
| InProgress | Completed | ✅ |
| InProgress | Failed | ✅ |
| Pending | Skipped | ✅ |

---

## Safety Requirements Review

### Approval Enforcement

| Condition | Behavior Required | Test Coverage |
|-----------|-------------------|---------------|
| `RequiresHumanApproval = true` | MUST NOT auto-execute | ⬜ Verify |
| `SafetyLevel = CriticalRisk` | MUST require approval | ⬜ Verify |
| `SafetyLevel = HighRisk` | SHOULD require approval | ⬜ Verify |
| `DryRun = true` | NO real actions | ⬜ Verify |
| Approval without `ApprovedBy` | MUST reject | ⬜ Verify |

### Immutability

| Object | Can Be Modified? |
|--------|------------------|
| Source `RunbookPlan` | ❌ NEVER |
| Source `IncidentSummary` | ❌ NEVER |
| `RunbookExecution` (once created) | Status/timestamps only |
| `RunbookStepExecution` | Status/timestamps/approval only |

---

## Code Quality Checklist

### `RunbookExecutor.cs`

- [ ] State machine transitions are validated
- [ ] Approval checks before execution
- [ ] Cancellation token propagated to action provider
- [ ] Timeout enforcement via CancellationTokenSource
- [ ] Thread-safe operations (if concurrent access expected)
- [ ] No exceptions leak to caller (except expected ones)

### `InMemoryRunbookExecutionStore.cs`

- [ ] Thread-safe collection (ConcurrentDictionary or locking)
- [ ] No memory leaks from unbounded growth
- [ ] Clear seam for future persistent store implementation

### `RunbookExecutionModels.cs`

- [ ] Records are immutable (use `init` or `with` patterns)
- [ ] All required fields validated
- [ ] Timestamps use `DateTimeOffset` (not `DateTime`)

### `IRunbookActionProvider.cs`

- [ ] Interface supports cancellation
- [ ] Result type includes success/failure + error message
- [ ] No side effects in interface definition

---

## Test Coverage Review

### Expected Test Classes

| Test Class | Focus | Min Tests |
|------------|-------|-----------|
| `RunbookExecutorTests` | Core execution logic | 15+ |
| `RunbookExecutionWorkflowTests` | Multi-step flows | 10+ |
| `RunbookApprovalTests` | Approval enforcement | 10+ |
| `RunbookExecutionAuditTests` | Audit trail integrity | 8+ |

### Critical Test Scenarios

| Scenario | Required |
|----------|----------|
| Happy path single step | ✅ |
| Multi-step ordered execution | ✅ |
| Approval required - blocked without | ✅ |
| Approval granted - proceeds | ✅ |
| Step failure - execution stops | ✅ |
| Cancellation mid-execution | ✅ |
| DryRun - no real actions | ✅ |
| Timeout enforcement | ✅ |
| Concurrent execution safety | ✅ |
| Plan immutability | ✅ |

---

## API Surface Review (if implemented)

### Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/ops/runbooks/{planId}/execute` | POST | Start execution | ✅ |
| `/api/ops/runbooks/{executionId}/steps/{stepId}/approve` | POST | Approve step | ✅ |
| `/api/ops/runbooks/executions/{executionId}` | GET | Get execution status | ✅ |

### Request/Response Validation

- [ ] Input validation on all endpoints
- [ ] Proper HTTP status codes
- [ ] Error responses include actionable messages
- [ ] No sensitive data in error responses

---

## Operator UX Review

### Questions to Consider

1. **Is execution status clearly visible?**
   - Can operator see which step is current?
   - Is progress percentage available?

2. **Are approval actions intuitive?**
   - Clear indication of what's awaiting approval
   - Approval/reject with reason?

3. **Is failure recovery clear?**
   - Can operator retry failed step?
   - Is rollback available?

4. **Is audit trail accessible?**
   - Can operator see who approved what?
   - Timestamps in appropriate timezone?

---

## Extension Points for Future Phases

### Phase 42 - Autonomous Safe Execution
- [ ] `AllowSafeAutoExecution` option exists but disabled by default
- [ ] Safe steps can be flagged for future auto-execution
- [ ] Clear boundary between Safe and requiring approval

### Phase 43 - Multi-Operator Workflows
- [ ] `ApprovedBy` supports tracking multiple approvers
- [ ] Seam exists for approval quorum requirements
- [ ] Audit trail tracks all approval attempts

---

## Final Sign-off Checklist

- [ ] All Phase 41 tests pass
- [ ] Combined Phase 40A+40B+41 tests pass
- [ ] No approval bypass paths identified
- [ ] State machine transitions fully validated
- [ ] DryRun enforcement verified
- [ ] Audit trail complete and immutable
- [ ] Plan/Incident immutability verified
- [ ] Code follows TerraFusion patterns
- [ ] Documentation complete

---

## Approval Criteria

| Criteria | Threshold | Status |
|----------|-----------|--------|
| Test Pass Rate | 100% | ⬜ Verify |
| Approval Tests | All pass | ⬜ Verify |
| Safety Tests | All pass | ⬜ Verify |
| Audit Tests | All pass | ⬜ Verify |
| Code Review | No CRITICAL issues | ⬜ Verify |

**Phase 41 is APPROVED when all checkboxes are verified.**

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Approval bypass | CRITICAL | Extensive testing + Breaker review |
| State corruption | CRITICAL | Thread safety + validation |
| Audit gaps | HIGH | Comprehensive logging tests |
| Memory leaks | MEDIUM | Store cleanup mechanism |
| Action provider failures | MEDIUM | Graceful error handling |

**Phase 41 introduces execution capabilities - review with extra scrutiny.**
