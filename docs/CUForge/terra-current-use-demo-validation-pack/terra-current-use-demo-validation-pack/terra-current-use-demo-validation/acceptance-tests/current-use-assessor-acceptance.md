# Current Use Assessor Acceptance Tests

## Test A — Parcel Current Use Visibility

Given a classified parcel,
when the assessor opens the Current Use tab,
then the assessor can see:

- classification type
- lifecycle state
- owner
- classified acres
- homesite excluded acres
- evidence status
- rollback exposure estimate

Pass: yes/no

Notes:

---

## Test B — Rollback Calculation

Given a Farm & Ag voluntary withdrawal after 2025-09-01,
when the assessor runs rollback calculation,
then the system shows:

- four rollback years
- additional tax subtotal
- statutory interest
- penalty status
- total due
- explanation ledger
- calculation version
- policy version

Pass: yes/no

Notes:

---

## Test C — Notice Review

Given a pending removal or withdrawal,
when staff generates a notice,
then the notice is preview-only until human approval.

Pass: yes/no

Notes:

---

## Test D — Evidence Packet

Given a parcel missing required documents,
when staff opens evidence packet,
then missing evidence is clear and actionable.

Pass: yes/no

Notes:

---

## Test E — Audit Defense

Given a rollback calculation or notice action,
when staff opens TerraTrace,
then the action is visible in append-only audit history.

Pass: yes/no

Notes:

---
