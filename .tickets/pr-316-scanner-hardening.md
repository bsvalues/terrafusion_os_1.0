# PR #316: Orphan C# Source Scanner Hardening

**Status:** Planned (Optional Enhancement)  
**Priority:** Medium (governance hardening, not blocking)  
**Effort:** ~8 hours (1 sprint)  
**Depends On:** PR #315 merged ✅  
**Context:** Tactical improvements to orphan scanner after incident resolution

---

## Problem Statement

The orphan scanner (`tools/dx/orphan-cs-scan.mjs`) successfully prevents orphaned `.cs` files from bypassing CI, but has two areas for hardening:

1. **Allowlist Scope Ambiguity**  
   - Current allowlist includes `.github/`, `scripts/`, `tools/` (not under `backend/`)
   - Scanner only enforces `backend/` build graph, so allowlist is confusing
   - **Impact:** Low false-positive risk, but creates audit ambiguity

2. **MSBuild Edge Cases**  
   - Current implementation handles:
     - ✅ SDK-style auto-include (all `.cs` in project dir)
     - ✅ Explicit `<Compile Include="...">` (legacy projects)
   - Missing edge cases:
     - ❌ `<Compile Remove="...">` (exclude patterns)
     - ❌ Conditional `<ItemGroup Condition="...">` (debug/release differences)
     - ❌ `Directory.Build.props/targets` (global MSBuild settings)
     - ❌ Multi-targeting projects (`<TargetFrameworks>`)

   **Impact:** Low false-positive risk today, but future refactors could trigger spurious failures.

---

## Requirements

### 1. Tighten Allowlist Scope

**Current Allowlist:**
```javascript
const ALLOWED_ORPHAN_PATHS = [
  'docs/',       // Documentation examples
  'prototypes/', // Experimental code
  'ARCHIVE/',    // Deprecated code
  'scripts/',    // Build scripts (not compiled)
  'tools/',      // DX tooling (not compiled)
  '.github/'     // Workflow files
];
```

**Proposed Change:**
- Document that allowlist is **backend-relative** (scanner only checks `backend/`)
- Remove entries that can't exist under `backend/`:
  - `.github/` → Not in `backend/`, scanner never sees it
  - `scripts/` → Not in `backend/`, scanner never sees it  
  - `tools/` → Not in `backend/`, scanner never sees it

**New Allowlist:**
```javascript
const ALLOWED_ORPHAN_PATHS = [
  'docs/',       // Documentation examples (e.g., backend/docs/examples/)
  'prototypes/', // Experimental code (e.g., backend/prototypes/spike-auth/)
  'ARCHIVE/'     // Deprecated code (e.g., backend/ARCHIVE/legacy-services/)
];
```

**Header Comment:**
```javascript
/**
 * Allowed orphan paths (relative to backend/ scan root).
 * These directories may contain .cs files not tracked by .csproj files.
 * Example: backend/docs/samples/Example.cs
 */
const ALLOWED_ORPHAN_PATHS = ['docs/', 'prototypes/', 'ARCHIVE/'];
```

**Testing:**
- Verify scanner still accepts `backend/docs/Example.cs`
- Verify scanner rejects `.github/Example.cs` (not scanned anyway)

---

### 2. Handle MSBuild Edge Cases

**2.1: `<Compile Remove>` Patterns**

MSBuild allows excluding files from compilation:

```xml
<ItemGroup>
  <Compile Remove="**/*.Designer.cs" />
  <Compile Remove="Migrations/**/*.cs" />
</ItemGroup>
```

**Scanner Logic Update:**
1. Parse `<Compile Remove="...">` elements
2. Apply glob patterns to exclude files from "tracked sources"
3. Handle `**` wildcards (use `minimatch` npm package)

**Test Case:**
- Project has `<Compile Remove="**/*.Designer.cs">`
- File `backend/src/MyProject/Form1.Designer.cs` exists
- Scanner should report as **orphan** (explicitly removed from compilation)

---

**2.2: Conditional ItemGroups**

MSBuild allows conditional compilation:

```xml
<ItemGroup Condition="'$(Configuration)' == 'Debug'">
  <Compile Include="DebugHelpers.cs" />
</ItemGroup>
<ItemGroup Condition="'$(Configuration)' == 'Release'">
  <Compile Include="ReleaseOptimizations.cs" />
</ItemGroup>
```

**Scanner Logic Update:**
1. Parse `<ItemGroup Condition="...">` attributes
2. Collect sources from **all conditions** (union, not intersection)
   - Rationale: File tracked in any build config = not orphaned
3. Don't evaluate conditions (too complex, MSBuild-specific)

**Test Case:**
- Project has conditional debug/release sources
- `DebugHelpers.cs` only included in Debug
- Scanner treats as **tracked** (exists in at least one config)

---

**2.3: `Directory.Build.props/targets`**

MSBuild allows global settings via `Directory.Build.props`:

```xml
<!-- backend/Directory.Build.props -->
<ItemGroup>
  <Compile Remove="**/obj/**" />
  <Compile Remove="**/bin/**" />
</ItemGroup>
```

**Scanner Logic Update:**
1. Before parsing `.csproj` files, check for:
   - `backend/Directory.Build.props`
   - `backend/Directory.Build.targets`
2. Parse global `<Compile Remove>` patterns
3. Apply to all projects (like MSBuild does)

**Test Case:**
- `Directory.Build.props` has `<Compile Remove="**/Temp/**">`
- `backend/src/MyProject/Temp/Test.cs` exists
- Scanner should report as **orphan** (globally excluded)

---

**2.4: Multi-Targeting Projects**

Projects can target multiple frameworks:

```xml
<PropertyGroup>
  <TargetFrameworks>net8.0;net6.0</TargetFrameworks>
</PropertyGroup>
```

**Scanner Logic Update:**
1. Parse `<TargetFrameworks>` (plural) in addition to `<TargetFramework>` (singular)
2. Treat all target frameworks as equivalent (no conditional source tracking per framework)
3. **Edge Case:** Framework-specific sources (rare, skip for now)

**Test Case:**
- Project targets `net8.0;net6.0`
- All `.cs` files in project dir tracked (regardless of framework)

---

### 3. Add Scanner Fixture Tests

**Test Harness Structure:**
```
tools/dx/tests/
  fixtures/
    sdk-style/
      Project.csproj        # SDK-style auto-include
      Source1.cs            # Tracked (auto-include)
      bin/Temp.cs           # Excluded (bin/ ignored)
    legacy-style/
      Project.csproj        # Explicit <Compile Include>
      Source1.cs            # Tracked (explicit)
      Source2.cs            # Orphan (not in <Compile>)
    compile-remove/
      Project.csproj        # Has <Compile Remove="**/*.Designer.cs">
      Form1.cs              # Tracked
      Form1.Designer.cs     # Orphan (removed)
    conditional/
      Project.csproj        # Conditional ItemGroups
      DebugOnly.cs          # Tracked (debug config)
      ReleaseOnly.cs        # Tracked (release config)
    directory-build/
      Directory.Build.props # Global <Compile Remove>
      Project/
        Project.csproj
        Source.cs           # Tracked
        Temp/Test.cs        # Orphan (global remove)
  orphan-scan.test.mjs      # Test runner
```

**Test Runner (Node.js test runner):**
```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { getProjectSources } from '../orphan-cs-scan.mjs';

test('SDK-style auto-include tracks .cs files', () => {
  const sources = getProjectSources('tests/fixtures/sdk-style/Project.csproj');
  assert(sources.includes('Source1.cs'));
  assert(!sources.includes('bin/Temp.cs')); // Excluded
});

test('Compile Remove excludes files', () => {
  const sources = getProjectSources('tests/fixtures/compile-remove/Project.csproj');
  assert(sources.includes('Form1.cs'));
  assert(!sources.includes('Form1.Designer.cs')); // Removed
});

test('Conditional ItemGroups union all configs', () => {
  const sources = getProjectSources('tests/fixtures/conditional/Project.csproj');
  assert(sources.includes('DebugOnly.cs'));
  assert(sources.includes('ReleaseOnly.cs'));
});

test('Directory.Build.props global excludes apply', () => {
  const sources = getProjectSources('tests/fixtures/directory-build/Project/Project.csproj');
  assert(sources.includes('Source.cs'));
  assert(!sources.includes('Temp/Test.cs')); // Global remove
});
```

**CI Integration:**
```yaml
# .github/workflows/seal-gate-fast.yml (add before orphan scan step)
- name: Test orphan scanner (fixtures)
  run: node --test tools/dx/tests/orphan-scan.test.mjs
```

---

## Implementation Plan

### Phase 1: Tighten Allowlist (2 hours)

1. Update `ALLOWED_ORPHAN_PATHS` (remove `.github/`, `scripts/`, `tools/`)
2. Add header comment documenting backend-relative scope
3. Test locally: ensure no false positives
4. Update PR #315 commit message to reflect tighter scope

### Phase 2: MSBuild Edge Cases (4 hours)

1. Add `minimatch` dependency for glob pattern matching
2. Parse `<Compile Remove>` elements (handle wildcards)
3. Parse conditional `<ItemGroup Condition="...">` (union all)
4. Parse `Directory.Build.props/targets` (global removes)
5. Handle `<TargetFrameworks>` plural form

### Phase 3: Fixture Tests (2 hours)

1. Create `tools/dx/tests/fixtures/` (5 scenarios)
2. Write `orphan-scan.test.mjs` (Node.js test runner)
3. Wire into CI (SEAL gate or separate check)
4. Verify all tests green locally + CI

---

## Success Criteria

**Code Quality:**
- [ ] Allowlist is backend-relative only (3 entries max)
- [ ] MSBuild edge cases handled (Remove, Condition, Directory.Build, multi-target)
- [ ] Fixture tests cover all 5 scenarios
- [ ] No false positives on real codebase (`node tools/dx/orphan-cs-scan.mjs` → 0)

**Testing:**
- [ ] Fixture tests: 5 scenarios × 2-3 assertions each = ~15 tests
- [ ] CI runs fixture tests before orphan scan
- [ ] Manual test: Add fake `Form1.Designer.cs` with `<Compile Remove>` → detected as orphan

**CI/Validation:**
- [ ] SEAL gate includes scanner fixture tests
- [ ] `node --test tools/dx/tests/orphan-scan.test.mjs` → green
- [ ] `node tools/dx/orphan-cs-scan.mjs` → 0 orphans (no regression)

**Documentation:**
- [ ] Scanner header comment documents allowlist scope
- [ ] Fixture `README.md` explains test cases
- [ ] PR description links to incident (PR #314 + #315)

---

## Risk Mitigation

**Risk 1: False Positives (Scanner Too Strict)**
- Mitigation: Test on real codebase before enabling in CI
- Rollback: Revert PR #316, keep PR #315 orphan scanner (works today)

**Risk 2: `minimatch` Dependency Bloat**
- Mitigation: Use `picomatch` instead (smaller, faster)
- Alternative: Implement simple wildcard matching (no regex)

**Risk 3: `Directory.Build.props` Infinite Recursion**
- Mitigation: Only scan 1 level up from project dir (not entire tree)
- MSBuild behavior: stops at solution root or first `Directory.Build.props`

---

## Dependencies

**NPM Packages:**
- `minimatch` or `picomatch` (glob pattern matching for `<Compile Remove>`)
  - Already in workspace via transitive deps → no new install needed

**Test Fixtures:**
- 5 synthetic `.csproj` files (no real code, tests only)
- Total size: <10 KB (no bloat)

---

## Optional Enhancements (Future)

1. **Scanner Performance:** Cache `.csproj` parse results (avoid re-parsing on every run)
2. **Scanner UX:** Color-coded output (red for orphans, green for success)
3. **Scanner Metrics:** Emit JSON report for CI dashboards (`orphan-scan-report.json`)
4. **IDE Integration:** VS Code extension to highlight orphaned files in explorer

---

## References

- **MSBuild Reference:** https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-reference
- **SDK-Style Projects:** https://learn.microsoft.com/en-us/dotnet/core/project-sdk/overview
- **Directory.Build.props:** https://learn.microsoft.com/en-us/visualstudio/msbuild/customize-by-directory
- **Minimatch:** https://github.com/isaacs/minimatch
- **Picomatch:** https://github.com/micromatch/picomatch

---

**Next Steps:**
1. ✅ PR #315 merged (scanner operational)
2. Decide: Implement now or defer (not blocking)
3. If implementing: Create GitHub issue + assign to DX team
4. Estimate: 1 sprint (8 hours) for all 3 phases

**Government. Transcended. (With auditable precision.)**
