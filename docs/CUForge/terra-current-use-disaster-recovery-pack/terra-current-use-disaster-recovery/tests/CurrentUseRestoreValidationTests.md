# Current Use Restore Validation Tests

## Test A — Rollback Snapshot Restore

- restore backup
- confirm calculation version present
- confirm policy version present
- confirm explanation ledger preserved

Pass/fail:

---

## Test B — Trace Chain Restore

- restore trace events
- verify hash chain
- append recovery event

Pass/fail:

---

## Test C — Notice Integrity

- restore issued notices
- confirm approval timestamps preserved
- confirm issuance timestamps preserved

Pass/fail:

---

## Test D — Read-only Degraded Mode

- disable writes
- verify read-only UI state
- verify blocked issuance

Pass/fail:
