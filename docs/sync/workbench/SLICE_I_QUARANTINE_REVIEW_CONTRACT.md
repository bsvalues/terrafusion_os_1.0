# Workbench Slice I — Quarantine Review Contract

**Status**: CONTRACT — no implementation yet  
**Version**: 1.0 · 2026-06-08  
**Depends on**: Workbench v0.1 (Slices A–G), Slice H contract  
**Implements**: TERRAFUSION_SYNC_WORKBENCH_MVP.md §6 (Step 6 — Quarantine Review)  
**Doctrine reference**: TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md §3–§4, SYNC-DOCTRINE-4-IMPL

---

> **Hard rule** (non-negotiable, applies to every design decision in this slice):
>
> **Quarantine review may classify records. It may not move quarantined records
> into canonical tables.**
>
> The operator holds a clipboard — not the ignition key.

---

## 1. What quarantine review is

Quarantine review answers:

> **"Why was this record refused, and what should I do about it?"**

It is a **read-only browse + operator annotation surface**. It reads from the quarantine
tables (SELECT only), displays quarantined records with their reason codes and source context,
and allows the operator to attach a disposition annotation to each record
(`ACCEPT_AS_IS`, `REJECT_PERMANENTLY`, `NEEDS_RESEARCH`).

Those annotations are stored in a **separate disposition table** — they do not modify the
quarantine rows themselves. The quarantine table is immutable after landing.

The operator uses it to:
- Understand the quarantine backlog before approving a dry-run (Slice H → Slice I flow)
- Classify which quarantined records are genuine exclusions vs. fixable dictionary gaps
- Build an operator-reviewed disposition log for the approval audit trail

---

## 2. What quarantine review is NOT

| Claim | Prohibited |
|-------|-----------|
| "These records have been released" | Forbidden — no release occurs |
| "These records are now in canonical" | Forbidden — canonical is untouched |
| "This disposition approves the drain" | Forbidden — disposition ≠ drain approval |
| "Rejecting a record deletes it" | Forbidden — quarantine rows are immutable |
| "Accepting a record promotes it" | Forbidden — ACCEPT means acknowledged, not promoted |
| "This resolves the quarantine" | Forbidden — resolution is a future release slice |

The review panel does NOT create evidence artifacts. It does NOT update lane seal status.
It does NOT trigger any EF ChangeTracker write to truth or canonical schemas.

---

## 3. Mutation prohibition

The quarantine review endpoint and panel **MUST NOT**:

- INSERT, UPDATE, or DELETE any row in `truth_pacs.*` (including quarantine tables)
- INSERT, UPDATE, or DELETE any row in `canonical_tf.*`
- INSERT, UPDATE, or DELETE any row in `legacy_pacs_raw.*`
- Modify any `sync_bridge.source_xref` row
- Write to any doctrine table (`tf_doctrine_*`)
- Update any lane seal registry entry
- Trigger any downstream SignalR event that implies lane completion or drain execution
- Write to `docs/sync/seals/` (no seal artifact is created by disposition)

**Permitted writes** (narrow exceptions, must be labeled as operator annotation):

- Rows in `sync_bridge.quarantine_review_decision` — one row per operator disposition action.
  This table is append-only. Updating a disposition means inserting a new row with the same
  `QuarantineId`, which supersedes the prior row by `CreatedAt` descending.
- Nothing else.

**Verification rule**: after any quarantine review action, the row count in the lane's
quarantine table must be unchanged. If any quarantine row is inserted, updated, or deleted,
the implementation is wrong.

---

## 4. Quarantine record schema (what the panel reads)

The panel reads from the existing quarantine tables. The primary lane is `imprv_attr`
(improvement attribute quarantine), which is the most developed. The pattern generalizes to
other lane quarantine tables.

### imprv_attr quarantine row (read-only)

```
{
  QuarantineId:           bigint,       // primary key — stable reference for disposition
  Lane:                   string,       // "imprv_attr"
  SourceKeyJson:          object,       // { PropId, PropValYr, SupNum, ImprvId, ImprvDetId }
  AttributeCode:          string,       // the unrecognized / refused code
  QuarantineReasonCode:   string,       // see §5
  QuarantineReasonDetail: string,       // human-readable explanation
  UniverseCode:           string,       // universe the parent improvement was classified to
  LandedAt:               string,       // ISO 8601 — when this row was quarantined
}
```

### Other lane quarantine rows

Other lanes (sales, geometry, land, owner) may produce quarantine rows with different
source keys. The panel must display the `SourceKeyJson` as a raw key-value grid — it does
not need to understand the schema of each lane's key. The `QuarantineReasonCode` and
`QuarantineReasonDetail` are common to all lanes.

---

## 5. Reason codes and severity

These are the five quarantine reason codes defined by SYNC-DOCTRINE-4. They apply across all lanes.

| Code | Layer | Severity | Meaning |
|------|-------|----------|---------|
| `UNKNOWN_I_ATTR_VAL_CD` | Landing | MEDIUM | Attribute code not recognized by the landing-layer dictionary. Fix: add the code to `RefreshableImprvAttrDictionary`. |
| `UNKNOWN_ATTRIBUTE` | Canonical | INFO | Attribute definition missing from `canonical_tf.attribute_definition`. Fix: extend schema. |
| `UNIVERSE_MISMATCH` | Truth | HIGH | The attribute's expected universe does not match the improvement's classified universe. May indicate a classification error or a multi-use attribute. |
| `DISQUALIFIED_SUPPLEMENT` | Landing | LOW | Source row failed the active-supplement filter (SupNum mismatch or inactive supplement). Normal exclusion — not a defect. |
| `DOCTRINE_EXCLUDE` | Truth | CRITICAL | A doctrine rule explicitly excludes this record. The rule is intentional; the record is expected to stay quarantined. |

### Severity display rules

| Severity | Color (UI) | Default sort order |
|----------|-----------|-------------------|
| CRITICAL | Red `#ef4444` | 1st |
| HIGH | Amber `#f59e0b` | 2nd |
| MEDIUM | Yellow `#eab308` | 3rd |
| LOW | Gray `#94a3b8` | 4th |
| INFO | Dark `#475569` | 5th |

Severity is derived from the reason code — it is not stored separately. The panel computes
it from the `QuarantineReasonCode` using the table above.

---

## 6. Operator disposition states

The operator may attach one of three dispositions to any quarantine record:

| Disposition | Meaning | What it does NOT mean |
|-------------|---------|----------------------|
| `ACCEPT_AS_IS` | I have reviewed this record. It is quarantined for a legitimate reason and does not need immediate action. | Does NOT promote the record to canonical. |
| `REJECT_PERMANENTLY` | This record should be excluded from any future release consideration. It is noise / invalid data. | Does NOT delete the quarantine row. It is a flag for future release tooling. |
| `NEEDS_RESEARCH` | I cannot classify this record without more information. It needs further investigation before any disposition. | Does NOT trigger any automated research. |

**No disposition state causes automatic release or promotion.** Release is a future slice
with its own explicit confirmation gate. The disposition is advisory input for that gate —
it does not bypass it.

**Default state**: `UNREVIEWED`. Records that have no operator disposition are `UNREVIEWED`.
The review panel must make the count of `UNREVIEWED` records prominently visible so the
operator knows how much of the backlog has been addressed.

---

## 7. Disposition record schema

Dispositions are stored in `sync_bridge.quarantine_review_decision`, separate from the
quarantine table. This table is append-only.

### Proposed schema

```sql
CREATE TABLE sync_bridge.quarantine_review_decision (
  Id               BIGSERIAL PRIMARY KEY,
  QuarantineId     BIGINT NOT NULL,          -- references the quarantine row (no FK constraint — quarantine tables vary by lane)
  Lane             VARCHAR(64) NOT NULL,      -- which lane's quarantine table holds QuarantineId
  Disposition      VARCHAR(32) NOT NULL,      -- ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH
  OperatorNote     TEXT NULL,                 -- optional free-text annotation (max 500 chars)
  OperatorIdentity VARCHAR(256) NOT NULL,     -- who set this disposition
  CreatedAt        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qrd_quarantine_id_lane ON sync_bridge.quarantine_review_decision (QuarantineId, Lane, CreatedAt DESC);
```

**Current disposition** = the most recent row for a given `(QuarantineId, Lane)` pair by
`CreatedAt DESC`. The panel always displays the current disposition. Prior dispositions are
retained for audit.

**Operator identity**: populated from the workbench session context (OS user or configured
operator name). The workbench is a local single-operator tool — this is not a multi-user
auth system.

---

## 8. Browse and filter interface

The panel presents a paginated list of quarantine records with filter controls.

### Filters (all optional, combinable)

| Filter | Options |
|--------|---------|
| Lane | All \| imprv_attr \| sales \| geometry \| land \| owner \| … |
| Reason code | All \| UNKNOWN_I_ATTR_VAL_CD \| UNKNOWN_ATTRIBUTE \| UNIVERSE_MISMATCH \| DISQUALIFIED_SUPPLEMENT \| DOCTRINE_EXCLUDE |
| Severity | All \| CRITICAL \| HIGH \| MEDIUM \| LOW \| INFO |
| Disposition | All \| UNREVIEWED \| ACCEPT_AS_IS \| REJECT_PERMANENTLY \| NEEDS_RESEARCH |
| Universe | All \| REAL_RESIDENTIAL \| REAL_COMMERCIAL \| AG_CURRENT_USE \| MOBILE_HOME \| PERSONAL_PROPERTY \| CONVERSION_LEGACY \| UNKNOWN |

### Page size and sort

- Default page size: 50 records
- Default sort: severity (CRITICAL first), then `LandedAt` descending
- Sort controls: severity, LandedAt, disposition state
- Pagination: simple prev/next with total count displayed

### Per-record display

Each row in the list shows:

```
[SEVERITY badge]  [ReasonCode]  [Lane]  [AttributeCode or source key summary]
[LandedAt]  [Disposition badge]  [Note excerpt if present]
```

Clicking a row expands a detail panel showing:

```
Source key:       PropId=321209 PropValYr=2025 SupNum=0 ImprvId=1 ImprvDetId=3
Attribute code:   CovPatio
Reason:           UNKNOWN_I_ATTR_VAL_CD
Detail:           Code 'CovPatio' not found in RefreshableImprvAttrDictionary at drain time
Universe:         REAL_RESIDENTIAL
Landed at:        2026-06-08T14:23:01Z

Current disposition:  [UNREVIEWED]
[○ Accept as-is]  [○ Reject permanently]  [○ Needs research]
[Optional note: ________________]
[Save disposition]
```

**No PII expansion.** The detail panel shows source keys and attribute codes only. It does
not fetch the full source row from `legacy_pacs_raw` or show owner names, parcel addresses,
or financial data.

### Summary header

At the top of the panel, before the list:

```
Quarantine Review — [Lane] — [Total count] records
  UNREVIEWED: N  |  ACCEPT: N  |  REJECT: N  |  NEEDS_RESEARCH: N
  CRITICAL: N  |  HIGH: N  |  MEDIUM: N  |  LOW: N  |  INFO: N
```

The `UNREVIEWED` count is shown in amber when > 0 to make the backlog visible.

---

## 9. Export format

The panel provides an export of the **current filtered view** in JSON format.

### Export object

```json
{
  "exportedAt": "ISO 8601",
  "lane": "imprv_attr",
  "filters": { "reasonCode": null, "disposition": "UNREVIEWED", "universe": null },
  "totalInView": 9504,
  "records": [
    {
      "quarantineId": 12345,
      "lane": "imprv_attr",
      "sourceKey": { "PropId": "321209", "PropValYr": 2025, "SupNum": 0 },
      "attributeCode": "CovPatio",
      "reasonCode": "UNKNOWN_I_ATTR_VAL_CD",
      "reasonDetail": "Code 'CovPatio' not found in dictionary at drain time",
      "universe": "REAL_RESIDENTIAL",
      "severity": "MEDIUM",
      "landedAt": "2026-06-08T14:23:01Z",
      "disposition": "UNREVIEWED",
      "operatorNote": null
    }
  ]
}
```

**Export is read-only output.** It does not trigger any backend mutation.

**No CSV.** JSON only — structured data, preserves types, avoids implicit PII exposure
from flat-file consumers.

**Max export size**: 10,000 records per export call. If the filtered view exceeds 10,000,
the export is capped and labeled `"truncated": true`. The operator must apply narrower
filters to export the full set.

---

## 10. Relationship to Slice H (dry-run preview)

Slice H and Slice I address opposite ends of the quarantine question:

| Slice H (preview) | Slice I (review) |
|-------------------|-----------------|
| "How many records WOULD be quarantined if I drain now?" | "What records ARE quarantined from a prior drain?" |
| Future-facing projection | Present-state browse |
| Shows projected quarantine rate and top-5 reasons | Shows actual quarantined rows with full reason detail |
| Verdict: PASS / WARN / BLOCKED | No verdict — operator annotates |
| Output feeds drain approval gate | Output feeds future release gate |

Both are read-only. Neither releases records. The natural workflow is:

```
1. Run doctor (Slice A) → check identity / lane seals
2. Run dry-run preview (Slice H) → see projected quarantine rate
3. If rate high: open quarantine review (Slice I) → understand what's there
4. Classify records (Slice I) → build disposition log
5. Re-run dry-run preview (Slice H) → confirm projected rate acceptable after understanding
6. [future] Approve drain → drain executes → new quarantine accumulates → cycle repeats
```

---

## 11. Future approval dependency — release gate (not in Slice I)

The disposition log (ACCEPT / REJECT / NEEDS_RESEARCH) is advisory input for a future
**quarantine release gate**. That gate is not designed or implemented in Slice I.

When it is designed, it will require:

- All CRITICAL records have a disposition (no UNREVIEWED CRITICAL records allowed before release)
- The operator explicitly confirms which dispositions authorize release consideration
- Machine records: operator identity, disposition snapshot timestamp, quarantine count at
  decision time
- Release executes only rows where disposition is `ACCEPT_AS_IS` AND the future gate approves them

**This gate is out of scope for Slice I.** Slice I provides the clipboard. The release gate
is a future slice.

---

## 12. Acceptance criteria

Slice I is complete when:

- [ ] `GET /api/sync/quarantine/review?lane={lane}&reasonCode={code}&disposition={d}&page={n}` returns
      paginated quarantine records with current disposition joined from `quarantine_review_decision`
- [ ] `POST /api/sync/quarantine/review/{quarantineId}/disposition` accepts `{ lane, disposition, note }`
      and inserts a row into `quarantine_review_decision` (no other table modified)
- [ ] `GET /api/sync/quarantine/review/export?lane={lane}&...` returns the JSON export object (max 10k rows)
- [ ] After saving any disposition, a SELECT on the lane's quarantine table shows the same row count
      (mutation prohibition verified)
- [ ] The panel heading renders with lane name and record count; `UNREVIEWED` count shown in amber
- [ ] Per-record detail panel shows source key, reason code, reason detail, universe, LandedAt,
      current disposition, and disposition controls — no PII expansion
- [ ] Disposition controls are radio buttons with a Save button — not checkboxes, not toggles,
      not auto-save-on-click (operator must explicitly submit)
- [ ] 409 guard prevents concurrent disposition saves for the same QuarantineId
- [ ] Export produces valid JSON; truncated exports are labeled `"truncated": true`
- [ ] The panel does NOT display any "Release", "Promote", "Commit", or "Approve drain" control

---

## 13. Out-of-scope for Slice I

| Excluded item | Deferred to |
|--------------|-------------|
| Quarantine release / promotion to canonical | Future release gate slice |
| Bulk disposition (select all → mark all) | Future UX enhancement |
| Automated disposition based on reason code | Explicitly forbidden — dispositions are human decisions |
| PII expansion (owner name, address, financial detail per quarantine row) | Permanently excluded — operator uses source docs for research |
| Quarantine deletion or archival | Quarantine rows are immutable — no deletion path |
| Cross-lane quarantine merge view (unified list across all lanes) | Future slice — per-lane browse only in v0.2 |
| Drain trigger from review panel | Explicitly forbidden |
| Dictionary update from review panel (e.g. "add this code") | Separate slice — dictionary management |
| Quarantine trend / history chart | Future analytics — out of v0.2 scope |
| Multi-county quarantine comparison | Out of scope — Benton single-county only in v0.2 |

---

## 14. Implementation notes (not prescriptive — for reference only)

**Current quarantine data state**: as of 2026-06-08, the `imprv_attr` quarantine went from
9,504 rows → 0 after SYNC-DOCTRINE-4-V8 (dictionary refresh + drain). Future drains will
re-accumulate quarantine as new PACS data is processed. The review panel must handle both
the empty-quarantine state (shows "No quarantine records for this lane") and a full backlog.

**Existing profiler endpoint**: `GET /api/sync/doctrine/policy/quarantine/imprv-attr/profile`
(V7 implementation) returns aggregate counts by reason and code. Slice I does NOT replace
this — it adds row-level browse on top of it. The profiler remains useful for the summary
header.

**`quarantine_review_decision` does not exist yet.** It needs an EF migration before Slice I
endpoint can write dispositions. This is the only schema change required for Slice I.

**Lane-agnostic browse endpoint**: the browse endpoint uses `lane` as a query parameter to
route to the correct quarantine table. The implementation must maintain a registry of lane →
quarantine table name. This registry must be checked against the actual schema — not hardcoded
to only `imprv_attr`.

**Page-load vs. doctor-triggered**: the quarantine review panel is **operator-initiated**,
not automatic. It does not render on page load and does not render after a doctor run. The
operator opens it intentionally, selects a lane, and requests the browse. This is different
from Slices F and G (page-load) and Slices B–E (doctor-triggered).

---

## 15. Contract sign-off

This contract must be confirmed before any Slice I implementation begins.

The implementation may NOT add features beyond what is defined here without a contract
amendment. The following are specifically prohibited without amendment:

- Any quarantine release, promotion, or canonical write
- Any automated disposition logic
- Any drain trigger, implicit or explicit
- Any PII expansion in the per-record detail panel
- Any cross-lane unified view

---

_Contract before code. This document is the single source of truth for Slice I._  
_Implementation follows only after this contract is confirmed._

**Prepared**: 2026-06-08  
**Status**: DRAFT — awaiting operator confirmation
