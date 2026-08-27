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

PR #1482 reviewed exact head `b173b8d16c434373064341e51c6a1b3b1f61dedc`, tree
`b9860d533d91fc0ac930bc0787d545b2151a4184`, and squash-merged as protected OS
main `65ddfe9948b02c0cd6089fc95c83e48885cc92ab` with exact tree equality. Zero
threads and all eight required contexts plus backend, security, seal, frontend, and package
first-party checks passed. The successor Dossier terminal repair merged as protected suite main
`4a109acef12804f89c894f8f139034bf975c0811`, tree
`eedad9c4e8b5c3f30d33f5e58a2856b896f7ae86`.
