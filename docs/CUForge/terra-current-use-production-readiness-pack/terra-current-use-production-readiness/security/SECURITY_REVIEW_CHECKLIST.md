# Current Use Security Review Checklist

## RBAC

- [ ] Viewer cannot mutate records.
- [ ] Appraiser cannot issue notices.
- [ ] Supervisor can approve/issue notices.
- [ ] Treasurer can update payment status only.
- [ ] Admin can manage policy.
- [ ] Auditor can view trace.

## Sensitive Actions

Must require permission:

- [ ] lock rollback calculation
- [ ] approve notice
- [ ] issue notice
- [ ] void notice
- [ ] manage policy pack
- [ ] commit import
- [ ] mark payment paid

## Audit

- [ ] sensitive actions emit trace.
- [ ] denied actions are logged.
- [ ] support can retrieve correlation IDs.

## AI Safety

- [ ] AI assist disabled or explain-only.
- [ ] AI cannot approve, deny, waive, issue, or finalize.
