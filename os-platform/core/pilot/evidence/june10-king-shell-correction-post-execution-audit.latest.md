# King Shell Correction Post-Execution Audit

Generated: 2026-05-26T17:06:00.000Z

## Verdict

- Bounded shell correction succeeded: yes
- Transaction committed: yes
- King certification allowed: no
- Production binding allowed: no
- Placeholder rows remain excluded: yes

## Direct Database Verification

- Receipt rows: 1,600
- Active receipt rows: 1,149
- Superseded receipt rows: 451
- Active duplicate groups: 0
- King active rows after correction: 635,872

## Source/Canonical Identity Verification

- Source distinct PINs: 635,896
- Canonical active distinct parcel numbers: 635,872
- Exact overlap: 635,872
- Source-only identifiers: 24
- Source-only non-placeholder identifiers: 0
- Canonical-only identifiers: 0

The remaining 24 source-only identifiers are the policy-held placeholder/tract rows. They were not inserted.

## Boundaries

- This does not certify King workflow completeness.
- Owner/address/value-dependent workflows remain blocked for shell rows.
- Production binding remains blocked.
- `KING_PUBLIC_PARCEL_SHELL` trust posture is recorded in the execution receipt and `IdentityRepairReceiptId`; `canonical_tf.tf_parcel` has no native `TrustLabel` column.
