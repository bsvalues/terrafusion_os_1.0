# WO-SR-010G - Dais Appeal Mutation Runtime Adoption Evidence

## Current verdict

`LOCAL_TERMINAL_PROOF_PASS_PROTECTED_ASSURANCE_PENDING`

The terminal local proof passed at sovereign feature head
`f3f8f675573b21203aad7bbf6a7abc9cd2651806`, which contains protected sovereign dependency
`6291e58b11626ad04bdc89e736be89b2a574261c` and exact Dais source
`8a9cfc608bcda835126db2054bb7ba7ecf185275`.

## Observed outcome

- 61 of 61 focused mutation/runtime/service/controller tests passed with zero failures or skips;
- both two-context SQLite lifecycle tests passed, including the stale-snapshot concurrency conflict;
- fresh persistent Development selection and restart executed the exact staged process port;
- the authentic 24-field manifest, module, and schema identities verified before execution;
- manifest/module/schema tamper failed before any appeal save;
- the exact controller lifecycle created, transitioned, persisted, and read the appeal through the
  separate governed Dais workflow consumer;
- disabled selection and Production selection failed closed;
- the prior Disabled slot was physically restored and hash-verified during rollback;
- the adopted exact mutation slot was then restored and hash-verified;
- the recovery self-test restored receipt-loss custody from an independent pre-stage anchor, refused
  corrupt custody before changing the live slot, distinguished original absence from an existing
  empty directory, and proved both recovery actions run even when both fail;
- independent first-party review reported no remaining actionable finding;
- no county/protected data, production, deployment, Azure, PACS/SQL, secret, schema, migration,
  topology, or unrelated CI/release work occurred.

## Durable evidence

- tracked receipt: `docs/brain/workorders/evidence/WO-SR-010G-runtime-adoption-receipt.json`;
- local receipt SHA-256: `52845b55abd126ed9877ac2683a97812ad6089ab06b4a9cfeb4d2b9f18dfe512`;
- rollback sentinel SHA-256: `44d57d55fe7a6c433cf28b10bb63da7ab400703909f62d601e1c9ee5907d60a1`;
- terminal condition:
  `DAIS_APPEAL_MUTATION_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_DUPLICATE_JUDGMENT_RETIRED`.

## Commands

```powershell
pwsh -NoProfile -File scripts/validation/Invoke-DaisAppealMutationRuntimeAdoptionRollbackProof.ps1 -RecoverySelfTest
pwsh -NoProfile -File scripts/validation/Invoke-DaisAppealMutationRuntimeAdoptionRollbackProof.ps1 -DaisRepository https://github.com/bsvalues/terrafusion-dais -DotNetExecutable <dotnet> -NuGetPackagesPath <packages>
git diff --check
```
