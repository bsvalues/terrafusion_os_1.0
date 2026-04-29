# C37-B Comp-Eligibility Fixture Proof

- **Generated (UTC):** 20260429T010956Z
- **County:** Benton (`3be36b0e-7046-46d7-8688-23651167cdac`)
- **Source workbook:** `ea654794-c6b8-46ad-9002-ed8de258ff6f`
- **Workbook locked at (UTC):** 2026-04-28T21:00:00.0000000Z

## C36 run counts

- Rows read:           9
- Qualified:           3
- Excluded:            2
- Inconclusive:        3
- SkippedNoIdentifier: 1
- Rows persisted:      8

## C37 comp pool

- Comp pool size: **3**
- Comp-eligible ChgOfOwnerIds: 100, 101, 102

## Reconciliation (C37-A rule)

- `RowsRead = Qualified + Excluded + Inconclusive + SkippedNoIdentifier` → `9 = 3 + 2 + 3 + 1` → **PASS**
- `CompPoolSize = Qualified` → `3 = 3` → **PASS**

## WacCd-bug containment

Operator-tagged exclusions (e.g. `458-61A-217(1)`) and
workbook-silent codes (e.g. `PRE-2017-CODE`, null) are NOT in the comp pool:

| ChgOfOwnerId | wac_cd            | Transform status | Persisted | In comp pool |
|--------------|-------------------|------------------|-----------|--------------|
| 100 | 458-61A-203(1) | Qualified | yes | yes |
| 101 | 458-61A-203(1) | Qualified | yes | yes |
| 102 | 458-61A-203(1) | Qualified | yes | yes |
| 200 | 458-61A-217(1) | Excluded | yes | no |
| 201 | 458-61A-217(1) | Excluded | yes | no |
| 300 | 458-61A-203(1) | Deferred | yes | no |
| 400 | PRE-2017-CODE | Unknown | yes | no |
| 500 | <null> | MissingCode | yes | no |
| — | 458-61A-203(1) | Qualified | no | no |

All Excluded / Inconclusive / Skipped rows show `In comp pool = no`.
Only Qualified rows enter the pool. **WacCd-bug containment: enforced mechanically.**
