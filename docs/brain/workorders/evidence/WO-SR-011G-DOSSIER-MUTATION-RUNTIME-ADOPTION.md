# WO-SR-011G Evidence - Dossier Mutation Runtime Adoption

## Current verdict

`DOSSIER_MUTATION_LOCAL_EXACT_SIX_OPERATION_RUNTIME_ADOPTED_AND_ROLLBACK_PROVEN`

## Pinned identity

- OS base: `807a46aad94e5bc8a36d7974130d482e49a73d2b`
- Dossier protected source: `2c709fe2286b5c1e6bde43fcbc2a35111a456092`
- module: `b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277` / 18,366 bytes
- schema: `48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3` / 18,611 bytes
- published manifest: `425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716` / 1,493 bytes

## Observed proof

- Exact staging receipt in the dedicated runtime worktree verified protected Dossier main and the
  three-file ignored slot at the identities above.
- `tests/dossier-mutation-staging-identity.ps1` returned
  `DOSSIER_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN`: candidate-manifest tamper rejected before
  publication, fresh failure removed the slot, backup-verification and post-publication failures
  restored it, nonempty backup contents and hashes matched, physical rollback executed, and the
  adopted slot was restored. County/protected data, Production, and deployment were false.
- Direct execution from the exact staged module validated the frozen schema and byte-equivalent
  accepted result for all six synthetic operations, ending
  `DOSSIER_LOCAL_EXACT_SIX_OPERATION_PROOF`.
- PR #1481 first compile head exposed three exact C# errors; the repaired exact reviewed head was
  `b517a8e01acd37fdc91244caeb988d980c4e73ec`, tree
  `0ecb43c8c7eb7467dda2ffcbdb45406b60ec26d5`. It squash-merged as protected OS
  main `5680f1de637e9e39d702c4cf6f708edee7bd00f3` with the same tree. Required
  first-party checks, two resolved threads, exact-head assurance, and protected-main verification
  passed.
