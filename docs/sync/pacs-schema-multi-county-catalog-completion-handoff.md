# PACS Schema Catalog — Multi-County Foundation Completion Handoff

**Slice:** C54-MULTI-CLOSE (docs-only — closure marker for the
C54-MULTI family. Records that the multi-county catalog foundation
is complete for the current Benton-only operating reality, names
exactly what is deferred, and parks aggregation work until at
least three counties are operationally in scope.).
**Lifecycle layer:** Core Sync — schema infrastructure.
**Status:** family CLOSED for current scope; expansion gated on
operational reality.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-multi-county-catalog-policy.md` — C54-MULTI-A
  policy doc (catalog identity, catalog-set behavior, manifest
  scoping, ISOL-1..ISOL-4, sharing section, diffing section).
- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  master handoff. The C54-MULTI-* row is updated by this slice.
- `docs/sync/pacs-schema-consistency-invariants-policy.md` —
  C53-CONS-A. The identity-checked diff (C54-MULTI-D) wraps the
  C53-CONS-E diff Compute method.
- `docs/sync/pacs-schema-conversion-manifest-policy.md` —
  C50-CONV-A. Per-catalog scoping enforced by ISOL-1.
- `docs/sync/pacs-schema-pii-classification-manifest-policy.md` —
  C51-PII-A. Per-catalog scoping enforced by ISOL-1.
- `docs/sync/pacs-schema-exported-fk-override-manifest-policy.md` —
  C52-OVR-A. Per-catalog scoping enforced by ISOL-1.

## Completion statement

The C54-MULTI family delivered the multi-county catalog foundation
TerraFusion Sync needs for its first multi-county deployment. The
foundation is **functionally complete** for the current Benton-
only operating reality and has the structural shape ready for any
second county the operator brings online tomorrow.

This handoff intentionally does NOT advance the family further.
Cross-county aggregation (C54-MULTI-E) and per-consumer migration
to the catalog-set API (C54-MULTI-PROMOTE-*) are gated on
operational reality, not engineering capability. Building them
now without a real second county would be speculative surface
that drifts before it ever runs in anger.

## Completed arc

| Slice           | Type         | Outcome                                                                                                                |
|-----------------|--------------|------------------------------------------------------------------------------------------------------------------------|
| C54-MULTI-A     | docs-only    | Policy locked: catalog identity (CountyId, SourceConnectionId, PacsRelease, SchemaVersionHash); ISOL-1..ISOL-4 binding. |
| C54-MULTI-B     | impl + tests | `PacsCatalogIdentity`, `IPacsSchemaCatalogSet`, `PacsSchemaCatalogSet`, `PacsCatalogSetEntry`. 15 tests.                |
| C54-MULTI-C     | impl + tests | `PacsCatalogManifestSharingHelper` (ShareConversion / SharePii / ShareExportedFk) + `PacsCatalogManifestShareReceipt`. 11 tests. |
| C54-MULTI-D     | impl + tests | `PacsSchemaIdentityCheckedReportDiff` + `PacsSchemaIdentityCheckedDiff` enforcing ISOL-4 at API surface. 10 tests.     |
| C54-MULTI-CLOSE | docs-only    | This handoff.                                                                                                          |

## Trusted state at closeout

```text
main commit                  : 533748ef5 (C54-MULTI-D merged)
Sync unit regression         : 389 / 389
catalog set                  : operational
manifest sharing helper      : operational
identity-checked diff        : operational
cross-county aggregation     : DEFERRED (waiting on multi-county scope)
consumer migration to set    : DEFERRED (waiting on consumer need)
workbook mutation            : none
PACS mutation                : none
```

## What the catalog set OWNS

- **Catalog identity.** `PacsCatalogIdentity` carries
  `(CountyId, SourceConnectionId, PacsRelease?, SchemaVersionHash)`.
  Primary key is the composite `(CountyId, SourceConnectionId)`.
- **Catalog-set lookup.** `IPacsSchemaCatalogSet.TryGetCatalog
  (countyId, sourceConnectionId)` returns a typed Miss on absence.
  No implicit-default surface.
- **Build-time uniqueness checks.** `PacsSchemaCatalogSet.BuildAsync`
  refuses duplicate primary keys and refuses duplicate manifest
  paths unless every colliding entry sets
  `AllowSharedManifestPath=true`.
- **Per-catalog independence.** Each catalog runs its own
  `PacsSchemaCatalog.BuildAsync` with its own engine pass and
  invariant report.
- **Vetted manifest sharing.** Three helper methods (one per
  manifest family) copy + format-validate + emit an audit-trail
  receipt with SHA-256 hashes of source and target bytes.
- **Identity-checked diff.** `PacsSchemaIdentityCheckedReportDiff
  .Compute` rejects diffs across catalog identities at the API
  surface, fail-closed.

## What the catalog set does NOT own

- **Implicit "current catalog" surface.** Per the policy's
  no-implicit-default rule, every consumer passes
  `(countyId, sourceConnectionId)` explicitly. Operators wanting a
  singleton-shaped runtime register exactly one catalog and pass
  its identity at lookup time. There is no "give me whatever
  catalog is around" API and there will never be one.
- **Hot-reload at runtime.** Catalogs are built once at startup
  (HG3 read-only at runtime). A future slice may add hot-reload;
  it isn't here.
- **Cross-county invariant aggregation.** Each catalog has its
  own report. The catalog set does NOT sum / aggregate /
  collate across catalogs. That's deferred (see below).
- **Consumer wiring.** Existing `IPacsSchemaCatalog` consumers
  (preflights, controllers, SyncAtlas dictionary loaders)
  continue to receive a singleton catalog instance via DI. The
  catalog-set is a parallel registration; nothing is migrated to
  it yet.
- **Cross-county content migration.** When the operator shares a
  manifest from Benton to Yakima via the C54-MULTI-C helper,
  the helper copies + validates wire format. Whether the
  manifest's table / column names exist in the target catalog
  is checked at the target's next `BuildAsync` (existing
  C50-CONV-B / C51-PII-B / C52-OVR-B catalog-membership checks).
  No automatic content rewriting.

## Hard guards verified end-to-end

The seven C48 hard guards (HG1 PII-free, HG2 county-agnostic at
the **record** level, HG3 read-only, HG4 versioned, HG5
conversion-aware, HG6 source-traceable, HG7 fail-closed) all
remain intact. C49-FK / C50-CONV / C51-PII / C52-OVR / C53-CONS
hard guards all remain intact.

The four C54-MULTI isolation rules are now operationally enforced
or structurally guaranteed:

| Rule        | Enforcement                                                                                                  |
|-------------|--------------------------------------------------------------------------------------------------------------|
| ISOL-1      | `PacsSchemaCatalogSet.BuildAsync` refuses cross-entry manifest path collisions unless every entry opts in.   |
| ISOL-2      | Each catalog runs its own `BuildAsync` with its own `InferDictionaries` pass — structurally independent.     |
| ISOL-3      | `TryGetCatalog` returns typed Miss on lookup miss; no fallback path exists in the API surface.               |
| ISOL-4      | `PacsSchemaIdentityCheckedReportDiff.Compute` rejects cross-identity diffs; per-catalog reports verified.    |

HG2 record-level county-agnostic preserved: `PacsTable`,
`PacsColumn`, `PacsDictionary` records still carry NO `CountyId`
field. The county scoping is at the catalog **instance** level,
not the record level. Records remain county-agnostic; instances
are county-scoped.

## Proof gates at completion

```text
- Build (TerraFusion.Sync)                           : green
- Sync unit regression                               : 389 / 389
- New tests delivered across the C54-MULTI family    : 46
  - C54-MULTI-B catalog-set tests                    : 15
  - C54-MULTI-C sharing-helper tests                 : 11
  - C54-MULTI-D identity-checked-diff tests          : 10
  - (cumulative 36 + 10 from C53-CONS-E intersection : 46)
- Workbook mutation                                  : none
- PACS mutation                                      : none
- HG2 record-level invariant                         : preserved
```

## Deferred new scope

These are NOT C54-MULTI follow-ons that the team forgot to do.
They are intentional deferrals gated on operational reality:

| Concern                              | Suggested prefix         | Status     | Gate to land                                                                                                                     |
|--------------------------------------|--------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------|
| Cross-county invariant aggregation   | `C54-MULTI-E-*`          | _deferred_ | Land when at least three counties are operationally in scope and a real audit dashboard needs the sum-of-errors surface.        |
| Per-consumer migration to set API    | `C54-MULTI-PROMOTE-*`    | _deferred_ | Land when an actual consumer (preflight, canonical-landing reader, SyncAtlas) needs to resolve catalogs by `(CountyId, SourceConnectionId)`. |
| Hot-reload of catalogs at runtime    | `C54-MULTI-RELOAD-*`     | _deferred_ | Land when the operator workflow demands rebuilding a single catalog without restarting the runtime. Not currently a need.       |

If a future agent finds themselves about to build cross-county
aggregation, runtime hot-reload, or consumer migration without an
operational reality requesting it — STOP. The C54-MULTI policy
explicitly named these as deferred-on-reality and the closure
handoff (this doc) reaffirms that gate.

## Single-county runtime guidance

Today's runtime registers exactly one catalog (Benton's Harris
PACS). All existing consumers continue to use the singleton
`IPacsSchemaCatalog` injection — no migration is required. The
catalog set is a parallel registration that exists for the future,
not a replacement for the current path.

When (if) Benton's deployment grows to two counties:

1. Operator registers a second `PacsCatalogSetEntry` with the new
   county's identity, source, and manifest paths.
2. Per ISOL-1, the operator either gives each county its own
   manifest paths (recommended) or sets `AllowSharedManifestPath
   =true` on both entries with audit receipts from
   `PacsCatalogManifestSharingHelper`.
3. Existing consumers continue to work against the singleton
   catalog until C54-MULTI-PROMOTE-* slices migrate them.
4. New consumers introduced after this point SHOULD resolve via
   `IPacsSchemaCatalogSet.TryGetCatalog` from day one.

## Cross-reference index

| Doc                                                                              | Family   | Purpose                                                                |
|----------------------------------------------------------------------------------|----------|------------------------------------------------------------------------|
| `pacs-schema-catalog-as-code-policy.md`                                          | C48-A    | Foundational catalog policy (HG1..HG7).                                |
| `pacs-schema-catalog-completion-handoff.md`                                      | C48-CLOSE| Master handoff for the catalog itself.                                 |
| `pacs-schema-foreign-key-inference-policy.md`                                    | C49-FK-A | FK inference policy (Declared / Exported / InferredByName).            |
| `pacs-schema-fk-consumer-migration-policy.md`                                    | C49-FK-C | FK preflight stance + Pass/Warn/Fail outcomes.                         |
| `pacs-schema-conversion-manifest-policy.md`                                      | C50-CONV | Conversion-era manifest (per-catalog).                                 |
| `pacs-schema-conversion-era-consumer-migration-policy.md`                        | C50-CONV-C| Era preflight stance + outcomes.                                      |
| `pacs-schema-pii-classification-manifest-policy.md`                              | C51-PII  | PII classification manifest (per-catalog).                             |
| `pacs-schema-pii-consumer-migration-policy.md`                                   | C51-PII-C| PII preflight stance + outcomes.                                       |
| `pacs-schema-exported-fk-override-manifest-policy.md`                            | C52-OVR  | Exported FK manifest (per-catalog).                                    |
| `pacs-schema-consistency-invariants-policy.md`                                   | C53-CONS | Invariant engine + report + artifact + diff.                           |
| `pacs-schema-multi-county-catalog-policy.md`                                     | C54-MULTI| Multi-county catalog set policy (this family's anchor doc).            |
| `pacs-schema-multi-county-catalog-completion-handoff.md`                         | C54-MULTI-CLOSE | THIS DOC.                                                       |

## What stays committed (forever)

- `PacsCatalogIdentity` record (binding shape; consumers may pin
  to it).
- `IPacsSchemaCatalogSet` interface contract (TryGetCatalog,
  Catalogs, Identities).
- `PacsCatalogSetEntry` record (the operator's build-input shape).
- `PacsCatalogManifestShareReceipt` record (audit-trail format).
- `PacsSchemaIdentityCheckedDiff` record (diff result wrapper).
- All four ISOL rules (ISOL-1..ISOL-4) — these are operationally
  enforced and tested; they do not relax even when the family is
  closed.
- All HG record-level invariants (HG1..HG7 + the C49-FK / C50-CONV
  / C51-PII / C52-OVR / C53-CONS additions).

## What stays operator-side (never committed)

- Real per-county manifests (conversion era, PII classification,
  exported FK override). Each county's manifest is operator-
  authored and operator-curated.
- Real `PacsCatalogIdentity` instances — those come from the
  operator's source-connection registration (e.g.,
  `SyncSourceConnection` rows).
- Audit receipts produced by `PacsCatalogManifestSharingHelper`.
  Operators decide where to file them.
- The decision of whether a second county is operationally in
  scope. The catalog set is ready; whether to use it is an
  operational decision, not an engineering one.

## Closure marker

The C54-MULTI family is sealed for current scope. Re-opening
requires either:

1. A second county actually entering operational scope (lands
   `C54-MULTI-PROMOTE-A` against a real consumer that needs
   set-resolution).
2. A third county actually entering scope (lands `C54-MULTI-E-A`
   policy doc for cross-county aggregation).
3. An ISOL rule discovered to be incorrect through operational
   evidence (lands a `C54-MULTI-FIX-*` corrigendum slice — same
   shape as C48-FIX / C50-CONV-A1).

Anything else is speculative expansion and should not be promoted
without explicit operator direction.
