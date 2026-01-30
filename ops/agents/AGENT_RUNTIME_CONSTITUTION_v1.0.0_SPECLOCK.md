# SpecLock: Agent Runtime Constitution v1.0.0

**Status:** DRAFT (Pending Implementation)  
**Supersedes:** Current ad-hoc agent execution  
**Requires:** Gate Constitution v1.0.0 (SEALED)

---

## Scope

Applies to all agent execution entrypoints in `tf.sh cmd_agent()`:

- `tf agent run --project <p> --feature <f> [options]`
- `tf agent break [--session <id>]`
- `tf agent complete [--session <id>]`
- `tf agent status`
- `tf agent check`
- Future agent execution wrappers

---

## Constitutional Invariants (Non-Negotiable)

### 1. Gate-First Execution

**Contract:**
- `tf agent run` MUST execute `cmd_gate` and require exit=0 BEFORE any session creation
- If gate returns non-zero, agent execution MUST NOT proceed
- Gate enforcement happens BEFORE any filesystem writes (session folders, artifacts)

**Current Implementation Status:**
```bash
# Line 1619-1624 in tf.sh
if ! cmd_gate >/dev/null 2>&1; then
    log_error "Gate failed - fix issues before starting agent session"
    echo "  Run: tf gate"
    return 1
fi
```
✅ **IMPLEMENTED** - Gate-first contract already enforced

**Test Requirements:**
- Simulate gate failure → agent refuses, exit 1
- Gate pass → agent proceeds to session creation
- No session artifacts created on gate failure

---

### 2. Session State Machine Integrity

**Contract:**
States MUST follow this deterministic graph:
```
created → active → complete  (success path)
created → active → failed    (failure path)
created → active → aborted   (user abort)
```

**Invariants:**
- Only ONE active session per repository at a time
- Session transitions are irreversible (no `complete → active`)
- Session status stored in immutable `session.json`

**Current Implementation Status:**
- ✅ Session creation via `generate-contract.py run`
- ✅ Active session tracking via `ops/agents/ACTIVE_SESSION`
- ⚠️  State transitions enforced by Python script (not bash-level validated)
- ❌ **MISSING:** Concurrent session prevention in `cmd_agent run`

**Test Requirements:**
- Attempt second `tf agent run` while session active → refuse, exit 1
- `complete` transitions status → verify `session.json` updated
- Cannot reverse state transitions

---

### 3. Protected Scope Enforcement

**Contract:**
- If uncommitted changes touch protected scopes (defined by gate check 11), an active session MUST exist
- Protected scopes (from gate):
  ```
  ops/ai/ ops/dev/ backend/ frontend/ SDK/ config/tenant.*
  ```
- Agent must NOT proceed if protected changes exist without session

**Current Implementation Status:**
- ✅ Gate check 11 detects protected scope changes
- ⚠️  Gate allows with WARN (doesn't block)
- ❌ **MISSING:** Agent-level enforcement (refuse if WARN on check 11)

**Test Requirements:**
- Modify `ops/dev/` file, no session → `tf agent run` refuses
- Active session exists → proceeds
- Non-protected changes (e.g., docs/) → proceeds without session

---

### 4. Immutable Audit Trail

**Contract:**
Every agent session MUST produce immutable artifacts:
- `session.json` - Session metadata + status
- `CONTRACT.md` - Agent execution contract
- `SPECLOCK.md` - Specification lock
- `TESTPLAN.md` - Test plan (written BEFORE code)
- `ATTACKPLAN.md` - Breaker attack vectors
- `PATCHLOG.md` - Evidence chain (commit hashes)
- `ATTACK_REPORT.md` - Breaker results (post-execution)
- `NOTES.md` - Session notes

**Storage Contract:**
```
ops/agents/sessions/<UTC_TIMESTAMP>_<project>_<feature-slug>/
  session.json
  CONTRACT.md
  SPECLOCK.md
  TESTPLAN.md
  ... (other artifacts)
```

**Current Implementation Status:**
✅ **IMPLEMENTED** - `generate-contract.py` creates all artifacts

**Test Requirements:**
- After `tf agent run`, all required files exist
- `PATCHLOG.md` references real commit hashes
- Artifacts are read-only after completion (enforce via test)

---

### 5. Exit Code Contract

**Contract:**
```
0 = success (gate passed, session created/completed successfully)
1 = failure (gate fail, session error, invariant violated)
2 = invalid invocation (missing required args, invalid flags)
```

**Current Implementation Status:**
- ✅ Exit 1 on missing `--project` or `--feature` (line 1604)
- ✅ Exit 1 on gate failure (line 1621)
- ❌ **MISSING:** Exit 2 for invalid flag combinations

**Test Requirements:**
- Missing `--project` → exit 1 (currently), should be 2 per constitution
- Gate fail → exit 1 ✓
- Invalid `--mode` value → exit 2

---

## Command Surface (Current Implementation)

### `tf agent run`

**Required:**
- `--project=<p>` or `-p <p>`
- `--feature=<f>` or `-f <f>`

**Optional:**
- `--mode=feature|bugfix|refactor|hardening` (default: feature)
- `--risk=low|med|high` (default: med)
- `--scope=<paths>` (override default project scope)
- `--tests=unit|integration|e2e|all` (default: all)
- `--speclock=strict|advisory|off` (default: strict)
- `--logs=<path>` (enable log-first debugging)
- `--print` (print contract only, no session creation)

**Valid Projects:**
`os-shell`, `api-gateway`, `ai-lab`, `consciousness`, `terrabuild`, `sdk`

---

### `tf agent break`

**Current Behavior:**
- Runs breaker mode on active or specified session
- Generates `ATTACKPLAN.md` and `ATTACK_REPORT.md`

**Constitutional Requirements:**
- MUST require active session or valid `--session <id>`
- MUST NOT execute if no session context

---

### `tf agent complete`

**Current Behavior:**
- Marks session as complete
- Updates `session.json` status

**Constitutional Requirements:**
- MUST verify session artifacts exist before marking complete
- MUST be idempotent (running twice doesn't error)

---

### `tf agent status`

**Current Behavior:**
- Shows active session info

**Constitutional Requirements:**
- Exit 0 if no session (not an error)
- JSON output in machine mode (future)

---

### `tf agent check`

**Current Behavior:**
- Validates session health (stale detection)

**Constitutional Requirements:**
- Report stale sessions (>24h active)
- Suggest cleanup actions

---

## Flag Validation Requirements

### Invalid Combinations (Exit 2)

**Not currently enforced:**
- `--mode=invalid-value`
- `--risk=invalid-value`
- `--tests=invalid-value`
- `--speclock=invalid-value`

**Constitutional Requirement:**
All flag values MUST be validated against enums. Invalid values → exit 2 with clear error.

---

## Machine Mode (CI) Contract

**Status:** NOT IMPLEMENTED

**Constitutional Requirement:**
If `--ci` flag is added in future:
- `tf agent run --ci` → JSON output to stdout only
- No ANSI codes, no human text
- JSON schema: `{status, session_id, artifacts:[], error?}`
- Invalid `--ci` combinations (e.g., `--print --ci`) → exit 2, JSON error

**Defer to future amendment** - not required for v1.0.0

---

## Implementation Gaps (Must Fix for Constitutional Compliance)

### HIGH PRIORITY

1. **Concurrent session prevention**
   - Check `ACTIVE_SESSION` before creating new session
   - Exit 1 with clear error if active session exists

2. **Protected scope enforcement**
   - Parse gate output for check 11 WARN status
   - If protected changes + no session → refuse (exit 1)

3. **Exit code alignment**
   - Missing required args → exit 2 (not 1)
   - Invalid flag values → exit 2 (not 1)

### MEDIUM PRIORITY

4. **Flag value validation**
   - Enum checks for `--mode`, `--risk`, `--tests`, `--speclock`
   - Clear error messages on invalid values

5. **Artifact immutability**
   - Set artifacts to read-only after session complete
   - Test enforcement (not just documentation)

### LOW PRIORITY (Deferred)

6. **CI mode** - Not required for v1.0.0
7. **Machine-parseable output** - Human mode sufficient for now

---

## Compatibility with Gate Constitution

**Gate Constitution (SEALED) provides:**
- ✅ Deterministic exit codes (0/1/2)
- ✅ Human vs machine output separation pattern
- ✅ Flag validation precedent (`--ci --full` rejection)
- ✅ Timeout enforcement pattern

**Agent Constitution MUST:**
- ✅ Reuse same exit code contract
- ✅ Follow same flag validation pattern
- ✅ Align with gate-first principle
- ✅ Maintain immutability guarantees

---

## Test Plan Reference

See: `ops/dev/tests/test_agent_governance.sh` (to be created)

**Test coverage required:**
- Invocation validity (exit 2 on invalid args/flags)
- Gate-first enforcement (exit 1 on gate fail)
- Protected scope enforcement (exit 1 without session)
- Concurrent session prevention (exit 1 if active exists)
- State machine integrity (status transitions)
- Artifact immutability (files created, read-only after complete)

---

## Version History

- **v1.0.0** (DRAFT) - Initial constitutional definition
- Requires implementation commits before SEAL
- Tag: `v1.0.0-agent-constitution` (after implementation + tests pass)

---

**This SpecLock is constitutional infrastructure.**
Changes require SpecLock amendment + RFC + breaker approval.
