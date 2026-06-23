# Security and Standalone Boundaries

## Standalone allowed

Standalone Canon may:

- Open a local TerraFusion repository.
- Search and read source files.
- Modify approved source files in an isolated task worktree.
- Run approved local commands.
- Run gates.
- Show diffs.
- Stage/commit/push after approval.
- Prepare PRs.
- Generate engineering evidence bundles.

## Standalone prohibited

Standalone Canon must not:

- Directly mutate production county records.
- Change valuations, exemptions, appeals, notices, parcel identity, ownership records, or evidence chains.
- Act as a runtime TerraPilot replacement.
- Emit fake OS-runtime TerraTrace events.
- Bypass write-lanes.
- Bypass human approval for high-risk actions.
- Use production secrets outside the OS-governed execution path.

## Connector trust tiers

```txt
Tier 0: local repo read
Tier 1: local repo write in approved worktree
Tier 2: Git operations
Tier 3: CI/GitHub metadata
Tier 4: non-production OS service read
Tier 5: production runtime read, approval required
Tier 6: production runtime write, prohibited from standalone
```

## Secret policy

- Never include secrets in evidence bundles.
- Redact tokens, keys, credentials, PII, connection strings, and production URLs.
- Treat terminal output as untrusted until scanned.

## Human-in-the-loop policy

Manual approval is required for:

- high/critical risk files
- shell routing/window manager changes
- authentication/security changes
- migrations
- trace/governance changes
- Git push/PR creation
- any external connector above Tier 2
