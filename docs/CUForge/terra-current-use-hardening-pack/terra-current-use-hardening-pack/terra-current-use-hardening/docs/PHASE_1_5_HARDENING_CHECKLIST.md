# Terra Current Use — Phase 1.5 Hardening Checklist

## Goal

Move from internal-alpha scaffold to credible assessor demo without expanding the domain.

## Must Finish

### Frontend
- [ ] Current Use tab renders inside Property Workbench.
- [ ] Tab receives real `parcelId` from Workbench.
- [ ] Mock adapter can be switched to API adapter with one flag.
- [ ] Rollback calculation handles loading and error states.
- [ ] Calculation explanation is visible and readable.
- [ ] Notice Preview clearly says draft/human review required.

### Backend
- [ ] `AddTerraCurrentUse()` registered.
- [ ] Controller discovered by ASP.NET.
- [ ] Four API endpoints return 200 in local dev.
- [ ] Rollback POST accepts request payload.
- [ ] Audit sink called on rollback calculation.
- [ ] No persistence mutation yet unless explicitly added.

### Tests
- [ ] Frontend rollback tests pass.
- [ ] Backend rollback tests pass.
- [ ] Missing-year calculation does not crash.
- [ ] Penalty suppression behavior is covered.
- [ ] Statutory exception behavior is covered.

## Must Not Expand

- [ ] No GIS automation.
- [ ] No taxpayer portal.
- [ ] No AI approval/denial.
- [ ] No final notice issuance.
- [ ] No full workflow engine.
- [ ] No generalized rules engine.

## Demo Script

1. Open a parcel in Property Workbench.
2. Select Current Use.
3. Show classification status.
4. Show missing evidence.
5. Run rollback calculation.
6. Show four-year Farm & Ag rollback rule.
7. Show penalty suppression for voluntary withdrawal.
8. Show explanation ledger.
9. Show draft notice placeholder.
10. Explain that final notice issuance remains human-controlled.
