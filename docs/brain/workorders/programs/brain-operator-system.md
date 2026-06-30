# P7 — AI / Brain / Operator System

**Program:** P7  
**Status:** QUEUED  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Operationalize the one-Brain model. TerraFusion Brain (Cortex) owns queue, sequencing, WOs, risk classification, proof, review-diff, and commit-plan. Suites get domain knowledge packs, not their own brains. This program audits what exists, closes capability gaps, and formalizes the operator command vocabulary.

---

## Governing Rule

> One TerraFusion Brain owns sequencing. Suites get domain packs. No suite brain owns WO queue or deployment gates.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Brain authority docs | Autonomous deployment |
| Domain pack definition | Brain bypassing stop gates |
| Operator command spec | Suite-level queue ownership |
| Memory/provenance review | Contradicting operator decisions |
| Agent role docs | Cross-Brain WO assignment |

---

## Work Orders (Ordered)

| WO | Title | Status | Description |
|----|-------|--------|-------------|
| WO-BRAIN-001 | Brain authority and current capability audit | **NEXT** | What does the Brain currently do? What is documented vs. aspirational? |
| WO-BRAIN-002 | Domain pack completeness audit | QUEUED | For each suite (Benton, Workbench, Forge), what domain knowledge is in the Brain? What's missing? |
| WO-BRAIN-003 | Operator command vocabulary cleanup | QUEUED | What commands does the operator currently use? Which are consistent? Which are ambiguous? |
| WO-BRAIN-004 | Goal engine maturity review | QUEUED | Is the `/goal` system working as documented? Evidence vs aspiration? |
| WO-BRAIN-005 | Loop engine maturity review | QUEUED | Is the `/loop` system working as documented? What's the real continuation contract? |
| WO-BRAIN-006 | Memory/provenance integration | QUEUED | Is persistent memory (project_session_operating_state.md etc.) reliably loaded? Gaps? |
| WO-BRAIN-007 | Agent role and stop-gate policy | QUEUED | Which agents have explicit stop gates? Which can self-initiate? Policy doc. |
| WO-BRAIN-008 | Autonomous continuation rulebook | QUEUED | When can the Brain/Claude proceed autonomously? When must it stop? Formal rulebook. |
| WO-BRAIN-009 | Brain/WOE integration evidence packet | QUEUED | Prove the Brain can query the WO Engine, score next WOs, and present a plan to the operator |

---

## WO-BRAIN-001 Definition

**Goal:** Audit what the TerraFusion Brain currently does vs. what is documented in `docs/brain/BRAIN_AUTHORITY.md` and `docs/brain/CORTEX_MODES.md`. Produce a capabilities truth table: capability → documented → evidence → gap.

**Outputs:**
- `docs/brain/WO_BRAIN_001_CAPABILITY_AUDIT.md`

---

## Dependency Chain

```
001 → 002 → 003 ─┐
                  ├─ 004, 005, 006, 007 (can be parallel) → 008 → 009
```

WO-BRAIN-009 is the integration gate — proves the Brain+WOE system is functional end-to-end.

---

## Stop Conditions

- If WO-BRAIN-001 finds the Brain authority docs are aspirational-only with no operational substance, update all docs to reflect reality before continuing
- Do not add Brain capabilities that expand autonomous action scope without operator approval
