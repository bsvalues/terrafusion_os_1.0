# Production Pilot Wave 0 — Intake Ticket Tracker

> **Issued:** 2026-02-03 (D+0)  
> **Due:** 2026-02-08 (D+5)  
> **Status:** ⏳ AWAITING OWNER ACKNOWLEDGMENTS

---

## Control Loop

| Milestone | Date | Action |
|-----------|------|--------|
| D+0 | 2026-02-03 | ✅ Tickets issued, ACK required within 24h |
| D+1 | 2026-02-04 | Escalate any ticket without ACK |
| D+2 | 2026-02-05 | Midpoint check-in; escalate non-responders |
| D+5 | 2026-02-08 | Final deadline; slip logged if incomplete |

---

## Ticket Status

| ID | Owner | Fields | ACK | ETA | Values | V-Check |
|----|-------|--------|-----|-----|--------|---------|
| PILOT-REG-001 | Registry | agency_id, service_ids[] | ☐ | — | ☐ | — |
| PILOT-IDN-001 | Identity | operator_id×3, cert_ref×3, approver_id×2 | ☐ | — | ☐ | — |
| PILOT-AUD-001 | Audit | attestation_bundle_ref, audit_packet_ref | ☐ | — | ☐ | — |
| PILOT-CTR-001 | Contracts | mou_version_ref | ☐ | — | ☐ | — |
| PILOT-DR-001 | DR | dr_drill_pass_ref, drill_date | ☐ | — | ☐ | — |

**ACK Progress:** 0/5  
**Values Delivered:** 0/5  
**Validation Pass:** 0/5

---

## PILOT-REG-001 — Registry

**Title:** Production Pilot Wave 0 — Registry Inputs (Agency + Services)  
**Owner:** Registry  
**Due:** 2026-02-08  
**Deliver to:** Update `PILOT_INPUTS_PACKET.yaml` (no other formats)

### Required Fields

| Field | Format | Delivered |
|-------|--------|-----------|
| `agency.agency_id` | `sha256:[0-9a-f]{64}` | ☐ |
| `services.service_ids[]` (1-3) | `sha256:[0-9a-f]{64}` | ☐ |

### Fail-Closed Rejection Criteria

- ❌ Any format mismatch (not `sha256:[0-9a-f]{64}`)
- ❌ Any PII (names, emails, phone numbers, URLs)
- ❌ Services count outside 1–3

### Acknowledgment

- [ ] ACK received
- [ ] ETA provided: ___________

---

## PILOT-IDN-001 — Identity

**Title:** Production Pilot Wave 0 — Identity Inputs (Operators + Certs + Approvers)  
**Owner:** Identity  
**Due:** 2026-02-08  
**Deliver to:** Update `PILOT_INPUTS_PACKET.yaml` (no other formats)

### Required Fields

| Field | Format | Count | Delivered |
|-------|--------|-------|-----------|
| `operators[].operator_id` | `sha256:[0-9a-f]{64}` | ≥3 | ☐ |
| `operators[].cert_ref` | `sha256:[0-9a-f]{64}` | ≥3 | ☐ |
| `approvers.primary[]` | `sha256:[0-9a-f]{64}` | 2 (distinct) | ☐ |
| `approvers.backup[]` | `sha256:[0-9a-f]{64}` | optional | ☐ |

### Constraints

- `primary[0] ≠ primary[1]` (approvers must be distinct)
- `operator_id ∩ approver_id = ∅` (no self-approval)

### Fail-Closed Rejection Criteria

- ❌ Any format mismatch
- ❌ Any PII present
- ❌ <3 operators or missing cert_ref
- ❌ Approvers not distinct
- ❌ Any overlap operator_id ∩ approver_id

### Acknowledgment

- [ ] ACK received
- [ ] ETA provided: ___________

---

## PILOT-AUD-001 — Audit

**Title:** Production Pilot Wave 0 — Audit Inputs (Attestation + Audit Packet refs)  
**Owner:** Audit  
**Due:** 2026-02-08  
**Deliver to:** Update `PILOT_INPUTS_PACKET.yaml` (no other formats)

### Required Fields

| Field | Format | Delivered |
|-------|--------|-----------|
| `evidence.attestation_bundle_ref` | `sha256:[0-9a-f]{64}` | ☐ |
| `evidence.audit_packet_ref` | `sha256:[0-9a-f]{64}` | ☐ |

### Fail-Closed Rejection Criteria

- ❌ Any format mismatch
- ❌ Any URLs / PII included

### Acknowledgment

- [ ] ACK received
- [ ] ETA provided: ___________

---

## PILOT-CTR-001 — Contracts

**Title:** Production Pilot Wave 0 — Contracts Input (MOU Version ref)  
**Owner:** Contracts  
**Due:** 2026-02-08  
**Deliver to:** Update `PILOT_INPUTS_PACKET.yaml` (no other formats)

### Required Fields

| Field | Format | Delivered |
|-------|--------|-----------|
| `evidence.mou_version_ref` | `sha256:[0-9a-f]{64}` | ☐ |

### Fail-Closed Rejection Criteria

- ❌ Any format mismatch
- ❌ Any PII or URLs

### Acknowledgment

- [ ] ACK received
- [ ] ETA provided: ___________

---

## PILOT-DR-001 — DR

**Title:** Production Pilot Wave 0 — DR Inputs (Drill Pass ref + Drill Date)  
**Owner:** DR  
**Due:** 2026-02-08  
**Deliver to:** Update `PILOT_INPUTS_PACKET.yaml` (no other formats)

### Required Fields

| Field | Format | Constraint | Delivered |
|-------|--------|------------|-----------|
| `evidence.dr_drill_pass_ref` | `sha256:[0-9a-f]{64}` | — | ☐ |
| `evidence.drill_date` | `YYYY-MM-DD` | ≥ 2025-11-05 | ☐ |

### Constraint

- `drill_date` must be within **90 days** of 2026-02-03 (i.e., **≥ 2025-11-05**)

### Fail-Closed Rejection Criteria

- ❌ Any format mismatch
- ❌ Drill date too old (< 2025-11-05)
- ❌ Any PII or URLs

### Acknowledgment

- [ ] ACK received
- [ ] ETA provided: ___________

---

## Validation Rules (V001–V006)

| Rule | Description | Status |
|------|-------------|--------|
| V001 | All IDs match `^sha256:[0-9a-f]{64}$` | ⏳ |
| V002 | Two primary approvers are distinct | ⏳ |
| V003 | DR drill_date ≥ 2025-11-05 | ⏳ |
| V004 | ≥3 operators with cert_refs | ⏳ |
| V005 | 1–3 services | ⏳ |
| V006 | No PII patterns | ⏳ |

---

## Post-Intake Pipeline (Locked)

Once all values delivered and V001–V006 pass:

1. Clone EXAMPLE → REAL artifacts
2. Run gates:
   - `launch.package.contract.test.ts` (55/55)
   - `pilot.readiness.contract.test.ts` (45/45)
   - `type-check`
   - `phase83-tools` (32/32)
3. Atomic commit: `docs(ops): instantiate pilot wave 0 with real opaque IDs (value-only)`
4. Execute Day 0 War Room with 2/2 Go/No-Go approval

---

## Escalation Log

| Date | Ticket | Issue | Action Taken |
|------|--------|-------|--------------|
| — | — | — | — |

---

## Decision Log Updates

| Date | Entry | Author |
|------|-------|--------|
| 2026-02-03 | Tickets issued (D+0); awaiting ACKs | IC |

---

*Government. Transcended.*
