# PACS Schema Catalog — PII-Classification Manifest Policy

**Slice:** C51-PII-A (docs-only — first slice of the C51-PII family.
Defines the contract for adding operator-curated PII-classification
metadata to the PACS schema catalog before any implementation.
C51-PII-B will land the parser + catalog wiring + tests against
this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C51-PII-*`). Extends the C48 catalog with
operator-supplied PII classifications; does NOT reopen C48.
**Status:** policy locked; C51-PII-B implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-new-scope index that names this slice.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A policy.
  HG1 (PII-free catalog itself) continues to apply: this doc adds
  metadata about underlying-table PII, NOT PII into the catalog.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` — C49-FK-A.
  Structural reference: same operator-supplied / never-inferred /
  explicit-stance pattern.
- `docs/sync/pacs-schema-conversion-manifest-policy.md` — C50-CONV-A
  + A1. Direct structural analog: this doc reuses C50-CONV's manifest
  shape, hard-guard pattern, and engagement model.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

C48 stores `PiiClassification` on every `PacsColumn` and `PacsTable`,
but every record currently defaults to `PiiClassification.None`.
The C48-B comment was explicit:

> "<see cref="PiiClassification.None"/> on every record. Operator-
>  supplied PII rules in a future slice will reclassify known
>  sensitive columns (e.g. `grantor_cv`, `owner_addr`)."

This slice opens that gate. Without it, the catalog is dishonest:
columns that obviously carry direct PII (grantor names, owner
addresses, agent contact info) report `None` and any downstream
reader that consults `PiiClassification` to decide whether to
surface them on a PII-free response shape gets the wrong answer.

Three concrete failure modes the manifest layer prevents:

- **Canonical landing row leakage.** A future canonical-landing
  reader that filters out `Direct` PII columns silently surfaces
  every column today because `None` is the answer for everything.
- **Operator audit gaps.** When the operator (or auditor) asks
  "which PACS columns does Sync classify as direct PII?", the
  answer today is "none, by default" — true but useless.
- **Cross-county sharing risk.** If TerraFusion ever ships its
  canonical-landing layer to a county that doesn't pre-validate
  responses, an un-classified `grantor_cv` column flows to whoever
  the response is for.

The fix is operator-curated, not heuristic: PACS schemas are
small enough (~2229 tables, ~32750 columns on Benton's install)
that a human can pass once over the column list and tag the
sensitive ones. The manifest captures that pass and makes it
queryable.

The manifest does NOT mutate PACS, drop catalog rows, or block
loaders. It is a metadata layer the catalog carries and that
consumers may consult, in line with the "catalog stays honest,
code gets explicit" principle of C48-A and the C50-CONV family.

## PII classification data model (logical shape)

C51-PII-B materializes the concrete records. The shape below is
the binding contract.

### `PiiClassification` (shipped from C48-B; not redefined here)

The enum already exists at
`backend/src/TerraFusion.Sync/Workbench/Schema/PiiClassification.cs`:

```text
- None      = 0  : column carries no personal identifying
                   information by itself or in combination. Safe
                   for canonical landing. Default for un-classified
                   catalog items in the C48-B legacy state.
- Indirect  = 1  : column does not itself identify a person but in
                   combination with other PACS columns could (e.g.
                   parcel-id-on-property-tied-to-owner-name).
                   Readers MUST consult policy before surfacing.
- Direct    = 2  : column directly identifies a person (grantor,
                   grantee, owner names, mailing addresses, agent
                   contact info, etc.). Readers MUST NOT surface
                   on PII-free response shapes.
```

C51-PII-B does NOT add a new enum. It adds the manifest layer that
lets the operator assign one of the three values above to each
catalog item explicitly, and wires the catalog to apply those
assignments at build time.

### `PacsPiiManifest`

```text
- ManifestPath        : string             (HG6 source-traceable)
- ManifestVersion     : string             (semver-shaped, operator-controlled)
- ManifestEvent       : string             (e.g., "Benton-2026-PACS-PII-tagging-pass-1")
- TableExhaustiveFlags : ordered set<string>  (table names where the operator asserts the column entries
                                               below cover EVERY column on this table — see HG-PII-2)
- TableEntries        : ordered list<PacsPiiTableEntry>
- ColumnEntries       : ordered list<PacsPiiColumnEntry>
```

### `PacsPiiTableEntry`

```text
- TableName           : string
- Classification      : PiiClassification  (None / Indirect / Direct)
- Reason              : string             (one-line operator note; required)
```

### `PacsPiiColumnEntry`

```text
- TableName           : string
- ColumnName          : string
- Classification      : PiiClassification  (None / Indirect / Direct)
- Reason              : string             (one-line operator note; required)
```

The manifest is **operator-curated**, never inferred. There is no
heuristic equivalent of C48-F or C49-FK's `InferredByName`. Inferring
PII from column-name patterns alone (e.g., "any column containing
`owner` or `grantor`") would miss real-world cases (a parcel
metadata column named `current_holder_id` is direct PII despite
having no `owner` substring) and false-positive on innocent ones
(`group_owner_id` referring to a tax-group owning agency, not a
person). Per HG-PII-1, the only valid sources are operator-supplied
manifests.

## Hard guards

The seven C48 hard guards continue to apply (HG1 PII-free, HG2
county-agnostic, HG3 read-only, HG4 versioned, HG5 conversion-
aware, HG6 source-traceable, HG7 fail-closed). The two C49-FK
guards (HG-FK-1 / HG-FK-2) and the three C50-CONV guards
(HG-CONV-1 / 2 / 3) continue to apply within their respective
domains. C51-PII-A adds three additional guards specific to PII
metadata.

### Hard Guard PII-1 — manifests are operator-supplied, never inferred

There is no auto-discovery path for PII classification. The
catalog loads PII metadata only from explicitly-named manifest
files that the operator has curated.

C51-PII-B's parser MUST NOT:

- Walk the filesystem looking for manifest-shaped files.
- Glob across multiple manifest locations.
- Infer classification from column-name patterns
  (no `owner_*` / `grantor_*` / `addr_*` heuristic).
- Read SQL Server `sys.columns` extended properties or any other
  live-DB signal as a proxy for "this column is sensitive."
- Consult third-party data-classification services / cloud-native
  scanners.

Why: PII classification has the most asymmetric blast radius of
any catalog metadata. A wrong "None" tag on a Direct column leaks
PII downstream silently. A wrong "Direct" tag on a None column
hides safe data behind unnecessary PII gates. Both are bad, but
the first is unrecoverable. Heuristic mis-tagging at scale, even
if 99% accurate, produces tens of leaked columns. The simplest
correct posture is: operator writes it, catalog reads it.

### Hard Guard PII-2 — un-annotated coverage requires explicit exhaustiveness

Unlike conversion era (where un-annotated columns receive the
sentinel `Unknown` per HG-CONV-2), the PII enum has no Unknown
value. C51-PII-A introduces an alternative discipline: the manifest
declares **per-table exhaustiveness**.

Operator option (a): list a table in `TableExhaustiveFlags`. This
asserts: "every column on this table that is NOT in `ColumnEntries`
is `None`." Any column added to PACS after the manifest was
authored will, at the next catalog build, be reported by C51-PII-B
as a manifest-coverage failure and (per the C51-PII-C consumer
policy, when it lands) cause RequireExhaustivePiiCoverage stance
callers to Fail.

Operator option (b): omit the table from `TableExhaustiveFlags`.
Un-annotated columns on this table receive the C48-B legacy default
(`None`), but no exhaustiveness assertion is made; consumers that
need exhaustive coverage MUST fail closed for this table.

The TableExhaustiveFlags set MAY name tables that have no entries
in `ColumnEntries` — that's the operator declaring "every column
on this table is `None`, no exceptions." This is HG-PII-2's most
important shape: it makes the absence-of-PII statement queryable.

The manifest loader MUST validate that a table named in
`TableExhaustiveFlags` actually exists in the catalog (else HG7
fail-closed). It MUST NOT validate that every column on the table
has been seen in `ColumnEntries` (those are conservatively None
by exhaustiveness, not required entries).

### Hard Guard PII-3 — manifest absence is explicit, not implied

Catalog-build callers MUST decide explicitly whether to require a
manifest, mirroring HG-CONV-3:

- `LivePacsSchemaSourceOptions.RequirePiiManifest = true`:
  catalog build fails closed if no manifest path is configured or
  if the manifest fails to parse. This is the production posture
  for any deployment where canonical-landing readers run.
- `LivePacsSchemaSourceOptions.RequirePiiManifest = false`:
  catalog builds successfully without a manifest; every column and
  table receives `Classification = None` (the C48-B legacy
  default). Consumers that depend on PII metadata see `None`
  everywhere and MUST surface that as a failure when their stance
  requires explicit classification — they MUST NOT silently treat
  `None` as "verified safe by operator."

There is no default. The flag MUST be set explicitly at the call
site. Same posture as HG-FK-3 and HG-CONV-3: explicit-or-error.

For backwards compatibility with C48-B / C49-FK / C50-CONV call
sites that have not engaged the PII manifest layer yet, C51-PII-B
will preserve the C48-B `None` default when `PiiManifestPath` is
null. Engaging the manifest path triggers strict HG-PII-2 / 3
behavior. Same backwards-compat bridge pattern as C50-CONV-B.

## Allowed sources

C51-PII-B's parser MUST NOT reach beyond these declared sources.

### `OperatorManifestFile` source

A JSON or YAML file at a path explicitly configured via
`LivePacsSchemaSourceOptions.PiiManifestPath`. No glob, no search.
The path is HG6-source-traceable.

Suggested file layout (final shape decided by C51-PII-B; this is
the binding contract for the SHAPE):

```json
{
  "manifestVersion": "1.0.0",
  "manifestEvent": "Benton-2026-PACS-PII-tagging-pass-1",
  "tableExhaustive": [
    "imprv_det_class",
    "imprv_det_meth",
    "land_soil"
  ],
  "tables": [
    { "name": "owner",          "classification": "Direct",   "reason": "Owner names + mailing addresses." },
    { "name": "agent",          "classification": "Direct",   "reason": "Agent personal contact info." }
  ],
  "columns": [
    { "table": "chg_of_owner",  "column": "grantor_cv",  "classification": "Direct",
      "reason": "Grantor full name from deed." },
    { "table": "chg_of_owner",  "column": "grantee_cv",  "classification": "Direct",
      "reason": "Grantee full name from deed." },
    { "table": "property_val",  "column": "prop_id",     "classification": "Indirect",
      "reason": "Parcel ID; combined with owner table reveals identity." }
  ]
}
```

### Disallowed sources (out of scope; never to be added)

- INFORMATION_SCHEMA / sys.columns: no PII signal in column metadata.
- Live row sampling: VIOLATES HG1 (catalog itself stays PII-free).
  The catalog never reads parcel rows to decide what's sensitive.
- Naming-convention heuristics (per HG-PII-1).
- Third-party classification services (cloud DLP, etc.): operator
  may use these externally and copy results into the manifest;
  the catalog does not call out.

## Out of scope (deferred)

The following are explicitly NOT in scope for C51-PII-A or
C51-PII-B. Each gets its own future slice:

### C51-PII-C — consumer migration policy

Mirrors C50-CONV-C. Defines how downstream readers (canonical
landing, comp readers, mapping workbench) consult
`PiiClassification`. Includes:

- A per-call-site stance enum:
  `RequirePiiFreeCanonicalLanding` /
  `AllowIndirectWithCare` /
  `AllowDirectWithExplicitConsentAudit` /
  `AllowAny`.
- An exhaustiveness-aware Fail mode for tables NOT in
  `TableExhaustiveFlags` when the caller needs verified coverage.
- A scoreboard tracking which consumers have migrated.

Until C51-PII-C lands, no production consumer is permitted to
take a runtime decision based on `PiiClassification`. The catalog
may expose the field; consumers may not act on it.

### C51-PII-D — preflight service (analog of C50-CONV-D)

The actual `IPiiClassificationPreflight` service that consumers
invoke per call site, with stance enum, outcome enum, structured
message, and unit tests against the C51-PII-C binding test matrix.

### C51-PII-PROMOTE-* — per-consumer wiring

One slice per migrated call site, mirroring C49-FK-PROMOTE and
C50-CONV-PROMOTE.

### C51-PII-E — manifest authoring tooling

A SyncAtlas command that helps the operator author the initial
manifest by listing column names matching operator-supplied
sensitive-name patterns (operator-supplied, not auto-derived) so
the operator can review and decide. Produces operator review
material, not catalog truth.

### C51-PII-F — county-shared classification library

A central registry where counties can share the column-pattern
sets they've classified (e.g., "every Harris PACS install has a
`chg_of_owner.grantor_cv` column and it's always Direct PII"),
then the operator imports the relevant subset. Out of scope until
at least two counties have manifests.

### C51-PII-G — row-level PII (e.g., redaction-of-specific-rows)

The current model classifies columns. Some columns are sometimes
PII and sometimes not (e.g., `legal_desc` may contain owner names
in some rows but not others). Row-level redaction is deferred
indefinitely; the column-level model is enough for canonical
landing as long as the operator marks borderline columns as
`Direct`.

## C51-PII-B implementation contract

C51-PII-B is the next slice in this family. Its scope:

1. **Add `PacsPiiManifest`, `PacsPiiTableEntry`,
   `PacsPiiColumnEntry` records** to
   `backend/src/TerraFusion.Sync/Workbench/Schema/`. Use the
   existing `PiiClassification` enum verbatim.
2. **Add `LivePacsSchemaSourceOptions.PiiManifestPath` and
   `LivePacsSchemaSourceOptions.RequirePiiManifest`**.
3. **Add `IPacsPiiManifestSource` + default JSON
   implementation**, mirroring `IPacsConversionManifestSource`
   from C50-CONV-B.
4. **Wire into `LivePacsSchemaSource.ReadAsync`**: load manifest
   (when configured), apply classification tags, fail closed if
   `RequirePiiManifest = true` and load fails. Validate that
   every name in `TableExhaustiveFlags` exists in the catalog.
5. **Stamp the catalog version** with manifest engagement
   information so consumers can tell engaged from un-engaged
   (analog of `ConversionManifestHash`).
6. **Unit tests**: at minimum
   - manifest absent + RequirePiiManifest=false → all classifications
     `None` (C48-B legacy preserved by the bridge).
   - manifest absent + RequirePiiManifest=true → build fails.
   - manifest with column entry → column tagged.
   - manifest with table entry → columns inherit (table-level
     applies to columns lacking their own entry).
   - manifest with column override on tagged table → column wins.
   - manifest with empty Reason → fails (audit-trail integrity).
   - manifest with duplicate column entry → fails.
   - manifest with TableExhaustiveFlags naming a table that
     doesn't exist in the catalog → build fails.
   - manifest with TableExhaustiveFlags naming a real table:
     un-annotated columns on it receive `None` and the catalog
     records the exhaustiveness assertion for C51-PII-D / C51-PII-C
     consumption.
7. **No live PACS smoke required** for C51-PII-B. The unit tests
   plus a hand-authored fixture manifest are sufficient.
8. **No consumer migration**. Per HG-PII-3 deferred-to-C51-PII-C,
   no production code path consults `PiiClassification` at
   runtime until that policy lands.

## Acceptance for C51-PII-A

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-pii-classification-manifest-policy.md`.
- [x] All three hard guards (PII-1, PII-2, PII-3) stated explicitly
  with rationale.
- [x] Data model is binding (using existing C48-B enum verbatim;
  no new enum).
- [x] Allowed-sources list closed.
- [x] Deferred-scope list enumerated.
- [x] Cross-references to C48-A, C48-CLOSE, C49-FK-A, C50-CONV-A1.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C51-PII-A is not a manifest. The manifest is what C51-PII-E will
  help produce; this doc only specifies the *shape* the manifest
  must have.
- C51-PII-A does not authorize any consumer to act on PII
  metadata. That gate lives in C51-PII-C.
- C51-PII-A does not change the C48-B `PiiClassification` enum.
- C51-PII-A does not retire HG1 (catalog itself stays PII-free).
  The manifest classifies underlying-table columns; the catalog
  still holds zero parcel rows.
- C51-PII-A does not introduce row-level PII (deferred to
  C51-PII-G indefinitely).

## Open questions (deferred to C51-PII-B)

- Should the wire format support `regex` patterns for column
  names? Currently no — operator must list each column verbatim.
  Pattern support deferred to C51-PII-E (authoring tool) where
  the operator can expand patterns into explicit entries before
  committing.
- Should the manifest support inheritance (e.g., "all columns
  matching `*_addr` on tables containing `owner`")? Currently
  no — see above.
- Should `PiiClassification.Direct` propagate to dependent FK-
  source columns automatically (e.g., a column FK-pointing to
  the `owner` table inherits Direct)? Currently no — operator
  decides per column. C51-PII-B may add an opt-in propagation
  flag if a real consumer needs it.
- Should the manifest include a "verified-by" / "verified-on"
  field for audit posture? Currently no — `Reason` carries this
  informally. C51-PII-B may strengthen.

## Slice ledger note

Updates the C51-PII arc:

- C51-PII-A             : THIS DOC — policy lock.
- C51-PII-B             : pending — parser + catalog wiring + tests.
- C51-PII-C             : pending — consumer migration policy.
- C51-PII-D             : pending — preflight service + tests.
- C51-PII-PROMOTE-*     : pending — per-consumer wiring (analog of C49-FK-E…L and C50-CONV-PROMOTE-A…H).
- C51-PII-E             : deferred — authoring tooling.
- C51-PII-F             : deferred — cross-county sharing.
- C51-PII-G             : deferred indefinitely — row-level PII.

Promotion happens slice-by-slice; nothing in C51-PII-A should be
read as authorizing C51-PII-B or any later slice until each lands.
