# Validation Checklist (Spec Tests) — v1

## A) Completeness
- [ ] Every parcel capability assigned an owner (OS or a suite)
- [ ] Every data domain has a single write lane
- [ ] Every suite tab declares badges/actions via Workbench extension contract

## B) Conflicts
- [ ] No feature writes outside its lane
- [ ] No suite implements its own parcel timeline (must use TerraTrace)
- [ ] No Audit/Treasury/Clerk prefixes used in Assessor modules

## C) Enforceability
- [ ] Feature ownership is decidable in <5 seconds using write-lane matrix
- [ ] Every tool is mode-locked and risk-classified
- [ ] write_high/irreversible tools require confirmation + reason code

## D) Security / compliance
- [ ] countyId present on all writes + trace events
- [ ] Trace is append-only
- [ ] Redaction is additive (does not delete history)
- [ ] Retention categories exist and are county-configurable

## E) UX
- [ ] Global search → parcel → Property Workbench
- [ ] Context Ribbon consistent across tabs
- [ ] Work modes map to staff mental models (Valuation/Mapping/Admin/Case)

## F) Migration safety
- [ ] Old parcel routes redirect to canonical Workbench routes
- [ ] Bookmarks/deep links preserved
- [ ] Decommission only after this checklist passes
