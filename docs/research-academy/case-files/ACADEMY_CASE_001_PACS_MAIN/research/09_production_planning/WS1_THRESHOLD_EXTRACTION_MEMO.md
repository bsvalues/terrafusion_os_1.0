# WS1_THRESHOLD_EXTRACTION_MEMO — WO-WS1-PARITY-THRESHOLD-EXTRACTION

**Case:** ACADEMY_CASE_001_PACS_MAIN · 2026-06-13 · **Goal:** derive WS-1 parity gate thresholds
from existing office practice where evidenced; isolate only the truly unresolved items for signoff.
**Rule honored:** no fabricated thresholds. Anything not evidenced is marked unresolved.

## What the corpus actually contains
- **CASE_002** confirms Benton uses all three approaches with **documented, deterministic,
  IAAO/MVS-aligned methodology** (`A-INV-1`), and that **IAAO ratio statistics (median, COD, PRD)**
  are the office's ratio-study basis (`FORGE_VALUATION_ENGINE_REQUIREMENTS.md` FR-3).
- The office's **actual ratio-study artifacts exist** but as **source files in `E:\Files of
  Appraisal` (read-only evidence)** — `10_Sales Analysis Trending/{2023_2024,2024_2025,2025}`,
  `13_Sales Validation`, `Double Sales Studies`, `All Sales 5-28-24.xlsx`, `Sales Analysis Guide.docx`,
  `IAAO_GLOSSARY 2015`. These are **inventoried/mapped** in the corpus, **not extracted as numbers**.
- The WS-1 control docs **explicitly defer** value tolerances: "Tolerances are a county sign-off
  item, not an engineering default" (`RUNTIME_PROOF_CHECKLIST.md`).

## What this means per threshold type
1. **Calibration / ratio-study statistics (COD, PRD, level of assessment)** — the office's basis is
   **IAAO Standard on Ratio Studies** (evidenced via FR-3 + IAAO glossary in the corpus). Standard
   IAAO ranges are therefore **strongly inferable** as the starting anchors (already encoded as
   `CalibrationThresholds` defaults). **Status: inferred from documented IAAO-aligned practice —
   confirm county adoption** (the county may run tighter, e.g. COD ≤ 10 on homogeneous residential).
2. **RP-5 supplement round-trip** — **exact SourceXref lineage**, not a tolerance. **Resolved by
   design; no signoff needed.**
3. **Value-parity tolerances (RP-1/2/3/6 ± %) and minimum sample pass rates** — these are
   **migration-acceptance decisions** ("how close must TF be to PACS"), which appear in **no
   standard and are not extracted in the corpus**. **Status: UNRESOLVED — explicit signoff.**
   (They could be *anchored* by the achieved COD/level in the county's existing ratio studies, but
   that requires parsing the `E:\` source files — a separate read-only extraction, not done here.)

## Net effect on the human ask
- Resolved by design: **RP-5**.
- Reduced to "adopt/confirm" (anchored, not invented): **IAAO calibration stats** (COD/PRD/level)
  for the RP-4 / `CalibrationGate` path.
- Genuinely unresolved (true signoff): **RP-1/2/3/6 value-parity ± % + per-RP pass rate**.

**You can run shadow parity NOW, ungated, for evidence** (the evaluator emits deltas with
`GatePass=null`). Gating requires only the unresolved deltas in `WS1_SIGNOFF_DELTA.md`.

See `WS1_PARITY_THRESHOLD_MATRIX.md` (per-RP), `WS1_PARITY_CONFIG_PROPOSAL.md` (config split),
`WS1_SIGNOFF_DELTA.md` (smallest remaining ask).
