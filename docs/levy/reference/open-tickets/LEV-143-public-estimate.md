# LEV-143 — Public Estimate Surface

**Status:** OPEN | **Blocking:** T-5 | **Priority:** HIGH (citizen-facing)

## Problem
No LEV-### ticket currently defines the citizen-facing Public Estimate
surface. This is the surface the county's equity resolution, WCAG
accessibility audit, and PRA obligations all touch.

## Requirements (hard — not negotiable)

### Accessibility
- **WCAG 2.1 AA** with NVDA + JAWS screen-reader verification (not just
  keyboard navigation)
- Minimum 4.5:1 contrast; all interactive elements ≥ 44×44 CSS pixels
- No color-only information conveyance

### Localization
- **Spanish** — Benton is ~21% Hispanic per last ACS
- No English-only surfaces citizen-side
- Translation QA by bilingual staff, not machine-only

### Plain language
- **No RCW citations in the citizen surface** — citations live in tooltip
  or "audit details" progressive disclosure, not front-facing text
- Reading level target: grade 8 or below (Flesch-Kincaid)
- Per-district breakdown uses district-name labels, not district IDs

### Print
- CSS print stylesheet OR PDF export — citizens bring print-outs to counters
- Print view includes correlationId + date generated + "this is an estimate,
  not a bill" disclaimer

## Open questions for Assessor + equity review
1. Does Benton have an existing public-facing tax-estimator disclaimer
   template we should adopt?
2. Is there a bilingual-staff reviewer designated for translation QA?
3. Print artifact — PDF with hand-sign-off line, or web-print CSS only?

## Deliverable shape (sketch)
- Route: `/public/estimate?parcelId=...` (anonymous, no auth)
- Input: parcel number OR address search
- Output: per-district breakdown + total estimated bill + "as of {date}" +
  correlationId + disclaimer
- Senior-freeze aware if LEV-141 applies
- Banner: "Estimate only. Actual bill will be issued by the Treasurer."

## References
- WCAG 2.1 AA — https://www.w3.org/WAI/WCAG21/quickref/
- Benton County equity resolution (Specialist / Assessor to provide)
- LEV-141 (senior freeze)
- LEV-142 (retention of generated estimates under PRA)
