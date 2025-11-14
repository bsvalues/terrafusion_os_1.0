# Benton County PACS – 30-Day Developer Onboarding Guide

This plan gets a new engineer productive in 30 days with the legacy PACS system and the living documentation workflow now in this repo.

## Prerequisites

- Windows with PowerShell 7+ (`pwsh`)
- Docker Desktop (for local SQL Server)
- Node.js 18+ (for Mermaid CLI)
- SQL Server tools (`sqlcmd`)

## Day 0–1: Environment Bootstrap

- Clone repo and open in VS Code.
- Start local SQL Server and publish databases:
  - Read `pacs-server-benton/docs/README.md`.
  - Run:

    ```powershell
    cd pacs-server-benton/infra/docker
    docker compose -f compose.mssql.yml up -d
    cd ../../scripts
    pwsh ./publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
    ```

- Validate:

  ```powershell
  pwsh ./Make.ps1 all-checks
  pwsh ./Make.ps1 viz
  ```

## Day 2–4: System Orientation

- Read: `docs/ULTRA_DEEP_DIVE_LEGACY_ANALYSIS.md`, `docs/SERVER_ARCHITECTURE_FINDINGS.md`, `docs/VISUAL_ARCHITECTURE_DIAGRAMS.md`.
- Inspect generated visuals in `_artifacts/`.
- Explore databases with SSMS or Azure Data Studio (pacs_oltp, PACS_Training, CIAPS, TA_AppSvr, web_internet_benton).

## Day 5–7: Data Model & Cross-DB Links

- Query `pacs_oltp.dbo.property`, `property_val`, `situs`, `change_log`.
- Review CIAPS synonyms in `DatabaseProjectCIAPS/dbo/Synonyms/` and cross-DB procedures.
- Exercise:
  - Use `pwsh ./Make.ps1 twin-verify-surface` to confirm key tables/procs.
  - Read `docs/diagrams/crossdb.mmd` to understand dependencies.

## Day 8–10: Triggers & Recalc Flow

- Read `docs/diagrams/trigger_cascade.mmd` and `recalc_flow.mmd`.
- Exercise:
  - Profile triggers:

    ```powershell
    pwsh ./Make.ps1 twin-trigger-profile
    ```

  - Identify the 3 most critical triggers on `property_val` by reading `DatabaseProjectpacs_training/dbo/` and production equivalents.

## Day 11–13: Living Docs & Verification

- Regenerate diagrams and validate syntax:

  ```powershell
  pwsh ./Make.ps1 validate-mermaid
  pwsh ./Make.ps1 viz
  ```

- Inventory DB objects:

  ```powershell
  pwsh ./Make.ps1 pacs-inventory
  ```

- Read outputs in `_artifacts/` and correlate with `docs/PACS_VISUAL_GUIDE.md`.

## Day 14–17: Hands-on Lab A – Recalc Debugging

- Goal: Trace a property recalculation from proc entry to extended stored procedure call.
- Steps:
  - Search for `xp_RecalcProperty` references in database projects.
  - Map inputs/outputs and capture a sample execution plan.
  - Document any plaintext credentials and propose mitigations.
- Deliverable: A short write-up added under `docs/labs/recalc_debugging.md`.

## Day 18–20: Hands-on Lab B – Supplement Storm Simulation

- Goal: Simulate multiple supplements on a property and observe trigger cascades.
- Steps:
  - Create test property in `PACS_Training`.
  - Apply sequential supplement inserts/updates.
  - Measure impacts on `change_log` and any recalculation side effects.
- Deliverable: SQL script under `docs/labs/supplement_storm.sql` and observations.

## Day 21–23: Hands-on Lab C – Audit & Identity Growth

- Goal: Assess `change_log` growth risk and identity thresholds.
- Steps:
  - Run `scripts/sql/verify_surface.sql` to surface identity warnings.
  - Estimate remaining headroom; propose partitioning/archiving approach.
- Deliverable: Summary under `docs/labs/audit_capacity.md`.

## Day 24–26: Web Export Pathway

- Read `DatabaseProjectweb_internet_benton/dbo/StoredProcedures/` (data staging for public website).
- Trace a key export procedure end-to-end.
- Add notes to `docs/KNOWLEDGE_TRANSFER_PACKAGE.md` if gaps are found.

## Day 27–28: Testing Orientation

- Read `docs/TESTING_STRATEGY.md`.
- If tSQLt is available in your instance, run example tests (see docs) or prepare a plan to introduce it.

## Day 29–30: Modernization & API

- Read `docs/API_MIGRATION_SPEC.md`.
- Draft a candidate endpoint spec for one use case you explored (e.g., property basic profile) and open a PR.

## Support & Reference

- Problems starting SQL? See `pacs-server-benton/infra/docker/compose.mssql.yml` and `scripts/publish.ps1`.
- CIAPS loaders: `Misc/BuildingPermitLoader.ps1`, `DatabaseProjectCIAPS/permit/StoredProcedures/pProcess_BuildingImport.sql`.
- Security accounts: `DatabaseProject*/Security/`.
