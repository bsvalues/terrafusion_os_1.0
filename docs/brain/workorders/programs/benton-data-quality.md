# P2 — Benton Data Quality

**Program:** P2  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Separate real Benton County data quality issues from app/config problems. Each WO investigates one data gap, produces a finding doc, and surfaces a decision: accept with documented risk, fix, or escalate to PACS reload (which requires explicit operator authorization).

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Read-only DB queries (SELECT) | Data mutation / DELETE / UPDATE |
| Investigation docs | PACS connection |
| Accept/acknowledge decisions | New PACS drain |
| Evidence packets | Schema changes |
| — | ArcGIS mutation |
| — | New sync pass without operator go-ahead |

---

## Work Orders (Ordered)

| WO | Title | Status | Blocker |
|----|-------|--------|---------|
| WO-DATA-BENTON-DUPE-001 | Investigate 84,418 raw rows vs 84,388 distinct parcels | **NEXT** | None |
| WO-DATA-BENTON-ADDR-001 | Address/legalDescription null-field audit | QUEUED | None |
| WO-DATA-BENTON-GEOM-001 | Geometry endpoint/data availability decision | QUEUED | None |
| WO-DATA-BENTON-OWNER-001 | Owner endpoint/data boundary decision | QUEUED | None |
| WO-DATA-BENTON-IMPR-LAND-001 | Improvements/land endpoint gap audit | QUEUED | None |
| WO-DATA-BENTON-EVIDENCE-ROLLUP | Data truth packet for demo/prototype/release decisions | QUEUED | All above |

---

## WO-DATA-BENTON-DUPE-001 Definition

**Goal:** Investigate and document the 14 parcel-number groups with duplicate rows in `canonical_tf.tf_parcel`. Determine root cause (source duplication in PACS, ETL bug, merge artifact). Produce findings doc. Do not mutate data.

**Key facts:**
- Raw row count: 84,418
- Distinct parcel numbers: 84,388
- Delta: 30 extra rows across 14 groups
- Current impact: `db-identity.passed: False` (count gate fails); `db-content.passed: True` (distinct-based gate passes)

**Investigation queries (read-only):**
```sql
-- Find duplicate groups
SELECT parcel_number, COUNT(*) cnt
FROM canonical_tf.tf_parcel
GROUP BY parcel_number
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- Examine one group for pattern
SELECT * FROM canonical_tf.tf_parcel
WHERE parcel_number = '<duplicate_parcel_number>'
ORDER BY updated_at;
```

**Decision output:**
1. Accept duplicates + update `expectedBentonParcelCount` to 84,418 to match raw rows (weakens the distinct check)
2. Fix duplicates (DELETE or MERGE — requires operator authorization + WO)
3. Add DISTINCT to `db-identity` count query to match `db-content` behavior

**Outputs:**
- `docs/data/WO_DATA_BENTON_DUPE_001_FINDINGS.md`
- Operator decision recommendation

---

## WO-DATA-BENTON-ADDR-001 Definition

**Goal:** Audit why `address` and `legalDescription` are null in `canonical_tf.tf_parcel`. Determine: was address ever loaded from PACS? What PACS table/column is the source? Is there a crosswalk already in the data layer? What would a load require?

**Known:** PACS text fields (address, legal) were not loaded in the current sync pass. 86,418 rows have NULL address.

---

## WO-DATA-BENTON-GEOM-001 Definition

**Goal:** Document the geometry situation: 79,199 shapes in `gis_tf.tf_parcel_geom` vs 84,388 parcels. Are the 5,189 missing parcel geometries expected? Is a read endpoint implementable without a new sync pass?

---

## WO-DATA-BENTON-OWNER-001 Definition

**Goal:** Document owner data: 97,062 rows (raw owners), 686,851 parcel-owner links. Is this the correct structure? Can a read endpoint be built safely for demo? What is the owner-to-parcel cardinality?

---

## WO-DATA-BENTON-IMPR-LAND-001 Definition

**Goal:** Audit improvements and land tables in `canonical_tf`. Are rows loaded? What is the row count vs parcel count? Is a read endpoint feasible?

---

## WO-DATA-BENTON-EVIDENCE-ROLLUP Definition

**Goal:** Produce a single data truth packet that answers: "Is the Benton demo DB accurate enough for a stakeholder demo? For a prototype? For production use?" Three distinct answer levels, each with evidence citations.

---

## Dependency Chain

```
DUPE-001 ─┐
ADDR-001  ─┤
GEOM-001  ─┼─→ EVIDENCE-ROLLUP → P1 production decision
OWNER-001 ─┤
IMPR-001  ─┘
```

WOs in this program can run in parallel — no cross-dependency within P2. EVIDENCE-ROLLUP requires all others complete.

---

## Stop Conditions

- Any investigation WO that finds data corruption requiring PACS reload must stop and escalate to operator
- Do not run a new sync pass without operator authorization
- Do not connect PACS in any investigation WO
