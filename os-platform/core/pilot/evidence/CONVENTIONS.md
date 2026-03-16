# Evidence Directory Conventions

## Frozen Release Artifacts (`docs/evidence/`)

Release evidence records the **verified release SHA** at the time of signoff.
These files are immutable once the release ships. Do not update historical SHAs.

## Rolling Post-R1 Checkpoints (`os-platform/core/pilot/evidence/post-r1-checkpoint.*.json`)

Post-R1 checkpoint artifacts describe the **maintenance commit that introduced the change**,
not necessarily the current HEAD. When an evidence artifact is added in a follow-up
bookkeeping commit, the filename SHA will be older than HEAD. This is intentional:

- `post-r1-checkpoint.527f7013.json` describes changes introduced by `527f7013`.
- The artifact itself was committed in `a1273361`, a subsequent evidence/governance commit.

This two-commit pattern (work commit → evidence commit) is expected and correct.
