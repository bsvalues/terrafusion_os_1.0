# Conflict Resolution Protocol

> **Version:** 1.0.0
> **Parent:** [MESH_GOVERNANCE.md](./MESH_GOVERNANCE.md)

## Overview

When agents disagree, the mesh provides a **structured resolution protocol**—not debate, not voting, but a deterministic procedure with clear ownership.

---

## When to Raise CONFLICT

Raise a `CONFLICT` message when:

1. **Architectural Disagreement:** Two agents propose incompatible designs
2. **Research Contradiction:** Findings from different tracks contradict
3. **Implementation Deviation:** Code doesn't match approved plan
4. **Constraint Violation:** Proposed change violates documented constraints
5. **Priority Dispute:** Agents disagree on task ordering

Do NOT raise CONFLICT for:
- Preference differences with no functional impact
- Cosmetic style disagreements (defer to linter/formatter)
- Questions that can be answered with research

---

## CONFLICT Message Format

```json
{
  "type": "CONFLICT",
  "from_role": "researcher",
  "to_role": "integrator",
  "channel": "#architecture",
  "subject": "Conflict: Animation approach for LiquidPanel",
  "body": "Positions A and B are incompatible. Need decision.",
  "conflict_detail": {
    "claim_a": {
      "position": "Use CSS transitions only",
      "advocate": "researcher-1",
      "evidence": ["research.md#Agent-B-Notes", "perf-benchmark.json"],
      "impact_if_rejected": "Lose GPU-accelerated animations"
    },
    "claim_b": {
      "position": "Use framer-motion with layoutId",
      "advocate": "researcher-2", 
      "evidence": ["research.md#Agent-A-Notes", "accessibility-audit.md"],
      "impact_if_rejected": "Lose shared element transitions"
    },
    "stakes": "HIGH - affects all material component animations",
    "deadline": "2026-02-07T18:00:00Z"
  }
}
```

---

## Resolution Timeline

| Stage | Owner | Max Duration |
|-------|-------|--------------|
| CONFLICT filed | Any agent | - |
| Evidence review | Integrator | 1 cycle |
| Clarifying REQUEST (optional) | Integrator | 0.5 cycle |
| DECISION issued | Integrator | 0.5 cycle |
| Acknowledgment | Losing party | Immediate |
| Doc landing | Integrator | Same cycle |

**Total max time:** 2 cycles from CONFLICT to resolved.

---

## Decision Rubric

Integrator applies this rubric **in order** (first matching criterion wins):

### Priority 1: Correctness

> Does it work? Does it produce correct output?

- Provably incorrect solution is rejected
- "Works but ugly" beats "elegant but broken"

### Priority 2: Security / Compliance

> Does it meet security requirements? FISMA? WCAG? Data handling rules?

- Compliance violation is always rejected
- Security beats convenience
- "Secure but slower" beats "fast but leaky"

### Priority 3: Plan Alignment

> Does it match the approved plan and discovery objectives?

- Novelty that contradicts plan is rejected unless plan is amended
- Scope creep is rejected
- "Boring but on-plan" beats "exciting but off-plan"

### Priority 4: Simplicity / Maintainability

> Is it understandable? Can future developers maintain it?

- Complex solution needs strong justification
- "Simple and clear" beats "clever and opaque"

### Priority 5: Performance

> Does it meet performance budgets?

- Performance regression without justification is rejected
- "Fast enough" beats "theoretically optimal"

### Priority 6: Velocity

> Can we ship it in the timeline?

- Only considered after other criteria pass
- "Shippable now" beats "perfect later" if correctness/security are equal

---

## Decision Documentation

Every CONFLICT resolution DECISION must include:

```json
{
  "type": "DECISION",
  "subject": "RESOLVED: Animation approach → CSS transitions",
  "body": "Claim A (CSS transitions) accepted. Claim B rejected.",
  "rationale": "Priority 2 (Compliance): framer-motion bundle size exceeds performance budget. Priority 5 (Performance): CSS transitions achieve 60fps on quality tier 'reduced'.",
  "rubric_applied": ["compliance", "performance"],
  "rejected_claim": {
    "claim": "B - framer-motion",
    "reason": "Bundle size +47KB violates LCP budget"
  },
  "doc_targets": [
    { "doc": "plan", "section": "Phase 9.1 Tasks" },
    { "doc": "research", "section": "Agent-B-Conclusions" }
  ],
  "acceptance_impact": "Remove framer-motion from package.json. Update animation tests to use CSS."
}
```

---

## Acknowledgment Requirement

After DECISION, the losing party MUST send acknowledgment:

```json
{
  "type": "FYI",
  "from_role": "researcher",
  "to_role": "integrator",
  "channel": "#decisions",
  "subject": "ACK: Animation decision",
  "body": "Acknowledged. Will update research.md accordingly.",
  "in_reply_to": "[DECISION message ID]"
}
```

### Why Acknowledgment?

1. **Prevents silent resentment:** Agent doesn't secretly continue rejected approach
2. **Confirms understanding:** Agent knows why decision was made
3. **Creates audit trail:** Clear record of resolution
4. **Enables learning:** Agent can improve future proposals

---

## Escalation: Deadlocked Integrator

If Integrator cannot decide:

1. Request additional evidence via `REQUEST`
2. Set deadline extension (max +1 cycle)
3. If still deadlocked, apply **conservative fallback**:
   - Choose option with fewer changes to existing code
   - Choose option with smaller scope
   - Choose option that defers decision (if possible)
4. Document as "deferred decision" in plan.md

---

## Appeal Process

Losing party may appeal if:

1. New evidence emerges after DECISION
2. Integrator misapplied rubric (provable)
3. Circumstances changed materially

### Appeal Format

```json
{
  "type": "CONFLICT",
  "subject": "APPEAL: Animation decision",
  "body": "New benchmark data changes performance analysis.",
  "references": ["previous-decision-id", "new-benchmark.json"],
  "appeal_basis": "new_evidence"
}
```

### Appeal Outcomes

- **Upheld:** Original DECISION stands, doc landing confirmed
- **Reversed:** New DECISION issued, docs updated
- **Modified:** Original DECISION amended with new constraints

---

## Conflict Categories

### Type A: Technical Disagreement

Two valid approaches exist; need to pick one.

**Resolution:** Apply rubric, pick winner.

### Type B: Constraint Violation

One approach violates documented constraint.

**Resolution:** Violating approach is rejected. If constraint is wrong, amend constraint first.

### Type C: Missing Information

Neither party has enough data.

**Resolution:** Issue `REQUEST` for research, defer DECISION.

### Type D: Scope Creep

One approach expands beyond approved scope.

**Resolution:** Reject expansion. If scope should change, amend plan.md first via PROPOSAL.

### Type E: Timing Conflict

Both approaches valid, but different timelines.

**Resolution:** Apply Priority 6 (Velocity) if other criteria are equal.

---

## Conflict Anti-Patterns

### ❌ "Design by Committee"

Multiple rounds of CONFLICT on same topic with no resolution.

**Fix:** Integrator must decide within 2 cycles. "No decision" is not allowed.

### ❌ "Silent Override"

Agent implements rejected approach anyway.

**Fix:** Reviewer catches in QA, raises new CONFLICT. Violation logged.

### ❌ "Rationale-Free Decision"

Integrator decides without documenting why.

**Fix:** DECISION without rationale is invalid. Mesh rejects it.

### ❌ "Appeal Loop"

Losing party repeatedly appeals same decision.

**Fix:** Max 1 appeal per decision. Further appeals require new evidence.

---

## Metrics

Track conflict resolution health:

| Metric | Healthy | Warning |
|--------|---------|---------|
| Conflicts per phase | 1-3 | > 5 |
| Resolution time | < 2 cycles | > 3 cycles |
| Appeal rate | < 10% | > 25% |
| Acknowledgment rate | 100% | < 90% |
| "Missing info" conflicts | < 20% | > 40% |

High "missing info" rate indicates inadequate research phase.

---

## Related Documents

- [MESH_GOVERNANCE.md](./MESH_GOVERNANCE.md) - Full specification
- [roles.md](./roles.md) - Role definitions
- [message-schema.json](./message-schema.json) - Message format
