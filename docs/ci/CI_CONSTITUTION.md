# TerraFusion CI Constitution

> **"GitHub Actions is not your CI system. TerraFusion is your CI system."**
>
> GitHub Actions is a runner + trigger mechanism for TerraFusion's gates.
> YAML files are adapters, not authorities.

---

## Authority Model

TerraFusion CI is governed by the **Seal Gate**:

```
scripts/ci-seal-gate.ps1       ← Single source of truth for pass/fail
tools/runtime-cert/tf-runtime.py  ← Production readiness certification
```

**Constitutional Rule:**
> No GitHub workflow may pass unless `ci-seal-gate.ps1` passes.

Everything else is advisory.

---

## Workflow Tiers

### 🟢 Tier 1 — Canonical Orchestrators (KEEP + WIRE)

**Purpose:**
- Trigger CI on PR/push
- Execute necessary setup (checkout, dotnet, node)
- **Always run the Seal Gate**
- Upload artifacts

**Rules:**
- MUST call `pwsh -NoProfile -File scripts/ci-seal-gate.ps1`
- MUST fail if Seal Gate fails
- Must NOT duplicate logic that belongs inside Seal Gate scripts
- Must NOT declare "green" independently

**Canonical Tier 1 Workflows:**
| File | Purpose |
|------|---------|
| `ci.yml` | Primary CI spine (PR/push validation) |
| `deployment.yml` | Production deployment orchestration |

All other "orchestrator" workflows should delegate to these or become Tier 2.

---

### 🟡 Tier 2 — Domain Pipelines (WRAP / CALL)

**Purpose:**
- Run focused domain checks (security, observability, terraform, e2e)
- Generate artifacts (SBOM, coverage reports, scan results)
- Provide signals, NOT authority

**Rules:**
- May run independently OR via `workflow_call` from Tier 1
- Must NOT define "green" for the repository
- Failures should surface, but **Seal Gate remains decisive**
- Should output artifacts, exit non-zero on failure

**Domain Pipeline Examples:**
| File | Domain |
|------|--------|
| `security.yml` | Security scanning |
| `security-compliance.yml` | Compliance checks |
| `sbom.yml` | Software Bill of Materials |
| `observability-ci.yml` | Observability validation |
| `performance-budget.yml` | Performance testing |
| `accessibility.yml` | WCAG compliance |
| `terraform-ci.yml` | Infrastructure validation |
| `kubernetes-infrastructure-ci.yml` | K8s config validation |

---

### 🔴 Tier 3 — Archived / Legacy / Experimental

**Purpose:**
- Preserve historical pipelines and experiments
- Prevent accidental execution
- Maintain audit trail (government compliance)

**Rules:**
- Stored under `.github/workflows/archived/`
- Must NOT run automatically on PR/push
- Never delete — archive for audit purposes

**Archived Workflow Examples:**
- `phase*-*.yml` (phase-specific experiments)
- `day7-chaos-ci.yml` (chaos engineering experiments)
- `quantum-optimization.yml` (research pipelines)
- `terrafusion-revolutionary-cicd.yml` (superseded experiments)

---

## CI vs Certification vs Operations

| Layer | Tool | Question Answered |
|-------|------|-------------------|
| **CI** | `ci-seal-gate.ps1` | Is the source valid? |
| **Certification** | `tf-runtime cert` | Is the deployment ready? |
| **Operations** | `prod-smoke-verify.ps1` | Can we open traffic? |

### CI (Seal Gate)
Validates source integrity and compliance:
- SpecLock index valid
- Artifacts generated correctly
- All tests pass (Builder + Breaker)
- No uncommitted drift

### Certification (RuntimeCert)
Validates production readiness:
```bash
python tools/runtime-cert/tf-runtime.py cert benton --strict --base-url https://tf.county.gov
```
- PACS contract valid
- Health endpoints responding
- SpecLock proof available
- Reports archived at `artifacts/cert/<timestamp>/`

### Operations (Prod Smoke)
Final go-live gate:
```powershell
pwsh scripts/prod-smoke-verify.ps1 -BaseUrl https://tf.county.gov -Strict
```

**A deployment is not valid without a passing certification report.**

---

## Seal Gate Structure

```
Gate 0:  Helm Production Assertions
Gate 1:  SpecLock Index Validation
Gate 2:  Generate All Artifacts
Gate 2b: RuntimeContract Artifacts
Gate 2c: Index Markdown Generation
Gate 3:  Manifest Generation
Gate 4:  County TSS Verification
Gate 5:  State TSS Verification
Gate 6:  Full Test Suite (Builder + Breaker) ← 387 tests
Gate 6b: Runtime Certification Tool Integrity ← NEW
Gate 7:  No Uncommitted Changes (drift check)
```

---

## Determinism Requirements

All generated artifacts must be deterministic:
- Stable ordering (no random iteration)
- Stable schemas (versioned, locked)
- Changes must be committed or blocked by drift gates
- Timestamps in UTC ISO 8601 format

---

## Environment Variables

### CI Environment
```yaml
env:
  RUNTIMECERT_BASE_URL: ${{ secrets.PROD_API_URL }}  # Triggers live cert
  RUNTIMECERT_COUNTY: benton                          # Default county
  RUNTIMECERT_STRICT: true                            # Enable strict mode
```

### Live Certification Behavior
| `RUNTIMECERT_BASE_URL` | Gate 6b.3 Behavior |
|------------------------|---------------------|
| Not set | SKIP (offline mode) |
| Set, cert passes | PASS |
| Set, cert fails | FAIL → Merge blocked |

---

## Change Control

Any modification to:
- SpecLocks (`docs/spec-lock/locks/**`)
- Seal Gate scripts (`scripts/ci-seal-gate.ps1`)
- Runtime certification (`tools/runtime-cert/**`)

Requires:
1. SpecLock updates (if applicable)
2. Enforcement tests (Builder)
3. Breaker tests for bypass vectors
4. Clean seal-gate pass
5. PR review

---

## Workflow Patch Pattern

### Tier 1 Workflow Template

Every Tier 1 workflow must end with:

```yaml
  seal-gate:
    name: 🔒 TerraFusion Seal Gate
    runs-on: ubuntu-latest
    needs: [<all-previous-jobs>]
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'
        
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0.x'
        
    - name: TerraFusion Seal Gate
      shell: pwsh
      run: pwsh -NoProfile -File scripts/ci-seal-gate.ps1
      
    - name: Upload Artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: terrafusion-seal-artifacts
        path: |
          artifacts/**
          docs/spec-lock/INDEX.md
```

### Converting Tier 2 to Reusable

Add at top of Tier 2 workflows:
```yaml
on:
  workflow_call:
    inputs:
      environment:
        type: string
        default: 'development'
```

Remove direct PR/push triggers from Tier 2.

---

## Migration Path

### Phase 1 (Immediate)
1. ✅ Create `docs/ci/CI_CONSTITUTION.md`
2. ✅ Create `.github/workflows/archived/`
3. Patch `ci.yml` to run Seal Gate
4. Move Tier 3 workflows to archived

### Phase 2 (Short-term)
5. Convert Tier 2 workflows to `workflow_call`
6. Reduce Tier 1 to 1-2 canonical spines
7. Add self-hosted runner support

### Phase 3 (Long-term)
8. Replace YAML sprawl with `tfctl pipeline run <domain>`
9. YAML becomes config, not logic

---

## Governance

This constitution is enforced by:
- `scripts/ci-seal-gate.ps1` (automated)
- `backend/tests/TerraFusion.Unit.SmokeTests/` (387 tests)
- `RuntimeCertBreakerTests.cs` (38 adversarial tests)

No bypass vectors. Fail-closed semantics.

---

*Government. Transcended.*
