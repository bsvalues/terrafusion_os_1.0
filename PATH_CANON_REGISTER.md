# TerraFusion Repository Path Canon Register

## Canonical Repositories

| Repository | Canonical local path | Remote | Default branch | Scope |
| --- | --- | --- | --- | --- |
| `bsvalues/terrafusion_os_1.0` | `C:\Users\bsval\terrafusion_os_1.0` | `github.com/bsvalues/terrafusion_os_1.0` | `main` | TerraFusion OS product and Brain governance |
| `bsvalues/terrafusion-os` | `C:\Users\bsval\terrafusion-os` | `github.com/bsvalues/terrafusion-os` | `main` | Sovereign Sync workbook tooling and contract estate |
| `bsvalues/terrafusion-forge` | `D:\terrafusion-forge` | `git@github.com:bsvalues/terrafusion-forge.git` | `main` | Standalone Forge suite product source, valuation-kernel parity, and evidence |
| `bsvalues/terrafusion-atlas` | `C:\Users\bsval\terrafusion-atlas` | `github.com/bsvalues/terrafusion-atlas` | `main` | Standalone Atlas suite product source, contract compatibility, and evidence |
| `bsvalues/terrafusion-dais` | `D:\terrafusion-dais` | `github.com/bsvalues/terrafusion-dais` | `main` | Standalone Dais suite bootstrap, future product source, contract compatibility, and evidence |
| `bsvalues/terrafusion-dossier` | `D:\terrafusion-dossier` | `github.com/bsvalues/terrafusion-dossier` | `main` | Standalone Dossier suite bootstrap, future product source, contract compatibility, and evidence |
| `bsvalues/terrafusion-gpt` | `D:\terrafusion-gpt` | `github.com/bsvalues/terrafusion-gpt` | `main` | Standalone GPT suite bootstrap, future product source, contract compatibility, and evidence |

## Routing Rule

Repository name alone is insufficient. Cross-repository dispatch must match the repository, local
path, remote, and default branch above, then reverify the live remote and head before work begins.
The shared checkouts remain read-only synchronization surfaces; workers still require isolated
worktrees in the target repository.

## Current Verification

On 2026-07-29, `D:\terrafusion-forge` resolved to remote
`git@github.com:bsvalues/terrafusion-forge.git`, default branch `main`, at `HEAD = origin/main =
`b36c2e130fb3fe9b34d7e67c8880f5b6d25b3084`. Forge PR #2 at head
`468b21714abea071bef82eb05b4febbda7e9ff82` merged as
`24059c3642339f36877cb454ca63683180915b71`. Its merged-main workflow run
`30365590537` is retained as historical CI evidence only; it is not the sovereign transfer or trust
path. The local shadow proof built the exact Forge commit in an isolated worktree and transferred the
hash-pinned executable through a disposable local directory. The shared checkout remains a read-only
synchronization surface, and cross-repository Forge workers must use isolated worktrees.
Forge PR #3 at exact head `ae552a14a2741ff5c513775a31f3f8b7a7cc4c99` accepted the
documentation-only readiness interlock. Sovereign PR #1386 at exact reviewed head
`a7168fe9a7a48150e05a7e2beb05d8984e5e238f` merged as
`827bb60515403a96417bdea6ec7f6ecc3ca08926`, completing the local manifest-bound runtime cutover
and retiring the duplicate sovereign valuation source. Forge PR #4 at exact head
`cef9842d3cabbf6aa2cd687a8bc084239b5d0b81` merged as the current Forge head and finalized Forge
canonical source ownership for valuation commit `24059c3642339f36877cb454ca63683180915b71`.
The sovereign OS remains the runtime consumer and integration owner.

On 2026-07-17, `C:\Users\bsval\terrafusion-os` resolved to remote
`https://github.com/bsvalues/terrafusion-os.git`, default branch `main`, at `origin/main`
`d9fa661e1c19f9d8eac93094a76ed68f6c0de9f6`. That head already contains WO-SYNC-132 through
WO-SYNC-155, including the program closeout.

On 2026-07-21, `C:\Users\bsval\terrafusion-atlas` resolved to remote
`https://github.com/bsvalues/terrafusion-atlas.git`, default branch `main`, at `origin/main`
`a1669e09636743ac18c2525db69e20346a0f408b`. Cross-repository Atlas workers must branch from an
isolated worktree attached to this canonical repository; the shared checkout is a read-only
synchronization surface.

On 2026-07-27, `D:\terrafusion-dais` resolved to remote
`git@github.com:bsvalues/terrafusion-dais.git`, default branch `main`, at `origin/main`
`29a34b0feeab32984a4dedf1af853239993b4a26`. GitHub reports the repository as private.
Cross-repository Dais workers must branch from an isolated worktree attached to this canonical
repository; the shared checkout is a read-only synchronization surface. Dais PR #3 at head
`be1a7676fc79f13d7cd3a3516cafa0ad7f3d624f` merged as
`4ed92e35d3debc4a43b127087703a1e2bc731203` and is recorded as historically unratified. Corrective
Dais PR #4 at head `93ee267f3258e8989a5acf27fc40c5bb0d24f695` merged as
`29a34b0feeab32984a4dedf1af853239993b4a26`, which is the current Dais `origin/main`. The final
capability classification is `RETAINED_PURE_UNWIRED_F1`; no runtime, provider, persistence,
publication, deployment, or protected-resource authority follows from the retained module.

On 2026-07-27, `D:\terrafusion-gpt` resolved to remote
`git@github.com:bsvalues/terrafusion-gpt.git`, default branch `main`, at `origin/main`
`e0856e46807844a95d57aaef49d3350c1bc38a33`. GitHub reports the repository as private.
Cross-repository GPT workers must branch from an isolated worktree attached to this canonical
repository; the shared checkout is a read-only synchronization surface. GPT PR #3 at head
`31eba7e9426f86739d31cece6c0e981bd448d7d2` merged as
`614f62933e6f8cdb4fa8a76eac6305c0e3134070` and is recorded as historically unratified. Corrective
GPT PR #4 at head `d2f34ce75549bb606539d44bb114d0d5aed4fa1e` merged as
`e0856e46807844a95d57aaef49d3350c1bc38a33`, which is the current GPT `origin/main`. The final
capability classification is `RETAINED_PURE_UNWIRED_F1`; no runtime, provider, model, embedding,
persistence, publication, deployment, or protected-resource authority follows from the retained module.

On 2026-07-26, `D:\terrafusion-dossier` resolved to remote
`git@github.com:bsvalues/terrafusion-dossier.git`, default branch `main`, at `origin/main`
`7558cfebfeea0c7b536251769b1d779c4558a763`. GitHub reports the repository as private.
Cross-repository Dossier workers must branch from an isolated worktree attached to this canonical
repository; the shared checkout is a read-only synchronization surface. Dossier PR #2 at head
`2a3b3f9e228b4fad1c20d3a9619d16eb9724aca3` merged as
`ccdc227812264ec52f4ec506de49693ac91d0a9d` and is recorded as historically unratified. Corrective
Dossier PR #3 at head `a185278fa1171927951e47dbdd3cb27275b21eef` merged as
`7558cfebfeea0c7b536251769b1d779c4558a763`, which is the current Dossier `origin/main`. The final
capability classification is `RETAINED_PURE_UNWIRED_F1`; no runtime, custody, persistence, provider,
deployment, or protected-resource authority follows from the retained module.
