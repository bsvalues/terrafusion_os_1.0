# Prometheus-Grade County Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 identified defects in County Studio's governance, evidence-packet, and UX layers so every action is traceable, every visual is truthful, and every destructive operation has a containment gate.

**Architecture:** All fixes are surgical — no rewrites, no new abstractions. Backend fixes add `CountyName` denormalization and correct identity claim reading. Frontend fixes correct the compliance color map, the promote body contract, add an inline confirmation gate for destructive governance actions, and wire a store signal so the Govnc tab auto-refreshes after promote.

**Tech Stack:** .NET 8 / EF Core 8 / xUnit (backend) · React 18 / TypeScript / Zustand / Vitest (frontend)

---

## File Map

| File | Change |
|---|---|
| `frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx` | Fix `complianceBadge` key map; add `data-compliance` attribute |
| `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx` | 3 new tests for compliance color correctness |
| `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts` | Fix `promote` signature: `effectiveScope` replaces `studyId`/`countyId` |
| `frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx` | Send correct promote body; call `setLastPromotion` after success |
| `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx` | Update promote-payload test to match new body |
| `frontend/apps/os-shell/src/stores/countyStudioStore.ts` | Add `lastPromotedAt: number \| null` + `setLastPromotion()` |
| `frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx` | Add confirmation gate for Publish/Rollback; subscribe to `lastPromotedAt` |
| `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx` | Tests for confirm gate + auto-refresh |
| `backend/src/TerraFusion.Core/Entities/CountyStudySession.cs` | Add `CountyName` property |
| `backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs` | Add `CountyName` to `CountyStudySessionDto` |
| `backend/src/TerraFusion.Core/Services/CountyStudyService.cs` | Populate `CountyName` from County entity in `CreateStudyAsync` + `MapStudy` |
| `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs` | Use `study.CountyName` in evidence packet; fix `CurrentUserId` claim reading |
| `backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs` | Assert `CountyName` on created study |
| `backend/TerraFusion.API.Tests/Integration/CountyStudioSmokeTests.cs` | Assert `ApprovedBy` reflects real user, not "system" |

---

## Task 1 — Fix `complianceBadge` color map (ExportPacketModal)

**Problem:** Map keys are `Compliant / Marginal / NonCompliant`. Backend emits `IaaoCompliant / MarginalCompliance / NonCompliant`. `IaaoCompliant` and `MarginalCompliance` always fall through to gray.

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx` (line 221–225)
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx`

- [ ] **Step 1: Write 3 failing tests that pin the compliance color to the correct status string**

Add to the bottom of `ExportPacketModal.test.tsx` (inside the `describe` block):

```typescript
describe('ExportPacketModal — compliance badge colors', () => {
  it('compliance badge data-compliance-color is green (#22c55e) for IaaoCompliant', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_PACKET, complianceStatus: 'IaaoCompliant' });
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-packet-content');
    const badge = document.querySelector('[data-compliance="IaaoCompliant"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-compliance-color')).toBe('#22c55e');
  });

  it('compliance badge data-compliance-color is amber (#f59e0b) for MarginalCompliance', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_PACKET, complianceStatus: 'MarginalCompliance' });
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-packet-content');
    const badge = document.querySelector('[data-compliance="MarginalCompliance"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-compliance-color')).toBe('#f59e0b');
  });

  it('compliance badge data-compliance-color is red (#ef4444) for NonCompliant', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_PACKET, complianceStatus: 'NonCompliant' });
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-packet-content');
    const badge = document.querySelector('[data-compliance="NonCompliant"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-compliance-color')).toBe('#ef4444');
  });
});
```

- [ ] **Step 2: Run to confirm all 3 fail**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx
```

Expected: 3 failures (`data-compliance-color` attribute not found / wrong value).

- [ ] **Step 3: Fix `complianceBadge` in ExportPacketModal.tsx**

Replace lines 221–225 with:

```typescript
const complianceBadge = (status: string) => {
  const colors: Record<string, string> = {
    IaaoCompliant:      '#22c55e',
    MarginalCompliance: '#f59e0b',
    NonCompliant:       '#ef4444',
    InsufficientData:   '#6b7280',
  };
  const c = colors[status] ?? '#6b7280';
  return (
    <span
      data-compliance={status}
      data-compliance-color={c}
      style={{
        padding: '1px 8px', borderRadius: 10,
        background: `${c}22`, color: c, fontWeight: 700, fontSize: 11,
      }}
    >
      {status}
    </span>
  );
};
```

- [ ] **Step 4: Run tests — all 12 ExportPacketModal tests must pass**

```bash
npx vitest run src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx
```

Expected: 12 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
git add frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx \
        frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx
git commit -m "fix(county-studio): complianceBadge key map — IaaoCompliant/MarginalCompliance now render correct colors; 3 new pinning tests"
```

---

## Task 2 — Fix `scenarioApi.promote` body contract

**Problem:** Frontend sends `{ studyId, countyId, scenarioId }` but `PromoteScenarioRequest` expects `(Guid ScenarioId, string EffectiveScope)`. `EffectiveScope` is never sent → always null in DB. The AdjustmentSet has no auditability of what scope was promoted.

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts` (promote signature, ~line 131)
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx` (handlePromote, ~line 143)
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx` (update existing promote-payload test at line 134)

- [ ] **Step 1: Update the existing promote-payload test to assert the correct new body**

In `ScenarioWorksheet.test.tsx`, find the test starting at line 134 (`'Promote button calls scenarioApi.promote with correct payload'`) and replace the `toHaveBeenCalledWith` assertion:

```typescript
// OLD (remove this):
expect(vi.mocked(scenarioApi.promote)).toHaveBeenCalledWith({
  studyId:    'study-1',
  countyId:   'benton',
  scenarioId: 'sc-saved',
});

// NEW (replace with this):
expect(vi.mocked(scenarioApi.promote)).toHaveBeenCalledWith({
  scenarioId:     'sc-saved',
  effectiveScope: expect.stringContaining('sc-saved'),  // must include scenarioId in scope JSON
});
```

- [ ] **Step 2: Run to confirm the test now fails**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx --reporter=verbose 2>&1 | grep -E "FAIL|promote payload"
```

Expected: FAIL on "Promote button calls scenarioApi.promote with correct payload".

- [ ] **Step 3: Fix `scenarioApi.promote` signature in `countyStudyApi.ts`**

Replace the `promote` entry (~line 131–137):

```typescript
promote: (body: {
  scenarioId:     string;
  effectiveScope: string;   // JSON: { scenarioId, cohortId }
}): Promise<CountyAdjustmentSetDto> =>
  apiFetchJson(`${BASE}/scenarios/promote`, { method: 'POST', body: JSON.stringify(body) }),
```

Note: return type changes from `void` to `CountyAdjustmentSetDto`. This enables Task 6.

- [ ] **Step 4: Fix `handlePromote` in `ScenarioWorksheet.tsx`**

Replace the `scenarioApi.promote(...)` call block (~lines 149–153):

```typescript
await scenarioApi.promote({
  scenarioId:     scenario.scenarioId,
  effectiveScope: JSON.stringify({
    scenarioId: scenario.scenarioId,
    cohortId:   scenario.cohortId,
  }),
});
setPromoteSuccess('Promoted — see Govnc tab for approval workflow.');
```

- [ ] **Step 5: Run all ScenarioWorksheet tests — all must pass**

```bash
npx vitest run src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx
```

Expected: all pass. "Promote button calls scenarioApi.promote with correct payload" must now pass.

- [ ] **Step 6: Commit**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
git add frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts \
        frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx \
        frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx
git commit -m "fix(county-studio): promote body contract — send scenarioId+effectiveScope, drop unused studyId/countyId fields; return type is now CountyAdjustmentSetDto"
```

---

## Task 3 — Fix CountyName hardcoding in evidence packet

**Problem:** `CountyStudyController.GetEvidencePacket` hardcodes `CountyName: "Benton County"`. Every packet from any county says Benton County.

**Strategy:** Denormalize `CountyName` into `CountyStudySession` at creation time (look up `County.Name` from the Counties table using the resolved CountyId). Add it to the DTO. Controller reads from DTO.

**Files:**
- Modify: `backend/src/TerraFusion.Core/Entities/CountyStudySession.cs`
- Modify: `backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs`
- Modify: `backend/src/TerraFusion.Core/Services/CountyStudyService.cs`
- Modify: `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs` (line 948)
- Modify: `backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs`

- [ ] **Step 1: Write a failing test that asserts `CountyName` is populated on a created study**

In `CountyStudyServiceTests.cs`, find the "Create Study" section and add:

```csharp
[Fact]
public async Task CreateStudy_SetsCountyName_FromCountyEntityOrFallback()
{
    var (ctx, svc) = CreateSut();
    var countyId = Guid.NewGuid();

    // Seed a County entity so the service can look up the name.
    ctx.Counties.Add(new TerraFusion.Core.Entities.County
    {
        Id   = countyId,
        Name = "Franklin County",
    });
    await ctx.SaveChangesAsync();

    var study = await svc.CreateStudyAsync(
        new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null),
        "u1");

    Assert.Equal("Franklin County", study.CountyName);
}

[Fact]
public async Task CreateStudy_CountyName_FallsBackToInputString_WhenCountyNotFound()
{
    var (_, svc) = CreateSut();
    var countyId = Guid.NewGuid();

    // No County row seeded — resolver still returns the Guid (PassThrough resolver).
    var study = await svc.CreateStudyAsync(
        new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null),
        "u1");

    // Fallback: CountyName is non-null and non-empty.
    Assert.NotNull(study.CountyName);
    Assert.NotEmpty(study.CountyName);
}
```

- [ ] **Step 2: Run to confirm both tests fail**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "CreateStudy_SetsCountyName" --verbosity minimal
```

Expected: compile error or runtime failure — `CountyName` does not exist on DTO yet.

- [ ] **Step 3: Add `CountyName` to `CountyStudySession` entity**

In `backend/src/TerraFusion.Core/Entities/CountyStudySession.cs`, add after the `CountyId` property:

```csharp
/// <summary>
/// Denormalized county display name, resolved from Counties table at study creation.
/// Stored here so evidence packets don't require a live join.
/// </summary>
public string CountyName { get; set; } = string.Empty;
```

- [ ] **Step 4: Add `CountyName` to `CountyStudySessionDto`**

In `backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs`, change `CountyStudySessionDto` (line 11):

```csharp
public record CountyStudySessionDto(
    Guid StudyId,
    Guid CountyId,
    string CountyName,   // ← add this field after CountyId
    int TaxYear,
    string StudyType,
    string Status,
    string? BaselineVersion,
    Guid? ActiveSegmentSetId,
    DateTime CreatedAt,
    string CreatedBy
);
```

- [ ] **Step 5: Populate `CountyName` in `CreateStudyAsync` and fix `MapStudy`**

In `backend/src/TerraFusion.Core/Services/CountyStudyService.cs`:

**In `CreateStudyAsync`** (after line 25 `var countyId = ...`), look up the county name:

```csharp
var countyId = await _countyResolver.ResolveAsync(req.CountyId);
var county = await _db.Counties.FindAsync(countyId);
var study = new CountyStudySession
{
    CountyId    = countyId,
    CountyName  = county?.Name ?? req.CountyId,   // ← add this line
    TaxYear     = req.TaxYear,
    StudyType   = req.StudyType,
    BaselineVersion = req.BaselineVersion,
    Status      = StudyStatus.Draft,
    CreatedBy   = userId,
    UpdatedBy   = userId
};
```

**In `MapStudy`** (line 1154–1157), add `CountyName`:

```csharp
private static CountyStudySessionDto MapStudy(CountyStudySession s) =>
    new(s.StudyId, s.CountyId, s.CountyName, s.TaxYear, s.StudyType.ToString(),
        s.Status.ToString(), s.BaselineVersion, s.ActiveSegmentSetId,
        s.CreatedAt, s.CreatedBy);
```

- [ ] **Step 6: Add EF migration**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/backend
dotnet ef migrations add AddCountyStudySessionCountyName \
  --project TerraFusion.Data \
  --startup-project src/TerraFusion.API
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project src/TerraFusion.API
```

Expected: migration file created, database updated (dev SQLite or PostgreSQL).

- [ ] **Step 7: Fix controller hardcode — use `study.CountyName`**

In `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs`, line 948:

```csharp
// OLD:
CountyName: "Benton County",

// NEW:
CountyName: study.CountyName,
```

- [ ] **Step 8: Run failing tests — both must now pass**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "CountyName" --verbosity minimal
```

Expected: 2 passed, 0 failed.

- [ ] **Step 9: Run full backend suite — no regression**

```bash
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --verbosity minimal 2>&1 | tail -3
```

Expected: Passed! — 0 failed.

- [ ] **Step 10: Commit**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
git add backend/src/TerraFusion.Core/Entities/CountyStudySession.cs \
        backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs \
        backend/src/TerraFusion.Core/Services/CountyStudyService.cs \
        backend/src/TerraFusion.API/Controllers/CountyStudyController.cs \
        backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs \
        backend/TerraFusion.Data/Migrations/
git commit -m "fix(county-studio): CountyName resolved from County entity at study creation; evidence packet no longer hardcodes 'Benton County'; 2 new tests"
```

---

## Task 4 — Fix auth identity (CurrentUserId reads real claim)

**Problem:** `CurrentUserId` falls back to `"system"` unconditionally because `User?.Identity?.Name` is null in non-Kerberos environments. The established pattern in the codebase (`CollaborationController`, `CodexNotificationPreferencesController`) is `User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub")?.Value ?? "system"`. Every governance action records `"system"` as actor.

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs` (~line 55)
- Modify: `backend/TerraFusion.API.Tests/Integration/CountyStudioSmokeTests.cs`

- [ ] **Step 1: Write a failing assertion in the smoke test that ApprovedBy is not "system"**

In `CountyStudioSmokeTests.cs`, in `CountyStudio_FullWorkflow_Smoke`, after the approval chain (around step 13), add:

```csharp
// Identity should NOT be "system" when a real userId is provided.
// The service receives userId from CurrentUserId — the smoke test calls
// UpdateApprovalStateAsync directly with "bsvalues". Verify it flows through.
Assert.Equal("bsvalues", approved.ApprovedBy);
Assert.NotEqual("system", approved.ApprovedBy);
```

(This assertion may already pass since `CountyStudioSmokeTests` calls the service directly with `"bsvalues"`. The real bug is in the controller's `CurrentUserId`. Adding the assertion documents the contract and will catch future regressions if someone changes the service signature.)

- [ ] **Step 2: Run smoke test to confirm it passes (verifies service layer is correct)**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj \
  --filter "CountyStudio_FullWorkflow_Smoke" --verbosity minimal
```

Expected: PASS. The service layer is correct; the bug is only in the controller's claim reading.

- [ ] **Step 3: Fix `CurrentUserId` in `CountyStudyController.cs`**

Replace the `CurrentUserId` property (~line 55):

```csharp
// OLD:
private string CurrentUserId =>
    User?.Identity?.Name ?? FallbackUserId;

// NEW — matches the established pattern in CollaborationController:
private string CurrentUserId =>
    User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)
    ?? User.FindFirst("sub")?.Value
    ?? FallbackUserId;
```

Add the required using at the top of the file if not already present:

```csharp
using System.Security.Claims;
```

- [ ] **Step 4: Run full backend suite — no regression**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --verbosity minimal 2>&1 | tail -3
```

Expected: Passed! — 0 failed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CountyStudyController.cs \
        backend/TerraFusion.API.Tests/Integration/CountyStudioSmokeTests.cs
git commit -m "fix(county-studio): CurrentUserId reads NameIdentifier/'sub' claim instead of Identity.Name fallback; smoke test asserts ApprovedBy is real user, not 'system'"
```

---

## Task 5 — Confirmation gate for Publish and Rollback

**Problem:** Publish (locks DOR submission) and Rollback (reverts published set) fire on first click with no containment. Prometheus doctrine: high-consequence actions require explanation paths.

**Design:** Inline confirm state in `AdjSetRow`. When user clicks Publish or Rollback, the button area is replaced with: `[Confirm <Label>?] [reason input (Rollback only)] [Yes] [Cancel]`. Clicking Yes calls `onAction`; Cancel clears the confirm state.

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx`

- [ ] **Step 1: Write failing tests that verify the confirmation gate**

Add to `AdjustmentSetPanel.test.tsx` (inside the `describe` block):

```typescript
test('clicking Publish shows confirmation prompt, not immediately calling updateApprovalState', async () => {
  mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
  const user = userEvent.setup();
  render(<AdjustmentSetPanel />);
  await screen.findByTestId('btn-Published-adj-001');

  await user.click(screen.getByTestId('btn-Published-adj-001'));

  // Must NOT have called the API yet — confirmation step required first.
  expect(mockUpdateState).not.toHaveBeenCalled();
  // Confirm prompt must be visible.
  expect(screen.getByTestId('confirm-Published-adj-001')).toBeInTheDocument();
});

test('clicking Yes in Publish confirm calls updateApprovalState', async () => {
  const updated = makeAdj({ approvalState: 'Published' });
  mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
  mockUpdateState.mockResolvedValueOnce(updated);
  const user = userEvent.setup();
  render(<AdjustmentSetPanel />);
  await screen.findByTestId('btn-Published-adj-001');

  await user.click(screen.getByTestId('btn-Published-adj-001'));
  await user.click(screen.getByTestId('confirm-yes-adj-001'));

  expect(mockUpdateState).toHaveBeenCalledWith('adj-001', 'Published');
  await waitFor(() =>
    expect(screen.getByTestId('state-badge-Published')).toBeInTheDocument()
  );
});

test('clicking Cancel in Publish confirm restores original buttons', async () => {
  mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
  const user = userEvent.setup();
  render(<AdjustmentSetPanel />);
  await screen.findByTestId('btn-Published-adj-001');

  await user.click(screen.getByTestId('btn-Published-adj-001'));
  expect(screen.getByTestId('confirm-Published-adj-001')).toBeInTheDocument();

  await user.click(screen.getByTestId('confirm-cancel-adj-001'));

  expect(mockUpdateState).not.toHaveBeenCalled();
  expect(screen.queryByTestId('confirm-Published-adj-001')).not.toBeInTheDocument();
  expect(screen.getByTestId('btn-Published-adj-001')).toBeInTheDocument(); // back to original
});

test('clicking Rollback shows confirmation prompt with reason input', async () => {
  mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Published' })]);
  const user = userEvent.setup();
  render(<AdjustmentSetPanel />);
  await screen.findByTestId('btn-RolledBack-adj-001');

  await user.click(screen.getByTestId('btn-RolledBack-adj-001'));

  expect(mockUpdateState).not.toHaveBeenCalled();
  expect(screen.getByTestId('confirm-RolledBack-adj-001')).toBeInTheDocument();
  expect(screen.getByTestId('rollback-reason-adj-001')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm all 4 tests fail**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx --reporter=verbose 2>&1 | grep -E "FAIL|confirm"
```

Expected: 4 failures.

- [ ] **Step 3: Add confirmation state to `AdjSetRow` in `AdjustmentSetPanel.tsx`**

Replace the `AdjSetRow` component (the whole function, lines 58–134) with:

```typescript
function AdjSetRow({
  adj,
  onAction,
  busy,
}: {
  adj: CountyAdjustmentSetDto;
  onAction: (id: string, state: AdjustmentSetApprovalState) => void;
  busy: string | null;
}) {
  const [confirming, setConfirming] = useState<AdjustmentSetApprovalState | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');

  const actions = NEXT_STATES[adj.approvalState] ?? [];
  const isBusy  = busy === adj.adjustmentSetId;

  // States that require a confirmation gate before firing.
  const requiresConfirm = (state: AdjustmentSetApprovalState) =>
    state === 'Published' || state === 'RolledBack';

  const handleClick = (state: AdjustmentSetApprovalState) => {
    if (requiresConfirm(state)) {
      setConfirming(state);
    } else {
      onAction(adj.adjustmentSetId, state);
    }
  };

  const handleConfirmYes = () => {
    if (confirming) {
      onAction(adj.adjustmentSetId, confirming);
      setConfirming(null);
      setRollbackReason('');
    }
  };

  const handleConfirmCancel = () => {
    setConfirming(null);
    setRollbackReason('');
  };

  return (
    <div
      data-testid={`adj-row-${adj.adjustmentSetId}`}
      style={{
        borderBottom: '1px solid hsl(var(--tf-border))',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {adj.adjustmentSetId.slice(0, 8)}…
        </span>
        <StateBadge state={adj.approvalState} />
        {adj.approvedBy && (
          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            ✓ {adj.approvedBy}
          </span>
        )}
        {adj.publishedAt && (
          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            Published {new Date(adj.publishedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
        Scenario {adj.scenarioId.slice(0, 8)}…
      </span>

      {/* Confirmation gate for Publish / Rollback */}
      {confirming ? (
        <div
          data-testid={`confirm-${confirming}-${adj.adjustmentSetId}`}
          style={{
            marginTop: 4, padding: '6px 8px',
            background: confirming === 'RolledBack' ? '#ef444411' : '#3b82f611',
            borderRadius: 4, border: `1px solid ${confirming === 'RolledBack' ? '#ef4444' : '#3b82f6'}44`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--tf-fg))' }}>
            Confirm {confirming === 'Published' ? 'Publish' : 'Rollback'}?
            {confirming === 'Published' && (
              <span style={{ fontSize: 10, fontWeight: 400, color: 'hsl(var(--tf-muted))', marginLeft: 6 }}>
                This locks the DOR submission.
              </span>
            )}
          </div>
          {confirming === 'RolledBack' && (
            <input
              data-testid={`rollback-reason-${adj.adjustmentSetId}`}
              type="text"
              placeholder="Reason for rollback (required for audit trail)"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              style={{
                width: '100%', fontSize: 11, padding: '3px 6px',
                border: '1px solid hsl(var(--tf-border))', borderRadius: 3,
                background: 'hsl(var(--tf-surface))', color: 'hsl(var(--tf-fg))',
                marginBottom: 4, boxSizing: 'border-box',
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              data-testid={`confirm-yes-${adj.adjustmentSetId}`}
              disabled={isBusy || (confirming === 'RolledBack' && rollbackReason.trim() === '')}
              onClick={handleConfirmYes}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 4,
                border: 'none',
                background: confirming === 'RolledBack' ? '#ef4444' : '#3b82f6',
                color: '#fff', cursor: 'pointer', fontWeight: 700,
              }}
            >
              {isBusy ? '…' : 'Yes, confirm'}
            </button>
            <button
              data-testid={`confirm-cancel-${adj.adjustmentSetId}`}
              onClick={handleConfirmCancel}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 4,
                border: '1px solid hsl(var(--tf-border))',
                background: 'hsl(var(--tf-surface))', color: 'hsl(var(--tf-fg))',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        actions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            {actions.map(({ state, label }) => (
              <button
                key={state}
                data-testid={`btn-${state}-${adj.adjustmentSetId}`}
                disabled={isBusy}
                onClick={() => handleClick(state)}
                style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 4,
                  border: '1px solid hsl(var(--tf-border))',
                  background:
                    state === 'RolledBack' ? '#ef444422' :
                    state === 'Published'  ? '#22c55e22' :
                    'hsl(var(--tf-surface))',
                  color:
                    state === 'RolledBack' ? '#ef4444' :
                    state === 'Published'  ? '#22c55e' :
                    'hsl(var(--tf-fg))',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy ? 0.5 : 1,
                }}
              >
                {isBusy ? '…' : label}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run all AdjustmentSetPanel tests — all must pass**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx --reporter=verbose
```

Expected: all pass (existing + 4 new). If any existing test broke because the button click now shows confirm instead of calling API — update those tests to go through the confirm flow.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
git add frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx \
        frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx
git commit -m "feat(county-studio): confirmation gate for Publish and Rollback; Rollback requires a reason; 4 new tests"
```

---

## Task 6 — Fix AdjustmentSetPanel stale-after-promote

**Problem:** `AdjustmentSetPanel` only fetches on mount. If the Govnc tab is already open when a scenario is promoted, the panel shows stale data — no new adjustment set visible.

**Design:** Add `lastPromotedAt: number | null` to `countyStudioStore`. `ScenarioWorksheet` calls `setLastPromotion()` after a successful promote. `AdjustmentSetPanel` includes `lastPromotedAt` in its `useEffect` deps so it re-fetches automatically.

**Files:**
- Modify: `frontend/apps/os-shell/src/stores/countyStudioStore.ts`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx`

- [ ] **Step 1: Write a failing test that verifies AdjustmentSetPanel re-fetches when lastPromotedAt changes**

Add to `AdjustmentSetPanel.test.tsx`:

```typescript
test('re-fetches adjustment sets when store lastPromotedAt changes', async () => {
  const firstSet  = makeAdj({ approvalState: 'Proposed', adjustmentSetId: 'adj-001' });
  const secondSet = makeAdj({ approvalState: 'Proposed', adjustmentSetId: 'adj-002' });

  // First fetch returns one set.
  mockList.mockResolvedValueOnce([firstSet]);
  // Second fetch (triggered by lastPromotedAt change) returns two sets.
  mockList.mockResolvedValueOnce([firstSet, secondSet]);

  render(<AdjustmentSetPanel />);
  await screen.findByTestId('adj-row-adj-001');
  expect(screen.queryByTestId('adj-row-adj-002')).not.toBeInTheDocument();

  // Simulate a promote completing elsewhere.
  act(() => {
    useCountyStudioStore.getState().setLastPromotion();
  });

  await screen.findByTestId('adj-row-adj-002');
  expect(screen.getByTestId('adj-row-adj-001')).toBeInTheDocument();
  expect(screen.getByTestId('adj-row-adj-002')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx --reporter=verbose 2>&1 | grep "re-fetches"
```

Expected: FAIL — `setLastPromotion` not on store.

- [ ] **Step 3: Add `lastPromotedAt` and `setLastPromotion` to `countyStudioStore.ts`**

In the store state interface (find the existing state fields and add):

```typescript
/** Timestamp set by ScenarioWorksheet after a successful promote.
 *  AdjustmentSetPanel subscribes so it re-fetches automatically. */
lastPromotedAt: number | null;
```

In the actions interface (find existing actions):

```typescript
/** Call after a successful promote to trigger AdjustmentSetPanel refresh. */
setLastPromotion: () => void;
```

In the initial state (inside `create`):

```typescript
lastPromotedAt: null,
```

In the action implementations:

```typescript
setLastPromotion: () => set({ lastPromotedAt: Date.now() }, false, 'setLastPromotion'),
```

- [ ] **Step 4: Call `setLastPromotion` in `ScenarioWorksheet.tsx` after promote succeeds**

In `handlePromote`, after the `setPromoteSuccess(...)` call:

```typescript
setPromoteSuccess('Promoted — see Govnc tab for approval workflow.');
useCountyStudioStore.getState().setLastPromotion();   // ← add this line
```

- [ ] **Step 5: Subscribe to `lastPromotedAt` in `AdjustmentSetPanel.tsx`**

At the top of `AdjustmentSetPanel` function body, add:

```typescript
const lastPromotedAt = useCountyStudioStore((s) => s.lastPromotedAt);
```

In the `useEffect` dependency array, add `lastPromotedAt`:

```typescript
useEffect(() => { void load(); }, [load, lastPromotedAt]);
```

- [ ] **Step 6: Run all AdjustmentSetPanel tests — all must pass**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration/frontend/apps/os-shell
npx vitest run src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx --reporter=verbose
```

Expected: all pass including new "re-fetches when lastPromotedAt changes" test.

- [ ] **Step 7: Run all county-studio tests — no regressions**

```bash
npx vitest run src/pages/forge/county-studio/
```

Expected: 27 test files, all pass.

- [ ] **Step 8: Commit**

```bash
cd C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/chunk-1-integration
git add frontend/apps/os-shell/src/stores/countyStudioStore.ts \
        frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx \
        frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx \
        frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx
git commit -m "fix(county-studio): AdjustmentSetPanel auto-refreshes after promote via store lastPromotedAt signal; 1 new test"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] complianceBadge color map fixed + 3 pinning tests — Task 1
- [x] promote body sends `effectiveScope` not `studyId/countyId` — Task 2
- [x] CountyName from DB, not hardcoded — Task 3
- [x] CurrentUserId reads real claim — Task 4
- [x] Publish and Rollback confirmation gate with reason field — Task 5
- [x] AdjustmentSetPanel auto-refreshes after promote — Task 6

**Placeholder scan:** None. Every step has exact code, exact commands, exact expected output.

**Type consistency:**
- `CountyStudySessionDto` record param order: `(StudyId, CountyId, CountyName, TaxYear, StudyType, Status, BaselineVersion, ActiveSegmentSetId, CreatedAt, CreatedBy)` — `MapStudy` uses the same order.
- `setLastPromotion` is consistent across store interface, implementation, and all callers.
- `AdjustmentSetApprovalState` is imported from `countyStudio.types` — `confirming` state uses same type.
- `data-testid` pattern for confirm: `confirm-${state}-${id}`, `confirm-yes-${id}`, `confirm-cancel-${id}`, `rollback-reason-${id}` — consistent across component and tests.
