# WO-0015 — Product gate: live-DB migration verify (Dais)

- **Risk:** R2 (read-only verification: list/inspect only, NO `database update` unless already applied state confirms clean) · **Suite:** OS kernel / Data (Dais persistence) · **Agent:** Claude Code
- **Surface:** EF Core migration state of the live dev TerraFusion DB vs `TerraFusion.Data` migrations — VERIFY, do not mutate schema
- **Goal:** D-002 verified Dais persistence behavior on the in-memory provider; this gate answers whether the LIVE dev database actually has `20260317074518_AddDaisEntities` applied (and whether any migrations are pending). Evidence note with honest verdict.

## Files likely touched
- `docs/brain/evidence/WO-0015-dais-live-db-migration-verify.md` (new)
- `docs/brain/memory/**` (release-gates/drift as needed)
- `docs/brain/canon/next-queue.json` (advance queue)

## Allowed files
- `docs/brain/evidence/**`
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `wiki/**`

## Method (read-only)
- `dotnet ef migrations list --project TerraFusion.Data --startup-project TerraFusion.API --no-build` (memory lesson: API MUST be startup-project; Data-as-startup scaffolds destructively. `--no-build` avoids the D-001 dev-API DLL lock)
- Check `appsettings.Development.local.json` BEFORE trusting committed appsettings for the effective connection string (memory lesson: .local overrides silently)
- Direct DB cross-check: `__EFMigrationsHistory` rows + Dais tables (Appeals/Exemptions/...) existence

## Acceptance criteria
- [ ] Verdict: AddDaisEntities APPLIED / NOT APPLIED / PENDING-LIST with the exact migration list output
- [ ] Zero schema mutation performed (list/select only)
- [ ] Effective connection string source identified (committed vs .local override), secrets redacted in evidence
- [ ] `brain review-diff --workorder WO-0015` honest; proof PASS

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0015`
- `pnpm brain proof --workorder WO-0015`

## Rollback
- Docs-only; revert files.

## Stop conditions
- any migration would mutate schema unexpectedly (stop + operator)
- dev DB contention with fleet
- pending migrations found → record + queue an apply WO (operator approval); do NOT apply here

## Non-goals
- No `dotnet ef database update`, no migration add/remove, no seed/data changes.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0015",
  "task": "Product gate: live-DB migration verify (Dais) — read-only migrations list + AddDaisEntities applied check",
  "risk": "R2",
  "suite": "OS kernel / Data",
  "allowed_files": [
    "docs/brain/evidence/**",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/**",
    "frontend/**",
    "backend/**",
    "scripts/**",
    "tools/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0015",
    "pnpm brain proof --workorder WO-0015"
  ]
}
```
