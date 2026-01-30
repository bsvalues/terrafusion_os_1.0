    # ADR-0001 — Property Workbench is Tier‑0 OS Surface

    Date: 2026-01-28  
    Status: Accepted

    ## Decision
    Property Workbench is a Tier‑0 TerraFusion OS surface, not suite-owned.

    ## Rationale
    - Parcel is the primary entity across workflows.
- Prevent duplicated parcel screens.
- Enables cross-office tabs later without redesign.

    ## Consequences Matrix
    **Positive**
    - Single user mental model: OS → Parcel → Work.
- Deterministic integration via extension contract.
- Reduced fragmentation.

    **Negative**
    - Requires migration work and redirects.
- Forces suites to adapt (short-term friction).

    **Neutral**
    - UI consolidation shifts ownership decisions to contracts/write lanes.

    ## CI/CD Enforcement
    - Gate: Workbench extension compliance; forbid suite-owned parcel routes.
- Gate: redirect checks for legacy routes.

    ## Modification / Supersession Process
    - New ADR must be written with incremented ID.
- Old ADR remains; mark as Superseded with link.
- Never delete ADRs.
