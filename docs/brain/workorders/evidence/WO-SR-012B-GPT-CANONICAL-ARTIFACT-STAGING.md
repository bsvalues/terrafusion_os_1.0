# WO-SR-012B - GPT Canonical Artifact Staging Evidence

## Current verdict

`PASS_ON_142A105A0_PROTECTED_BASE_PENDING_PROTECTED_MERGE`

## Exact identities

| Surface | Identity |
| --- | --- |
| Integrated sovereign base | `142a105a0a9a1aef425a434b962c7d9e3326e50b` |
| GPT protected merge | `bsvalues/terrafusion-gpt@550b50f27af6f0911f16c973cbb6fc57a20eb15a` |
| Protected source ref | `refs/heads/main`; pinned merge must be reachable from fetched `origin/main` |
| Execution manifest | 1618 bytes; blob `7a9ca7bf114f34f2562102efa8817fd37506b614`; SHA-256 `6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b` |
| Module | 8578 bytes; blob `d81a8135caea1685ce02efd5acfdf1f9dfdd930a`; SHA-256 `cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb` |
| Frozen schema | 3555 bytes; blob `42fc40dcb2d459a4b81fbaab4f71b33433402fb5`; SHA-256 `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` |
| Suite source manifest | 4954 bytes; blob `fae097a93c2b7435de85e7643cdb15d4714ee9c8`; SHA-256 `b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1` |
| Published manifest | 1685 bytes; SHA-256 `f29c38f994edc434881e9d71de861e49c2ae300dcb0c1b3082fe206cf4a2ee75` |
| Contract anchor | `3b588b231098e7e4ce25056a4025e6f10ffbd0d6` |
| DTO SHA-256 | `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` |

## Observed proof

After integrating latest protected main `142a105a0a9a1aef425a434b962c7d9e3326e50b`,
the full Windows transaction proof completed again against a canonical mirror fetched from GitHub. It
proved protected-main ancestry and rejected a pinned but unreachable commit without slot mutation.
It separately tampered the module, schema, suite source manifest, suite execution manifest, numeric
manifest property, and singleton-array string property; all failed before publication. It proved
candidate/published inventory equality, machine-wide transaction-lock exclusion, verified nonempty whole-slot
backup contents and receipt hashes, backup-verification restoration, post-publication rollback,
originally-absent cleanup, and exact restoration of an existing empty directory.

```text
terminalCondition=GPT_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN
moduleLength=8578
moduleSha256=cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb
schemaLength=3555
schemaSha256=da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019
sourceManifestSha256=b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1
executionManifestSha256=6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b
publishedManifestSha256=f29c38f994edc434881e9d71de861e49c2ae300dcb0c1b3082fe206cf4a2ee75
protectedSourceBranch=main
runtimeAdopted=false
```

The offline proof parsed both PowerShell files, verified default `Disabled` selection, refused
Production while preserving a sentinel slot byte-for-byte, rejected a forged origin, refused a
cross-volume backup root and reparse-point build root, and rejected build-root/live-slot overlap.
It uses no private sibling-repository credentials.

This evidence claims inert staging only. It does not claim a runtime consumer, provider access,
persistent `LocalExact` selection, ownership retirement, persistence mutation, deployment,
production use, or county data.
