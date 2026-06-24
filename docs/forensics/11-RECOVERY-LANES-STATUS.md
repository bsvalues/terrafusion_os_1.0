# Recovery Lanes (11–14) — Status: GATED / NOT STARTED

*Deliverables #11–14 (Needle List, Salvage Plan, Containment Map, Spine Status).*

Per playbook doctrine — **"discovery is not recovery"** and **"no premature collapse"** —
these lanes are **deliberately not executed** in Loop 1. Recovery lock is ACTIVE.

They unlock only when the relevant gates pass (`GATES-STATUS.md`):

| Lane | Deliverable | Unlock gate | Current |
|---|---|---|---|
| 11 Branch disposition & needle extraction | Final Needle List | Gate C (full) | not started — scoring rubric only in Loop 2 |
| 12 Salvage planning | Salvage Plan (per-needle method) | Gate C + D | not started |
| 13 Repo containment & quarantine | Repo Containment Map | Gate D | candidates pre-staged in `05-…`, `08-…`; **no actions taken** |
| 14 Recovery spine restoration | Recovery Spine Status Report | Gate E | spine mapped in `07-…`; no restoration actions |

## Pre-committed recovery doctrine (binding when lanes open)

1. **Disposition values**: `salvage-now` · `compare-later` · `archaeology` · `ignore`.
   No branch becomes a needle while hidden-system risk is materially high.
2. **Recovery methods**: `merge cleanly` (only for root-`f2511bb` branches) ·
   `cherry-pick exact commits` · `manual-port files/hunks` · `salvage-notes-only`.
   **All 653 branches on roots `7c26657`/`5d16d8f` are port-only — never merge.**
3. **No large branch/PR merged on importance alone** — evidence and ordered chains only.
4. **Containment must not destroy salvage evidence** — quarantine before reduce, never delete first.
5. **No hidden rebuilds** of working/partial components without chain-of-custody review.

## Early (non-binding) salvage leads to score in Loop 2
- `r2/w8-real-pilt-calculator`, `r2/w9-real-costforge-calculator`, `r2/w10-real-atlas-gis`,
  `r2/w11-real-dais-permits`, `r2/w12-real-levy-engine`, `r2/w13/w23/w24-dossier` — the
  "real calculator/engine" series (legacy lineage → port-only).
- `feat/sync-pop-4c-canonical-parcel`, `feat/sync-complete-*` — PACS sync corpus.
- `feat/auth-prometheus-criticals-v1` & sibling `*-prometheus-criticals-v1` — may address
  the open FISMA auth gaps (AC-3/AU-2/IA-2).
- `feat/docs-fisma-honest-baseline` — possibly the origin of the honest baseline doc.

These are **leads, not decisions.**
