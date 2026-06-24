# Non-Ownership Rules (what TerraFusionOS core NEVER owns)

*Explicit negative space. These are binding — they keep the core thin and prevent the new
topology from re-inheriting the monorepo blur (HR-7/HR-8).*

1. **Core does not own suite domain logic.** Assessment/valuation/permit/levy/dossier business
   behavior lives in the suites, never in core. Core renders them via the workbench tab contract.
2. **Core does not own Levy math.** Levy is Dais-bound. Core owns only the Dais tab contract.
3. **Core does not own ingestion / ETL implementation.** PACS ETL, county ingestion, ArcGIS
   feeds are TerraFusion-Sync impl. Core owns only the sync→suite payload contract.
4. **Core does not own persistence for domains.** Each suite/platform owns its own schema
   (Sync DB, Dais DB, Forge DB…). Core owns only the cross-repo DTO/event contracts.
5. **Workbench is host/orchestration only — never a domain repo.** No comps, no valuation, no
   assessment logic in the workbench host (R-WB).
6. **Core does not own deep AI internals.** Shell-facing Pilot/Trace/Canon only; swarm/mesh/
   model internals are undecided/future, never silently absorbed (R-PILOT).
7. **Core is not a dumping ground for shared confusion.** "Shared" ≠ "core-owns-everything."
   If it is genuinely shared it becomes an *explicit* contract (`SHARED-CONTRACTS-MATRIX.md`),
   not loose code in the shell.
8. **Core never pulls forward wrapper noise / theater.** Ghost workspace layers, CostForge
   "Ultimate", MOCKED/FICTION surfaces, dead recut dupes → legacy-only, never core.

> Violation test: if a proposed core addition is domain behavior, persistence, ingestion, or
> deep-AI internals — it is misplaced. Move it to its repo or make it an explicit contract.
