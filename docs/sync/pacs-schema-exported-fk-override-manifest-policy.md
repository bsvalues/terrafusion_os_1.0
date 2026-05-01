# PACS Schema Catalog — Exported FK Override Manifest Policy

**Slice:** C52-OVR-A (docs-only — first slice of the C52-OVR
family. Defines the contract for an operator-supplied Exported-FK
override manifest before any implementation. C52-OVR-B will land
the parser + catalog wiring + tests against this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C52-OVR-*`).
**Status:** policy locked; C52-OVR-B implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-new-scope index that names this slice.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` — C49-FK-A.
  This slice realizes the **Exported FK promotion path** that
  C49-FK-A reserved but did not implement. The
  `PacsForeignKeyConfidence.Exported` enum value and the
  `PacsForeignKeySource.ExportFile` enum value already ship from
  C49-FK-B; this slice specifies the file format the operator
  authors and the parser that loads it.
- `docs/sync/pacs-schema-conversion-manifest-policy.md` — C50-CONV-A.
  Structural reference: same operator-supplied / explicit-stance /
  HG6-source-traceable pattern.
- `docs/sync/pacs-schema-pii-classification-manifest-policy.md` —
  C51-PII-A. Structural reference.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

C49-FK-A explicitly named two FK promotion mechanisms:

1. **Engine-declared FKs** (`PacsForeignKeyConfidence.Declared`) —
   the database engine's own FK constraints, surfaced via
   `INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS`. C49-FK-B wires
   these end to end.
2. **Operator-supplied Exported FKs** (`PacsForeignKeyConfidence
   .Exported`) — FK edges the operator declares in a manifest file,
   for use when the engine doesn't declare the constraint but the
   relationship is real and the operator has audited it. C49-FK-A
   reserved the enum value and described the promotion path:
   > "The next catalog build picks it up as `Exported` confidence.
   >  Production code consults `TryGetDeclaredForeignKeysFor` and
   >  sees it."
   But C49-FK-B did NOT ship the file format or the parser. The
   enum value exists; the path to populate it does not.

This slice closes that gap. Three concrete operational benefits:

- **Bridge engine-vs-reality drift.** Benton's PACS install has
  several places where an engine-declared FK doesn't exist but the
  semantic relationship does (e.g., the InferredByName edges
  C49-FK-B produces for `imprv.primary_use_cd → property_use`).
  The operator can review those edges, decide they're real, and
  promote them via this manifest — without modifying the engine
  schema (which Benton can't do, per the read-only constraint).

- **Bind dictionary references explicitly.** C48-F infers WHICH
  tables are dictionaries; the catalog still doesn't know WHICH
  `*_cd` columns FK-point at them unless the engine declares it.
  The operator can supply these edges directly, making
  dictionary-loader preflights and downstream comp readers
  authoritative without engine-schema changes.

- **Provide a programmatic upgrade path for InferredByName edges.**
  HG-FK-2 forbids InferredByName from driving runtime decisions.
  The Exported-FK manifest is the gate by which an operator
  reviews-and-promotes specific InferredByName edges into something
  consumers may treat as authoritative.

The manifest does NOT mutate PACS, drop catalog rows, or override
existing engine-Declared edges. It is purely **additive**: edges
the manifest declares are added at `Exported` confidence; engine-
declared edges with the same shape are preserved at `Declared`
confidence and take precedence in catalog lookups. Same posture
as C50-CONV / C51-PII manifests: catalog stays honest, code gets
explicit.

## Exported FK data model (logical shape)

The `PacsForeignKey` and `PacsForeignKeyConfidence` records already
ship from C49-FK-B. C52-OVR-B does NOT add new types — it adds the
manifest layer that produces records of those existing types with
`Confidence = Exported` and `ProvenanceSource = ExportFile`.

### `PacsExportedFkManifest`

```text
- ManifestPath        : string             (HG6 source-traceable)
- ManifestVersion     : string             (semver-shaped, operator-controlled)
- ManifestEvent       : string             (e.g., "Benton-2026-FK-promotion-pass-1")
- Edges               : ordered list<PacsExportedFkEntry>
```

### `PacsExportedFkEntry`

```text
- ConstraintName      : string             (operator-supplied; required)
- SourceTable         : string             (case-sensitive match)
- SourceColumns       : ordered list<string> (composite-aware; ordinal-stable)
- TargetTable         : string             (case-sensitive match)
- TargetColumns       : ordered list<string> (composite-aware; same arity as SourceColumns)
- Reason              : string             (one-line operator note; required)
- AuditedBy           : string?            (optional operator name / signature)
- AuditedOnUtc        : string?            (optional ISO-8601 UTC; for audit posture)
```

Per HG-FK-2, the operator's act of writing the entry IS the
promotion gate. C52-OVR-B's parser does not validate that the edge
"makes sense" beyond shape checks; the operator's review is the
authority.

## Hard guards

The seven C48 hard guards continue to apply. The two C49-FK guards
(HG-FK-1 declared-vs-all-split; HG-FK-2 inferred-advisory-only)
continue to apply. The three C50-CONV guards and three C51-PII
guards continue to apply within their respective domains. C52-OVR-A
adds three additional guards specific to Exported-FK overrides.

### Hard Guard OVR-1 — manifests are operator-supplied, never inferred

There is no auto-discovery path for Exported FKs. The catalog
loads override edges only from explicitly-named manifest files
that the operator has curated.

C52-OVR-B's parser MUST NOT:

- Walk the filesystem looking for manifest-shaped files.
- Glob across multiple manifest locations.
- Auto-promote InferredByName edges from the live catalog into
  Exported. Promotion is an explicit operator act that produces a
  manifest entry; the catalog never promotes itself.
- Read engine-side hints (extended properties, comments) as
  promotion signals.

Why: the entire point of the Exported-confidence layer is operator
audit posture. If the catalog could auto-promote, the operator's
review would be performative and the audit trail would be
worthless. The simplest correct posture is: operator writes it,
catalog reads it.

### Hard Guard OVR-2 — Exported edges NEVER override engine-Declared edges

When an Exported-FK manifest entry names the same
`(SourceTable, SourceColumns, TargetTable, TargetColumns)` shape
as an engine-Declared edge already present in the catalog, the
catalog MUST keep the Declared edge and either:

(a) Drop the Exported entry silently (preferred — Declared is
    strictly stronger), or
(b) Surface a warning during catalog build and drop the Exported
    entry (acceptable; helps the operator clean up redundant
    manifest entries).

C52-OVR-B will pick (a) or (b); both honor HG-OVR-2's invariant
that engine reality wins.

The catalog MUST NOT:

- Replace a Declared edge with an Exported one.
- Hide the Declared edge from `TryGetDeclaredForeignKeysFor`
  because the manifest also names it.
- Allow an Exported entry to claim engine confidence by setting
  `ProvenanceSource = InformationSchema` etc. (the parser fixes
  ProvenanceSource to ExportFile regardless of file content).

Why: the engine schema is the source of truth for engine-enforced
constraints. An Exported edge claiming to override that would
silently weaken the strictest layer of FK metadata, which is the
opposite of HG7 (fail-closed) discipline. The Exported layer adds
to what the engine declares; it does not subtract.

### Hard Guard OVR-3 — manifest absence is explicit, not implied

Catalog-build callers MUST decide explicitly whether to require an
Exported-FK manifest, mirroring HG-FK-3 / HG-CONV-3 / HG-PII-3:

- `LivePacsSchemaSourceOptions.RequireExportedFkManifest = true`:
  catalog build fails closed if no manifest path is configured or
  if the manifest fails to parse.
- `LivePacsSchemaSourceOptions.RequireExportedFkManifest = false`:
  catalog builds successfully without a manifest; the catalog
  contains only engine-Declared and InferredByName edges.

There is no default. The flag MUST be set explicitly at the call
site. Backwards-compat bridge: when `ExportedFkManifestPath` is
null, the catalog continues to behave exactly as C49-FK-B
established. Engaging the manifest path adds Exported edges; it
never subtracts.

## Allowed sources

C52-OVR-B's parser MUST NOT reach beyond these declared sources.

### `OperatorManifestFile` source

A JSON or YAML file at a path explicitly configured via
`LivePacsSchemaSourceOptions.ExportedFkManifestPath`. No glob, no
search.

Suggested file layout (final shape decided by C52-OVR-B; this is
the binding contract for the SHAPE):

```json
{
  "manifestVersion": "1.0.0",
  "manifestEvent": "Benton-2026-FK-promotion-pass-1",
  "edges": [
    {
      "constraintName": "EXP_imprv_primary_use_cd_property_use",
      "sourceTable": "imprv",
      "sourceColumns": ["primary_use_cd"],
      "targetTable": "property_use",
      "targetColumns": ["property_use_cd"],
      "reason": "Engine does not declare this FK on Benton, but the column is bound to property_use semantically; reviewed against C49-FK-F advisory state.",
      "auditedBy": "operator@benton.wa",
      "auditedOnUtc": "2026-04-30T12:00:00Z"
    }
  ]
}
```

### Disallowed sources (out of scope; never to be added)

- INFORMATION_SCHEMA.* extended properties (per HG-OVR-1).
- Engine-side comment fields as promotion signals (per HG-OVR-1).
- Cross-county imported manifests (deferred to C52-OVR-D).
- Auto-derived from InferredByName edges (per HG-OVR-1).

## Out of scope (deferred)

The following are explicitly NOT in scope for C52-OVR-A or
C52-OVR-B. Each gets its own future slice:

### C52-OVR-C — additional override types

Override layers for catalog metadata BEYOND FK edges:

- Dictionary classification override (add to / remove from the
  C48-F-inferred set).
- Identity-tuple override (when engine PK detection misses a
  composite).
- Column-type override (when declared type is misleading).
- Table exclusion (operator marks a table as catalog-irrelevant
  even if the engine has it).

Each of these is its own design call and gets its own slice.

### C52-OVR-D — cross-county manifest sharing

A central registry where counties can share Exported-FK manifests
they've authored (e.g., "every Harris PACS install lacks the
imprv.primary_use_cd → property_use FK, so here's the Exported
edge"). Out of scope until at least two counties have authored
manifests.

### C52-OVR-E — manifest-authoring tooling

A SyncAtlas command that helps the operator author the initial
manifest by surfacing every InferredByName edge and asking whether
to promote it. Produces operator review material, not catalog
truth.

### C52-OVR-F — runtime override invalidation

A signal that an Exported edge has been disproven (e.g., the
target table got renamed). Currently no — operator updates the
manifest manually. C52-OVR-F deferred until a real case surfaces.

## C52-OVR-B implementation contract

C52-OVR-B is the next slice in this family. Its scope:

1. **Add `PacsExportedFkManifest` and `PacsExportedFkEntry` records**
   in `backend/src/TerraFusion.Sync/Workbench/Schema/`. Use the
   existing `PacsForeignKey` and confidence/source enums; do not
   add new enum values.
2. **Add `LivePacsSchemaSourceOptions.ExportedFkManifestPath` and
   `LivePacsSchemaSourceOptions.RequireExportedFkManifest`**.
3. **Add `IPacsExportedFkManifestSource` + default JSON
   implementation**, mirroring the structure of
   `IPacsConversionManifestSource` from C50-CONV-B and
   `IPacsPiiManifestSource` from C51-PII-B.
4. **Wire into `LivePacsSchemaSource.ReadAsync`**: load manifest
   (when configured), translate each entry into a `PacsForeignKey`
   record with `Confidence = Exported` and `ProvenanceSource =
   ExportFile`, then merge into the FK list. Apply HG-OVR-2:
   when an Exported entry shape-matches an existing Declared edge,
   drop the Exported entry (option (a)); preserve the Declared
   edge intact.
5. **Validate at parse time**: empty Reason rejected (audit-trail
   integrity), duplicate ConstraintName rejected, source/target
   arity mismatch rejected, empty source/target lists rejected,
   missing required fields rejected.
6. **Surface engagement state** via the catalog version's
   `SourceFileHashes` map (add an `exported-fk-manifest@<path>` key
   when engaged) so consumers can tell engaged from un-engaged.
   (This avoids extending `IPacsSchemaCatalog` with another
   property; the version map already exists for this purpose.)
7. **Unit tests**: at minimum
   - manifest absent + RequireExportedFkManifest=false → catalog
     unchanged from C49-FK-B baseline.
   - manifest absent + RequireExportedFkManifest=true → build fails.
   - manifest with valid entry → entry surfaces in catalog with
     Exported confidence.
   - manifest entry shape-matches a Declared edge → Declared
     preserved, Exported entry dropped (HG-OVR-2).
   - manifest with empty Reason → fails (audit integrity).
   - manifest with duplicate ConstraintName → fails.
   - manifest with source/target arity mismatch → fails.
   - manifest entry surfaces in `TryGetDeclaredForeignKeysFor`
     (per HG-FK-1, Declared+Exported are queryable together).
8. **No live PACS smoke required**. Hand-authored fixture sufficient.
9. **No consumer migration**. Existing FK preflights (C49-FK-D) and
   PROMOTE arc consumers automatically benefit because the manifest
   adds entries to `TryGetDeclaredForeignKeysFor`'s result set —
   no consumer-side change needed. This is the cleanest possible
   integration: by treating Exported edges as a queryable source
   alongside Declared, every existing FK consumer sees them
   without per-consumer migration.

## Acceptance for C52-OVR-A

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-exported-fk-override-manifest-policy.md`.
- [x] Three hard guards (OVR-1, OVR-2, OVR-3) stated explicitly.
- [x] Data model uses existing C49-FK-B types verbatim (no new enums).
- [x] Allowed-sources list closed.
- [x] Deferred-scope list enumerated.
- [x] Cross-references to C49-FK-A, C50-CONV-A1, C51-PII-A, C48-A.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C52-OVR-A is not a manifest. It specifies the shape; the operator
  authors the file later (helped by C52-OVR-E tooling, deferred).
- C52-OVR-A does not authorize any new consumer migration. Existing
  FK consumers benefit automatically when C52-OVR-B lands; that's
  the design.
- C52-OVR-A does not extend `IPacsSchemaCatalog` with new query
  surfaces. Exported edges flow through the existing
  `TryGetDeclaredForeignKeysFor` path.
- C52-OVR-A does not change `PacsForeignKey`, `PacsForeignKeyConfidence`,
  or `PacsForeignKeySource`. The shipped C49-FK-B types are the
  binding shape.
- C52-OVR-A does not retire HG-FK-2 (InferredByName advisory-only).
  An InferredByName edge that names the same shape as an Exported
  entry continues to be excluded from the declared lookup path;
  the Exported entry is what consumers see.

## Open questions (deferred to C52-OVR-B)

- Should the parser warn when an Exported entry shape-matches an
  existing InferredByName edge (i.e., the operator just promoted
  an inference)? Probably yes — surfaces "this is an explicit
  promotion" in the build log. C52-OVR-B may add.
- Should the manifest support `comment-out` / `disable` entries
  for edges the operator wants suppressed for review? Currently
  no — the manifest is additive only. C52-OVR-C may extend.
- Should AuditedBy / AuditedOnUtc be required rather than optional?
  Currently optional to keep the initial manifest authoring
  friction-free. C52-OVR-B may strengthen.

## Slice ledger note

Updates the C52-OVR arc:

- C52-OVR-A   : THIS DOC — policy lock.
- C52-OVR-B   : pending — parser + catalog wiring + tests.
- C52-OVR-C   : deferred — non-FK override types.
- C52-OVR-D   : deferred — cross-county manifest sharing.
- C52-OVR-E   : deferred — authoring tool.
- C52-OVR-F   : deferred — runtime invalidation signal.

Promotion happens slice-by-slice; nothing in C52-OVR-A should be
read as authorizing C52-OVR-B or any later slice until each lands.
