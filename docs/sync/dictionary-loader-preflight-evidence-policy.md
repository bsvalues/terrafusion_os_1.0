# Dictionary Loader Preflight Evidence Artifact Policy

**Slice:** BENTON-SYNC-6-A (docs-only — defines the on-disk artifact
shape and engagement model for rolling up SyncAtlas dictionary-
loader FK / era / PII preflight outcomes into the existing
`backend/artifacts/sync-atlas/` evidence pattern).

**Status:** policy-only. Implementation lands separately under
BENTON-SYNC-6-B.

**Authoritative cross-references:**

- `docs/sync/benton-core-sync-next-need.md` — BENTON-SYNC-1
  inventory; the parked item this slice promotes.
- `docs/sync/pacs-schema-fk-consumer-migration-policy.md` — C49-FK-C
  per-call-site FK preflight stance source-of-truth.
- `docs/sync/pacs-schema-conversion-era-consumer-migration-policy.md`
  — C50-CONV-C per-call-site era preflight stance source-of-truth.
- `docs/sync/pacs-schema-pii-consumer-migration-policy.md` — C51-PII-C
  per-call-site PII preflight stance source-of-truth.
- `docs/sync/pacs-schema-consistency-invariants-policy.md` —
  C53-CONS-B / `PacsSchemaInvariantReportArtifact` precedent for
  byte-stable JSON evidence under SyncAtlas.

## Why this slice

BENTON-SYNC-5 landed (`commit d753c61af`) wiring
`PacsSchemaInvariantReportArtifact.WriteAsync` into the
`--schema-catalog-health` command. That precedent —
"SyncAtlas writes structured evidence next to the captured
stdout, opt-in via a path flag" — also fits the per-loader
preflight outcomes that today only print to stdout.

Each dictionary-loader call (10 configKeys, per
`pacs-canonical-dataflow-identity-policy.md`) runs three
preflights in order:

1. **FK preflight** (`DictionaryLoaderPreflight.ValidateAsync`) —
   stance from C49-FK-E .. C49-FK-L per configKey.
2. **Era preflight** (`ConversionEraPreflight.ValidateAsync`) —
   stance from C50-CONV-PROMOTE-A .. C50-CONV-PROMOTE-H per
   configKey.
3. **PII preflight** (`PiiClassificationPreflight.ValidateAsync`)
   — stance from C51-PII-PROMOTE-A .. C51-PII-PROMOTE-H per
   configKey.

The existing surface emits one stdout line per preflight on
Pass and a stderr line on Warn (Fail throws). That stdout is
operator-state and disappears the moment the terminal scrolls.
For audits — and for the diff-against-baseline workflow
established by BENTON-SYNC-4 — the operator wants those outcomes
captured in a byte-stable JSON artifact next to the SyncAtlas
stdout/stderr capture.

This slice is policy-only. It pins:

- The artifact's logical shape.
- Its filename convention.
- The CLI engagement model.
- Hard guards that bind any future implementation.
- The acceptance test matrix BENTON-SYNC-6-B will satisfy.

It does NOT change loader behavior, change the preflight
classes, change the stdout format, or commit to the writer's
internal serialization choices. BENTON-SYNC-6-B owns those.

## Scope

### In scope

- A new structured artifact recording the FK / era / PII
  preflight outcomes for every dictionary-loader call inside a
  single SyncAtlas invocation.
- A new SyncAtlas CLI flag (opt-in, mirrors
  `--invariant-artifact-path`) selecting the artifact path.
- Engagement model where stdout/stderr behavior is unchanged
  when the flag is absent.

### Out of scope

- Mutating any preflight class.
- Mutating loader stdout / stderr lines.
- Changing how preflight stances are picked (those policies
  are sealed under C49-FK / C50-CONV-PROMOTE / C51-PII-PROMOTE).
- Wiring the artifact into any non-SyncAtlas caller (e.g. the
  TerraFusion API runtime). Future slice if and when needed.
- Multi-county / multi-source aggregation across runs. One
  artifact records one SyncAtlas invocation.
- Hot-reload, rotation, retention. The operator manages
  artifact directories the same way they do today.

## Artifact shape (logical)

The artifact MUST be a single JSON document. The implementation
slice picks the exact serializer; this policy pins the logical
shape.

```text
DictionaryLoaderPreflightEvidence
├── SchemaVersion        : "1.0.0"   (string; semver)
├── RunId                : <RFC3339 UTC timestamp at first record>
├── CountyId             : <Guid>    (catalog identity)
├── SourceConnectionId   : <Guid>    (catalog identity)
├── PacsRelease          : <string?> (catalog metadata; may be null)
├── ManifestEngagement
│   ├── ConversionManifest    : <bool>
│   ├── PiiManifest           : <bool>
│   └── ExportedFkManifest    : <bool>
├── Records              : list of
│   ├── ConfigKey             : <string>  (the dictionary-loader configKey)
│   ├── TargetTable           : <string>  (workbook source table)
│   ├── TargetColumn          : <string>  (workbook source column)
│   ├── StartedAtUtc          : <RFC3339> (when this loader call started)
│   ├── CompletedAtUtc        : <RFC3339> (when its preflights finished)
│   ├── FkPreflight
│   │   ├── Stance            : "RequiredFk" | "AdvisoryFk" | "Skipped"
│   │   ├── Outcome           : "Pass" | "Warn" | "Fail" | "Skipped"
│   │   ├── ConstraintName    : <string?> (matched edge if Pass)
│   │   ├── Confidence        : "Declared" | "Exported" | "InferredByName" | null
│   │   └── Message           : <string?> (Warn / Fail human-readable line)
│   ├── EraPreflight
│   │   ├── Stance            : "RequirePost2017OrBoth" | "Skipped"
│   │   ├── Outcome           : "Pass" | "Warn" | "Fail" | "Skipped"
│   │   ├── MatchedEra        : "Pre2017" | "Post2017" | "Both" | null
│   │   ├── Provenance        : "ColumnEntry" | "Both" | "ManifestNotEngaged" | null
│   │   └── Message           : <string?>
│   └── PiiPreflight
│       ├── Stance            : "AllowAny" | "Skipped"
│       ├── Outcome           : "Pass" | "Warn" | "Fail" | "Skipped"
│       ├── MatchedClassification : <string?>
│       ├── ManifestEngaged   : <bool>
│       ├── TableExhaustive   : <bool>
│       └── Message           : <string?>
└── Summary
    ├── LoaderCallCount       : <int>
    ├── FkPassCount           : <int>
    ├── FkWarnCount           : <int>
    ├── FkFailCount           : <int>
    ├── FkSkippedCount        : <int>
    ├── EraPassCount          : <int>
    ├── EraWarnCount          : <int>
    ├── EraFailCount          : <int>
    ├── EraSkippedCount       : <int>
    ├── PiiPassCount          : <int>
    ├── PiiWarnCount          : <int>
    ├── PiiFailCount          : <int>
    └── PiiSkippedCount       : <int>
```

Field semantics:

- **`Skipped` outcome** : when a configKey is not in the
  per-call-site stance switch (i.e. an un-migrated case).
  Records the call but signals the preflight was not invoked.
  This honors HG-FK-3 / HG-CONV-3 / HG-PII-3 (no silent
  default-pass).
- **`Stance = "Skipped"`** : redundant with `Outcome = "Skipped"`
  but explicit for both downstream readers and audits.
- **`Confidence` / `MatchedEra` / `MatchedClassification`** :
  null on non-Pass outcomes. Implementation MAY also leave
  them null on `Pass` outcomes if the preflight result didn't
  carry a matched edge (matches the existing nullable shape in
  the preflight result types).
- **`Message`** : verbatim copy of the line written to stderr
  on Warn / Fail. Empty / null on Pass / Skipped.
- **`Summary`** counts MUST be derived from `Records`. The
  artifact is internally consistent: if a reader recomputes
  the summary from the records it MUST match the persisted
  summary exactly. Implementation tests pin this.

### Why these fields, not others

- Mirrors the C53-CONS-D `PacsSchemaInvariantReportArtifact`
  shape (envelope identity + records + per-row outcome) so a
  single audit pipeline can read both kinds.
- Avoids duplicating the catalog itself: `CountyId`,
  `SourceConnectionId`, `PacsRelease`, `ManifestEngagement` are
  enough to anchor identity. Anyone needing more can look at
  the catalog directly.
- Honest about not-engaged manifests. The `ManifestEngagement`
  trio plus the per-record provenance fields together preserve
  the "honest provenance" property baked into HG-CONV-3 and
  HG-PII-3.

## Filename convention

The artifact filename has three constraints:

1. **Operator-chosen path.** The CLI flag accepts a full path,
   exactly like `--invariant-artifact-path`. Operator picks
   the directory; implementation does NOT auto-create
   `backend/artifacts/sync-atlas/...` subtrees.
2. **Recommended convention.** When the operator follows the
   BENTON-SYNC-N pattern, the recommended path is

   ```text
   backend/artifacts/sync-atlas/<RUN_ID>/preflight-evidence.json
   ```

   matching the `schema-catalog-health.stdout.txt` /
   `schema-catalog-health.stderr.txt` / `exit-code.txt` siblings.
3. **No path validation beyond writability.** Implementation
   MUST fail fast (exit code 2, error to stderr) if the path
   cannot be written. It MUST NOT silently fall back to a
   different path.

## CLI engagement model

The implementation slice (BENTON-SYNC-6-B) introduces one new
SyncAtlas flag:

```text
--preflight-evidence-path <path>
```

Engagement rules — binding:

- **Opt-in only.** Without the flag, behavior is byte-identical
  to today. No artifact is written. No new stdout / stderr
  lines appear. Mirrors BENTON-SYNC-5's `--invariant-artifact-path`
  contract.
- **Same scope as the loaders that emit them.** The flag is
  honored only on commands whose runtime path actually invokes
  dictionary loaders. Today that means `--load-pacs-dictionary`
  and any future bulk-loader command. On unrelated commands
  (`--schema-catalog-health`, mapping-workbook commands, etc.)
  the flag MUST be rejected with a clear "not applicable" error.
- **One artifact per invocation.** Even if the operator
  invokes a batch flow (e.g. C19-PROMOTE-* batch loader),
  the artifact captures the records produced by that single
  process. No appending to an existing file. If the file
  already exists, it is overwritten (mirrors
  `PacsSchemaInvariantReportArtifact.WriteAsync`).
- **Failure semantics.** A write failure prints to stderr; the
  loader's primary exit code is preserved (best-effort artifact
  write, matching the BENTON-SYNC-5 invariant artifact
  precedent). Rationale: the artifact write happens in the
  outer finally AFTER the loader's primary operation
  (preflight chain + dictionary read + CSV / mismatch report
  writes) has completed; failing the whole run on artifact-
  write failure would cause flaky behavior (full disk, stale
  lock, no permission on the artifact directory) to mask a
  successful loader operation. Stderr output remains the
  operator's signal that something went wrong with the
  artifact specifically. (Reconciled at BENTON-SYNC-6-C — the
  earlier policy wording "exits with code 2" was replaced by
  this softer posture once the live proof captured the
  precedent's actual behavior.) A successful write prints one
  stdout line identical-in-shape to the BENTON-SYNC-5
  confirmation:

  ```text
  sync-atlas: preflight evidence artifact written to <path>
  ```
- **No mutation contract.** The flag does not change ANY
  loader behavior. Specifically: it does not change preflight
  outcomes, it does not change stdout / stderr lines for
  individual preflight results, it does not change exit codes
  for Pass/Warn/Fail, and it does not change canonical-landing
  output. Tests pin the byte-equivalence of stdout (modulo the
  one new confirmation line at the end).

## Hard guards (binding for any implementation)

- **HG3 read-only.** The artifact is a write to operator-state
  artifact files only. Zero writes to PACS, zero writes to
  TerraFusion DB. Implementation tests pin pre/post DB
  snapshot equivalence.
- **HG6 source-traceable.** Every record carries `ConfigKey`,
  `TargetTable`, `TargetColumn`, the catalog identity envelope,
  and timestamps. No anonymous rows.
- **HG7 fail-closed.** Fail outcomes still throw (the existing
  `InvalidOperationException` flow is preserved). The artifact
  records what was reached before the throw — i.e., partial
  artifacts ARE valid evidence. Implementation MUST flush /
  finalize the artifact even when a later preflight throws,
  so the record of which loader call failed is preserved.
- **HG-FK-3 / HG-CONV-3 / HG-PII-3 no-silent-default-pass.**
  Un-migrated configKeys produce `Outcome = "Skipped"` rows,
  not `Pass` rows. The artifact MUST surface skipped
  preflights so audits can see which loader calls weren't
  guarded.
- **No PII in the artifact.** Field values written to the
  artifact are catalog metadata (table names, column names,
  configKeys) and preflight verdicts. Row data is never
  written. Tests grep the artifact contents for non-empty
  result rows on a known-PII table to prove this.
- **County-scoped per record envelope.** The
  `(CountyId, SourceConnectionId)` pair MUST match the
  catalog the loader call ran against. Implementation MUST
  reject mixing records from different `(CountyId, SourceConnectionId)`
  catalogs in a single artifact. (Today's SyncAtlas takes one
  source connection per invocation, so this is automatic; the
  guard pins the property.)

## Test matrix (binding for BENTON-SYNC-6-B)

The implementation slice MUST include integration tests that
pin all of the following. These are acceptance gates.

### Parser

- `Parse_PreflightEvidencePath_WithValue_Succeeds` — flag
  parses with a real path.
- `Parse_PreflightEvidencePath_WithoutValue_ReturnsError` —
  flag without a value rejects (mirrors
  `Parse_InvariantArtifactPath_WithoutValue_ReturnsError`).
- `Parse_PreflightEvidencePath_OnUnsupportedCommand_Rejects` —
  flag on `--schema-catalog-health` (or mapping-workbook
  commands) rejects with a clear "not applicable" error.

### Writer

- `Write_TwoLoaderRunsWithMixedOutcomes_ProducesByteStableJson`
  — given a synthetic sequence of records, the artifact
  serializer is deterministic byte-for-byte.
- `Write_FlagAbsent_NoArtifactCreated_StdoutByteIdentical` —
  with the flag absent, no artifact appears and stdout matches
  a pre-flag baseline byte-for-byte (modulo timestamp lines).
- `Write_FailDuringRun_FinalizesPartialArtifact` — when a
  later preflight throws, the artifact still contains the
  records produced before the throw. (HG7 fail-closed.)

### Summary consistency

- `Summary_RecomputedFromRecords_MatchesPersisted` — for any
  artifact, recomputing summary counts from records produces
  the same numbers persisted in `Summary`.

### Hard guards

- `Artifact_ContainsNoRowDataOnPiiTable` — running against a
  configKey whose target table has known PII columns produces
  an artifact whose serialized contents do not contain any row
  data — only metadata strings.
- `Artifact_RecordsCarryFullIdentityEnvelope` — every record
  inherits the same `(CountyId, SourceConnectionId)` pair as
  the run-level envelope.

### CLI integration

- `Cli_PreflightEvidencePath_WithLoaderCommand_WritesArtifactAndPrintsConfirmation`
  — full flow: invoke loader command with flag, artifact
  appears, confirmation line prints to stdout.
- `Cli_PreflightEvidencePath_WriteFailure_PrintsStderrPreservesExitCode`
  — directory non-existent / non-writable → stderr message,
  loader's primary exit code preserved (per the reconciled
  failure-semantics rule above).

## Engagement with existing surfaces

- The `--load-pacs-dictionary` command (and any future bulk
  loader command) gains the `--preflight-evidence-path` flag.
- The flag is documented in `docs/sync/property-use-dictionary-loader-policy.md`
  and the other per-loader policy docs only as a forward
  pointer; the canonical contract lives here.
- The `pacs-schema-catalog-completion-handoff.md` deferred-scope
  index gets a note that BENTON-SYNC-6-B promotes parked
  inventory item #3.
- The README family-index (`docs/sync/README.md`) gets one
  entry pointing here.

## Slice ledger

- BENTON-SYNC-6-A : DONE — this policy. ← this slice
- BENTON-SYNC-6-B : NEXT — implementation + parser + writer +
                    test matrix + live proof.
- BENTON-SYNC-6-C : OPTIONAL FUTURE — committed Benton evidence
                    baseline once BENTON-SYNC-6-B's first live
                    run produces a clean artifact (mirrors
                    BENTON-SYNC-4's role for the catalog-health
                    output).

## Acceptance for BENTON-SYNC-6-A

- [x] One file added at
  `docs/sync/dictionary-loader-preflight-evidence-policy.md`.
- [x] Logical artifact shape pinned (envelope + records + summary).
- [x] Filename convention pinned (operator-chosen path; recommended
  layout documented).
- [x] CLI engagement model pinned (`--preflight-evidence-path`,
  opt-in, mode-restricted, byte-stable stdout when absent).
- [x] Hard guards enumerated (HG3 / HG6 / HG7 / no-silent-default-pass /
  no-PII / county-scoped envelope).
- [x] Test matrix enumerated (parser / writer / summary / guards / CLI).
- [x] BENTON-SYNC-1 inventory updated to mark BENTON-SYNC-5 DONE
  and name BENTON-SYNC-6 as the new default.
- [x] No code changes. No test changes. No mutation of any
  existing loader / preflight class.

## Non-goals (explicit)

- BENTON-SYNC-6-A does not implement the writer, the CLI flag,
  or the test matrix. BENTON-SYNC-6-B does.
- BENTON-SYNC-6-A does not commit to a specific JSON
  serialization format (key casing, indentation). The writer
  picks one and pins it byte-for-byte in tests.
- BENTON-SYNC-6-A does not authorize wiring the artifact into
  any non-SyncAtlas caller. Future slice if and when needed.
- BENTON-SYNC-6-A does not change anything about the
  preflight stances themselves. C49-FK / C50-CONV-PROMOTE /
  C51-PII-PROMOTE remain authoritative.
- BENTON-SYNC-6-A does not promote a multi-county aggregation
  shape. One invocation = one artifact.
