    # ADR-0002 — Suite Boundaries and Write Lanes

    Date: 2026-01-28  
    Status: Accepted

    ## Decision
    Each parcel domain fact/artifact has exactly one write owner (write lane).

    ## Rationale
    - Eliminates drift from duplicated writes.
- Makes ownership decisions enforceable.

    ## Consequences Matrix
    **Positive**
    - Clear accountability for data.
- Simplifies debugging and audits.

    **Negative**
    - Cross-lane changes require service calls (more plumbing).
- Requires discipline and tooling.

    **Neutral**
    - Read-only projections are allowed everywhere; writes are lane-locked.

    ## CI/CD Enforcement
    - Gate: tool `writesTo` must match lane matrix.
- Gate: deny cross-lane writes without owning service.

    ## Modification / Supersession Process
    - Supersede by publishing new lane matrix and updating gates in same PR.
