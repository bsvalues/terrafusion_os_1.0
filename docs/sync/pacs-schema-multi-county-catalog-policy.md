# PACS Schema Catalog — Multi-County Catalog Set Policy

**Slice:** C54-MULTI-A (docs-only — first slice of the C54-MULTI
family. Defines how multiple county PACS schema catalogs coexist
safely in a single Sync runtime before any implementation.
C54-MULTI-B will land the catalog-set + lookup APIs + tests
against this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C54-MULTI-*`).
**Status:** policy locked; C54-MULTI-B implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-scope index. C54-MULTI-* row updated
  by this slice from "deferred" to "C54-MULTI-A landed."
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A. HG2
  county-agnostic at the **record** level continues to apply; this
  slice adds county-scoping at the **catalog instance** level.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` —
  C49-FK-A. FK metadata is per-catalog.
- `docs/sync/pacs-schema-conversion-manifest-policy.md` —
  C50-CONV-A. Conversion-era manifest is per-catalog.
- `docs/sync/pacs-schema-pii-classification-manifest-policy.md` —
  C51-PII-A. PII manifest is per-catalog.
- `docs/sync/pacs-schema-exported-fk-override-manifest-policy.md` —
  C52-OVR-A. Exported FK manifest is per-catalog.
- `docs/sync/pacs-schema-consistency-invariants-policy.md` —
  C53-CONS-A. Invariant report is per-catalog.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

The C48 → C53 metadata-honesty pipeline is complete for a single
county. Benton's Harris PACS catalog is proven end-to-end:
schema introspection, dictionary inference, FK edges (declared +
exported + inferred), conversion-era and PII manifests, three
preflight services, invariant engine + report + artifact + diff.
Every operator manifest is currently de-facto Benton-shaped because
the runtime is singleton-shaped: one catalog, one set of manifests,
one invariant report.

The next operationally-useful step is multi-county. TerraFusion
Sync's value proposition is "let an assessor pull canonical data
from a legacy CAMA database into TerraFusion DB"; that proposition
generalizes across counties as long as each county's catalog stays
distinct from every other.

Three concrete failure modes the multi-county catalog set
prevents:

- **Manifest cross-pollination.** Benton's PII manifest names
  `chg_of_owner.grantor_cv` as Direct PII. If Yakima loaded their
  catalog and Benton's PII manifest was the only one in the
  runtime, Yakima's `chg_of_owner.grantor_cv` would inherit
  Benton's classification by accident — even if Yakima's auditor
  hasn't yet reviewed Yakima's columns. The fix is to scope the
  manifest to (county, source-connection); a manifest authored
  for Benton MUST NOT silently apply to Yakima.

- **FK override cross-pollination.** Benton's Exported FK manifest
  promotes `imprv.primary_use_cd → property_use` because Benton's
  schema has the inferred edge but no engine constraint. Yakima
  may have the same column name but a different (or absent)
  semantic relationship. Auto-applying Benton's promotion to
  Yakima would silently weaken Yakima's HG-FK-2
  (operator-audit-required) gate.

- **Catalog version mixup.** A canonical-landing reader pinned to
  Benton's `PacsSchemaVersion` SourceFileHashes set runs against
  the wrong catalog if the runtime hands it any other county's
  catalog instance. HG4 (versioned) demands every consumer pin to
  a specific catalog identity; the catalog set is the surface that
  makes that pin checkable.

The fix is structural: a `PacsSchemaCatalogSet` that holds N
catalog instances keyed by (county-id, source-connection-id),
where each instance is the existing `IPacsSchemaCatalog` shape
unchanged. Each catalog still owns its own manifests, FKs,
dictionaries, invariant report, and version stamp. Lookup is
explicit; there is no implicit default.

## Catalog identity (binding)

Every catalog instance carries an explicit identity tuple. C54-
MULTI-B will materialize this; the binding contract is:

```text
PacsCatalogIdentity:
  CountyId            : string  (operator-supplied; non-empty;
                                 case-sensitive; e.g. "WA-Benton")
  SourceConnectionId  : string  (operator-supplied; references a
                                 SyncSourceConnection row that names
                                 the legacy DB; non-empty)
  PacsRelease         : string? (PACS vendor release label when
                                 known; null permitted; mirrors
                                 PacsSchemaVersion.PacsRelease)
  SchemaVersionHash   : string  (deterministic hash of the catalog's
                                 PacsSchemaVersion.SourceFileHashes
                                 + manifest stamps; used for
                                 quick-equality checks across
                                 lookups)
```

`(CountyId, SourceConnectionId)` is the catalog set's primary key.
Two catalog instances MUST NOT share the same `(CountyId,
SourceConnectionId)` pair within one catalog set.

The optional `PacsRelease` and required `SchemaVersionHash` are
secondary identity surfaces — they do not key the lookup, but they
let consumers verify "I'm holding the catalog instance I think I
am" before acting.

### Why CountyId AND SourceConnectionId, not just one or the other

A single county may have multiple PACS source connections during
a real conversion or migration: a "live" connection feeding the
production canonical landing, and a "staging" connection feeding
test runs that the operator uses to verify a migration before
flipping. Both are the same county but different source-of-truth.
Keying on `SourceConnectionId` alone would let the staging catalog
silently replace the live one in DI. Keying on `CountyId` alone
would forbid the staging shadow entirely. Composite key supports
both realities.

## Catalog set behavior (binding)

C54-MULTI-B implements a `PacsSchemaCatalogSet` interface. Its
binding shape:

```csharp
public interface IPacsSchemaCatalogSet
{
    /// <summary>
    /// Returns the catalog instance for the given identity.
    /// HG7 fail-closed: returns a typed Miss result when no
    /// matching instance is registered. Never returns null;
    /// never throws on a clean miss.
    /// </summary>
    PacsSchemaLookupResult<IPacsSchemaCatalog> TryGetCatalog(
        string countyId,
        string sourceConnectionId);

    /// <summary>
    /// All catalog instances in the set. Read-only; safe to
    /// enumerate concurrently. No implicit ordering across calls
    /// beyond stability within one call.
    /// </summary>
    IReadOnlyCollection<IPacsSchemaCatalog> Catalogs { get; }

    /// <summary>
    /// All registered identities. Diagnostic surface for
    /// "what catalogs am I holding?" queries.
    /// </summary>
    IReadOnlyCollection<PacsCatalogIdentity> Identities { get; }
}
```

### No implicit default

The catalog set MUST NOT expose a "current" / "default" /
"singleton" catalog. Every consumer that needs a catalog MUST pass
`(countyId, sourceConnectionId)` explicitly. This is the
operational analog of HG-FK-3 / HG-CONV-3 / HG-PII-3 explicit-or-
error: a multi-county runtime where any consumer can implicitly
get "the" catalog is one wrong DI swap away from cross-county
data leak.

The narrow exception: a local dev environment may configure a
single catalog and expose it as the only one in the set. Consumers
still pass `(countyId, sourceConnectionId)`; the lookup just
returns the only instance because identity matches. There is no
"give me whatever catalog is around" API.

### Loading

`PacsSchemaCatalogSet` is constructed at startup from a list of
`(IPacsSchemaSource, PacsCatalogIdentity)` pairs. Each pair runs
through `PacsSchemaCatalog.BuildAsync` independently — meaning
each catalog gets its own engine pass, its own invariant report,
its own version stamp, and its own manifest engagement state.

C54-MULTI-B may add a `IPacsSchemaCatalogSetBuilder` registration
helper for DI integration; the binding contract is just that the
set is built once at startup (HG3 read-only at runtime).

## Manifest scoping (binding)

All operator manifests are scoped to one catalog instance.

| Manifest                     | Defining slice | Scope                                                              |
|------------------------------|----------------|--------------------------------------------------------------------|
| Conversion-era manifest      | C50-CONV-B     | Per-catalog (one manifest path per catalog identity).              |
| PII classification manifest  | C51-PII-B      | Per-catalog.                                                       |
| Exported FK override manifest| C52-OVR-B      | Per-catalog.                                                       |

This is enforced by structure: each manifest path is part of the
`LivePacsSchemaSourceOptions` instance that built the catalog. Two
catalogs in the same set may engage different manifests, no
manifests, or even the same manifest (when the operator has
explicitly copied it cross-county and revalidated — see Isolation
rules below).

The catalog set itself does NOT hold any manifests. It holds
catalog instances; each instance holds its own manifest state via
the existing C50/C51/C52 surfaces (`PacsSchemaCatalog.PiiManifest
Engaged`, `PacsSchemaVersion.ConversionManifestHash`, the FK
manifest's stamp in `SourceFileHashes`).

## Isolation rules (binding)

These are the load-bearing rules of this slice. They protect
against the three failure modes named in "Why this slice."

### ISOL-1 — No cross-county manifest reuse without explicit copy + revalidate

An operator who wants to reuse a Benton-authored manifest for
Yakima MUST:

1. Copy the manifest file to a Yakima-scoped path.
2. Author Yakima's `LivePacsSchemaSourceOptions` to point at the
   Yakima-scoped path.
3. Re-run catalog build for Yakima — the engine validates the
   manifest against Yakima's catalog (C51-PII-B's `TableExhaustive
   Flags` against catalog table list, C52-OVR-B's source/target
   table-and-column existence, etc.).

The runtime MUST NOT auto-share a manifest path across catalogs.
The catalog set's loader MUST refuse a configuration where two
catalog identities point at the same manifest path unless an
explicit `AllowSharedManifestPath = true` flag is set per-pair (a
future C54-MULTI-C helper may automate audit-friendly sharing;
out of scope for C54-MULTI-A and B).

### ISOL-2 — No cross-county dictionary inference reuse

C48-F dictionary inference runs per catalog. Two catalogs in the
same set produce independent inferred dictionary lists. A
dictionary that exists in Benton's catalog but not Yakima's MUST
NOT appear in Yakima's catalog — even if Yakima's PACS has the
same table name with a different shape. The C48-F heuristic is
shape-based per its own policy and applies to each catalog's
introspection independently.

### ISOL-3 — No stale-active fallback

The catalog set MUST NOT fall back to a "last-known-good" catalog
when a lookup misses. A miss is a miss; the consumer surfaces it
explicitly per HG7. There is no eventually-consistent "wait, the
catalog will show up" semantic.

The narrow exception: during catalog rebuild (when the operator
re-introspects a source), the set MAY hold the OLD catalog
instance for the same identity until the new build completes
successfully. On build success, the new instance replaces the old
atomically. On build failure, the OLD instance stays — same
HG7 fail-closed posture as the singleton catalog already has.

### ISOL-4 — Per-catalog invariant report and diff

Per the C53-CONS family:

- Each catalog instance has its own `InvariantReport`. The catalog
  set does NOT aggregate.
- `PacsSchemaInvariantReportArtifact.WriteAsync` writes one
  artifact per catalog identity. Operators choose distinct paths
  per identity (e.g., `evidence/invariant.<county-id>.json`).
- `PacsSchemaInvariantReportDiff.Compute` compares two reports
  from the **same catalog identity** only. Comparing reports
  across catalog identities is a defects-as-policy anti-pattern;
  the diff signature does not enforce same-identity (it operates
  on raw report records), but the policy here forbids it. A future
  C54-MULTI-D may add an identity-checked diff helper.

## C54-MULTI-B implementation contract

C54-MULTI-B is the next slice in this family. Its scope:

1. **Add `PacsCatalogIdentity` record** to
   `backend/src/TerraFusion.Sync/Workbench/Schema/`. Use the
   binding shape above verbatim.
2. **Add `IPacsSchemaCatalogSet` interface** + default
   implementation `PacsSchemaCatalogSet`. Backed by an
   `IReadOnlyDictionary<(string CountyId, string SourceConnectionId),
   IPacsSchemaCatalog>` with composite-key lookup.
3. **Add `IPacsSchemaCatalogSetBuilder`** for DI registration:
   accepts a list of `(IPacsSchemaSource, PacsCatalogIdentity)`
   pairs, runs `PacsSchemaCatalog.BuildAsync` for each, returns
   the assembled set.
4. **Refuse same-(CountyId, SourceConnectionId)** at build time
   per the catalog identity binding ("Two catalog instances MUST
   NOT share the same primary key").
5. **Refuse same-manifest-path** across two identities at build
   time per ISOL-1, unless an explicit per-pair allow flag is
   set.
6. **Wire engine pass per-catalog**: each catalog runs
   `PacsSchemaInvariantEngine` independently. Aggregate failure
   surface: if ANY catalog's build throws, the set's build throws
   the original exception with a wrapping note naming the
   identity that failed.
7. **Add `PacsCatalogIdentity` derivation** from a built catalog:
   a static helper that pulls
   `(CountyId, SourceConnectionId, PacsRelease, SchemaVersionHash)`
   from the source's options + the built catalog's version stamp
   so test fixtures don't have to construct the identity by hand.
8. **Unit tests** at minimum:
   - happy path: two catalogs in one set, lookup by each identity
     returns the right one.
   - lookup miss: identity not registered → typed Miss result.
   - duplicate identity at build time → throws.
   - duplicate manifest path without allow-shared → throws.
   - same county, different source-connection → both load.
   - lookup with empty / null identity components → typed Miss.
   - per-catalog invariant report: catalog A's report has no rows
     pointing to catalog B's tables.
   - report diff cross-catalog (same identity only) — see ISOL-4.
9. **No live PACS smoke required.** Hand-authored fixtures with
   two distinct introspector instances are sufficient.
10. **No consumer migration**. Existing `IPacsSchemaCatalog`
    consumers continue to receive a single catalog instance via
    DI; the catalog set is a parallel registration. Migrating
    consumers (controllers, preflights, etc.) to the catalog-set
    API is a future C54-MULTI-PROMOTE-* arc.

## Out of scope (deferred)

- **C54-MULTI-C** — manifest-sharing helper for vetted cross-county
  reuse (operator copies + revalidates + opts in per identity
  pair).
- **C54-MULTI-D** — identity-checked diff helper that throws when
  two reports come from different catalog identities.
- **C54-MULTI-E** — cross-county invariant aggregation surface
  (sum-of-errors across catalogs, useful for multi-tenant audit
  dashboards). Out of scope until at least three counties are in
  scope.
- **C54-MULTI-PROMOTE-*** — per-consumer migration to the
  catalog-set API. SyncAtlas, the FK / era / PII preflights, and
  the canonical-landing readers each get their own slice when
  multi-county becomes operationally needed.
- **Dynamic catalog reload at runtime** — currently every catalog
  is built once at startup (HG3 read-only at runtime). Hot-reload
  is its own design slice.

## Acceptance for C54-MULTI-A

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-multi-county-catalog-policy.md`.
- [x] Catalog identity tuple is binding (4 fields, primary key
  is `(CountyId, SourceConnectionId)`).
- [x] Catalog set behavior is binding: explicit lookup, no implicit
  default, no stale-active fallback.
- [x] Manifest scoping is binding (per-catalog).
- [x] Four isolation rules (ISOL-1..ISOL-4) stated explicitly.
- [x] C54-MULTI-B implementation contract enumerated (10 scope
  items + 8 minimum unit tests).
- [x] Cross-references to C48-A, C49-FK-A, C50-CONV-A, C51-PII-A,
  C52-OVR-A, C53-CONS-A, sync-boundary policy.
- [x] Handoff doc updated.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C54-MULTI-A is not the catalog set. It specifies the shape;
  C54-MULTI-B implements.
- C54-MULTI-A does not retire HG2 (county-agnostic at the record
  level). `PacsTable`, `PacsColumn`, `PacsDictionary` records still
  carry NO `CountyId` field. The county scoping is at the catalog
  *instance* level, not at the record level. Records are still
  county-agnostic; the instance is county-scoped.
- C54-MULTI-A does not change `PacsSchemaCatalog.BuildAsync`. The
  set wraps existing catalogs; the catalog itself is unchanged.
- C54-MULTI-A does not authorize any consumer migration. Existing
  consumers continue to work with a single catalog instance until
  the future C54-MULTI-PROMOTE-* arc migrates them.
- C54-MULTI-A does not introduce hot-reload. Catalogs are still
  built once at startup.
- C54-MULTI-A does not change the manifest formats (JSON structure
  defined by C50/C51/C52 stays). Only the per-catalog scoping is
  asserted explicitly.

## Open questions (deferred to C54-MULTI-B)

- Should the `PacsCatalogIdentity` record be `readonly record
  struct` or `record class`? Currently binding says the field set
  matters, not the runtime representation. C54-MULTI-B picks one;
  test fixtures handle either.
- Should `SchemaVersionHash` be SHA-256, FNV-1a, or some other
  hash? Currently binding says "deterministic"; C54-MULTI-B picks.
- Should the lookup support a fast `bool Contains(string countyId,
  string sourceConnectionId)` check or only the full
  `TryGetCatalog`? Currently binding says only `TryGetCatalog`;
  Contains is a future helper if a real consumer needs it.
- Should the catalog set carry an "overall coverage" summary
  (sum of per-catalog coverage)? Currently no — that's deferred
  to C54-MULTI-E.
- What's the right DI lifetime for `IPacsSchemaCatalogSet`?
  Singleton matches the catalog's existing singleton lifetime.
  C54-MULTI-B confirms.

## Slice ledger note

Updates the C54-MULTI arc:

- C54-MULTI-A   : THIS DOC — policy lock.
- C54-MULTI-B   : pending — catalog-set + builder + tests.
- C54-MULTI-C   : DONE — manifest-sharing helper landed
                 (PacsCatalogManifestSharingHelper static class +
                 PacsCatalogManifestShareReceipt audit record;
                 see Manifest sharing section below).
- C54-MULTI-D   : deferred — identity-checked diff helper.
- C54-MULTI-E   : deferred — cross-county aggregation surface.
- C54-MULTI-PROMOTE-* : deferred — per-consumer migration arc.

Promotion happens slice-by-slice; nothing in C54-MULTI-A should
be read as authorizing later slices until each lands.

## Manifest sharing (C54-MULTI-C)

ISOL-1 forbids cross-county manifest reuse without explicit copy +
revalidate. C54-MULTI-C lands the helper that automates the
audit-friendly version of that workflow.

### Helper API

`PacsCatalogManifestSharingHelper` is a static class with three
methods, one per manifest family:

```csharp
public static Task<PacsCatalogManifestShareReceipt> ShareConversionManifestAsync(
    string sourcePath, string targetPath,
    PacsCatalogIdentity sourceIdentity,
    PacsCatalogIdentity targetIdentity,
    CancellationToken ct);

public static Task<PacsCatalogManifestShareReceipt> SharePiiManifestAsync(...);

public static Task<PacsCatalogManifestShareReceipt> ShareExportedFkManifestAsync(...);
```

Each method:

1. Reads source bytes, computes SHA-256.
2. Creates target's parent directory if needed.
3. Writes source bytes to target path.
4. Reads target bytes, computes SHA-256.
5. Validates target via the appropriate `JsonFile*ManifestSource`
   (parses + format-checks; throws on malformed wire format).
6. Returns a `PacsCatalogManifestShareReceipt` audit record.

### Receipt shape

```text
PacsCatalogManifestShareReceipt:
  ManifestKind            : "conversion" / "pii" / "exported-fk"
  SourcePath              : absolute path of source manifest
  TargetPath              : absolute path of target manifest
  SourceSha256            : 64-char lowercase hex
  TargetSha256            : 64-char lowercase hex (equals source for clean copy)
  SharedAtUtc             : DateTime of copy completion
  SourceCatalogIdentity   : the catalog the manifest was authored for
  TargetCatalogIdentity   : the catalog the manifest is shared to
```

### Hard guards

- **Distinct paths required.** Source and target paths MUST
  differ. The helper throws `ArgumentException` otherwise — the
  whole point of sharing is having two files the catalogs can
  load independently.
- **Source must exist.** `FileNotFoundException` if the source
  path does not resolve to a file.
- **Format validation runs after copy.** Any malformed manifest
  throws BEFORE the receipt is returned. The operator sees the
  failure as "the share did not complete."
- **Helper does NOT enforce ISOL-1 by itself.** ISOL-1 is a
  catalog-set build-time concern (the
  `AllowSharedManifestPath` flag on `PacsCatalogSetEntry`). The
  receipt is the audit signal the operator files alongside their
  build-time opt-in. Sharing without setting the flag at next
  build will still throw at the catalog set level.
- **Cross-catalog content validation is the BUILD's job.** The
  helper validates wire format. Whether the manifest's table /
  column names exist in the target catalog is checked at the
  target's next `BuildAsync` (C50-CONV-B / C51-PII-B / C52-OVR-B
  catalog-membership checks).

### Out of scope

- Diffing two shared manifests (deferred indefinitely).
- Auto-rewriting the target manifest to remove entries that don't
  apply (e.g., dropping table entries that target catalog doesn't
  have). Operator manually edits before next build.
- Bidirectional sharing (sharing back from target to source). If
  needed, operator invokes the helper twice with reversed
  identities.
