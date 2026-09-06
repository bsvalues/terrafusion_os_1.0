# WACO-E step 1: Benton PII manifest readiness

The Benton manifest is [config/counties/benton-pii-manifest.json](../../config/counties/benton-pii-manifest.json).
It uses the existing C51-PII-B wire schema implemented by
`JsonFilePacsPiiManifestSource`:

- `manifestVersion` and `manifestEvent` identify the authored pass.
- `tables` carries conservative table-level classifications.
- `columns` is empty because this slice has no verified Benton column inventory.
- `tableExhaustive` is intentionally empty.

The shipped schema has no `Unknown` classification. UNKNOWN_DENY is therefore represented
without inventing a new enum: the manifest is engaged, but no table is asserted exhaustive.
Unlisted tables and unreviewed columns remain unverified, and a readiness consumer that
requires verified PII coverage must fail closed for them. A table-level `Direct` assignment
is deliberately conservative for the three PII-bearing tables identified by repository
evidence; it is not an assertion that the table has been exhaustively reviewed.

This is a readiness artifact, not production authorization. It does not enable a consumer,
change runtime configuration, inspect live PACS rows, or claim that Benton coverage is complete.
The next step requires an operator-reviewed catalog inventory before any `tableExhaustive`
entry or column-level `None`/`Indirect` assertion is added.
