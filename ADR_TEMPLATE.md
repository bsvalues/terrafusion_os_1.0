# Architecture Decision Record (ADR) Template

**Document Type:** Architecture Decision Record  
**Purpose:** Standardized template for documenting architectural decisions  
**Created:** October 6, 2025  
**Version:** 1.0

---

## How to Use This Template

1. **Copy this file** for each new architectural decision
2. **Name the file:** `ADR-XXX-short-title.md` (e.g., `ADR-006-caching-strategy.md`)
3. **Fill in all sections** with complete information
4. **Get review** from architecture team before marking ACCEPTED
5. **Update status** as decision evolves (PROPOSED → ACCEPTED/REJECTED/SUPERSEDED)

---

## ADR-XXX: [Decision Title]

**Status:** [PROPOSED | ACCEPTED | REJECTED | DEPRECATED | SUPERSEDED]  
**Date:** [YYYY-MM-DD]  
**Authors:** [Name(s)]  
**Reviewers:** [Name(s)] _(for ACCEPTED decisions)_  
**Supersedes:** [ADR-XXX] _(if applicable)_  
**Superseded By:** [ADR-XXX] _(if deprecated)_

---

### Context

**What is the issue we're facing?**

Describe the architectural problem, technical context, and business requirements that led to this decision. Include:
- Current situation/problem
- Constraints (technical, business, compliance)
- Requirements (functional, non-functional)
- Forces at play (conflicting concerns)

**Example:**
> We need to decide on a caching strategy for the API layer. Current response times are 300-500ms (p95), but we need <200ms to meet our SLA. We have 3 domains (Government, Commercial, AI) with different consistency requirements. Government data must be strongly consistent (tax calculations), while commercial data can tolerate eventual consistency (listings).

---

### Decision

**What architectural decision have we made?**

State the decision clearly and concisely. Use declarative language.

**Example:**
> We will implement a multi-tier caching strategy:
> - **Government Domain:** No caching (strong consistency required)
> - **Commercial Domain:** Redis cache with 5-minute TTL
> - **AI Platform:** Redis cache with 1-minute TTL for agent state

---

### Rationale

**Why did we make this decision?**

Explain the reasoning behind the decision. Include:
- Technical justification
- Business justification
- Trade-offs considered
- Why this option is superior to alternatives

**Example:**
> This decision balances performance and consistency:
> 1. **Government:** Tax calculations require ACID guarantees, caching would violate compliance
> 2. **Commercial:** Listing data is read-heavy (80/20), 5-minute staleness acceptable per business
> 3. **AI:** Agent state changes frequently, 1-minute TTL provides performance boost with minimal staleness
> 4. Redis chosen for simplicity (single technology), high performance, and Azure managed service availability

---

### Consequences

**What are the results of this decision?**

Document the positive, negative, and neutral consequences.

#### Positive Consequences ✅
- [List positive outcomes]
- [e.g., "Reduces API latency by 60% (from 300ms to 120ms p95)"]
- [e.g., "Reduces database load by 75%"]

#### Negative Consequences ⚠️
- [List negative outcomes]
- [e.g., "Introduces cache invalidation complexity"]
- [e.g., "Commercial data can be up to 5 minutes stale"]

#### Neutral Consequences ℹ️
- [List neutral outcomes]
- [e.g., "Requires Redis cluster operations knowledge"]

#### Mitigation Strategies 🔧
- [How are negative consequences mitigated?]
- [e.g., "Cache invalidation on write operations (write-through)"]
- [e.g., "Staleness disclaimer in UI for cached commercial data"]

---

### Alternatives Considered

**What other options did we evaluate?**

List alternatives with brief pros/cons. This shows due diligence.

#### Alternative 1: [Name]
- **Description:** [Brief description]
- **Pros:**
  - [List advantages]
- **Cons:**
  - [List disadvantages]
- **Reason for rejection:** [Why not chosen]

#### Alternative 2: [Name]
- **Description:** [Brief description]
- **Pros:**
  - [List advantages]
- **Cons:**
  - [List disadvantages]
- **Reason for rejection:** [Why not chosen]

---

### Implementation Plan

**How will this decision be implemented?**

Provide a high-level implementation roadmap.

#### Phase 1: [Phase Name]
- [Task 1]
- [Task 2]
- Timeline: [Duration]

#### Phase 2: [Phase Name]
- [Task 1]
- [Task 2]
- Timeline: [Duration]

#### Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

---

### Validation

**How will we validate this decision?**

Define how success will be measured.

#### Proof-of-Concept (if applicable)
- **Scope:** [What will the POC demonstrate?]
- **Timeline:** [When will POC be completed?]
- **Success Criteria:** [What metrics validate the POC?]

#### Metrics
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| [Metric 1] | [Current value] | [Target value] | [How measured] |
| [Metric 2] | [Current value] | [Target value] | [How measured] |

#### Tests
- [Test 1: Description]
- [Test 2: Description]

---

### Compliance & Security Implications

**Does this decision affect compliance or security?**

- **Compliance Impact:** [FISMA, NIST, SOC2, GDPR, etc.]
- **Security Impact:** [Threat model changes, new attack vectors, mitigations]
- **Audit Requirements:** [What needs to be logged/monitored?]

---

### Dependencies

**What does this decision depend on or affect?**

#### Depends On
- [ADR-XXX: Dependency]
- [Technology/System dependency]

#### Affects
- [Repository/Component affected]
- [Team/Process affected]

---

### Review & Approval

**Who reviewed and approved this decision?**

| Role | Name | Date | Approval |
|------|------|------|----------|
| Architect | [Name] | [Date] | ✅ APPROVED |
| Tech Lead | [Name] | [Date] | ✅ APPROVED |
| Security | [Name] | [Date] | ✅ APPROVED |
| Compliance | [Name] | [Date] | ✅ APPROVED |

---

### References

**Supporting documentation and resources**

- [Document 1: Description]
- [Document 2: Description]
- [External resource: URL]
- [Research paper: Citation]

---

### Changelog

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| [YYYY-MM-DD] | 1.0 | [Name] | Initial ADR created |
| [YYYY-MM-DD] | 1.1 | [Name] | Updated based on review feedback |

---

## ADR Lifecycle

```
PROPOSED ──────▶ ACCEPTED ──────▶ DEPRECATED ──────▶ SUPERSEDED
    │                                   ▲
    │                                   │
    └──────────────▶ REJECTED ──────────┘
```

**Status Definitions:**
- **PROPOSED:** Decision drafted, under review
- **ACCEPTED:** Decision approved and implemented
- **REJECTED:** Decision not approved, alternative chosen
- **DEPRECATED:** Decision no longer best practice but still in use
- **SUPERSEDED:** Decision replaced by newer ADR

---

## Tips for Writing Good ADRs

### Do's ✅
- ✅ Be specific and concrete
- ✅ Include measurable success criteria
- ✅ Document trade-offs explicitly
- ✅ Use diagrams where helpful
- ✅ Link to supporting documents
- ✅ Update status as decision evolves
- ✅ Consider future readers (context matters)

### Don'ts ❌
- ❌ Don't write novels (be concise)
- ❌ Don't assume reader knows context
- ❌ Don't skip alternatives section
- ❌ Don't forget consequences (positive AND negative)
- ❌ Don't make decisions in isolation (get review)
- ❌ Don't leave status as PROPOSED forever

---

## Example ADRs in This Project

- ADR-001: Polyrepo Architecture _(see TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md)_
- ADR-002: Message Bus Selection _(DRAFT - see TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md)_
- ADR-003: Service Mesh Selection _(DRAFT - see TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md)_
- ADR-004: API Gateway Selection _(DRAFT - see TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md)_
- ADR-005: Database Strategy _(see TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md)_

---

## When to Create an ADR

Create an ADR when you make a decision that:
- Affects multiple repositories or teams
- Has significant long-term consequences
- Involves trade-offs between conflicting forces
- Changes system architecture or design
- Impacts compliance, security, or performance
- Chooses between multiple viable options
- Future developers will ask "why did they do it this way?"

**Rule of Thumb:** If you're having a debate about it, write an ADR.

---

**Template Version:** 1.0  
**Created:** October 6, 2025  
**Maintained By:** TerraFusion Architecture Team
