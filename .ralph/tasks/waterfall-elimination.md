# RALPH TASK: Waterfall Elimination (Critical Priority)
# =====================================================
# Priority: CRITICAL (Vercel Rules 1.1-1.4)
# Assignee: QC-019 Waterfall Elimination Team (10 agents)
# Target: Codex Foundation Metric "apiResponseTime"

## Objective
Eliminate sequential await patterns in TerraFusion OS core modules
to improve data fetching performance and achieve Divine Balance.

## Scope (from AGENTS.md)
ONLY modify files in:
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**

DO NOT modify:
- **/ARCHIVE/**
- specialized/**
- applications/**

## Detection Pattern
Find code matching this anti-pattern:
```typescript
// ANTI-PATTERN: Sequential awaits (waterfall)
const userData = await fetchUser(id);
const preferences = await fetchPreferences(id);
const permissions = await fetchPermissions(id);
// Each await waits for the previous to complete = waterfall
```

## Optimization Pattern
Convert to parallel execution:
```typescript
// OPTIMIZED: Parallel fetching with Promise.all
const [userData, preferences, permissions] = await Promise.all([
  fetchUser(id),
  fetchPreferences(id),
  fetchPermissions(id)
]);
// All requests fire simultaneously
```

## Success Criteria
- [ ] All sequential awaits in scope converted to Promise.all
- [ ] No regression in type-check: `pnpm run type-check` passes
- [ ] No regression in tests: `node --test os-platform/core/tests/phase83-tools.test.mjs` passes
- [ ] Codex "apiResponseTime" metric improved
- [ ] Zero port violations (validated by pre-commit hook)

## Verification Commands
```bash
# Gate 1: Type check
pnpm run type-check

# Gate 2: Core tests
node --test os-platform/core/tests/phase83-tools.test.mjs

# Gate 3: Port validation (if available)
python3 scripts/port-validator.py
```

## Commit Template
```
refactor(core): eliminate waterfall in [module]

Convert sequential awaits to Promise.all for parallel execution.

Evidence:
- Tests: All passing
- Gates: type-check ✓, phase83-tools ✓
- Codex: apiResponseTime improved by X%

Government: FISMA-HIGH compliance maintained
AI-Collaboration: Ralph Loop + QC-019 Waterfall Team
```

## Files to Prioritize
1. os-platform/core/pilot/shellIpcBridge.ts
2. os-platform/core/pilot/moduleLoader.ts
3. os-platform/core/pilot/terraSystem.ts

## Constraints
- Maximum 5 files per iteration
- Each change must pass all gates before commit
- Preserve existing functionality (no breaking changes)
- Follow existing code style
