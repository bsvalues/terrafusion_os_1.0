# TerraFusion Sync — Automation Backlog

_Locked 2026-06-08. Companion to `TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md`. Answers one question:
**what do we automate from Benton so the next county is boring?** Benton was the painful prototype run
by hand; each item below is a piece of that manual process turned into reusable machinery._

Target operator throughout: **one technical assessor (SQL Server + Excel), not a DevOps team.**

---

## Roadmap phases

```
Phase 1 — Engine hardening   turn Benton's manual process into repeatable tools (items 1–8)
Phase 2 — Workbench MVP      the assessor-facing 7-step flow (item 10 + UI around the engine)
Phase 3 — Source Packs       package Benton doctrine into reusable packs (item 6 applied)
```
Do **not** start these now without an explicit go — this is the backlog, not a work order. Phase 1
items are the highest leverage (they would have caught F1 and the domain gaps early).

---

## Backlog (priority order)

### 1. Identity-spine drift detector  ✅ BUILT 2026-06-08
`tools/sync/identity-drift-detector.sql`. A generic gate: **count canonical rows whose parcel FK does
not resolve to the live parcel spine; if > 0, FAIL loudly.** Run per lane, per drain.
- *Would have caught F1 immediately* (`tf_land`/`improvement`/`geometry` keyed to a dead identity).
- First Benton run: 10/11 PASS. One FAIL: `canonical_tf.tf_parcel_owner_link` 1,397,252 dangling rows
  (66%). Explicitly deferred — NOT F1-class. All sealed lane tables PASS.

Doc: `docs/sync/automation/identity-drift-detector.md`

### 2. seal-check runner  ✅ BUILT 2026-06-08
`tools/sync/seal-check-runner.sql`. Checks, in one psql command, what we checked by hand for weeks:
22 gates across 9 lane families — row counts vs. sealed benchmarks, 1:1 parity invariants, rollup
`SUM(BillCount)` = line count, no-duplicate natural keys, revenue amount totals, balance arithmetic
identity. FAIL rows sorted first; OVERALL verdict in statement 2. First Benton run: **22/22 PASS**.

Doc: `docs/sync/automation/seal-check-runner.md` · Evidence: `evidence/2026-06-08-seal-check-runner-benton-pass.md`

Not yet checked by this runner: identity-drift (use Automation #1) · source denominator / PACS counts ·
active-supplement violation in truth layer · quarantine delta · readback sample.
These are the next natural extensions (items 3+ in this backlog).

### 3. Domain coverage audit generator  ✅ BUILT 2026-06-08
`tools/sync/domain-coverage-audit.sql`. Auto-answers *"what source domains exist that are NOT
represented in the seal registry?"* — the question that prevented Benton from overclaiming.
19 PACS domain families classified across all three pipeline layers (landing → truth → canonical).
First Benton run: **12 SEALED · 3 LANDED_ONLY · 3 DISCOVERED_DEFERRED · 1 EMPTY_IN_SOURCE.**

Classifications: SEALED / LANDED_ONLY / DISCOVERED_DEFERRED / EMPTY_IN_SOURCE / OUT_OF_SCOPE.
DISCOVERED_DEFERRED captures conscious boundary decisions (payment ledger, delinquency, fund
distribution) so future counties don't repeat the discovery work.

Doc: `docs/sync/automation/domain-coverage-audit.md` · Evidence: `evidence/2026-06-08-domain-coverage-audit-benton.md`

**Automation triad complete**: Automation #1 (identity sane?) + #2 (seals still true?) + #3 (coverage?)
Run all three at the start of any drain or county-onboarding session.

### 3a. Automation triad wrapper — tf-sync doctor  ✅ BUILT 2026-06-08
`tools/sync/tf-sync-doctor.mjs`. Single command: runs the triad in sequence and emits one
consolidated **PASS / WARN / FAIL** verdict.
- Exit 0 = PASS or WARN (safe to work); Exit 1 = FAIL (do not drain); Exit 2 = error
- Known-deferred items (e.g. `tf_parcel_owner_link` drift) are classified WARN, not FAIL
- First Benton run: `OVERALL: WARN` — substrate clean, 3 known-deferred items present. Exit 0.

Usage: `node tools/sync/tf-sync-doctor.mjs`

Doc: `docs/sync/automation/tf-sync-doctor.md` · Evidence: `evidence/2026-06-08-tf-sync-doctor-benton.md`

### 4. Active-supplement profiler
Per domain, profile how current truth is defined (sup_num distribution, MAX-per-grain, sentinel dates
like the 1980-01-01 ProVal conversion marker). Produces the "active/current rule" line of the lane
contract instead of guessing it.

### 5. Lane contract template
Machine-readable template (the 16 fields from Product Doctrine §6). New lane = fill the template;
the seal-check runner and evidence generator consume it. No more re-deriving "what is a lane."

### 6. Source pack  ✅ BUILT 2026-06-08
`docs/sync/source-packs/SOURCE_PACK_TEMPLATE.md` — 16-section reusable template.
`docs/sync/source-packs/harris-pacs/HARRIS_PACS_SOURCE_PACK.md` — all 11 Benton sealed lanes,
`[Benton ref]` markers throughout, Harris-universal doctrine vs county override clearly separated.
`docs/sync/source-packs/harris-pacs/APPLYING_HARRIS_PACS_PACK.md` — 11-step county onboarding
runbook with SQL confirmation query per lane.
Next Harris county: *Apply pack → profile diffs → confirm/override → gates → seal.*

### 6a. Source pack validator  ✅ BUILT 2026-06-08
`tools/sync/harris-pacs-pack-validator.sql`. One-command read-only check:
**"Does this landing layer conform to the Harris PACS Source Pack spec?"** 66 checks across
table_presence (15), column_structure (38), dictionary (5), data_content (8). Output:
per-check detail + `OVERALL: PASS/WARN/FAIL` summary. First Benton run: **OVERALL PASS** —
fail=0, warn=0, pass=65, info=1. Surfaced one real schema fact during development:
`property_tax_area` uses `TaxYr` not `PropValYr` (fixed + documented).

Doc: `docs/sync/source-packs/harris-pacs/HARRIS_PACS_PACK_VALIDATOR.md`
Evidence: `evidence/2026-06-08-harris-pacs-pack-validator-benton.md`

### 7. Readback set generator
Auto-select a **risk-shaped** parcel set (not random), like Benton's six: plain parcel · with
exemption · non-zero active supplement · special-assessment bill · paid > 0 · complex district set ·
multiple improvements · geometry present · truth-valid zero land/geom. Emits the readback checklist +
expected surfaces + expected-zero surfaces + safe claims + forbidden claims.

### 8. Evidence packet generator
Emit the standard packet shape (Product Doctrine §8) from the lane contracts + seal-check results +
readback set. Stop hand-writing packets; the packet is how solo-dev future-you keeps the plot.

### 9. Quarantine reviewer
SQL/Excel-friendly surface to review quarantined rows grouped by reason, with per-row actions
(map code · ignore · mark legacy-only · manual review · export to Excel). Decisions become reusable
rules in the source pack. (Workbench step 5.)

### 10. Excel mapping grid
Export mapping → edit in Excel → re-import; AI suggests, human approves. YAML may exist as a generated
artifact but is never the source of truth. (Workbench step 3 — the heart of the assessor surface.)

---

## What "done" looks like for this backlog

When items 1–8 exist, a new Harris PACS county conversion is:
```
1. Apply Harris PACS Pack
2. Profile county-specific differences (auto)
3. Confirm or override doctrine (operator, SQL/Excel)
4. Run seal-check per lane (gates yell on drift)
5. Generate readback set + evidence packet
6. Seal
```
Three weeks → days. Benton stops being a heroic one-off and becomes the machine's first output.

---

*Sequencing note: items 1–3 are pure wins (read-only checks that encode the gates we ran by hand) and
are the natural first build when this backlog is authorized. Items 9–10 are the workbench surface and
belong with Phase 2 design (brainstorm first). Nothing here is started until explicitly authorized.*
