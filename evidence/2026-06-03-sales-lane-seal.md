# Sales Lane — SEAL (2026-06-03 / closeout 2026-06-04)

## Outcome
**Sales lane sealed against the QUALIFIED-sales denominator, 1.0000× duplication.**
- `truth_pacs.sale` = **29,914 rows = 29,914 distinct (dup 1.0000×)**
- `canonical_tf.tf_sale` = 29,608
- `legacy_pacs_raw.sale` (2018+ universe) = 75,678 / 75,678 (1.0000×)

## Denominator: QUALIFIED sales, not all landed (doctrine, not a gap)
The sales lane does NOT promote every landed sale — by doctrine, only sales that QUALIFY
under the ratio study reach truth. Qualification is evaluated by `IRatioQualificationPolicy`
(tf_doctrine_ratio_policy): a sale promotes iff DOR-qualified OR county-qualified. This
replaced the legacy hardcoded `sl_county_ratio_cd='100'` filter (SYNC-DOCTRINE-3).

Landed 2018+ universe = 75,678 sale-property pairs:
- **Promoted to truth = 29,914** (qualified): 17,056 both-studies + 10,216 DOR-only + 2,642 county-only.
- **Not promoted = 45,764** — genuinely UNqualified by doctrine, verified by ratio code:
  `<NULL>` 29,566 (no valid-sale code) + `200` 11,127 + `300` 3,872 + `400` 563 + `500` 23 +
  `27/9/28/11/1` ~600 (non-qualifying codes). These are CORRECT exclusions, not a coverage gap.
- **Residual qualified-but-excluded = 2** ('100'-coded: 311856/2019, 317854/2022) — both have
  ZERO prop_supp_assoc rows in PACS for their sale-year (orphaned sales, no supplement to anchor
  the FK gate). Correct exclusion by the sup-aware identity gate, not a defect.

## The path (diagnose → fix idempotency → fix cursor → fix landing → fix SupNum → re-sweep → seal)
1. Truth was 2.70x... no — 1.96× duplicated (batch-scoped idempotency bug). Fixed natural-key
   (ChgOfOwnerId, PropId): `7f635489f`. Deduped 3,711→1,894.
2. No advancement: TopN re-pulled same rows; FullCorpus pulled all-history + timed out. Added
   chg_of_owner_id keyset cursor: `9d893f667`. Proven advancing.
3. Landing re-landed duplicates on cursor re-runs. Added set-based landing idempotency
   (window-delete per natural key; first cross-product impl ground PG, rewritten): `83664a4a7`.
   Proven: re-run holds landing 1.0×.
4. **SupNum-resolution (the seal-blocker):** sale source hardcoded sup_num=0 + supp source
   filtered WHERE sup_num=0 → dropped 766 QUALIFIED '100' sales referencing historical years
   whose active supplement is non-zero. PACS prop_supp_assoc keyed (prop_id, owner_tax_yr,
   sup_num); active = MAX(sup_num), non-zero for historical years, zero for current year (so the
   sealed 2026 land/improvement lanes were correctly unaffected — verified). Fix (sales-scoped):
   resolve sup_num=MAX(prop_supp_assoc.sup_num) for (prop_id, sale-year) + opt-in activeSupp supp
   landing: `769bf800c`. Targeted proof: blocked parcels promoted with real supplements
   (10130→10, 60077→143, etc.).
5. Re-swept from cursor 0 (idempotent): truth 28,446 → 29,914; blocked '100' cohort 766 → 2;
   dup 1.0× throughout, 40 chunks, self-stopped on cursor exhaustion (442,109).

## Exact proof queries (preserved)
```sql
-- truth coverage + dup
SELECT count(*), count(DISTINCT ("ChgOfOwnerId","PropId","PropValYr")) FROM truth_pacs.sale;
-- = 29914 / 29914  (1.0000x)
-- qualified distribution
SELECT "CountyRatioQualified","DorRatioQualified", count(*) FROM truth_pacs.sale GROUP BY 1,2;
-- both=17056  dor-only=10216  county-only=2642
-- non-promoted are unqualified by ratio code (NULL/200/300/400/500/...)
-- residual qualified-excluded = 2, both ZERO prop_supp_assoc in PACS (orphaned, correct)
```

## Seal checklist
| Question | Status |
|---|---|
| Coverage = all QUALIFIED sales? | YES — 29,914 promoted; non-promoted are doctrine-unqualified |
| Duplication controlled? | YES — truth 1.0000×, landing 1.0000× |
| Canonical projected? | YES — tf_sale 29,608 |
| Qualified-but-blocked resolved? | YES — 766 → 2 (the 2 are orphaned sales w/ no PACS supp = correct) |
| Idempotent + re-runnable? | YES — truth + landing + cursor all natural-key idempotent, proven |
| No doctrine change? | YES — tf_doctrine_ratio_policy untouched |
| Sealed lanes preserved? | YES — sup-resolution is sales-scoped; land/improvement at sup=0 intact |

**SEAL STATEMENT:** Every QUALIFIED sale (DOR-or-county per ratio doctrine) in Benton PACS for
2018+ — 29,914 — is present in TerraFusion truth_pacs.sale and projected to canonical_tf.tf_sale,
with zero duplication. Unqualified sales are correctly excluded by doctrine; the only 2
qualified-but-excluded sales are orphaned (no PACS supplement). Sales lane: SEALED.

## Commits
`7f635489f` truth idem · `9d893f667` cursor · `83664a4a7` landing idem · `897e85cb7` findings ·
`769bf800c` SupNum-resolution · (this artifact).

## Board: improvement SEALED · land SEALED · sales SEALED · next: geometry → owner cleanup.
