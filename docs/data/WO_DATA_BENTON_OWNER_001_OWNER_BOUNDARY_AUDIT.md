# WO-DATA-BENTON-OWNER-001 — Owner Endpoint / Data Boundary Audit

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-01
**Mode:** Read-only audit (R0). No mutation, no secrets, no deployment.
**Source:** Live anonymous `GET /api/sync/doctrine/state` + `/api/sync/doctrine/lanes`, snapshot `2026-07-01T16:59Z`.
**Authority Boundary:** SW-02 not crossed (read-only). SW-03 not crossed (no credentials used).

---

## Owner Lane — Layer Counts

| Layer | Table | Rows |
|-------|-------|------|
| Raw | `legacy_pacs_raw_owner` | 8,568,960 |
| Truth | `truth_pacs_owner_current` | 774,760 |
| Canonical | `tf_owner` | 97,062 |
| Quarantine | `legacy_tf_unproven_owner_current` | 87,909 |
| Link | `tf_parcel_owner_link` | 686,851 |
| WSDOR val (owner) | `tf_assessment_wsdor` / `truth_pacs_wash_prop_owner_val` | 686,820 / 774,729 |

## Findings

1. **Aggressive distillation raw → canonical.** 8.57M raw owner rows (full PACS ownership history)
   → 774,760 truth → **97,062 canonical current owners**. The `canonical-tf-owner-projector`
   (last `2026-06-21T20:54Z`) extracted 774,760 and promoted 97,062 — a **12.5% promotion rate**,
   consistent with collapsing full history to current distinct owners.

2. **Parcel↔owner links = 686,851** across 84,418 parcels → **avg 8.13 links per parcel**. This is
   ownership *history* (grantor/grantee chains), not current-owner-only. Current ownership is the
   97,062 `tf_owner` set.

3. **Quarantine cohort = 87,909 unproven owner-current rows.** Notably close to the parcel count
   (84,418) and the wsdor quarantine (87,909, identical). This is a **real boundary**: ~87.9k
   owner-current records did not pass truth-gate promotion and are preserved (not deleted) in
   quarantine. `wsdor` quarantine matching owner quarantine (both 87,909) suggests the same cohort
   fails owner-value proof together.

4. **WSDOR owner-value canonical 686,820 vs truth 774,729** → 87,909 gap = exactly the quarantine
   cohort. Internally consistent.

## Boundary

- `/api/owners` → **401** (auth-gated). Owner rows not exposed anonymously.

## Measurement Gap (honest limit)

Cannot, from the anonymous surface, determine: null owner-name rate, % parcels with a resolvable
current owner, or the nature of the 87,909 quarantined owner-current records. Needs credentialed
read (SW-03) or an authenticated owner endpoint. Flagged, not fabricated.

## Recommendation

- Treat **97,062 current owners / 686,851 ownership links** as the demo owner truth.
- The **87,909-row unproven owner-current quarantine** is the top owner data-quality question — worth
  a dedicated (credentialed) follow-up to classify *why* they failed proof. Non-blocking for demo;
  owner surfaces must disclose `unavailable` where a current owner is unresolved.

**WO-DATA-BENTON-OWNER-001: COMPLETE (read-only).**
