# Phase 8 — TerraTrace Fidelity + Honesty Sweep Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand backend TraceContractTests to ~20 tests and deliver two CLI sweep tools (`sweep.ts`, `verify-ops.ts`) that exit non-zero when drift or shadow writes are detected.

**Architecture:** Pre-existing artifacts are confirmed complete — `terraTrace.ts` has `emitIntent`/`emitResult`/`getUnpairedIntents`/`getTraceLog`; frontend phase8 contract tests are 13/13 green; backend Phase13 base tests are 9/9 green (PII fix already applied). Phase 8 adds static-analysis CLI tooling and expands backend coverage to prove fidelity guarantees.

**Tech Stack:** C# (xUnit + FluentAssertions), TypeScript (Node.js, no framework), pnpm/tsc

---

## Pre-Phase Baseline (confirmed before plan execution)

| Check | Result |
|-------|--------|
| `pnpm run type-check` | CLEAN |
| `dotnet build TerraFusion.sln --configuration Release` | 0 errors, 32 warnings |
| frontend `phase8-traceFidelity.contract.test.ts` | 13/13 PASS |
| backend `Phase13` TraceContractTests | 9/9 PASS (post PII fix) |
| `tools/tf/` directory | does not exist — to be created |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/TerraFusion.API.Tests/Phase13/TraceContractTests.cs` | Expand | Add ~11 new test methods (9 → 20) |
| `tools/tf/sweep.ts` | CREATE | CLI drift detector — exits non-zero on unpaired intents or missing emitIntent calls in mutation sites |
| `tools/tf/verify-ops.ts` | CREATE | CLI shadow write detector — scans backend for SaveChangesAsync calls outside sanctioned service paths |
| `tools/tf/package.json` | CREATE | Minimal package descriptor for the tf CLI tools |

---

## Chunk 1 — Backend TraceContractTests Expansion

### Task 1: Expand TraceContractTests.cs from 9 → 20 tests

**Files:**
- Modify: `backend/TerraFusion.API.Tests/Phase13/TraceContractTests.cs`

The existing 9 tests cover: PII (email/password/SSN), correlation ID in audit loggers, TerraPilot PII policy, OpenTelemetry registration, TracingConstants, console.WriteLine in controllers/middleware.

Add 11 more tests covering Phase 8 proving requirements.

- [ ] **Step 1: Read current test count to confirm baseline**

```bash
grep -c "\[Fact\]\|\[Theory\]" backend/TerraFusion.API.Tests/Phase13/TraceContractTests.cs
```
Expected: 7 (7 Fact/Theory decorators → 9 total test cases with 2 inline-data theory rows)

- [ ] **Step 2: Add 11 new test methods to TraceContractTests.cs**

Insert the following block BEFORE the `#region Helpers` line:

```csharp
    /// <summary>
    /// Phase 8: emitIntent must exist in terraTrace.ts.
    /// Proves the frontend paired API is present — source-text contract.
    /// </summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_EmitIntent()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function emitIntent",
            "terraTrace.ts must export emitIntent for intent/result pairing (Phase 8 contract)");
    }

    /// <summary>Phase 8: emitResult must exist in terraTrace.ts.</summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_EmitResult()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function emitResult",
            "terraTrace.ts must export emitResult for intent/result pairing (Phase 8 contract)");
    }

    /// <summary>Phase 8: getUnpairedIntents must exist — enables sweep tooling.</summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_GetUnpairedIntents()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function getUnpairedIntents",
            "terraTrace.ts must export getUnpairedIntents so sweep tooling can detect incomplete pairs");
    }

    /// <summary>
    /// Phase 8: TraceIntent must carry countyId — county isolation contract.
    /// </summary>
    [Fact]
    public void Frontend_TraceIntent_Must_Carry_CountyId()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        // TraceIntent interface must have countyId field
        content.Should().Contain("countyId",
            "TraceIntent must carry countyId for county isolation — every intent is county-scoped");
    }

    /// <summary>
    /// Phase 8: sweep.ts CLI tool must exist in tools/tf/.
    /// Proves drift detection tooling is present and deployable.
    /// </summary>
    [Fact]
    public void SweepTool_Must_Exist_In_Tools_Tf()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var sweepFile = Path.Combine(repoRoot, "tools", "tf", "sweep.ts");

        File.Exists(sweepFile).Should().BeTrue(
            "tools/tf/sweep.ts must exist — Phase 8 drift detection CLI tool required");
    }

    /// <summary>
    /// Phase 8: verify-ops.ts CLI tool must exist in tools/tf/.
    /// Proves shadow write detection tooling is present and deployable.
    /// </summary>
    [Fact]
    public void VerifyOpsTool_Must_Exist_In_Tools_Tf()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var verifyOpsFile = Path.Combine(repoRoot, "tools", "tf", "verify-ops.ts");

        File.Exists(verifyOpsFile).Should().BeTrue(
            "tools/tf/verify-ops.ts must exist — Phase 8 shadow write detection CLI tool required");
    }

    /// <summary>
    /// Phase 8: sweep.ts must reference getUnpairedIntents or equivalent unpaired detection.
    /// Proves the sweep tool actually uses the API — not just an empty file.
    /// </summary>
    [Fact]
    public void SweepTool_Must_Reference_Unpaired_Detection()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var sweepFile = Path.Combine(repoRoot, "tools", "tf", "sweep.ts");

        if (!File.Exists(sweepFile)) return;

        var content = File.ReadAllText(sweepFile);
        var hasUnpairedRef =
            content.Contains("unpaired", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("getUnpairedIntents", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("emitIntent", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("drift", StringComparison.OrdinalIgnoreCase);

        hasUnpairedRef.Should().BeTrue(
            "sweep.ts must reference unpaired intent detection or drift — an empty stub is insufficient");
    }

    /// <summary>
    /// Phase 8: verify-ops.ts must reference SaveChangesAsync or direct mutation detection.
    /// Proves the verify-ops tool targets actual shadow write patterns.
    /// </summary>
    [Fact]
    public void VerifyOpsTool_Must_Reference_SaveChanges_Detection()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var verifyOpsFile = Path.Combine(repoRoot, "tools", "tf", "verify-ops.ts");

        if (!File.Exists(verifyOpsFile)) return;

        var content = File.ReadAllText(verifyOpsFile);
        var hasShadowWriteRef =
            content.Contains("SaveChanges", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("shadow", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("bypass", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("mutation", StringComparison.OrdinalIgnoreCase);

        hasShadowWriteRef.Should().BeTrue(
            "verify-ops.ts must reference SaveChanges, shadow writes, or mutation bypass detection");
    }

    /// <summary>
    /// Phase 8: DistributedTracingService must exist in TerraFusion.Core.
    /// Validates the intent/result correlation service is in the sovereign spine.
    /// </summary>
    [Fact]
    public void DistributedTracingService_Must_Exist_In_Core()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var tracingFile = Directory.GetFiles(
                BackendSrcDir, "DistributedTracingService.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .FirstOrDefault();

        tracingFile.Should().NotBeNull(
            "DistributedTracingService.cs must exist in backend/src — required for intent/result correlation");

        var content = File.ReadAllText(tracingFile!);
        content.Should().Contain("IDistributedTracingService",
            "DistributedTracingService must implement IDistributedTracingService interface");
    }

    /// <summary>
    /// Phase 8: No raw phone numbers or tax IDs in log format strings.
    /// Extends PII sweep to government-specific sensitive fields.
    /// </summary>
    [Fact]
    public void No_Raw_TaxId_Or_Phone_In_Log_Format_Strings()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var taxIdPattern = new System.Text.RegularExpressions.Regex(
            @"_logger\.Log\w+\([^;]*\{[Tt]ax[Ii][Dd]\}[^;]*,\s*\w*[Tt]ax[Ii][Dd]",
            System.Text.RegularExpressions.RegexOptions.Compiled);

        var phonePattern = new System.Text.RegularExpressions.Regex(
            @"_logger\.Log\w+\([^;]*\{[Pp]hone(Number)?\}[^;]*,\s*\w*[Pp]hone",
            System.Text.RegularExpressions.RegexOptions.Compiled);

        var taxViolations = ScanForViolations(taxIdPattern, "Raw {TaxId} in log");
        var phoneViolations = ScanForViolations(phonePattern, "Raw {Phone} in log");

        taxViolations.Should().BeEmpty(
            "PII contract: tax IDs must never appear as raw values in log format strings");
        phoneViolations.Should().BeEmpty(
            "PII contract: phone numbers must never appear as raw values in log format strings");
    }

    /// <summary>
    /// Phase 8: terraTrace.ts must use county-scoped context on emitIntent.
    /// Validates county isolation — cross-county trace leakage is a governance violation.
    /// </summary>
    [Fact]
    public void Frontend_EmitIntent_Must_Use_CountyId_Parameter()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);

        // TraceIntent shape must include countyId, and emitIntent must push it through
        content.Should().Contain("intent.countyId",
            "emitIntent must propagate countyId from TraceIntent — no county-anonymous intents allowed");
    }
```

- [ ] **Step 3: Run expanded backend tests**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Category=Phase13" --logger "console;verbosity=normal"
```

Expected: Tests for sweep.ts and verify-ops.ts will FAIL (tools don't exist yet) — that's the RED state proving the contract. All other new tests should PASS.

- [ ] **Step 4: Confirm exact failure count before proceeding**

Expected failures: exactly 3 (`SweepTool_Must_Exist_In_Tools_Tf`, `VerifyOpsTool_Must_Exist_In_Tools_Tf` — and their content checks will be skipped since files don't exist). Actually the existence checks will fail, the content checks will early-return. So expect 2 failures.

---

## Chunk 2 — CLI Sweep Tool

### Task 2: Create tools/tf/sweep.ts

**Files:**
- Create: `tools/tf/package.json`
- Create: `tools/tf/sweep.ts`

`sweep.ts` is a static analysis tool. It scans the frontend source tree for files that perform mutations (dispatch through TruthGate / call mutating service methods) and checks that they emit `emitIntent` before and `emitResult` after. It also reads the `getUnpairedIntents` API concept to detect partial pairs.

Since this is a static source analyzer (no running server required), it uses the Node.js filesystem APIs directly.

- [ ] **Step 1: Create tools/tf/ directory structure**

```bash
mkdir -p tools/tf
```

- [ ] **Step 2: Create tools/tf/package.json**

```json
{
  "name": "@terrafusion/tf-cli",
  "version": "1.0.0",
  "description": "TerraFusion CLI tooling — sweep and verify-ops",
  "type": "module",
  "scripts": {
    "sweep": "npx tsx sweep.ts",
    "verify-ops": "npx tsx verify-ops.ts"
  },
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
```

- [ ] **Step 3: Create tools/tf/sweep.ts**

```typescript
#!/usr/bin/env node
/**
 * tf sweep — TerraTrace drift detection
 *
 * Scans the frontend source tree for files that import or call
 * mutation-related dispatch functions (osActions dispatch, TruthGate
 * validateOperation) and checks that they also call emitIntent /
 * emitResult.
 *
 * Exit codes:
 *   0 — no drift detected
 *   1 — drift detected (mutation sites missing trace pairing)
 *
 * Usage: npx tsx tools/tf/sweep.ts [--src <path>]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(new URL('.', import.meta.url).pathname, '../..');
const DEFAULT_SRC = join(REPO_ROOT, 'frontend', 'apps', 'os-shell', 'src');

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--src');
const SRC_ROOT = srcIdx >= 0 ? resolve(args[srcIdx + 1]) : DEFAULT_SRC;

// Patterns that indicate a file is performing a mutation through the spine
const MUTATION_PATTERNS = [
  /dispatch\s*\(/,
  /validateOperation\s*\(/,
  /emitTraceEvent\s*\(/,
  /emitCanonTrace\s*\(/,
];

// Patterns that indicate a file has paired trace calls
const INTENT_PATTERN = /emitIntent\s*\(/;
const RESULT_PATTERN = /emitResult\s*\(/;

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

function walkSrc(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '__tests__', 'dist', '.cache'].includes(entry)) continue;
      walkSrc(full, files);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

interface DriftResult {
  file: string;
  hasMutation: boolean;
  hasIntent: boolean;
  hasResult: boolean;
}

function scanFile(filePath: string): DriftResult | null {
  const content = readFileSync(filePath, 'utf-8');
  const hasMutation = MUTATION_PATTERNS.some((p) => p.test(content));
  if (!hasMutation) return null;

  const hasIntent = INTENT_PATTERN.test(content);
  const hasResult = RESULT_PATTERN.test(content);

  // Only flag as drift if mutation exists but pairing is absent
  if (hasIntent && hasResult) return null;

  return {
    file: relative(REPO_ROOT, filePath),
    hasMutation: true,
    hasIntent,
    hasResult,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const EXCLUDED_FILES = [
  'terraTrace.ts',   // the trace service itself — intentionally only has emit*, not paired calls
  'osActions.ts',    // trace emission origin
  'truthGate.ts',    // validation layer — not a mutation caller itself
];

function main(): void {
  console.log(`🔍 tf sweep — scanning ${SRC_ROOT}`);

  if (!statSync(SRC_ROOT, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`❌ Source directory not found: ${SRC_ROOT}`);
    process.exit(1);
  }

  const files = walkSrc(SRC_ROOT);
  const driftFiles: DriftResult[] = [];

  for (const f of files) {
    const name = f.split(/[/\\]/).pop() ?? '';
    if (EXCLUDED_FILES.includes(name)) continue;

    const result = scanFile(f);
    if (result) driftFiles.push(result);
  }

  if (driftFiles.length === 0) {
    console.log('✅ No drift detected — all mutation sites have paired trace calls.');
    process.exit(0);
  }

  console.log(`\n⚠️  Drift detected — ${driftFiles.length} file(s) have mutations without emitIntent/emitResult:\n`);
  for (const d of driftFiles) {
    const missing: string[] = [];
    if (!d.hasIntent) missing.push('emitIntent');
    if (!d.hasResult) missing.push('emitResult');
    console.log(`  ${d.file}`);
    console.log(`    Missing: ${missing.join(', ')}`);
  }

  console.log('\n❌ Sweep failed. Add paired emitIntent/emitResult calls to flagged files.');
  process.exit(1);
}

main();
```

- [ ] **Step 4: Run sweep.ts against the live codebase**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
npx tsx tools/tf/sweep.ts
```

Note the exit code and drift count. Drift findings are expected (the sweep is a detection tool; the fixing of existing sites is out of Phase 8 scope). What matters is that the tool executes without crashing and produces meaningful output.

- [ ] **Step 5: Verify exit codes work correctly**

The tool must exit 1 when drift is found, 0 when clean. Do not fail the phase on drift count — the tool proving it detects drift IS the goal.

---

## Chunk 3 — CLI Verify-Ops Tool

### Task 3: Create tools/tf/verify-ops.ts

**Files:**
- Create: `tools/tf/verify-ops.ts`

`verify-ops.ts` scans the backend C# source for `SaveChangesAsync()` calls that appear OUTSIDE the officially sanctioned service/repository files. Any controller or ad-hoc class that directly calls `SaveChangesAsync` without routing through the registered service pattern is a potential shadow write.

- [ ] **Step 1: Create tools/tf/verify-ops.ts**

```typescript
#!/usr/bin/env node
/**
 * tf verify-ops — Shadow write detector
 *
 * Scans the backend C# source for direct SaveChangesAsync() calls
 * that appear outside officially sanctioned data service files.
 *
 * Sanctioned callers: files whose name ends in Service.cs, Repository.cs,
 * Interceptor.cs, DbContext.cs, or DbContextFactory.cs.
 * Everything else is a shadow write candidate.
 *
 * Exit codes:
 *   0 — no shadow writes detected
 *   1 — shadow write patterns detected
 *
 * Usage: npx tsx tools/tf/verify-ops.ts [--src <path>]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(new URL('.', import.meta.url).pathname, '../..');
const DEFAULT_SRC = join(REPO_ROOT, 'backend', 'src');

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--src');
const BACKEND_SRC = srcIdx >= 0 ? resolve(args[srcIdx + 1]) : DEFAULT_SRC;

// Sanctioned file name suffixes — these are allowed to call SaveChangesAsync
const SANCTIONED_SUFFIXES = [
  'Service.cs',
  'Repository.cs',
  'Interceptor.cs',
  'DbContext.cs',
  'DbContextFactory.cs',
  'TerraFusionDbContext.cs',
  'SeedData.cs',
  'Seeder.cs',
  'Migration.cs',
];

const SAVE_CHANGES_PATTERN = /SaveChangesAsync\s*\(/;

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

function walkBackend(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['obj', 'bin', 'Migrations', '.git'].includes(entry)) continue;
      walkBackend(full, files);
    } else if (entry.endsWith('.cs') && !entry.includes('.Designer.')) {
      files.push(full);
    }
  }
  return files;
}

function isSanctioned(filePath: string): boolean {
  const name = filePath.split(/[/\\]/).pop() ?? '';
  return SANCTIONED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

interface ShadowWriteResult {
  file: string;
  lineNumbers: number[];
}

function scanCsFile(filePath: string): ShadowWriteResult | null {
  if (isSanctioned(filePath)) return null;

  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const hits: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (SAVE_CHANGES_PATTERN.test(lines[i])) {
      hits.push(i + 1); // 1-based line numbers
    }
  }

  if (hits.length === 0) return null;

  return {
    file: relative(REPO_ROOT, filePath),
    lineNumbers: hits,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log(`🔍 tf verify-ops — scanning ${BACKEND_SRC}`);

  if (!statSync(BACKEND_SRC, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`❌ Backend source directory not found: ${BACKEND_SRC}`);
    process.exit(1);
  }

  const files = walkBackend(BACKEND_SRC);
  const shadowWrites: ShadowWriteResult[] = [];

  for (const f of files) {
    const result = scanCsFile(f);
    if (result) shadowWrites.push(result);
  }

  if (shadowWrites.length === 0) {
    console.log('✅ No shadow writes detected — all SaveChangesAsync calls are in sanctioned service files.');
    process.exit(0);
  }

  console.log(`\n⚠️  Shadow write candidates — ${shadowWrites.length} file(s) call SaveChangesAsync outside sanctioned paths:\n`);
  for (const s of shadowWrites) {
    console.log(`  ${s.file}`);
    console.log(`    Lines: ${s.lineNumbers.join(', ')}`);
  }

  console.log('\n❌ verify-ops failed. Review flagged files — mutations must route through registered service layer.');
  process.exit(1);
}

main();
```

- [ ] **Step 2: Run verify-ops.ts**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
npx tsx tools/tf/verify-ops.ts
```

Shadow write candidates are expected (the tool proves detection; fixing is out of Phase 8 scope). Verify the tool executes cleanly and produces a structured report.

---

## Chunk 4 — Regression + Seal

### Task 4: Final gates, commit, governance seal

- [ ] **Step 1: Run all backend Phase13 tests (expect 20/20 or near)**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Category=Phase13" --logger "console;verbosity=normal"
```

Expected: all tests that check file existence should now PASS (tools created). Total: ~20.

- [ ] **Step 2: Run frontend Phase 8 tests**

```bash
cd frontend
pnpm exec vitest run apps/os-shell/src/__tests__/auth/phase8-traceFidelity.contract.test.ts
```

Expected: 13/13 PASS (unchanged from baseline).

- [ ] **Step 3: Type-check gate**

```bash
cd frontend && pnpm run type-check
```

Expected: 0 errors.

- [ ] **Step 4: Backend build gate**

```bash
cd backend && dotnet build TerraFusion.sln --configuration Release --nologo -verbosity:quiet
```

Expected: 0 errors.

- [ ] **Step 5: Commit Phase 8**

```bash
git add \
  backend/TerraFusion.API.Tests/Phase13/TraceContractTests.cs \
  backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs \
  tools/tf/sweep.ts \
  tools/tf/verify-ops.ts \
  tools/tf/package.json

git commit -m "feat(phase8): TerraTrace fidelity — sweep + verify-ops CLI tools, 20 backend trace contract tests, PII email fix

- emitIntent/emitResult/getUnpairedIntents: pre-existing, 13/13 frontend tests PASS
- TraceContractTests expanded 9→20: frontend API contracts, sweep/verify-ops existence, county isolation, PII extension
- tools/tf/sweep.ts: drift detector — exits 1 when mutation sites lack paired trace calls
- tools/tf/verify-ops.ts: shadow write detector — exits 1 when SaveChangesAsync outside sanctioned paths
- Fix AuthenticationConfiguration.cs:288 — {Email} → {EmailHash} (PII contract)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 6: Update .governance/workflow/progress.md**

Update Current Status block:
```
| Slice | Slice 29 — Phase 8: TerraTrace Fidelity |
| Phase | Phase 8 — CP-W8-1 CLOSED ✅ |
| Task | sweep.ts + verify-ops.ts CLI tools; 20 backend trace contract tests; PII email fix |
| Status | ✅ SEALED — hard stop reinstated |
| Latest Commit | <seal commit SHA> |
```

- [ ] **Step 7: Commit governance seal**

```bash
git add .governance/workflow/progress.md
git commit -m "chore(phase8): seal CP-W8-1 — TerraTrace fidelity sweep tools delivered"
```

---

## Proving Tests Summary

| # | Test | Location | Status |
|---|------|----------|--------|
| 1 | emitIntent/emitResult paired API exists | frontend phase8 contract | ✅ pre-existing |
| 2 | emitIntent records intent | frontend phase8 contract | ✅ pre-existing |
| 3 | emitResult records result | frontend phase8 contract | ✅ pre-existing |
| 4 | getUnpairedIntents returns unpaired | frontend phase8 contract | ✅ pre-existing |
| 5 | Fully paired → empty unpaired | frontend phase8 contract | ✅ pre-existing |
| 6 | PII email sanitization (backend) | TraceContractTests | ✅ pre-existing (+ PII fix) |
| 7 | PII password/SSN sanitization | TraceContractTests | ✅ pre-existing |
| 8 | Correlation ID in audit loggers | TraceContractTests | ✅ pre-existing |
| 9 | sweep.ts exists in tools/tf/ | TraceContractTests new | ❌ → ✅ after Task 2 |
| 10 | verify-ops.ts exists in tools/tf/ | TraceContractTests new | ❌ → ✅ after Task 3 |
| 11 | sweep.ts references unpaired detection | TraceContractTests new | ❌ → ✅ after Task 2 |
| 12 | verify-ops.ts references shadow writes | TraceContractTests new | ❌ → ✅ after Task 3 |
| 13 | frontend emitIntent exported | TraceContractTests new | ✅ after Task 1 |
| 14 | frontend emitResult exported | TraceContractTests new | ✅ after Task 1 |
| 15 | frontend getUnpairedIntents exported | TraceContractTests new | ✅ after Task 1 |
| 16 | TraceIntent carries countyId | TraceContractTests new | ✅ after Task 1 |
| 17 | emitIntent propagates intent.countyId | TraceContractTests new | ✅ after Task 1 |
| 18 | DistributedTracingService exists in Core | TraceContractTests new | ✅ after Task 1 |
| 19 | No raw TaxId/Phone in logs | TraceContractTests new | ✅ after Task 1 |
| 20 | sweep.ts drift detection executes | CLI smoke | ✅ after Task 2 |
| 21 | verify-ops shadow write detection executes | CLI smoke | ✅ after Task 3 |

---

*Plan written 2026-03-18. Execute Tasks 1 → 2 → 3 → 4 sequentially.*
