# Zone B Sprint Plan: Active Development

**Created:** 2026-02-04  
**Sprint Duration:** 7-10 days (through 2026-02-14)  
**Wave 1 Status:** Frozen until 2026-02-21 (17 days remaining)

---

## Zone Map

### Zone A - FROZEN (Do Not Touch)
| Path | Lock Reason | Expires |
|------|-------------|---------|
| `docs/ops/WAVE_1_*.md` | Intake integrity | 2026-02-25 |
| `docs/ops/templates/WAVE_1_*.md` | Template seal @ `7c5853e92` | 2026-02-25 |

### Zone B - OPEN (Active Development)
Everything else. Specifically:

| Area | Priority | Notes |
|------|----------|-------|
| `os-platform/core/**` | HIGH | Governance surface, allowed in AGENTS.md |
| `tools/registry/**` | HIGH | Allowed in AGENTS.md |
| `ops/**` | MEDIUM | Dev tooling, CI improvements |
| `backend/**` | MEDIUM | Reliability & telemetry |
| `.github/workflows/**` | MEDIUM | Gate wiring only per AGENTS.md |
| `frontend/apps/**` | MEDIUM | Non-legacy frontend (os-shell, terraforge) |

---

## Sprint Deliverables

### Deliverable 1: Developer Velocity (CI Time + Ergonomics) ✅ COMPLETE
**Done When:** SEAL gate runs in < 5 minutes, local dev loop < 30s

| Task | Metric | Status |
|------|--------|--------|
| Audit SEAL gate timing | Baseline current runtime | [x] |
| Identify slowest step | Log step durations | [x] |
| Cache optimization | pnpm/dotnet cache hits | DEFERRED* |
| Local preflight script | < 30s full check | [x] |

**Status:** ✅ COMPLETE - Local 3.11s, CI docs-only 123s (both well under target)  
**Evidence:** [DEVELOPER_VELOCITY_BASELINE_COMPLETE.md](DEVELOPER_VELOCITY_BASELINE_COMPLETE.md)  
*Optimization deferred until full CI path measured with code changes

**Test Command:**
```powershell
# Local gate check (PASSED: 3.11s vs 30s target)
pnpm run type-check && node --test os-platform/core/tests/phase83-tools.test.mjs
```

---

### Deliverable 2: Reliability (Startup Health + Config Validation) ✅ COMPLETE
**Done When:** `pnpm run doctor` exists and passes with clear output

| Task | Metric | Status |
|------|--------|--------|
| Create `scripts/doctor.mjs` | Health checker script | [x] |
| Validate env config on startup | No silent failures | [x] |
| Add startup gate to SEAL | Deterministic build check | OPTIONAL* |
| Document known-good config | `.env.example` complete | OPTIONAL* |

**Status:** ✅ COMPLETE - 5 checks, 10 tests, 223ms runtime  
**Evidence:** [RELIABILITY_LANE_COMPLETE.md](RELIABILITY_LANE_COMPLETE.md)  
*SEAL gate integration and env docs are optional enhancements, not blockers

**Test Command:**
```powershell
# Doctor check (PASSED: 5/5 checks in 223ms)
pnpm run doctor
```

---

### Deliverable 3: Telemetry Foundation (Observability for "what broke?") ✅ COMPLETE
**Done When:** Error traces are queryable within 5 minutes of failure

| Task | Metric | Status |
|------|--------|--------|
| Audit existing trace setup | Inventory telemetry endpoints | [x] |
| Add structured error logging | JSON format, actionable | [x] |
| Create error dashboard | Minimal viable CLI query tool | [x] |
| Document "how to debug" | Runbook for error queries | [x] |

**Status:** ✅ COMPLETE - Error traces queryable <100ms, 10/10 tests pass  
**Evidence:** [TELEMETRY_LANE_COMPLETE.md](TELEMETRY_LANE_COMPLETE.md)  
**Features:** errorCode, component, stackTrace fields; correlation ID pivoting; pnpm run trace:query

**Test Command:**
```powershell
# Error trace tests (PASSED: 10/10 in 76ms)
node --test os-platform/core/tests/error-trace-ergonomics.test.mjs

# Query CLI usage
pnpm run trace:query --help
pnpm run trace:query --recent 10
pnpm run trace:query --error-code EXECUTION_FAILED
```

---

## Definition of Done (per deliverable)

- [ ] All tests pass: `pnpm run type-check`
- [ ] All tests pass: `node --test os-platform/core/tests/phase83-tools.test.mjs`
- [ ] No Zone A paths touched (confirm with `git diff --name-only | grep -E '^docs/ops/WAVE_1'` returns empty)
- [ ] CI green on push

---

## Guard Verification Commands

### Verify Zone A is protected (expect BLOCK):
```powershell
# Simulate touching a frozen path (DO NOT COMMIT - just verify guard)
echo "test" >> docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md
git add docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md
pwsh -File scripts/wave1-freeze-guard.ps1
# Expected: ❌ WAVE 1 TEMPLATE FREEZE ACTIVE
git restore docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md
git reset docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md
```

### Verify Zone B is open (expect PASS):
```powershell
# Any Zone B file should pass guards
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
# Expected: ✅ All pass
```

---

## Reference

- **AGENTS.md:** Core governance rules
- **Wave 1 Preflight:** `pwsh -File scripts/wave1-preflight.ps1`
- **SEAL Gate:** `.github/workflows/seal-gate-fast.yml`
- **Freeze Guard:** `.github/workflows/wave1-freeze-guard.yml`

---

## Session Tracking

| Date | Focus | Outcome |
|------|-------|---------|
| 2026-02-04 | Sprint planning & zone verification | Zones confirmed, plan created |
| | | |
| | | |

---

*Government. Transcended.*
