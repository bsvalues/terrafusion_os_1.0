# TerraFusion Repository Path Canon Register

## Canonical Repositories

| Repository | Canonical local path | Remote | Default branch | Scope |
| --- | --- | --- | --- | --- |
| `bsvalues/terrafusion_os_1.0` | `C:\Users\bsval\terrafusion_os_1.0` | `github.com/bsvalues/terrafusion_os_1.0` | `main` | TerraFusion OS product and Brain governance |
| `bsvalues/terrafusion-os` | `C:\Users\bsval\terrafusion-os` | `github.com/bsvalues/terrafusion-os` | `main` | Sovereign Sync workbook tooling and contract estate |
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

On 2026-07-17, `C:\Users\bsval\terrafusion-os` resolved to remote
`https://github.com/bsvalues/terrafusion-os.git`, default branch `main`, at `origin/main`
`d9fa661e1c19f9d8eac93094a76ed68f6c0de9f6`. That head already contains WO-SYNC-132 through
WO-SYNC-155, including the program closeout.

On 2026-07-21, `C:\Users\bsval\terrafusion-atlas` resolved to remote
`https://github.com/bsvalues/terrafusion-atlas.git`, default branch `main`, at `origin/main`
`a1669e09636743ac18c2525db69e20346a0f408b`. Cross-repository Atlas workers must branch from an
isolated worktree attached to this canonical repository; the shared checkout is a read-only
synchronization surface.

On 2026-07-21, `D:\terrafusion-dais` resolved to remote
`git@github.com:bsvalues/terrafusion-dais.git`, default branch `main`, at `origin/main`
`1404db1947587d4f8c868092798c4d71c23bb62d`. GitHub reports the repository as private. Cross-repository
Dais workers must branch from an isolated worktree attached to this canonical repository; the shared
checkout is a read-only synchronization surface.

On 2026-07-25, `D:\terrafusion-gpt` resolved to remote
`git@github.com:bsvalues/terrafusion-gpt.git`, default branch `main`, at `origin/main`
`10295e9b534cce7ba9d428a91fb966bd58963c77`. GitHub reports the repository as private. Cross-repository
GPT workers must branch from an isolated worktree attached to this canonical repository; the shared
checkout is a read-only synchronization surface.

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
