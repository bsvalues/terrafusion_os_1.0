# Controlled Notice Issuance

## Purpose

Move from draft notice preview to controlled, human-approved issuance.

## States

```txt
DraftPreview
PendingApproval
ApprovedForIssuance
Issued
Voided
Superseded
```

## Required Gate

A notice cannot be issued unless it has status:

```txt
ApprovedForIssuance
```

## Dossier Handoff

Issued notices should link to a Dossier document ID.

## TerraTrace Events

Emit:

- pending approval created
- approved for issuance
- issued
- voided
- superseded/corrected

## Guardrail

Issued notices are not silently voided.

If an issued notice is wrong, create a superseding correction notice and preserve the original.
