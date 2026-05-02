# Benton Harris PACS — Schema Catalog Health Baseline

**Slice:** BENTON-SYNC-4 (committed evidence artifact for the
BENTON-SYNC-3 live-PACS proof). This file pins the live state of
Benton's Harris PACS schema catalog as observed on the date below
so future audits / agents have a permanent baseline to compare
against.

**Source-of-truth pointers:**

- BENTON-SYNC-1 inventory: `docs/sync/benton-core-sync-next-need.md`
- BENTON-SYNC-2 command implementation: marker commit referenced
  in the inventory's slice-ledger.
- BENTON-SYNC-2-FIX1 parser corrigendum: `commit 55a1d82c2`.
- BENTON-SYNC-3 live-proof marker commit: `commit be308ff28`.
- Captured stdout / stderr / exit-code (gitignored, operator-side):
  `backend/artifacts/sync-atlas/benton-sync-3/20260502T010520Z/`.
- Catalog metadata pipeline: `pacs-schema-catalog-as-code-policy.md`
  (C48-A) and the catalog completion handoffs.

## Capture context

```text
Catalog identity
  CountyId            : 19190019-1919-1919-1919-191919191919  (WA-Benton)
  SourceConnectionId  : e6ddd159-eac9-450a-aa47-983688d2491d  (Benton PACS OLTP, tf-mssql)
  SourceConnectionName: "Benton PACS OLTP (tf-mssql)"
  ConnectionType      : SqlServer
  Server              : localhost,1433
  Database            : pacs_oltp
  AuthMode            : SqlAuth
  Username            : sa

Run
  Command             : sync-atlas --schema-catalog-health
  Run ID              : 20260502T010520Z
  Catalog build time  : 217.2 seconds
  Exit code           : 0 (clean)
  Stderr              : empty (zero bytes)
  Leak scan           : zero matches over Password=, Pwd=, TF_Pacs,
                        SA_PASSWORD, SYNCATLAS_SECRET_, TF_Pacs2026
```

## Captured health output

```text
[sync-atlas] Schema catalog health
  CountyId / SourceConnectionId : (19190019-1919-1919-1919-191919191919, e6ddd159-eac9-450a-aa47-983688d2491d)
  PacsRelease                   : (not declared)
  Coverage                      : 2229 tables, 32750 columns, 210 dictionaries
  IngestedAtUtc                 : 2026-05-02T01:09:00.5531450Z

[sync-atlas] Invariant report
  Set version                   : 1.1.0
  Errors                        : 0
  Warnings                      : 721   (FK-006 × 721)
  Advisories                    : 0
  IsClean                       : true

[sync-atlas] FK confidence breakdown
  Declared                      : 912
  Exported                      : 0    (no exported FK manifest engaged)
  InferredByName                : 721

[sync-atlas] Manifest engagement
  Conversion manifest           : not engaged
  PII manifest                  : not engaged
  Exported FK manifest          : not engaged
```

## Reading the baseline

### Coverage (2229 / 32750 / 210)

These three numbers are the operationally-meaningful signal that
the catalog parser successfully introspected the live database:

- **2229 tables** — the live PACS install's full catalog of base
  tables. Matches the expected order of magnitude for Harris PACS
  9.0 production-shaped deployments.
- **32750 columns** — every column on every base table. The C48-E
  500-second `DefaultCommandTimeoutSeconds` introduced for live-
  PACS-scale introspection covers this load.
- **210 dictionaries** — tables matching the C48-F + C48-P
  dictionary heuristic (first column ends `_cd` / `_code` / `Code`,
  second column ends `_desc` / `_dsc` / `Desc`). The 210 figure
  matches the C48-P live verification (the slice that broadened the
  heuristic to Hungarian-notation columns and bumped the count
  from 203 to 210).

### Invariant report — clean

`IsClean = true` with zero Error rows is the signal HG7 fail-
closed needs to permit downstream operations. The 721 Warnings
are NOT defects:

- **All 721 are FK-006** — the C53-CONS-A invariant for
  "InferredByName edges with no Declared or Exported promotion."
- These are exactly the operator-promotion candidates the
  C49-FK-PROMOTE / C52-OVR families were designed to surface.
- They will become Pass once the operator authors an Exported FK
  manifest under C52-OVR-A and the catalog rebuilds.

### FK confidence breakdown — 912 / 0 / 721

- **912 Declared** — engine-enforced foreign keys read from
  `INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS`. These are the
  authoritative FK edges Harris PACS itself declares.
- **0 Exported** — no operator-supplied FK manifest is engaged.
  When the operator authors one, edges promoted from
  InferredByName will appear here.
- **721 InferredByName** — same-name heuristic inferences against
  the dictionary set. These are the C49-FK-A "advisory only" tier
  and are excluded from production decisions per HG-FK-2.

### Manifest engagement — all not-engaged

This is the C48-B / C50-CONV-B / C51-PII-B / C52-OVR-B legacy-
bridge state. The catalog reports Both / None / no-overrides
defaults across all rows. Engaging any of the three manifests is
operator-authoring work; the tooling is ready when the operator
chooses to engage.

## Why this baseline matters

When a future catalog build differs from this baseline — coverage
counts shift unexpectedly, the Warning total jumps, IsClean flips
to false — that's a signal for the operator to investigate. The
diff utilities introduced by C53-CONS-E (and the identity-checked
variant from C54-MULTI-D) are the natural tools for that
comparison. Operators may persist the captured reports under
`backend/artifacts/sync-atlas/benton-sync-3/<RUN_ID>/` and run
`PacsSchemaInvariantReportArtifact.WriteAsync` for machine-readable
versions when they want CI signal.

This file is the human-readable baseline. The companion machine-
readable artifact lives under `backend/artifacts/sync-atlas/
benton-sync-3/20260502T010520Z/schema-catalog-health.stdout.txt`
on the operator's workstation (gitignored — the captured stdout
is operator-state, not committed truth).

## Hard guards re-verified at this capture

- **HG3 read-only** : catalog build read INFORMATION_SCHEMA only;
  zero writes against PACS or TerraFusion DB.
- **HG6 source-traceable** : every record carries a non-empty
  provenance string (per the engine's TBL-003, COL-004, DICT-007
  invariants).
- **HG7 fail-closed** : invariant engine reported IsClean=true;
  command exit code 0.
- **HG-FK-1** declared-vs-all split holds: 912 + 0 = 912 in the
  declared lookup path; 721 InferredByName excluded.
- **HG-FK-2** advisory-only holds: zero InferredByName edges
  drove runtime decisions during the build.

## Re-running the proof

```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_DIR="backend/artifacts/sync-atlas/benton-sync-3/$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

TF_DB="<resolve from local config; never commit>"
COUNTY_ID="19190019-1919-1919-1919-191919191919"
CONNECTION_ID="e6ddd159-eac9-450a-aa47-983688d2491d"
SECRET_VAR="SYNCATLAS_SECRET_E6DDD159EAC9450AAA47983688D2491D"
export "$SECRET_VAR=$(cat ~/.terrafusion/pacs-sa-password.tmp)"

dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "$COUNTY_ID" \
  --connection-id "$CONNECTION_ID" \
  --schema-catalog-health \
  > "$ARTIFACT_DIR/schema-catalog-health.stdout.txt" \
  2> "$ARTIFACT_DIR/schema-catalog-health.stderr.txt"
echo "exit=$?" > "$ARTIFACT_DIR/exit-code.txt"
unset "$SECRET_VAR"
```

Compare resulting stdout to this baseline. Any meaningful drift
warrants investigation before continuing operational work.

## Slice ledger note

- BENTON-SYNC-1     : DONE — inventory + default next.
- BENTON-SYNC-2     : DONE — `--schema-catalog-health` command.
- BENTON-SYNC-2-FIX1: DONE — parser branch corrigendum.
- BENTON-SYNC-3     : DONE — live-PACS proof clean.
- BENTON-SYNC-4     : DONE — this evidence baseline. ← this slice
- BENTON-SYNC-5+    : reselected from the inventory's parked list
                      when next concrete need surfaces.
