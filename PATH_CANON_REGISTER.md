# TerraFusion Repository Path Canon Register

## Canonical Repositories

| Repository | Canonical local path | Remote | Default branch | Scope |
| --- | --- | --- | --- | --- |
| `bsvalues/terrafusion_os_1.0` | `C:\Users\bsval\terrafusion_os_1.0` | `github.com/bsvalues/terrafusion_os_1.0` | `main` | TerraFusion OS product and Brain governance |
| `bsvalues/terrafusion-os` | `C:\Users\bsval\terrafusion-os` | `github.com/bsvalues/terrafusion-os` | `main` | Sovereign Sync workbook tooling and contract estate |
| `bsvalues/terrafusion-atlas` | `C:\Users\bsval\terrafusion-atlas` | `github.com/bsvalues/terrafusion-atlas` | `main` | Standalone Atlas suite product source, contract compatibility, and evidence |

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
