# Current Use Disaster Recovery Architecture

## Recovery Priority

### Tier 1

- classifications
- rollback calculations
- policy packs
- trace events

### Tier 2

- notices
- evidence metadata
- workflow metadata

### Tier 3

- analytics
- imports
- dashboards

## Recovery Philosophy

The system must recover audit defensibility before operational convenience.

That means:

```txt
trace + policy + calculation integrity
```

before analytics or automation.
