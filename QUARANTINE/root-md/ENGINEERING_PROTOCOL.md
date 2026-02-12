# TerraFusion Engineering Execution Protocol

```
╔══════════════════════════════════════════════════════════════════════════╗
║  ENGINEERING EXECUTION PROTOCOL: REQUIRED                                 ║
║  All feature work MUST run through `tf agent run`                         ║
║  Contract Version: v1.0.0 │ Status: FROZEN │ Effective: 2025-12-17       ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## The One Rule

**We don't start with code. We start with contracts, tests, and failure modes.**

---

## How TerraFusion Builds Software

### Before Writing Any Code

```bash
tf agent run --project <project> --feature "<feature>" --risk <low|med|high>
```

This creates a **Session Artifact Bundle** with 9 files that enforce:

1. **SpecLock-first**: Freeze API contracts before implementation
2. **Tests-first**: Define success criteria before coding
3. **Diff-only**: All changes as patches, not rewrites
4. **Breaker attack**: Adversarial review before merge
5. **Audit trail**: Every decision documented

### The 7-Phase Loop

| Phase | Artifact | Stop Condition |
|:------|:---------|:---------------|
| 1. Context | SESSION.json | Scope loaded |
| 2. SpecLock | SPECLOCK.md | Contracts frozen (timestamped) |
| 3. TestPlan | TESTPLAN.md | Tests fail for right reason |
| 4. Implement | PATCHLOG.md | Tests pass, gate passes |
| 5. Breaker | ATTACK_REPORT.md | No critical vulnerabilities |
| 6. Review | PR_REVIEW.md | All checklists passed |
| 7. Complete | NOTES.md | Session archived |

### Commands

```bash
tf agent run      # Start session
tf agent status   # View active session
tf agent break    # Run Breaker pass
tf agent complete # Archive session
tf agent telemetry # View protocol metrics
```

---

## Proof Point

**Session**: `20251217_075319Z_ai-lab_rag-query-citations-contract`

| Metric | Result |
|:-------|:-------|
| Feature | RAG Query JSON Mode + Citations |
| Risk | Medium |
| Tests | 19/19 passing |
| Breaker findings | 1 Medium (accepted per scope) |
| Protocol score | 24/25 (96%) |
| Gate | 10/10 passing |
| Regressions | 0 |

**Evidence**: [Session artifacts](ops/agents/sessions/20251217_075319Z_ai-lab_rag-query-citations-contract/)

---

## Enforcement

### What Triggers Protocol Requirement

Changes to these paths **MUST** have an active or completed agent session:

- `ops/ai/**` - AI Lab
- `ops/dev/**` - OS Shell
- `backend/**` - Backend services
- `frontend/**` - Frontend apps
- `SDK/**` - Module SDK
- `config/tenant.*` - County configs

### Gate Checks

```
[11/11] Agent Protocol: ✓ PASS (session exists for changed scope)
```

### Pre-Commit

```
⚠️  WARNING: Files changed in ops/ai/ without active agent session
   Run: tf agent run --project ai-lab --feature "<description>"
```

---

## Why This Exists

> "You didn't just use AI. You **contained AI**. You turned it into a 
> **deterministic execution engine**. You made quality **automatic, 
> not aspirational**."

This protocol ensures:

- **No rewrite chaos** - Diff-only patches
- **No scope creep** - SpecLock frozen before code
- **No surprise regressions** - Tests-first
- **No blind spots** - Breaker attack
- **No tribal knowledge** - Audit trail in NOTES.md

---

## Protocol Versioning

| Version | Date | Changes |
|:--------|:-----|:--------|
| v1.0.0 | 2025-12-17 | Initial frozen release |

**Changes require**: SpecLock + ADR + evidence of failure mode

---

*Government. Transcended.*
