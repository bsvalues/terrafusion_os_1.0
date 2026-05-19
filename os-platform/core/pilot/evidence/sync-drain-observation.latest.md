# June 10 Sync Drain Observation

Generated: 2026-05-14T00:19:27.4814580Z

## Scope

This is a read-only observation while the active Sync drain continues. It does not certify runtime readiness and does not replace the full-corpus evidence generator.

## Process

| Field | Value |
|---|---|
| PID | 56564 |
| Process | dotnet |
| Started | 2026-05-13T12:08:26-07:00 |
| Responding | true |

## Ports

No listeners were found on ports 5046, 5056, or 5173 during this observation.

## TerraFusion DB Snapshot

| Table | Rows |
|---|---:|
| legacy_pacs_raw.owner | 5,604,894 |
| truth_pacs.parcel_spine | 428,467 |
| canonical_tf.tf_parcel | 3,197,521 |
| canonical_tf.tf_sale | 98 |

## Interpretation

The drain is still active. Runtime should not be restarted, and runtime truth packets should not be regenerated from this in-progress state.

Next action after terminal completion or failure: start a clean API and regenerate the full-corpus evidence/readiness packets.

## Guardrails

- No runtime restart was performed.
- No source-system connection was opened.
- No database mutation was performed.
- No `generated/truth` artifact was hand-edited.
