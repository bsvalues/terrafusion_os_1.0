# TerraFusion OS  Agent Operating Rules (Core Governance)

## PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## CORE GOVERNANCE SURFACE (ALLOWED SCOPE)
Only modify files under:
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** (only for gate wiring)

Anything outside this scope requires explicit authorization.

## DO NOT TOUCH
- **/ARCHIVE/**
- development/tools/championship-dev/ARCHIVE/**
- specialized/** (unless explicitly authorized)
- applications/** (unless explicitly authorized)

## BUILD ARTIFACTS POLICY (ENFORCED)
- `.ts` is the source of truth.
- `.js` files in `os-platform/core/**` are generated and must match their `.ts` source.
- Do not hand-edit generated `.js` files.
- Regen command (manual): `pnpm run build:core-js` then `pnpm run check:generated`.

## REQUIRED GATES (MUST PASS)
- `pnpm run type-check` (core boundary)
- `node --test os-platform/core/tests/phase83-tools.test.mjs`

## BRANCH PROTECTION (CONSTITUTIONAL GATES)

The following status checks are **required** on `main` branch:

| Check | Scope | Enforcement |
|-------|-------|-------------|
| `🔒 SEAL` | All PRs | Required, admins enforced |
| `typecheck-core` | All PRs | Required |
| `phase83-tools` | All PRs | Required |
| `Accreditation Compat Check` | Accreditation paths only | Required when triggered |
| `Accreditation Oracle Health` | Scheduled weekly | Non-blocking (monitoring) |

### Two-Tier Oracle Model

1. **OS Evidence-Plane Oracle** (golden corpus)
   - Enforcement: `oracle-health.yml` + `GOLDEN_CORPUS.lock.json`
   - Scope: Global governance invariants

2. **County Accreditation Oracle** (reference packet lock)
   - Enforcement: `accreditation-oracle-health.yml` + `ACCREDITATION_REFERENCE.lock.json`
   - Scope: County deployment/accreditation invariants

**Runbook:** See `SUSTAINMENT.md` § "Oracle Workflows: Known Pitfalls & Fixes" for cross-OS hardening patterns.

### Branch Protection Settings (GitHub)

```
main:
  required_status_checks:
    strict: true
    contexts:
      - "🔒 SEAL"
      - "typecheck-core"
      - "phase83-tools"
      - "Accreditation Compat Check (ubuntu-latest)"
      - "Accreditation Compat Check (windows-latest)"
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 1
  restrictions: null
```

## TOOL GOVERNANCE RULES
- ToolRegistry must resolve the manifest path canonically (relative to ToolRegistry) and allow env override only:
  - `TERRAFUSION_TOOL_MANIFEST_PATH`
- ToolRegistry logging must be silent unless:
  - `DEBUG_TOOLREGISTRY=1`
## DEBUGGING WORKFLOWS

### Quick Debug: Trace Lookups
When a tool execution fails, grab the `correlationId` from the error response and query the trace chain:

```bash
# Full request trace (causal chain: tool_invoked → tool_completed/tool_failed)
pnpm run trace:query --correlation <correlationId>

# Recent failures
pnpm run trace:query --recent 10 --type tool_failed

# Tool-specific errors
pnpm run trace:query --tool <toolId> --type tool_failed

# Error classification
pnpm run trace:query --error-code EXECUTION_FAILED

# CLI help
pnpm run trace:query --help
```

**Structured error fields:**
- `errorCode`: Error classification (EXECUTION_FAILED, VALIDATION, etc.)
- `component`: Emitting component (ToolRunner, Handler, ToolRegistry)
- `stackTrace`: Full stack trace for handler errors (tool_failed events only)

### Wave 1 Intake Debugging
When Wave 1 intake operations fail (after unfreeze on 2026-02-21), use these patterns:

```bash
# Nomination rejected → grab correlationId from error response
pnpm run trace:query --correlation <correlationId>

# Recent intake failures (last 10)
pnpm run trace:query --recent 10 --error-code REJECTED_PII
pnpm run trace:query --recent 10 --error-code REJECTED_MISSING_EVIDENCE
pnpm run trace:query --recent 10 --error-code REJECTED_LATE

# All rejections for a specific slot
pnpm run trace:query --component IntakeHandler --type nomination_rejected

# Pre-unfreeze dry-run (validates mechanics without touching Zone A)
node scripts/wave1-dryrun.mjs              # All scenarios
node scripts/wave1-dryrun.mjs good         # Happy path
node scripts/wave1-dryrun.mjs pii          # PII rejection
node scripts/wave1-dryrun.mjs late         # Late submission

# Preflight check (run before 2026-02-21 intake begins)
pwsh scripts/wave1-preflight.ps1
```

**Wave 1 Canonical Error Codes:**
- `REJECTED_PII`: SSN/email/phone detected in title
- `REJECTED_MISSING_EVIDENCE`: Evidence field empty or null
- `REJECTED_LATE`: Submitted after 2026-02-21T23:59:59Z (UTC)
- `REJECTED_INVALID_FORMAT`: Title or evidence format invalid
- `REJECTED_SLOT_CAP`: Slot cap (20) exceeded
- `HANDLER_ERROR`: IntakeHandler crash (includes stackTrace)

### UI Error Debugging (Phase 1: correlationId-First UX)
When users encounter errors in the UI, all errors display with correlationId for trace chain lookup.

**Three Error Sources:**

1. **Backend Errors** (from Pilot API)
   - correlationId prefix: `corr-*` (backend-generated)
   - User sees: ErrorDisplay with correlationId + copy button
   - Debug: `pnpm run trace:query --correlation <correlationId>`
   - Example: `corr-abc123-def456` → backend tool execution failure

2. **Network Errors** (fetch failures, timeouts)
   - correlationId prefix: `net-*` (client-generated)
   - User sees: ErrorDisplay with generated correlationId
   - Debug: Check browser DevTools Network tab + correlationId for timing
   - Example: `net-abc123-def456` → API unreachable, DNS failure

3. **React Errors** (component render crashes)
   - correlationId prefix: `ebnd-*` (ErrorBoundary-generated)
   - User sees: ErrorDisplay with correlationId + Reset button
   - Debug: Browser console has full stack trace + correlationId
   - Example: `ebnd-abc123-def456` → component threw during render

**Visual Error Demo:**
```bash
# Launch dev server with error demo page
pnpm --filter terrafusion-frontend run dev

# Navigate to: http://localhost:5173/error-demo
# Shows 5 error scenarios with correlationId display
```

**Common UI Debug Patterns:**
```bash
# User reports correlationId from UI → lookup trace
pnpm run trace:query --correlation <correlationId>

# Filter by error origin
pnpm run trace:query --correlation net-*     # Network errors
pnpm run trace:query --correlation ebnd-*    # React errors
pnpm run trace:query --correlation corr-*    # Backend errors

# Check recent UI errors (last 10)
pnpm run trace:query --recent 10 --component PilotAPI
pnpm run trace:query --recent 10 --component ErrorBoundary
```

**CorrelationId Flow (UI → Backend):**
- User action → Pilot API call → Backend generates `corr-*`
- Backend returns correlationId in response (success or failure)
- UI displays correlationId in ErrorDisplay component
- Dev mode: Shows trace query command hint
- Production: correlationId visible + copyable, trace hint hidden

**Testing Error Flows:**
```bash
# Run UI error tests
pnpm --filter terrafusion-frontend test ErrorDisplay.test
pnpm --filter terrafusion-frontend test pilotapi-error-normalization.test

# Visual verification
# 1. Start dev server: pnpm run dev (from frontend/)
# 2. Navigate to /error-demo
# 3. Verify correlationId visible + copyable
# 4. Dev mode: Expand "Developer Info" to see trace query hint
```

## COMMIT HYGIENE
- Small commits, one logical change per commit.
- Never fix by exclusion unless the exclusion is policy-backed and documented here.
