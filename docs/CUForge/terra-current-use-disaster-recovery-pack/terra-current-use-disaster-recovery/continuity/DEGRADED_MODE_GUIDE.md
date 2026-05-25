# Current Use Degraded Mode Guide

## Trigger

Enter degraded mode when:

- database unavailable
- trace integrity uncertain
- policy resolver unavailable
- rollback persistence unavailable

## Allowed

- read-only parcel review
- read-only rollback review
- trace lookup
- evidence lookup

## Blocked

- rollback calculation commits
- notice issuance
- import commit
- policy activation

## UI Requirement

Display:

```txt
Current Use is operating in degraded read-only mode.
```
