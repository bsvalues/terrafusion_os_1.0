    # ADR-0004 — TerraPilot OS Feature with Pilot/Muse Modes

    Date: 2026-01-28  
    Status: Accepted

    ## Decision
    TerraPilot is a single OS copilot feature with modes Pilot (operator) and Muse (creator).

    ## Rationale
    - One copilot avoids user confusion.
- Shared profile/context/logging.
- Modes align to act vs draft.

    ## Consequences Matrix
    **Positive**
    - Cleaner UX.
- Shared enforcement and safety pipeline.

    **Negative**
    - Requires robust policy controls to avoid over-automation.

    **Neutral**
    - Muse drafts may be stored in Dossier; Pilot actions route via tools.

    ## CI/CD Enforcement
    - Gate: RBAC vs allowlist enforcement.
- Gate: risk policy tests.
- Gate: trace required for all tool executions.

    ## Modification / Supersession Process
    - Supersede by ADR introducing different copilot model; must preserve audit + safety guarantees.
