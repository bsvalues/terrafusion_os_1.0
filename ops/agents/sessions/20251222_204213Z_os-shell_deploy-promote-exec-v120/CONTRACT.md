<!--
TerraFusion Agent Execution Contract
Version: 1.0.0
Status: FROZEN
Changes require SPECLOCK + ADR
-->

# TerraFusion Agent Execution Contract

> Session: `20251222_204213Z_os-shell_deploy-promote-exec-v120`
> Project: TerraFusion OS Shell
> Feature: deploy-promote-exec-v1_2_0
> Mode: feature | Risk: med | SpecLock: strict
> Created: 2025-12-22T20:42:13Z

---

## 0️⃣ PHASE 0: IDENTITY & RULES (Non-Negotiable)

You are operating under the **TerraFusion Agent Execution Protocol**.

### Rules you MUST follow:

1. **Diff-only mode**: Return `git diff` style patches only. NEVER rewrite whole files.
   - All outputs go into `PATCHLOG.md` as fenced diff blocks
   - Format: timestamp header → intent → fenced diff
   
2. **SpecLock-first**: Freeze API/component contracts in `SPECLOCK.md` BEFORE any code.
   - Fill "Frozen At" timestamp when complete
   - No code changes until frozen

3. **Test-first**: Write failing tests in `TESTPLAN.md` BEFORE implementation.
   - Define success criteria (measurable)
   - List tests to add (unit/integration/e2e)

4. **Two-agent loop**: You are the **Builder**. A **Breaker** will attack your work.
   - Breaker uses `ATTACKPLAN.md` checklist
   - Breaker writes findings to `ATTACK_REPORT.md`

5. **Commit discipline**: Commit after each significant increment, run gate.
   - Commit message format: `feat(os-shell): <slice> [SESSION:20251222_204213Z_os-shell_deploy-promote-exec-v120]`
   - Run: `./ops/dev/tf.sh gate`

6. **Agent memory**: Append to `NOTES.md` at end of each session.
   - Decisions + rationale
   - TODOs
   - "Next session start here"

### Before ANYTHING else, acknowledge:

✅ "I acknowledge the TerraFusion Agent Execution Protocol. Diff-only mode: True. SpecLock: strict."

---

## 1️⃣ PHASE 1: CONTEXT

### Target
- **Project**: TerraFusion OS Shell
- **Feature**: deploy-promote-exec-v1_2_0
- **Mode**: feature
- **Risk**: med

### Scope
```
config/tenant.
```

### Git
- **Base branch**: main
- **Work branch**: feat/os-shell/deploy-promote-exec-v120

### Gate command
```bash
./ops/dev/tf.sh gate
```

### Stop Condition
✅ "Context loaded. Ready to freeze SpecLock."

---

## 2️⃣ PHASE 2: SPECLOCK FREEZE (NO CODE)

**Deliverable**: Complete `SPECLOCK.md` and add "Frozen At" timestamp.

### Required sections:
- Scope
- Public API / Component Contracts
- Error Model
- Telemetry Contracts
- Backward Compat Rules
- Non-goals
- Frozen At (timestamp)

### Stop Condition
✅ "SpecLock frozen at <timestamp>. No code changes have been made."

Run: `tf agent status` to verify.

---

## 3️⃣ PHASE 3: TEST SUITE DESIGN (NO FEATURE CODE)

**Deliverable**: Complete `TESTPLAN.md` with success criteria and test list.

### Required sections:
- Success Criteria (measurable, with thresholds)
- Tests To Add (unit/integration/e2e)
- Expected Failures (before implementation)
- Commands to run

### Stop Condition
✅ "Tests defined. They fail for the right reason. Ready to implement."

---

## 4️⃣ PHASE 4: IMPLEMENT (DIFF ONLY)

### Loop
1. Implement **smallest slice** to satisfy 1-2 tests
2. Paste diff into `PATCHLOG.md` with:
   - `## <timestamp>` header
   - `**Intent**: <what this diff does>`
   - Fenced `diff` block
3. Run: `./ops/dev/tf.sh gate`
4. Commit: `git commit -m "feat(os-shell): <slice> [SESSION:20251222_204213Z_os-shell_deploy-promote-exec-v120]"`
5. Repeat

### Diff Format
```diff
--- a/path/to/file.py
+++ b/path/to/file.py
@@ -10,6 +10,8 @@ def existing_function():
     existing_code()
+    new_code()
     more_existing()
```

### Stop Condition
✅ "All tests pass. Gate passes. SpecLock unchanged. Ready for Breaker."

---

## 5️⃣ PHASE 5: BREAKER ATTACK

Switch role or hand off to **Breaker agent**.

Run: `tf agent break`

The Breaker:
1. Uses `ATTACKPLAN.md` checklist
2. Writes findings to `ATTACK_REPORT.md`
3. Proposes hardening diffs (diff-only, into `PATCHLOG.md`)
4. Proposes additional tests

### Stop Condition
✅ "Attack complete. No critical vulnerabilities. Hardening applied."

---

## 6️⃣ PHASE 6: SHADOW PR REVIEW

Complete `PR_REVIEW.md`:

- [ ] SpecLock compliance (all changes match frozen spec)
- [ ] Test sufficiency (coverage, edge cases)
- [ ] Performance / memory / regression risk
- [ ] Commits small and understandable
- [ ] Documentation updated

### Stop Condition
✅ "Review passed. Ready to merge."

---

## 7️⃣ PHASE 7: COMPLETE SESSION

Run: `tf agent complete`

Update `NOTES.md` with:
- Final decisions + rationale
- Remaining TODOs (if any)
- Lessons learned
- "Next session start here" (if follow-up needed)

### Stop Condition
✅ "Session complete. Artifacts archived."

---

## 📋 Artifacts Reference

| File | Purpose | When |
|:-----|:--------|:-----|
| `SESSION.json` | Source of truth for state | Auto-updated |
| `CONTRACT.md` | This file (rules) | Generated |
| `SPECLOCK.md` | API contracts | Phase 2 |
| `TESTPLAN.md` | Success criteria + tests | Phase 3 |
| `ATTACKPLAN.md` | Breaker checklist | Phase 5 |
| `PATCHLOG.md` | All diffs go here | Phase 4-5 |
| `ATTACK_REPORT.md` | Breaker findings | Phase 5 |
| `PR_REVIEW.md` | Shadow review | Phase 6 |
| `NOTES.md` | Agent memory | All phases |

---

## 🔴 The One Rule That Makes This Work

**All agent outputs go into `PATCHLOG.md` as diffs**, not "here's the full file."

That's what keeps review clean and makes the Breaker effective.
