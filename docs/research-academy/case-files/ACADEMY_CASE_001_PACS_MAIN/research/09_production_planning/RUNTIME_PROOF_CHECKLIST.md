# Runtime Proof Checklist — ACADEMY_CASE_001_PACS_MAIN

**Stage 6 · Hive D (D3) · 2026-06-12**

Evidence that must be produced (not asserted) before any function cuts over. Each item maps
to a coexistence phase (COEXISTENCE §2/§4). "Proof" = reproducible run + recorded result.

## P1 Shadow proofs (build correctness before authority)

| RP | Proof | Pass criterion |
|----|-------|----------------|
| RP-1 | **Cost value parity** (WS-1a) | TF RCNLD vs PACS `imprv` value within tolerance on a stratified parcel sample |
| RP-2 | **Land value parity** (WS-1b) | TF land vs PACS `land_detail` within tolerance |
| RP-3 | **Reconciled assessed parity** (WS-1e) | TF `TfAssessment` vs PACS `property_val`/`wash_prop_owner_val` within tolerance per property class |
| RP-4 | **Ratio study reproduction** (WS-1c) | TF median/COD/PRD reproduces the county's published study |
| RP-5 ★ | **Supplement round-trip** (PR-1/RK-3) — **confirmed WS-1/migration gate candidate** (corroborated by the canonical pipeline proof's Journal piece, 2026-06-12) | A supplemented parcel resolves the correct active-supplement value via SourceXref lineage; no history loss |
| RP-6 | **Income value parity** (WS-1d) | TF income value vs county apt/hotel study within tolerance |

## P2 Cutover proofs (workflow + levy)

| RP | Proof | Pass criterion |
|----|-------|----------------|
| RP-7 | **Appeal lifecycle** | A BOE case runs end-to-end in TF and reconciles to `_arb_protest` semantics (assigned vs final value) |
| RP-8 | **Exemption application+review** | Senior/disability exemption computes correct value impact + DOR amounts |
| RP-9 | **Levy certification** (WS-2) | Cert state machine drives Draft→Certified with audit trail; statutory limits reproduce `levy_cert_*` on sample districts |
| RP-10 | **Audit stamping** (WS-3) | Every write stamped (CreatedAt/By, UpdatedAt/By); audit log entry created; matches `chg_log` continuity — **RP-10.1–10.5 ✅ green** (T1–T8, see `WS3_RP10_EVIDENCE.md`, 2026-06-12); RP-10.6 `chg_log` continuity ⏳ deferred to cutover |

## P3 Cutover proofs (final)

| RP | Proof | Pass criterion |
|----|-------|----------------|
| RP-11 | **Vendor egress severed** | No traffic to `synclogs.harrisgovern.com` after cutover (MB-7) |
| RP-12 | **County isolation** | No cross-county data access under CountyId filter (sovereign-county) |
| RP-13 | **Full roll certification** | Certified assessment roll reconciles to PACS totals (`appraisal_totals*`) |

## Tolerances (to set with the Assessor)
Document acceptance tolerances per property class before P1 (e.g. residential ±1%, complex
commercial wider). Tolerances are a county sign-off item, not an engineering default.

## Claim table
| Claim ID | Claim | Evidence | Confidence | Type | Why It Matters |
|----------|-------|----------|------------|------|----------------|
| RPC-1 | WS-1 cannot cut over until value parity (RP-1..3,5) is proven against PACS shadow. | parity gates | A | Fact | Prevents shipping an unvalidated valuation engine. |
| RPC-2 | Supplement round-trip (RP-5) is the concrete test of PR-1's lineage rule. | PR-1 / RK-3 | A | Fact | Ties the architecture finding to a runtime proof. |

## Handoff → RELEASE_GATES (which proofs gate which release).
