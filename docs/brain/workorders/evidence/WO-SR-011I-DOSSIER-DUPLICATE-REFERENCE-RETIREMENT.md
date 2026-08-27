# WO-SR-011I Evidence - Dossier Duplicate Reference Retirement

## Discovery

Independent terminal review of Dossier suite PR #6 found that protected OS merge
`5680f1de637e9e39d702c4cf6f708edee7bd00f3` still serialized a sovereign
`EntersCustodyChain` classification from `DossierController.BentonDocumentData.DocumentTypes`.
The suite-owned mutation module separately owns and executes that classification, so the suite
terminal claim was premature even though all persistent register-document writes already consumed
the accepted suite result.

## Repair boundary

- Remove the duplicate boolean from the OS reference record, values, and response shape.
- Retain legitimate label, extension, and retention reference data.
- Retain `DossierDocument.EntersCustodyChain` persistence and assignment from
  `DossierMutationDocumentResult.EntersCustodyChain`.
- Add a serialization assertion proving the reference endpoint cannot reintroduce custody ownership.

## Protected completion

Pending exact reviewed head, protected checks, squash merge, protected-main tree equality, and the
successor Dossier suite terminal-record repair.
