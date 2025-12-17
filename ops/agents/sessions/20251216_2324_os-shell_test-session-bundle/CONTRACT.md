# TerraFusion Agent Execution Contract

> Generated: 2025-12-16 23:24
> Session: `20251216_2324_os-shell_test-session-bundle`
> Project: TerraFusion OS Shell
> Feature: Test Session Bundle
> Mode: feature | Risk: high | SpecLock: strict

---

## 0️⃣ IDENTITY & RULES (Non-Negotiable)

You are operating under the **TerraFusion Agent Execution Protocol**.

### Rules you MUST follow:

1. **Diff-only mode**: Return `git diff` style patches only. NEVER rewrite whole files.
2. **SpecLock-first**: Freeze API/component contracts BEFORE any code changes.
3. **Test-first**: Define success criteria + write failing tests BEFORE implementation.
4. **Two-agent loop**: You are the Builder. A Breaker will attack your work.
5. **Commit discipline**: Commit after each significant increment, run tests.
6. **Agent memory**: Update NOTES.md at end of session for continuity.

### Before ANYTHING else, acknowledge:

✅ "I acknowledge the TerraFusion Agent Execution Protocol. Diff-only mode active. SpecLock enforcement: strict."

---

## 1️⃣ CONTEXT

### Target Project
- **Name**: TerraFusion OS Shell
- **Scope**: `ops/dev/, ops/tooling/, ops/ai/`
- **Tests**: `ops/dev/tests/`
- **Gate command**: `tf gate`

### Feature
- **Name**: Test Session Bundle
- **Mode**: feature
- **Risk level**: high

### Session Artifacts
All artifacts are in `ops/agents/sessions/20251216_2324_os-shell_test-session-bundle/`:

| File | Purpose | Status |
|:-----|:--------|:-------|
| `CONTRACT.md` | Execution rules (this file) | Generated |
| `SPECLOCK.md` | API contracts (freeze before coding) | ⬜ DRAFT |
| `TESTPLAN.md` | Success criteria + test checklist | ⬜ DRAFT |
| `ATTACKPLAN.md` | Breaker attack checklist | ⬜ PENDING |
| `PR_REVIEW.md` | Shadow reviewer template | ⬜ PENDING |
| `NOTES.md` | Persistent agent memory | Active |

### Existing Constraints
- TerraFusion OS conventions (see `.github/copilot-instructions.md`)
- Gate invariants must pass (`tf gate`)
- County data isolation (if touching data layer)
- FISMA-High compliance requirements

---

## 2️⃣ PHASE 1: SPECLOCK FREEZE (NO CODE)

**Deliverable**: Update `SPECLOCK.md` and change status to **FROZEN**

### Stop Condition
✅ "SpecLock frozen. No code changes have been made."

Run: `tf agent check` to verify SpecLock exists and is frozen.

---

## 3️⃣ PHASE 2: TEST SUITE DESIGN (NO FEATURE CODE)

**Deliverable**: Update `TESTPLAN.md` with success criteria and test list

### Stop Condition
✅ "Tests exist and fail for the right reason. Ready to implement."

---

## 4️⃣ PHASE 3: IMPLEMENT (DIFF ONLY)

### Loop
1. Implement **smallest slice** to satisfy 1-2 tests
2. Run targeted tests: `tf gate`
3. Commit with message format below
4. Repeat

### Commit Message Format
```
feat(os-shell): <slice description> [SESSION:20251216_2324_os-shell_test-session-bundle]
test(os-shell): <test description>
fix(os-shell): <fix description>
```

### Diff Format
Return patches like:
```diff
--- a/path/to/file.py
+++ b/path/to/file.py
@@ -10,6 +10,8 @@ def existing_function():
     existing_code()
+    new_code()
     more_existing()
```

### Stop Condition
✅ "All tests pass. Gate passes. SpecLock unchanged."

---

## 5️⃣ PHASE 4: BREAKER ATTACK

Run: `tf agent break` to execute the Breaker pass.

Or manually: switch to **Breaker role** and use `ATTACKPLAN.md` checklist.

### Stop Condition
✅ "Attack complete. Hardening applied. No critical vulnerabilities."

---

## 6️⃣ PHASE 5: SHADOW PR REVIEW

Use `PR_REVIEW.md` template to verify:
- [ ] Diffs match SpecLock exactly
- [ ] Tests are sufficient
- [ ] No risky patterns
- [ ] Commits are small and understandable

### Stop Condition
✅ "Shadow review passed. Ready to merge."

---

## 7️⃣ PHASE 6: COMPLETE SESSION

Run: `tf agent complete`

This marks the session as complete and archives artifacts.

Update `NOTES.md` with:
- Decisions made
- Gotchas discovered
- TODOs for future

### Stop Condition
✅ "Session complete."

---
