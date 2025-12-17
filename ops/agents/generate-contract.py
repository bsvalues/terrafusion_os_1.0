#!/usr/bin/env python3
"""
TerraFusion Agent Session Artifact Bundle Generator

Creates deterministic, auditable session bundles for AI coding agents.
Usable across Claude / Claude Code / Codex / Copilot.

Directory Contract:
  ops/agents/sessions/<UTC_TIMESTAMP>_<project>_<feature-slug>/
    SESSION.json, CONTRACT.md, SPECLOCK.md, TESTPLAN.md,
    ATTACKPLAN.md, PATCHLOG.md, ATTACK_REPORT.md, PR_REVIEW.md, NOTES.md
"""

import argparse
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "ops" / "agents"
SESSIONS_DIR = AGENTS_DIR / "sessions"
ACTIVE_SESSION_FILE = AGENTS_DIR / "ACTIVE_SESSION"

# Project definitions
PROJECTS = {
    "os-shell": {
        "name": "TerraFusion OS Shell",
        "scope": ["ops/dev/**", "ops/tooling/**", "ops/ai/**"],
        "gate": "tf gate",
    },
    "api-gateway": {
        "name": "API Gateway",
        "scope": ["backend/TerraFusion.Gateway/**", "backend/TerraFusion.API/**"],
        "gate": "tf gate --full",
    },
    "ai-lab": {
        "name": "AI Lab",
        "scope": ["ops/ai/**"],
        "gate": "tf ai status && tf gate",
    },
    "consciousness": {
        "name": "Consciousness Engine",
        "scope": ["backend/TerraFusion.Consciousness/**"],
        "gate": "tf gate --full",
    },
    "terrabuild": {
        "name": "TerraBuild Modernization",
        "scope": ["terrabuild-modernization/**"],
        "gate": "npm test",
    },
    "sdk": {
        "name": "TerraFusion SDK",
        "scope": ["SDK/**"],
        "gate": "tf gate",
    },
}

STALE_THRESHOLD_HOURS = 24


def slugify(text: str, max_len: int = 48) -> str:
    """Convert text to safe filesystem slug (lower-kebab, max 48 chars)."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug[:max_len]


def utc_timestamp() -> str:
    """Generate UTC timestamp in format YYYYMMDD_HHMMSSZ."""
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%SZ")


def utc_iso() -> str:
    """Generate UTC ISO timestamp."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_git_branch() -> str:
    """Get current git branch."""
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "branch", "--show-current"],
            capture_output=True, text=True
        )
        return result.stdout.strip() or "main"
    except:
        return "main"


# =============================================================================
# Artifact Generators
# =============================================================================

def generate_session_json(
    session_id: str,
    project: str,
    feature: str,
    feature_slug: str,
    mode: str,
    risk: str,
    tests: str,
    speclock: str,
    diff_only: bool,
    scope: list,
    branch: str,
) -> dict:
    """Generate SESSION.json (source of truth for session state)."""
    now = utc_iso()
    proj = PROJECTS.get(project, {"name": project, "scope": [f"{project}/**"]})
    
    return {
        "version": 1,
        "id": session_id,
        "status": "active",
        "createdUtc": now,
        "updatedUtc": now,
        "project": project,
        "feature": feature,
        "featureSlug": feature_slug,
        "mode": mode,
        "risk": risk,
        "diffOnly": diff_only,
        "specLock": speclock,
        "tests": tests,
        "scope": scope or proj["scope"],
        "agents": {
            "builder": "Agent A",
            "breaker": "Agent B"
        },
        "git": {
            "baseBranch": "main",
            "workBranch": branch or f"feat/{project}/{feature_slug}"
        },
        "artifacts": {
            "contract": "CONTRACT.md",
            "speclock": "SPECLOCK.md",
            "testplan": "TESTPLAN.md",
            "attackplan": "ATTACKPLAN.md",
            "patchlog": "PATCHLOG.md",
            "attackReport": "ATTACK_REPORT.md",
            "prReview": "PR_REVIEW.md",
            "notes": "NOTES.md"
        }
    }


CONTRACT_VERSION = "1.0.0"


def generate_contract(session: dict) -> str:
    """Generate CONTRACT.md (7-phase protocol, never hand-edited)."""
    proj = PROJECTS.get(session["project"], {"name": session["project"], "gate": "tf gate"})
    
    return f"""<!--
TerraFusion Agent Execution Contract
Version: {CONTRACT_VERSION}
Status: FROZEN
Changes require SPECLOCK + ADR
-->

# TerraFusion Agent Execution Contract

> Session: `{session['id']}`
> Project: {proj['name']}
> Feature: {session['feature']}
> Mode: {session['mode']} | Risk: {session['risk']} | SpecLock: {session['specLock']}
> Created: {session['createdUtc']}

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
   - Commit message format: `feat({session['project']}): <slice> [SESSION:{session['id']}]`
   - Run: `{proj['gate']}`

6. **Agent memory**: Append to `NOTES.md` at end of each session.
   - Decisions + rationale
   - TODOs
   - "Next session start here"

### Before ANYTHING else, acknowledge:

✅ "I acknowledge the TerraFusion Agent Execution Protocol. Diff-only mode: {session['diffOnly']}. SpecLock: {session['specLock']}."

---

## 1️⃣ PHASE 1: CONTEXT

### Target
- **Project**: {proj['name']}
- **Feature**: {session['feature']}
- **Mode**: {session['mode']}
- **Risk**: {session['risk']}

### Scope
```
{chr(10).join(session['scope'])}
```

### Git
- **Base branch**: {session['git']['baseBranch']}
- **Work branch**: {session['git']['workBranch']}

### Gate command
```bash
{proj['gate']}
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
3. Run: `{proj['gate']}`
4. Commit: `git commit -m "feat({session['project']}): <slice> [SESSION:{session['id']}]"`
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
"""


def generate_speclock(session: dict) -> str:
    """Generate SPECLOCK.md (stub with headings; frozen before coding)."""
    return f"""# SpecLock: {session['feature']}

> Session: `{session['id']}`
> Status: **DRAFT** (must freeze before coding)

---

## Scope

<!-- Define exact files/modules in scope -->

```
{chr(10).join(session['scope'])}
```

---

## Public API / Component Contracts

### Routes / Endpoints
<!-- List all new or modified endpoints -->

| Method | Path | Request | Response | Auth |
|:-------|:-----|:--------|:---------|:-----|
| | | | | |

### CLI Commands / Flags
<!-- New command-line options -->

| Command | Flag | Type | Default | Description |
|:--------|:-----|:-----|:--------|:------------|
| | | | | |

### Component Props (if UI)
<!-- Component interface -->

| Prop | Type | Required | Description |
|:-----|:-----|:---------|:------------|
| | | | |

### Events Emitted
<!-- Events the component emits -->

| Event | Payload | When |
|:------|:--------|:-----|
| | | |

---

## Error Model

| Code | Status | Message | When |
|:-----|:-------|:--------|:-----|
| | | | |

---

## Telemetry Contracts

### Metrics
<!-- Metrics to emit -->

| Metric | Type | Labels | Description |
|:-------|:-----|:-------|:------------|
| | | | |

### Log Events
<!-- Structured log events -->

| Event | Level | Fields | When |
|:------|:------|:-------|:-----|
| | | | |

### Trace Spans
<!-- Distributed tracing spans -->

| Span | Parent | Attributes |
|:-----|:-------|:-----------|
| | | |

---

## Backward Compat Rules

- **Breaking changes**: NONE
<!-- Or list them with migration path -->

---

## Non-goals

<!-- What this feature explicitly does NOT do -->

- 

---

## Frozen At

<!-- Add timestamp when freezing -->

**Status**: DRAFT

**Frozen At**: _not frozen_

**Frozen By**: _agent name_

---

### Freeze Checklist

Before marking FROZEN:
- [ ] All API surfaces documented
- [ ] Error cases enumerated
- [ ] Telemetry contracts defined
- [ ] Breaking changes assessed
- [ ] Non-goals documented

**To freeze**: Change status to FROZEN and add UTC timestamp.
"""


def generate_testplan(session: dict) -> str:
    """Generate TESTPLAN.md (success criteria + tests-first list)."""
    proj = PROJECTS.get(session["project"], {"gate": "tf gate"})
    return f"""# Test Plan: {session['feature']}

> Session: `{session['id']}`
> Status: **DRAFT**

---

## Success Criteria (Measurable)

<!-- Define measurable outcomes with thresholds -->

| Criterion | Metric | Target | Measurement |
|:----------|:-------|:-------|:------------|
| | | | |

### Must Have
- [ ] Criterion 1: ...
- [ ] Criterion 2: ...
- [ ] Criterion 3: ...

### Should Have
- [ ] ...

### Nice to Have
- [ ] ...

---

## Tests To Add

### Unit Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| | | | ⬜ |

### Integration Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| | | | ⬜ |

### E2E Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| | | | ⬜ |

---

## Expected Failures (Before Implementation)

<!-- Tests that should fail before you write the feature code -->

| Test | Expected Error | Why |
|:-----|:---------------|:----|
| | | |

---

## Commands

```bash
# Run gate
{proj['gate']}

# Run specific tests
# pytest path/to/test.py -k "test_name"
# dotnet test --filter "FullyQualifiedName~TestName"
# pnpm test -- --grep "test name"
```

---

## Status Legend

- ⬜ Not started
- 🟡 In progress
- ❌ Failing (expected)
- ✅ Passing
- 🟢 Was failing → now passing
"""


def generate_attackplan(session: dict) -> str:
    """Generate ATTACKPLAN.md (Breaker checklist)."""
    return f"""# Attack Plan: {session['feature']}

> Session: `{session['id']}`
> Risk Level: **{session['risk'].upper()}**
> Status: **PENDING**

---

## Breaker Objectives

Your job is to **BREAK** what the Builder created.
Write findings to `ATTACK_REPORT.md`.
Propose hardening diffs in `PATCHLOG.md`.

---

## Attack Vectors

### 1. Race / Concurrency / Ordering

- [ ] Parallel requests handled correctly?
- [ ] State mutations atomic?
- [ ] Deadlock potential?
- [ ] Event ordering guaranteed?
- [ ] Idempotency on retry?

### 2. Security Boundaries

- [ ] AuthZ boundaries respected?
- [ ] Input injection risks (SQL, command, path)?
- [ ] Secrets not leaked in logs/errors?
- [ ] SSRF / external request validation?
- [ ] Rate limiting in place?
- [ ] CORS / CSP configured?

### 3. Input Fuzz Vectors

- [ ] Empty input
- [ ] Null / undefined / missing
- [ ] Maximum size / overflow
- [ ] Malformed data
- [ ] Unicode / special characters
- [ ] Boundary values (0, -1, MAX_INT)
- [ ] Deeply nested structures

### 4. Negative Tests to Add

<!-- Tests that should fail / reject bad input -->

| Scenario | Expected Behavior | Test Added |
|:---------|:------------------|:-----------|
| | | ⬜ |

### 5. Observability Validation

- [ ] Errors logged with context?
- [ ] Metrics emitted correctly?
- [ ] Trace spans have correct parent?
- [ ] No PII in logs?
- [ ] Health checks updated?

---

## Attack Results

Record findings in `ATTACK_REPORT.md`.

---

## Breaker Sign-off

- [ ] All {session['risk'].upper()} risk vectors checked
- [ ] Critical issues fixed
- [ ] Hardening diffs proposed
- [ ] Tests added for discovered issues
- [ ] No known vulnerabilities remaining

**Breaker**: _agent name_
**Date**: _timestamp_
"""


def generate_patchlog(session: dict) -> str:
    """Generate PATCHLOG.md (diff-only inbox)."""
    return f"""# Patch Log: {session['feature']}

> Session: `{session['id']}`
> All agent outputs go here as diffs.

---

## Format

Each entry:

```
## YYYY-MM-DD HH:MM:SS UTC

**Intent**: What this diff accomplishes

**Files**: path/to/file.ext

```diff
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@ -10,6 +10,8 @@ context
 existing line
+new line
 existing line
```

**Committed**: <commit hash> or "pending"
```

---

## Patches

<!-- Append diffs below this line -->

"""


def generate_attack_report(session: dict) -> str:
    """Generate ATTACK_REPORT.md (Breaker output)."""
    return f"""# Attack Report: {session['feature']}

> Session: `{session['id']}`
> Status: **PENDING**

---

## Summary

<!-- Overall assessment -->

| Severity | Count |
|:---------|:------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

---

## Findings

### Finding 1: [Title]

**Severity**: Critical / High / Medium / Low

**Vector**: (from ATTACKPLAN.md)

**Description**:

**Repro Steps**:
1. 
2. 
3. 

**Proposed Fix** (diff-only, add to PATCHLOG.md):

**Proposed Test**:

---

## Proposed Tests

| Test Name | File | Covers Finding |
|:----------|:-----|:---------------|
| | | |

---

## Risk Rating

**Overall Risk**: LOW / MEDIUM / HIGH / CRITICAL

**Recommendation**: APPROVE / BLOCK / APPROVE WITH FIXES

---

## Breaker Sign-off

**Breaker**: _agent name_
**Date**: _timestamp_
**Verdict**: _approve / block_
"""


def generate_pr_review(session: dict) -> str:
    """Generate PR_REVIEW.md (Shadow reviewer)."""
    return f"""# PR Review: {session['feature']}

> Session: `{session['id']}`
> Status: **PENDING**

---

## Review Checklist

### SpecLock Compliance

- [ ] All changes match SPECLOCK.md
- [ ] No undocumented API changes
- [ ] Breaking changes documented (if any)
- [ ] Error model implemented as specified
- [ ] Telemetry contracts implemented

### Test Sufficiency

- [ ] Success criteria met (from TESTPLAN.md)
- [ ] Unit tests for new code
- [ ] Integration tests for workflows
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Negative tests from Breaker added

### Performance / Memory / Regression Risk

- [ ] No obvious N+1 patterns
- [ ] Memory usage reasonable
- [ ] No blocking operations in hot paths
- [ ] No regressions to existing tests
- [ ] No new dependencies without justification

### Code Quality

- [ ] Diff-only (no full file rewrites)
- [ ] Commits small and understandable
- [ ] Commit messages follow convention
- [ ] No hardcoded secrets
- [ ] Error handling complete
- [ ] Logging appropriate

### Documentation

- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] NOTES.md updated with decisions

---

## Diff Summary

| File | Lines +/- | Risk | Notes |
|:-----|:----------|:-----|:------|
| | | | |

---

## Review Notes

<!-- Add comments here -->

---

## Decision

- [ ] **APPROVE** - Ready to merge
- [ ] **REQUEST CHANGES** - See notes above

**Reviewer**: _agent name_
**Date**: _timestamp_
"""


def generate_notes(session: dict) -> str:
    """Generate NOTES.md (persistent continuity log, append-only)."""
    return f"""# Agent Notes: {session['feature']}

> Session: `{session['id']}`
> Last Updated: {session['createdUtc']}

---

## Session Log

### {datetime.now(timezone.utc).strftime("%Y-%m-%d")}

#### Decisions + Rationale

<!-- Document key decisions and why -->

#### TODOs

- [ ] ...

#### Command Transcript

```bash
# Useful commands used
tf agent status
{PROJECTS.get(session['project'], {}).get('gate', 'tf gate')}
```

#### Next Session Start Here

<!-- Starting point for next session -->

---

## Continuity Notes

<!-- Append-only: add new entries, don't delete old ones -->

"""


# =============================================================================
# Session Management
# =============================================================================

def create_session(
    project: str,
    feature: str,
    mode: str = "feature",
    risk: str = "med",
    tests: str = "all",
    speclock: str = "strict",
    diff_only: bool = True,
    scope: list = None,
    branch: str = None,
) -> Path:
    """Create a new agent session with full artifact bundle."""
    
    # Generate deterministic session ID
    ts = utc_timestamp()
    feature_slug = slugify(feature)
    session_id = f"{ts}_{project}_{feature_slug}"
    session_dir = SESSIONS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate SESSION.json
    session = generate_session_json(
        session_id=session_id,
        project=project,
        feature=feature,
        feature_slug=feature_slug,
        mode=mode,
        risk=risk,
        tests=tests,
        speclock=speclock,
        diff_only=diff_only,
        scope=scope,
        branch=branch,
    )
    
    # Write all artifacts
    (session_dir / "SESSION.json").write_text(json.dumps(session, indent=2))
    (session_dir / "CONTRACT.md").write_text(generate_contract(session))
    (session_dir / "SPECLOCK.md").write_text(generate_speclock(session))
    (session_dir / "TESTPLAN.md").write_text(generate_testplan(session))
    (session_dir / "ATTACKPLAN.md").write_text(generate_attackplan(session))
    (session_dir / "PATCHLOG.md").write_text(generate_patchlog(session))
    (session_dir / "ATTACK_REPORT.md").write_text(generate_attack_report(session))
    (session_dir / "PR_REVIEW.md").write_text(generate_pr_review(session))
    (session_dir / "NOTES.md").write_text(generate_notes(session))
    
    # Update ACTIVE_SESSION pointer
    ACTIVE_SESSION_FILE.write_text(session_id)
    
    return session_dir


def get_active_session() -> dict | None:
    """Get the active session, or None if no active session."""
    if not ACTIVE_SESSION_FILE.exists():
        return None
    
    session_id = ACTIVE_SESSION_FILE.read_text().strip()
    if not session_id:
        return None
    
    session_file = SESSIONS_DIR / session_id / "SESSION.json"
    if not session_file.exists():
        return None
    
    try:
        session = json.loads(session_file.read_text())
        session["_path"] = str(SESSIONS_DIR / session_id)
        return session
    except:
        return None


def get_all_sessions() -> list:
    """Get all sessions (active and completed)."""
    sessions = []
    if not SESSIONS_DIR.exists():
        return sessions
    
    for session_dir in sorted(SESSIONS_DIR.iterdir(), reverse=True):
        if not session_dir.is_dir():
            continue
        session_file = session_dir / "SESSION.json"
        if session_file.exists():
            try:
                session = json.loads(session_file.read_text())
                session["_path"] = str(session_dir)
                sessions.append(session)
            except:
                pass
    
    return sessions


def update_session(session_id: str, updates: dict) -> bool:
    """Update a session's SESSION.json."""
    session_file = SESSIONS_DIR / session_id / "SESSION.json"
    if not session_file.exists():
        return False
    
    try:
        session = json.loads(session_file.read_text())
        session.update(updates)
        session["updatedUtc"] = utc_iso()
        session_file.write_text(json.dumps(session, indent=2))
        return True
    except:
        return False


def check_session_health() -> tuple[list, list]:
    """Check health of active session. Returns (warnings, errors)."""
    warnings = []
    errors = []
    
    # Check ACTIVE_SESSION exists
    if not ACTIVE_SESSION_FILE.exists():
        return warnings, errors  # No active session is OK
    
    session_id = ACTIVE_SESSION_FILE.read_text().strip()
    if not session_id:
        return warnings, errors
    
    session_dir = SESSIONS_DIR / session_id
    
    # Check session folder exists
    if not session_dir.exists():
        errors.append(f"ACTIVE_SESSION points to non-existent folder: {session_id}")
        return warnings, errors
    
    # Check SESSION.json is valid
    session_file = session_dir / "SESSION.json"
    if not session_file.exists():
        errors.append(f"Session {session_id} missing SESSION.json")
        return warnings, errors
    
    try:
        session = json.loads(session_file.read_text())
    except json.JSONDecodeError as e:
        errors.append(f"Session {session_id} has invalid SESSION.json: {e}")
        return warnings, errors
    
    # Check required artifacts exist
    required = ["CONTRACT.md", "NOTES.md", "SPECLOCK.md", "TESTPLAN.md"]
    for artifact in required:
        if not (session_dir / artifact).exists():
            errors.append(f"Session {session_id} missing {artifact}")
    
    # Check for stale session
    try:
        updated = datetime.fromisoformat(session.get("updatedUtc", "").replace("Z", "+00:00"))
        hours_idle = (datetime.now(timezone.utc) - updated).total_seconds() / 3600
        if hours_idle > STALE_THRESHOLD_HOURS:
            warnings.append(f"Session {session_id} is stale ({hours_idle:.0f}h idle)")
    except:
        pass
    
    # Check SpecLock status if past phase 2
    speclock_file = session_dir / "SPECLOCK.md"
    if speclock_file.exists():
        content = speclock_file.read_text()
        if "Status: **DRAFT**" in content or "_not frozen_" in content:
            # Check PATCHLOG for actual code changes
            patchlog = session_dir / "PATCHLOG.md"
            if patchlog.exists():
                patchlog_content = patchlog.read_text()
                if "```diff" in patchlog_content:
                    errors.append(f"Session {session_id} has code changes but SpecLock not frozen")
    
    return warnings, errors


def run_breaker(session_id: str = None) -> tuple[bool, Path]:
    """Run the Breaker pass for a session."""
    
    # Get session
    if session_id:
        session_file = SESSIONS_DIR / session_id / "SESSION.json"
    else:
        session = get_active_session()
        if not session:
            return False, None
        session_id = session["id"]
        session_file = SESSIONS_DIR / session_id / "SESSION.json"
    
    if not session_file.exists():
        return False, None
    
    session = json.loads(session_file.read_text())
    session_dir = SESSIONS_DIR / session_id
    proj = PROJECTS.get(session["project"], {"gate": "tf gate"})
    
    results = {
        "timestamp": utc_iso(),
        "checks": [],
        "passed": True,
    }
    
    print(f"🔨 Running Breaker pass for: {session_id}")
    print("")
    
    # 1. Run gate
    print("🔍 [1/4] Gate checks...")
    gate_result = subprocess.run(
        ["bash", "-c", f"cd {ROOT} && {proj['gate']}"],
        capture_output=True, text=True
    )
    gate_passed = gate_result.returncode == 0
    results["checks"].append({
        "name": "gate",
        "passed": gate_passed,
        "output": (gate_result.stdout + gate_result.stderr)[-2000:],
    })
    if not gate_passed:
        results["passed"] = False
    
    # 2. Hub verify
    print("🔍 [2/4] Hub verify...")
    verify_result = subprocess.run(
        ["bash", "-c", f"cd {ROOT} && python3 ops/tooling/verify-tasks.py"],
        capture_output=True, text=True
    )
    verify_passed = verify_result.returncode == 0
    results["checks"].append({
        "name": "hub_verify",
        "passed": verify_passed,
        "output": verify_result.stdout + verify_result.stderr,
    })
    
    # 3. Secrets scan
    print("🔍 [3/4] Secrets scan...")
    secrets_found = False
    patterns = ["password=", "api_key=", "secret=", "token=", "private_key"]
    for pattern in patterns:
        grep = subprocess.run(
            ["bash", "-c", f"cd {ROOT} && git diff HEAD --cached -U0 2>/dev/null | grep -i '{pattern}' || true"],
            capture_output=True, text=True
        )
        if grep.stdout.strip():
            secrets_found = True
            break
    results["checks"].append({
        "name": "secrets_scan",
        "passed": not secrets_found,
        "output": "Potential secrets in staged changes" if secrets_found else "No secrets detected",
    })
    if secrets_found:
        results["passed"] = False
    
    # 4. SpecLock frozen check
    print("🔍 [4/4] SpecLock verification...")
    speclock_file = session_dir / "SPECLOCK.md"
    speclock_frozen = False
    if speclock_file.exists():
        content = speclock_file.read_text()
        speclock_frozen = "Status: **FROZEN**" in content or "**Frozen At**:" in content and "_not frozen_" not in content
    results["checks"].append({
        "name": "speclock_frozen",
        "passed": speclock_frozen,
        "output": "SpecLock is FROZEN" if speclock_frozen else "SpecLock is NOT frozen (still DRAFT)",
    })
    if not speclock_frozen:
        results["passed"] = False
    
    # Write/append to ATTACK_REPORT.md
    report_file = session_dir / "ATTACK_REPORT.md"
    report_content = report_file.read_text() if report_file.exists() else ""
    
    # Append automated findings
    new_section = f"""

---

## Automated Breaker Pass: {results['timestamp']}

**Overall**: {'✅ PASSED' if results['passed'] else '❌ FAILED'}

"""
    for check in results["checks"]:
        status = "✅" if check["passed"] else "❌"
        new_section += f"### {status} {check['name']}\n\n"
        if check.get("output"):
            new_section += f"```\n{check['output'][:1000]}\n```\n\n"
    
    report_file.write_text(report_content + new_section)
    
    # Update session
    update_session(session_id, {"updatedUtc": utc_iso()})
    
    return results["passed"], report_file


def complete_session(session_id: str = None) -> bool:
    """Mark a session as complete."""
    
    if session_id:
        session_file = SESSIONS_DIR / session_id / "SESSION.json"
    else:
        session = get_active_session()
        if not session:
            return False
        session_id = session["id"]
    
    # Update session status
    if not update_session(session_id, {"status": "complete"}):
        return False
    
    # Clear ACTIVE_SESSION
    if ACTIVE_SESSION_FILE.exists():
        current = ACTIVE_SESSION_FILE.read_text().strip()
        if current == session_id:
            ACTIVE_SESSION_FILE.unlink()
    
    return True


def get_telemetry() -> dict:
    """Get agent protocol telemetry metrics."""
    sessions = get_all_sessions()
    
    total = len(sessions)
    active = sum(1 for s in sessions if s.get("status") == "active")
    completed = sum(1 for s in sessions if s.get("status") == "complete")
    
    with_speclock = 0
    with_testplan = 0
    with_attack = 0
    
    for session in sessions:
        session_dir = Path(session.get("_path", ""))
        if not session_dir.exists():
            continue
        
        # Check SpecLock frozen
        speclock = session_dir / "SPECLOCK.md"
        if speclock.exists():
            content = speclock.read_text()
            if "Status: **FROZEN**" in content:
                with_speclock += 1
        
        # Check TestPlan has tests
        testplan = session_dir / "TESTPLAN.md"
        if testplan.exists():
            content = testplan.read_text()
            if "| ✅" in content or "| 🟢" in content:
                with_testplan += 1
        
        # Check Attack completed
        attack = session_dir / "ATTACK_REPORT.md"
        if attack.exists():
            content = attack.read_text()
            if "APPROVE" in content or "✅ PASSED" in content:
                with_attack += 1
    
    return {
        "total_sessions": total,
        "active_sessions": active,
        "completed_sessions": completed,
        "speclock_frozen": f"{with_speclock}/{total}" if total > 0 else "0/0",
        "testplan_complete": f"{with_testplan}/{total}" if total > 0 else "0/0",
        "attack_complete": f"{with_attack}/{total}" if total > 0 else "0/0",
    }


# =============================================================================
# CLI
# =============================================================================

def cmd_run(args):
    """Create new session."""
    
    # Parse scope
    scope = args.scope if args.scope else None
    
    # Validate project
    if args.project not in PROJECTS:
        print(f"⚠️  Unknown project '{args.project}'. Using as custom project.")
    
    # Run gate first
    print("🔒 Running gate check before session creation...")
    gate_result = subprocess.run(
        ["bash", "-c", f"cd {ROOT} && tf gate"],
        capture_output=True, text=True
    )
    if gate_result.returncode != 0:
        print("❌ Gate failed. Fix issues before starting session.")
        print(gate_result.stdout)
        return 1
    print("✓ Gate passed")
    print("")
    
    # Create session
    session_dir = create_session(
        project=args.project,
        feature=args.feature,
        mode=args.mode,
        risk=args.risk,
        tests=args.tests,
        speclock=args.speclock,
        diff_only=not args.no_diff_only,
        scope=scope,
        branch=args.branch,
    )
    
    session_id = session_dir.name
    
    print(f"✓ Session created: {session_id}")
    print("")
    print(f"  📁 {session_dir.relative_to(ROOT)}/")
    print(f"     SESSION.json     - Source of truth")
    print(f"     CONTRACT.md      - Execution rules (start here)")
    print(f"     SPECLOCK.md      - API contracts (freeze before coding)")
    print(f"     TESTPLAN.md      - Success criteria + tests")
    print(f"     ATTACKPLAN.md    - Breaker checklist")
    print(f"     PATCHLOG.md      - All diffs go here")
    print(f"     ATTACK_REPORT.md - Breaker findings")
    print(f"     PR_REVIEW.md     - Shadow reviewer")
    print(f"     NOTES.md         - Agent memory")
    print("")
    print("  Next commands:")
    print("    tf agent status   - View session status")
    print("    tf agent notes    - Edit agent notes")
    print("    tf agent break    - Run Breaker pass")
    print("    tf agent complete - Mark session complete")
    
    return 0


def cmd_status(args):
    """Show active session status."""
    
    session = get_active_session()
    
    if not session:
        print("No active session.")
        print("")
        print("Start one with: tf agent run --project=<project> --feature=\"<feature>\"")
        return 0
    
    session_dir = Path(session["_path"])
    
    # Check SpecLock status
    speclock_status = "❓ unknown"
    speclock_file = session_dir / "SPECLOCK.md"
    if speclock_file.exists():
        content = speclock_file.read_text()
        if "Status: **FROZEN**" in content:
            speclock_status = "🔒 FROZEN"
        elif "Status: **DRAFT**" in content:
            speclock_status = "📝 DRAFT"
    
    # Check TestPlan status
    testplan_status = "❓ unknown"
    testplan_file = session_dir / "TESTPLAN.md"
    if testplan_file.exists():
        content = testplan_file.read_text()
        if "| ✅" in content or "| 🟢" in content:
            testplan_status = "✅ has tests"
        elif "| ⬜" in content:
            testplan_status = "📝 tests defined"
        else:
            testplan_status = "⬜ empty"
    
    # Git status
    git_branch = get_git_branch()
    git_status = subprocess.run(
        ["git", "-C", str(ROOT), "status", "--porcelain"],
        capture_output=True, text=True
    )
    uncommitted = len(git_status.stdout.strip().split("\n")) if git_status.stdout.strip() else 0
    
    print(f"📁 Active Session: {session['id']}")
    print("")
    print(f"   Project:    {session['project']}")
    print(f"   Feature:    {session['feature']}")
    print(f"   Mode:       {session['mode']} | Risk: {session['risk']}")
    print(f"   Status:     {session['status']}")
    print(f"   Updated:    {session['updatedUtc']}")
    print("")
    print(f"   SpecLock:   {speclock_status}")
    print(f"   TestPlan:   {testplan_status}")
    print("")
    print(f"   Git branch: {git_branch}")
    print(f"   Uncommitted: {uncommitted} files")
    
    return 0


def cmd_notes(args):
    """Open notes for active session."""
    
    session = get_active_session()
    if not session:
        print("No active session.")
        return 1
    
    notes_file = Path(session["_path"]) / "NOTES.md"
    
    if not notes_file.exists():
        print(f"Notes file not found: {notes_file}")
        return 1
    
    # Try to open in editor
    if os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"):
        subprocess.run(["code", str(notes_file)])
    else:
        print(str(notes_file))
    
    return 0


def cmd_break(args):
    """Run Breaker pass."""
    
    session = get_active_session()
    if not session:
        print("No active session.")
        return 1
    
    passed, report = run_breaker(session["id"])
    
    print("")
    if passed:
        print(f"✅ Breaker pass complete.")
        print(f"   Report: {report.relative_to(ROOT)}")
    else:
        print(f"❌ Breaker found issues.")
        print(f"   Report: {report.relative_to(ROOT)}")
        return 1
    
    return 0


def cmd_complete(args):
    """Complete active session."""
    
    session = get_active_session()
    if not session:
        print("No active session.")
        return 1
    
    session_id = session["id"]
    session_dir = Path(session["_path"])
    
    if complete_session(session_id):
        print(f"✓ Session completed: {session_id}")
        print("")
        print("  PR Checklist:")
        print("    - [ ] Run final: tf gate")
        print("    - [ ] Review: PR_REVIEW.md signed off")
        print("    - [ ] Artifacts archived in session folder")
        print("")
        print(f"  Artifacts: {session_dir.relative_to(ROOT)}/")
        return 0
    else:
        print("Failed to complete session.")
        return 1


def cmd_check(args):
    """Check session health."""
    
    warnings, errors = check_session_health()
    
    exit_code = 0
    
    if errors:
        print("❌ Errors:")
        for e in errors:
            print(f"   - {e}")
        exit_code = 1
    
    if warnings:
        print("⚠️  Warnings:")
        for w in warnings:
            print(f"   - {w}")
    
    if not errors and not warnings:
        session = get_active_session()
        if session:
            print(f"✓ Session healthy: {session['id']}")
        else:
            print("✓ No active session (OK)")
    
    return exit_code


def cmd_telemetry(args):
    """Show agent protocol metrics."""
    
    metrics = get_telemetry()
    
    print("📊 Agent Protocol Telemetry")
    print("")
    print(f"   Total sessions:     {metrics['total_sessions']}")
    print(f"   Active sessions:    {metrics['active_sessions']}")
    print(f"   Completed sessions: {metrics['completed_sessions']}")
    print(f"   SpecLock frozen:    {metrics['speclock_frozen']}")
    print(f"   TestPlan complete:  {metrics['testplan_complete']}")
    print(f"   Attack complete:    {metrics['attack_complete']}")
    
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion Agent Session Artifact Bundle",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # run
    run_parser = subparsers.add_parser("run", help="Create new session")
    run_parser.add_argument("--project", "-p", required=True, help="Project ID")
    run_parser.add_argument("--feature", "-f", required=True, help="Feature name")
    run_parser.add_argument("--mode", "-m", default="feature",
                           choices=["feature", "bugfix", "refactor", "hardening"])
    run_parser.add_argument("--risk", "-r", default="med",
                           choices=["low", "med", "high"])
    run_parser.add_argument("--tests", "-t", default="all",
                           choices=["unit", "integration", "e2e", "all"])
    run_parser.add_argument("--speclock", "-s", default="strict",
                           choices=["strict", "advisory", "off"])
    run_parser.add_argument("--no-diff-only", action="store_true",
                           help="Disable diff-only mode")
    run_parser.add_argument("--scope", action="append",
                           help="Scope glob (repeatable)")
    run_parser.add_argument("--branch", "-b", help="Work branch name")
    
    # status
    subparsers.add_parser("status", help="Show active session")
    
    # notes
    subparsers.add_parser("notes", help="Open session notes")
    
    # break
    subparsers.add_parser("break", help="Run Breaker pass")
    
    # complete
    subparsers.add_parser("complete", help="Complete session")
    
    # check
    subparsers.add_parser("check", help="Check session health")
    
    # telemetry
    subparsers.add_parser("telemetry", help="Show protocol metrics")
    
    args = parser.parse_args()
    
    if args.command == "run":
        return cmd_run(args)
    elif args.command == "status":
        return cmd_status(args)
    elif args.command == "notes":
        return cmd_notes(args)
    elif args.command == "break":
        return cmd_break(args)
    elif args.command == "complete":
        return cmd_complete(args)
    elif args.command == "check":
        return cmd_check(args)
    elif args.command == "telemetry":
        return cmd_telemetry(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    exit(main())
