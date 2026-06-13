# WS1_SIGNOFF_DELTA — WO-WS1-PARITY-THRESHOLD-EXTRACTION

The smallest remaining human-decision set after extraction. Everything else is resolved by design
or anchored to IAAO standard for confirmation. **Do not expand this list.**

## Truly unresolved — require explicit Assessor/county signoff
| # | Decision | Applies to | Why it can't be extracted |
|---|----------|-----------|---------------------------|
| D1 | **Value-parity tolerance (± %) per property class** | RP-1, RP-2, RP-3 | Migration-acceptance decision ("how close must TF be to PACS"); in no standard and not in corpus |
| D2 | **Minimum sample pass rate** (e.g. 90%) | RP-1/2/3/6 | County acceptance threshold; not a published standard |
| D3 | **Income value-parity tolerance** + **income-study source** | RP-6 | Tolerance is a county decision; the comparison study is external (`E:\`), not in TruthPacs |

## Reduced to "confirm adoption" (anchored to IAAO standard — answer is likely yes)
| # | Decision | Proposed (IAAO) | Action |
|---|----------|-----------------|--------|
| C1 | Level-of-assessment band | 0.90–1.10 | confirm or set county value |
| C2 | COD ceiling | ≤ 15 (≤ 10 homogeneous residential) | confirm or refine per class |
| C3 | PRD band | 0.98–1.03 | confirm |

## Resolved by design — no signoff
- **RP-5 supplement round-trip** = exact SourceXref lineage (no tolerance).
- Engine method = IAAO ratio statistics (already implemented + tested).
- Run can proceed **ungated in shadow** for evidence with zero config.

## One-paragraph ask (replaces "ask the assessor for everything")
> To gate WS-1 parity we need three decisions: (D1) acceptable value-parity tolerance (± %) per
> property class for cost/land/reconciled, (D2) the minimum sample pass rate, and (D3) the income
> tolerance + which income study is the RP-6 baseline. Separately, please confirm we may adopt the
> IAAO standard ratio-study thresholds (level 0.90–1.10, COD ≤ 15, PRD 0.98–1.03) for QC, or provide
> the county's preferred values. RP-5 needs no decision (exact lineage). Until D1–D3 are set, the
> run stays ungated and cannot claim a G1 pass.

## Optional follow-on to shrink D1/D3 further (not done in this WO)
Parse the county's existing ratio studies (`E:\Files of Appraisal\10_Sales Analysis Trending`,
`13_Sales Validation`, `Double Sales Studies`) to extract achieved COD/level by class and **propose
evidence-anchored** tolerance ranges for D1/D3 — turning two of the three asks into "confirm" rather
than "decide." Requires read-only access to those source files; flagged, not assumed.
