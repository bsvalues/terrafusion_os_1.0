    # ADR-0003 — TerraTrace is Unified Append‑Only Audit Spine

    Date: 2026-01-28  
    Status: Accepted

    ## Decision
    All notable actions emit TerraTrace events. TerraTrace is append-only and county-scoped.

    ## Rationale
    - Government-grade auditability.
- Single activity feed across suites.
- Supports redaction without destroying integrity.

    ## Consequences Matrix
    **Positive**
    - Consistent audit trail.
- Easy timeline reconstruction via correlation.

    **Negative**
    - Larger event volume.
- Requires careful payload minimization.

    **Neutral**
    - Payloads stored by reference, not inline; feed is projection.

    ## CI/CD Enforcement
    - Gate: immutability tests.
- Gate: payload sanitization tests.

    ## Modification / Supersession Process
    - Supersede via new ADR describing alternative audit system; must include migration plan.
