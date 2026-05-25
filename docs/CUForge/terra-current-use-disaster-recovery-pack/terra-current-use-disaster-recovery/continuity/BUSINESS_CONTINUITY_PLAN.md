# Current Use Business Continuity Plan

## Objective

Maintain assessor operational continuity during outage or recovery.

## Minimum Continuity Path

The following must recover first:

```txt
classification lookup
rollback explanation
policy version lookup
trace audit lookup
notice history lookup
```

## Temporary Degraded Mode

Allowed:

- read-only review
- trace lookup
- notice lookup
- rollback history lookup

Disabled:

- new rollback writes
- notice issuance
- import commits
- policy changes

## Manual Fallback

If system unavailable:

- preserve spreadsheet exports
- preserve printed notice logs
- preserve trace export snapshot
- continue supervisor approval manually
