# Deploy Runtime Constitution v1.0.0 — SpecLock

**Status:** DRAFT  
**Created:** 2025-12-18  
**Frozen At:** _Pending implementation completion_  
**Rollback Anchor:** _v1.0.0-deploy-constitution (tag after GREEN)_

---

## 1. Constitutional Scope

This document defines **immutable governance invariants** for all deployment operations in TerraFusion OS.

**Governed Commands:**
- `tf deploy --env <env> --bundle <path>`
- `tf deploy promote --from <env> --to <env> --bundle <path>`
- `tf deploy rollback --env <env> --to <tag|sha>`

**Governed Execution Contexts:**
- Local developer deployments (human mode)
- CI/CD pipeline deployments (machine mode)
- Emergency rollback operations

**Amendment Process:**  
Changes require: SpecLock update + RFC + breaker review + shadow deployment testing + constitutional tag bump.

---

## 2. Constitutional Invariants

### Invariant 1 — Gate-First Deployment

**Requirement:** `tf deploy` MUST require successful gate execution before any irreversible operations.

**Contract:**
- **Local/Human Deploy:** `tf gate` must exit 0
- **CI Deploy:** `tf gate --ci` must exit 0 and produce valid JSON stdout
- **On Gate Failure:** Exit 1, no side-effects, no artifact deployment

**Rationale:**  
Gate validates environment health, resource constraints, security posture. Bypassing gate risks deploying to unhealthy infrastructure.

**Test Coverage:**  
- Simulate gate failure → deploy refuses (exit 1)
- Gate pass → deploy proceeds to next checks

---

### Invariant 2 — No Active Agent Sessions During Deploy

**Requirement:** Deploy MUST refuse if `ACTIVE_SESSION` marker exists with status `active`.

**Contract:**
- Check `ops/agents/ACTIVE_SESSION` file
- If present and references active session → Exit 1
- Remediation message must include:
  - `tf agent status` (inspect session)
  - `tf agent complete` (mark complete)
  - `tf agent abort` (emergency abort)

**Rationale:**  
Active agent sessions indicate ongoing feature development. Deploying mid-session risks:
- Deploying incomplete work
- Breaking agent session contracts
- Undefined state in production

**Test Coverage:**
- Create active session marker → deploy refuses (exit 1)
- No active session → deploy proceeds

---

### Invariant 3 — Environment Model is Explicit and Validated

**Requirement:** Deploy MUST require exactly one validated environment specifier.

**Valid Environments:**
- `dev` — Development/integration environment
- `techsupport` — Technical support/staging environment  
- `prod` — Production environment

**Contract:**
- Missing `--env` → Exit 2 (invalid invocation)
- Invalid `--env` value → Exit 2 (invalid invocation)
- No defaulting (explicit > implicit)
- Error must list valid environments

**Rationale:**  
Implicit environment selection risks:
- Deploying to production by accident
- Environment confusion in CI logs
- Ambiguous rollback targets

**Test Coverage:**
- Missing `--env` → exit 2
- Invalid `--env foobar` → exit 2
- Valid `--env dev` → proceeds

---

### Invariant 4 — Immutable Artifact Bundle Required

**Requirement:** Deploy MUST validate presence of immutable build artifact bundle.

**Minimum Bundle Contents:**
1. **Manifest** (`manifest.json`):
   - `version` (semver)
   - `git_sha` (commit hash)
   - `build_timestamp` (ISO 8601 UTC)
   - `environment` (target env)

2. **SBOM** (`sbom.json` or placeholder):
   - CycloneDX/SPDX format
   - v1.0: placeholder accepted with warning
   - v2.0+: full SBOM required

3. **Runtime Proofs** (`proofs/`):
   - Gate summary (`gate-summary.json`)
   - Test results (`test-results.json`)
   - Checksums (`SHA256SUMS`)

**Contract:**
- Missing bundle path → Exit 1
- Bundle missing manifest → Exit 1
- Bundle missing required proofs → Exit 1 (or WARN in v1.0)
- Invalid manifest schema → Exit 1

**Rationale:**  
Immutable bundles enable:
- Deterministic deployments
- Audit trail for compliance
- Rollback to known-good states
- Supply chain verification

**Test Coverage:**
- Missing `--bundle` → exit 1
- Bundle missing manifest → exit 1
- Valid bundle structure → passes preflight

---

### Invariant 5 — Promotion and Rollback are Governed

**Promotion Rules:**

**To Production:**
- Gate-first requirement applies
- No active sessions requirement applies
- Explicit approval required:
  - Human: `--approve <approval-token>` (e.g., ticket ID, PR number)
  - CI: Environment variable `DEPLOY_APPROVAL_TOKEN` set
- Missing approval → Exit 2

**Cross-Environment:**
- `--from dev --to techsupport` → no approval needed
- `--from techsupport --to prod` → approval required

**Rollback Rules:**
- Must specify `--to <tag|sha>` (explicit target)
- Rollback target must exist in artifact registry
- Same gate-first + no-sessions requirements
- Rollback to unknown target → Exit 1

**Contract:**
- Missing `--from` or `--to` → Exit 2
- Promote to prod without approval → Exit 2
- Invalid rollback target → Exit 1

**Rationale:**  
Production deployments are high-risk operations requiring:
- Human acknowledgement (approval)
- Audit trail (who approved, when, why)
- Escape hatch (rollback to known-good)

**Test Coverage:**
- Promote to prod without approval → exit 2
- Rollback to invalid target → exit 1

---

## 3. Exit Code Contract (Constitutional)

**Standardized across Gate, Agent, Deploy subsystems.**

| Exit Code | Meaning | Examples |
|-----------|---------|----------|
| **0** | Success | Deploy completed, all checks passed |
| **1** | Failure | Gate failed, active session detected, bundle invalid, deploy failed |
| **2** | Invalid Invocation | Missing `--env`, invalid env, missing `--bundle`, bad flag combo |

**Machine Mode (--ci) Alignment:**
- Exit 2 with JSON error payload (same as `gate --ci`)
- Exit 1 with JSON failure details
- Exit 0 with JSON success summary

---

## 4. Command Surface (v1.0.0)

### Primary Deploy Command

```bash
tf deploy --env <dev|techsupport|prod> --bundle <path> [--dry-run] [--ci]
```

**Required Flags:**
- `--env <dev|techsupport|prod>` — Target environment
- `--bundle <path>` — Path to immutable artifact bundle

**Optional Flags:**
- `--dry-run` — Perform all preflight checks, no irreversible changes
- `--ci` — Machine mode (JSON-only stdout)

**Examples:**
```bash
# Local deploy to dev
tf deploy --env dev --bundle ./build/release-v1.2.3.tar.gz

# CI deploy to techsupport
tf deploy --env techsupport --bundle /artifacts/release.tar.gz --ci

# Dry-run to prod (preflight only)
tf deploy --env prod --bundle ./release.tar.gz --dry-run
```

---

### Promotion Command

```bash
tf deploy promote --from <env> --to <env> --bundle <path> [--approve <token>] [--ci]
```

**Required Flags:**
- `--from <env>` — Source environment
- `--to <env>` — Target environment
- `--bundle <path>` — Artifact bundle to promote

**Conditional Flags:**
- `--approve <token>` — Required when `--to prod`

**Examples:**
```bash
# Promote dev → techsupport (no approval needed)
tf deploy promote --from dev --to techsupport --bundle ./release.tar.gz

# Promote techsupport → prod (approval required)
tf deploy promote --from techsupport --to prod --bundle ./release.tar.gz --approve JIRA-12345

# CI promotion to prod
export DEPLOY_APPROVAL_TOKEN="PR-9876"
tf deploy promote --from techsupport --to prod --bundle ./release.tar.gz --ci
```

---

### Rollback Command

```bash
tf deploy rollback --env <env> --to <tag|sha> [--ci]
```

**Required Flags:**
- `--env <env>` — Target environment
- `--to <tag|sha>` — Rollback target (git tag or commit SHA)

**Examples:**
```bash
# Rollback prod to previous release
tf deploy rollback --env prod --to v1.2.2

# CI rollback
tf deploy rollback --env techsupport --to a1b2c3d4 --ci
```

---

## 5. Output Doctrine

### Human Mode (Default)

**Streaming Output:**
- Progress indicators (spinners, progress bars)
- Color-coded status (green=pass, red=fail, yellow=warn)
- Actionable error messages with remediation steps

**Example:**
```
🔍 Preflight Checks
  [1/5] Gate validation...        ✓ Passed
  [2/5] Active sessions...         ✓ None detected
  [3/5] Bundle validation...       ✓ Valid
  [4/5] Environment health...      ✓ Ready
  [5/5] Artifact registry...       ✓ Accessible

🚀 Deploying to dev environment...
  → Uploading artifacts...         ✓ Complete
  → Applying configurations...     ✓ Complete
  → Health checks...               ✓ Passed

✅ Deploy completed successfully (127s)
```

---

### Machine Mode (--ci)

**JSON-Only Stdout:**
- No ANSI escape codes
- No mixed human/machine output
- Structured error details

**JSON Schema:**
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T12:34:56Z",
  "status": "success|failure|error",
  "environment": "dev|techsupport|prod",
  "bundle": {
    "path": "/artifacts/release.tar.gz",
    "version": "1.2.3",
    "git_sha": "a1b2c3d4"
  },
  "preflight": {
    "gate": {"status": "pass|fail", "exit_code": 0},
    "sessions": {"status": "pass|fail", "active_sessions": 0},
    "bundle": {"status": "pass|fail", "manifest_valid": true},
    "environment": {"status": "pass|fail", "health": "ready"}
  },
  "deployment": {
    "started_at": "2025-12-18T12:34:56Z",
    "completed_at": "2025-12-18T12:36:03Z",
    "duration_seconds": 127,
    "artifacts_uploaded": 42,
    "services_deployed": 12
  },
  "summary": {
    "message": "Deploy completed successfully",
    "next_steps": []
  }
}
```

**Error Payload (Exit 2 - Invalid):**
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T12:34:56Z",
  "status": "error",
  "error": {
    "code": "invalid_environment",
    "message": "--env must be one of: dev, techsupport, prod",
    "details": {
      "provided": "foobar",
      "valid_values": ["dev", "techsupport", "prod"]
    }
  }
}
```

---

## 6. Forbidden Patterns (Breaker Targets for Phase 2)

**These patterns MUST be prevented or detected:**

1. **Gate Bypass:**
   - Calling kubectl/docker directly instead of `tf deploy`
   - Skipping gate checks via environment variables
   - Mock/fake gate results

2. **Bundle Tampering:**
   - Modifying bundle after gate validation
   - Injecting fake "passed" manifest
   - Missing checksum verification

3. **Session Race Conditions:**
   - Creating `ACTIVE_SESSION` mid-deploy
   - Deploy completing before session cleanup
   - Concurrent deploys to same environment

4. **Output Pollution (--ci mode):**
   - Subprocess logs leaking to stdout
   - ANSI codes in JSON fields
   - Mixed human/machine output

5. **Privilege Escalation:**
   - Deploy to prod without approval
   - Environment variable override bypassing checks
   - Missing RBAC enforcement

---

## 7. Implementation Checkpoints

### Phase 1: Foundation (Current)
- ✅ SpecLock created
- ⏳ RED baseline test suite
- ⏳ Command skeleton with exit code contract
- ⏳ Preflight checks (gate, sessions, bundle)
- ⏳ GREEN test validation

### Phase 2: Enforcement
- ⏳ Bundle validation (manifest, SBOM, proofs)
- ⏳ CI JSON mode implementation
- ⏳ Dry-run mode
- ⏳ Breaker scenarios

### Phase 3: Operations
- ⏳ Promote command
- ⏳ Rollback command
- ⏳ Artifact registry integration
- ⏳ Approval token validation

---

## 8. Test Plan Reference

**Location:** `ops/dev/tests/test_deploy_governance.sh`

**Coverage Matrix:**

| Section | Tests | Description |
|---------|-------|-------------|
| A | 4 | Invocation validity (exit 2) |
| B | 2 | Gate-first enforcement (exit 1) |
| C | 2 | Active session prevention (exit 1) |
| D | 3 | Bundle requirements (exit 1) |
| E | 3 | CI JSON purity |
| F | 1 | Dry-run safety |

**Total:** 15 constitutional compliance tests

**Enforcement:** CI blocks merge if tests fail

---

## 9. Rollback Strategy

**If constitutional violations are discovered:**

```bash
# Revert to last known-good
git checkout v1.0.0-deploy-constitution
git checkout -b hotfix/deploy-governance

# Fix issue
# Run test suite
bash ops/dev/tests/test_deploy_governance.sh

# Seal hotfix
git tag -a v1.0.1-deploy-constitution -m "Hotfix: <description>"
git push --tags
```

---

## 10. Amendment Process

**To modify this constitution:**

1. **Proposal:** Create RFC documenting necessity (bug, security, scale requirement)
2. **SpecLock Update:** Modify this document with proposed changes
3. **Test Extension:** Update `test_deploy_governance.sh` to cover new invariants
4. **Implementation:** Make minimal changes to pass new tests
5. **Breaker Review:** Run breaker scenarios against new behavior
6. **Shadow Deployment:** Test against 10+ historical bundles
7. **Constitutional Bump:** Tag `v1.1.0-deploy-constitution` after GREEN

**No exceptions. No fast-track. No "just this once."**

---

## 11. Related Constitutional Documents

- **Gate Constitution:** `ops/dev/GATE_QUICK_REFERENCE.md` (v1.0.0-gate-constitution)
- **Agent Constitution:** `ops/agents/AGENT_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md` (v1.0.0-agent-constitution)
- **Conventions:** `ops/agents/CONVENTIONS.md` (constitutional freeze clauses)

---

**END OF SPECLOCK**

**Frozen At:** _Pending (will be set when tests GREEN + tag created)_
