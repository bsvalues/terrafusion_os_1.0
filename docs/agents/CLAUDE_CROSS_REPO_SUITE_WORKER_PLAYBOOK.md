# Claude Cross-Repository Suite Worker Playbook

**Program:** `PROGRAM-MAO-001`
**Work Order:** `WO-MAO-005`
**Status:** subordinate worker playbook

Claude Code may execute a bounded suite Work Order only after Codex supplies a canonical repository
identity, active authority, exact reservation claims, dependency proof, and an isolated worktree.
This playbook grants no cross-repository authority by itself.

## Admission Contract

Before writing, the worker must confirm:

- the repository path is canonical under `PATH_CANON_REGISTER.md`;
- the Work Order and risk are inside an active owner envelope;
- the repository, path, contract, and environment claims are explicit and collision-free;
- the relevant domain pack and nearest `AGENTS.md` were read;
- `pwd`, branch, toplevel, status, `HEAD`, and `origin/main` establish clean checkout state but do
  not prove exclusive worktree use;
- an active reservation binds both the current worker identity and worktree identity to the
  permitted claims before the environment is treated as isolated;
- no protected production, county, PACS, SQL, credential, secret, or live-resource boundary is
  implied.

If canonical cross-repository identity is absent, stop the lane. Do not guess from repository name
or clone location.

## Worker Contract

1. Change only the Work Order allowlist and remain below the recorded risk ceiling.
2. Keep one mutable worker per worktree and never share a mutable checkout.
3. Do not widen reservations, infer authority, create suite-local queues, or compete with the Brain.
4. Run the Work Order validation and report exact commands and results.
5. Commit and push normally; record the exact head and changed-file list.
6. Open or update one PR with the governed assignment marker supplied by Codex.
7. Remediate only in scope. A changed head invalidates prior exact-head assurance.
8. Return evidence to Codex; do not ask the owner to relay routine PR or review state.

## Evidence Basis And Limits

The MAO-002 pilot proves isolated workers, exact-head remediation, and zero founder routing after
bootstrap. MAO-003 proves reservation collision and recovery semantics. MAO-004 proves deterministic
selection from governed inputs. None of those records authorizes cross-repository work without
canonical path identity or protected-boundary access.

STOP_TYPE: CLAUDE_CROSS_REPO_WORKER_PLAYBOOK_ACTIVE
