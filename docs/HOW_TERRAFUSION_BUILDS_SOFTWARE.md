# How TerraFusion Builds Software

> **We don't start with code. We start with contracts, tests, and failure modes.**

---

## The One Rule

All feature work runs through `tf agent run`. No exceptions.

---

## The Protocol (7 Phases)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CONTEXT       Load scope, understand target                 │
│  2. SPECLOCK      Freeze API contracts BEFORE coding            │
│  3. TESTPLAN      Define success criteria, write failing tests  │
│  4. IMPLEMENT     Diff-only patches, smallest slices            │
│  5. BREAKER       Adversarial attack, find vulnerabilities      │
│  6. REVIEW        Shadow PR review checklist                    │
│  7. COMPLETE      Archive artifacts, update telemetry           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Works

| Old Way | TerraFusion Way |
|:--------|:----------------|
| "Let me try something" | Start with contracts |
| Rewrite whole files | Diff-only patches |
| Tests after code | Tests before code |
| Hope it works | Breaker attacks |
| Tribal knowledge | Auditable artifacts |

---

## Proof Point

**Session**: RAG Query Citations Contract (2025-12-17)

- **Risk**: Medium
- **Tests**: 19/19 passing
- **Breaker findings**: 1 (accepted per scope)
- **Protocol score**: 24/25 (96%)
- **Regressions**: 0
- **Artifacts**: Fully auditable

Session: [ops/agents/sessions/20251217_075319Z_ai-lab_rag-query-citations-contract/](ops/agents/sessions/20251217_075319Z_ai-lab_rag-query-citations-contract/)

---

## Commands

```bash
# Start any feature
tf agent run --project=ai-lab --feature="My Feature"

# Check session health
tf agent status

# Run adversarial attack
tf agent break

# Complete session
tf agent complete

# View protocol health
tf agent telemetry
```

---

## Enforcement

1. **Gate** (11 invariants) - Runs before every commit
2. **Pre-commit** - Warns on protected scope changes without session
3. **CI** - Hard-fails PRs without session artifacts

Protected scopes:
- `ops/ai/**`, `ops/dev/**`
- `backend/**`, `frontend/**`
- `SDK/**`, `config/tenant.*`

---

## Health Metrics

| Metric | Why It Matters |
|:-------|:---------------|
| Avg tests/feature | Correlates with regression rate |
| Breaker findings/session | Measures adversarial coverage |
| Sessions without SpecLock | Leading indicator of chaos |
| Commits per session | Measures slicing discipline |
| Time SpecLock → merge | Velocity without chaos |

View with: `tf agent telemetry`

---

## The System > Any Single Agent

What we've achieved:

- **Contained AI** - Not just used it
- **Deterministic execution** - Not aspirational quality
- **Auditable trail** - Not tribal knowledge
- **Automatic quality** - Not manual review

The protocol produces better outcomes than any individual workflow.

---

*Agent Execution Contract v1.0.0 | FROZEN | Government. Transcended.*
