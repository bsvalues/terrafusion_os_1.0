# Benton Harris PACS — Dictionary Loader Preflight Evidence Baseline

**Slice:** BENTON-SYNC-6-C (committed evidence artifact for the
BENTON-SYNC-6-B implementation. Captures the live state of the
preflight evidence artifact as observed on the date below so future
audits / agents have a permanent baseline to compare against.).

**Source-of-truth pointers:**

- BENTON-SYNC-6-A policy:
  `docs/sync/dictionary-loader-preflight-evidence-policy.md`
- BENTON-SYNC-6-B implementation: marker commit `5a2030a97`,
  merged at `0d8a02d57`.
- BENTON-SYNC-6-C marker commit (this slice): see slice ledger
  in `docs/sync/benton-core-sync-next-need.md` after this lands.
- Captured stdout / stderr / exit-code / preflight-evidence.json
  (gitignored, operator-side):
  `backend/artifacts/sync-atlas/benton-sync-6-c/20260502T042535Z/`.
- Policy precedent:
  `docs/sync/benton-pacs-catalog-health-baseline.md`
  (BENTON-SYNC-4) — same baseline shape applied to the
  schema-catalog-health command.

## Capture context

```text
Catalog identity
  CountyId            : 19190019-1919-1919-1919-191919191919  (WA-Benton)
  SourceConnectionId  : 8e4944c7-9628-448e-b7a6-0053d58ff5ac  (Benton PACS Training, tf-mssql)
  SourceConnectionName: "Benton PACS Training (tf-mssql)"
  ConnectionType      : SqlServer
  Server              : localhost,1433
  Database            : PACS_Training
  AuthMode            : SqlAuth
  Username            : sa
  WorkbookId          : a767c8a2-5b8a-4846-af8b-c3496601e924  (Benton PACS OLTP Mapping Workbook, status=Mapped)

Run
  Command             : sync-atlas --load-pacs-dictionary --table property_use --preflight-evidence-path <path>
  Run ID (artifact)   : 20260502T042535Z (filename) / 2026-05-02T04:25:51.110Z (in-record runId)
  Exit code           : 0 (clean)
  Stderr              : empty (zero bytes)
  Loader scan         : Workbook Deferred rows = 0; Dictionary rows read = 0
                        (live PACS Training database has empty
                         dbo.property_use; the loader still ran the
                         three preflights cleanly which is what
                         BENTON-SYNC-6-C cares about).
  Leak scan           : zero matches over Password=, Pwd=, TF_Pacs,
                        SA_PASSWORD, SYNCATLAS_SECRET_, TF_Pacs2026,
                        and a raw-value scan for the resolved
                        SA password.
```

## Captured preflight evidence artifact

```json
{
  "schemaVersion": "1.0.0",
  "runId": "2026-05-02T04:25:51.1107537Z",
  "countyId": "19190019-1919-1919-1919-191919191919",
  "sourceConnectionId": "8e4944c7-9628-448e-b7a6-0053d58ff5ac",
  "pacsRelease": null,
  "manifestEngagement": {
    "conversionManifest": false,
    "piiManifest": false,
    "exportedFkManifest": false
  },
  "records": [
    {
      "configKey": "property_use",
      "targetTable": "property_val",
      "targetColumn": "property_use_cd",
      "startedAtUtc": "2026-05-02T04:25:51.1107537Z",
      "completedAtUtc": "2026-05-02T04:25:51.1268494Z",
      "fkPreflight": {
        "stance": "RequiredFk",
        "outcome": "Pass",
        "constraintName": "CFK_property_val_property_use_cd",
        "confidence": "Declared",
        "message": null
      },
      "eraPreflight": {
        "stance": "RequirePost2017OrBoth",
        "outcome": "Pass",
        "matchedEra": "Both",
        "provenance": "ManifestNotEngaged",
        "message": null
      },
      "piiPreflight": {
        "stance": "AllowAny",
        "outcome": "Pass",
        "matchedClassification": "None",
        "manifestEngaged": false,
        "tableExhaustive": false,
        "message": null
      }
    }
  ],
  "summary": {
    "loaderCallCount": 1,
    "fkPassCount": 1,
    "fkWarnCount": 0,
    "fkFailCount": 0,
    "fkSkippedCount": 0,
    "eraPassCount": 1,
    "eraWarnCount": 0,
    "eraFailCount": 0,
    "eraSkippedCount": 0,
    "piiPassCount": 1,
    "piiWarnCount": 0,
    "piiFailCount": 0,
    "piiSkippedCount": 0
  }
}
```

## Reading the baseline

### Identity envelope (one record, one source)

The artifact carries the catalog identity envelope at the top
level (`countyId` + `sourceConnectionId` + `pacsRelease`). The
single record inherits from this envelope by construction —
SyncAtlas takes one source connection per invocation, so the
"county-scoped per record envelope" hard guard from the
BENTON-SYNC-6-A policy is automatic for this run. `pacsRelease`
is `null` because Harris PACS does not declare a release version
through the metadata pipeline; the catalog reports this honestly
rather than fabricating a value.

### Manifest engagement — all three not engaged (honest, not silent)

```text
conversionManifest    : false
piiManifest           : false
exportedFkManifest    : false
```

This matches the C48-B / C50-CONV-B / C51-PII-B / C52-OVR-B
legacy bridge state. Every preflight that observed a manifest
absence reports it via its provenance / engagement field rather
than silently aliasing to a default. The honest-not-engaged
property is what HG-CONV-3 / HG-PII-3 require.

### FK preflight — Pass on Declared edge

```text
stance         : RequiredFk
outcome        : Pass
constraintName : CFK_property_val_property_use_cd
confidence     : Declared
```

This is the C49-FK-D / C49-FK-E live edge. Benton's PACS Training
schema has the same engine-declared FK on
`property_val.property_use_cd → property_use.property_use_cd`
that the OLTP schema does (verified by the BENTON-SYNC-3 catalog
build's FK confidence breakdown). The RequiredFk stance is
satisfied by a Declared edge — the strongest possible signal.

### Era preflight — Pass via ManifestNotEngaged

```text
stance     : RequirePost2017OrBoth
outcome    : Pass
matchedEra : Both
provenance : ManifestNotEngaged
```

`ManifestNotEngaged` is the C48-B legacy bridge default: when
no conversion manifest is supplied, every column reports
`era=Both` and the preflight passes honestly under that
provenance. This is exactly the property C50-CONV-D was designed
to surface — the field is `ManifestNotEngaged`, not silently
aliased to `ColumnEntry`.

### PII preflight — Pass via AllowAny

```text
stance                : AllowAny
outcome               : Pass
matchedClassification : None
manifestEngaged       : false
tableExhaustive       : false
```

The dictionary loader's PII stance is `AllowAny` per
C51-PII-PROMOTE-A. The catalog reports `classification=None`
(default when no manifest engaged) and exhaustively flags
`manifestEngaged=false` and `tableExhaustive=false`. The actual
PII gate lives on canonical-landing readers, not loaders; this
preflight surfaces metadata for audit without blocking the
loader.

### Summary internally consistent

```text
loaderCallCount : 1
fkPassCount     : 1   eraPassCount    : 1   piiPassCount    : 1
fkWarnCount     : 0   eraWarnCount    : 0   piiWarnCount    : 0
fkFailCount     : 0   eraFailCount    : 0   piiFailCount    : 0
fkSkippedCount  : 0   eraSkippedCount : 0   piiSkippedCount : 0
```

Recomputing the summary from the records produces identical
counts (the BENTON-SYNC-6-A `Summary_RecomputedFromRecords_
MatchesPersisted` invariant). This is the BENTON-SYNC-6-A unit
test that's pinned at the writer level; this baseline confirms
it holds under live PACS conditions too.

### No PII in the artifact

Every field value in the artifact is catalog metadata
(GUIDs, table names, column names, configKeys, constraint
names) and preflight verdicts. No row data. No descriptions.
No code values from the dictionary. The artifact shape is
metadata-only by construction (the writer's record types do
not have a row-data field), so the BENTON-SYNC-6-A
`Artifact_ContainsNoRowDataOnPiiTable` policy guard holds.

## Why this baseline matters

When a future loader run differs from this baseline — preflight
outcomes flip, manifests engage, configKeys drift, summary
counts diverge — that's a signal for the operator to investigate.
Diff utilities introduced by C53-CONS-E and the identity-checked
variant from C54-MULTI-D are the natural tools for that
comparison. Operators may persist the captured artifacts under
`backend/artifacts/sync-atlas/benton-sync-6-c/<RUN_ID>/` and
diff against this baseline when they want CI signal.

This file is the human-readable baseline. The companion
machine-readable artifact lives under
`backend/artifacts/sync-atlas/benton-sync-6-c/20260502T042535Z/preflight-evidence.json`
on the operator's workstation (gitignored — the captured artifact
is operator-state, not committed truth).

## Hard guards re-verified at this capture

- **HG3 read-only** : zero writes to PACS or TerraFusion DB beyond
  the artifact file. Loader ran read-only against PACS Training;
  workbook untouched (`Workbook Deferred rows scanned: 0` /
  `M5 clean match: 0`).
- **HG6 source-traceable** : every record carries `configKey`,
  `targetTable`, `targetColumn`, the catalog identity envelope,
  and timestamps.
- **HG7 fail-closed** : the inner try/finally that appends the
  per-call record was reached on the success path; the
  partial-run preservation property is structurally pinned
  but not exercised in this baseline (no preflight threw). A
  future BENTON-SYNC-6-C-FAIL-VARIANT could prove HG7 by
  forcing a Fail outcome.
- **HG-FK-3 / HG-CONV-3 / HG-PII-3 no-silent-default-pass** :
  confirmed by inspection — `Stance` and `Outcome` are explicit
  on every preflight row. None show `Skipped` (the configKey
  was migrated under C49-FK-E / C50-CONV-PROMOTE-A /
  C51-PII-PROMOTE-A).
- **No-PII-in-artifact** : grep over the artifact contents
  shows only metadata (GUIDs, table names, column names,
  constraint names, enum values).
- **County-scoped envelope** : the single record inherits
  `(CountyId, SourceConnectionId)` from the run envelope.

## Re-running the proof

```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_DIR="backend/artifacts/sync-atlas/benton-sync-6-c/$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

TF_DB="<resolve from local config; never commit>"
COUNTY_ID="19190019-1919-1919-1919-191919191919"
CONNECTION_ID="8e4944c7-9628-448e-b7a6-0053d58ff5ac"
WORKBOOK_ID="a767c8a2-5b8a-4846-af8b-c3496601e924"
SECRET_VAR="SYNCATLAS_SECRET_8E4944C79628448EB7A60053D58FF5AC"
export "$SECRET_VAR=$(cat ~/.terrafusion/pacs-sa-password.tmp)"

dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "$COUNTY_ID" \
  --connection-id "$CONNECTION_ID" \
  --load-pacs-dictionary \
  --workbook-id "$WORKBOOK_ID" \
  --table "property_use" \
  --preflight-evidence-path "$ARTIFACT_DIR/preflight-evidence.json" \
  > "$ARTIFACT_DIR/run.stdout.txt" \
  2> "$ARTIFACT_DIR/run.stderr.txt"
echo "exit=$?" > "$ARTIFACT_DIR/exit-code.txt"
unset "$SECRET_VAR"
```

Compare the resulting `preflight-evidence.json` to this baseline.
Any meaningful drift warrants investigation before continuing
operational work.

## Policy / implementation reconciliation (BENTON-SYNC-6-A drift)

The BENTON-SYNC-6-A policy stated under the "CLI engagement
model — Failure semantics" section:

> A write failure exits with code 2 and prints to stderr.

The BENTON-SYNC-6-B implementation took a softer posture:
write failure prints to stderr but does NOT alter the exit
code — mirroring how BENTON-SYNC-5 handles invariant artifact
write failure under `--schema-catalog-health`.

This baseline reconciles the drift in favor of the
implementation posture. Rationale:

- The artifact write happens in the OUTER finally, AFTER the
  loader's primary operation (preflight chain + dictionary
  read + CSV / mismatch report writes) has completed
  successfully. The loader did its job — the operator already
  has the proposed-review CSV and the mismatch report.
- Failing the whole run on artifact-write failure would cause
  flaky behavior (full disk, stale lock, no permission on the
  artifact directory) to mask a successful loader operation.
- BENTON-SYNC-5 set the precedent for "best-effort artifact
  write" under the same operating model: artifact failure does
  not propagate to the exit code.
- Stderr output remains the operator's signal that something
  went wrong with the artifact specifically.

Resolution: the policy doc's
"CLI engagement model — Failure semantics" wording is amended
in the same commit as this baseline lands, replacing
"exits with code 2" with "prints to stderr; the loader's
primary exit code is preserved (best-effort artifact write,
matching the BENTON-SYNC-5 invariant artifact precedent)".

## Slice ledger note

- BENTON-SYNC-6-A : DONE — policy.
- BENTON-SYNC-6-B : DONE — implementation + writer + tests.
- BENTON-SYNC-6-C : DONE — this evidence baseline. ← this slice
- BENTON-SYNC-7+  : reselected from inventory's parked list
                    when next concrete need surfaces.
